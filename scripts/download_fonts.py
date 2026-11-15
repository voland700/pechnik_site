"""
Загрузка локального переменного шрифта Onest (WOFF2, кириллица + латиница)
с Google Fonts API. Файлы сохраняются в src/assets/fonts/onest/.

Onest распространяется как variable font: один файл покрывает все веса
(используем диапазон 300–700: Light/Regular/SemiBold/Bold), поэтому
скачивается по одному файлу на подмножество, а @font-face объявляется
с диапазоном весов (см. src/styles/base/_fonts.scss).

Повторный запуск: python scripts/download_fonts.py
"""
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "src" / "assets" / "fonts" / "onest"
FAMILY = "Onest"
WEIGHT_RANGE = "300..700"
SUBSETS = ["cyrillic", "latin"]

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def main() -> None:
    css_url = f"https://fonts.googleapis.com/css2?family={FAMILY}:wght@{WEIGHT_RANGE}&display=swap"
    css = fetch(css_url).decode("utf-8")

    blocks = re.findall(r"/\* (\S+) \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
    if not blocks:
        raise SystemExit("Не удалось разобрать CSS от Google Fonts")

    DEST.mkdir(parents=True, exist_ok=True)
    # Удаляем устаревшие файлы прежних схем именования
    for old in DEST.glob("*.woff2"):
        old.unlink()

    for subset, body in blocks:
        if subset not in SUBSETS:
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        name = f"{FAMILY.lower()}-var-{subset}.woff2"
        (DEST / name).write_bytes(fetch(url))
        print(f"OK {name}")

    print(f"Готово -> {DEST}")


if __name__ == "__main__":
    main()
