"use client"

import { useMemo, useState, useEffect } from "react"
import {getProjects, askQuestion, getChatHistory, createChat, deleteChat, createProject, deleteProject} from "@/lib/api"
import { projects as initialProjects, type Project, type Message, type Chat, type Paper } from "@/lib/research-data"
import { Sidebar } from "./sidebar"
import { Conversation } from "./conversation"
import { ContextPanel } from "./context-panel"
import { HomeDashboard } from "./home-dashboard"
import { PaperSelectModal } from "./paper-select-modal"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"
import { CreateProjectModal } from "./create-project-modal"

let idCounter = 1000
const nextId = () => `gen-${idCounter++}`

function buildAssistantReply(prompt: string, papers: Paper[]): Message {
  const lower = prompt.toLowerCase()
  const pool = papers.length ? papers : []
  const cite = (i: number) => {
    const p = pool[i % pool.length]
    return {
      paperId: p.id,
      label: `${p.title.split(":")[0]} §${(i % 4) + 1}`,
      snippet: p.abstract.slice(0, 120) + "…",
      section: "Source excerpt",
      page: (i % 9) + 1,
    }
  }

  if (!pool.length) {
    return {
      id: nextId(),
      role: "assistant",
      card: { title: "No active sources", kind: "synthesis" },
      content:
        "No papers are currently active for retrieval. Activate at least one paper in the Research Context panel so I can ground my answer in your sources.",
    }
  }

  if (lower.includes("compare")) {
    const cols = pool.slice(0, 4)
    return {
      id: nextId(),
      role: "assistant",
      card: { title: "Cross-Paper Comparison", kind: "comparison" },
      content: `Here is a structured comparison across the ${cols.length} selected papers. Each column maps to a paper, with cited source sections supporting every cell.`,
      comparison: {
        columns: cols.map((p) => p.title.split(":")[0].split(" ").slice(0, 2).join(" ")),
        rows: [
          { label: "Approach", values: cols.map((p) => p.keywords[0] ?? "—") },
          { label: "Year", values: cols.map((p) => String(p.year)) },
          { label: "Venue", values: cols.map((p) => p.venue) },
        ],
      },
      citations: pool.length > 1 ? [cite(0), cite(1)] : [cite(0)],
    }
  }

  if (lower.includes("literature review") || lower.includes("review")) {
    return {
      id: nextId(),
      role: "assistant",
      card: { title: "Literature Review Draft", kind: "review" },
      content:
        "Recent work in this area converges on a shared goal of efficiency without sacrificing accuracy. Building on foundational methods, subsequent papers refine the trade-off between computational cost and representational fidelity, collectively establishing a clear trajectory for the field.",
      citations: pool.length > 1 ? [cite(0), cite(1)] : [cite(0)],
    }
  }

  if (lower.includes("summar") || lower.includes("contribution")) {
    return {
      id: nextId(),
      role: "assistant",
      card: { title: "Summary & Contributions", kind: "summary" },
      content:
        "The core contributions across these papers center on novel mechanisms that improve scalability, supported by strong empirical results on standard benchmarks. Each work isolates a specific bottleneck and proposes a targeted, reproducible solution.",
      citations: [cite(0)],
    }
  }

  return {
    id: nextId(),
    role: "assistant",
    card: { title: "Research Insight", kind: "synthesis" },
    content:
      "Based on your active sources, here is a synthesized answer grounded in the relevant sections. The evidence points to a consistent pattern across the collection, with the strongest support coming from the most recent works.",
    citations: pool.length > 1 ? [cite(0), cite(1)] : [cite(0)],
  }
}

export function Workspace() {
  const [view, setView] = useState<"dashboard" | "workspace">("dashboard")
  const [projects, setProjects] = useState<Project[]>([])
  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects()
        console.log("Projects form Backend", data)
        setProjects(data)
        if (data.length > 0) {
          setActiveProjectId(data[0].id)
          setActiveChatId(data[0].chats[0].id)
        }
      } catch (error) {
        console.error("Error fetching projects", error)
      }
    }
    loadProjects()
  }, [])
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [activeProjectId, setActiveProjectId] = useState("")
  const [activeChatId, setActiveChatId] = useState("")
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  // active papers for retrieval, keyed by project id
  const [activeByProject, setActiveByProject] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(initialProjects.map((p) => [p.id, p.papers.map((pa) => pa.id)])),
  )
  // pending compare action awaiting paper selection
  const [compareAction, setCompareAction] = useState<string | null>(null)
  
  const activeProject = useMemo(
  () => projects.find((p) => p.id === activeProjectId),
  [projects, activeProjectId],
)
  const activeChat = useMemo(() => {
    if (!activeProject) return null;
     return activeProject.chats.find((c) => c.id === activeChatId) ?? activeProject.chats[0];
  }, [activeProject, activeChatId]);

  useEffect(() => {
  console.log("ACTIVE PROJECT:", activeProjectId)
  console.log("ACTIVE CHAT:", activeChatId)
  async function loadHistory() {
    if (!activeProjectId || !activeChatId) return

    try {
      const history = await getChatHistory(
        String(activeProjectId),
        String(activeChatId)
      )

      setProjects((prev) =>
        prev.map((project) =>
          project.id !== activeProjectId
            ? project
            : {
                ...project,
                chats: project.chats.map((chat) =>
                  chat.id !== activeChatId
                    ? chat
                    : {
                        ...chat,
                        messages: history.map((m: any) => ({
                          id: String(m.id),
                          role: m.role,
                          content: m.content, // IMPORTANT
                        })),
                      }
                ),
              }
        )
      )
    } catch (err) {
      console.error(err)
    }
  }

  loadHistory()
}, [activeProjectId, activeChatId])

async function handleNewProject() {
  const project = await createProject(
    projectName,
    projectDescription
  )

  setProjects(prev => [...prev, project])

  setActiveProjectId(project.id)
  setActiveChatId(project.chats[0].id)

  setShowProjectModal(false)
  setProjectName("")
  setProjectDescription("")

  setView("workspace")
}
  if (!activeProject) {
      return (
        <>
          <HomeDashboard
            projects={projects}
            onOpenProject={openProject}
            onNewProject={() => setShowProjectModal(true)}
            onDeleteProject={(id) =>
              handleDeleteProject(id)}
          />

          <CreateProjectModal
            open={showProjectModal}
            projectName={projectName}
            projectDescription={projectDescription}
            setProjectName={setProjectName}
            setProjectDescription={setProjectDescription}
            onCancel={() => setShowProjectModal(false)}
            onCreate={handleNewProject}
          />
        </>
      )
  }
  if (!activeChat) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            No chats in this project
          </h2>

          <p className="mt-2 text-muted-foreground">
            Create a chat to start asking questions.
          </p>

          <Button
            className="mt-4"
            onClick={handleNewChat}
          >
            New Chat
          </Button>
        </div>
      </div>
    )
  }
  const activePaperIds = activeByProject[activeProjectId] ?? activeProject.papers.map((p) => p.id)
  const activePapers = activeProject.papers.filter((p) => activePaperIds.includes(p.id))
  const retrievalPapers = activePapers.length ? activePapers : activeProject.papers

  function openProject(id: string) {
    selectProject(id)
    setView("workspace")
  }

  function selectProject(id: string) {
    const proj = projects.find((p) => p.id === id)!
    setActiveProjectId(id)
    setActiveChatId(proj.chats[0]?.id ?? "")
    setActiveByProject((prev) =>
      prev[id] ? prev : { ...prev, [id]: proj.papers.map((p) => p.id) },
    )
    console.log("PROJECT CLICKED", proj)
    console.log("CHATS", proj.chats)
  }

  function toggleActivePaper(paperId: string) {
    setActiveByProject((prev) => {
      const current = prev[activeProjectId] ?? activeProject!.papers.map((p) => p.id)
      const next = current.includes(paperId)
        ? current.filter((x) => x !== paperId)
        : [...current, paperId]
      return { ...prev, [activeProjectId]: next }
    })
  }

  function appendMessages(chatId: string, msgs: Message[]) {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id !== activeProjectId
          ? proj
          : {
              ...proj,
              chats: proj.chats.map((c) =>
                c.id !== chatId ? c : { ...c, messages: [...c.messages, ...msgs], updated: "Just now" },
              ),
            },
      ),
    )
  }

  async function handleSend(text: string) {
    const userMsg: Message = {
    id: nextId(),
    role: "user",
    content: text,}
    appendMessages(activeChat!.id, [userMsg])
    try {
      const result = await askQuestion(
        text,activeProject!.id, activeChat!.id)
      const assistantMsg: Message = {
       id: nextId(),role: "assistant",content: result.answer,}
      appendMessages(activeChat!.id, [assistantMsg])
      console.log("ASK RESULT", result)

      }catch (error) {
    console.error(error)
   }
  }

  // Quick actions: comparisons open the paper-selection modal first
  function handleAction(label: string) {
    if (label.toLowerCase().startsWith("compare")) {
      setCompareAction(label)
      return
    }
    handleSend(label)
  }

  function handleConfirmCompare(selectedIds: string[]) {
    const label = compareAction ?? "Compare Papers"
    setCompareAction(null)
    const selectedPapers = activeProject!.papers.filter((p) => selectedIds.includes(p.id))
    const userMsg: Message = {
      id: nextId(),
      role: "user",
      content: `${label} — ${selectedPapers.map((p) => p.title.split(":")[0]).join(", ")}`,
    }
    const reply = buildAssistantReply(label, selectedPapers)
    appendMessages(activeChat!.id, [userMsg, reply])
  }

  async function handleNewChat() {
    const newChat = await createChat(String(activeProjectId))
    console.log(newChat)
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id !== activeProjectId ? proj : { ...proj, chats: [newChat, ...proj.chats] },
      ),
    )
    console.log("Projects",projects)
    setActiveChatId(newChat.id)
    setLeftOpen(false)
  }

  async function handleDeleteChat(chatId: string) {
  try {
    await deleteChat(
      String(activeProjectId),
      chatId
    )

    setProjects((prev) =>
      prev.map((project) =>
        project.id !== activeProjectId
          ? project
          : {
              ...project,
              chats: project.chats.filter(
                (chat) => chat.id !== chatId
              ),
            }
      )
    )

  } catch (error) {
    console.error(error)
  }
}
async function handleDeleteProject(
  projectId: string
) {
  await deleteProject(projectId)

  setProjects((prev) =>
    prev.filter((p) => p.id !== projectId)
  )
}

  if (view === "dashboard") {
  return (
    <>
      <HomeDashboard
        projects={projects}
        onOpenProject={openProject}
        onNewProject={() => setShowProjectModal(true)}
        onDeleteProject={(id) =>
          handleDeleteProject(id)}
      />

      <CreateProjectModal
        open={showProjectModal}
        projectName={projectName}
        projectDescription={projectDescription}
        setProjectName={setProjectName}
        setProjectDescription={setProjectDescription}
        onCancel={() => setShowProjectModal(false)}
        onCreate={handleNewProject}
      />
    </>
  )
}

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* Left sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          projects={projects}
          activeProject={activeProject}
          activeChatId={activeChat?.id ?? ""}
          onSelectProject={selectProject}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onHome={() => setView("dashboard")}
        />
      </div>

      {/* Center */}
      <Conversation
        chat={activeChat}
        papers={activeProject.papers}
        projectName={activeProject.name}
        activeCount={activePapers.length}
        onSend={handleSend}
        onToggleLeft={() => setLeftOpen(true)}
        onToggleRight={() => (rightCollapsed ? setRightCollapsed(false) : setRightOpen(true))}
      />

      {/* Right panel (desktop) */}
      {rightCollapsed ? (
        <div className="hidden w-12 shrink-0 flex-col items-center border-l border-border bg-sidebar py-3 xl:flex">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRightCollapsed(false)}
            aria-label="Expand context panel"
          >
            <PanelRightOpen className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="hidden xl:block">
          <ContextPanel
            papers={activeProject.papers}
            activePaperIds={activePaperIds}
            onToggleActive={toggleActivePaper}
            onAction={handleAction}
            onCollapse={() => setRightCollapsed(true)}
          />
        </div>
      )}

      {/* Mobile left drawer */}
      <Drawer open={leftOpen} side="left" onClose={() => setLeftOpen(false)}>
        <Sidebar
          projects={projects}
          activeProject={activeProject}
          activeChatId={activeChat?.id ?? ""}
          onSelectProject={(id) => {
            selectProject(id)
            setLeftOpen(false)
          }}
          onSelectChat={(id) => {
            setActiveChatId(id)
            setLeftOpen(false)
          }}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onHome={() => {
            setView("dashboard")
            setLeftOpen(false)
          }}
          onClose={() => setLeftOpen(false)}
        />
      </Drawer>

      {/* Mobile right drawer */}
      <Drawer open={rightOpen} side="right" onClose={() => setRightOpen(false)}>
        <ContextPanel
          papers={activeProject.papers}
          activePaperIds={activePaperIds}
          onToggleActive={toggleActivePaper}
          onAction={(label) => {
            handleAction(label)
            setRightOpen(false)
          }}
          onClose={() => setRightOpen(false)}
        />
      </Drawer>

      {/* Compare paper-selection modal */}
      <PaperSelectModal
        open={compareAction !== null}
        actionLabel={compareAction ?? ""}
        papers={activeProject.papers}
        defaultSelectedIds={activePaperIds}
        onCancel={() => setCompareAction(null)}
        onConfirm={handleConfirmCompare}
      />
    </div>
  )
}

function Drawer({
  open,
  side,
  onClose,
  children,
}: {
  open: boolean
  side: "left" | "right"
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-foreground/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute top-0 h-full transition-transform duration-300",
          side === "left" ? "left-0" : "right-0",
          open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full",
        )}
      >
        {children}
      </div>
    </div>
  )
}
