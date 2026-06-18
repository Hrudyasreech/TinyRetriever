import fitz
import re

pdf = fitz.open(r"C:\Users\hrudy\Downloads\sensors-25-06629-v2.pdf")
text = ""
for page in pdf:
    text += page.get_text()

SECTION_MARKERS = {
    "abstract": [
        r"abstract"
    ],

    "keywords": [
        r"index terms",
        r"keywords"
    ],

    "introduction": [
        r"introduction"
    ],

    "background": [
        r"background",
        r"background study"
    ],

    "literature_review": [
        r"literature review",
        r"review of literature",
        r"survey of literature",
        r"literature survey"
    ],

    "related_work": [
        r"related work",
        r"related studies",
        r"previous work"
    ],

    "problem_statement": [
        r"problem statement",
        r"motivation"
    ],

    "methodology": [
        r"methodology",
        r"research methodology",
        r"proposed methodology"
    ],

    "system_design": [
        r"system design",
        r"system architecture",
        r"design and implementation"
    ],

    "implementation": [
        r"implementation",
        r"implementation details"
    ],

    "experimental_setup": [
        r"experimental setup",
        r"experimental design"
    ],

    "results": [
        r"^\s*IV\.\s+Results",
        r"experimental results",
        r"evaluation",
        r"performance evaluation",
        r"performance analysis"
    ],

    "discussion": [
        r"discussion",
        r"analysis and discussion",
        r"results and discussion"
    ],

    "future_work": [
        r"future work",
        r"future scope"
    ],

    "conclusion": [
        r"conclusion",
        r"discussion and conclusion",
        r"conclusion and future work"
    ],

    "references": [
        r"references",
        r"bibliography"
    ],

    "appendix": [
        r"appendix"
    ]
}

def find_sections(text):
    matches = []
    for name, patterns in SECTION_MARKERS.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                matches.append((name, match.start()))
                break
    matches.sort(key=lambda x: x[1])
    return matches

def split_sections(text):
    positions = find_sections(text)
    sections = {}
    sections["metadata"] = text[:positions[0][1]]
    for i in range(len(positions)):
        name = positions[i][0]
        start = positions[i][1]
        if i < len(positions) - 1:
            end = positions[i + 1][1]
        else:
            end = len(text)
        sections[name] = text[start:end]
    return sections

sections = split_sections(text)
print(sections.keys())





