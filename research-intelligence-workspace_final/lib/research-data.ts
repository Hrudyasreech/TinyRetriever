export type Paper = {
  id: string
  title: string
  authors: string[]
  year: number
  venue: string
  doi: string
  keywords: string[]
  abstract: string
  citations: number
  pages: number
  status: "processed" | "processing"
  color: string
}

export type Citation = {
  paperId: string
  label: string
  snippet: string
  section: string
  page: number
}

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: Citation[]
  card?: {
    title: string
    kind: "synthesis" | "comparison" | "summary" | "review"
  }
  comparison?: {
    columns: string[]
    rows: { label: string; values: string[] }[]
  }
  timestamp?: string
}

export type Chat = {
  id: string
  title: string
  updated: string
  messages: Message[]
}

export type Project = {
  id: string
  name: string
  emoji: string
  description: string
  papers: Paper[]
  chats: Chat[]
}

export const projects: Project[] = [
  {
    id: "p1",
    name: "Efficient Transformers",
    emoji: "🧠",
    description: "Survey of attention efficiency techniques",
    papers: [
      {
        id: "pa1",
        title: "Attention Is All You Need",
        authors: ["A. Vaswani", "N. Shazeer", "N. Parmar", "J. Uszkoreit"],
        year: 2017,
        venue: "NeurIPS",
        doi: "10.48550/arXiv.1706.03762",
        keywords: ["attention", "transformer", "sequence modeling"],
        abstract:
          "We propose the Transformer, a model architecture relying entirely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        citations: 112430,
        pages: 15,
        status: "processed",
        color: "oklch(0.52 0.17 258)",
      },
      {
        id: "pa2",
        title: "Longformer: The Long-Document Transformer",
        authors: ["I. Beltagy", "M. E. Peters", "A. Cohan"],
        year: 2020,
        venue: "arXiv",
        doi: "10.48550/arXiv.2004.05150",
        keywords: ["sparse attention", "long context", "efficiency"],
        abstract:
          "Longformer introduces an attention mechanism that scales linearly with sequence length, making it easy to process long documents.",
        citations: 4820,
        pages: 17,
        status: "processed",
        color: "oklch(0.62 0.13 220)",
      },
      {
        id: "pa3",
        title: "FlashAttention: Fast and Memory-Efficient Exact Attention",
        authors: ["T. Dao", "D. Y. Fu", "S. Ermon", "A. Rudra"],
        year: 2022,
        venue: "NeurIPS",
        doi: "10.48550/arXiv.2205.14135",
        keywords: ["IO-aware", "GPU kernels", "exact attention"],
        abstract:
          "FlashAttention is an IO-aware exact attention algorithm that uses tiling to reduce memory reads/writes between GPU HBM and SRAM.",
        citations: 6120,
        pages: 16,
        status: "processed",
        color: "oklch(0.68 0.12 180)",
      },
      {
        id: "pa4",
        title: "Reformer: The Efficient Transformer",
        authors: ["N. Kitaev", "Ł. Kaiser", "A. Levskaya"],
        year: 2020,
        venue: "ICLR",
        doi: "10.48550/arXiv.2001.04451",
        keywords: ["LSH attention", "reversible layers"],
        abstract:
          "Reformer reduces the complexity of attention from quadratic to linearithmic using locality-sensitive hashing and reversible residual layers.",
        citations: 3210,
        pages: 12,
        status: "processing",
        color: "oklch(0.7 0.13 80)",
      },
    ],
    chats: [
      {
        id: "c1",
        title: "Compare attention efficiency methods",
        updated: "2h ago",
        messages: [
          {
            id: "m1",
            role: "user",
            content:
              "How do these papers reduce the quadratic cost of attention? Compare their core methodologies.",
          },
          {
            id: "m2",
            role: "assistant",
            card: { title: "Methodology Comparison", kind: "comparison" },
            content:
              "Across the collection, three distinct strategies emerge for reducing attention cost. Longformer and Reformer change the *attention pattern* itself, while FlashAttention keeps exact attention but optimizes the *hardware execution*. Below is a structured comparison of how each work approaches efficiency.",
            comparison: {
              columns: ["Longformer", "FlashAttention", "Reformer"],
              rows: [
                {
                  label: "Core technique",
                  values: ["Sliding-window + global sparse attention", "IO-aware tiling of exact attention", "LSH bucketing + reversible layers"],
                },
                {
                  label: "Complexity",
                  values: ["O(n)", "O(n²) compute, O(n) memory", "O(n log n)"],
                },
                {
                  label: "Exactness",
                  values: ["Approximate", "Exact", "Approximate"],
                },
                {
                  label: "Best for",
                  values: ["Long documents", "GPU training speed", "Very long sequences"],
                },
              ],
            },
            citations: [
              {
                paperId: "pa2",
                label: "Longformer §3.2",
                snippet:
                  "Our attention pattern combines a windowed local-context self-attention and an end task motivated global attention.",
                section: "Attention Pattern",
                page: 4,
              },
              {
                paperId: "pa3",
                label: "FlashAttention §3",
                snippet:
                  "We compute attention by tiling Q, K, V into blocks that fit in fast SRAM, avoiding materializing the full attention matrix.",
                section: "Algorithm",
                page: 5,
              },
            ],
          },
          {
            id: "m3",
            role: "user",
            content: "Which one should I use for training a model on 16k-token documents on a single GPU?",
          },
          {
            id: "m4",
            role: "assistant",
            card: { title: "Recommendation", kind: "synthesis" },
            content:
              "For 16k-token documents on a single GPU, FlashAttention is the strongest default: it preserves exact attention quality while cutting memory from quadratic to linear, which is your real constraint at that length. If you later push toward 64k+ tokens and can tolerate approximation, layering Longformer's sliding-window pattern on top yields further gains.",
            citations: [
              {
                paperId: "pa3",
                label: "FlashAttention §4.1",
                snippet:
                  "FlashAttention trains Transformers faster than existing baselines and enables longer context, improving model quality.",
                section: "Experiments",
                page: 7,
              },
            ],
          },
        ],
      },
      {
        id: "c2",
        title: "Summarize FlashAttention contributions",
        updated: "Yesterday",
        messages: [
          {
            id: "m5",
            role: "user",
            content: "Extract the key contributions of FlashAttention.",
          },
          {
            id: "m6",
            role: "assistant",
            card: { title: "Key Contributions", kind: "summary" },
            content:
              "FlashAttention makes three primary contributions: (1) an IO-aware exact attention algorithm that minimizes HBM↔SRAM data movement through tiling, (2) a memory footprint that scales linearly rather than quadratically with sequence length, and (3) measurable end-to-end training speedups across BERT, GPT-2, and long-range benchmarks.",
            citations: [
              {
                paperId: "pa3",
                label: "FlashAttention §1",
                snippet:
                  "We argue that a missing principle is making attention algorithms IO-aware — accounting for reads and writes between levels of GPU memory.",
                section: "Introduction",
                page: 1,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    name: "Protein Folding",
    emoji: "🧬",
    description: "Deep learning for structure prediction",
    papers: [
      {
        id: "pb1",
        title: "Highly accurate protein structure prediction with AlphaFold",
        authors: ["J. Jumper", "R. Evans", "A. Pritzel"],
        year: 2021,
        venue: "Nature",
        doi: "10.1038/s41586-021-03819-2",
        keywords: ["protein folding", "structure prediction", "deep learning"],
        abstract:
          "AlphaFold predicts protein structures with atomic accuracy even where no similar structure is known.",
        citations: 28900,
        pages: 12,
        status: "processed",
        color: "oklch(0.6 0.16 25)",
      },
    ],
    chats: [
      {
        id: "c3",
        title: "Literature review draft",
        updated: "3d ago",
        messages: [
          {
            id: "m7",
            role: "user",
            content: "Draft a short literature review on this collection.",
          },
        ],
      },
    ],
  },
]

export const quickActions = [
  { id: "qa1", label: "Compare Methodologies", icon: "GitCompare" },
  { id: "qa2", label: "Compare Results", icon: "BarChart3" },
  { id: "qa3", label: "Compare Datasets", icon: "Database" },
  { id: "qa4", label: "Compare Limitations", icon: "TriangleAlert" },
  { id: "qa5", label: "Compare Future Work", icon: "Telescope" },
  { id: "qa6", label: "Generate Literature Review", icon: "FileText" },
  { id: "qa7", label: "Summarize Papers", icon: "AlignLeft" },
  { id: "qa8", label: "Extract Contributions", icon: "Sparkles" },
] as const
