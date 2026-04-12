# MCP PostgreSQL Configuration Guide

## 📋 Cara Setup MCP untuk PostgreSQL di Proyek KKN

### Opsi 1: Claude Desktop (Recommended)

1. **Buka Claude Desktop Settings**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Tambahkan konfigurasi berikut:**

```json
{
  "mcpServers": {
    "postgresql-kkn": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://kknuinsaizu:kknuinsaizu2026@127.0.0.1:5433/kkn"
      ]
    },
    "filesystem-kkn": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/macm4/Documents/Projek/KKN/kknuinsaizu"
      ]
    }
  }
}
```

3. **Restart Claude Desktop**

### Opsi 2: Cursor IDE

1. **Buka Cursor Settings**
   - `Cmd+,` → MCP → Add MCP Server

2. **Tambahkan MCP Server:**
   - **Name:** `PostgreSQL KKN`
   - **Type:** `Command`
   - **Command:** 
     ```bash
     npx -y @modelcontextprotocol/server-postgres postgresql://kknuinsaizu:kknuinsaizu2026@127.0.0.1:5433/kkn
     ```

### Opsi 3: VS Code dengan Continue Extension

1. **Install Continue Extension**
2. **Edit `~/.continue/config.json`:**

```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Claude 3.5 Sonnet",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  },
  "customCommands": [],
  "tools": [
    {
      "name": "PostgreSQL KKN",
      "type": "mcp",
      "command": "npx -y @modelcontextprotocol/server-postgres postgresql://kknuinsaizu:kknuinsaizu2026@127.0.0.1:5433/kkn"
    }
  ]
}
```

---

## 🔧 Database Connection Info

| Parameter | Nilai |
|-----------|-------|
| **Host** | `127.0.0.1` |
| **Port** | `5433` |
| **Database** | `kkn` |
| **Username** | `kknuinsaizu` |
| **Password** | `kknuinsaizu2026` |
| **Schema** | `public` |

---

## 📊 MCP Tools yang Tersedia

Setelah setup, Anda bisa:

### 1. Query Database
```sql
-- Cek semua tabel
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Cek jumlah data per tabel
SELECT 'users' as table_name, count(*) FROM users
UNION ALL
SELECT 'dosen', count(*) FROM dosen
UNION ALL
SELECT 'mahasiswa', count(*) FROM mahasiswa
UNION ALL
SELECT 'kelompok_kkn', count(*) FROM kelompok_kkn
UNION ALL
SELECT 'periode', count(*) FROM periode;
```

### 2. Check Session Issues
```sql
-- Cek sessions aktif
SELECT count(*) FROM sessions;
-- Hapus session lama
DELETE FROM sessions WHERE last_activity < extract(epoch from now()) - 3600;
```

### 3. Check Users & Roles
```sql
-- Cek user superadmin
SELECT u.id, u.name, u.email, u.is_active, r.name as role
FROM users u
JOIN model_has_roles mhr ON u.id = mhr.model_id
JOIN roles r ON mhr.role_id = r.id
WHERE r.name = 'superadmin';
```

### 4. Check Migrations
```sql
-- Cek migration status
SELECT migration, batch FROM migrations ORDER BY batch DESC;
```

### 5. Reset Password User
```sql
-- Reset password superadmin (bcrypt password: "Password")
UPDATE users 
SET password = '$2y$12$lhR/Kx4LCKIMZfYQOGzkruJTMuOy10Ag.Fqpd880L8AJqevAbMY4O'
WHERE email = 'admin@kkn.uinsaizu.ac.id';
```

---

## ⚠️ Troubleshooting

### Error: "Connection refused"
- Pastikan PostgreSQL running: `brew services list | grep postgresql`
- Start jika belum: `brew services start postgresql`

### Error: "Database does not exist"
- Buat database: `createdb -h 127.0.0.1 -p 5433 kkn -U kknuinsaizu`

### Error: "npx command not found"
- Install Node.js: `brew install node`
- Cek: `npx --version`

---

## 🚀 Quick Start Commands

Setelah MCP terhubung, Anda bisa tanya Claude:

1. **"Cek semua tabel di database KKN"**
2. **"Berapa jumlah user superadmin?"**
3. **"Tampilkan semua mahasiswa yang belum punya kelompok"**
4. **"Reset password admin@kkn.uinsaizu.ac.id ke 'Password'"**
5. **"Cek apakah ada session yang expired"**
6. **"Tampilkan semua periode KKN yang aktif"**
7. **"Hapus semua session yang lebih dari 1 jam"**

---

## 📝 Notes

- MCP Server akan berjalan otomatis saat Claude Desktop/Cursor dibuka
- Tidak perlu install package tambahan secara manual
- Koneksi read-only by default untuk keamanan
- Untuk write operations, perlu permission tambahan
