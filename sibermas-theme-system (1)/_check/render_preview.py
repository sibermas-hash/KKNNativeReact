#!/usr/bin/env python3
# SIBERMAS theme preview: each theme gets a DISTINCT font + DISTINCT layout,
# rendered as modular cards (claude.ai-style). Outputs preview.png + preview.pdf.
import json, re, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(__file__)
ROOT = os.path.dirname(HERE)
themes = json.load(open(os.path.join(HERE, "themes.json")))

# ---- fonts (local files; visibly different families per theme) ----
FD = "/usr/share/fonts/dejavu-serif-fonts/"
FS = "/usr/share/fonts/dejavu-sans-fonts/"
FM = "/usr/share/fonts/dejavu-sans-mono-fonts/"
SERIF, SERIF_B = FD + "DejaVuSerif.ttf", FD + "DejaVuSerif-Bold.ttf"
SANS, SANS_B = FS + "DejaVuSans.ttf", FS + "DejaVuSans-Bold.ttf"
COND, COND_B = FS + "DejaVuSansCondensed.ttf", FS + "DejaVuSansCondensed-Bold.ttf"
MONO, MONO_B = FM + "DejaVuSansMono.ttf", FM + "DejaVuSansMono-Bold.ttf"
NOTO = "/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf"
if not os.path.exists(NOTO):
    NOTO = SANS

FP = {
    "akademik":       {"head": SERIF_B, "body": SANS,  "mono": MONO},
    "nusantara":      {"head": NOTO,    "body": NOTO,  "mono": MONO},
    "minimal":        {"head": SANS_B,  "body": SANS,  "mono": MONO},
    "sustainability": {"head": COND_B,  "body": COND,  "mono": MONO},
    "professional":   {"head": MONO_B,  "body": SANS,  "mono": MONO},
}

SC = 2  # supersample
q = lambda v: int(round(v * SC))

def hx(c):
    c = c.lstrip("#")
    if len(c) == 3: c = "".join(ch * 2 for ch in c)
    return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))

def stops(p): return [hx(m) for m in re.findall(r"#[0-9A-Fa-f]{6}", p)]
def lerp(a, b, t): return tuple(int(a[i] + (b[i]-a[i]) * t) for i in range(3))
def multistop(cs, t):
    if t <= 0: return cs[0]
    if t >= 1: return cs[-1]
    s = t * (len(cs)-1); i = int(s); f = s - i
    return lerp(cs[i], cs[min(i+1, len(cs)-1)], f)

W = 860
MARGIN = 24
GAP = 22
HEADER = 100
HEIGHTS = {"akademik":360, "nusantara":392, "minimal":352, "sustainability":360, "professional":384}
order = [t["slug"] for t in themes]
H = HEADER + sum(HEIGHTS[s] for s in order) + GAP*len(order) + MARGIN

img = Image.new("RGBA", (W*SC, H*SC), (15, 17, 22, 255))
d = ImageDraw.Draw(img)

def ff(path, size): return ImageFont.truetype(path, int(size*SC))
def tw(s, path, size): return d.textlength(s, font=ff(path, size)) / SC
def T(x, y, s, path, size, fill, anchor="la"):
    d.text((q(x), q(y)), s, font=ff(path, size), fill=fill, anchor=anchor)

def rrect(box, radius, fill=None, outline=None, width=1):
    d.rounded_rectangle([q(box[0]), q(box[1]), q(box[2]), q(box[3])],
                        radius=q(radius), fill=fill, outline=outline,
                        width=max(1, int(width*SC)))

def composite(layer):
    global img, d
    img = Image.alpha_composite(img, layer)
    d = ImageDraw.Draw(img)

def card(box, radius, fill, outline=None, shadow=True, dy=7, blur=13, alpha=46):
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle(
            [q(box[0]), q(box[1]+dy), q(box[2]), q(box[3]+dy)],
            radius=q(radius), fill=(0, 0, 0, alpha))
        composite(sh.filter(ImageFilter.GaussianBlur(int(blur*SC*0.5))))
    rrect(box, radius, fill=fill, outline=outline, width=1)

def grad_card(box, radius, colors, overlay=0):
    global d
    x0, y0, x1, y1 = q(box[0]), q(box[1]), q(box[2]), q(box[3])
    w, h = x1-x0, y1-y0
    g = Image.new("RGB", (w, h))
    gd = ImageDraw.Draw(g)
    for x in range(w):
        gd.line([(x, 0), (x, h)], fill=multistop(colors, x/max(1, w-1)))
    g = g.convert("RGBA")
    if overlay:
        g = Image.alpha_composite(g, Image.new("RGBA", (w, h), (0, 0, 0, overlay)))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w-1, h-1], radius=q(radius), fill=255)
    img.paste(g.convert("RGB"), (x0, y0), mask)
    d = ImageDraw.Draw(img)

def btn(x, y, label, fill, txt, path, size, radius, h=34, pad=15, outline=None):
    w = tw(label, path, size) + pad*2
    rrect((x, y, x+w, y+h), radius, fill=fill, outline=outline, width=1)
    d.text((q(x+w/2), q(y+h/2)), label, font=ff(path, size), fill=txt, anchor="mm")
    return x + w

def badge(x, y, label, fill, txt, path, size=10.5, h=22, pad=11):
    w = tw(label, path, size) + pad*2
    rrect((x, y, x+w, y+h), 11, fill=fill)
    d.text((q(x+w/2), q(y+h/2)), label, font=ff(path, size), fill=txt, anchor="mm")
    return x + w

def pbar(x, y, w, frac, track, fill, h=8):
    rrect((x, y, x+w, y+h), h/2, fill=track)
    if frac > 0: rrect((x, y, x+w*frac, y+h), h/2, fill=fill)

def fontlabel(t):
    fams = [g.split(":")[0] for g in t["fonts"]["google"]]
    return " + ".join(fams)

def footer(ox, oy_bottom, w, t, muted, mono):
    msg = "Font: " + fontlabel(t) + "   ·   Layout: " + t["layout"]["pattern"]
    T(ox+18, oy_bottom-26, msg, mono, 10, muted)

# ============================= LAYOUTS =============================

def L_akademik(ox, oy, w, h, t):
    v = t["vars"]; fp = FP[t["slug"]]
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    surf, strong, border = hx(v["--profile-surface"]), hx(v["--profile-surface-strong"]), hx(v["--profile-border"])
    soft, softt, primary, accent = hx(v["--profile-soft"]), hx(v["--profile-soft-text"]), hx(v["--profile-primary"]), hx(v["--profile-accent"])
    inp = hx(v["--profile-input"])
    card((ox, oy, ox+w, oy+h), 16, page, border, dy=8, blur=16, alpha=40)
    rrect((ox+1, oy+1, ox+w-1, oy+7), 3, fill=accent)  # gold accent bar
    # sidebar
    sbw = 168
    rrect((ox+14, oy+22, ox+14+sbw, oy+h-16), 12, fill=strong, outline=border, width=1)
    T(ox+30, oy+40, "SIBERMAS", fp["head"], 13, primary)
    nav = [("Beranda", True), ("Mahasiswa", False), ("Lokasi KKN", False), ("Laporan", False), ("Pengaturan", False)]
    ny = oy+72
    for name, active in nav:
        if active:
            rrect((ox+24, ny-4, ox+14+sbw-10, ny+22), 8, fill=soft)
            T(ox+34, ny+4, name, fp["body"], 11.5, softt)
        else:
            T(ox+34, ny+4, name, fp["body"], 11.5, muted)
        ny += 34
    # main
    mx = ox+14+sbw+22
    T(mx, oy+34, "Beranda KKN", fp["head"], 24, text)
    T(mx, oy+66, "Ringkasan kegiatan & status mahasiswa periode ini.", fp["body"], 11.5, muted)
    # 3 stat cards
    stats = [("128", "Mahasiswa"), ("32", "Desa"), ("94%", "Laporan masuk")]
    sw = (ox+w-16 - mx - 2*14) / 3
    sxx = mx
    for num, lab in stats:
        card((sxx, oy+92, sxx+sw, oy+170), 12, surf, border, dy=5, blur=10, alpha=34)
        T(sxx+16, oy+108, num, fp["head"], 22, primary)
        T(sxx+16, oy+142, lab, fp["body"], 11, muted)
        sxx += sw + 14
    # content card
    card((mx, oy+184, ox+w-16, oy+h-40), 12, surf, border, dy=5, blur=10, alpha=34)
    T(mx+16, oy+200, "Tambah Mahasiswa", fp["head"], 14, text)
    T(mx+16, oy+226, "NAMA LENGKAP", fp["body"], 9.5, muted)
    rrect((mx+16, oy+242, ox+w-32, oy+270), 8, fill=inp, outline=border, width=1)
    T(mx+26, oy+256, "cth. Akun Tholib", fp["body"], 11, muted, anchor="lm")
    bx = btn(mx+16, oy+284, "Simpan", primary, (255,255,255), fp["body"], 11.5, 8)
    btn(bx+10, oy+284, "Batal", strong, text, fp["body"], 11.5, 8)
    footer(ox, oy+h, w, t, muted, fp["mono"])

def L_nusantara(ox, oy, w, h, t):
    v = t["vars"]; fp = FP[t["slug"]]
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    surf, strong, border = hx(v["--profile-surface"]), hx(v["--profile-surface-strong"]), hx(v["--profile-border"])
    soft, softt, primary, accent = hx(v["--profile-soft"]), hx(v["--profile-soft-text"]), hx(v["--profile-primary"]), hx(v["--profile-accent"])
    card((ox, oy, ox+w, oy+h), 18, page, border, dy=9, blur=18, alpha=44)
    # hero with image-overlay
    hero = (ox+16, oy+16, ox+w-16, oy+150)
    grad_card(hero, 16, stops(t["preview"]), overlay=42)
    # avatar circles
    axx = ox+w-16-30
    for i in range(3):
        d.ellipse([q(axx), q(oy+28), q(axx+26), q(oy+54)], fill=(255,255,255), outline=primary, width=q(1))
        axx -= 18
    T(ox+34, oy+40, "Desa KKN Nusantara", fp["head"], 23, (255,255,255))
    T(ox+34, oy+74, "Ruang kolaborasi warga & mahasiswa di lapangan.", fp["body"], 12, (255,255,255))
    btn(ox+34, oy+104, "Mulai Kegiatan", (255,255,255), primary, fp["head"], 11.5, 12)
    # two cards below
    gapx = 14
    cw = (w - 32 - gapx) / 2
    lx = ox+16
    card((lx, oy+164, lx+cw, oy+h-40), 16, surf, border, dy=6, blur=12, alpha=38)
    T(lx+18, oy+180, "Agenda Desa", fp["head"], 15, text)
    items = [("Gotong royong", "Sab 08.00"), ("Posyandu", "Min 09.00"), ("Bimbel anak", "Sen 16.00")]
    iy = oy+210
    for name, when in items:
        d.ellipse([q(lx+18), q(iy+3), q(lx+28), q(iy+13)], fill=accent)
        T(lx+38, iy, name, fp["body"], 12, text)
        T(lx+cw-18, iy, when, fp["body"], 10.5, muted, anchor="ra")
        iy += 34
    rx = lx+cw+gapx
    card((rx, oy+164, ox+w-16, oy+h-40), 16, strong, border, dy=6, blur=12, alpha=38)
    T(rx+18, oy+180, "Progres Program", fp["head"], 15, text)
    T(rx+18, oy+210, "72%", fp["head"], 26, primary)
    pbar(rx+18, oy+250, cw-36, 0.72, page, primary, h=10)
    bx = badge(rx+18, oy+272, "Aktif", soft, softt, fp["body"])
    badge(bx+8, oy+272, "On-track", page, muted, fp["body"])
    footer(ox, oy+h, w, t, muted, fp["mono"])

def L_minimal(ox, oy, w, h, t):
    v = t["vars"]; fp = FP[t["slug"]]
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    border, primary, strong = hx(v["--profile-border"]), hx(v["--profile-primary"]), hx(v["--profile-surface-strong"])
    soft, softt = hx(v["--profile-soft"]), hx(v["--profile-soft-text"])
    card((ox, oy, ox+w, oy+h), 10, page, border, shadow=False)  # flat
    cx = ox + w/2
    T(cx, oy+40, "DASBOR", fp["body"], 10, muted, anchor="ma")
    T(cx, oy+58, "Modern Minimal", fp["head"], 26, text, anchor="ma")
    T(cx, oy+98, "Bersih, lapang, satu aksen tegas. Fokus ke konten.", fp["body"], 12, muted, anchor="ma")
    # thin list rows centered
    lw = 560
    lx = cx - lw/2
    rows = ["Profil mahasiswa", "Jadwal kegiatan", "Unggah laporan"]
    ry = oy+140
    for r in rows:
        T(lx, ry, r, fp["body"], 12.5, text)
        T(lx+lw, ry, "›", fp["body"], 14, muted, anchor="ra")
        d.line([(q(lx), q(ry+28)), (q(lx+lw), q(ry+28))], fill=border, width=max(1, int(SC)))
        ry += 40
    bx = btn(lx, oy+h-70, "Lanjut", primary, (255,255,255), fp["body"], 12, 10)
    btn(bx+10, oy+h-70, "Lewati", strong, text, fp["body"], 12, 10)
    footer(ox, oy+h, w, t, muted, fp["mono"])

def L_sustainability(ox, oy, w, h, t):
    v = t["vars"]; fp = FP[t["slug"]]
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    surf, strong, border = hx(v["--profile-surface"]), hx(v["--profile-surface-strong"]), hx(v["--profile-border"])
    soft, softt, primary, accent = hx(v["--profile-soft"]), hx(v["--profile-soft-text"]), hx(v["--profile-primary"]), hx(v["--profile-accent"])
    card((ox, oy, ox+w, oy+h), 14, page, border, dy=8, blur=16, alpha=40)
    T(ox+24, oy+30, "Green Sustainability", fp["head"], 22, text)
    badge(ox+w-24-90, oy+30, "Live data", soft, softt, fp["body"])
    # 3 metric tiles
    metrics = [("1.240", "Pohon ditanam", 0.82), ("68%", "Sampah terkelola", 0.68), ("312", "Relawan aktif", 0.55)]
    mw = (w - 48 - 2*14) / 3
    mxx = ox+24
    for num, lab, frac in metrics:
        card((mxx, oy+62, mxx+mw, oy+170), 12, surf, border, dy=5, blur=10, alpha=32)
        T(mxx+16, oy+78, lab, fp["body"], 10.5, muted)
        T(mxx+16, oy+98, num, fp["head"], 24, primary)
        pbar(mxx+16, oy+140, mw-32, frac, strong, accent, h=8)
        mxx += mw + 14
    # chart card with bars
    card((ox+24, oy+184, ox+w-24, oy+h-40), 12, surf, border, dy=5, blur=10, alpha=32)
    T(ox+40, oy+200, "Capaian per bulan", fp["head"], 13, text)
    bvals = [0.4, 0.55, 0.5, 0.7, 0.62, 0.85, 0.78]
    base_y = oy+h-66
    bw = 26
    bx0 = ox+44
    chart_h = 70
    for i, bv in enumerate(bvals):
        bx = bx0 + i*(bw+18)
        col = primary if i % 2 == 0 else accent
        rrect((bx, base_y - chart_h*bv, bx+bw, base_y), 5, fill=col)
    footer(ox, oy+h, w, t, muted, fp["mono"])

def L_professional(ox, oy, w, h, t):
    v = t["vars"]; fp = FP[t["slug"]]
    page, text, muted = hx(v["--profile-page"]), hx(v["--profile-text"]), hx(v["--profile-muted"])
    surf, strong, border = hx(v["--profile-surface"]), hx(v["--profile-surface-strong"]), hx(v["--profile-border"])
    soft, softt, primary, accent = hx(v["--profile-soft"]), hx(v["--profile-soft-text"]), hx(v["--profile-primary"]), hx(v["--profile-accent"])
    inp = hx(v["--profile-input"])
    warn, warnt, dang, dangt = hx(v["--profile-warning"]), hx(v["--profile-warning-text"]), hx(v["--profile-danger"]), hx(v["--profile-danger-text"])
    card((ox, oy, ox+w, oy+h), 12, page, border, dy=9, blur=18, alpha=70)
    # command bar
    rrect((ox+14, oy+14, ox+w-14, oy+52), 10, fill=strong, outline=border, width=1)
    T(ox+28, oy+24, "SIBERMAS", fp["head"], 13, primary)
    rrect((ox+150, oy+22, ox+w-150, oy+44), 7, fill=inp, outline=border, width=1)
    T(ox+162, oy+33, "Cari mahasiswa, desa, laporan…", fp["body"], 10.5, muted, anchor="lm")
    btn(ox+w-138, oy+20, "+ Aksi", primary, (11,18,32), fp["head"], 10.5, 8, h=26)
    # icon sidebar
    rrect((ox+14, oy+62, ox+64, oy+h-16), 10, fill=surf, outline=border, width=1)
    icy = oy+78
    for i in range(4):
        col = primary if i == 0 else soft
        rrect((ox+26, icy, ox+52, icy+26), 7, fill=col)
        icy += 40
    # table card
    tx = ox+76
    card((tx, oy+62, ox+w-14, oy+h-16), 10, surf, border, dy=6, blur=12, alpha=60)
    cols = [("NAMA", tx+18), ("DESA", tx+220), ("STATUS", tx+360), ("PROGRES", tx+470)]
    for c, cxp in cols:
        T(cxp, oy+76, c, fp["body"], 9.5, muted)
    d.line([(q(tx+14), q(oy+96)), (q(ox+w-28), q(oy+96))], fill=border, width=max(1, int(SC)))
    rows = [("Akun Tholib", "Sukamaju", "Aktif", soft, softt, 0.9),
            ("Siti Aisyah", "Mekarsari", "Review", warn, warnt, 0.6),
            ("Budi Santoso", "Cib, ang", "Aktif", soft, softt, 0.75),
            ("Rina Wati", "Sumberejo", "Ditolak", dang, dangt, 0.2)]
    ry = oy+106
    for name, desa, st, bg, btxt, frac in rows:
        T(tx+18, ry, name, fp["body"], 11, text)
        T(tx+220, ry, desa, fp["body"], 11, muted)
        badge(tx+360, ry-3, st, bg, btxt, fp["body"], size=9.5, h=18, pad=8)
        pbar(tx+470, ry+4, 120, frac, strong, primary, h=7)
        ry += 38
    footer(ox, oy+h, w, t, muted, fp["mono"])

LAYOUTS = {
    "akademik": L_akademik, "nusantara": L_nusantara, "minimal": L_minimal,
    "sustainability": L_sustainability, "professional": L_professional,
}

# ---- header ----
T(MARGIN, 30, "SIBERMAS — 5 Tema (font & layout berbeda)", SANS_B, 20, (235, 240, 248))
T(MARGIN, 60, "Tiap tema = identitas tipografi + struktur layout sendiri. Dirender dari theme-config.ts.", SANS, 12, (150, 160, 175))

ymap = {t["slug"]: t for t in themes}
y = HEADER
for slug in order:
    LAYOUTS[slug](MARGIN, y, W-2*MARGIN, HEIGHTS[slug], ymap[slug])
    y += HEIGHTS[slug] + GAP

out_png = os.path.join(ROOT, "preview.png")
final = img.convert("RGB")
final.save(out_png, "PNG")
final.save(os.path.join(ROOT, "preview.pdf"), "PDF", resolution=150)
print("wrote", out_png, final.size)
