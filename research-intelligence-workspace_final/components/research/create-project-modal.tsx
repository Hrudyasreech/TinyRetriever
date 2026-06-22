"use client"

import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  projectName: string
  projectDescription: string
  setProjectName: (name: string) => void
  setProjectDescription: (desc: string) => void
  onCancel: () => void
  onCreate: () => void
}

export function CreateProjectModal({
  open,
  projectName,
  projectDescription,
  setProjectName,
  setProjectDescription,
  onCancel,
  onCreate,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-xl font-semibold">
          Create New Project
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a workspace for your research papers.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Project Name
            </label>

            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Research on Computer Vision"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Store and analyze papers related to..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            onClick={onCreate}
            disabled={!projectName.trim()}
          >
            Create Project
          </Button>
        </div>
      </div>
    </div>
  )
}