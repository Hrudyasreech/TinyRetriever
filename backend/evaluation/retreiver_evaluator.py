import csv
import json
import requests

# ---------------- CONFIG ---------------- #

BASE_URL = "http://127.0.0.1:8000"

PROJECT_ID = "82ec8357-bba4-4169-82cf-df75b0243fe2"
CHAT_ID = "e1433d7b-e50d-4340-b995-72c050da6a90"

QUESTIONS_FILE = "evaluation/questions.json"
OUTPUT_FILE = "evaluation/retriever_results.csv"

# ---------------------------------------- #

with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
    questions = json.load(f)

rows = []

classifier_correct = 0
retrieval_correct = 0

for q in questions:

    payload = {
        "question": q["question"],
        "project_id": PROJECT_ID,
        "chat_id": CHAT_ID,
        "selected_paper_ids": [],
        "instructions": ""
    }

    try:

        response = requests.post(
            f"{BASE_URL}/ask/",
            json=payload,
            timeout=120
        )

        response.raise_for_status()

        result = response.json()

        expected = q["expected_section"]

        target_sections = result.get("target_sections", [])
        retrieved_sections = result.get("retrieved_sections", [])

        target_correct = expected in target_sections
        retrieval_ok = expected in retrieved_sections

        if target_correct:
            classifier_correct += 1

        if retrieval_ok:
            retrieval_correct += 1

        rows.append({
            "ID": q["id"],
            "Question": q["question"],
            "Difficulty": q["difficulty"],

            "Expected Section": expected,

            "Target Sections":
                ", ".join(target_sections),

            "Retrieved Sections":
                ", ".join(retrieved_sections),

            "Target Correct":
                target_correct,

            "Retrieval Correct":
                retrieval_ok,

            "Sources":
                ", ".join(result.get("sources", [])),

            "Fallback":
                result.get("fallback"),

            "Answer":
                result.get("answer", "")
        })

        print(
            f"✅ Q{q['id']:02d} | "
            f"Classifier: {'✔' if target_correct else '✘'} | "
            f"Retriever: {'✔' if retrieval_ok else '✘'}"
        )

    except Exception as e:

        print(f"❌ Q{q['id']:02d}: {e}")

        rows.append({
            "ID": q["id"],
            "Question": q["question"],
            "Difficulty": q["difficulty"],
            "Expected Section": q["expected_section"],
            "Target Sections": "",
            "Retrieved Sections": "",
            "Target Correct": False,
            "Retrieval Correct": False,
            "Sources": "",
            "Fallback": "",
            "Answer": f"ERROR: {e}"
        })

with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:

    writer = csv.DictWriter(
        f,
        fieldnames=[
            "ID",
            "Question",
            "Difficulty",
            "Expected Section",
            "Target Sections",
            "Retrieved Sections",
            "Target Correct",
            "Retrieval Correct",
            "Sources",
            "Fallback",
            "Answer",
        ]
    )

    writer.writeheader()
    writer.writerows(rows)

total = len(questions)

print("\n" + "=" * 60)
print(f"Total Questions      : {total}")
print(f"Classifier Accuracy  : {classifier_correct}/{total} ({classifier_correct/total:.2%})")
print(f"Retriever Accuracy   : {retrieval_correct}/{total} ({retrieval_correct/total:.2%})")
print("=" * 60)

print(f"\nResults written to {OUTPUT_FILE}")