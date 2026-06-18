import re
SECTION_MARKERS = {

    "abstract": [
        r"^\s*abstract\b"
    ],

    "keywords": [
        r"^\s*(?:index terms|keywords)\b"
    ],

    "introduction": [
        r"^\s*(?:[IVX]+\.\s*)?introduction\b"
    ],

    "background": [
        r"^\s*(?:[IVX]+\.\s*)?background\b",
        r"^\s*(?:[IVX]+\.\s*)?background study\b"
    ],

    "literature_review": [
        r"^\s*(?:[IVX]+\.\s*)?literature review\b",
        r"^\s*(?:[IVX]+\.\s*)?review of literature\b",
        r"^\s*(?:[IVX]+\.\s*)?survey of literature\b",
        r"^\s*(?:[IVX]+\.\s*)?literature survey\b"
    ],

    "related_work": [
        r"^\s*(?:[IVX]+\.\s*)?related work\b",
        r"^\s*(?:[IVX]+\.\s*)?related studies\b",
        r"^\s*(?:[IVX]+\.\s*)?previous work\b"
    ],

    "problem_statement": [
        r"^\s*(?:[IVX]+\.\s*)?problem statement\b",
        r"^\s*(?:[IVX]+\.\s*)?motivation\b"
    ],

    "methodology": [
        r"^\s*(?:[IVX]+\.\s*)?methodology\b",
        r"^\s*(?:[IVX]+\.\s*)?research methodology\b",
        r"^\s*(?:[IVX]+\.\s*)?proposed methodology\b"
    ],

    "system_design": [
        r"^\s*(?:[IVX]+\.\s*)?system design\b",
        r"^\s*(?:[IVX]+\.\s*)?system architecture\b",
        r"^\s*(?:[IVX]+\.\s*)?architecture\b",
        r"^\s*(?:[IVX]+\.\s*)?design and implementation\b"
    ],

    "implementation": [
        r"^\s*(?:[IVX]+\.\s*)?implementation\b",
        r"^\s*(?:[IVX]+\.\s*)?implementation details\b"
    ],

    "experimental_setup": [
        r"^\s*(?:[IVX]+\.\s*)?experimental setup\b",
        r"^\s*(?:[IVX]+\.\s*)?experimental design\b"
    ],

    "results": [
        r"^\s*(?:[IVX]+\.\s*)?results\b",
        r"^\s*(?:[IVX]+\.\s*)?experimental results\b",
        r"^\s*(?:[IVX]+\.\s*)?evaluation\b",
        r"^\s*(?:[IVX]+\.\s*)?performance evaluation\b",
        r"^\s*(?:[IVX]+\.\s*)?performance analysis\b"
    ],

    "discussion": [
        r"^\s*(?:[IVX]+\.\s*)?discussion\b",
        r"^\s*(?:[IVX]+\.\s*)?analysis and discussion\b",
        r"^\s*(?:[IVX]+\.\s*)?results and discussion\b"
    ],

    "future_work": [
        r"^\s*(?:[IVX]+\.\s*)?future work\b",
        r"^\s*(?:[IVX]+\.\s*)?future scope\b"
    ],

    "conclusion": [
        r"^\s*(?:[IVX]+\.\s*)?conclusion\b",
        r"^\s*(?:[IVX]+\.\s*)?discussion and conclusion\b",
        r"^\s*(?:[IVX]+\.\s*)?conclusion and future work\b"
    ],

    "references": [
        r"^\s*references\b",
        r"^\s*bibliography\b"
    ],

    "appendix": [
        r"^\s*appendix\b"
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

def classify_question(question: str):
    q = question.lower()

    if any(word in q for word in ["author", "authors", "who wrote", "written by"]):
        return "metadata"
    
    if "abstract" in q:
        return "abstract"

    if any(word in q for word in ["methodology", "approach", "method", "system design"]):
        return "methodology"

    if any(word in q for word in ["result", "results", "performance", "evaluation"]):
        return "results"

    if any(word in q for word in ["conclusion", "future work"]):
        return "conclusion"

    if any(word in q for word in ["reference", "citation", "bibliography"]):
        return "references"

    return None