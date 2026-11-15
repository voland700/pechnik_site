"""
Генерация демонстрационных изображений для UI Kit
(слайды Swiper и картинка для Fancybox) в public/images/demo/.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "public" / "images" / "demo"

PALETTE = [
    ("#4F5A6C", "#657389", "Сланец"),
    ("#FF9C00", "#F7C735", "Пламя"),
    ("#D27347", "#E68800", "Терракота"),
    ("#444E5D", "#4F5A6C", "Глубокий сланец"),
]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient(size: tuple[int, int], c1: str, c2: str) -> Image.Image:
    w, h = size
    top, bottom = hex_to_rgb(c1), hex_to_rgb(c2)
    img = Image.new("RGB", size)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
        draw.line([(0, y), (w, y)], fill=color)
    return img


def label(img: Image.Image, text: str) -> None:
    draw = ImageDraw.Draw(img)
    w, h = img.size
    try:
        font = ImageFont.truetype("arial.ttf", max(28, h // 8))
    except OSError:
        font = ImageFont.load_default()
    box = draw.textbbox((0, 0), text, font=font)
    x = (w - (box[2] - box[0])) / 2
    y = (h - (box[3] - box[1])) / 2
    draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 90))
    draw.text((x, y), text, font=font, fill=(255, 255, 255))


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    for i, (c1, c2, name) in enumerate(PALETTE, start=1):
        img = gradient((1280, 560), c1, c2)
        label(img, f"Pechnik.su — {name}")
        img.save(DEST / f"slide-{i}.jpg", quality=88)
        print(f"OK slide-{i}.jpg")

    big = gradient((1600, 1000), "#D27347", "#FF9C00")
    label(big, "Демо-изображение Fancybox")
    big.save(DEST / "fancybox-full.jpg", quality=90)
    big.resize((480, 300)).save(DEST / "fancybox-thumb.jpg", quality=88)
    print("OK fancybox-full.jpg / fancybox-thumb.jpg")


if __name__ == "__main__":
    main()
