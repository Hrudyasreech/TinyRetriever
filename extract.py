import time
from ollama import chat

start = time.time()

response = chat(
    model="qwen3.5:4b",
    messages=[
        {
            "role": "system",
            "content": "Answer in one short sentence. Do not explain."
        },
        {
            "role": "user",
            "content": "/no_think What is 2+2?"
        }
    ], think = False
)

print(response["message"])
print(response.message.content)
print(response.message.thinking)
print("Seconds:", time.time() - start)