#!/bin/sh
# preflight-freebsd.sh — Validasi kesiapan server FreeBSD sebelum deploy
#
# Jalankan SEBELUM install-freebsd.sh untuk deteksi dini masalah umum:
#   sh scripts/preflight-freebsd.sh
#
# Output: LIST checklist dengan status [OK] / [FAIL] / [WARN].
# Exit 0 kalau semua OK, 1 kalau ada FAIL.

set -u

PHP_VERSION="${PHP_VERSION:-84}"
PG_VERSION="${PG_VERSION:-18}"
NODE_VERSION="${NODE_VERSION:-24}"
APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
WEB_DOMAIN="${WEB_DOMAIN:-sibermas.uinsaizu.ac.id}"
CERT_BASE="${CERT_BASE:-$WEB_DOMAIN}"
EDGE_REVERSE_PROXY="${EDGE_REVERSE_PROXY:-0}"

# ─── Counters ──────────────────────────────────────────────────────────
FAILS=0
WARNS=0

# ─── Helpers ───────────────────────────────────────────────────────────
green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }

ok()   { printf "  [%s] %s\n" "$(green  'OK  ')" "$1"; }
fail() { printf "  [%s] %s\n" "$(red    'FAIL')" "$1"; FAILS=$((FAILS + 1)); }
warn() { printf "  [%s] %s\n" "$(yellow 'WARN')" "$1"; WARNS=$((WARNS + 1)); }
info() { printf "  [%s] %s\n" "     " "$1"; }

section() {
  echo ""
  echo "═══ $1 ═══"
}

resolve_records() {
  record_type="$1"
  name="$2"
  case "${RESOLVER:-}" in
    drill)
      drill "$record_type" "$name" 2>/dev/null | awk -v t="$record_type" '$4 == t {print $5}' | sort -u
      ;;
    dig)
      dig +short "$record_type" "$name" 2>/dev/null | sed '/^$/d' | sort -u
      ;;
    host)
      host -t "$record_type" "$name" 2>/dev/null | awk '
        / has address / {print $4}
        / IPv6 address / {print $5}
      ' | sort -u
      ;;
    *)
      return 1
      ;;
  esac
}

global_ipv6_list() {
  if command -v ifconfig >/dev/null 2>&1; then
    ifconfig 2>/dev/null | awk '
      /inet6 / {
        split($2, addr, "%")
        if (addr[1] != "::1" && addr[1] !~ /^fe80:/) {
          print addr[1]
        }
      }
    ' | sort -u
  fi
}

resolve_path() {
  path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path" 2>/dev/null || readlink "$path" 2>/dev/null || printf '%s\n' "$path"
  else
    readlink "$path" 2>/dev/null || printf '%s\n' "$path"
  fi
}

hosts_has_domain() {
  domain="$1"
  awk -v domain="$domain" '
    /^[[:space:]]*#/ {next}
    {
      for (i = 2; i <= NF; i++) {
        if ($i == domain) {
          found = 1
        }
      }
    }
    END { exit(found ? 0 : 1) }
  ' /etc/hosts 2>/dev/null
}

show_hosts_domain_lines() {
  domain="$1"
  awk -v domain="$domain" '
    /^[[:space:]]*#/ {next}
    {
      for (i = 2; i <= NF; i++) {
        if ($i == domain) {
          print NR ":" $0
          break
        }
      }
    }
  ' /etc/hosts 2>/dev/null
}

# ─── 1. OS & Privilege ─────────────────────────────────────────────────
section "1. OS & Privilege"

if [ "$(id -u)" -ne 0 ]; then
  fail "Script harus dijalankan sebagai root (sudo sh $0)"
else
  ok "Running as root"
fi

OS=$(uname -s 2>/dev/null)
if [ "$OS" = "FreeBSD" ]; then
  ok "OS: FreeBSD"
else
  fail "OS: $OS — script ini khusus FreeBSD"
fi

FBSD_VERSION=$(uname -r 2>/dev/null | cut -d- -f1)
FBSD_MAJOR=$(echo "$FBSD_VERSION" | cut -d. -f1)
if [ "$FBSD_MAJOR" -ge 14 ] 2>/dev/null; then
  ok "FreeBSD version: $FBSD_VERSION (≥14.0)"
elif [ "$FBSD_MAJOR" -ge 13 ] 2>/dev/null; then
  warn "FreeBSD version: $FBSD_VERSION — script diuji di 14.x, proceed at own risk"
else
  fail "FreeBSD version: $FBSD_VERSION — minimal 13.x"
fi

# ─── 2. Network & DNS ──────────────────────────────────────────────────
section "2. Network & DNS"

if command -v drill >/dev/null 2>&1; then
  RESOLVER="drill"
elif command -v dig >/dev/null 2>&1; then
  RESOLVER="dig"
elif command -v host >/dev/null 2>&1; then
  RESOLVER="host"
else
  RESOLVER=""
fi

if [ -n "$RESOLVER" ]; then
  if $RESOLVER pkg.freebsd.org >/dev/null 2>&1; then
    ok "DNS resolve pkg.freebsd.org ($RESOLVER)"
  else
    fail "DNS tidak bisa resolve pkg.freebsd.org — cek /etc/resolv.conf"
  fi

  DOMAIN_A="$(resolve_records A "$WEB_DOMAIN" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  DOMAIN_AAAA="$(resolve_records AAAA "$WEB_DOMAIN" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  if [ -n "$DOMAIN_A" ]; then
    ok "Public A $WEB_DOMAIN -> $DOMAIN_A"
  else
    warn "Public A $WEB_DOMAIN tidak ditemukan"
  fi
  if [ -n "$DOMAIN_AAAA" ]; then
    warn "Public AAAA $WEB_DOMAIN -> $DOMAIN_AAAA"
  else
    info "Public AAAA $WEB_DOMAIN tidak ada"
  fi
else
  warn "Tidak ada resolver tool (drill/dig/host) — skip DNS test"
fi

if fetch -qT 10 -o /dev/null https://pkg.freebsd.org 2>/dev/null; then
  ok "HTTPS reachable ke pkg.freebsd.org"
else
  fail "Tidak bisa akses https://pkg.freebsd.org — cek firewall/proxy"
fi

EXT_IF=$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}')
if [ -n "$EXT_IF" ]; then
  ok "Default external NIC: $EXT_IF"
else
  fail "Tidak ada default route — server offline?"
fi

if [ -f /etc/hosts ] && hosts_has_domain "$WEB_DOMAIN"; then
  warn "/etc/hosts override terdeteksi untuk $WEB_DOMAIN"
  show_hosts_domain_lines "$WEB_DOMAIN" | sed 's/^/       /'
else
  ok "Tidak ada override /etc/hosts untuk $WEB_DOMAIN"
fi

GLOBAL_IPV6="$(global_ipv6_list | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
if [ -n "$GLOBAL_IPV6" ]; then
  ok "Global IPv6 origin: $GLOBAL_IPV6"
else
  info "Origin tidak punya global IPv6"
fi

if [ -n "${DOMAIN_AAAA:-}" ] && [ -z "$GLOBAL_IPV6" ]; then
  warn "$WEB_DOMAIN punya AAAA publik tapi origin ini tidak punya global IPv6 — rawan ACME/edge failure"
fi

# ─── 3. Disk Space ─────────────────────────────────────────────────────
section "3. Disk Space"

ROOT_AVAIL=$(df -k / 2>/dev/null | awk 'NR==2 {print $4}')
ROOT_AVAIL_GB=$((ROOT_AVAIL / 1024 / 1024))
if [ "$ROOT_AVAIL_GB" -ge 20 ]; then
  ok "Free space / = ${ROOT_AVAIL_GB}GB (≥20GB)"
elif [ "$ROOT_AVAIL_GB" -ge 10 ]; then
  warn "Free space / = ${ROOT_AVAIL_GB}GB — recommend ≥20GB untuk deploy + backup"
else
  fail "Free space / = ${ROOT_AVAIL_GB}GB — kurang, minimal 10GB"
fi

VAR_AVAIL=$(df -k /var 2>/dev/null | awk 'NR==2 {print $4}')
VAR_AVAIL_GB=$((VAR_AVAIL / 1024 / 1024))
if [ "$VAR_AVAIL_GB" -ge 10 ]; then
  ok "Free space /var = ${VAR_AVAIL_GB}GB"
else
  warn "Free space /var = ${VAR_AVAIL_GB}GB — DB + log butuh ruang"
fi

# ─── 4. RAM ────────────────────────────────────────────────────────────
section "4. RAM"

RAM_BYTES=$(sysctl -n hw.physmem 2>/dev/null)
RAM_GB=$((RAM_BYTES / 1024 / 1024 / 1024))
if [ "$RAM_GB" -ge 8 ]; then
  ok "RAM: ${RAM_GB}GB"
elif [ "$RAM_GB" -ge 4 ]; then
  warn "RAM: ${RAM_GB}GB — minimum untuk prod, recommend 8GB+"
else
  fail "RAM: ${RAM_GB}GB — kurang untuk Laravel + Next.js + PG + Redis"
fi

# ─── 5. CPU ────────────────────────────────────────────────────────────
section "5. CPU"

NCPU=$(sysctl -n hw.ncpu 2>/dev/null)
if [ "$NCPU" -ge 4 ]; then
  ok "CPU cores: $NCPU"
elif [ "$NCPU" -ge 2 ]; then
  warn "CPU cores: $NCPU — recommend ≥4 untuk queue worker + Node"
else
  fail "CPU cores: $NCPU — terlalu sedikit"
fi

# ─── 6. pkg availability ───────────────────────────────────────────────
section "6. Package availability"

pkg_check() {
  pkg_name="$1"
  if pkg rquery %n "$pkg_name" 2>/dev/null | grep -q "^$pkg_name\$"; then
    ok "pkg $pkg_name tersedia"
  else
    fail "pkg $pkg_name TIDAK tersedia di repo"
  fi
}

if command -v pkg >/dev/null 2>&1; then
  ok "pkg command tersedia"
  # Update pkg repo sekali supaya rquery akurat
  echo "  (updating pkg catalog, tunggu sebentar...)"
  pkg update -q 2>/dev/null || warn "pkg update gagal — mungkin catalog stale"

  pkg_check "php${PHP_VERSION}"
  pkg_check "postgresql${PG_VERSION}-server"
  pkg_check "postgresql${PG_VERSION}-client"
  pkg_check "redis"
  pkg_check "nginx"
  pkg_check "apache24"
  pkg_check "node${NODE_VERSION}"
  pkg_check "npm-node${NODE_VERSION}"
  pkg_check "py311-supervisor"
  pkg_check "composer"
  pkg_check "git"
  pkg_check "py311-certbot"
else
  fail "pkg command tidak ada — bootstrap: 'env ASSUME_ALWAYS_YES=YES pkg bootstrap'"
fi

# ─── 7. Existing installations (deteksi konflik) ────────────────────────
section "7. Existing installations"

if pkg info php"${PHP_VERSION}" >/dev/null 2>&1; then
  PHP_V=$(php -v 2>/dev/null | head -1)
  ok "PHP sudah terinstall: $PHP_V"
else
  info "PHP ${PHP_VERSION} belum terinstall (akan di-install oleh install-freebsd.sh)"
fi

if pkg info postgresql"${PG_VERSION}"-server >/dev/null 2>&1; then
  ok "PostgreSQL ${PG_VERSION} sudah terinstall"
  if [ -f "/var/db/postgres/data${PG_VERSION}/PG_VERSION" ]; then
    ok "PG data directory sudah initdb"
  else
    info "PG belum initdb — install-freebsd.sh akan handle"
  fi
else
  info "PostgreSQL ${PG_VERSION} belum terinstall"
fi

# Deteksi konflik PG version lama
for OLD in 14 15 16 17; do
  if [ -d "/var/db/postgres/data${OLD}" ]; then
    warn "Ditemukan data PG lama: /var/db/postgres/data${OLD} — rencanakan migrasi atau hapus"
  fi
done

if pkg info nginx >/dev/null 2>&1; then
  ok "Nginx sudah terinstall"
else
  info "Nginx belum terinstall"
fi

if pkg info redis >/dev/null 2>&1; then
  ok "Redis sudah terinstall"
else
  info "Redis belum terinstall"
fi

# Apache konflik — port 80. Untuk profile Apache-backend + Nginx-frontend,
# Apache harus listen internal saja (127.0.0.1:8080), bukan 80/443.
if pkg info apache24 >/dev/null 2>&1; then
  if [ "${APACHE_BACKEND:-0}" = "1" ]; then
    ok "Apache24 terinstall untuk backend internal (pastikan Listen 127.0.0.1:8080)"
  else
    warn "Apache24 terinstall — konflik jika masih listen port 80. Untuk profile Apache backend jalankan: APACHE_BACKEND=1 sh scripts/preflight-freebsd.sh"
  fi
fi

# ─── 8. Ports availability ─────────────────────────────────────────────
section "8. Port availability"

check_port() {
  port="$1"
  service_name="$2"
  if sockstat -4 -l -p "$port" 2>/dev/null | grep -q ":$port"; then
    PID=$(sockstat -4 -l -p "$port" 2>/dev/null | awk 'NR==2 {print $3}')
    warn "Port $port ($service_name) sudah terpakai (PID $PID)"
  else
    ok "Port $port bebas (untuk $service_name)"
  fi
}

check_port 80 "nginx HTTP"
check_port 443 "nginx HTTPS"
check_port 8080 "Apache24 API backend"
check_port 3000 "Next.js"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

if [ -x /usr/local/etc/rc.d/sibermas_web ]; then
  WEB_BIND_HOST=$(sysrc -n sibermas_web_host 2>/dev/null || true)
  WEB_BIND_PORT=$(sysrc -n sibermas_web_port 2>/dev/null || true)
  [ -n "$WEB_BIND_HOST" ] || WEB_BIND_HOST="127.0.0.1"
  [ -n "$WEB_BIND_PORT" ] || WEB_BIND_PORT="3000"

  if [ "$WEB_BIND_HOST" = "127.0.0.1" ]; then
    ok "sibermas_web host internal: ${WEB_BIND_HOST}"
  else
    warn "sibermas_web host=${WEB_BIND_HOST} (disarankan 127.0.0.1 agar Nginx tetap owns public edge)"
  fi

  if [ "$WEB_BIND_PORT" = "3000" ]; then
    ok "sibermas_web port internal: ${WEB_BIND_PORT}"
  else
    warn "sibermas_web port=${WEB_BIND_PORT} (disarankan 3000; jangan bind Next.js ke 443 pada profile ini)"
  fi
fi

# ─── 9. Timezone ───────────────────────────────────────────────────────
section "9. Timezone"

TZ=$(readlink /etc/localtime 2>/dev/null | sed 's|.*/zoneinfo/||')
if [ "$TZ" = "Asia/Jakarta" ]; then
  ok "Timezone: Asia/Jakarta"
elif [ -n "$TZ" ]; then
  warn "Timezone: $TZ (untuk KKN Indonesia, set ke Asia/Jakarta: tzsetup)"
else
  warn "Timezone tidak set (tzsetup lalu pilih Asia/Jakarta)"
fi

# ─── 10. App directory ─────────────────────────────────────────────────
section "10. App directory"

if [ -d "$APP_DIR" ]; then
  if [ -f "$APP_DIR/composer.json" ] || [ -f "$APP_DIR/package.json" ]; then
    ok "App directory ada + sudah berisi kode: $APP_DIR"
  else
    warn "App directory ada tapi KOSONG: $APP_DIR — clone kode dulu"
  fi
else
  info "App directory BELUM ada: $APP_DIR — clone kode dulu"
  info "  git clone https://github.com/putrihati-cmd/KKNNATIVE.git $APP_DIR"
fi

# ─── 11. TLS certificate sanity ────────────────────────────────────────
section "11. TLS certificate sanity"

if [ "${EDGE_REVERSE_PROXY}" = "1" ]; then
  info "EDGE_REVERSE_PROXY=1 -> skip cert lokal; TLS terminate di frontend/gateway"
else
  CERT_FILE="/usr/local/etc/letsencrypt/live/${CERT_BASE}/fullchain.pem"
  if [ -f "$CERT_FILE" ]; then
    RESOLVED_CERT="$(resolve_path "$CERT_FILE")"
    ok "Cert file ada: $CERT_FILE"
    if [ "$RESOLVED_CERT" != "$CERT_FILE" ]; then
      info "Resolved path: $RESOLVED_CERT"
    fi
    case "$RESOLVED_CERT" in
      *selfsigned*|*/nginx/ssl/*)
        warn "Cert path mengarah ke self-signed/internal cert"
        ;;
    esac

    if command -v openssl >/dev/null 2>&1; then
      CERT_SUBJECT="$(openssl x509 -in "$CERT_FILE" -noout -subject -nameopt RFC2253 2>/dev/null | sed 's/^subject=//')"
      CERT_SAN="$(openssl x509 -in "$CERT_FILE" -noout -ext subjectAltName 2>/dev/null | sed '1d' | tr '\n' ' ' | sed 's/[[:space:]]*$//')"

      [ -n "$CERT_SUBJECT" ] && info "Subject: $CERT_SUBJECT"
      [ -n "$CERT_SAN" ] && info "SAN: $CERT_SAN"

      if printf '%s\n' "$CERT_SAN" | grep -Fq "DNS:${WEB_DOMAIN}"; then
        ok "Cert SAN mencakup $WEB_DOMAIN"
      elif printf '%s\n' "$CERT_SUBJECT" | grep -Fq "CN=${WEB_DOMAIN}"; then
        ok "Cert CN cocok $WEB_DOMAIN"
      else
        warn "Cert tidak memuat identitas $WEB_DOMAIN"
      fi
    else
      warn "openssl tidak tersedia — skip subject/SAN check"
    fi
  else
    info "Cert belum ada di $CERT_FILE"
  fi
fi

# ─── Summary ───────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Pre-flight Summary"
echo "═══════════════════════════════════════════════════════"
echo "  FAIL: $FAILS"
echo "  WARN: $WARNS"
echo ""

if [ "$FAILS" -eq 0 ]; then
  printf "  %s Server siap untuk install-freebsd.sh\n" "$(green '✔')"
  if [ "$WARNS" -gt 0 ]; then
    echo "  (ada $WARNS warning — review sebelum lanjut)"
  fi
  echo ""
  echo "  Next:"
  echo "    1. Clone kode ke $APP_DIR (kalau belum)"
  echo "    2. sh install-freebsd.sh"
  echo "    3. bash deploy-freebsd-simple.sh"
  exit 0
else
  printf "  %s Server BELUM siap — fix $FAILS FAIL items di atas\n" "$(red '✘')"
  exit 1
fi
