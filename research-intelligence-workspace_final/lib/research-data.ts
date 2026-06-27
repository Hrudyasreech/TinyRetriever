export type Paper = {
  id: string
  title: string
  authors: string[]
  year: number
  venue: string
  doi: string
  keywords: string[]
  abstract: string
  citations: number
  pages: number
  status: "processed" | "processing"
  color: string
}

export type Citation = {
  paperId: string
  label: string
  snippet: string
  section: string
  page: number
}

export type Message = {
  id: string
  role: "user" | "assistant"
  message_type: "compare" | "summary" | "literature-review" | "chat" 
  content: any
  citations?: Citation[]
  card?: {
    title: string
    kind: "synthesis" | "comparison" | "summary" | "review"
  }
  comparison?: {
    columns: string[]
    rows: { label: string; values: string[] }[]
    similarities: string[]
    differences: string[]
    key_takeaways: string
  }
  timestamp?: string
}

export type Chat = {
  id: string
  title: string
  updated: string
  messages: Message[]
}

export type Project = {
  id: string
  name: string
  emoji: string
  description: string
  papers: Paper[]
  chats: Chat[]
}

export const projects: Project[] = []

export const quickActions = [
  {
    id: "compare",
    label: "Compare Papers",
    icon: "GitCompare",
    endpoint: "compare",
    defaultQuestion: "Compare the selected research papers."
  },
  {
    id: "summary",
    label: "Summarize Paper",
    icon: "AlignLeft",
    endpoint: "summary",
    defaultQuestion: "Summarize the selected paper."
  },
  {
    id: "literature-review",
    label: "Literature Review",
    icon: "FileText",
    endpoint: "literature-review",
    defaultQuestion: "Generate a literature review for the selected research papers."
  }
] as const
