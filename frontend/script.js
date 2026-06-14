const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const fileList = document.getElementById('file-list');
const fileListContainer = document.getElementById('file-list-container');
const processBtn = document.getElementById('process-btn');

let selectedFiles = [];

// Trigger file browser when clicking the zone or browse link
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and Drop event listeners
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

// Process files array
function handleFiles(files) {
    for (let file of files) {
        // Prevent duplicate adds for simplicity
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    }
    updateUI();
}

// Remove file function
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateUI();
}

// Keep the UI synced with the files array
function updateUI() {
    fileList.innerHTML = '';
    
    if (selectedFiles.length > 0) {
        fileListContainer.style.display = 'block';
        processBtn.disabled = false;
        
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.classList.add('file-item');
            li.innerHTML = `
                <span>📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
                <span class="remove-file" onclick="event.stopPropagation(); removeFile(${index})">&times;</span>
            `;
            fileList.appendChild(li);
        });
    } else {
        fileListContainer.style.display = 'none';
        processBtn.disabled = true;
    }
}



processBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        alert("Please select a PDF first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", selectedFiles[0]);

    // Update button text to give visual feedback during fetch
    processBtn.disabled = true;
    processBtn.innerText = "Processing & Indexing...";

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/upload/",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();
        
        // Show success and instantly redirect to your chat window
        alert(data.message || "Upload successful!");
        window.location.href = "chat.html"; 

    } catch (error) {
        console.error(error);
        alert("Upload failed!");
    } finally {
        // Reset button state if it fails
        processBtn.disabled = false;
        processBtn.innerText = "Process Documents";
    }
});