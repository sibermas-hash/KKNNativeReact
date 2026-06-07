import fs from "node:fs"

const themes = JSON.parse(fs.readFileSync(new URL("./themes.json", import.meta.url), "utf8"))

// Per-theme glass treatment. Lower alpha + strong blur so the colored orbs
// behind the cards clearly refract through = obvious glassmorphism.
const GLASS = {
  akademik:       { bg: "rgba(255,255,255,.44)", side: "rgba(255,255,255,.40)", border: "rgba(255,255,255,.80)", blur: "22px", o1: "#0F766E", o2: "#C2A14D", o3: "#2DD4BF", dark: false },
  nusantara:      { bg: "rgba(255,255,255,.42)", side: "rgba(255,255,255,.38)", border: "rgba(255,255,255,.78)", blur: "22px", o1: "#B5532A", o2: "#E2A03F", o3: "#4F7942", dark: false },
  minimal:        { bg: "rgba(255,255,255,.48)", side: "rgba(255,255,255,.44)", border: "rgba(255,255,255,.90)", blur: "20px", o1: "#2563EB", o2: "#14B8A6", o3: "#0EA5E9", dark: false },
  sustainability: { bg: "rgba(255,255,255,.44)", side: "rgba(255,255,255,.40)", border: "rgba(255,255,255,.80)", blur: "22px", o1: "#059669", o2: "#65A30D", o3: "#34D399", dark: false },
  professional:   { bg: "rgba(17,26,43,.42)",    side: "rgba(17,26,43,.40)",    border: "rgba(255,255,255,.16)", blur: "24px", o1: "#38BDF8", o2: "#818CF8", o3: "#22D3EE", dark: true },
}

function themeRule(t) {
  const g = GLASS[t.slug] || GLASS.akademik
  const sheen = g.dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.45)"
  const sheen2 = g.dark ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.6)"
  const lines = []
  for (const [k, v] of Object.entries(t.vars)) lines.push(`    ${k}: ${v};`)
  lines.push(`    --profile-font-heading: ${t.fonts.heading};`)
  lines.push(`    --profile-font-body: ${t.fonts.body};`)
  lines.push(`    --profile-font-mono: ${t.fonts.mono};`)
  lines.push(`    --glass-bg: ${g.bg};`)
  lines.push(`    --glass-side: ${g.side};`)
  lines.push(`    --glass-border: ${g.border};`)
  lines.push(`    --glass-blur: ${g.blur};`)
  lines.push(`    --glass-sheen: ${sheen};`)
  lines.push(`    --glass-sheen-2: ${sheen2};`)
  lines.push(`    --orb-1: ${g.o1};`)
  lines.push(`    --orb-2: ${g.o2};`)
  lines.push(`    --orb-3: ${g.o3};`)
  return `  [data-theme="${t.slug}"] {\n${lines.join("\n")}\n  }`
}

const themeRules = themes.map(themeRule).join("\n")
const optionEls = themes
  .map((t, i) => `<option value="${t.slug}"${i === 0 ? " selected" : ""}>${t.label}</option>`)
  .join("")

const metaBySlug = JSON.stringify(
  Object.fromEntries(
    themes.map((t) => [t.slug, { label: t.label, layout: t.layout, density: t.layout.density }]),
  ),
)

// Glass background: diagonal sheen highlight layered over the translucent tint.
const GLASS_BG = "linear-gradient(135deg, var(--glass-sheen) 0%, transparent 42%), var(--glass-bg)"

const html = `<!doctype html>
<html lang="id" data-theme="${themes[0].slug}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SIBERMAS — Preview Dashboard (Glassmorphism)</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --profile-font-heading: system-ui, sans-serif;
    --profile-font-body: system-ui, sans-serif;
    --profile-font-mono: ui-monospace, monospace;
  }
${themeRules}
  html, body { height: 100%; }
  body {
    font-family: var(--profile-font-body);
    color: var(--profile-text);
    background: var(--profile-page);
    position: relative;
  }
  /* Colorful scene behind the glass (fixed, blurred orbs). */
  .scene { position: fixed; inset: 0; z-index: -1; overflow: hidden; }
  .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .68; }
  .orb.a { width: 520px; height: 520px; top: -130px; left: -90px; background: var(--orb-1); }
  .orb.b { width: 560px; height: 560px; top: 26%; right: -150px; background: var(--orb-2); }
  .orb.c { width: 620px; height: 620px; bottom: -180px; left: 28%; background: var(--orb-3); opacity: .6; }
  .font-heading, h1, h2, h3, .card-title { font-family: var(--profile-font-heading); }
  .shell { display: flex; min-height: 100vh; }
  /* Glass primitive: translucent tint + diagonal sheen + frosted blur. */
  .glass {
    background: ${GLASS_BG};
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    border: 1px solid var(--glass-border);
    box-shadow: inset 0 1px 0 var(--glass-sheen-2), 0 12px 36px rgba(0,0,0,.16);
  }
  .sidebar {
    width: 224px; flex-shrink: 0; padding: 16px;
    background: ${GLASS_BG.replace("var(--glass-bg)", "var(--glass-side)")};
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    backdrop-filter: blur(var(--glass-blur)) saturate(160%);
    border-right: 1px solid var(--glass-border);
    display: flex; flex-direction: column; gap: 4px;
  }
  .brand { display: flex; align-items: center; gap: 8px; padding: 4px 8px 16px; }
  .brand .logo { width: 28px; height: 28px; border-radius: 8px; background: var(--profile-primary); }
  .brand .name { font-weight: 700; font-size: 18px; }
  .nav-label { padding: 0 8px 4px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--profile-muted); }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 10px; font-size: 14px; color: var(--profile-muted); cursor: pointer; border: 0; background: transparent; text-align: left; width: 100%; }
  .nav-item .dot { width: 16px; height: 16px; border-radius: 5px; background: var(--profile-surface-strong); }
  .nav-item.active { background: var(--profile-soft); color: var(--profile-soft-text); font-weight: 600; }
  .nav-item.active .dot { background: var(--profile-primary); }
  .pro { margin-top: auto; padding: 16px; border-radius: 14px; background: ${GLASS_BG}; border: 1px solid var(--glass-border); box-shadow: inset 0 1px 0 var(--glass-sheen-2); }
  .pro h4 { font-size: 14px; }
  .pro p { font-size: 12px; color: var(--profile-muted); margin: 4px 0 12px; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: var(--profile-radius); font-weight: 500; border: 0; cursor: pointer; font-size: 13px; height: 34px; padding: 0 14px; width: 100%; background: var(--profile-primary); color: #fff; }
  [data-theme="professional"] .btn { color: #0B1220; }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .topbar { display: flex; align-items: center; gap: 16px; padding: 16px 24px; }
  .topbar h1 { font-size: 20px; font-weight: 700; }
  .topbar .crumb { font-size: 12px; color: var(--profile-muted); }
  .search { margin: 0 auto; width: 100%; max-width: 420px; display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: ${GLASS_BG}; -webkit-backdrop-filter: blur(var(--glass-blur)); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-border); box-shadow: inset 0 1px 0 var(--glass-sheen-2); }
  .search .mag { width: 14px; height: 14px; border-radius: 999px; border: 2px solid var(--profile-muted); }
  .search input { border: 0; background: transparent; outline: none; width: 100%; color: var(--profile-text); font-size: 14px; }
  .search input::placeholder { color: var(--profile-muted); }
  .right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  .theme-pick { display: inline-flex; align-items: center; gap: 8px; }
  .theme-pick span { font-size: 14px; color: var(--profile-muted); }
  select { border-radius: calc(var(--profile-radius) - 4px); border: 1px solid var(--glass-border); background: ${GLASS_BG}; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: var(--profile-text); padding: 6px 10px; font-size: 14px; font-family: inherit; }
  .avatar { width: 36px; height: 36px; border-radius: 999px; background: var(--profile-soft); color: var(--profile-soft-text); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; }
  .who { line-height: 1.2; }
  .who .n { font-size: 14px; font-weight: 500; }
  .who .r { font-size: 12px; color: var(--profile-muted); }
  .content { padding: 8px 24px 32px; }
  .grid { display: grid; gap: 16px; }
  .stats { grid-template-columns: repeat(4, 1fr); }
  .cols3 { grid-template-columns: 1fr 2fr; margin-top: 16px; }
  .card { border-radius: var(--profile-radius); padding: 20px; }
  .card-title { font-weight: 600; font-size: 15px; }
  .stat .lbl { font-size: 12px; color: var(--profile-muted); }
  .stat .val { font-family: var(--profile-font-heading); font-size: 26px; font-weight: 700; margin-top: 2px; }
  .stat .row { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
  .delta-up { color: var(--profile-soft-text); font-size: 12px; font-weight: 500; }
  .delta-down { color: var(--profile-danger-text); font-size: 12px; font-weight: 500; }
  .legend { list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 14px; flex: 1; }
  .legend li { display: flex; align-items: center; justify-content: space-between; }
  .legend .lab { display: flex; align-items: center; gap: 8px; }
  .legend .sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  .legend .pct { color: var(--profile-muted); }
  .donut-wrap { display: flex; align-items: center; gap: 20px; margin-top: 12px; }
  .bars { display: flex; align-items: flex-end; gap: 8px; height: 160px; margin-top: 16px; }
  .bars .b { flex: 1; background: var(--profile-primary); border-radius: 6px 6px 0 0; position: relative; opacity: .92; }
  .bars .b span { position: absolute; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 11px; color: var(--profile-muted); }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--profile-muted); border-bottom: 1px solid var(--profile-border); }
  td { padding: 12px; border-bottom: 1px solid var(--profile-border); vertical-align: middle; }
  .cell-name { display: flex; align-items: center; gap: 12px; font-weight: 500; }
  .av-sm { width: 28px; height: 28px; border-radius: 999px; background: var(--profile-soft); color: var(--profile-soft-text); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; }
  .pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 500; }
  .pill.neutral { background: var(--profile-soft); color: var(--profile-soft-text); }
  .pill.warning { background: var(--profile-warning); color: var(--profile-warning-text); }
  .pill.danger { background: var(--profile-danger); color: var(--profile-danger-text); }
  .prog { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
  .prog .track { width: 110px; height: 6px; border-radius: 999px; background: var(--profile-surface-strong); overflow: hidden; }
  .prog .fill { height: 100%; border-radius: 999px; background: var(--profile-primary); }
  .prog .num { font-size: 12px; color: var(--profile-muted); }
  .right-link { font-size: 14px; color: var(--profile-soft-text); background: 0; border: 0; cursor: pointer; }
  .meta-note { padding: 10px 24px; font-size: 12px; color: var(--profile-muted); }
  .meta-note b { color: var(--profile-soft-text); }
  @media (max-width: 920px) { .stats { grid-template-columns: repeat(2, 1fr); } .cols3 { grid-template-columns: 1fr; } .search, .who { display: none; } }
</style>
</head>
<body>
<div class="scene"><span class="orb a"></span><span class="orb b"></span><span class="orb c"></span></div>
<div class="shell">
  <aside class="sidebar">
    <div class="brand"><span class="logo"></span><span class="name">SIBERMAS</span></div>
    <span class="nav-label">Menu</span>
    <button class="nav-item active"><span class="dot"></span>Dashboard</button>
    <button class="nav-item"><span class="dot"></span>Mahasiswa</button>
    <button class="nav-item"><span class="dot"></span>Lokasi KKN</button>
    <button class="nav-item"><span class="dot"></span>Jadwal</button>
    <button class="nav-item"><span class="dot"></span>Laporan</button>
    <button class="nav-item"><span class="dot"></span>Pengaturan</button>
    <div class="pro">
      <h4 class="font-heading">SIBERMAS Pro</h4>
      <p>Modul lanjutan & laporan otomatis.</p>
      <button class="btn">Upgrade</button>
    </div>
  </aside>
  <div class="main">
    <header class="topbar">
      <div><h1>Beranda KKN</h1><div class="crumb">Dashboard / Ringkasan</div></div>
      <div class="search"><span class="mag"></span><input placeholder="Cari mahasiswa, desa, laporan…" /></div>
      <div class="right">
        <label class="theme-pick"><span>Tema</span>
          <select id="theme">${optionEls}</select>
        </label>
        <div class="avatar">AT</div>
        <div class="who"><div class="n">Akun Tholib</div><div class="r">Koordinator</div></div>
      </div>
    </header>
    <div class="meta-note" id="meta"></div>
    <div class="content">
      <div class="grid stats">
        <div class="card glass stat"><div class="lbl">Mahasiswa</div><div class="val">128</div><div class="row"><span class="delta-up">▲ +8%</span></div></div>
        <div class="card glass stat"><div class="lbl">Desa Lokasi</div><div class="val">32</div><div class="row"><span class="delta-up">▲ +2</span></div></div>
        <div class="card glass stat"><div class="lbl">Laporan Masuk</div><div class="val">94%</div><div class="row"><span class="delta-up">▲ +5%</span></div></div>
        <div class="card glass stat"><div class="lbl">Kegiatan</div><div class="val">17</div><div class="row"><span class="delta-down">▼ -3%</span></div></div>
      </div>
      <div class="grid cols3">
        <div class="card glass">
          <div class="card-title">Status Mahasiswa</div>
          <div class="donut-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="46" fill="none" stroke="var(--profile-surface-strong)" stroke-width="16"/>
              <circle cx="60" cy="60" r="46" fill="none" stroke="var(--profile-primary)" stroke-width="16" stroke-dasharray="179 290" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="46" fill="none" stroke="var(--profile-accent)" stroke-width="16" stroke-dasharray="75 290" stroke-dashoffset="-179" transform="rotate(-90 60 60)"/>
              <circle cx="60" cy="60" r="46" fill="none" stroke="var(--profile-muted)" stroke-width="16" stroke-dasharray="35 290" stroke-dashoffset="-254" transform="rotate(-90 60 60)"/>
              <text x="60" y="58" text-anchor="middle" font-size="22" font-weight="700" fill="var(--profile-text)">128</text>
              <text x="60" y="74" text-anchor="middle" font-size="10" fill="var(--profile-muted)">total</text>
            </svg>
            <ul class="legend">
              <li><span class="lab"><span class="sw" style="background:var(--profile-primary)"></span>Aktif</span><span class="pct">62%</span></li>
              <li><span class="lab"><span class="sw" style="background:var(--profile-accent)"></span>Review</span><span class="pct">26%</span></li>
              <li><span class="lab"><span class="sw" style="background:var(--profile-muted)"></span>Nonaktif</span><span class="pct">12%</span></li>
            </ul>
          </div>
        </div>
        <div class="card glass">
          <div class="card-title">Laporan per Bulan</div>
          <div class="bars" id="bars"></div>
        </div>
      </div>
      <div class="card glass" style="margin-top:16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="card-title">Aktivitas Mahasiswa</div>
          <button class="right-link">Lihat semua ›</button>
        </div>
        <table style="margin-top:8px">
          <thead><tr><th>Nama</th><th>Desa</th><th>Status</th><th style="text-align:right">Progres</th></tr></thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<script>
  const META = ${metaBySlug};
  const rows = [
    ["AT","Akun Tholib","Sukamaju","Aktif","neutral",90],
    ["SA","Siti Aisyah","Mekarsari","Review","warning",60],
    ["BS","Budi Santoso","Cibadak","Aktif","neutral",75],
    ["RW","Rina Wati","Sumberejo","Ditolak","danger",20],
    ["DC","Dani Cahya","Mulyasari","Aktif","neutral",55],
  ];
  document.getElementById("tbody").innerHTML = rows.map(function (r) {
    return "<tr><td><span class='cell-name'><span class='av-sm'>" + r[0] + "</span>" + r[1] + "</span></td>" +
      "<td style='color:var(--profile-muted)'>" + r[2] + "</td>" +
      "<td><span class='pill " + r[4] + "'>" + r[3] + "</span></td>" +
      "<td><div class='prog'><div class='track'><div class='fill' style='width:" + r[5] + "%'></div></div><span class='num'>" + r[5] + "%</span></div></td></tr>";
  }).join("");
  const barVals = [5,7,6,9,7,11,8,12,9,10,8,13];
  const labs = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const mx = Math.max.apply(null, barVals);
  document.getElementById("bars").innerHTML = barVals.map(function (v, i) {
    return "<div class='b' style='height:" + Math.round((v / mx) * 100) + "%'><span>" + labs[i] + "</span></div>";
  }).join("");
  const sel = document.getElementById("theme");
  const meta = document.getElementById("meta");
  function apply(slug) {
    document.documentElement.setAttribute("data-theme", slug);
    const m = META[slug];
    meta.innerHTML = "Tema: <b>" + m.label + "</b>  ·  Glassmorphism aktif  ·  Pola: " + m.layout.pattern + "  ·  Densitas: " + m.density;
  }
  sel.addEventListener("change", function (e) { apply(e.target.value); });
  apply(sel.value);
</script>
</body>
</html>
`

fs.writeFileSync(new URL("../preview-dashboard.html", import.meta.url), html)
console.log("wrote preview-dashboard.html", html.length, "bytes")
