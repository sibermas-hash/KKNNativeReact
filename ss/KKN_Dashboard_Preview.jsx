import { useState, useMemo } from "react";

// ─── LUCIDE ICONS (inline SVG to avoid import issues) ─────────────────────────
const Icon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const icons = {
  dashboard:    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  book:         ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20", "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"],
  upload:       ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  clipboard:    ["M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2", "M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2z"],
  grad:         ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c3 3 9 3 12 0v-5"],
  shield:       "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  map:          ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  calendar:     ["M3 4h18v18H3z", "M16 2v4M8 2v4M3 10h18"],
  users:        ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87", "M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M16 3.13a4 4 0 0 1 0 7.75"],
  check:        ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4L12 14.01l-3-3"],
  bell:         ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
  chart:        ["M18 20V10", "M12 20V4", "M6 20v-6"],
  trending:     ["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"],
  star:         "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  logout:       ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  menu:         ["M3 12h18", "M3 6h18", "M3 18h18"],
  x:            ["M18 6L6 18", "M6 6l12 12"],
  info:         ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4", "M12 16h.01"],
  eye:          ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  alert:        ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
};

// ─── GRADING LOGIC ────────────────────────────────────────────────────────────
function toGrade(n) {
  if (n >= 85) return { h: "A",   color: "#10b981", bg: "rgba(16,185,129,0.15)" };
  if (n >= 80) return { h: "A-",  color: "#34d399", bg: "rgba(52,211,153,0.15)" };
  if (n >= 75) return { h: "B+",  color: "#3b82f6", bg: "rgba(59,130,246,0.15)" };
  if (n >= 70) return { h: "B",   color: "#60a5fa", bg: "rgba(96,165,250,0.15)" };
  if (n >= 65) return { h: "B-",  color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
  if (n >= 55) return { h: "C",   color: "#f97316", bg: "rgba(249,115,22,0.15)" };
  return           { h: "D",   color: "#ef4444", bg: "rgba(239,68,68,0.15)"  };
}

function calcGrade(p) {
  const a = ((p.laporan ?? 0) * 0.30 + (p.proker ?? 0) * 0.40 + (p.artikel ?? 0) * 0.30) * 0.50;
  const b = ((p.sikap ?? 0)   * 0.50 + (p.disiplin ?? 0) * 0.50) * 0.30;
  const c = ((p.workshop ?? 0) * 0.50 + (p.admin ?? 0) * 0.50) * 0.20;
  return parseFloat((a + b + c).toFixed(2));
}

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const mahasiswaData = [
  { id: 1, nama: "Rizki Ardian", nim: "20210001", kelompok: "KKN-001", desa: "Ds. Sukamaju",
    logbook: 28, dokumen: 5, nilai: { laporan: 88, proker: 85, artikel: 82, sikap: 90, disiplin: 92, workshop: 87, admin: 95 }, status: "active" },
  { id: 2, nama: "Sari Dewi",    nim: "20210024", kelompok: "KKN-001", desa: "Ds. Sukamaju",
    logbook: 25, dokumen: 7, nilai: { laporan: 92, proker: 91, artikel: 89, sikap: 95, disiplin: 88, workshop: 93, admin: 98 }, status: "active" },
  { id: 3, nama: "Budi Santoso", nim: "20210047", kelompok: "KKN-002", desa: "Ds. Mekarjaya",
    logbook: 20, dokumen: 4, nilai: { laporan: 75, proker: 78, artikel: 70, sikap: 82, disiplin: 80, workshop: 76, admin: 85 }, status: "active" },
  { id: 4, nama: "Laila Nurul",  nim: "20210063", kelompok: "KKN-002", desa: "Ds. Mekarjaya",
    logbook: 30, dokumen: 7, nilai: { laporan: 95, proker: 94, artikel: 93, sikap: 97, disiplin: 96, workshop: 94, admin: 99 }, status: "active" },
  { id: 5, nama: "Dani Priyono", nim: "20210089", kelompok: "KKN-003", desa: "Ds. Harapan Jaya",
    logbook: 15, dokumen: 3, nilai: { laporan: 60, proker: 65, artikel: 58, sikap: 72, disiplin: 68, workshop: 65, admin: 70 }, status: "warning" },
];

const logbookData = [
  { id: 1, nama: "Rizki Ardian", tanggal: "2025-07-15", kegiatan: "Survei potensi desa & wawancara warga", jam: 6, status: "approved",  foto: 3 },
  { id: 2, nama: "Sari Dewi",    tanggal: "2025-07-15", kegiatan: "Sosialisasi program kerja kepada masyarakat", jam: 4, status: "approved",  foto: 5 },
  { id: 3, nama: "Budi Santoso", tanggal: "2025-07-16", kegiatan: "Pelatihan UMKM digital untuk ibu-ibu PKK", jam: 5, status: "pending",   foto: 2 },
  { id: 4, nama: "Laila Nurul",  tanggal: "2025-07-16", kegiatan: "Pembuatan peta desa berbasis GIS", jam: 8, status: "revision",  foto: 4 },
  { id: 5, nama: "Dani Priyono", tanggal: "2025-07-17", kegiatan: "Pendampingan posyandu balita", jam: 3, status: "pending",   foto: 1 },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const GlassCard = ({ children, className = "", gradient = "from-white/10", hover = true }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/20
    backdrop-blur-xl bg-gradient-to-br ${gradient} to-transparent
    ${hover ? "hover:scale-[1.01] hover:shadow-2xl cursor-pointer" : ""}
    transition-all duration-300 ${className}`}
    style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
    {children}
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    approved: { bg: "bg-emerald-500/20 border-emerald-400/30", text: "text-emerald-300", label: "Approved" },
    pending:  { bg: "bg-amber-500/20 border-amber-400/30",    text: "text-amber-300",   label: "Pending" },
    revision: { bg: "bg-rose-500/20 border-rose-400/30",      text: "text-rose-300",    label: "Revision" },
    warning:  { bg: "bg-orange-500/20 border-orange-400/30",  text: "text-orange-300",  label: "Perlu Perhatian" },
    active:   { bg: "bg-sky-500/20 border-sky-400/30",        text: "text-sky-300",     label: "Aktif" },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

const GradeCircle = ({ nilai, size = 56 }) => {
  const total = calcGrade(nilai);
  const grade = toGrade(total);
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const dash = (total / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={grade.color} strokeWidth="4"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${grade.color})` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color: grade.color }}>{total}</span>
        </div>
      </div>
      <span className="text-xs font-black" style={{ color: grade.color }}>{grade.h}</span>
    </div>
  );
};

const ProgressBar = ({ value, max = 100, color = "#3b82f6", label, small = false }) => (
  <div className="w-full">
    {label && <div className="flex justify-between mb-1">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-xs font-semibold text-white/80">{value}/{max}</span>
    </div>}
    <div className={`w-full ${small ? "h-1.5" : "h-2"} bg-white/10 rounded-full overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${(value / max) * 100}%`, background: color, boxShadow: `0 0 8px ${color}88` }} />
    </div>
  </div>
);

const MiniChart = ({ data, color }) => {
  const max = Math.max(...data);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 160;
    const y = 40 - (v / max) * 36;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,40 ${points} 160,40`;
  return (
    <svg width="160" height="44" className="overflow-visible">
      <defs>
        <linearGradient id={`lg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#lg-${color.replace("#","")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard",     icon: "dashboard", color: "#60a5fa" },
  { id: "logbook",   label: "Logbook",       icon: "book",      color: "#34d399" },
  { id: "dokumen",   label: "Dokumen",       icon: "upload",    color: "#a78bfa" },
  { id: "proker",    label: "Program Kerja", icon: "clipboard", color: "#fb923c" },
  { id: "nilai",     label: "Penilaian",     icon: "grad",      color: "#fbbf24" },
  { id: "audit",     label: "Audit Log",     icon: "shield",    color: "#f87171" },
  { id: "peta",      label: "Lokasi Desa",   icon: "map",       color: "#38bdf8" },
];

const Sidebar = ({ active, setActive, collapsed, setCollapsed }) => (
  <aside className={`flex flex-col h-full transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
    style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(23,37,84,0.97) 100%)",
      borderRight: "1px solid rgba(255,255,255,0.07)" }}>
    {/* Logo */}
    <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
        <Icon d={icons.grad} size={16} className="text-white" />
      </div>
      {!collapsed && <div>
        <p className="text-white text-sm font-bold leading-none">SIM-KKN</p>
        <p className="text-white/40 text-xs">Universitas</p>
      </div>}
      <button onClick={() => setCollapsed(!collapsed)}
        className="ml-auto text-white/30 hover:text-white/70 transition-colors">
        <Icon d={icons.menu} size={16} />
      </button>
    </div>

    {/* Role badge */}
    {!collapsed && (
      <div className="mx-3 mt-3 px-3 py-2 rounded-xl"
        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))", border: "1px solid rgba(239,68,68,0.2)" }}>
        <p className="text-red-300 text-xs font-bold uppercase tracking-wider">Superadmin</p>
        <p className="text-white/50 text-xs">LPPM Universitas</p>
      </div>
    )}

    {/* Nav */}
    <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
      {navItems.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
            ${active === item.id ? "text-white" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}
          style={active === item.id ? {
            background: `linear-gradient(135deg, ${item.color}25, ${item.color}10)`,
            border: `1px solid ${item.color}30`,
          } : {}}>
          <span style={{ color: active === item.id ? item.color : undefined }}>
            <Icon d={icons[item.icon]} size={18} />
          </span>
          {!collapsed && <span className="font-medium">{item.label}</span>}
          {!collapsed && active === item.id && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
          )}
        </button>
      ))}
    </nav>

    {/* User */}
    <div className="p-3 border-t border-white/5">
      <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>AD</div>
        {!collapsed && <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">Admin LPPM</p>
          <p className="text-white/40 text-xs">admin@univ.ac.id</p>
        </div>}
        {!collapsed && <button className="text-white/30 hover:text-white/70 transition-colors">
          <Icon d={icons.logout} size={16} />
        </button>}
      </div>
    </div>
  </aside>
);

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const Topbar = ({ title }) => (
  <header className="flex items-center justify-between px-6 py-4"
    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(12px)" }}>
    <div>
      <h1 className="text-white text-xl font-bold">{title}</h1>
      <p className="text-white/40 text-xs">Periode KKN 2025/1 · Aktif</p>
    </div>
    <div className="flex items-center gap-3">
      {/* Periode badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-300 text-xs font-semibold">KKN Running</span>
      </div>
      {/* Notif */}
      <button className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all">
        <Icon d={icons.bell} size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>AD</div>
    </div>
  </header>
);

// ─── STATS ROW ────────────────────────────────────────────────────────────────
const statsConfig = [
  { label: "Total Mahasiswa", value: "248", sub: "+12 bulan ini", icon: "users",   grad: "from-blue-600 to-blue-400",   glow: "#3b82f6", trend: [40,65,58,72,88,95,110,120,130,148,180,210,248] },
  { label: "Kelompok KKN",    value: "28",  sub: "12 Desa berbeda", icon: "map",  grad: "from-teal-600 to-emerald-400", glow: "#10b981", trend: [5,8,10,12,14,16,18,20,22,24,26,27,28] },
  { label: "Logbook Pending", value: "47",  sub: "Butuh verifikasi", icon: "book",  grad: "from-amber-500 to-yellow-400", glow: "#f59e0b", trend: [15,22,18,30,45,50,38,47,55,47,42,46,47] },
  { label: "Nilai Terproses", value: "186", sub: "62 belum final",  icon: "grad",  grad: "from-violet-600 to-purple-400", glow: "#8b5cf6", trend: [0,10,30,55,80,100,120,135,148,160,170,180,186] },
];

const StatsRow = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {statsConfig.map((s, i) => (
      <GlassCard key={i} className={`bg-gradient-to-br ${s.grad} p-5`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-white text-3xl font-black mt-0.5">{s.value}</p>
            <p className="text-white/50 text-xs mt-0.5">{s.sub}</p>
          </div>
          <div className="p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Icon d={icons[s.icon]} size={20} className="text-white" />
          </div>
        </div>
        <MiniChart data={s.trend} color="rgba(255,255,255,0.8)" />
      </GlassCard>
    ))}
  </div>
);

// ─── MAHASISWA TABLE ──────────────────────────────────────────────────────────
const MahasiswaTable = () => (
  <GlassCard hover={false} className="p-0 overflow-hidden" gradient="from-slate-800/50">
    <div className="px-5 py-4 flex items-center justify-between border-b border-white/8">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.2)" }}>
          <Icon d={icons.users} size={16} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Daftar Mahasiswa KKN</h3>
          <p className="text-white/40 text-xs">Kelompok aktif — Periode 2025/1</p>
        </div>
      </div>
      <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-300 transition-all"
        style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)" }}>
        Lihat Semua
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
            {["Mahasiswa", "Kelompok", "Logbook", "Dokumen", "Nilai Akhir", "Status"].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mahasiswaData.map((m, i) => {
            const total = calcGrade(m.nilai);
            const grade = toGrade(total);
            return (
              <tr key={m.id} className="border-t border-white/5 hover:bg-white/3 transition-colors group">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${["#3b82f6","#10b981","#8b5cf6","#f59e0b","#ef4444"][i]}, ${["#1d4ed8","#059669","#7c3aed","#d97706","#dc2626"][i]})` }}>
                      {m.nama.split(" ").map(w => w[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{m.nama}</p>
                      <p className="text-white/40 text-xs">{m.nim}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-white/60 text-sm">{m.kelompok}</span>
                  <p className="text-white/30 text-xs">{m.desa}</p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="w-24">
                    <ProgressBar value={m.logbook} max={30} color="#3b82f6" small />
                    <p className="text-white/50 text-xs mt-1">{m.logbook}/30 hari</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="w-24">
                    <ProgressBar value={m.dokumen} max={7} color="#8b5cf6" small />
                    <p className="text-white/50 text-xs mt-1">{m.dokumen}/7 jenis</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <GradeCircle nilai={m.nilai} size={48} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={m.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </GlassCard>
);

// ─── LOGBOOK PANEL ────────────────────────────────────────────────────────────
const LogbookPanel = () => (
  <GlassCard hover={false} className="p-0 overflow-hidden" gradient="from-slate-800/50">
    <div className="px-5 py-4 flex items-center justify-between border-b border-white/8">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg" style={{ background: "rgba(52,211,153,0.2)" }}>
          <Icon d={icons.book} size={16} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Logbook Terbaru</h3>
          <p className="text-white/40 text-xs">Menunggu verifikasi DPL</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-300"
          style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}>
          47 Pending
        </span>
      </div>
    </div>
    <div className="divide-y divide-white/5">
      {logbookData.map((lb) => (
        <div key={lb.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/3 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-white text-sm font-medium truncate">{lb.nama}</p>
              <StatusBadge status={lb.status} />
            </div>
            <p className="text-white/50 text-xs truncate">{lb.kegiatan}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-white/30 text-xs">{lb.tanggal}</span>
              <span className="text-white/30 text-xs">{lb.jam} jam</span>
              <span className="text-white/30 text-xs">{lb.foto} foto</span>
            </div>
          </div>
          {lb.status === "pending" && (
            <div className="flex gap-1.5 flex-shrink-0">
              <button className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-300 transition-all"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                Approve
              </button>
              <button className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 transition-all"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
                Revisi
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  </GlassCard>
);

// ─── GRADE BREAKDOWN PANEL ────────────────────────────────────────────────────
const GradePanel = () => {
  const [selected, setSelected] = useState(0);
  const m = mahasiswaData[selected];
  const total = calcGrade(m.nilai);
  const grade = toGrade(total);

  const compA = ((m.nilai.laporan * 0.30 + m.nilai.proker * 0.40 + m.nilai.artikel * 0.30) * 0.50).toFixed(1);
  const compB = ((m.nilai.sikap * 0.50 + m.nilai.disiplin * 0.50) * 0.30).toFixed(1);
  const compC = ((m.nilai.workshop * 0.50 + m.nilai.admin * 0.50) * 0.20).toFixed(1);

  return (
    <GlassCard hover={false} className="p-5" gradient="from-violet-900/30">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg" style={{ background: "rgba(139,92,246,0.2)" }}>
          <Icon d={icons.grad} size={16} className="text-violet-400" />
        </div>
        <h3 className="text-white font-semibold text-sm">Kalkulasi Nilai Real-time</h3>
      </div>

      {/* Selector */}
      <select value={selected} onChange={e => setSelected(Number(e.target.value))}
        className="w-full mb-4 px-3 py-2 rounded-xl text-sm text-white outline-none"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
        {mahasiswaData.map((m, i) => <option key={i} value={i} style={{ background: "#1e293b" }}>{m.nama}</option>)}
      </select>

      {/* Big grade */}
      <div className="flex items-center justify-center my-4">
        <div className="text-center">
          <div className="text-6xl font-black" style={{ color: grade.color, textShadow: `0 0 30px ${grade.color}` }}>{total}</div>
          <div className="text-2xl font-black mt-1" style={{ color: grade.color }}>{grade.h}</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {[
          { label: "A — DPL (50%)",     value: parseFloat(compA), color: "#3b82f6", max: 50 },
          { label: "B — Mitra (30%)",   value: parseFloat(compB), color: "#10b981", max: 30 },
          { label: "C — LPPM (20%)",    value: parseFloat(compC), color: "#a78bfa", max: 20 },
        ].map(comp => (
          <div key={comp.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/50">{comp.label}</span>
              <span className="text-xs font-bold" style={{ color: comp.color }}>{comp.value.toFixed(1)} / {comp.max}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(comp.value / comp.max) * 100}%`, background: comp.color, boxShadow: `0 0 8px ${comp.color}88` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-components */}
      <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-2">
        {[
          ["Laporan",   m.nilai.laporan,  "#60a5fa"],
          ["Proker",    m.nilai.proker,   "#60a5fa"],
          ["Artikel",   m.nilai.artikel,  "#60a5fa"],
          ["Sikap",     m.nilai.sikap,    "#34d399"],
          ["Disiplin",  m.nilai.disiplin, "#34d399"],
          ["Workshop",  m.nilai.workshop, "#a78bfa"],
        ].map(([label, val, col]) => (
          <div key={label} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="text-white/50 text-xs">{label}</span>
            <span className="text-xs font-bold" style={{ color: col }}>{val}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── MINI PANELS ─────────────────────────────────────────────────────────────
const DocumentTracker = () => {
  const docs = [
    { label: "Laporan Aset",     done: 21, total: 28, color: "#3b82f6" },
    { label: "Video YouTube",    done: 18, total: 28, color: "#10b981" },
    { label: "Jurnal/Artikel",   done: 15, total: 28, color: "#a78bfa" },
    { label: "Laporan Akhir",    done: 24, total: 28, color: "#f59e0b" },
    { label: "Foto Dokumentasi", done: 26, total: 28, color: "#34d399" },
    { label: "Proker Final",     done: 22, total: 28, color: "#fb923c" },
    { label: "Surat Mitra",      done:  9, total: 28, color: "#f87171" },
  ];
  return (
    <GlassCard hover={false} className="p-5" gradient="from-slate-800/40">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg" style={{ background: "rgba(167,139,250,0.2)" }}>
          <Icon d={icons.upload} size={16} className="text-violet-400" />
        </div>
        <h3 className="text-white font-semibold text-sm">Tracking Dokumen (7 Jenis)</h3>
      </div>
      <div className="space-y-2.5">
        {docs.map(doc => (
          <div key={doc.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-white/60">{doc.label}</span>
              <span className="text-xs" style={{ color: doc.color }}>{doc.done}/{doc.total}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full"
                style={{ width: `${(doc.done/doc.total)*100}%`, background: doc.color, boxShadow: `0 0 6px ${doc.color}` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const AuditLog = () => {
  const logs = [
    { actor: "Admin LPPM", action: "GATE_BYPASS", target: "DplPolicy@update", time: "2 menit lalu", risk: "high" },
    { actor: "Admin LPPM", action: "FINALISASI",  target: "Nilai KKN-001",    time: "1 jam lalu",  risk: "med"  },
    { actor: "Dr. Ahmad",  action: "APPROVED",    target: "Logbook Rizki #28",time: "3 jam lalu",  risk: "low"  },
    { actor: "Admin LPPM", action: "CREATE",       target: "Periode 2025/1",  time: "1 hari lalu", risk: "low"  },
    { actor: "Admin LPPM", action: "GATE_BYPASS", target: "MitraPolicy@view", time: "2 hari lalu", risk: "high" },
  ];
  const riskStyle = {
    high: { color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    med:  { color: "#fbbf24", bg: "rgba(251,191,36,0.15)"  },
    low:  { color: "#34d399", bg: "rgba(52,211,153,0.15)"  },
  };
  return (
    <GlassCard hover={false} className="p-5" gradient="from-red-950/20">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg" style={{ background: "rgba(248,113,113,0.2)" }}>
          <Icon d={icons.shield} size={16} className="text-red-400" />
        </div>
        <h3 className="text-white font-semibold text-sm">Audit Log — God Mode</h3>
      </div>
      <div className="space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: riskStyle[log.risk].bg }}>
              <Icon d={log.risk === "high" ? icons.alert : icons.info} size={12}
                style={{ color: riskStyle[log.risk].color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white/80 text-xs font-medium">{log.actor}</span>
                <span className="text-xs px-1.5 rounded font-mono font-bold"
                  style={{ color: riskStyle[log.risk].color, background: riskStyle[log.risk].bg }}>
                  {log.action}
                </span>
              </div>
              <p className="text-white/40 text-xs truncate">{log.target}</p>
            </div>
            <span className="text-white/25 text-xs flex-shrink-0">{log.time}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function KKNDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const titles = {
    dashboard: "Dashboard Overview",
    logbook:   "Manajemen Logbook",
    dokumen:   "Upload Dokumen",
    proker:    "Program Kerja",
    nilai:     "Penilaian KKN",
    audit:     "Audit Log",
    peta:      "Peta Lokasi KKN",
  };

  return (
    <div className="flex h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1530 40%, #0a1525 70%, #060d1a 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", filter: "blur(80px)" }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(80px)" }} />
      </div>

      {/* Sidebar */}
      <Sidebar active={activeNav} setActive={setActiveNav} collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={titles[activeNav]} />

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <StatsRow />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <MahasiswaTable />
            </div>
            <div>
              <GradePanel />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            <LogbookPanel />
            <DocumentTracker />
            <AuditLog />
          </div>
        </div>
      </main>
    </div>
  );
}
