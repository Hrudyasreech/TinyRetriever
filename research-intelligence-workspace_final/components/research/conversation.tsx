"use client"

import {
  ArrowUp,
  Sparkles,
  Quote,
  FileText,
  GitCompare,
  AlignLeft,
  Layers,
  PanelLeft,
  PanelRight,
  Paperclip,
  BookOpen,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { Chat, Message, Paper } from "@/lib/research-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const cardKindMeta: Record<
  NonNullable<Message["card"]>["kind"],
  { icon: typeof Sparkles; label: string }
> = {
  synthesis: { icon: Sparkles, label: "Synthesis" },
  comparison: { icon: GitCompare, label: "Comparison" },
  summary: { icon: AlignLeft, label: "Summary" },
  review: { icon: FileText, label: "Literature Review" },
}

type Props = {
  chat: Chat
  papers: Paper[]
  projectName: string
  onSend: (text: string) => void
  onToggleLeft: () => void
  onToggleRight: () => void
  /** number of papers active for retrieval */
  activeCount: number
}

export function Conversation({
  chat,
  papers,
  projectName,
  onSend,
  onToggleLeft,
  onToggleRight,
  activeCount,
}: Props) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [chat.messages.length, chat.id])

  function submit() {
    if (!input.trim()) return
    onSend(input.trim())
    setInput("")
  }

  const paperById = (id: string) => papers.find((p) => p.id === id)

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
        <Button variant="ghost" size="icon-sm" onClick={onToggleLeft} className="lg:hidden" aria-label="Toggle sidebar">
          <PanelLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold tracking-tight">{chat.title}</h1>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <BookOpen className="size-3" />
            {projectName} · {activeCount} of {papers.length} sources active
          </p>
        </div>
        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
          <Layers className="size-3.5" />
          Sources
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onToggleRight} className="xl:hidden" aria-label="Toggle context panel">
          <PanelRight className="size-4" />
        </Button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {chat.messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-6">
              {chat.messages.map((m) =>
                m.role === "user" ? (
                  <UserMessage key={m.id} message={m} />
                ) : (
                  <AssistantMessage key={m.id} message={m} paperById={paperById} />
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background px-4 pb-4 pt-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={1}
              placeholder="Ask anything about your papers, or compare them…"
              className="max-h-40 min-h-9 w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Attach paper">
                  <Paperclip className="size-4" />
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  Grounded in {activeCount} active {activeCount === 1 ? "paper" : "papers"}
                </span>
              </div>
              <Button size="icon" onClick={submit} disabled={!input.trim()} aria-label="Send">
                <ArrowUp className="size-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Responses cite source sections. Always verify critical claims.
          </p>
        </div>
      </div>
    </section>
  )
}

function EmptyState() {
  const samples = [
    "Compare the methodologies across all papers",
    "What datasets do these works evaluate on?",
    "Summarize the key contributions",
    "Draft a literature review introduction",
  ]
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Sparkles className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-balance">
        Start a research conversation
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
        Ask questions across your entire paper collection. Every answer is grounded in your
        uploaded sources.
      </p>
      <div className="mt-6 grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {samples.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-border bg-card px-3.5 py-3 text-left text-sm text-muted-foreground shadow-sm"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
        {message.content}
      </div>
    </div>
  )
}

function AssistantMessage({
  message,
  paperById,
}: {
  message: Message
  paperById: (id: string) => Paper | undefined
}) {
  const meta = message.card ? cardKindMeta[message.card.kind] : null
  const Icon = meta?.icon ?? Sparkles

  let comparison = undefined
  if (message.message_type === "compare") {
    const table = message.content.comparison_table

    const columns = Object.keys(table[0]).filter(
      (key) => key !== "Attribute"
    )

    comparison = {
      columns,
      rows: table.map((row: any) => ({
        label: row.Attribute,
        values: columns.map((col) => row[col] ?? "Not Reported"),
      })),
      similarities: message.content.similarities,
      differences: message.content.differences,
      key_takeaways: message.content.key_takeaways,
    }
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Sparkles className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden rounded-2xl rounded-tl-md border border-border bg-card shadow-sm">
        {message.card ? (
          <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
            <Icon className="size-4 text-primary" />
            <span className="text-sm font-semibold">{message.card.title}</span>
            <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
              {meta?.label}
            </span>
          </div>
        ) : null}

        <div className="px-4 py-3.5">
          {message.message_type === "compare" && comparison ? (
            <ComparisonTable comparison={comparison} />
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.citations?.length ? (
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                <Quote className="size-3" />
                Sources
              </p>

              {message.citations.map((c, i) => {
                const paper = paperById(c.paperId)

                return (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: paper?.color }}
                      />
                      <span className="truncate text-xs font-semibold">
                        {paper?.title}
                      </span>

                      <span className="ml-auto shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                        p.{c.page}
                      </span>
                    </div>

                    <p className="mt-1.5 border-l-2 border-primary/40 pl-2.5 text-xs italic leading-relaxed text-muted-foreground">
                      "{c.snippet}"
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {c.label} · {c.section}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ComparisonTable({
  comparison,
}: {
  comparison: NonNullable<Message["comparison"]>
}) {
  return (
    <div className="mt-4 space-y-6">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-left text-[11px]">
          <thead>
            <tr className="bg-secondary/60">
              <th className="px-3 py-2 font-semibold text-muted-foreground">
                Dimension
              </th>

              {comparison.columns.map((col) => (
                <th key={col} className="px-3 py-2 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {comparison.rows.map((row) => (
              <tr
                key={row.label}
                className="border-t border-border align-top"
              >
                <td className="w-40 px-3 py-2 font-medium text-muted-foreground">
                  {row.label}
                </td>

                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className="px-3 py-2 leading-relaxed text-foreground/90"
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Key Takeaways
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {comparison.key_takeaways}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Similarities
        </h3>

        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {comparison.similarities.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Differences
        </h3>

        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {comparison.differences.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
