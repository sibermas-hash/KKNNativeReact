#!/usr/bin/env python3
# Renders REAL glassmorphism proof images (Gaussian-blurred colorful backdrop
# refracting through translucent frosted cards) for all 5 SIBERMAS themes.
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
themes = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "themes.json")))

SC = 2
W, H = 1120, 600

FONTDIR_SERIF = "/usr/share/fonts/dejavu-serif-fonts/"
FONTDIR_SANS = "/usr/share/fonts/dejavu-sans-fonts/"
FONTDIR_MONO = "/usr/share/fonts/dejavu-sans-mono-fonts/"

HEAD = {
    "akademik": FONTDIR_SERIF + "DejaVuSerif-Bold.ttf",
    "nusantara": FONTDIR_SANS + "DejaVuSans-Bold.ttf",
    "minimal": FONTDIR_SANS + "DejaVuSans-Bold.ttf",
    "sustainability": FONTDIR_SANS + "DejaVuSansCondensed-Bold.ttf",
    "professional": FONTDIR_MONO + "DejaVuSansMono-Bold.ttf",
}
ORBS = {
    "akademik": ["#0F766E", "#C2A14D", "#2DD4BF"],
    "nusantara": ["#B5532A", "#E2A03F", "#4F7942"],
    "minimal": ["#2563EB", "#14B8A6", "#0EA5E9"],
    "sustainability": ["#059669", "#65A30D", "#34D399"],
    "professional": ["#38BDF8", "#818CF8", "#22D3EE"],
}


def hx(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def font(path, size):
    return ImageFont.truetype(path, size * SC)


def q(v):
    return int(round(v * SC))


def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    return m


def render(theme):
    slug = theme["slug"]
    v = theme["vars"]
    page = hx(v["--profile-page"])
    text = hx(v["--profile-text"])
    muted = hx(v["--profile-muted"])
    primary = hx(v["--profile-primary"])
    accent = hx(v["--profile-accent"])
    soft = hx(v["--profile-soft"])
    softt = hx(v["--profile-soft-text"])
    strong = hx(v["--profile-surface-strong"])
    dark = slug == "professional"

    hfont = HEAD[slug]
    f_h1 = font(hfont, 20)
    f_val = font(hfont, 24)
    f_t = font(FONTDIR_SANS + "DejaVuSans.ttf", 12)
    f_s = font(FONTDIR_SANS + "DejaVuSans.ttf", 10)
    f_card = font(hfont, 14)

    base = Image.new("RGB", (q(W), q(H)), page)

    # --- colorful orb scene ---
    orb_layer = Image.new("RGBA", (q(W), q(H)), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb_layer)
    cols = ORBS[slug]
    spots = [(-60, -80, 360), (W - 220, 120, 380), (W * 0.34, H - 120, 420)]
    for (cx, cy, rad), col in zip(spots, cols):
        rr = hx(col)
        od.ellipse([q(cx), q(cy), q(cx + rad), q(cy + rad)], fill=(rr[0], rr[1], rr[2], 200))
    orb_layer = orb_layer.filter(ImageFilter.GaussianBlur(q(70)))
    base = Image.alpha_composite(base.convert("RGBA"), orb_layer).convert("RGB")

    def frosted(box, tint, alpha, radius=14, blur=16, sheen=True):
        x0, y0, x1, y1 = [q(c) for c in box]
        w, h = x1 - x0, y1 - y0
        region = base.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(q(blur)))
        ov = Image.new("RGBA", (w, h), (tint[0], tint[1], tint[2], alpha))
        frosted_img = Image.alpha_composite(region.convert("RGBA"), ov)
        if sheen:
            sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            sd = ImageDraw.Draw(sh)
            for i in range(h // 2):
                a = int((1 - i / (h / 2)) * (26 if dark else 70))
                sd.line([(0, i), (w, i)], fill=(255, 255, 255, a))
            frosted_img = Image.alpha_composite(frosted_img, sh)
        mask = rounded_mask(w, h, q(radius))
        base.paste(frosted_img.convert("RGB"), (x0, y0), mask)
        bd = ImageDraw.Draw(base)
        bc = (255, 255, 255, 40) if dark else (255, 255, 255)
        bd.rounded_rectangle([x0, y0, x1 - 1, y1 - 1], radius=q(radius),
                             outline=(255, 255, 255) if not dark else (120, 140, 170), width=max(1, q(1)))

    tint = (20, 30, 50) if dark else (255, 255, 255)
    alpha = 108 if dark else 116

    # sidebar
    frosted((16, 16, 232, H - 16), tint, alpha + 6, radius=16, blur=18)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([q(32), q(32), q(56), q(56)], radius=q(7), fill=primary)
    d.text((q(66), q(34)), "SIBERMAS", font=f_card, fill=text)
    navs = ["Dashboard", "Mahasiswa", "Lokasi KKN", "Jadwal", "Laporan"]
    ny = 88
    for i, n in enumerate(navs):
        if i == 0:
            d.rounded_rectangle([q(28), q(ny - 6), q(220), q(ny + 22)], radius=q(9), fill=soft)
            d.text((q(40), q(ny)), n, font=f_t, fill=softt)
        else:
            d.text((q(40), q(ny)), n, font=f_t, fill=muted)
        ny += 40

    # topbar text
    d.text((q(260), q(28)), "Beranda KKN", font=f_h1, fill=text)
    d.text((q(260), q(58)), "Dashboard / Ringkasan", font=f_s, fill=muted)

    # stat cards
    labels = [("Mahasiswa", "128", "+8%"), ("Desa Lokasi", "32", "+2"),
              ("Laporan", "94%", "+5%"), ("Kegiatan", "17", "-3%")]
    cx = 260
    cw = 198
    for lab, val, delta in labels:
        frosted((cx, 92, cx + cw - 14, 188), tint, alpha, radius=14, blur=16)
        d.text((q(cx + 16), q(104)), lab, font=f_s, fill=muted)
        d.text((q(cx + 16), q(120)), val, font=f_val, fill=text)
        d.text((q(cx + 16), q(158)), ("▲ " if not delta.startswith("-") else "▼ ") + delta,
               font=f_s, fill=softt if not delta.startswith("-") else hx(v["--profile-danger-text"]))
        cx += cw

    # donut card
    frosted((260, 204, 568, H - 16), tint, alpha, radius=14, blur=16)
    d.text((q(276), q(218)), "Status Mahasiswa", font=f_card, fill=text)
    # donut
    ccx, ccy, rO, rI = 340, 330, 56, 34
    bbox = [q(ccx - rO), q(ccy - rO), q(ccx + rO), q(ccy + rO)]
    segs = [(0.62, primary), (0.26, accent), (0.12, muted)]
    start = -90
    for frac, col in segs:
        end = start + frac * 360
        d.pieslice(bbox, start, end, fill=col)
        start = end
    d.ellipse([q(ccx - rI), q(ccy - rI), q(ccx + rI), q(ccy + rI)],
              fill=(20, 30, 50) if dark else (255, 255, 255))
    d.text((q(ccx - 16), q(ccy - 12)), "128", font=f_card, fill=text)
    ly = 300
    for name, pct, col in [("Aktif", "62%", primary), ("Review", "26%", accent), ("Nonaktif", "12%", muted)]:
        d.rounded_rectangle([q(420), q(ly), q(430), q(ly + 10)], radius=q(2), fill=col)
        d.text((q(440), q(ly - 2)), name, font=f_s, fill=text)
        d.text((q(528), q(ly - 2)), pct, font=f_s, fill=muted)
        ly += 26

    # bar card
    frosted((580, 204, W - 16, H - 16), tint, alpha, radius=14, blur=16)
    d.text((q(596), q(218)), "Laporan per Bulan", font=f_card, fill=text)
    vals = [5, 7, 6, 9, 7, 11, 8, 12, 9, 10, 8, 13]
    mx = max(vals)
    bx0, by1, bw, bh = 600, H - 60, 38, 240
    for i, val in enumerate(vals):
        bh_i = int(val / mx * bh)
        x = bx0 + i * (bw + 4)
        d.rounded_rectangle([q(x), q(by1 - bh_i), q(x + bw), q(by1)], radius=q(5), fill=primary)

    # label
    d.text((q(260), q(H - 6)), "", font=f_s, fill=muted)
    return base.resize((W, H), Image.LANCZOS)


panels = []
for t in themes:
    p = render(t)
    # caption strip
    cap = Image.new("RGB", (W, 34), hx(t["vars"]["--profile-primary"]))
    cd = ImageDraw.Draw(cap)
    cf = ImageFont.truetype(FONTDIR_SANS + "DejaVuSans-Bold.ttf", 16)
    txtcol = (11, 18, 32) if t["slug"] == "professional" else (255, 255, 255)
    cd.text((16, 7), t["label"] + "  —  glassmorphism", font=cf, fill=txtcol)
    panels.append(cap)
    panels.append(p)

totalH = sum(p.height for p in panels) + (len(panels) // 2) * 12
out = Image.new("RGB", (W, totalH), (235, 238, 240))
y = 0
for i, p in enumerate(panels):
    out.paste(p, (0, y))
    y += p.height
    if i % 2 == 1:
        y += 12

out.save(os.path.join(ROOT, "glass-preview.png"))
# single-theme hero (akademik) and pdf of all
hero = render(themes[0])
hero.save(os.path.join(ROOT, "glass-hero.png"))
pages = [render(t).convert("RGB") for t in themes]
pages[0].save(os.path.join(ROOT, "glass-preview.pdf"), save_all=True, append_images=pages[1:], resolution=150)
print("wrote glass-preview.png", out.size, "and glass-preview.pdf")
