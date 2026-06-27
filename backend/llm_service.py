
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
    system_prompt = """You are a research paper summarization assistant.
Return ONLY valid JSON.
{
  "title": "",
  "objective": "",
  "methodology": "",
  "results": "",
  "limitations": "",
  "future_work": ""
}"""
    user_prompt = build_user_prompt(context_text, question, instructions)
    response = llm_service(system_prompt, user_prompt)
    try:
        return json.loads(response)
    except Exception:
        return {"error": "Failed to parse JSON", "raw_response": response}

def get_literature_review_response(context_text: str, question: str, instructions: str | None = None):
    system_prompt = """You are a literature review generation assistant.
Return ONLY valid JSON.
{
  "title": "",
  "abstract": "",
  "themes": [],
  "research_gaps": [],
  "future_directions": [],
  "review": ""
}"""
    user_prompt = build_user_prompt(context_text, question, instructions)
    response = llm_service(system_prompt, user_prompt)
    try:
        return json.loads(response)
    except Exception:
        return {"error": "Failed to parse JSON", "raw_response": response}