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
  Moon,
  Sun,
  Trash2,
} from "lucide-react"
import { useState, useEffect } from "react"
import type { Project, Chat } from "@/lib/research-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

import { useRouter } from "next/navigation"
import { supabase } from "@/lib/client"
import type { User } from "@supabase/supabase-js"


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
  const router = useRouter()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [isDeletingChat, setIsDeletingChat] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  
    useEffect(() => {
      setMounted(true)
  
      async function loadUser() {
        const {
          data: { user },
        } = await supabase.auth.getUser()
  
        setUser(user)
      }
  
      loadUser()
    }, [])
  
    const handleLogout = async () => {
      await supabase.auth.signOut()
  
      router.push("/")
    }
  

  return (
    <aside className="flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Tiny Retriever</p>
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
               
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {chat.title}
                  </span>
                </span>
                {/* 1. Use a standard HTML button for the trash icon */}
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-red-500 text-xs px-2 cursor-pointer transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation(); // Instantly stops the parent chat item from opening
                    setIsDeleteOpen(true); // Manually opens the dialog
                  }}
                >
                  <Trash2 className="size-4" />
                </button>

                {/* 2. Bind the Dialog directly to your local state */}
                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This conversation will be permanently deleted.
                        <br />
                        <br />
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDeleteOpen(false); // Manually close
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>

                      <AlertDialogAction
                        disabled={isDeletingChat}
                        onClick={async (e) => {
                          e.stopPropagation(); // Blocks parent container selection loops
                          console.log("Delete clicked");
                          setIsDeletingChat(true);

                          try {
                            console.log("Calling onDeleteChat");
                            await onDeleteChat(chat.id);
                            console.log("Finished");
                            setIsDeleteOpen(false); // Close dialog on success
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setIsDeletingChat(false);
                          }
                        }}
                      >
                        {isDeletingChat ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
        </nav>
      </div>

      {/* User */}
      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-2">
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent cursor-pointer outline-none">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user?.user_metadata.avatar_url} />
                  <AvatarFallback>
                    {user?.user_metadata.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <span className="hidden md:block truncate text-sm font-medium max-w-[100px]">
                  {user?.user_metadata.full_name?.split(" ")[0]}
                </span>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="right" align="end" sideOffset={12}>
              <DropdownMenuItem onClick={() => router.push("/")}>
                Home
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Icon-Only Theme Toggle (Saves Space Side-by-Side) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg hover:bg-accent"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

        </div>
      </div>
    </aside>
  )
}
