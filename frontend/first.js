// DOM Selectors - Dashboard and Popup Modal Views
const projectModal = document.getElementById('project-modal');
const openModalBtn = document.getElementById('open-create-modal-btn');
const inlineCreateCard = document.getElementById('inline-create-card');
const closeModalBtn = document.getElementById('close-modal-btn');
const submitProjectBtn = document.getElementById('submit-project-btn');
const projectsGrid = document.getElementById('projects-grid');

// Modal Input Fields
const newProjectName = document.getElementById('new-project-name');
const newProjectDesc = document.getElementById('new-project-desc');

/* ─────────────────────────────────────────────────────────────────
   1. LOAD RECENT PROJECTS FROM DATABASE ON ENTRY
   ───────────────────────────────────────────────────────────────── */
async function loadDashboardProjects() {
    try {
        const response = await fetch("http://127.0.0.1:8000/projects/");
        if (response.ok) {
            const projects = await response.json();
            
            // Clean the dashboard grid pool but preserve the master inline creation card
            projectsGrid.innerHTML = `
                <div class="project-card create-card" id="inline-create-card">
                    <div class="plus-circle">+</div>
                    <p>Create new project</p>
                </div>
            `;
            
            // Re-bind click listener to the freshly re-rendered inline button card
            document.getElementById('inline-create-card').addEventListener('click', showModal);

            // Append a custom UI card for every project pulled from SQLite
            projects.forEach(project => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.innerHTML = `
                    <div>
                        <h4>${project.name}</h4>
                        <p>${project.description || 'No description provided.'}</p>
                    </div>
                `;
                // Add click listener to trigger the browser router jump
                card.addEventListener('click', () => redirectToWorkspace(project.id, project.name));
                projectsGrid.appendChild(card);
            });
        }
    } catch (err) {
        console.error("Failed to sync project database cards:", err);
    }
}

/* ─────────────────────────────────────────────────────────────────
   2. POPUP MODAL VALIDATION GUARDRAILS
   ───────────────────────────────────────────────────────────────── */
function showModal() {
    projectModal.style.display = 'flex';
    newProjectName.classList.remove('validation-error'); // Drop red alerts on clear click
    newProjectName.value = '';
    newProjectDesc.value = '';
    newProjectName.focus();
}

function hideModal() { projectModal.style.display = 'none'; }

openModalBtn.addEventListener('click', showModal);
closeModalBtn.addEventListener('click', hideModal);
projectModal.addEventListener('click', (e) => { if (e.target === projectModal) hideModal(); });

// Instantly strip error styling when the user begins typing a correction
newProjectName.addEventListener('input', () => {
    newProjectName.classList.remove('validation-error');
});

// Action: Process Creation Payload Form
submitProjectBtn.addEventListener('click', async () => {
    const name = newProjectName.value.trim();
    const description = newProjectDesc.value.trim();

    // ─── STICK GUARDRAIL: VERIFY NAME IS NOT NULL/EMPTY ───
    if (!name || name === "") {
        newProjectName.classList.add('validation-error'); // Glows input field red
        newProjectName.placeholder = "Project workspace title is required!";
        newProjectName.focus();
        return;
    }

    submitProjectBtn.disabled = true;
    submitProjectBtn.innerText = "Creating...";

    try {
        const response = await fetch("http://127.0.0.1:8000/projects/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name, description: description })
        });

        if (response.ok) {
            const newProject = await response.json();
            hideModal();
            redirectToWorkspace(newProject.id, newProject.name);
        }
    } catch (error) {
        console.error("Project initialization caught exception:", error);
    } finally {
        submitProjectBtn.disabled = false;
        submitProjectBtn.innerText = "Create";
    }
});

/* ─────────────────────────────────────────────────────────────────
   3. BROWSER ROUTING (HREF TRANSFER WITH PARAMS)
   ───────────────────────────────────────────────────────────────── */
function redirectToWorkspace(projectId, projectName) {
    const encodedName = encodeURIComponent(projectName);
    // Redirect browser directly to your separate chat page view layout
    window.location.href = `chat.html?project_id=${projectId}&project_name=${encodedName}`;
}

// Initialize when dashboard mounts
document.addEventListener("DOMContentLoaded", () => {
    loadDashboardProjects();
});