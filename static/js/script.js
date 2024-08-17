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

    chatIcon.addEventListener('click', toggleChat);
    closeChat.addEventListener('click', toggleChat);

    function toggleChat() {
        chatbot.classList.toggle('active');
    }

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

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

    function addMessageToChat(sender, message, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${className}`;
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Image upload and prediction
    const imageUpload = document.getElementById('image-upload');
    const uploadArea = imageUpload.parentElement;
    const predictButton = document.getElementById('predict-button');
    const resultImage = document.getElementById('result-image');
    const detectionResults = document.getElementById('detection-results');
    const confidenceThreshold = document.getElementById('confidence-threshold');
    const iouThreshold = document.getElementById('iou-threshold');

    uploadArea.addEventListener('click', () => imageUpload.click());

    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'w-full h-auto rounded-lg';
                uploadArea.innerHTML = '';
                uploadArea.appendChild(img);
            }
            reader.readAsDataURL(file);
        }
    });

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
        formData.append('conf', confidenceThreshold.value);
        formData.append('iou', iouThreshold.value);

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
                resultImage.src = data.image;
                resultImage.classList.remove('hidden');

                detectionResults.innerHTML = `
                    <h3 class="text-lg font-semibold mb-2">Detected Bovines:</h3>
                    <ul>
                        ${data.objects.map(obj => `<li>${obj.class} (Confidence: ${(obj.confidence * 100).toFixed(2)}%)</li>`).join('')}
                    </ul>
                `;
                detectionResults.classList.remove('hidden');
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('No objects detected or invalid response from server');
            }
        } catch (error) {
            console.error('Error in detection:', error);
            detectionResults.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
            detectionResults.classList.remove('hidden');
        } finally {
            predictButton.textContent = 'Predict';
            predictButton.disabled = false;
        }
    });
});