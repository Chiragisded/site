"""One-off: build OG preview cards and add share tags to the sample pages."""

import glob
import os
import re
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = "https://chiragisded.github.io/website-samples/files"
FONT_DIR = "/tmp/ogfonts"
FONTS = {
    "serif": ("https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf", "InstrumentSerif-Regular.ttf"),
    "serif_it": ("https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Italic.ttf", "InstrumentSerif-Italic.ttf"),
    "inter": ("https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf", "Inter-var.ttf"),
}


def font_path(key):
    os.makedirs(FONT_DIR, exist_ok=True)
    url, name = FONTS[key]
    path = os.path.join(FONT_DIR, name)
    if not os.path.exists(path):
        urllib.request.urlretrieve(url, path)
    return path


W, H = 1200, 630
BG = (13, 15, 13)
TEXT = (236, 234, 228)
MUTED = (157, 159, 152)
ACCENT = (200, 242, 78)
MARGIN = 72


def inter(size, weight):
    f = ImageFont.truetype(font_path("inter"), size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def tracked(draw, xy, text, font, fill, tracking=0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking


def wrap(draw, text, font, maxw):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= maxw:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def card(kicker, headline, italic_tail, sub, out):
    img = Image.new("RGB", (W, H), BG)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([-320, -420, 720, 240], fill=70)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img = Image.composite(Image.new("RGB", (W, H), (32, 44, 16)), img, glow)
    d = ImageDraw.Draw(img)

    d.rectangle([MARGIN, MARGIN, MARGIN + 11, MARGIN + 11], fill=ACCENT)
    tracked(d, (MARGIN + 24, MARGIN - 8), "Chirag", inter(26, 500), TEXT, 0.4)
    tracked(d, (MARGIN, 232), kicker, inter(19, 600), ACCENT, 2.6)

    hf = ImageFont.truetype(font_path("serif"), 74)
    y = 288
    for line in wrap(d, headline, hf, 1050):
        d.text((MARGIN, y), line, font=hf, fill=TEXT)
        y += 82
    if italic_tail:
        d.text((MARGIN, y), italic_tail, font=ImageFont.truetype(font_path("serif_it"), 74), fill=ACCENT)
        y += 82

    d.text((MARGIN, y + 18), sub, font=inter(27, 400), fill=(195, 196, 189))
    d.line([MARGIN, H - 96, W - MARGIN, H - 96], fill=(40, 44, 38), width=2)
    tracked(d, (MARGIN, H - 76), "chiragisded.github.io/website-samples/files", inter(20, 400), MUTED, 0.2)

    img.save(out, "PNG", optimize=True)
    print("wrote", out, os.path.getsize(out), "bytes")


CARDS = [
    ("hub", "FOUR WORKING SAMPLES", "Sample sites, and the job", "each one does.",
     "Invented businesses. Real websites. Open one and read what it fixes.", "hub.png"),
    ("salon", "PACKAGE 1  \u00b7  FROM \u20b912,000", "Kaya Salon & Spa,", "Vashi.",
     "Prices, hours, and a booking button that opens WhatsApp.", "salon.png"),
    ("coaching", "PACKAGE 2  \u00b7  FROM \u20b935,000", "Bright Minds Classes,", "Nerul.",
     "Enquiries that land in one list instead of a DM.", "coaching.png"),
    ("gym", "PACKAGE 3  \u00b7  FROM \u20b955,000", "Iron Yard Fitness,", "Kharghar.",
     "Plans side by side, a join form, a member ID.", "gym.png"),
    ("atelier", "CUSTOM QUOTE  \u00b7  BRAND SITE", "Sable & Stone,", "Bandra West.",
     "A studio site that leans on how it looks.", "atelier.png"),
]

os.makedirs("files/demos/previews", exist_ok=True)
for _, kicker, head, tail, sub, out in CARDS:
    card(kicker, head, tail, sub, os.path.join("files/demos/previews", out))


def og_block(title, desc, url, img):
    return (
        '<meta property="og:type" content="website">\n'
        '<meta property="og:site_name" content="Chirag \u2014 websites for small businesses">\n'
        f'<meta property="og:title" content="{title}">\n'
        f'<meta property="og:description" content="{desc}">\n'
        f'<meta property="og:url" content="{url}">\n'
        '<meta property="og:locale" content="en_IN">\n'
        f'<meta property="og:image" content="{img}">\n'
        '<meta property="og:image:width" content="1200">\n'
        '<meta property="og:image:height" content="630">\n'
        f'<meta property="og:image:alt" content="{title}">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        f'<meta name="twitter:title" content="{title}">\n'
        f'<meta name="twitter:description" content="{desc}">\n'
        f'<meta name="twitter:image" content="{img}">\n'
    )


def preview_name(path):
    if path == "files/demos/index.html":
        return "hub"
    return os.path.basename(os.path.dirname(path))


def url_for(path):
    return BASE + "/" + os.path.relpath(path, "files").replace(os.sep, "/")


for path in ["files/demos/index.html"] + sorted(glob.glob("files/demos/*/*.html")):
    s = open(path, encoding="utf-8").read()
    if 'property="og:' in s:
        print("skip, already tagged:", path)
        continue
    m = re.search(r'<meta name="description" content="([^"]*)"\s*>', s)
    if not m:
        print("no description, skipped:", path)
        continue
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    title = t.group(1).strip() if t else "Sample website \u2014 Chirag"
    desc = m.group(1)
    img = f"{BASE}/demos/previews/{preview_name(path)}.png"
    s = s[: m.end()] + "\n" + og_block(title, desc, url_for(path), img) + s[m.end():]
    s = s.replace(
        '<p class="type">Package 4 \u00b7 premium / brand site</p>',
        '<p class="type">Custom quote \u00b7 brand site</p>',
    )
    open(path, "w", encoding="utf-8").write(s)
    print("tagged:", path)
