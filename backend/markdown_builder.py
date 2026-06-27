import pandas as pd

def comparison_to_markdown(data: dict) -> str:
    markdown = "# Research Paper Comparison\n\n"

    # Comparison Table
    comparison_table = data.get("comparison_table", [])
    if comparison_table:
        markdown += "## Comparison by Attributes\n\n"
        try:
            df = pd.DataFrame(comparison_table)
            # Fill NaN with empty string for cleaner output
            df = df.fillna("")
            markdown += df.to_markdown(index=False)
        except Exception as e:
            print(f"Error: {e}")
            markdown += "Failed to generate comparison table."
        markdown += "\n\n"
            
    # Similarities
    similarities = data.get("similarities", [])
    if similarities:
        markdown += "## Similarities\n\n"
        for item in similarities:
            markdown += f"- {item}\n"
        markdown += "\n"

    # Differences
    differences = data.get("differences", [])
    if differences:
        markdown += "## Differences\n\n"
        for item in differences:
            markdown += f"- {item}\n"
        markdown += "\n"

    # Key Takeaways
    key_takeaways = data.get("key_takeaways")
    if key_takeaways:
        markdown += "## Key Takeaways\n\n"
        markdown += key_takeaways.strip()
        markdown += "\n"

    return markdown