from operator import methodcaller
from os import system
import re

from networkx import relabel_gexf_graph
from regex import P
from sympy import intersecting_product
from key_words import METHOD_KEYWORDS, RESULT_KEYWORDS, ABSTRACT_KEYWORDS, CONCLUSION_KEYWORDS, INTRO_KEYWORDS , DISCUSSION_KEYWORDS, METADATA_KEYWORDS, REFERENCE_KEYWORDS 
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

SECTION_GROUPS = {
    "abstract": ["abstract"],
    "introduction": ["introduction"],
    "background": [
        "background",
        "related_work",
        "problem_statement"
    ],
    "literature_review": [
        "literature_review"
    ],
    "methodology": [
        "methodology",
        "experimental_setup",
        "system_design",
        "implementation"
    ],
    "results": [
        "results"
    ],
    "discussion": [
        "discussion"
    ],
    "conclusion": [
        "conclusion",
        "future_work"
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
    if not positions:
        return {"metadata": text}
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

scores = {
    "abstract": 0,
    "introduction": 0,
    "background": 0,
    "literature_review": 0,
    "methodology": 0,
    "results": 0,
    "discussion": 0,
    "conclusion": 0,
    "references": 0,
}

from collections import defaultdict

SECTION_THRESHOLD = 2   # Tune later from evaluation


def classify_question(question: str):
    q = question.lower()
    scores = defaultdict(int)

    keyword_groups = {
        "metadata": METADATA_KEYWORDS,
        "abstract": ABSTRACT_KEYWORDS,
        "methodology": METHOD_KEYWORDS,
        "results": RESULT_KEYWORDS,
        "conclusion": CONCLUSION_KEYWORDS,
        "discussion": DISCUSSION_KEYWORDS,
        "references": REFERENCE_KEYWORDS,
        "introduction": INTRO_KEYWORDS,
    }

    # Score every section
    for section, keywords in keyword_groups.items():
        for keyword in keywords:
            if keyword in q:
                scores[section] += 1

    # Nothing matched
    if not scores:
        return {
            "sections": [],
            "scores": {},
            "primary": None,
            "secondary": None,
        }

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary, primary_score = ranked[0]
    secondary = None
    secondary_score = 0

    if len(ranked) > 1:
        secondary, secondary_score = ranked[1]

    # Decide whether to retrieve one or two sections
    if (
        secondary is not None
        and (primary_score - secondary_score) < SECTION_THRESHOLD
    ):
        sections = [primary, secondary]
    else:
        sections = [primary]

    return {
        "sections": sections,
        "scores": dict(scores),
        "primary": primary,
        "secondary": secondary,
        "primary_score": primary_score,
        "secondary_score": secondary_score,
    }

def get_section_group(section_name):
    for group, sections in SECTION_GROUPS.items():
        if section_name in sections:
            return group

    return section_name

def get_allowed_sections(section):
    return SECTION_GROUPS.get(section, [section])