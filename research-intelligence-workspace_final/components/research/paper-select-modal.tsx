"use client"

import { X, Check, FileText, GitCompare } from "lucide-react"
import { useEffect, useState } from "react"
import type { Paper } from "@/lib/research-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  actionLabel: string
  papers: Paper[]
  /** papers active for retrieval, used as the default selection */
  defaultSelectedIds: string[]
  onCancel: () => void

}

export function PaperSelectModal({
  open,
  actionLabel,
  papers,
  defaultSelectedIds,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<string[]>(defaultSelectedIds)

  // Reset selection whenever the modal is (re)opened
  useEffect(() => {
    if (open) setSelected(defaultSelectedIds)
  }, [open, defaultSelectedIds])

  if (!open) return null

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const allSelected = selected.length === papers.length && papers.length > 0
  const canCompare = selected.length >= 2

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onCancel} aria-hidden />

      <div className="relative z-10 flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <GitCompare className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">{actionLabel}</h2>
              <p className="text-[11px] text-muted-foreground">
                Choose which papers to include in this comparison
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        {/* Select all */}
        <div className="flex items-center justify-between px-5 py-2.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            {selected.length} of {papers.length} selected
          </span>
          <button
            onClick={() => setSelected(allSelected ? [] : papers.map((p) => p.id))}
            className="text-[11px] font-medium text-primary hover:underline"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-2">
          {papers.map((p) => {
            const checked = selected.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  checked ? "border-primary/40 bg-accent" : "border-border bg-background hover:bg-accent/50",
                )}
                aria-pressed={checked}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                  )}
                >
                  {checked ? <Check className="size-3.5" /> : null}
                </span>
                <span
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-primary-foreground"
                  style={{ background: p.color }}
                >
                  <FileText className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{p.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {p.authors[0]} et al. · {p.year} · {p.venue}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5">
          <p className="text-[11px] text-muted-foreground">
            {canCompare ? "Ready to compare" : "Select at least 2 papers"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
