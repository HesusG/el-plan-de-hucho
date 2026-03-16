#!/usr/bin/env python3
"""Generate scene images for chapters using Google Gemini API."""

import base64
import json
import os
import requests
import sys

API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
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

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "docs", "images")
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
    "Wide cinematic 16:9 composition. "
    "Absolutely NO text, NO letters, NO words in the image."
)

SCENES = {
    "chimp_mask": (
        f"Generate a scene: Extreme close-up of a brown chimpanzee mask-cap with a red visor "
        f"lying on a dark reflective surface. The mask stares directly at the viewer with empty "
        f"black eye holes — menacing, unsettling. Neon pink and cyan light bleeds across the mask "
        f"from off-screen sources, Hotline Miami aesthetic. The background is pure darkness with "
        f"occasional neon reflections. The empty eyes are the focal point — threatening and hollow. "
        f"{STYLE}"
    ),
    "ch1_mascara": (
        f"Generate a scene: A cardboard box sits open on a small table in a dark, cramped apartment. "
        f"Inside the box, a brown chimpanzee mask-cap with a red visor is visible. "
        f"The apartment is barely lit — neon pink light bleeds through venetian blinds casting "
        f"horizontal slashes of hot pink across the walls and floor. Threatening noir atmosphere. "
        f"Shadows dominate. The mask in the box seems to glow with menace. "
        f"{STYLE} Combined with Hotline Miami neon aesthetic."
    ),
    "ch3_huida": (
        f"Generate a scene: A lone figure in a rumpled suit walking down a dark highway at night. "
        f"Behind him, scattered Mexican peso bills float and swirl in the air like leaves in wind. "
        f"A brown chimpanzee mask lies discarded on the wet asphalt road. "
        f"The background is PSYCHEDELIC and hallucinatory — the sky melts like liquid, "
        f"neon pink and electric blue streaks bleed across the horizon like the music video "
        f"Rhinestone Eyes by Gorillaz. Reality distorts and warps around the walking figure. "
        f"Police siren lights (red/blue) splash across wet asphalt from somewhere unseen. "
        f"The road surface ripples and bends like it's alive. Trees on both sides are twisted "
        f"and grotesque silhouettes. Hotline Miami neon violence aesthetic — hot pink, cyan, "
        f"electric purple bleeding through the scene. Paranoid, feverish, dreamlike. "
        f"{STYLE}"
    ),
    "bank_heist": (
        f"Generate a scene: Floor 22 of an empty corporate office building. Fluorescent lights "
        f"buzz overhead. Polished marble floor reflects everything. A lone figure wearing a brown "
        f"chimpanzee mask sits in a swivel office chair in the middle of the empty floor, legs "
        f"crossed casually like a CEO. His suit jacket is open, shirt unbuttoned, sweat visible. "
        f"Another chimpanzee mask lies discarded on the marble floor beside him. "
        f"Corporate emptiness meets revolutionary menace. {STYLE}"
    ),
}

# Collage cutout images — small ~400x400px
COLLAGES = {
    "collages/collage_mask_closeup": (
        f"Generate a small square image: Extreme close-up of two empty black eye holes "
        f"of a brown chimpanzee mask. The eyes stare directly at viewer. Pure black background. "
        f"Menacing, claustrophobic framing — just the eye area of the mask fills the entire frame. "
        f"{STYLE} Square 1:1 composition."
    ),
    "collages/collage_money": (
        f"Generate a small square image: Top-down view of scattered Mexican peso bills "
        f"(500 peso notes, green and brown) spread across a dark surface. Some bills are crumpled, "
        f"some flat. A few coins scattered between them. Harsh overhead light creates deep shadows. "
        f"{STYLE} Square 1:1 composition."
    ),
    "collages/collage_sirens": (
        f"Generate a small square image: Red and blue police siren lights reflecting off wet "
        f"asphalt at night. No police car visible — just the colored light splashing across "
        f"the dark wet road surface. Rain puddles amplify the reflections. Ominous, threatening. "
        f"{STYLE} Square 1:1 composition."
    ),
    "collages/collage_fire_hands": (
        f"Generate a small square image: A pair of old weathered hands with deep wrinkles and "
        f"calluses holding a dented tin cup (jarro de peltre) with steam rising from it. "
        f"Firelight illuminates the hands from below, casting dramatic shadows upward. "
        f"The hands tell a story of decades of hard labor. "
        f"{STYLE} Square 1:1 composition."
    ),
    "collages/collage_mushroom": (
        f"Generate a small square image: Silhouette of a nuclear mushroom cloud against a night sky. "
        f"The mushroom cloud is rendered as a stark black silhouette with bright white and red "
        f"light at its base. Stars visible in the sky around it. Terrifying and beautiful. "
        f"{STYLE} Square 1:1 composition."
    ),
    "collages/collage_underwater": (
        f"Generate a small square image: View from underwater looking up toward the surface. "
        f"Fading light filters down through dark water. Air bubbles rise toward a dimming "
        f"circle of light above. The light is almost gone — deep, oppressive darkness below. "
        f"Drowning perspective. {STYLE} Square 1:1 composition."
    ),
    "collages/collage_note": (
        f"Generate a small square image: A crumpled piece of yellow lined paper with aggressive "
        f"scribbles and scratches in black ink. The handwriting is illegible but violent — "
        f"heavy pen strokes, crossed-out words, ink blots. The paper is wrinkled and torn at edges. "
        f"Looks like a madman's note. No readable text. "
        f"{STYLE} Square 1:1 composition."
    ),
}

URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={API_KEY}"


def generate_scene(name, prompt):
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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--collages", action="store_true", help="Generate collage cutouts instead of scenes")
    parser.add_argument("--all", action="store_true", help="Generate both scenes and collages")
    args = parser.parse_args()

    targets = {}
    if args.collages:
        targets = COLLAGES
    elif args.all:
        targets = {**SCENES, **COLLAGES}
    else:
        targets = SCENES

    # Ensure collages subdirectory exists
    os.makedirs(os.path.join(OUTPUT_DIR, "collages"), exist_ok=True)

    success = 0
    for name, prompt in targets.items():
        if generate_scene(name, prompt):
            success += 1
    print(f"\nDone: {success}/{len(targets)} images generated")
