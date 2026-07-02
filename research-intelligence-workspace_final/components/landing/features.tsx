import {
  Brain,
  FileText,
  Search,
  GitCompare,
  BookOpen,
  Database,
} from "lucide-react";

import { FeatureCard } from "./feature-card";

export function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-28 text-zinc-100"
    >
      <div className="mx-auto mb-16 max-w-2xl text-center">
        {/* Subtle, modern section chip wrapper */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Features
        </p>

        {/* High contrast tracking heading */}
        <h2 className="mb-5 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent sm:text-5xl">
          Research Faster. Understand Better.
        </h2>

        {/* Enhanced grey readability mapping */}
        <p className="text-zinc-400 max-w-lg mx-auto text-base leading-relaxed">
          Everything you need to organize, explore and analyze
          research papers in one intelligent workspace.
        </p>
      </div>

      {/* Grid container with balanced gap distribution */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          icon={FileText}
          title="Project-Based Organization"
          description="Group research papers into dedicated projects with persistent conversations and document management."
        />

        <FeatureCard
          icon={Search}
          title="Hybrid Retrieval"
          description="Combines semantic search with lexical matching to retrieve highly relevant information from your research collection."
        />

        <FeatureCard
          icon={Brain}
          title="Section-Aware AI"
          description="Understands academic structure and retrieves information from Abstract, Methodology, Results and Conclusion."
        />

        <FeatureCard
          icon={GitCompare}
          title="Paper Comparison"
          description="Compare methodologies, datasets, findings and contributions across multiple research papers."
        />

        <FeatureCard
          icon={BookOpen}
          title="Literature Reviews"
          description="Generate structured literature reviews grounded in your uploaded research papers."
        />

        <FeatureCard
          icon={Database}
          title="Secure Workspace"
          description="Powered by PostgreSQL with project isolation, persistent storage and authenticated access."
        />
      </div>
    </section>
  );
}