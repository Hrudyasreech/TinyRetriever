import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

# Allow importing backend modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from section_parser import classify_question


# -----------------------------
# Load Questions
# -----------------------------
with open("evaluation/questions1.json", "r", encoding="utf-8") as f:
    questions = json.load(f)


# -----------------------------
# Metrics
# -----------------------------
top1_correct = 0
top2_correct = 0

classifier_usage = defaultdict(int)

difficulty_stats = defaultdict(
    lambda: {
        "total": 0,
        "top1": 0,
        "top2": 0,
    }
)


# -----------------------------
# CSV Output
# -----------------------------
with open(
    "evaluation/classifier_results.csv",
    "w",
    newline="",
    encoding="utf-8"
) as csvfile:

    writer = csv.writer(csvfile)

    writer.writerow([
        "Question",
        "Difficulty",
        "Expected",
        "Primary Prediction",
        "Secondary Prediction",
        "Predicted Sections",
        "Classifier",
        "Confidence",
        "Scores",
        "Top1 Correct",
        "Top2 Correct"
    ])

    for item in questions:

        result = classify_question(item["question"], use_llm=False)

        expected = item["expected"]

        primary = result["primary"]
        secondary = result.get("secondary")
        sections = result["sections"]

        classifier = result["classifier"]

        confidence = (
            result.get("primary_score")
            if result.get("primary_score") is not None
            else "-"
        )

        scores = result.get("scores", {})

        top1 = primary in expected
        top2 = any(sec in expected for sec in sections)

        if top1:
            top1_correct += 1

        if top2:
            top2_correct += 1

        classifier_usage[classifier] += 1

        difficulty = item["category"]

        difficulty_stats[difficulty]["total"] += 1

        if top1:
            difficulty_stats[difficulty]["top1"] += 1

        if top2:
            difficulty_stats[difficulty]["top2"] += 1

        writer.writerow([
            item["question"],
            difficulty,
            expected,
            primary,
            secondary,
            ", ".join(sections),
            classifier,
            confidence,
            json.dumps(scores),
            top1,
            top2
        ])


# -----------------------------
# Final Report
# -----------------------------
total = len(questions)

print("=" * 70)
print("SECTION CLASSIFIER EVALUATION")
print("=" * 70)

print(f"Total Questions : {total}")
print(f"Top-1 Accuracy  : {top1_correct}/{total} ({top1_correct / total:.2%})")
print(f"Top-2 Accuracy  : {top2_correct}/{total} ({top2_correct / total:.2%})")


print("\nClassifier Usage")
print("-" * 40)

for classifier in ["rules", "embedding", "llm"]:
    print(
        f"{classifier:<12}: "
        f"{classifier_usage[classifier]}"
    )


print("\nAccuracy by Difficulty")
print("-" * 40)

for difficulty in ["exact", "typo", "semantic", "hard"]:

    stats = difficulty_stats[difficulty]

    if stats["total"] == 0:
        continue

    print(f"\n{difficulty.upper()}")

    print(
        f"Top-1 : "
        f"{stats['top1']}/{stats['total']} "
        f"({stats['top1']/stats['total']:.2%})"
    )

    print(
        f"Top-2 : "
        f"{stats['top2']}/{stats['total']} "
        f"({stats['top2']/stats['total']:.2%})"
    )


print("\nResults saved to:")
print("evaluation/classifier_results.csv")