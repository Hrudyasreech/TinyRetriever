METHOD_KEYWORDS = [
    "method",
    "methodology",
    "approach",
    "algorithm",
    "architecture",
    "framework",
    "implementation",
    "pipeline",
    "workflow",
    "design",
    "system",
    "technique",
    "proposed method",
    "proposed approach",
    "solve",
    "solves",
    "solution",
]

RESULT_KEYWORDS = [
    "result",
    "results",
    "accuracy",
    "precision",
    "recall",
    "f1",
    "performance",
    "evaluation",
    "experiment",
    "experiments",
    "benchmark",
    "comparison",
    "achieved",
    "validated",
    "validate",
    "validated",
    "validation",
    "claims",
]

ABSTRACT_KEYWORDS = [
    "abstract",
    "summary",
    "summarize",
    "objective",
    "overview",
    "main idea",
    "paper about",
    "research about",
    "problem",
    "research problem",
    "addresses",
    "address",
    "paper about",
]

CONCLUSION_KEYWORDS = [
    "conclusion",
    "future work",
    "takeaway",
    "findings",
    "final thoughts",
    "ultimately",
    "key findings",
    "findings",
]

INTRO_KEYWORDS = [
    "motivation",
    "background",
    "research gap",
    "why",
    "problem statement",
    "important",
    "importance",
    "significance",
    "motivation",
    "why",
]

DISCUSSION_KEYWORDS = [
    "limitation",
    "limitations",
    "drawback",
    "weakness",
    "challenge",
]

METADATA_KEYWORDS = [
    "author",
    "authors",
    "written by",
    "title",
    "paper title",
    "publication",
    "published",
    "journal",
    "conference",
    "doi",
    "isbn",
    "volume",
    "issue",
    "affiliation",
    "institution",
    "publisher",
    "publication year",
    "published year",
]


REFERENCE_KEYWORDS = [
    "references",
    "reference list",
    "bibliography",
    "citations",
    "works cited",
    "sources",
    "related work",
    "cited papers",
    "cited works"
]

SECTION_DESCRIPTIONS = {

    "metadata": """
    Metadata section.

    Users asking questions such as:
    Who are the authors?
    What is the title of the paper?
    When was the paper published?
    Which journal or conference published this paper?
    What is the DOI?

    This section contains bibliographic information about the paper,
    including the title, authors, affiliations, publication year,
    journal or conference name, publisher, DOI, ISBN,
    keywords, citation information, and other publication details.
    """,

    "abstract": """
    Abstract section.

    Users asking questions such as:
    What is this paper about?
    What is the objective of the paper?
    Give a summary of the paper.
    What problem does the paper address?
    What are the main contributions?

    This section provides a concise overview of the research,
    including the motivation, research problem, objectives,
    proposed solution, major contributions,
    and a brief summary of the overall work.
    """,

    "introduction": """
    Introduction section.

    Users asking questions such as:
    Why was this research conducted?
    What is the motivation behind this work?
    What problem is being solved?
    Why is this research important?
    What research gap does this paper address?

    This section introduces the research topic,
    explains the background and motivation,
    describes the existing challenges,
    identifies the research gap,
    defines the problem statement,
    and explains the objectives and significance of the study.
    """,

    "methodology": """
    Methodology section.

    Users asking questions such as:
    What methodology is used?
    How does the proposed method work?
    Which algorithm is used?
    Describe the implementation.
    Explain the architecture.
    What techniques are used?
    How was the model trained?
    Describe the workflow.
    Explain the experimental setup.

    This section explains how the research was carried out.
    It describes the proposed methodology,
    algorithms,
    system architecture,
    framework,
    implementation details,
    workflow,
    model design,
    data preprocessing,
    feature extraction,
    optimization techniques,
    experimental setup,
    training procedure,
    and the complete research process.
    """,

    "results": """
    Results section.

    Users asking questions such as:
    What are the results?
    How accurate is the model?
    What experiments were performed?
    How does the proposed method perform?
    What evaluation metrics were used?
    Compare the results with other methods.

    This section presents the experimental findings,
    evaluation results,
    performance analysis,
    accuracy,
    precision,
    recall,
    F1-score,
    benchmark comparisons,
    testing results,
    graphs,
    tables,
    quantitative analysis,
    and other observations demonstrating the effectiveness of the proposed method.
    """,

    "discussion": """
    Discussion section.

    Users asking questions such as:
    What are the limitations?
    What challenges were encountered?
    Discuss the findings.
    What are the strengths and weaknesses?
    Why were these results obtained?

    This section interprets and analyzes the experimental results.
    It discusses the strengths,
    weaknesses,
    limitations,
    challenges,
    practical implications,
    observations,
    error analysis,
    reasons behind the results,
    and the significance of the findings.
    """,

    "conclusion": """
    Conclusion section.

    Users asking questions such as:
    What is the conclusion?
    Summarize the findings.
    What are the key contributions?
    What is the future work?
    What are the final takeaways?

    This section summarizes the overall research,
    highlights the key findings,
    discusses the contributions,
    presents the conclusions,
    suggests future work,
    future scope,
    recommendations,
    and the final outcomes of the study.
    """,

    "references": """
    References section.

    Users asking questions such as:
    Which papers are cited?
    Show the references.
    What is the bibliography?
    What sources were used?

    This section contains the bibliography and citation list,
    including all referenced papers,
    books,
    articles,
    websites,
    reports,
    and other sources that support the research.
    """
}

SECTION_EXAMPLES = {

    "metadata": [
        "Who wrote the paper?",
        "Who are the authors?",
        "What is the title of the paper?",
        "Which journal published this paper?",
        "When was this paper published?",
        "What is the DOI?"
    ],

    "abstract": [
        "Summarize this paper.",
        "What is the paper about?",
        "What is the objective of the paper?",
        "Give an overview of the research.",
        "What problem does this paper address?"
    ],

    "methodology": [
        "What methodology is used?",
        "Explain the proposed approach.",
        "How does the method work?",
        "Describe the algorithm.",
        "Explain the implementation.",
        "How was the model trained?",
        "Describe the workflow.",
        "What architecture is proposed?",
        "Explain the experimental setup."
    ],

    "results": [
        "What are the results?",
        "How well did the model perform?",
        "What accuracy was achieved?",
        "What experiments were conducted?",
        "Compare the performance.",
        "What are the evaluation metrics?"
    ],

    "discussion": [
        "What are the limitations?",
        "Discuss the findings.",
        "What challenges were encountered?",
        "What are the drawbacks?",
        "Interpret the results."
    ],

    "conclusion": [
        "What is the conclusion?",
        "Summarize the findings.",
        "What is the future work?",
        "What are the key contributions?",
        "What are the takeaways?"
    ],

    "references": [
        "Which papers are cited?",
        "Show the references.",
        "What is the bibliography?",
        "List the cited works."
    ]
}