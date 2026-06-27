import { useEffect, useState } from "react"

type Paper = {
  id: string
  title: string
}

type ResearchAction = {
  id: string
  label: string
  endpoint: string
  defaultQuestion: string
}

type Props = {
  open: boolean
  action: ResearchAction | null
  papers: Paper[]
  selectedPaperIds: string[]
  loading?: boolean
  onClose: () => void
  onGenerate: (
    paperIds: string[],
    instructions: string
  ) => void
}

export function ResearchActionModal({
  open,
  action,
  papers,
  selectedPaperIds,
  loading = false,
  onClose,
  onGenerate,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [instructions, setInstructions] = useState("")

  useEffect(() => {
    if (open) {
      setSelected(selectedPaperIds)
      setInstructions("")
    }
  }, [open, selectedPaperIds])

  if (!open || !action) return null

  const togglePaper = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl border bg-background shadow-xl">

        {/* Header */}
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            {action.label}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select papers and optionally provide additional instructions.
          </p>
        </div>

        {/* Body */}
        <div className="space-y-6 p-5">

          {/* Papers */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Selected Papers
            </label>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">

              {papers.map((paper) => (
                <label
                  key={paper.id}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(paper.id)}
                    onChange={() => togglePaper(paper.id)}
                  />

                  <span className="text-sm">
                    {paper.title}
                  </span>
                </label>
              ))}

            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Additional Instructions
            </label>

            <textarea
              rows={4}
              value={instructions}
              onChange={(e) =>
                setInstructions(e.target.value)
              }
              placeholder="Optional... (e.g. Focus on methodology, compare computational complexity, highlight research gaps)"
              className="w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-5">

          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            disabled={
              loading || selected.length === 0
            }
            onClick={() =>
              onGenerate(selected, instructions)
            }
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>

        </div>

      </div>
    </div>
  )
}