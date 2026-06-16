// ─── EXTRACT ROUTED METADATA OUT OF THE ADDRESS URL ON WINDOW LOAD ───
const urlParams = new URLSearchParams(window.location.search);
const currentProjectId = urlParams.get('project_id');
const currentProjectName = urlParams.get('project_name');
const API_BASE_URL = "http://127.0.0.1:8000";

// Auto-generate a clean session ID token string for this specific active workspace thread
let currentChatId = localStorage.getItem(`project_${currentProjectId}_chat`);
// DOM Selectors - File Pipeline
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const fileList = document.getElementById('file-list');
const fileListContainer = document.getElementById('file-list-container');
const processBtn = document.getElementById('process-btn');
const indexedList = document.getElementById('indexed-list');

// DOM Selectors - Chat Interaction Workspace
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusIndicator = document.getElementById('status-indicator');

let selectedFiles = [];
let isSendingMessage = false;

/* ─────────────────────────────────────────────────────────────────
   1. RUNTIME SECURITY & HEADER PROPAGATION CHECKS
   ───────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async() => {
    // Fallback block: If someone tries to open chat.html directly without project routing data
    if (!currentProjectId || !currentProjectName) {
        console.warn("No active project context detected. Returning to dashboard...");
        window.location.href = "index.html";
        return;
    }

    // Dynamic UI Header updates
    const sidebarProjectTitle = document.querySelector('.sidebar .header h2');
    const chatWorkspaceTitle = document.querySelector('.chat-header h2');

    if (sidebarProjectTitle) sidebarProjectTitle.innerText = currentProjectName;
    if (chatWorkspaceTitle) chatWorkspaceTitle.innerText = `Workspace: ${currentProjectName}`;
    
    if (statusIndicator) {
        statusIndicator.innerText = "● System Active";
        statusIndicator.style.color = "#22c55e";
    }

    // Initialize custom greeting
    if (chatWindow) {
        chatWindow.innerHTML = `
            <div class="message system-message">
                Welcome to your isolated research environment: <strong>${currentProjectName}</strong>!<br>
                Drop your research papers here to begin your scoped RAG analysis.
            </div>
        `;
    }

    // Pull documents belonging explicitly to this project container context
    await loadDocuments();
    await initializeChat();
    await loadChatHistory();
});

/* ─────────────────────────────────────────────────────────────────
   2. DOCUMENT RETRIEVAL PIPELINE (SCOPED TO PROJECT)
   ───────────────────────────────────────────────────────────────── */
browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.remove('drag-over')));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
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
            li.innerHTML = `<span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>`;
            
            const removeBtn = document.createElement('span');
            removeBtn.classList.add('remove-file');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => { e.stopPropagation(); removeFile(index); });
            
            li.appendChild(removeBtn);
            fileList.appendChild(li);
        });
    } else {
        fileListContainer.style.display = 'none';
        processBtn.disabled = true;
    }
}

processBtn.addEventListener('click', async (event) => {
    if (event) event.preventDefault();
    if (selectedFiles.length === 0 || !currentProjectId) return;

    processBtn.disabled = true;
    let uploadSuccess = true;

    try {
        for (let i = 0; i < selectedFiles.length; i++) {
            processBtn.style.backgroundColor = "#e67e22"; 
            processBtn.innerText = `Indexing (${i + 1}/${selectedFiles.length})...`;
            
            const formData = new FormData();
            formData.append("file", selectedFiles[i]);

            // Correct context routing with dynamic project_id injection parameter
            const response = await fetch(`${API_BASE_URL}/upload/?project_id=${currentProjectId}`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) uploadSuccess = false;
        }

        if (uploadSuccess) {
            processBtn.style.backgroundColor = "#22c55e";
            processBtn.innerText = "✓ Success";
            await loadDocuments(); 
            selectedFiles = [];
            updateUI();
        } else {
            processBtn.style.backgroundColor = "#ef4444";
            processBtn.innerText = "⚠ Indexing Partial Failure";
        }
    } catch(error) {
        console.error("Pipeline network breakdown caught:", error);
        processBtn.style.backgroundColor = "#ef4444";
        processBtn.innerText = "⚠ Connection Error";
    } finally {
        setTimeout(() => {
            processBtn.disabled = selectedFiles.length === 0;
            processBtn.style.backgroundColor = ""; 
            processBtn.innerText = "Process Documents";
        }, 2500);
    }
});

/* ─────────────────────────────────────────────────────────────────
   3. CHAT COMPONENT ENGINE (CONTAINED TO LOCAL CONTEXT)
   ───────────────────────────────────────────────────────────────── */
function typeMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', className);
    chatWindow.appendChild(msgDiv);
    
    let index = 0;
    const speed = 10;
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

async function initializeChat() {
    if(currentChatId){
        console.log("Using existing chat id:",currentChatId);
        return;
    }
    const response = await fetch( `${API_BASE_URL}/projects/${currentProjectId}/chats`,
        {
            method: "POST"
        }
    );

    const data = await response.json();
    currentChatId = data.chat_id;
    localStorage.setItem(`project_${currentProjectId}_chat`, currentChatId);
    console.log( "Chat created:",data.chat_id);
}

async function loadChatHistory() {
    const response = await fetch(
        `${API_BASE_URL}/projects/${currentProjectId}/chats/${currentChatId}`
    );

    const messages = await response.json();

    chatWindow.innerHTML = "";

    messages.forEach(msg => {
        if (msg.role === "user") {
            appendUserMessage(msg.message);
        } else {
            typeMessage(msg.message, "bot-message");
        }
    });
}

// PROTECTED: Prevents default HTML form reloads from wiping out session context variables
async function handleSend(event) {
    // If triggered by a form or button submit, block the native page reload
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const query = userInput.value.trim();
    if (!query || sendBtn.disabled || isSendingMessage || !currentProjectId) return;

    appendUserMessage(query);
    console.log("Sending query to RAG backend pipeline...");
    userInput.value = '';
    isSendingMessage = true;
    sendBtn.disabled = true;
    userInput.disabled = true;

    try {
        console.log("Before fetch");
        const response = await fetch(`${API_BASE_URL}/ask/`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                question: query,
                project_id: parseInt(currentProjectId), // Cast to integer for database typing compliance
                chat_id: parseInt(currentChatId), // Cast to integer for database typing compliance
            })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            const sourceDoc = (data.sources && data.sources.length > 0) ? `\n\nSource: ${data.sources.join(', ')}` : "";
            typeMessage(`${data.answer}${sourceDoc}`, 'bot-message');
        } else {
            const detail = data.detail ? ` ${data.detail}` : "";
            typeMessage(`Error: Server responded with status code ${response.status}.${detail}`, 'system-message');
        }
    } catch (error) {
        console.error("RAG backend pipeline error caught:", error);
        typeMessage("Error connecting to RAG backend pipeline. Check that the FastAPI server is running on port 8000 and that this page is opened from a local server.", 'system-message');
    } finally {
        isSendingMessage = false;
    }
}

// Bind listeners securely passing the execution event context down
sendBtn.addEventListener('click', (e) => handleSend(e));

userInput.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSend(e); 
    }
});

async function loadDocuments() {
    if (!indexedList || !currentProjectId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/documents?project_id=${currentProjectId}`);
        if (response.ok) {
            const documents = await response.json(); 
            indexedList.innerHTML = ''; 

            if (documents.length === 0) {
                indexedList.innerHTML = '<li class="empty-loading-msg">No indexed sources found.</li>';
                return;
            }

            documents.forEach(doc => {
                const li = document.createElement('li');
                li.className = 'indexed-item';
                li.innerHTML = `<span>${doc.filename}</span>`;
                indexedList.appendChild(li);
            });
        }
    } catch (e) {
        indexedList.innerHTML = '<li class="empty-loading-msg" style="color: #ef4444;">Failed to sync with store.</li>';
    }
}

