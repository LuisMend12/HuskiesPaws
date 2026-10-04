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


def phone(path, accent, kicker, title, hint):
    w, h = 720, 1280
    img = Image.new("RGB", (w, h), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((36, 36, w - 36, h - 36), 48, fill=CREAM)
    d.rounded_rectangle((36, 36, w - 36, 220), 48, fill=accent)
    d.rectangle((36, 140, w - 36, 220), fill=accent)
    d.text((70, 70), "PLACEHOLDER", font=font(28, True), fill=WHITE)
    d.text((70, 118), kicker, font=font(44, True), fill=WHITE)
    d.text((70, 280), title, font=font(48, True), fill=NAVY)
    y = 380
    for line in hint.split("\n"):
        d.text((70, y), line, font=font(36), fill=(70, 90, 80))
        y += 52
    d.rounded_rectangle((70, 980, w - 70, 1160), 28, fill=NAVY)
    d.text((100, 1020), "Not a live screenshot", font=font(32, True), fill=WHITE)
    d.text((100, 1070), "Swap after device capture", font=font(28), fill=SKY)
    img.save(path, "PNG")


def main():
    for name, accent, kicker, title, hint in SHOTS:
        phone(OUT / name, accent, kicker, title, hint)


if __name__ == "__main__":
    main()
