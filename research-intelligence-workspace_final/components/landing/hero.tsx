"use client"
import { ArrowRight, Layers, Cpu, Database } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/client"


export function Hero() {

  const router = useRouter()

  async function handleGetStarted() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }

  return (
    // Changed to bg-transparent to explicitly let the canvas layer show through
    <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center gap-12 bg-transparent px-6 py-12 text-zinc-100 lg:flex-row">

      {/* Left */}
      <div className="flex-1 max-w-xl space-y-6">
        {/* Improved Contrast Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          AI-Powered Research Workspace
        </div>
        
        {/* Clean, Modern Title Replacement */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          TinyRetriever
        </h1>
        
        {/* Improved Body Text Visibility */}
        <p className="text-lg leading-relaxed text-zinc-300">
          A modern research intelligence platform for exploring academic papers.
          Upload PDFs, chat with your documents, compare publications, and
          generate structured literature reviews using AI-powered retrieval.
        </p>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 font-medium text-black transition hover:bg-emerald-600"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          {/* Enhanced Secondary Button Border Visibility */}
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/30 px-6 py-3 font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Explore Features
          </a>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 w-full max-w-md lg:max-w-none">
        {/* REMOVED backdrop-blur-sm to let underlying canvas threads show cleanly through card margins */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-2xl md:p-8">

          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl transition-colors duration-500 group-hover:bg-indigo-500/20" />

          <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Platform Highlights
          </h3>

          <div className="space-y-6">

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80">
                <Layers className="h-5 w-5 text-white" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  Section-Aware Retrieval
                </h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Understands document structure to retrieve relevant information
                  from sections such as Abstract, Methodology, Results and
                  Conclusion.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80">
                <Cpu className="h-5 w-5 text-white" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  AI Research Assistant
                </h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Ask questions, summarize findings, compare research papers,
                  and generate literature reviews with contextual AI responses.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80">
                <Database className="h-5 w-5 text-white" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  Secure Project Workspace
                </h4>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  Organize research into isolated projects with PostgreSQL-backed
                  storage, document management, and persistent conversations.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  )
}