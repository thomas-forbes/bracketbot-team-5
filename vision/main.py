# from drive import on_command
import base64

import dotenv
from openai import OpenAI

dotenv.load_dotenv()

client = OpenAI()


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


image_path = "test.png"
base64_image = encode_image(image_path)

functions = [
    {
        "name": "forward",
        "description": "Move the robot forward for x seconds",
        "parameters": {
            "type": "object",
            "properties": {
                "distance": {
                    "type": "number",
                    "description": "The distance to move forward",
                },
            },
        },
    }
]
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "How far away is the wall away in meters?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}",
                        "detail": "low",
                    },
                },
            ],
        }
    ],
    # functions=functions,
    # function_call="auto",
    max_tokens=300,
)

print(response.choices[0].message.content)


# def main():
#     on_command("forward")


# main()
