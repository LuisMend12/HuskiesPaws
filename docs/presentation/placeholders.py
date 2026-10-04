"""Labeled screenshot placeholders until Expo Go captures exist."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent / "assets"
OUT.mkdir(parents=True, exist_ok=True)

NAVY, CREAM, GREEN, SKY, GOLD, WHITE = (
    (11, 31, 58),
    (246, 241, 228),
    (46, 157, 79),
    (110, 198, 255),
    (232, 163, 23),
    (255, 255, 255),
)

SHOTS = [
    (
        "placeholder-map.png",
        GREEN,
        "Map",
        "Nearby landmark bags",
        "Capture in Expo Go:\nWalk tab · map with\nfood-bag landmarks",
    ),
    (
        "placeholder-walk.png",
        SKY,
        "Walk",
        "Blooming trail",
        "Capture in Expo Go:\nDemo Walk on · trail\nblooms toward a place",
    ),
    (
        "placeholder-capture.png",
        GOLD,
        "Collect",
        "Capture reward",
        "Capture in Expo Go:\nCapture viewfinder\nor hatch / pet reveal",
    ),
]


def font(size, bold=False):
    names = (
        ("arialbd.ttf" if bold else "arial.ttf"),
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibri.ttf",
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def round_mask(size, radius):
    w, h = size
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    return mask


def phone(path, accent, kicker, title, hint):
    w, h = 720, 1280
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 72, fill=CREAM + (255,))
    d.rounded_rectangle((0, 0, w - 1, 220), 72, fill=accent + (255,))
    d.rectangle((0, 110, w, 220), fill=accent + (255,))
    d.text((48, 36), "PLACEHOLDER", font=font(28, True), fill=WHITE)
    d.text((48, 84), kicker, font=font(44, True), fill=WHITE)
    d.text((48, 270), title, font=font(48, True), fill=NAVY)
    y = 370
    for line in hint.split("\n"):
        d.text((48, y), line, font=font(36), fill=(70, 90, 80))
        y += 52
    d.rounded_rectangle((48, 980, w - 48, 1160), 28, fill=NAVY + (255,))
    d.text((78, 1020), "Not a live screenshot", font=font(32, True), fill=WHITE)
    d.text((78, 1070), "Swap after device capture", font=font(28), fill=SKY)
    img.putalpha(round_mask((w, h), 72))
    img.save(path, "PNG")


def main():
    for name, accent, kicker, title, hint in SHOTS:
        phone(OUT / name, accent, kicker, title, hint)


if __name__ == "__main__":
    main()
