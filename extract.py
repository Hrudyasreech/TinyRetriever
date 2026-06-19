import fitz
import re

#pdf = fitz.open(r"C:\Users\hrudy\Downloads\sensors-25-06629-v2.pdf")
#pdf = fitz.open(r"C:\Hrudya\Projects\TinyRetriever\sample3.pdf")
pdf = fitz.open(r"C:\Hrudya\Projects\TinyRetriever\s4.pdf")
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

def extract_first_page_text(pdf):
    if len(pdf) == 0:
        return ""

    first_page = pdf[0]
    text = first_page.get_text()
    pdf.close()
    return text

def extract_doi(text):

    # Fix DOI broken across lines
    text = re.sub(r'/\s+', '/', text)
    # Convert newlines to spaces
    text = text.replace("\n", " ")
    match = re.search(
        r'10\.\d{4,9}/[-._;()/:A-Za-z0-9]+',
        text
    )
    if match:
        return match.group(0)

    return None

first_page_text = extract_first_page_text(pdf)
doi = extract_doi(first_page_text)
print(doi)

import requests

def get_metadata_from_crossref(doi):
    url = f"https://api.crossref.org/works/{doi}"

    response = requests.get(url, timeout=10)

    if response.status_code != 200:
        return None

    data = response.json()["message"]

    title = data.get("title", [""])[0]

    authors = []
    for author in data.get("author", []):
        given = author.get("given", "")
        family = author.get("family", "")
        authors.append(f"{given} {family}".strip())

    return {
        "title": title,
        "authors": authors,
        "doi": doi,
        "publisher": data.get("publisher"),
        "journal": data.get("container-title", [""])[0],
        "published_year": data.get("published-print", {}).get("date-parts", [[None]])[0][0]
    }

metadata_s = get_metadata_from_crossref(doi)

print(metadata_s)