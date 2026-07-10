"use client"

import { useEffect, useRef } from "react"

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
    }> = []

    // Adjust particle count based on screen size
    const getParticleCount = () => {
      if (window.innerWidth < 640) return 40
      if (window.innerWidth < 1024) return 80
      return 120
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      const count = getParticleCount()
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.6, // Movement speed X
          vy: (Math.random() - 0.5) * 0.6, // Movement speed Y
          radius: Math.random() * 1.5 + 1,
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Determine color opacity based on dark/light mode presence 
      // Using a subtle white/gray hue for dark mode backgrounds
      const isDark = document.documentElement.classList.contains("dark") || true 
      const particleColor = isDark ? "rgba(255, 255, 255," : "rgba(0, 0, 0,"
      const maxDistance = 120

      // Update and draw nodes
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        // Bounce off walls
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `${particleColor} 0.3)`
        ctx.fill()
      })

      // Draw connections (synapses/links)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDistance) {
            // Fades lines out smoothly the further apart they get
            const alpha = (1 - dist / maxDistance) * 0.12
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `${particleColor} ${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    draw()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full bg-transparent"
    />
  )
}