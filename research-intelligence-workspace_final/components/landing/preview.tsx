import Image from "next/image";

export function Preview() {
  return (
    <section
      id="preview"
      className="mx-auto max-w-7xl px-6 py-28"
    >
      <div className="mx-auto mb-14 max-w-3xl text-center">

        <p className="mb-3 font-medium text-primary">
          Workspace Preview
        </p>

        <h2 className="text-4xl font-bold tracking-tight">
          Built for focused research.
        </h2>

        <p className="mt-5 text-muted-foreground">
          Organize projects, upload papers, chat with your documents,
          compare publications, and generate literature reviews—all
          from one workspace.
        </p>

      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">

        {/* Background glow */}

        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent" />

        {/* Screenshot */}

        <Image
          src="/workspace-preview.png"
          alt="TinyRetriever Workspace"
          width={1600}
          height={900}
          className="relative w-full"
          priority
        />

      </div>
    </section>
  );
}