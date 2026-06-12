// Generates a self-contained preview.html showing all 5 themes rendered with
// their real token values (no Tailwind build needed). Stays in sync with
// theme-config.ts because it imports from it directly.
import { writeFileSync } from "node:fs"
import { THEMES } from "../apps/web/src/lib/theme-config.ts"

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")

function varsToCss(vars) {
	return Object.entries(vars)
		.map(([k, v]) => `${k}:${v}`)
		.join(";")
}

function themeSection(t) {
	const onPrimary = t.slug === "professional" ? "#0B1220" : "#ffffff"
	return `
<section class="theme" style="${varsToCss(t.vars)}">
  <div class="frame">
    <header class="hero" style="background:${t.preview}">
      <div class="hero-inner">
        <span class="chip">${esc(t.slug)} · ${esc(t.strength)}</span>
        <h2>${esc(t.label)}</h2>
        <p>${esc(t.description)}</p>
      </div>
    </header>
    <div class="body">
      <div class="row">
        <button class="btn" style="color:${onPrimary}">Aksi Utama</button>
        <button class="btn-sec">Sekunder</button>
        <button class="btn-ghost">Ghost</button>
      </div>
      <div class="card">
        <h3>Kartu Konten</h3>
        <p class="muted">Teks pendukung memakai warna muted yang tetap terbaca.</p>
        <label class="lbl">Nama Mahasiswa</label>
        <input class="inp" placeholder="cth. Akun Tholib" />
      </div>
      <div class="row">
        <span class="badge">Aktif</span>
        <span class="badge warn">Menunggu</span>
        <span class="badge dang">Ditolak</span>
      </div>
      <div class="swatches">
        ${["primary","accent","surface-strong","border","soft","text"].map(k=>`<div class=\"sw\"><span style=\"background:var(--profile-${k})\"></span><code>--profile-${k}</code></div>`).join("")}
      </div>
    </div>
  </div>
</section>`
}

const html = `<!doctype html>
<html lang="id"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SIBERMAS — Preview 5 Tema</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#0e1116;color:#e6edf6;padding:24px}
  h1{font-size:20px;margin:0 0 4px}
  .sub{color:#9aa4b2;margin:0 0 20px;font-size:13px}
  .grid{display:grid;gap:20px;grid-template-columns:1fr}
  @media(min-width:860px){.grid{grid-template-columns:1fr 1fr}}
  .theme{border-radius:16px;overflow:hidden}
  .frame{background:var(--profile-page);color:var(--profile-text);border:1px solid var(--profile-border);border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.35)}
  .hero{padding:22px 20px;color:#fff}
  .hero-inner h2{margin:8px 0 4px;font-size:20px}
  .hero-inner p{margin:0;font-size:13px;opacity:.92;max-width:46ch}
  .chip{display:inline-block;background:rgba(255,255,255,.18);color:#fff;border-radius:999px;padding:2px 10px;font-size:11px;letter-spacing:.02em}
  .body{padding:18px 20px;display:flex;flex-direction:column;gap:14px}
  .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
  .btn{background:var(--profile-primary);border:0;border-radius:var(--profile-radius);padding:10px 16px;font-weight:600;cursor:pointer}
  .btn-sec{background:var(--profile-surface-strong);color:var(--profile-text);border:1px solid var(--profile-border);border-radius:var(--profile-radius);padding:10px 16px;cursor:pointer}
  .btn-ghost{background:transparent;color:var(--profile-text);border:0;border-radius:var(--profile-radius);padding:10px 12px;cursor:pointer}
  .card{background:var(--profile-surface);border:1px solid var(--profile-border);border-radius:var(--profile-radius);padding:16px}
  .card h3{margin:0 0 4px;font-size:15px}
  .muted{color:var(--profile-muted);font-size:13px;margin:0 0 12px}
  .lbl{display:block;color:var(--profile-muted);font-size:12px;font-weight:600;margin-bottom:6px}
  .inp{width:100%;background:var(--profile-input);color:var(--profile-text);border:1px solid var(--profile-border);border-radius:calc(var(--profile-radius) - 4px);padding:9px 12px;outline:none}
  .inp:focus{box-shadow:0 0 0 4px var(--profile-ring)}
  .badge{background:var(--profile-soft);color:var(--profile-soft-text);border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600}
  .badge.warn{background:var(--profile-warning);color:var(--profile-warning-text)}
  .badge.dang{background:var(--profile-danger);color:var(--profile-danger-text)}
  .swatches{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .sw{display:flex;align-items:center;gap:6px;font-size:10px}
  .sw span{width:18px;height:18px;border-radius:5px;border:1px solid var(--profile-border);flex:0 0 auto}
  .sw code{color:var(--profile-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style></head>
<body>
  <h1>SIBERMAS — Preview 5 Tema</h1>
  <p class="sub">Dirender langsung dari token theme-config.ts. Mobile-first (1 kolom → 2 kolom di layar lebar).</p>
  <div class="grid">
    ${THEMES.map(themeSection).join("\n")}
  </div>
</body></html>`

writeFileSync(new URL("../preview.html", import.meta.url), html, "utf8")
console.log("preview.html written with " + THEMES.length + " themes")
