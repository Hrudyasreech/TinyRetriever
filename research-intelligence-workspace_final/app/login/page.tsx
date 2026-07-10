"use client";

import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/client";

export default function LoginPage() {

    const handleGoogleLogin = async () => {
    try {
        await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        },
        });
    } catch (error) {
        console.error("Google sign-in failed:", error);
    }
    };


  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">

        <div className="mb-8 text-center">

          <h1 className="text-4xl font-bold">
            Welcome Back
          </h1>

          <p className="mt-3 text-muted-foreground">
            Sign in to continue using your research workspace.
          </p>

        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.2C29.2 36 26.8 37 24 37c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.5 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.8-6.2 7.5l6.2 5.2C39.8 37.3 44 31.2 44 24c0-1.3-.1-2.5-.4-3.5z"
            />
          </svg>

          Continue with Google

          <ArrowRight className="h-4 w-4" />

        </button>

      </div>
    </main>
  );
}