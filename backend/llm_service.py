
import os
import json
import openai
from google import genai
from dotenv import load_dotenv


load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def llm_service(system_prompt: str, user_prompt: str, temperature: float = 0.3):
    if not GROQ_API_KEY:
        raise Exception("Groq API key missing from environment.")
    client = openai.OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=temperature
    )
    return completion.choices[0].message.content

def llm_service_gemini(system_prompt: str, user_prompt: str, temperature: float = 0.3):
    if not GEMINI_API_KEY:
        raise Exception("Gemini API key missing from environment.")
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model = "gemini-2.5-flash",
        contents = f"""
        {system_prompt}
        
        {user_prompt}
        """
    )
    return response.text


def build_user_prompt(context_text: str, question: str, instructions: str | None = None):
    prompt = f"Provided Context Data Blocks:\n\n{context_text}\n\nUser Question:\n\n{question}"
    if instructions:
        prompt += f"\n\nUser Instructions:\n\n{instructions}"
    return prompt


def get_chat_response(context_text: str, question: str, instructions: str | None = None):
    system_prompt = """
You are a helpful, clear, and friendly AI assistant answering questions about the user's uploaded research papers.

Core Rules:
1. Answer using only the information available in the retrieved context.
2. If the user asks for the objective, aim, or purpose of a paper and it is not explicitly labeled, infer it from the Abstract, Introduction, or Methodology.
3. If the retrieved context genuinely does not contain the answer, reply:
   "I cannot find specific details regarding that in the currently retrieved document sections."

Formatting Rules:
- Format responses using clean Markdown.
- Use headings (##, ###) only when they improve readability.
- Use bullet lists for multiple items.
- Use numbered lists for ordered steps.
- Use tables only when comparing information.
- Use **bold** for important terms, paper titles, or key findings.
- Keep paragraphs concise (2–4 sentences).
- Do not use code blocks unless the user explicitly requests code.
- Do not wrap the entire response in markdown fences.

Respond naturally and avoid unnecessary verbosity.
"""

    user_prompt = build_user_prompt(context_text, question, instructions)
    return llm_service(system_prompt, user_prompt)

def get_compare_response(context_text: str, question: str, instructions: str | None = None):
    system_prompt = """
You are a research paper comparison assistant.

Output ONLY valid JSON.

Do NOT include explanations.
Do NOT include markdown.
Do NOT include headings.
Do NOT include any text before or after the JSON.

Required JSON schema:
{"comparison_table":[],"similarities":[],"differences":[],"key_takeaways":""}

Rules:
- comparison_table must be a list of objects.
- The first field must always be "Attribute".
- Remaining fields must be paper filenames or titles.
- ALWAYS include these attributes, even if the user does not request them:
  - Objective
  - Methodology
  - Dataset
  - Model/Approach
  - Results
  - Evaluation Metrics
  - Limitations
- If the user question or instructions request additional attributes, include those as well.
- Each row compares exactly one attribute.
- Use "Not reported" when information is unavailable.
- similarities must be a list of concise strings.
- differences must be a list of concise strings.
- key_takeaways must be a short paragraph.
- Follow additional user instructions when provided.

Return ONLY valid JSON.
"""
    user_prompt = build_user_prompt(context_text, question, instructions)
    response = llm_service_gemini(system_prompt, user_prompt)

    try:
        return json.loads(response)
    except Exception:
        return {"error": "Failed to parse JSON", "raw_response": response}
    
def get_summary_response(context_text: str, question: str, instructions: str | None = None):
    system_prompt = """
You are a research paper summarization assistant.

Return ONLY valid JSON.

Do NOT include markdown.
Do NOT include explanations.
Do NOT include any text before or after the JSON.

Schema:
{
  "summary": "",
  "objective": "",
  "methodology": "",
  "results": "",
  "limitations": "",
  "future_work": ""
}

Rules:
- Always include every field.
- If information is unavailable, use "Not reported".
- Keep each field concise (2-4 sentences maximum).
- Follow any additional user instructions if provided.

Return ONLY valid JSON.
"""
    user_prompt = build_user_prompt(context_text, question, instructions)
    response = llm_service(system_prompt, user_prompt)

    try:
        return json.loads(response)
    except Exception:
        return {
            "error": "Failed to parse JSON",
            "raw_response": response,
        }

def get_literature_review_response(context_text: str, question: str, instructions: str | None = None):
    system_prompt = """
You are a research literature review generation assistant.

Output ONLY valid JSON.

Do NOT include explanations.
Do NOT include markdown.
Do NOT include headings outside the JSON.
Do NOT include any text before or after the JSON.

Required JSON schema:

{
  "title": "",
  "abstract": "",
  "themes": [],
  "research_gaps": [],
  "future_directions": [],
  "conclusion": ""
}

Rules:
- title should describe the overall literature review topic.
- abstract should summarize the overall research landscape in one concise paragraph (4-6 sentences).
- themes must be a list of objects:
  {
    "title": "",
    "description": ""
  }
- Identify between 3 and 6 major research themes across the selected papers.
- Each theme should summarize the common approaches, methodologies, or findings from multiple papers whenever possible.
- Avoid creating duplicate or overlapping themes.

- research_gaps must be a list of concise strings.
- Include only gaps supported by the provided papers.
- If no gaps are discussed, infer reasonable research gaps from the collected literature.

- future_directions must be a list of concise strings.
- Prefer explicit future work from the papers.
- If unavailable, infer reasonable future research directions based on the literature.

- conclusion should summarize the overall state of research in one short paragraph.

- Use only the provided context.
- Do not hallucinate information.
- Use "Not reported" only when information genuinely cannot be determined.

- Follow any additional user instructions when provided.

Return ONLY valid JSON.
"""
    user_prompt = build_user_prompt(context_text, question, instructions)
    response = llm_service_gemini(system_prompt, user_prompt)

    try:
        return json.loads(response)
    except Exception:
        return {"error": "Failed to parse JSON", "raw_response": response}