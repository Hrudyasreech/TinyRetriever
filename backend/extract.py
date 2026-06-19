import fitz
import requests
import re
import json
import openai
import os

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

def extract_text_from_pdf(pdf_bytes):
    pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    text = ""
    for page in pdf:
        text += page.get_text()
        
    # Safely get the first page text after the loop
    text_f = pdf[0].get_text() if len(pdf) > 0 else ""

    pdf.close()
    return text, text_f

def extract_doi(text):

    text = re.sub(r'/\s+', '/', text)
    text = text.replace("\n", " ")
    match = re.search(
        r'10\.\d{4,9}/[-._;()/:A-Za-z0-9]+',
        text)
    if match:
        return match.group(0)

    return None

def get_metadata_from_crossref(doi):
    url = f"https://api.crossref.org/works/{doi}"

    response = requests.get(url, timeout=10)

    if response.status_code != 200:
        return None

    data = response.json()["message"]

    title = data.get("title", [""])[0]

    authors = []
    affiliations = set()

    for author in data.get("author", []):

        given = author.get("given", "")
        family = author.get("family", "")

        authors.append(f"{given} {family}".strip())

        for aff in author.get("affiliation", []):
            name = aff.get("name")
            if name:
                affiliations.add(name)

    year = None

    if "published-print" in data:
        year = data["published-print"]["date-parts"][0][0]

    elif "published-online" in data:
        year = data["published-online"]["date-parts"][0][0]

    return {
        "title": title,
        "authors": authors,
        "affiliations": list(affiliations),
        "doi": doi,
        "publisher": data.get("publisher"),
        "journal": data.get("container-title", [""])[0],
        "published_year": year
    }

def get_metadata_from_llm(metadata_text):

    client = openai.OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": """
                    You are a metadata extraction system.

                    Extract:
                    1. Paper title
                    2. Authors
                    3. Affiliations

                    Return ONLY valid JSON.

                    Example:
                    {
                    "title": "Paper Title",
                    "authors": ["Author 1", "Author 2"],
                    "affiliations": [
                        "University A",
                        "Institute B"
                    ]
                    }
            """
            },
            {
                "role": "user",
                "content": metadata_text[:5000]
            }
        ]
    )

    try:
        result = completion.choices[0].message.content.strip()

        # remove markdown fences if model adds them
        result = result.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(result)

        return {
            "title": parsed.get("title"),
            "authors": parsed.get("authors", []),
            "affiliations": parsed.get("affiliations", []),
            "doi": None,
            "publisher": None,
            "journal": None,
            "published_year": None
        }

    except Exception as e:
        print("Metadata Extraction Error:", e)

        return {
            "title": None,
            "authors": [],
            "affiliations": [],
            "doi": None,
            "publisher": None,
            "journal": None,
            "published_year": None
        }

