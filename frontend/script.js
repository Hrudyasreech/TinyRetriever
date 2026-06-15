// Dom Selectors - File Pipeline
console.log("Loading file pipeline...");
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const fileList = document.getElementById('file-list');
const fileListContainer = document.getElementById('file-list-container');
const processBtn = document.getElementById('process-btn');
const indexedList = document.getElementById('indexed-list');

// Dom Selectors - Chat Interaction Workspace
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusIndicator = document.getElementById('status-indicator');

let selectedFiles = [];

/* --- Document Management Logic --- */

browseBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    fileInput.click();
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
    });
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

function handleFiles(files) {
    for (let file of files) {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    }
    updateUI();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateUI();
}

function updateUI() {
    fileList.innerHTML = '';
    
    if (selectedFiles.length > 0) {
        fileListContainer.style.display = 'flex';
        processBtn.disabled = false;
        
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.classList.add('file-item');
            
            const fileInfo = document.createElement('span');
            fileInfo.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            
            const removeBtn = document.createElement('span');
            removeBtn.classList.add('remove-file');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(index);
            });
            
            li.appendChild(fileInfo);
            li.appendChild(removeBtn);
            fileList.appendChild(li);
        });
    } else {
        fileListContainer.style.display = 'none';
        processBtn.disabled = true;
    }
}

function setToIndexedState() {
    if (statusIndicator) {
        statusIndicator.innerText = "● Documents Indexed";
        statusIndicator.style.color = "#22c55e"; // Updated to coordinate with style.css green (.connected)
    }
}

// OPTIMIZED: Batch Pipeline multi-file processing engine
// OPTIMIZED: Silent batch processing engine (No more broken popups!)
processBtn.addEventListener('click', async (event) => {
    if (event) event.preventDefault();
    if (selectedFiles.length === 0) return;

    processBtn.disabled = true;
    let uploadSuccess = true;

    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            processBtn.style.backgroundColor = "#e67e22"; // Turn button orange during processing
            processBtn.innerText = `Indexing (${i + 1}/${selectedFiles.length})...`;
            
            const formData = new FormData();
            formData.append("file", selectedFiles[i]);

            const response = await fetch("http://127.0.0.1:8000/upload/", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                uploadSuccess = false;
                console.error(`❌ Failed uploading file: ${selectedFiles[i].name}`);
            }
        }

        // Handle the final UI change smoothly without interrupting the user
        if (uploadSuccess) {
            processBtn.style.backgroundColor = "#22c55e"; // Turn green on success
            processBtn.innerText = "✓ Success";
            setToIndexedState();
            await loadDocuments(); 
            
            selectedFiles = [];
            updateUI();
        } else {
            processBtn.style.backgroundColor = "#ef4444"; // Turn red on partial failure
            processBtn.innerText = "⚠ Indexing Partial Failure";
        }

    } catch(error) {
        // Log the actual structural technical glitch silently in dev-tools instead of popping up
        console.error("Pipeline network context anomaly caught:", error);
        processBtn.style.backgroundColor = "#ef4444";
        processBtn.innerText = "⚠ Connection Error";
    } finally {
        // Reset the button back to normal operational state after a brief visual delay
        setTimeout(() => {
            processBtn.disabled = selectedFiles.length === 0;
            processBtn.style.backgroundColor = ""; // Resets to style.css defaults
            processBtn.innerText = "Process Documents";
        }, 2500);
    }
});

/* --- Chat Workspace Logic --- */

function typeMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    chatWindow.appendChild(msgDiv);
    
    let index = 0;
    const speed = 10; // Slightly optimized delay for a punchier user experience
    
    sendBtn.disabled = true;
    userInput.disabled = true;

    function type() {
        if (index < text.length) {
            msgDiv.innerText += text.charAt(index);
            index++;
            chatWindow.scrollTop = chatWindow.scrollHeight;
            setTimeout(type, speed);
        } else {
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }
    type();
}

function appendUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'user-message');
    msgDiv.innerText = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function handleSend() {
    const query = userInput.value.trim();
    if (!query || sendBtn.disabled) return;

    appendUserMessage(query);
    userInput.value = '';

    try {
        const response = await fetch("http://127.0.0.1:8000/ask/", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: query })
        });

        if (response.ok) {
            const data = await response.json();
            const sourceDoc = (data.sources && data.sources.length > 0) ? `\n\nSource: ${data.sources.join(', ')}` : "";
            const fullAnswerText = `${data.answer}${sourceDoc}`;
            
            typeMessage(fullAnswerText, 'bot-message');
        } else {
            typeMessage(`Error: Server responded with status code ${response.status}`, 'system-message');
        }
    } catch (error) {
        console.error("Query Error Context:", error);
        typeMessage("Error connecting to RAG backend pipeline. Ensure server is online.", 'system-message');
    }
}

// OPTIMIZED: Clean styling architecture mapping cleanly to our Light-Mode layout
async function loadDocuments() {
    if (!indexedList) return;

    try {
        const response = await fetch("http://127.0.0.1:8000/documents");
        if (response.ok) {
            const documents = await response.json(); 
            indexedList.innerHTML = ''; 

            if (documents.length === 0) {
                indexedList.innerHTML = '<li class="empty-loading-msg">No indexed sources found.</li>';
                return;
            }

            setToIndexedState();

            documents.forEach(doc => {
                const li = document.createElement('li');
                li.className = 'indexed-item'; // Matches our newly optimized CSS perfectly
                
                const label = document.createElement('span');
                label.textContent = doc.filename;
                
                li.appendChild(label);
                indexedList.appendChild(li);
            });
        }
    } catch (e) {
        console.warn("Could not check background database cache document listings:", e);
        indexedList.innerHTML = '<li class="empty-loading-msg" style="color: #ef4444;">Failed to sync with store.</li>';
    }
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

document.addEventListener("DOMContentLoaded", () => {
    loadDocuments(); 
});