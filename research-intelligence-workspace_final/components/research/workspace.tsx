"use client"

import { useMemo, useState, useEffect } from "react"
import {getProjects, askQuestion, getChatHistory, createChat, deleteChat, createProject, deleteProject, deletePaper, researchAction} from "@/lib/api"
import { projects as initialProjects, type Project, type Message, type Chat, type Paper, quickActions } from "@/lib/research-data"
import { Sidebar } from "./sidebar"
import { Conversation } from "./conversation"
import { ContextPanel } from "./context-panel"
import { HomeDashboard } from "./home-dashboard"
import { PaperSelectModal } from "./paper-select-modal"
import { ResearchActionModal } from "./research-action-modal"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"
import { CreateProjectModal } from "./create-project-modal"
import { Navbar } from "./navbar"
import { toast } from "sonner"

let idCounter = 1000
const nextId = () => `gen-${idCounter++}`

export function Workspace() {
  const [view, setView] = useState<"dashboard" | "workspace">("dashboard")
  const [projects, setProjects] = useState<Project[]>([])
  const loadProjects = async () => {
    try {
      const data = await getProjects();

      setProjects(data);

      if (data.length > 0) {
        setActiveProjectId(data[0].id);
        setActiveChatId(data[0].chats[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);
  type QuickAction = (typeof quickActions)[number]
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
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
                          message_type: m.message_type,
                          content: m.content, // IMPORTANT
                        })),
                      }
                ),
              }
        )
      )

    } catch (err) {
      console.error(err);
    }
  }

  loadHistory()
}, [activeProjectId, activeChatId])

async function handleNewProject() {
  const project = await createProject(
    projectName,
    projectDescription
  )
  console.log(project)

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
          <Navbar />
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
  const handleResearchAction = (action: QuickAction) => {
  setSelectedAction(action)
  setModalOpen(true)
} 
  const canSend = activeProject.papers.length > 0 && activePaperIds.length > 0 

  async function openProject(id: string) {
    await loadProjects()
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
    if (activePaperIds.length === 0) {
      toast.error("Please select at least one paper for retrieval.")
      return
    }
    if (activeProject?.papers.length === 0) {
      toast.error("Please Upload at least one paper to the project for retrieval.")
      return
    }
    
    const userMsg: Message = {
    id: nextId(),
    role: "user",
    message_type: "chat",
    content: text,}
    appendMessages(activeChat!.id, [userMsg])
    try {
      const result = await askQuestion(
        text,activeProject!.id, activeChat!.id, activePaperIds)
      const assistantMsg: Message = {
       id: nextId(),role: "assistant",message_type: "chat",content: result.answer,}
      console.log(typeof result.answer)
      appendMessages(activeChat!.id, [assistantMsg])

      setProjects(prev =>
        prev.map(project =>
          project.id === activeProject!.id
            ? {
                ...project,
                chats: project.chats.map(chat =>
                  chat.id === activeChat!.id
                    ? {
                        ...chat,
                        updated: new Date().toISOString(),
                        title: result.title ?? chat.title,
                      }
                    : chat
                )
              }
            : project
        )
      )
      console.log("ASK RESULT", result)

      }catch (error) {
    console.error(error)
    toast.error("Failed to generate answer.")
   }
  }

  async function handleNewChat() {
    try {
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
  } catch (error) {
    console.error(error)
    toast.error("Failed to create chat.")
  }
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
    toast.error("Failed to delete chat.")
  }
}

async function handleDeleteProject(projectId: string) {
  try {
    await deleteProject(projectId)

    setProjects((prev) =>
      prev.filter((p) => p.id !== projectId)
    )
  } catch (error) {
    console.error(error)
    toast.error("Failed to delete project.")
  }
}

async function handleGenerateResearchAction(
  selectedPaperIds: string[],
  instructions: string
) {
  if (!selectedAction || !activeProject || !activeChat) return

  if (
    selectedAction.endpoint === "compare" ||
    selectedAction.endpoint === "literature-review"
  ) {
    if (selectedPaperIds.length < 2) {
      toast.error(`Please select at least two papers for ${selectedAction.label}.`)
      return
    }
  }

  if (selectedAction.endpoint === "summary") {
    if (selectedPaperIds.length !== 1) {
      toast.error(`Please select exactly one paper for ${selectedAction.label}.`)
      return
    }
  }

  try {
    const userMsg: Message = {
      id: nextId(),
      role: "user",
      message_type: "chat",
      content: selectedAction.label,
    }
    appendMessages(activeChat!.id, [userMsg])

    const result = await researchAction(
      activeProject.id,
      selectedAction.endpoint,
      activeChat.id,
      selectedPaperIds,
      selectedAction.defaultQuestion,
      instructions
    )

    const assistantMsg: Message = {
      id: nextId(),
      role: "assistant",
      message_type: result.message_type,
      content: result.message,
      citations: result.citations,
      timestamp: new Date().toISOString(),
    }
    console.log(result.message)
    appendMessages(activeChat.id, [assistantMsg])
    toast.success("Generation successful.")
    setModalOpen(false)
  } catch (error) {
    console.error(error)
    toast.error("Generation failed")
  }
}


async function handleDeletePaper(
  paperId: string
) {
  const toastId = toast.loading("Deleting paper...")
  try {
    await deletePaper(
      activeProjectId,
      paperId
    )

    setProjects((prev) =>
      prev.map((project) =>
        project.id !== activeProjectId
          ? project
          : {
              ...project,
              papers: project.papers.filter(
                (p) => p.id !== paperId
              ),
            }
      )
    )

    setActiveByProject((prev) => {
      const current =
        prev[activeProjectId] ??
        activeProject!.papers.map((p) => p.id)

      return {
        ...prev,
        [activeProjectId]: current.filter(
          (x) => x !== paperId
        ),
      }
    })
    toast.success("Paper deleted successfully.")
  } catch (error) {
    console.error(error)
    toast.error("Failed to delete paper.")
  }
}
  

  if (view === "dashboard") {
  return (
    <>
      <Navbar/>
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
        canSend={canSend}
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
            projectId={activeProjectId}
            onUploadSuccess={loadProjects}
            activePaperIds={activePaperIds}
            onToggleActive={toggleActivePaper}
            onAction={handleResearchAction} // this is the problem

            onCollapse={() => setRightCollapsed(true)}
            onDeletePaper={handleDeletePaper}
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
          projectId={activeProjectId}
          activePaperIds={activePaperIds}
          onToggleActive={toggleActivePaper}
          onAction={handleResearchAction}
          onClose={() => setRightOpen(false)}
          onDeletePaper={handleDeletePaper}
        />
      </Drawer>

      {/* Compare paper-selection modal */}
      <PaperSelectModal
        open={compareAction !== null}
        actionLabel={compareAction ?? ""}
        papers={activeProject.papers}
        defaultSelectedIds={activePaperIds}
        onCancel={() => setCompareAction(null)}
      />
      
      <ResearchActionModal
        open={modalOpen}
        action={selectedAction}
        papers={activeProject?.papers ?? []}
        selectedPaperIds={activeByProject[activeProjectId] ?? []}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerateResearchAction}
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
