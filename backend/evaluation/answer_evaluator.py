import csv
import json
import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise Exception("GEMINI_API_KEY not found.")

client = genai.Client(api_key=GEMINI_API_KEY)
for model in client.models.list():
    if "gemma" in model.name:
        print(f"Model Name: {model.name}")

#MODEL_NAME = "gemini-2.5-flash"
MODEL_NAME = "gemma-4-31b-it"

QUESTIONS_FILE = "evaluation/questions.json"
RESULTS_FILE = "evaluation/retriever_results.csv"
OUTPUT_FILE = "evaluation/llm_answer_scores.csv"

# --------------------------------------------------------
# Load Questions
# --------------------------------------------------------

with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
    questions = json.load(f)

question_lookup = {q["id"]: q for q in questions}

rows = []

total_fact = 0
total_complete = 0
total_relevance = 0
total_score = 0

# --------------------------------------------------------
# Evaluate
# --------------------------------------------------------

with open(RESULTS_FILE, "r", encoding="utf-8") as f:

    reader = csv.DictReader(f)

    for row in reader:

        qid = int(row["ID"])
        q = question_lookup[qid]

        system_prompt = """
You are evaluating answers produced by a Research Paper RAG system.

Evaluate ONLY the generated answer.

Scoring Rubric

Factual Correctness (0-2)

2 = Completely factually correct.

1 = Mostly correct with minor mistakes.

0 = Incorrect.

Completeness (0-2)

2 = Covers nearly every important concept.

1 = Covers some important concepts.

0 = Misses major concepts.

Relevance (0-1)

1 = Directly answers the user's question.

0 = Mostly irrelevant.

Evaluation Rules

- Never require exact keyword matches.
- Accept paraphrases.
- Accept semantically equivalent wording.
- Ignore writing style.
- Ignore grammar.
- Extra correct information is acceptable.
- Judge factual correctness over keyword overlap.

Return ONLY JSON.

Example:

{
    "factual_correctness":2,
    "completeness":2,
    "relevance":1,
    "reason":"Brief explanation.",
    "missing_concepts":[]
}
"""

        user_prompt = f"""
Question:

{q["question"]}

Required Concepts:

{", ".join(q["required_keywords"])}

Optional Concepts:

{", ".join(q["optional_keywords"])}

Generated Answer:

{row["Answer"]}
"""

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=f"{system_prompt}\n\n{user_prompt}"
        )

        text = response.text.strip()

        text = (
            text.replace("```json", "")
            .replace("```", "")
            .strip()
        )

        try:
            result = json.loads(text)
        except Exception:
            print(f"Failed on Question {qid}")
            print(text)
            continue

        factual = int(result["factual_correctness"])
        completeness = int(result["completeness"])
        relevance = int(result["relevance"])

        score = factual + completeness + relevance

        total_fact += factual
        total_complete += completeness
        total_relevance += relevance
        total_score += score

        rows.append({

            "ID": qid,

            "Question": q["question"],

            "Factual Correctness": factual,

            "Completeness": completeness,

            "Relevance": relevance,

            "Total (/5)": score,

            "Reason": result["reason"],

            "Missing Concepts":
                ", ".join(result.get("missing_concepts", [])),

            "Answer": row["Answer"]

        })

        print(
            f"Q{qid:02d} | "
            f"Fact={factual} "
            f"Comp={completeness} "
            f"Rel={relevance} "
            f"Total={score}/5"
        )

# --------------------------------------------------------
# Save CSV
# --------------------------------------------------------

with open(
    OUTPUT_FILE,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.DictWriter(
        f,
        fieldnames=[
            "ID",
            "Question",
            "Factual Correctness",
            "Completeness",
            "Relevance",
            "Total (/5)",
            "Reason",
            "Missing Concepts",
            "Answer"
        ]
    )

    writer.writeheader()
    writer.writerows(rows)

n = len(rows)

print("\n" + "=" * 60)
print(f"Questions Evaluated : {n}")
print(f"Average Factual Correctness : {round(total_fact / n, 2)}/2")
print(f"Average Completeness        : {round(total_complete / n, 2)}/2")
print(f"Average Relevance           : {round(total_relevance / n, 2)}/1")
print(f"Overall Score              : {round(total_score / n, 2)}/5")
print("=" * 60)

print(f"\nSaved to {OUTPUT_FILE}")