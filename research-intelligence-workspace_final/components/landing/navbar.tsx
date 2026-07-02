import { FaGithub } from 'react-icons/fa';
import { Moon} from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="logo-font flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-lg">
            T
          </div>


          <div>
            <h1 className="font-[family:var(--font-allura)] text-3xl text-primary">
              TinyRetriever
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Features
          </a>

          <a
            href="#workflow"
            className="transition-colors hover:text-foreground"
          >
            Workflow
          </a>

          <a
            href="#preview"
            className="transition-colors hover:text-foreground"
          >
            Preview
          </a>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle (placeholder) */}
          <button className="rounded-lg border border-border p-2 transition-colors hover:bg-accent">
            <Moon className="h-4 w-4" />
          </button>

          {/* GitHub */}
          <button className="rounded-lg border border-border p-2 transition-colors hover:bg-accent">
            <FaGithub className="h-4 w-4" />
          </button>

          {/* Login */}
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Get Started
          </button>

        </div>

      </div>
    </header>
  );
}