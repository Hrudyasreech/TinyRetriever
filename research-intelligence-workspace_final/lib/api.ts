import { quickActions } from "./research-data"

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
  projectId: string,
  chatId: string,
  activePaperIds: string[]
) {
  const response = await fetch("http://127.0.0.1:8000/ask/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      project_id:(projectId),
      chat_id: (chatId),
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

export async function deletePaper(
  projectId: string,
  documentId: string
) {
  const response = await fetch(
    `http://127.0.0.1:8000/projects/${projectId}/documents/${documentId}`,
    {
      method: "DELETE"
    }
  )

  return response.json()
}

export async function researchAction(
  projectId: string,
  endpoint: string,
  chatId: string,
  selectedPaperIds: string[],
  question: string,
  instructions: string
) {
  const response = await fetch(
    `http://127.0.0.1:8000/projects/${projectId}/${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: (chatId),
        selected_paper_ids: selectedPaperIds,
        question,
        instructions,
      }),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to generate response")
  }

  return await response.json()
}
