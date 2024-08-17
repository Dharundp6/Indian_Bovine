document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Set initial theme based on user preference
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
    }

    // Theme toggle event listener
    themeToggleBtn.addEventListener('click', function() {
        // Toggle icons
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        // Toggle theme
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Chatbot functionality
    const chatIcon = document.getElementById('chat-icon');
    const chatbot = document.getElementById('chatbot');
    const closeChat = document.getElementById('close-chat');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

     // Hide chatbot initially
     chatbot.style.display = 'none';

    // Toggle chat visibility
    function toggleChat() {
        if (chatbot.style.display === 'none' || chatbot.style.display === '') {
            chatbot.style.display = 'block';
            chatIcon.style.display = 'none';
        } else {
            chatbot.style.display = 'none';
            chatIcon.style.display = 'flex';
        }
    }

    chatIcon.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);

    // Send message function for chatbot
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message !== '') {
            addMessageToChat('User', message, 'user-message');
            userInput.value = '';
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: message })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Chatbot response:', data); // Log the full response for debugging
                
                if (data.response) {
                    addMessageToChat('AI', data.response, 'bot-message');
                } else if (data.error) {
                    throw new Error(data.error);
                } else {
                    throw new Error('Invalid response from server');
                }
            } catch (error) {
                console.error('Error in chat:', error);
                addMessageToChat('AI', `Error: ${error.message}`, 'bot-message error');
            }
        }
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function addMessageToChat(sender, message, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${className}`;
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Image upload and prediction functionality
    const imageUpload = document.getElementById('image-upload');
    const uploadArea = document.getElementById('upload-area');
    const predictButton = document.getElementById('predict-button');
    const resultImage = document.getElementById('result-image');
    const detectionResults = document.getElementById('detection-results');
    const predictionResults = document.getElementById('prediction-results');

    // Trigger file input when upload area is clicked
    uploadArea.addEventListener('click', () => imageUpload.click());

    // Handle file selection
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Display file name instead of image preview
            uploadArea.innerHTML = `
                <p class="text-center">Selected file: ${file.name}</p>
                <p class="text-center text-sm text-gray-500">(Click to change)</p>
            `;
            predictButton.disabled = false;
        }
    });

    // Handle prediction button click
    predictButton.addEventListener('click', async () => {
        const file = imageUpload.files[0];
        if (!file) {
            alert('Please upload an image first.');
            return;
        }

        predictButton.textContent = 'Processing...';
        predictButton.disabled = true;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/detect', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Detection response:', data); // Log the full response for debugging
            
            if (data.image && data.objects && data.objects.length > 0) {
                console.log('Image data type:', typeof data.image);
                console.log('Image data length:', data.image.length);

                // Check if the image data is a base64 string
                if (typeof data.image === 'string' && data.image.startsWith('data:image')) {
                    resultImage.src = data.image;
                } else if (typeof data.image === 'string') {
                    resultImage.src = `data:image/jpeg;base64,${data.image}`;
                } else {
                    throw new Error('Invalid image data format');
                }

                resultImage.onload = () => {
                    console.log('Image loaded successfully');
                    resultImage.style.display = 'block';
                };
                resultImage.onerror = (e) => {
                    console.error('Error loading image:', e);
                    throw new Error('Failed to load image');
                };

                // Display detection results
                detectionResults.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2">Detected Bovines:</h3>
                    <ul class="list-disc pl-5">
                        ${data.objects.map(obj => `<li>${obj.class} (Confidence: ${(obj.confidence * 100).toFixed(2)}%)</li>`).join('')}
                    </ul>
                `;
                predictionResults.style.display = 'block'; // Show the results container
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('No objects detected or invalid response from server');
            }
        } catch (error) {
            console.error('Error in detection:', error);
            detectionResults.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
            predictionResults.style.display = 'block'; // Show the results container even if there's an error
        } finally {
            predictButton.textContent = 'Predict';
            predictButton.disabled = false;
        }
    });

    // Function to check if the image exists in the DOM
    function checkImageInDOM() {
        const img = document.getElementById('result-image');
        if (img) {
            console.log('Image element exists in DOM');
            console.log('Image src:', img.src.substring(0, 100) + '...');
            console.log('Image display style:', img.style.display);
        } else {
            console.error('Image element does not exist in DOM');
        }
    }

    // Call this function after a short delay to ensure DOM has updated
    setTimeout(checkImageInDOM, 1000);
});