"use client"

import {
  ChevronsUpDown,
  Plus,
  MessageSquare,
  FlaskConical,
  Search,
  Check,
  PanelLeftClose,
  LayoutGrid,
} from "lucide-react"
import { useState } from "react"
import type { Project, Chat } from "@/lib/research-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
  projects: Project[]
  activeProject: Project
  activeChatId: string
  onSelectProject: (id: string) => void
  onSelectChat: (id: string) => void
  onNewChat: () => void
  onClose?: () => void
  onHome?: () => void
  onDeleteChat: (id: string) => void
}

export function Sidebar({
  projects,
  activeProject,
  activeChatId,
  onSelectProject,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClose,
  onHome,
}: Props) {
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Lumen</p>
            <p className="text-[11px] text-muted-foreground">Research Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onHome ? (
            <Button variant="ghost" size="icon-sm" onClick={onHome} aria-label="All workspaces">
              <LayoutGrid className="size-4" />
            </Button>
          ) : null}
          {onClose ? (
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="lg:hidden" aria-label="Close sidebar">
              <PanelLeftClose className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {/* Project switcher */}
      <div className="relative px-3">
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border bg-card px-3 py-2.5 text-left shadow-sm transition-colors hover:bg-accent"
          aria-expanded={switcherOpen}
        >
          <span className="text-lg leading-none">{activeProject.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{activeProject.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {activeProject.papers.length} papers
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {switcherOpen ? (
          <div className="absolute inset-x-3 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelectProject(p.id)
                  setSwitcherOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="text-base leading-none">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {p.id === activeProject.id ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
        
          </div>
        ) : null}
      </div>

      {/* New chat */}
      <div className="px-3 pt-3">
        <Button onClick={onNewChat} className="w-full justify-start gap-2" size="lg">
          <Plus className="size-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-card px-2.5 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Chat history */}
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <p className="px-5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Conversations
        </p>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
          {activeProject.chats.map((chat: Chat) => {
            const active = chat.id === activeChatId
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                role="button"
                className={cn(
                  "group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                )}
              >
                <MessageSquare
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {chat.title}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{chat.updated}</span>
                </span>
                <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("Delete chat", chat.id)
                      onDeleteChat(chat.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-500 text-xs px-2"
                  >
                    ✕
                </button>
              </div>
            )
          })}
        </nav>
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          DR
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">Dr. Riya Nair</p>
          <p className="truncate text-[11px] text-muted-foreground">Research Lab · Pro</p>
        </div>
      </div>
    </aside>
  )
}
