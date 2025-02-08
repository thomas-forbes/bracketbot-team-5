import json
import time

import cv2
import dotenv
from groq import Groq
from openai import OpenAI

from vision.camera import USBCamera

# from drive import set_velocity


# mock
def set_velocity(linear_velocity, angular_velocity):
    pass
    # print(f"Setting velocity to {linear_velocity} m/s and {angular_velocity} rad/s")


dotenv.load_dotenv()

client = Groq()

system_message = {
    "role": "user",
    "content": """
You are a helpful assistant that returns a structured response to control a robot to head in a straight line and avoid obstacles. When going around obstacles return to your original path.

The robot has two wheels and can move forward, back, and turn. Go slow. Less than 1 m/s and less than 1 rad/s. Try to go 2m per request. First think out loud about where you need to go and how far you need to go. Output one action per request.

Output a JSON object with the following fields:
- linear_velocity: float (m/s)
- angular_velocity: float (rad/s)
- duration: int (centiseconds)
Example:
```json
{
    "linear_velocity": 0.5,
    "angular_velocity": 0.0,
    "duration": 400
}
```
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
        # model="o1-mini",
        model="llama-3.2-90b-vision-preview",
        messages=messages,
    )
    messages.append(response.choices[0].message)

    text = response.choices[0].message.content
    print(f"text: {text}")
    json_text = text.split("```json")[1].split("```")[0]

    action = json.loads(json_text)
    linear_velocity = action["linear_velocity"]
    angular_velocity = action["angular_velocity"]
    duration = action["duration"]

    print(f"Action: {action}")
    if linear_velocity is None and angular_velocity is None:
        raise ValueError("No action provided")

    set_velocity(linear_velocity, angular_velocity)
    time.sleep(duration / 100)
    set_velocity(0, 0)


# gpt("https://thomasforbes.com/test.png")


def take_photo():
    camera = USBCamera(index=0)

    print("Using USB Camera")
    get_frame = camera.get_frame
    frame = get_frame()
    frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)

    cv2.imwrite("photo.png", frame)


take_photo()
