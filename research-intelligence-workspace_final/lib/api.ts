const API_BASE_URL = "http://127.0.0.1:8000"

export async function createProject(
  name: string,
  description: string
) {
  const response = await fetch(
    "http://127.0.0.1:8000/projects/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
      }),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to create project")
  }

  return response.json()
}

export async function getProjects() {
const response = await fetch(`${API_BASE_URL}/projects/`)

if (!response.ok) {
throw new Error("Failed to load projects")
}

return response.json()
}

export async function deleteProject(
  projectId: string
) {
  const response = await fetch(
    `http://127.0.0.1:8000/projects/${projectId}`,
    {
      method: "DELETE",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to delete project")
  }
}

export async function askQuestion(
  question: string,
  projectId: number | string,
  chatId: number | string,
  activePaperIds: string[]
) {
  const response = await fetch("http://127.0.0.1:8000/ask/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      project_id: Number(projectId),
      chat_id: Number(chatId),
      selected_paper_ids : activePaperIds
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to get answer")
  }

  return response.json()
}

export async function getChatHistory(
  projectId: string,
  chatId: string
) {
  const response = await fetch(
    `http://127.0.0.1:8000/projects/${projectId}/chats/${chatId}`
  )

  if (!response.ok) {
    throw new Error("Failed to load chat history")
  }

  return response.json()
}

export async function createChat(projectId: string) {
  const response = await fetch(
    `http://127.0.0.1:8000/projects/${projectId}/chats`,
    {
      method: "POST",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to create chat")
  }

  return response.json()
}

export async function deleteChat(
  projectId: string,
  chatId: string
) {
  const response = await fetch(
    `http://127.0.0.1:8000/projects/${projectId}/chats/${chatId}`,
    {
      method: "DELETE",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to delete chat")
  }

  return response.json()
}