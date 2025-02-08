import json
import time

import dotenv
from openai import OpenAI

# from drive import set_velocity


# mock
def set_velocity(linear_velocity, angular_velocity):
    print(f"Setting velocity to {linear_velocity} m/s and {angular_velocity} rad/s")


dotenv.load_dotenv()

client = OpenAI()

system_message = {
    "role": "system",
    "content": """You are a helpful assistant that returns a structured response to control a robot to head in a straight line and avoid obstacles. When going around obstacles return to your original path.

The robot has two wheels and can move forward, back, and turn. Go slow. Less than 1 m/s and less than 1 rad/s. Go less than 3m per request.

Output a JSON object with the following fields:
- linear_velocity: float (m/s)
- angular_velocity: float (rad/s)
- duration: int (centiseconds)
""",
}
messages = [
    system_message,
]


def gpt(url):
    messages.append(
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": url,
                    },
                },
            ],
        },
    )

    print("Sending request to GPT")
    response = client.chat.completions.create(
        model="o1",
        messages=messages,
    )
    messages.append(response.choices[0].message)

    text = response.choices[0].message.content

    action = json.loads(text)
    linear_velocity = action["linear_velocity"]
    angular_velocity = action["angular_velocity"]
    duration = action["duration"]

    if linear_velocity is None and angular_velocity is None:
        raise ValueError("No action provided")

    set_velocity(linear_velocity, angular_velocity)
    time.sleep(duration / 100)
    set_velocity(0, 0)


gpt("https://thomasforbes.com/test.png")
