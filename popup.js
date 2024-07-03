document.addEventListener('DOMContentLoaded', function() {
    // Event listener to handle button click
    var sendUrlButton = document.getElementById('sendUrlButton');
    var loadingModal = document.getElementById('loadingModal');
    
    if (sendUrlButton) {
        sendUrlButton.addEventListener('click', sendUrlContentToBackend);
    } else {
        console.error('Element with id "sendUrlButton" not found.');
    }

    // Function to send current tab content to backend server
    function sendUrlContentToBackend() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var currentTab = tabs[0];
            var currentTabUrl = currentTab.url;

            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                func: extractTextFromPage,
                args: []
            }, function(results) {
                var content = results[0].result;

                var requestData = {
                    url: currentTabUrl,
                    html_content: content.html,
                    js_content: content.js
                };
                // Display loading indicator
                loadingModal.style.display = 'block';
                console.log('Sending data to server:', requestData);
                // Send data to server using fetch API
                fetch('http://localhost:5000/generate_summary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Response from server:', data);
                    var outputDiv = document.getElementById('output');
                    outputDiv.innerHTML = formatResponseText(data.ai_response);
                    document.getElementById("sendUrlButton").textContent = "ReGenerate";
                    document.getElementById('copyButton').disabled = false;
                    document.body.classList.add('top');
                })
                .catch(error => {
                    console.error('Error sending URL content to server:', error);
                })
                .finally(() => {
                    // Hide loading indicator
                    loadingModal.style.display = 'none';
                });
            });
        });
    }

    function extractTextFromPage() {
        function extractText(node) {
            let text = '';
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent.trim() + ' ';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'P' || node.tagName === 'SPAN' || node.tagName.match(/^H[1-6]$/)) {
                    text += node.textContent.trim() + ' ';
                }
            }
            return text;
        }

        var htmlContent = '';
        var nodes = document.body.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
        nodes.forEach(node => {
            htmlContent += extractText(node);
        });

        var scriptContent = Array.from(document.getElementsByTagName('script')).map(s => extractText(s)).join(' ');

        return { html: htmlContent, js: scriptContent };
    }

    // Function to format response text
    function formatResponseText(text) {
        text = text.replace(/\*\*(.*?)\*\*/g, '<br><b>$1</b>');
        text = text.replace(/\*/g, '');
        text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        return text;
    }

    // Event listener for signin link
    var signinLink = document.getElementById('signinLink');
    if (signinLink) {
        signinLink.addEventListener('click', function(event) {
            event.preventDefault();
            document.getElementById('signinModal').style.display = 'block';
        });
    }

    // Function to close the signin modal
    function closeSigninModal() {
        document.getElementById('signinModal').style.display = 'none';
    }
});
