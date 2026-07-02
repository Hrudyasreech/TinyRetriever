"use client"

import {
  Upload,
  FileText,
  Users,
  Calendar,
  BookMarked,
  Hash,
  Link2,
  Quote,
  ChevronDown,
  GitCompare,
  BarChart3,
  Database,
  TriangleAlert,
  Telescope,
  AlignLeft,
  Sparkles,
  X,
  Loader2,
  Check,
  PanelRightClose,
  type LucideIcon,
  Trash2,
} from "lucide-react"
import { useState, useRef } from "react"
import type { Paper } from "@/lib/research-data"
import { quickActions } from "@/lib/research-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/client"

const actionIcons: Record<string, LucideIcon> = {
  GitCompare,
  BarChart3,
  Database,
  TriangleAlert,
  Telescope,
  FileText,
  AlignLeft,
  Sparkles,
}
type QuickAction = (typeof quickActions)[number]

type Props = {
  papers: Paper[]
  projectId: string
  onAction: (action: QuickAction) => void
  onClose?: () => void
  onUploadSuccess?: () => Promise<void>
  /** ids of papers active for retrieval / question answering */
  activePaperIds: string[]
  onToggleActive: (id: string) => void
  /** collapse the panel on desktop */
  onCollapse?: () => void
  onDeletePaper: (id: string) => void
}

export function ContextPanel({
  papers,
  projectId,
  onAction,
  onUploadSuccess,
  onClose,
  activePaperIds,
  onToggleActive,
  onCollapse,
  onDeletePaper,
}: Props) {
  const [selectedId, setSelectedId] = useState(papers[0]?.id)
  const selected = papers.find((p) => p.id === selectedId) ?? papers[0]
  const activeCount = papers.filter((p) => activePaperIds.includes(p.id)).length
  const fileInputRef = useRef<HTMLInputElement>(null)
  const totalCitations = papers.reduce((s, p) => s + p.citations, 0)
  const yearRange = papers.length
    ? `${Math.min(...papers.map((p) => p.year))}–${Math.max(...papers.map((p) => p.year))}`
    : "—"
  const keywords = Array.from(new Set(papers.flatMap((p) => p.keywords)))
  const handleUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0]

      if (!file) return

      const formData = new FormData()
      formData.append("file", file)
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/upload/?project_id=${projectId}`,
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        )

        const data = await response.json()

        console.log(data)
        alert("PDF uploaded successfully!")
        await onUploadSuccess?.()
      } catch (err) {
        console.error(err)
        alert("Upload failed")
      }
    }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-sidebar">
      <div className="flex items-center justify-between gap-2 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Research Context</h2>
          <p className="text-[11px] text-muted-foreground">Sources & insights</p>
        </div>
        <div className="flex items-center gap-1">
          {onCollapse ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCollapse}
              className="hidden xl:inline-flex"
              aria-label="Collapse panel"
            >
              <PanelRightClose className="size-4" />
            </Button>
          ) : null}
          {onClose ? (
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="xl:hidden" aria-label="Close panel">
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Papers" value={String(papers.length)} />
          <Stat label="Citations" value={formatCount(totalCitations)} />
          <Stat label="Span" value={yearRange} />
        </div>

        {/* Upload */}
        <>
          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            onChange={handleUpload}
            hidden
          />

          <Button
            variant="outline"
            className="w-full justify-center gap-2 border-dashed py-5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Upload papers
          </Button>
        </>

        {/* Papers list */}
        <Section title="Uploaded Papers" badge={`${activeCount}/${papers.length} active`}>
          <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
            Toggle which papers are active for retrieval and question answering.
          </p>
          <div className="space-y-1.5">
            {papers.map((p) => {
              const viewing = p.id === selected?.id
              const isActive = activePaperIds.includes(p.id)
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-2 py-2.5 transition-colors",
                    viewing
                      ? "border-primary/40 bg-accent"
                      : "border-border bg-card hover:bg-accent/50",
                    !isActive && "opacity-60",
                  )}
                >
                  <button
                    onClick={() => onToggleActive(p.id)}
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card",
                    )}
                    aria-pressed={isActive}
                    aria-label={isActive ? `Deactivate ${p.title}` : `Activate ${p.title}`}
                  >
                    {isActive ? <Check className="size-3.5" /> : null}
                  </button>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                  >
                    <span
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-primary-foreground"
                      style={{ background: p.color }}
                    >
                      <FileText className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{p.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {p.authors[0]} et al. · {p.year}
                      </span>
                    </span>
                    {p.status === "processing" ? (
                      <Loader2 className="mt-1 size-3.5 shrink-0 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                  <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeletePaper(p.id)
                  }}
                  className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Selected paper metadata */}
        {selected ? (
          <Section title="Paper Metadata">
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
              <h3 className="text-sm font-semibold leading-snug text-balance">{selected.title}</h3>
              {selected.status === "processing" ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  <Loader2 className="size-3 animate-spin" /> Extracting metadata…
                </span>
              ) : null}

              <dl className="mt-3 space-y-2.5">
                <MetaRow icon={Users} label="Authors">
                  {selected.authors.join(", ")}
                </MetaRow>
                <MetaRow icon={Calendar} label="Year">
                  {String(selected.year)}
                </MetaRow>
                <MetaRow icon={BookMarked} label="Venue">
                  {selected.venue}
                </MetaRow>
                <MetaRow icon={Link2} label="DOI">
                  <span className="break-all text-primary">{selected.doi}</span>
                </MetaRow>
                <MetaRow icon={Quote} label="Citations">
                  {selected.citations.toLocaleString()}
                </MetaRow>
              </dl>

              <div className="mt-3 border-t border-border pt-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <Hash className="size-3" /> Keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <details className="group mt-3 border-t border-border pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  Abstract
                  <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {selected.abstract}
                </p>
              </details>
            </div>
          </Section>
        ) : null}

        {/* Collection keywords / stats */}
        <Section title="Research Statistics">
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, 10).map((k) => (
                <span
                  key={k}
                  className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] text-accent-foreground"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </Section>

        {/* Quick actions */}
        <Section title="Quick Research Actions">
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((a) => {
              const Icon = actionIcons[a.icon] ?? Sparkles

              return (
                <button
                  key={a.id}
                  onClick={() => onAction(a)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <Icon className="size-5 text-primary" />

                  <span className="text-sm font-medium">
                    {a.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>
      </div>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2.5 text-center shadow-sm">
      <p className="text-base font-semibold tracking-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  )
}

function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {badge ? (
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] text-muted-foreground">{label}</dt>
        <dd className="text-xs font-medium leading-relaxed">{children}</dd>
      </div>
    </div>
  )
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}
