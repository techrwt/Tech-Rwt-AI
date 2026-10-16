#!/usr/bin/env python3
"""
TECH RWT AI - image optimizer (PNG/JPG -> WebP, अपने आप)

assets/img/ में कोई भी .png / .jpg / .jpeg डालिए, ये हर एक के लिए बनाता है:
  नाम.webp       - लेख पेज के लिए (अधिकतम 1200px चौड़ा)
  नाम-600.webp   - कार्ड (होम / खोज) के लिए, छोटा और तेज़
  नाम-og.jpg     - सोशल शेयर (og:image) के लिए 1200x630, ~100-200KB
                   (WhatsApp बहुत बड़ी फ़ोटो का preview नहीं दिखाता)

मूल फ़ाइल जैसी है वैसी रहती है। जो फ़ाइल पहले से बन चुकी है और मूल से नई है, उसे दोबारा नहीं बनाता।
लोगो (logo.*) और favicon को छुआ नहीं जाता।
चलाने का तरीका:  python3 scripts/optimize_images.py   (ज़रूरत: pip install pillow)
"""
import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow चाहिए: pip install pillow")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMG_DIR = os.path.join(ROOT, "assets", "img")
SRC_EXT = (".png", ".jpg", ".jpeg")
SKIP_PREFIX = ("logo", "favicon")
MAX_W, CARD_W = 1200, 600
OG_SIZE = (1200, 630)


def needs(dst, src):
    return not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src)


def flatten(im):
    """पारदर्शी PNG को JPG के लिए सफ़ेद बैकग्राउंड पर रखना"""
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def save_webp(im, path, width):
    out = im
    if out.width > width:
        out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
    has_alpha = out.mode in ("RGBA", "LA", "P")
    out = out.convert("RGBA" if has_alpha else "RGB")
    out.save(path, "WEBP", quality=80, method=6)


def main():
    if not os.path.isdir(IMG_DIR):
        print("assets/img नहीं मिला, कुछ करना नहीं है")
        return
    done = 0
    for name in sorted(os.listdir(IMG_DIR)):
        base, ext = os.path.splitext(name)
        if ext.lower() not in SRC_EXT or base.lower().startswith(SKIP_PREFIX):
            continue
        if base.endswith("-og"):
            continue
        src = os.path.join(IMG_DIR, name)
        targets = {
            os.path.join(IMG_DIR, base + ".webp"): "full",
            os.path.join(IMG_DIR, base + "-600.webp"): "card",
            os.path.join(IMG_DIR, base + "-og.jpg"): "og",
        }
        todo = {p: k for p, k in targets.items() if needs(p, src)}
        if not todo:
            continue
        im = ImageOps.exif_transpose(Image.open(src))
        im.load()
        for path, kind in todo.items():
            if kind == "full":
                save_webp(im, path, MAX_W)
            elif kind == "card":
                save_webp(im, path, CARD_W)
            else:
                ImageOps.fit(flatten(im), OG_SIZE, Image.LANCZOS).save(
                    path, "JPEG", quality=82, optimize=True, progressive=True)
            print("  ✔ %-45s %6.0f KB" % (os.path.relpath(path, ROOT), os.path.getsize(path) / 1024))
            done += 1
    print("✔ images: %d फ़ाइलें बनीं" % done)


if __name__ == "__main__":
    main()
