#!/usr/bin/env python3
"""Generate character avatars using Google Gemini API."""

import base64
import json
import os
import requests
import sys

API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    # Try reading from .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("GOOGLE_API_KEY="):
                    API_KEY = line.strip().split("=", 1)[1]
                    break

if not API_KEY:
    print("ERROR: No GOOGLE_API_KEY found")
    sys.exit(1)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "docs", "images", "avatars")
os.makedirs(OUTPUT_DIR, exist_ok=True)

STYLE = (
    "EXTREME Roy Lichtenstein comic book pop art illustration. "
    "MASSIVE exaggerated Ben-Day dots covering ALL surfaces — dots must be clearly visible "
    "and at least 3-5mm apparent size. "
    "ULTRA-THICK black ink outlines (6-8pt weight) around every shape. "
    "FLAT color fills using ONLY pure primary colors: cadmium red, "
    "cadmium yellow, cobalt blue, pure white, jet black — NO gradients, NO subtle tones. "
    "Every shadow is rendered as Ben-Day dot fields OR parallel diagonal hatching. "
    "Must look like 1960s commercial offset press printing. "
    "NO photorealism, NO soft edges, NO atmospheric perspective. "
    "Headshot bust portrait, square composition, solid color background. "
    "High contrast, dramatic lighting, slightly threatening low angle. "
    "Combined with Hotline Miami neon aesthetic and 80s retro-violence vibe. "
    "Absolutely NO text, NO letters, NO words in the image."
)

CHARACTERS = {
    "paco": (
        f"Generate a portrait of a young Mexican man, approximately 28 years old. "
        f"Short dark hair, angular jaw, nervous intense eyes, slight stubble. "
        f"Wearing a grey-blue executive suit with loosened tie. "
        f"Expression: determined but scared, like someone about to do something dangerous. "
        f"Latino/Mexican features. {STYLE}"
    ),
    "hucho": (
        f"Generate a portrait of a charismatic Mexican man, early 30s. "
        f"Strong jaw, piercing dark eyes with an intense focused stare, short hair with sweat on forehead. "
        f"Wearing an open suit jacket with unbuttoned white dress shirt showing chest. "
        f"Expression: calm confidence mixed with exhaustion, like a revolutionary leader. "
        f"A brown chimpanzee mask-cap with red visor sitting beside him. "
        f"Latino/Mexican features. {STYLE}"
    ),
    "refugio": (
        f"Generate a portrait of an old Mexican man, approximately 70 years old. "
        f"Missing teeth visible in a knowing grin, deeply wrinkled weathered face, "
        f"white stubble, wise ancient eyes that have seen everything. "
        f"Wearing a worn hat and faded work clothes. "
        f"Expression: serene wisdom mixed with mischief, like a old revolutionary who survived. "
        f"Indigenous Mexican features. {STYLE}"
    ),
    "condor": (
        f"Generate a portrait of a rugged disheveled pilot, approximately 45 years old. "
        f"Aviator sunglasses pushed up on forehead, thin mustache, greasy unkempt hair. "
        f"Wearing a stained flight jacket. Looks like a wet pigeon trying to be an eagle. "
        f"Expression: reckless and slightly drunk confidence. "
        f"Weathered rural American/hillbilly features. {STYLE}"
    ),
}

URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={API_KEY}"

def generate_avatar(name, prompt):
    print(f"Generating {name}...")
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        },
    }
    headers = {"Content-Type": "application/json"}

    resp = requests.post(URL, json=payload, headers=headers, timeout=120)
    if resp.status_code != 200:
        print(f"  ERROR {resp.status_code}: {resp.text[:500]}")
        return False

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        print(f"  ERROR: No candidates in response")
        print(f"  Response: {json.dumps(data, indent=2)[:500]}")
        return False

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            img_data = base64.b64decode(part["inlineData"]["data"])
            mime = part["inlineData"].get("mimeType", "image/png")
            ext = "png" if "png" in mime else "jpg" if "jpeg" in mime or "jpg" in mime else "webp"
            out_path = os.path.join(OUTPUT_DIR, f"{name}.{ext}")
            with open(out_path, "wb") as f:
                f.write(img_data)
            print(f"  Saved: {out_path} ({len(img_data)} bytes)")
            return True
        elif "text" in part:
            print(f"  Text response: {part['text'][:200]}")

    print(f"  ERROR: No image in response")
    return False


if __name__ == "__main__":
    success = 0
    for name, prompt in CHARACTERS.items():
        if generate_avatar(name, prompt):
            success += 1
    print(f"\nDone: {success}/{len(CHARACTERS)} avatars generated")
