import json
import csv
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from section_parser import classify_question

with open("evaluation/questions.json", "r") as f:
    questions = json.load(f)

top1_correct = 0
top2_correct = 0

with open("evaluation/answers.csv", "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)

    writer.writerow([
        "Question",
        "Difficulty",
        "Expected Section",
        "Primary Prediction",
        "Secondary Prediction",
        "Retrieved Sections",
        "Scores",
        "Top1 Correct",
        "Top2 Correct"
    ])

    for question in questions:
        result = classify_question(question["question"])

        expected = question["expected_section"]

        primary = result["primary"]
        secondary = result["secondary"]
        sections = result["sections"]
        scores = result["scores"]

        top1 = primary == expected
        top2 = expected in sections

        if top1:
            top1_correct += 1

        if top2:
            top2_correct += 1

        writer.writerow([
            question["question"],
            question["difficulty"],
            expected,
            primary,
            secondary,
            ", ".join(sections),
            json.dumps(scores),
            top1,
            top2,
        ])

total = len(questions)

print("=" * 60)
print(f"Total Questions : {total}")
print(f"Top-1 Correct   : {top1_correct}/{total}")
print(f"Top-2 Correct   : {top2_correct}/{total}")
print(f"Top-1 Accuracy  : {top1_correct / total:.2%}")
print(f"Top-2 Accuracy  : {top2_correct / total:.2%}")