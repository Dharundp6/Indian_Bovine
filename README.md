# Indian Bovine Classification Project

## Overview

This project is an advanced Indian Bovine Classification system that utilizes deep learning for image classification and a chatbot for interactive information retrieval. It's designed to identify different breeds of Indian bovines from uploaded images and provide detailed information about these breeds through an AI-powered chatbot.

## Features

- **Image Classification**: Utilizes a custom YOLO model to detect and classify Indian bovine breeds in uploaded images.
- **Interactive Chatbot**: Provides information about Indian bovine breeds using a RAG (Retrieval-Augmented Generation) system.
- **User-Friendly Interface**: A clean, responsive web interface with dark/light mode toggle.
- **Real-time Processing**: Instant feedback on image uploads and chatbot interactions.

## Technologies Used

- **Backend**: FastAPI, Python
- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Machine Learning**: YOLO (You Only Look Once), LangChain
- **Database**: FAISS for efficient similarity search
- **Other**: Groq API for language model

## Setup and Installation

1. **Clone the Repository**
   ```
   git clone https://github.com/your-username/indian-bovine-classification.git
   cd indian-bovine-classification
   ```

2. **Set Up Virtual Environment**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Dependencies**
   ```
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory and add:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. **Run the Application**
   ```
   uvicorn main:app --reload
   ```

6. Open your browser and navigate to `http://localhost:8000`

## Usage

1. **Image Classification**
   - Upload an image of an Indian bovine.
   - Click the "Predict" button.
   - View the classification results and confidence scores.

2. **Chatbot Interaction**
   - Click on the chat icon in the bottom right corner.
   - Type your question about Indian bovine breeds.
   - Receive AI-generated responses based on the loaded information.

## Project Structure

- `main.py`: FastAPI application and main backend logic
- `static/`: Contains CSS and JavaScript files
- `templates/`: HTML templates
- `models/`: Contains the YOLO model file (`version4.pt`)
- `Document.pdf`: Source document for chatbot information

## Contributing

Contributions to improve the project are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Make your changes and commit (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Create a new Pull Request

## License

[MIT License](LICENSE)

## Contact

dharunjagan009@gmail.com

---

Developed with ❤️ by Dharun & Harish 
