"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import {
  FlaskConical,
  LogOut,
  Moon,
  Sun,
  House,
} from "lucide-react"

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

import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/client"

export function Navbar() {
  const router = useRouter()

  const { theme, setTheme } = useTheme()

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
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
       <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FlaskConical className="h-5 w-5" />
          </div>

          <div>
            <h1 className="font-semibold tracking-tight">
              TinyRetriever
            </h1>

            <p className="text-xs text-muted-foreground">
              Research Intelligence Workspace
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">

          {mounted && (
            <button
              onClick={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              className="rounded-lg p-2 hover:bg-accent"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          )}

          {user && (
            <DropdownMenu>
                <DropdownMenuTrigger>
                <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent cursor-pointer outline-none">
                    <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata.avatar_url} />
                    <AvatarFallback>
                        {user.user_metadata.full_name?.[0]}
                    </AvatarFallback>
                    </Avatar>

                    <span className="hidden md:block text-sm font-medium">
                    {user.user_metadata.full_name?.split(" ")[0]}
                    </span>
                </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64"
                >
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="py-2">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                        Signed in as
                        </p>

                        <p className="font-medium leading-none">
                        {user.user_metadata.full_name}
                        </p>

                        <p className="break-all text-xs text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                    onClick={() => router.push("/")}
                    className="cursor-pointer"
                    >
                    <House className="mr-2 h-4 w-4" />
                    Home
                    </DropdownMenuItem>

                    <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 focus:text-red-500"
                    >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            )}

        </div>
      </div>
    </header>
  )
}