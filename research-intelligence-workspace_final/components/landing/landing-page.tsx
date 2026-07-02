import { Navbar } from "./navbar"
import { Hero } from "./hero"
import {Features} from "./features"
import { Preview} from "./preview"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <Preview />
    </main>
  )
}