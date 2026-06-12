#!/usr/bin/env python3
# Renders 5 DISTINCT SIBERMAS theme identities (layout + shapes + ornaments).
import json, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
themes = {t["slug"]: t for t in json.load(open(os.path.join(HERE, "themes.json")))}

SC = 2
W = 1180
FS = "/usr/share/fonts/dejavu-serif-fonts/"
FA = "/usr/share/fonts/dejavu-sans-fonts/"
FM = "/usr/share/fonts/dejavu-sans-mono-fonts/"
FONTS = {
    "akademik": (FS + "DejaVuSerif-Bold.ttf", FA + "DejaVuSans.ttf"),
    "nusantara": (FA + "DejaVuSans-Bold.ttf", FA + "DejaVuSans.ttf"),
    "minimal": (FA + "DejaVuSans-Bold.ttf", FA + "DejaVuSans.ttf"),
    "sustainability": (FA + "DejaVuSansCondensed-Bold.ttf", FA + "DejaVuSansCondensed.ttf"),
    "professional": (FM + "DejaVuSansMono-Bold.ttf", FA + "DejaVuSans.ttf"),
}
ORBS = {"professional": ["#38BDF8", "#818CF8", "#22D3EE"]}


def hx(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def q(v):
    return int(round(v * SC))


def fnt(p, s):
    return ImageFont.truetype(p, q(s))


def rmask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    return m


def vgrad(w, h, c1, c2):
    strip = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        strip.putpixel((0, y), tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    return strip.resize((w, h))


def hgrad(w, h, c1, c2):
    strip = Image.new("RGB", (w, 1))
    for x in range(w):
        t = x / max(1, w - 1)
        strip.putpixel((x, 0), tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    return strip.resize((w, h))


def paste_round(base, img, pos, r):
    base.paste(img, pos, rmask(img.size[0], img.size[1], r))


def shadow(base, box, r, blur=16, alpha=55, dy=10):
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([q(box[0]), q(box[1] + dy), q(box[2]), q(box[3] + dy)],
                        radius=q(r), fill=(0, 0, 0, alpha))
    base.alpha_composite(lay.filter(ImageFilter.GaussianBlur(q(blur))))


def card(base, box, fill, r, border=None, sh=True, shalpha=55):
    if sh:
        shadow(base, box, r, alpha=shalpha)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([q(box[0]), q(box[1]), q(box[2]), q(box[3])], radius=q(r),
                        fill=fill, outline=border, width=q(1) if border else 0)


def star(d, cx, cy, r, color, n=8, inner=0.45):
    pts = []
    for i in range(n * 2):
        ang = math.pi * i / n - math.pi / 2
        rad = r if i % 2 == 0 else r * inner
        pts.append((q(cx + rad * math.cos(ang)), q(cy + rad * math.sin(ang))))
    d.polygon(pts, fill=color)


def leaf(d, cx, cy, s, color):
    d.ellipse([q(cx - s * .5), q(cy - s), q(cx + s * .5), q(cy)], fill=color)
    d.ellipse([q(cx - s * .5), q(cy), q(cx + s * .5), q(cy + s)], fill=color)


def bars(d, x0, y1, vals, color, bw=26, gap=6, maxh=120):
    mx = max(vals)
    for i, v in enumerate(vals):
        h = int(v / mx * maxh)
        x = x0 + i * (bw + gap)
        d.rounded_rectangle([q(x), q(y1 - h), q(x + bw), q(y1)], radius=q(4), fill=color)


def donut(d, cx, cy, rO, rI, segs, hole):
    bbox = [q(cx - rO), q(cy - rO), q(cx + rO), q(cy + rO)]
    a = -90
    for frac, col in segs:
        b = a + frac * 360
        d.pieslice(bbox, a, b, fill=col)
        a = b
    d.ellipse([q(cx - rI), q(cy - rI), q(cx + rI), q(cy + rI)], fill=hole)


def V(slug):
    return themes[slug]["vars"]


# ============================ LAYOUT A: AKADEMIK ============================
def akademik():
    v = V("akademik")
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    primary, accent = hx(v["--profile-primary"]), hx(v["--profile-accent"])
    soft, softt, surf = hx(v["--profile-soft"]), hx(v["--profile-soft-text"]), hx(v["--profile-surface"])
    border, strong = hx(v["--profile-border"]), hx(v["--profile-surface-strong"])
    H = 600
    hf, bf = FONTS["akademik"]
    base = Image.new("RGBA", (q(W), q(H)), page)
    d = ImageDraw.Draw(base)
    # sidebar (classic)
    d.rectangle([0, 0, q(232), q(H)], fill=surf)
    d.line([q(232), 0, q(232), q(H)], fill=border, width=q(1))
    d.rounded_rectangle([q(28), q(28), q(52), q(52)], radius=q(6), fill=primary)
    d.text((q(64), q(30)), "SIBERMAS", font=fnt(hf, 17), fill=text)
    navs = ["Dashboard", "Mahasiswa", "Lokasi KKN", "Jadwal", "Laporan", "Pengaturan"]
    y = 92
    for i, n in enumerate(navs):
        if i == 0:
            d.rounded_rectangle([q(20), q(y - 6), q(212), q(y + 24)], radius=q(8), fill=soft)
            d.text((q(36), q(y)), n, font=fnt(bf, 13), fill=softt)
        else:
            d.text((q(36), q(y)), n, font=fnt(bf, 13), fill=muted)
        y += 42
    # banner with left gold accent bar + star ornament
    card(base, (256, 24, W - 24, 132), surf, 12, sh=True)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([q(256), q(24), q(264), q(132)], radius=q(4), fill=accent)
    d.text((q(284), q(40)), "Beranda KKN", font=fnt(hf, 24), fill=text)
    d.text((q(284), q(82)), "Sistem Informasi KKN · UIN Saizu", font=fnt(bf, 13), fill=muted)
    star(d, W - 80, 78, 34, (accent[0], accent[1], accent[2]))
    star(d, W - 80, 78, 18, surf)
    # stat cards
    stats = [("Mahasiswa", "128"), ("Desa Lokasi", "32"), ("Laporan", "94%"), ("Kegiatan", "17")]
    x = 256
    cw = 230
    for lab, val in stats:
        card(base, (x, 152, x + cw - 16, 248), surf, 12, shalpha=40)
        dd = ImageDraw.Draw(base)
        dd.text((q(x + 18), q(166)), lab, font=fnt(bf, 12), fill=muted)
        dd.text((q(x + 18), q(186)), val, font=fnt(hf, 26), fill=text)
        dd.line([q(x + 18), q(232), q(x + 60), q(232)], fill=accent, width=q(2))
        x += cw
    # table card
    card(base, (256, 268, W - 24, H - 24), surf, 12)
    d = ImageDraw.Draw(base)
    d.text((q(280), q(286)), "Aktivitas Mahasiswa", font=fnt(hf, 15), fill=text)
    rows = [("Akun Tholib", "Sukamaju", "Aktif", soft, softt),
            ("Siti Aisyah", "Mekarsari", "Review", hx(v["--profile-warning"]), hx(v["--profile-warning-text"])),
            ("Budi Santoso", "Cibadak", "Aktif", soft, softt),
            ("Rina Wati", "Sumberejo", "Ditolak", hx(v["--profile-danger"]), hx(v["--profile-danger-text"]))]
    ry = 326
    for nm, desa, st, pill, pillt in rows:
        d.ellipse([q(280), q(ry), q(304), q(ry + 24)], fill=soft)
        d.text((q(316), q(ry + 4)), nm, font=fnt(bf, 13), fill=text)
        d.text((q(560), q(ry + 4)), desa, font=fnt(bf, 13), fill=muted)
        d.rounded_rectangle([q(820), q(ry + 2), q(900), q(ry + 24)], radius=q(11), fill=pill)
        d.text((q(834), q(ry + 5)), st, font=fnt(bf, 11), fill=pillt)
        d.line([q(280), q(ry + 38), q(W - 48), q(ry + 38)], fill=border, width=q(1))
        ry += 50
    return base.convert("RGB"), H


# ============================ LAYOUT B: NUSANTARA ============================
def nusantara():
    v = V("nusantara")
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    primary, accent = hx(v["--profile-primary"]), hx(v["--profile-accent"])
    soft, softt, surf = hx(v["--profile-soft"]), hx(v["--profile-soft-text"]), hx(v["--profile-surface"])
    leafgreen = hx("#4F7942")
    H = 640
    hf, bf = FONTS["nusantara"]
    base = Image.new("RGBA", (q(W), q(H)), page)
    # HERO (image-overlay, gradient)
    hero = hgrad(q(W), q(190), primary, leafgreen)
    ov = Image.new("RGBA", (q(W), q(190)), (40, 20, 10, 70))
    hero = Image.alpha_composite(hero.convert("RGBA"), ov)
    base.paste(hero.convert("RGB"), (0, 0))
    d = ImageDraw.Draw(base)
    # batik diamond motif row
    for i in range(14):
        cx = 60 + i * 84
        d.polygon([(q(cx), q(20)), (q(cx + 12), q(32)), (q(cx), q(44)), (q(cx - 12), q(32))],
                  outline=(accent[0], accent[1], accent[2], 180), width=q(1))
    d.text((q(40), q(64)), "Beranda KKN Nusantara", font=fnt(hf, 28), fill=(255, 255, 255))
    d.text((q(40), q(112)), "Desa membangun, mahasiswa mengabdi", font=fnt(bf, 14), fill=(255, 240, 225))
    # search pill on hero
    d.rounded_rectangle([q(W - 360), q(96), q(W - 40), q(140)], radius=q(22), fill=(255, 255, 255, 235))
    d.ellipse([q(W - 344), q(110), q(W - 328), q(126)], outline=muted, width=q(2))
    d.text((q(W - 312), q(110)), "Cari desa, mahasiswa…", font=fnt(bf, 13), fill=muted)
    # top nav chips below hero
    chips = ["Ringkasan", "Program", "Logbook", "Galeri"]
    cx = 40
    for i, c in enumerate(chips):
        w = int(d.textlength(c, font=fnt(bf, 13)) / SC) + 36
        fillc = primary if i == 0 else surf
        txtc = (255, 255, 255) if i == 0 else muted
        card(base, (cx, 212, cx + w, 250), fillc, 16, sh=False)
        ImageDraw.Draw(base).text((q(cx + 18), q(221)), c, font=fnt(bf, 13), fill=txtc)
        cx += w + 12
    # stacked stat cards (very rounded, raised)
    stats = [("Mahasiswa", "128", "+8%"), ("Desa Lokasi", "32", "+2"), ("Program", "46", "+5")]
    x = 40
    cw = 366
    for lab, val, dl in stats:
        card(base, (x, 268, x + cw - 16, 376), surf, 18, shalpha=70)
        dd = ImageDraw.Draw(base)
        leaf(dd, x + 34, 308, 16, accent)
        dd.text((q(x + 64), q(286)), lab, font=fnt(bf, 13), fill=muted)
        dd.text((q(x + 64), q(308)), val, font=fnt(hf, 28), fill=text)
        dd.text((q(x + 64), q(348)), "▲ " + dl, font=fnt(bf, 12), fill=softt)
        x += cw
    # program list card
    card(base, (40, 396, W - 40, H - 32), surf, 18)
    d = ImageDraw.Draw(base)
    d.text((q(64), q(414)), "Program Desa Unggulan", font=fnt(hf, 16), fill=text)
    progs = ["Posyandu Digital — Desa Sukamaju", "Bank Sampah — Desa Mekarsari",
             "Literasi Anak — Desa Cibadak", "UMKM Go Online — Desa Mulyasari"]
    py = 456
    for p in progs:
        leaf(d, 76, py + 10, 12, leafgreen)
        d.text((q(96), q(py)), p, font=fnt(bf, 13), fill=text)
        d.rounded_rectangle([q(W - 200), q(py), q(W - 70), q(py + 16)], radius=q(8), fill=hx(v["--profile-surface-strong"]))
        d.rounded_rectangle([q(W - 200), q(py), q(W - 130), q(py + 16)], radius=q(8), fill=primary)
        py += 46
    return base.convert("RGB"), H


# ============================ LAYOUT C: MINIMAL ============================
def minimal():
    v = V("minimal")
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    primary, border = hx(v["--profile-primary"]), hx(v["--profile-border"])
    H = 560
    hf, bf = FONTS["minimal"]
    base = Image.new("RGBA", (q(W), q(H)), (255, 255, 255))
    d = ImageDraw.Draw(base)
    M = 220  # big side margins -> centered airy column
    # minimal top nav (text only, underline active)
    d.text((q(M), q(40)), "SIBERMAS", font=fnt(hf, 16), fill=text)
    nav = ["Ringkasan", "Mahasiswa", "Laporan"]
    nx = W - M - 300
    for i, n in enumerate(nav):
        d.text((q(nx), q(42)), n, font=fnt(bf, 13), fill=text if i == 0 else muted)
        if i == 0:
            d.line([q(nx), q(64), q(nx + 70), q(64)], fill=primary, width=q(2))
        nx += 110
    # big light title
    d.text((q(M), q(96)), "Beranda", font=fnt(hf, 40), fill=text)
    d.text((q(M), q(156)), "Ringkasan kegiatan KKN periode ini.", font=fnt(bf, 15), fill=muted)
    # flat stats separated by thin dividers (no cards)
    stats = [("Mahasiswa", "128"), ("Desa", "32"), ("Laporan", "94%"), ("Kegiatan", "17")]
    sx = M
    colw = (W - 2 * M) // 4
    for i, (lab, val) in enumerate(stats):
        d.text((q(sx), q(230)), lab.upper(), font=fnt(bf, 11), fill=muted)
        d.text((q(sx), q(252)), val, font=fnt(hf, 34), fill=text)
        if i > 0:
            d.line([q(sx - 20), q(232), q(sx - 20), q(300)], fill=border, width=q(1))
        sx += colw
    d.line([q(M), q(330), q(W - M), q(330)], fill=border, width=q(1))
    # thin-bordered minimal table
    d.text((q(M), q(360)), "Aktivitas terbaru", font=fnt(hf, 16), fill=text)
    rows = [("Akun Tholib", "Sukamaju", "Aktif"), ("Siti Aisyah", "Mekarsari", "Review"),
            ("Budi Santoso", "Cibadak", "Aktif")]
    ry = 400
    for nm, desa, st in rows:
        d.text((q(M), q(ry)), nm, font=fnt(bf, 13), fill=text)
        d.text((q(M + 280), q(ry)), desa, font=fnt(bf, 13), fill=muted)
        d.text((q(W - M - 80), q(ry)), st, font=fnt(bf, 13), fill=primary)
        d.line([q(M), q(ry + 32), q(W - M), q(ry + 32)], fill=border, width=q(1))
        ry += 48
    return base.convert("RGB"), H


# ========================= LAYOUT D: SUSTAINABILITY =========================
def sustainability():
    v = V("sustainability")
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    primary, accent = hx(v["--profile-primary"]), hx(v["--profile-accent"])
    surf, strong = hx(v["--profile-surface"]), hx(v["--profile-surface-strong"])
    H = 600
    hf, bf = FONTS["sustainability"]
    base = Image.new("RGBA", (q(W), q(H)), page)
    d = ImageDraw.Draw(base)
    leaf(d, 48, 56, 18, primary)
    d.text((q(72), q(34)), "Dashboard Keberlanjutan KKN", font=fnt(hf, 22), fill=text)
    d.text((q(72), q(66)), "Dampak program lingkungan & sosial", font=fnt(bf, 13), fill=muted)
    # gradient metric grid 2x3
    tiles = [("Pohon Ditanam", "1.240", primary, accent),
             ("Sampah Dikelola", "3.8 t", hx("#047857"), hx("#34D399")),
             ("Desa Hijau", "18", hx("#65A30D"), hx("#A3E635")),
             ("Relawan", "128", hx("#0D9488"), hx("#5EEAD4")),
             ("Air Bersih", "92%", hx("#0E7490"), hx("#22D3EE")),
             ("Energi Surya", "6 kW", hx("#059669"), hx("#86EFAC"))]
    gx0, gy0, tw, th, gap = 40, 104, 356, 132, 16
    for i, (lab, val, c1, c2) in enumerate(tiles):
        col = i % 3
        row = i // 3
        x = gx0 + col * (tw + gap)
        y = gy0 + row * (th + gap)
        shadow(base, (x, y, x + tw, y + th), 14, alpha=60)
        g = vgrad(q(tw), q(th), c1, c2)
        paste_round(base, g, (q(x), q(y)), q(14))
        dd = ImageDraw.Draw(base)
        leaf(dd, x + tw - 36, y + 32, 14, (255, 255, 255))
        dd.text((q(x + 20), q(y + 18)), lab, font=fnt(bf, 13), fill=(255, 255, 255))
        dd.text((q(x + 20), q(y + 44)), val, font=fnt(hf, 30), fill=(255, 255, 255))
        # mini sparkline
        pts = [(x + 20 + k * 22, y + th - 24 - (k % 3) * 10) for k in range(6)]
        dd.line([(q(px), q(py)) for px, py in pts], fill=(255, 255, 255), width=q(2))
    # impact progress card
    card(base, (40, 408, W - 40, H - 28), surf, 14)
    d = ImageDraw.Draw(base)
    d.text((q(64), q(424)), "Capaian Program", font=fnt(hf, 16), fill=text)
    prog = [("Reboisasi", 78), ("Bank Sampah", 64), ("Edukasi Warga", 88)]
    py = 466
    for lab, pct in prog:
        d.text((q(64), q(py)), lab, font=fnt(bf, 13), fill=text)
        d.rounded_rectangle([q(240), q(py + 2), q(W - 120), q(py + 18)], radius=q(8), fill=strong)
        ww = int((W - 120 - 240) * pct / 100)
        d.rounded_rectangle([q(240), q(py + 2), q(240 + ww), q(py + 18)], radius=q(8), fill=primary)
        d.text((q(W - 100), q(py)), str(pct) + "%", font=fnt(bf, 12), fill=muted)
        py += 40
    return base.convert("RGB"), H


# ========================= LAYOUT E: PROFESSIONAL =========================
def professional():
    v = V("professional")
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    primary, accent = hx(v["--profile-primary"]), hx(v["--profile-accent"])
    soft, softt = hx(v["--profile-soft"]), hx(v["--profile-soft-text"])
    strong, bordr = hx(v["--profile-surface-strong"]), hx(v["--profile-border"])
    H = 600
    hf, bf = FONTS["professional"]
    base = Image.new("RGBA", (q(W), q(H)), page)
    # orbs
    orb = Image.new("RGBA", (q(W), q(H)), (0, 0, 0, 0))
    od = ImageDraw.Draw(orb)
    for (cx, cy, r), col in zip([(-40, -60, 320), (W - 200, 60, 360), (W * .4, H - 80, 380)], ORBS["professional"]):
        rr = hx(col)
        od.ellipse([q(cx), q(cy), q(cx + r), q(cy + r)], fill=(rr[0], rr[1], rr[2], 150))
    base = Image.alpha_composite(base, orb.filter(ImageFilter.GaussianBlur(q(64))))
    # dotted grid backdrop
    dd = ImageDraw.Draw(base)
    for gy in range(40, H, 28):
        for gx in range(40, W, 28):
            dd.ellipse([q(gx), q(gy), q(gx + 1), q(gy + 1)], fill=(255, 255, 255, 16))

    def frost(box, r=12, blur=20, alpha=120):
        x0, y0, x1, y1 = [q(c) for c in box]
        reg = base.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(q(blur)))
        ov = Image.new("RGBA", (x1 - x0, y1 - y0), (20, 30, 50, alpha))
        fr = Image.alpha_composite(reg, ov)
        base.paste(fr.convert("RGB"), (x0, y0), rmask(x1 - x0, y1 - y0, q(r)))
        ImageDraw.Draw(base).rounded_rectangle([x0, y0, x1 - 1, y1 - 1], radius=q(r),
                                               outline=(120, 140, 170), width=q(1))
    # command bar
    frost((24, 24, W - 24, 76), r=12, alpha=130)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([q(40), q(38), q(60), q(58)], radius=q(5), fill=primary)
    d.text((q(72), q(40)), "SIBERMAS", font=fnt(hf, 14), fill=text)
    d.rounded_rectangle([q(380), q(36), q(800), q(64)], radius=q(8), fill=(15, 26, 44))
    d.text((q(400), q(42)), "Cari perintah, mahasiswa, laporan…", font=fnt(bf, 12), fill=muted)
    d.rounded_rectangle([q(742), q(40), q(792), q(60)], radius=q(5), outline=muted, width=q(1))
    d.text((q(752), q(43)), "K", font=fnt(hf, 11), fill=muted)
    # dense KPI strip (6)
    kpis = [("Mhs", "128"), ("Desa", "32"), ("Lap", "94%"), ("Keg", "17"), ("Aktif", "62%"), ("Review", "26%")]
    x = 24
    kw = (W - 48 - 5 * 10) / 6
    for lab, val in kpis:
        frost((x, 92, x + kw, 168), r=10, alpha=110)
        d.text((q(x + 14), q(104)), lab, font=fnt(bf, 11), fill=muted)
        d.text((q(x + 14), q(122)), val, font=fnt(hf, 22), fill=text)
        x += kw + 10
    # left dense table
    frost((24, 184, 700, H - 24), r=12, alpha=120)
    d.text((q(44), q(200)), "Aktivitas (real-time)", font=fnt(hf, 13), fill=text)
    rows = [("Akun Tholib", "Sukamaju", "Aktif", soft, softt),
            ("Siti Aisyah", "Mekarsari", "Review", hx(v["--profile-warning"]), hx(v["--profile-warning-text"])),
            ("Budi Santoso", "Cibadak", "Aktif", soft, softt),
            ("Rina Wati", "Sumberejo", "Ditolak", hx(v["--profile-danger"]), hx(v["--profile-danger-text"])),
            ("Dani Cahya", "Mulyasari", "Aktif", soft, softt),
            ("Lia Pratiwi", "Sumberarum", "Review", hx(v["--profile-warning"]), hx(v["--profile-warning-text"]))]
    ry = 234
    for nm, desa, st, pill, pillt in rows:
        d.text((q(44), q(ry)), nm, font=fnt(bf, 12), fill=text)
        d.text((q(300), q(ry)), desa, font=fnt(bf, 12), fill=muted)
        d.rounded_rectangle([q(560), q(ry - 2), q(660), q(ry + 18)], radius=q(9), fill=pill)
        d.text((q(574), q(ry + 1)), st, font=fnt(bf, 10), fill=pillt)
        d.line([q(44), q(ry + 30), q(680), q(ry + 30)], fill=(255, 255, 255, 20), width=q(1))
        ry += 44
    # right column: donut + bars
    frost((716, 184, W - 24, 360), r=12, alpha=120)
    d.text((q(736), q(200)), "Status", font=fnt(hf, 13), fill=text)
    donut(d, 800, 290, 52, 32, [(.62, primary), (.26, accent), (.12, muted)], (17, 26, 43))
    d.text((q(880), q(250)), "Aktif 62%", font=fnt(bf, 12), fill=text)
    d.text((q(880), q(280)), "Review 26%", font=fnt(bf, 12), fill=muted)
    d.text((q(880), q(310)), "Nonaktif 12%", font=fnt(bf, 12), fill=muted)
    frost((716, 372, W - 24, H - 24), r=12, alpha=120)
    d.text((q(736), q(388)), "Laporan / bln", font=fnt(hf, 13), fill=text)
    bars(d, 740, H - 56, [5, 7, 6, 9, 7, 11, 8, 12], primary, bw=34, gap=8, maxh=110)
    return base.convert("RGB"), H


LAYOUTS = [("akademik", akademik), ("nusantara", nusantara), ("minimal", minimal),
           ("sustainability", sustainability), ("professional", professional)]

panels = []
for slug, fn in LAYOUTS:
    img, h = fn()
    t = themes[slug]
    cap = Image.new("RGB", (W, 36), hx(t["vars"]["--profile-primary"]))
    cf = ImageFont.truetype(FA + "DejaVuSans-Bold.ttf", 17)
    txtcol = (11, 18, 32) if slug == "professional" else (255, 255, 255)
    pat = t["layout"]["pattern"]
    ImageDraw.Draw(cap).text((16, 8), t["label"] + "   —   " + pat, font=cf, fill=txtcol)
    panels.append(cap)
    panels.append(img)
    img.save(os.path.join(ROOT, "theme-" + slug + ".png"))

totalH = sum(p.height for p in panels) + (len(LAYOUTS)) * 14
out = Image.new("RGB", (W, totalH), (232, 235, 238))
y = 0
for i, p in enumerate(panels):
    out.paste(p, (0, y))
    y += p.height + (14 if i % 2 == 1 else 0)
out.save(os.path.join(ROOT, "themes-identity.png"))
print("wrote themes-identity.png", out.size)
