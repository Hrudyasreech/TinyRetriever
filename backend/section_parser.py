import os, json
import re
import numpy as np
from regex import P
from key_words import METHOD_KEYWORDS, RESULT_KEYWORDS, ABSTRACT_KEYWORDS, CONCLUSION_KEYWORDS, INTRO_KEYWORDS , DISCUSSION_KEYWORDS, METADATA_KEYWORDS, REFERENCE_KEYWORDS, SECTION_DESCRIPTIONS, SECTION_EXAMPLES
from llm_service import llm_service
from retrieval import model
from rapidfuzz import fuzz

SECTION_NAMES = list(SECTION_DESCRIPTIONS.keys())

SECTION_EMBEDDINGS = model.encode(
    list(SECTION_DESCRIPTIONS.values()),
    normalize_embeddings=True
)

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

def classify_question_llm(question: str):
    system_prompt = """
You are an intent classifier for a research paper retrieval system.

Choose at most TWO sections that are most likely to contain the answer.

Allowed sections:
- metadata
- abstract
- introduction
- methodology
- results
- discussion
- conclusion
- references

Return ONLY a valid JSON array.

Examples:

Question: What is the objective of the paper?
["abstract"]

Question: Compare the methodologies.
["methodology"]

Question: What are the titles and objectives of the papers?
["metadata", "abstract"]

Do not explain your answer.
"""
    
    response = llm_service(
        system_prompt=system_prompt,
        user_prompt=question,
        temperature=0,
    )

    try:
        sections = json.loads(response)

        allowed = {
            "metadata",
            "abstract",
            "introduction",
            "methodology",
            "results",
            "discussion",
            "conclusion",
            "references",
        }

        sections = [s for s in sections if s in allowed]

        if not sections:
            return ["abstract", "introduction"]

        return sections[:2]

    except Exception:
        print("LLM Intent Response:", response)
        return ["abstract", "introduction"]
    
EMBEDDING_THRESHOLD = 0.3
def classify_question_embedding(question: str):
    question_embedding = model.encode(
        question,
        normalize_embeddings=True
    )
    similarities = np.dot(SECTION_EMBEDDINGS, question_embedding)
    ranked = np.argsort(similarities)[::-1]

    print("\nSection Similarities:")
    for idx in ranked:
        print(f"{SECTION_NAMES[idx]:<15} {similarities[idx]:.3f}")

    # FILTER BY THRESHOLD ← THIS IS THE KEY PART
    valid_indices = [idx for idx in ranked if similarities[idx] >= EMBEDDING_THRESHOLD]

    if not valid_indices:
        return None  # Falls back to RapidFuzz or LLM

    # Return top 2 that pass threshold
    primary_idx = valid_indices[0]
    secondary_idx = valid_indices[1] if len(valid_indices) > 1 else None

    return {
        "sections": [SECTION_NAMES[primary_idx]],
        "primary": SECTION_NAMES[primary_idx],
        "secondary": SECTION_NAMES[secondary_idx] if secondary_idx else None,
        "primary_score": float(similarities[primary_idx]),
        "secondary_score": float(similarities[secondary_idx]) if secondary_idx else 0.0,
        "classifier": "embedding"
    }

from rapidfuzz import fuzz

FUZZY_THRESHOLD = 90

def classify_question_fuzzy(question: str):

    q = question.lower()

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

    section_scores = {}

    for section, keywords in keyword_groups.items():

        best_score = 0

        for keyword in keywords:

            score = fuzz.partial_ratio(keyword.lower(), q)

            if score > best_score:
                best_score = score

        section_scores[section] = best_score

    print("RapidFuzz Scores:", section_scores)

    ranked = sorted(
        section_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    primary, primary_score = ranked[0]

    if primary_score < FUZZY_THRESHOLD:
        return None

    secondary = ranked[1][0] if len(ranked) > 1 else None
    secondary_score = ranked[1][1] if len(ranked) > 1 else 0

    return {
        "sections": [primary],
        "primary": primary,
        "secondary": secondary,
        "primary_score": primary_score,
        "secondary_score": secondary_score,
        "classifier": "rapidfuzz"
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
    "metadata": 0,
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

SECTION_THRESHOLD = 2   
def classify_question( question: str, use_llm: bool = True):
    q = question.lower().strip()
    q = re.sub(r"[^\w\s]", " ", q)  # Remove punctuation
    q = re.sub(r"\s+", " ", q)  # Remove extra whitespace
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

    # Score every section using strict whole-word boundaries
    for section, keywords in keyword_groups.items():
        for keyword in keywords:
            keyword = keyword.lower()
            if keyword in q:
                scores[section] += 1
                
    print("Results from rules classification:", dict(scores))

    # Nothing matched cleanly -> Hand it off to ModernBERT
    if not scores:
        fuzzy_result = classify_question_fuzzy(question)
        if fuzzy_result:
            print(
                "Fuzzy selected:",
                fuzzy_result["primary"],
                fuzzy_result["primary_score"]
            )
            return fuzzy_result
        print("Fuzzy confidence too low. Falling back to embedding...")

        embedding_result = classify_question_embedding(question)
        if embedding_result is not None:
            print(
                "Embedding selected:",
                embedding_result["primary"],
                embedding_result["primary_score"]
            )
            return embedding_result
        print("Embedding confidence too low. Falling back to LLM...")
        if not use_llm:
            return {
                "sections": [],
                "scores": {},
                "primary": "llm_required",
                "secondary": None,
                "classifier": "llm",
            }

        print("Falling back to LLM...")

        sections = classify_question_llm(question)
        print("LLM fallback sections:", sections)
        return {
            "sections": sections,
            "scores": {},
            "primary": sections[0],
            "secondary": sections[1] if len(sections) > 1 else None,
            "classifier": "llm"
        }

    # Process keyword match scoring rankings safely
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary, primary_score = ranked[0]
    secondary = None
    secondary_score = 0

    if len(ranked) > 1:
        secondary, secondary_score = ranked[1]

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
        "classifier": "rules"
    }

def get_section_group(section_name):
    for group, sections in SECTION_GROUPS.items():
        if section_name in sections:
            return group

    return section_name

def get_allowed_sections(section):
    return SECTION_GROUPS.get(section, [section])