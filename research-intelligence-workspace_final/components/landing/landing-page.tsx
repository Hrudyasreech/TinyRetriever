import { Navbar } from "./navbar"
import { Hero } from "./hero"
import {Features} from "./features"
import { Preview} from "./preview"
import { NeuralBackground } from "../neural-background"

export default function LandingPage() {
  return (
    // Keep bg-transparent here so the layout color comes from the layout body, allowing the canvas to show
    <div className="relative min-h-screen bg-transparent overflow-x-hidden">
      {/* Live animated backdrop sitting safely at -z-10 */}
      <NeuralBackground />

      {/* Structural wrapper forcing content explicitly above the canvas */}
      <div className="relative z-10 w-full">
        <Navbar />
        <Hero />
        <Features />
        <Preview />
      </div>
    </div>
  )
}