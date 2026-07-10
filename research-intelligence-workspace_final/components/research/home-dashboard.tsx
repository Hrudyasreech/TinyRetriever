"use client"

import { FlaskConical, Plus, FileText, MessageSquare, Clock, ArrowRight, Trash2 } from "lucide-react"
import type { Project } from "@/lib/research-data"
import { supabase } from "@/lib/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { formatDistanceToNow } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


type Props = {
  projects: Project[]
  onOpenProject: (id: string) => void
  onNewProject: () => void
  onDeleteProject: (id: string) => void
}


function lastActivity(project: Project) {
  console.log(project.name)
  console.log(project.chats)

  if (!project.chats.length) return "No activity yet"

  console.log("UPDATED:", project.chats[0].updated)
  console.log("DATE:", new Date(project.chats[0].updated))

  return formatDistanceToNow(
    new Date(project.chats[0].updated),
    { addSuffix: true }
  )
}

export function HomeDashboard({ projects, onOpenProject, onNewProject, onDeleteProject }: Props) {
  const totalPapers = projects.reduce((s, p) => s + p.papers.length, 0)
  const totalChats = projects.reduce((s, p) => s + p.chats.length, 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)
  }

  loadUser()
}, [])

return (
  <main className="min-h-dvh overflow-y-auto bg-background text-foreground">
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      
      {/* Dynamic Welcome Heading & Stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Welcome, {user?.user_metadata?.full_name?.split(" ")[0] || "User"}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Organize papers, chat with your research, and generate insights.
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
            {projects.length} workspaces · {totalPapers} papers · {totalChats} conversations
          </p>
        </div>

      </div>

      {/* Workspace grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-2xl leading-none">
                {project.emoji}
              </span>

              <AlertDialog>
                <AlertDialogTrigger>
                  <div className="cursor-pointer rounded p-1 text-red-500 opacity-0 transition-opacity hover:bg-accent/50 group-hover:opacity-100">
                    <Trash2 className="size-4" />
                  </div>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Project?
                    </AlertDialogTitle>

                    <AlertDialogDescription>
                      This will permanently delete
                      <span className="font-semibold text-foreground">
                        {" "}
                        "{project.name}"
                      </span>
                      , including all uploaded papers, chats, and embeddings.
                      <br />
                      <br />
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Cancel
                    </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      setIsDeleting(true)   
                      try {
                        await onDeleteProject(project.id)
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Clickable content */}
            <div
              onClick={() => onOpenProject(project.id)}
              className="mt-4 flex-1 cursor-pointer"
            >
              <h2 className="truncate text-base font-semibold tracking-tight">
                {project.name}
              </h2>

              <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                {project.description}
              </p>

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3.5">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="size-3.5 text-primary" />
                  {project.papers.length}{" "}
                  {project.papers.length === 1 ? "paper" : "papers"}
                </span>

                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="size-3.5 text-primary" />
                  {project.chats.length}{" "}
                  {project.chats.length === 1 ? "chat" : "chats"}
                </span>
              </div>

              <span className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Last activity: {lastActivity(project)}
              </span>
            </div>
          </div>
        ))}


        {/* Create card */}
        <button
          onClick={onNewProject}
          className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/40 hover:text-foreground"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Plus className="size-5" />
          </span>
          <span className="text-sm font-medium">Create Workspace</span>
          <span className="max-w-[12rem] text-xs leading-relaxed">
            Start a new project and upload papers to analyze
          </span>
        </button>
      </div>
    </div>
  </main>
)}