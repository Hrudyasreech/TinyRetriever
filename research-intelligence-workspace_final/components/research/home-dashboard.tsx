"use client"

import { FlaskConical, Plus, FileText, MessageSquare, Clock, ArrowRight } from "lucide-react"
import type { Project } from "@/lib/research-data"

type Props = {
  projects: Project[]
  onOpenProject: (id: string) => void
  onNewProject: () => void
  onDeleteProject: (id: string) => void
}

function lastActivity(project: Project) {
  return project.chats[0]?.updated ?? "No activity yet"
}

export function HomeDashboard({ projects, onOpenProject, onNewProject, onDeleteProject }: Props) {
  const totalPapers = projects.reduce((s, p) => s + p.papers.length, 0)
  const totalChats = projects.reduce((s, p) => s + p.chats.length, 0)

  return (
    <main className="min-h-dvh overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FlaskConical className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">TinyRetriever</p>
            <p className="text-xs text-muted-foreground">Research Intelligence</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Your research workspaces
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
              {projects.length} workspaces · {totalPapers} papers · {totalChats} conversations
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create Workspace
          </button>
        </div>

        {/* Workspace grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-2xl leading-none">
                  {project.emoji}
                </span>
                <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteProject(project.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500"
                  >
                    ✕
                </button>
              </div>

              <h2 className="mt-4 truncate text-base font-semibold tracking-tight">
                {project.name}
              </h2>
              <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                {project.description}
              </p>

              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3.5">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="size-3.5 text-primary" />
                  {project.papers.length} {project.papers.length === 1 ? "paper" : "papers"}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="size-3.5 text-primary" />
                  {project.chats.length} {project.chats.length === 1 ? "chat" : "chats"}
                </span>
              </div>
              <span className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Last activity {lastActivity(project)}
              </span>
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
  )
}
