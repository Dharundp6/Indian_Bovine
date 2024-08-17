import io
import base64
import os
import logging
import traceback
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from PIL import Image
from ultralytics import YOLO
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
# Configure logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
groq_api_key = os.getenv('GROQ_API_KEY')

# Initialize object detection model
try:
    model = YOLO("version4.pt")
    model.to('cpu')  # Force CPU usage
except Exception as e:
    logger.error(f"Failed to load YOLO model: {str(e)}")
    raise

# Set default confidence and IoU thresholds
CONF_THRESHOLD = 0.25
IOU_THRESHOLD = 0.45

# Initialize chatbot components
try:
    llm = ChatGroq(groq_api_key=groq_api_key, model_name="Llama3-8b-8192")
    prompt = ChatPromptTemplate.from_template(
        """Answer the questions based on the provided context only. Please provide the most accurate response based on the question <context> {context} </context> Questions:{input}"""
    )
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    loader = PyPDFLoader("app/breed2.pdf")
    docs = loader.load()
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    final_documents = text_splitter.split_documents(docs)
    doc_texts = [doc.page_content for doc in final_documents]
    embeddings_result = embeddings.embed_documents(doc_texts)
    vectors = FAISS.from_documents(final_documents, embeddings)

    document_chain = create_stuff_documents_chain(llm, prompt)
    retriever = vectors.as_retriever()
    retrieval_chain = create_retrieval_chain(retriever, document_chain)
except Exception as e:
    logger.error(f"Failed to initialize chatbot components: {str(e)}")
    raise

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    try:
        return templates.TemplateResponse("index.html", {"request": request})
    except Exception as e:
        error_msg = f"Error loading template: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)  # This will print to the console/logs
        return JSONResponse(content={'error': error_msg}, status_code=500)

@app.post("/detect")
async def detect_objects(
    image: UploadFile = File(...),
    conf: float = Form(CONF_THRESHOLD),
    iou: float = Form(IOU_THRESHOLD)
):
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        
        results = model.predict(source=img, conf=conf, iou=iou, show_labels=True, show_conf=True, imgsz=640, device='cpu')
        
        detected_objects = []
        for r in results:
            im_array = r.plot()
            im = Image.fromarray(im_array[..., ::-1])
            
            for box in r.boxes:
                obj = {
                    "class": model.names[int(box.cls)],
                    "confidence": float(box.conf),
                    "bbox": box.xyxy[0].tolist()
                }
                detected_objects.append(obj)
        
        buffered = io.BytesIO()
        im.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return JSONResponse(content={
            'image': f'data:image/png;base64,{img_str}',
            'objects': detected_objects
        })
    except Exception as e:
        logger.error(f"Error in object detection: {str(e)}\n{traceback.format_exc()}")
        return JSONResponse(content={'error': str(e)}, status_code=500)

class ChatMessage(BaseModel):
    message: str

@app.post("/chat")
async def chat(message: ChatMessage):
    try:
        response = await retrieval_chain.ainvoke({'input': message.message})
        return JSONResponse(content={'response': response['answer']})
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}\n{traceback.format_exc()}")
        return JSONResponse(content={'error': str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)