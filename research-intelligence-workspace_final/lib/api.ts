import { createClient } from "./client";
import { quickActions } from "./research-data"

const API_BASE_URL = "http://127.0.0.1:8000"

async function authHeaders() {
    const supabase = createClient();

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        throw new Error("User is not authenticated");
    }

    return {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
    };
}

export async function createProject(
  name: string,
  description: string
) {
  const response = await fetch(
    `${API_BASE_URL}/projects/`,
    {
      method: "POST",
      headers: await authHeaders(),
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
const response = await fetch(`${API_BASE_URL}/projects/`,
  {
    method: "GET",
    headers: await authHeaders(),
  })

if (!response.ok) {
throw new Error("Failed to load projects")
}

return response.json()
}

export async function deleteProject(
  projectId: string
) {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}`,
    {
      method: "DELETE",
      headers: await authHeaders(),
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
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const response = await fetch(`${API_BASE_URL}/ask/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
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
    `${API_BASE_URL}/projects/${projectId}/chats/${chatId}`,
  {
    method: "GET",
    headers: await authHeaders(),
  })
  if (!response.ok) {
    throw new Error("Failed to load chat history")
  }

  return response.json()
}

export async function createChat(projectId: string) {
  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/chats`,
    {
      method: "POST",
      headers: await authHeaders(),
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
    `${API_BASE_URL}/projects/${projectId}/chats/${chatId}`,
    {
      method: "DELETE",
      headers: await authHeaders(),
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
    `${API_BASE_URL}/projects/${projectId}/documents/${documentId}`,
    {
      method: "DELETE",
      headers: await authHeaders(),
    }
  )
  if (!response.ok) {
    throw new Error("Failed to delete paper")
  }

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
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(
    `${API_BASE_URL}/projects/${projectId}/${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
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
