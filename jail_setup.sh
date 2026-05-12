#!/bin/sh
# jail_setup.sh — Script instalasi & konfigurasi jail SIBERMAS di FreeBSD 14.x
#
# Usage:
#   sh jail_setup.sh --fat              Setup Single Fat Jail (semua service)
#   sh jail_setup.sh --multi            Setup Multi-Jails VNET (4 jail terpisah)
#   sh jail_setup.sh --jail <name>      Setup satu jail tertentu
#   sh jail_setup.sh --bridge           Setup bridge network saja
#
# Jalankan sebagai root di host FreeBSD.
#
# Versi Runtime:
#   Node.js 24, PHP 8.4, PostgreSQL 18, Redis 8

set -e

# ─── Config ────────────────────────────────────────────────────────────
BRIDGE="jailnet"
BRIDGE_IP="10.0.0.1/24"
DOMAIN="${WEB_DOMAIN:-sibermas.uinsaizu.ac.id}"
CERT_EMAIL="${CERT_EMAIL:-admin@uinsaizu.ac.id}"
JAIL_ROOT="/usr/local/jails"
APP_DIR="/usr/local/www/sibermas"
FREEBSD_RELEASE="${FREEBSD_RELEASE:-14.1-RELEASE}"

# IP per jail
NGINX_PROXY_IP="10.0.0.10"
WEB_IP="10.0.0.11"
API_IP="10.0.0.12"
DATA_IP="10.0.0.13"

# Auto-detect external NIC dari default route. Override via env:
#   EXT_IF=vtnet0 sh jail_setup.sh --multi
detect_ext_if() {
  if [ -n "${EXT_IF:-}" ]; then
    echo "$EXT_IF"
    return
  fi
  local iface
  iface=$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}')
  if [ -z "$iface" ]; then
    # Fallback ke interface aktif pertama (selain lo0)
    iface=$(ifconfig -l | tr ' ' '\n' | grep -v '^lo' | head -1)
  fi
  echo "${iface:-em0}"
}

EXT_IF=$(detect_ext_if)

# ─── Helper ─────────────────────────────────────────────────────────────
info()  { printf "\033[36m==>\033[0m %s\n" "$*"; }
ok()    { printf "\033[32m  [✔]\033[0m %s\n" "$*"; }
warn()  { printf "\033[33m  [!]\033[0m %s\n" "$*"; }
err()   { printf "\033[31m  [✘]\033[0m %s\n" "$*" >&2; exit 1; }

check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    err "Jalankan sebagai root."
  fi
}

check_freebsd_version() {
  local ver
  ver=$(uname -r | cut -d- -f1 | cut -d. -f1)
  if [ "$ver" -lt 14 ] 2>/dev/null; then
    warn "Detected FreeBSD $(uname -r). Script ini diuji di 14.x — proceed at own risk."
  fi
}

# ─── Bridge Network ────────────────────────────────────────────────────
setup_bridge() {
  info "Setup bridge network (external NIC: ${EXT_IF})..."
  if ! ifconfig bridge0 >/dev/null 2>&1; then
    sysrc cloned_interfaces+="bridge0"
    service netif cloneup
  fi
  ifconfig bridge0 addm "${EXT_IF}" 2>/dev/null || warn "${EXT_IF} not added to bridge (maybe already added)"
  ifconfig bridge0 "$BRIDGE_IP" up
  ifconfig bridge0 name "${BRIDGE}" 2>/dev/null || true
  sysctl net.link.bridge.pfil_onlyip=0
  ok "Bridge ${BRIDGE} = $BRIDGE_IP"

  # pf.conf — guard lebih ketat dengan marker komentar
  local pf_marker="# sibermas:jailnet"
  if ! grep -q "${pf_marker}" /etc/pf.conf 2>/dev/null; then
    cat >> /etc/pf.conf << EOPF

${pf_marker}
# jailnet — NAT + port forwarding untuk jail
ext_if = "${EXT_IF}"
nat on \$ext_if from 10.0.0.0/24 to any -> (\$ext_if)
rdr on \$ext_if proto tcp to port { 80 443 } -> ${NGINX_PROXY_IP}
EOPF
    sysrc pf_enable="YES"
    service pf restart 2>/dev/null || service pf enable 2>/dev/null || true
    ok "pf.conf updated (marker: ${pf_marker})"
  else
    ok "pf.conf already has ${pf_marker}, skipping append"
  fi
}

# ─── Bootstrap Jail ────────────────────────────────────────────────────
bootstrap_jail() {
  local name="$1"
  local ip="$2"

  info "Bootstrapping jail: $name ($ip)..."
  mkdir -p "${JAIL_ROOT}/${name}"

  # Periksa apakah base sudah extracted secara utuh.
  # Cek sentinel file (bin/sh) bukan sekadar etc/hosts supaya tidak lolos
  # kalau partial extract (disk full, CTRL-C).
  if [ ! -x "${JAIL_ROOT}/${name}/bin/sh" ]; then
    if [ -f "/usr/freebsd-dist/base.txz" ]; then
      # tar -xf autodetect xz/gzip — portable untuk BSD tar.
      tar -xf /usr/freebsd-dist/base.txz -C "${JAIL_ROOT}/${name}" || \
        err "base.txz extract gagal — periksa disk space / integritas file."
      ok "base.txz extracted to ${JAIL_ROOT}/${name}"
    else
      warn "FreeBSD base.txz not found. Install via:"
      warn "  mkdir -p /usr/freebsd-dist"
      warn "  fetch https://download.freebsd.org/releases/amd64/amd64/${FREEBSD_RELEASE}/base.txz \\"
      warn "    -o /usr/freebsd-dist/base.txz"
      warn "  tar -xf /usr/freebsd-dist/base.txz -C ${JAIL_ROOT}/${name}"
      mkdir -p "${JAIL_ROOT}/${name}/etc"
    fi
  fi

  # Basic jail config files
  mkdir -p "${JAIL_ROOT}/${name}/usr/local/etc"
  echo "hostname=\"${name}\"" > "${JAIL_ROOT}/${name}/etc/rc.conf.local"
  echo 'sendmail_enable="NONE"' >> "${JAIL_ROOT}/${name}/etc/rc.conf.local"

  # Bootstrap resolver supaya jail bisa DNS lookup (wajib untuk pkg install).
  if [ ! -f "${JAIL_ROOT}/${name}/etc/resolv.conf" ]; then
    cp /etc/resolv.conf "${JAIL_ROOT}/${name}/etc/resolv.conf" 2>/dev/null || \
      echo 'nameserver 1.1.1.1' > "${JAIL_ROOT}/${name}/etc/resolv.conf"
  fi

  # Stub fstab (operator harus edit sebelum start untuk nullfs mounts).
  local fstab_file="/etc/jails.fstab.${name}"
  if [ ! -f "$fstab_file" ]; then
    cat > "$fstab_file" << EOF
# Jail fstab: ${name}
# Format: <src> <dst-inside-jail> <fstype> <options> <dump> <pass>
# Tambah nullfs mount untuk kode aplikasi / shared storage. Contoh:
#
#   /usr/local/www/sibermas/releases/current/apps/api  /usr/local/jails/${name}/usr/local/www/sibermas/api  nullfs  rw  0  0
#   /usr/local/www/sibermas/shared/storage             /usr/local/jails/${name}/usr/local/www/sibermas/api/storage  nullfs  rw  0  0
EOF
    ok "Stub fstab dibuat: ${fstab_file}"
  fi

  ok "Jail $name directory ready at ${JAIL_ROOT}/${name}"
}

# ─── Install Packages in Jail ──────────────────────────────────────────
pkg_inside() {
  local jail="$1"
  shift
  # set -e + fallback: kalau dua-duanya gagal, keluar dengan error jelas.
  if ! jexec "$jail" env ASSUME_ALWAYS_YES=YES pkg install -y "$@"; then
    err "pkg install gagal di jail '${jail}'. Pastikan jail running dan punya akses internet (resolv.conf + NAT)."
  fi
}

# ─── Setup Data Services Jail ──────────────────────────────────────────
setup_data_jail() {
  local j="data-services"

  info "Setting up $j jail..."
  bootstrap_jail "$j" "$DATA_IP"
  service jail start "$j" 2>/dev/null || true

  pkg_inside "$j" postgresql18-server postgresql18-client redis
  jexec "$j" sysrc postgresql_enable="YES"
  jexec "$j" sysrc redis_enable="YES"

  # Init DB
  jexec "$j" service postgresql initdb 2>/dev/null || warn "PostgreSQL already initialized"

  # Konfigurasi PostgreSQL
  jexec "$j" sed -i '' "s/^listen_addresses =.*/listen_addresses = '${DATA_IP}'/" \
    /var/db/postgres/data18/postgresql.conf 2>/dev/null || true
  jexec "$j" sh -c "echo 'host    kkn_production    kkn_app    10.0.0.0/24    md5' >> \
    /var/db/postgres/data18/pg_hba.conf" 2>/dev/null || true

  # Konfigurasi Redis
  jexec "$j" sh -c "echo 'bind ${DATA_IP}' >> /usr/local/etc/redis.conf" 2>/dev/null || true

  ok "$j jail ready — start with: service jail start $j"
}

# ─── Setup API Jail ────────────────────────────────────────────────────
setup_api_jail() {
  local j="api"

  info "Setting up $j jail..."
  bootstrap_jail "$j" "$API_IP"
  service jail start "$j" 2>/dev/null || true

  pkg_inside "$j" \
    php84 php84-extensions php84-pdo php84-pdo_pgsql \
    php84-pgsql php84-mbstring php84-xml php84-curl php84-zip \
    php84-gd php84-intl php84-bcmath php84-redis php84-opcache \
    php84-tokenizer php84-fileinfo php84-ctype php84-dom \
    php84-session php84-simplexml php84-xmlwriter php84-xmlreader \
    php84-openssl php84-filter php84-sodium php84-pcntl php84-posix \
    composer nginx py311-supervisor git curl bash

  jexec "$j" sysrc nginx_enable="YES"
  jexec "$j" sysrc php_fpm_enable="YES"
  jexec "$j" sysrc supervisord_enable="YES"

  # PHP-FPM pool: Unix socket
  jexec "$j" sed -i '' 's|^listen =.*|listen = /var/run/php-fpm.sock|' \
    /usr/local/etc/php-fpm.d/www.conf 2>/dev/null || true
  jexec "$j" sed -i '' 's/;listen.owner =.*/listen.owner = www/' \
    /usr/local/etc/php-fpm.d/www.conf 2>/dev/null || true
  jexec "$j" sed -i '' 's/;listen.group =.*/listen.group = www/' \
    /usr/local/etc/php-fpm.d/www.conf 2>/dev/null || true
  jexec "$j" sed -i '' 's/;listen.mode =.*/listen.mode = 0660/' \
    /usr/local/etc/php-fpm.d/www.conf 2>/dev/null || true

  ok "$j jail ready — start with: service jail start $j"
}

# ─── Setup Web Jail ────────────────────────────────────────────────────
setup_web_jail() {
  local j="web"

  info "Setting up $j jail..."
  bootstrap_jail "$j" "$WEB_IP"
  service jail start "$j" 2>/dev/null || true

  pkg_inside "$j" node24 npm-node24 git curl bash

  ok "$j jail ready — start with: service jail start $j"
}

# ─── Setup Nginx-Proxy Jail ────────────────────────────────────────────
setup_proxy_jail() {
  local j="nginx-proxy"

  info "Setting up $j jail..."
  bootstrap_jail "$j" "$NGINX_PROXY_IP"
  service jail start "$j" 2>/dev/null || true

  pkg_inside "$j" nginx py311-certbot curl

  jexec "$j" sysrc nginx_enable="YES"

  ok "$j jail ready — start with: service jail start $j"
}

# ─── Setup Single Fat Jail ─────────────────────────────────────────────
setup_fat_jail() {
  local j="sibermas"
  local ip="$NGINX_PROXY_IP"

  info "Setting up Single Fat Jail: $j..."
  bootstrap_jail "$j" "$ip"
  service jail start "$j" 2>/dev/null || true

  # Install semua paket (PostgreSQL 18 — selaras dengan jails mode).
  pkg_inside "$j" \
    nginx node24 npm-node24 \
    php84 php84-extensions php84-pdo php84-pdo_pgsql \
    php84-pgsql php84-mbstring php84-xml php84-curl php84-zip \
    php84-gd php84-intl php84-bcmath php84-redis php84-opcache \
    php84-tokenizer php84-fileinfo php84-ctype php84-dom \
    php84-session php84-simplexml php84-xmlwriter php84-xmlreader \
    php84-openssl php84-filter php84-sodium php84-pcntl php84-posix \
    postgresql18-server postgresql18-client \
    redis composer py311-supervisor git curl bash py311-certbot

  # Enable services
  jexec "$j" sysrc nginx_enable="YES"
  jexec "$j" sysrc php_fpm_enable="YES"
  jexec "$j" sysrc postgresql_enable="YES"
  jexec "$j" sysrc redis_enable="YES"
  jexec "$j" sysrc supervisord_enable="YES"

  ok "$j Single Fat Jail ready — start with: service jail start $j"
  warn "Path aplikasi di dalam fat jail: ${APP_DIR}"
  warn "Gunakan install-freebsd.sh untuk setup aplikasi di dalam jail."
}

# ─── Generate jail.conf ────────────────────────────────────────────────
generate_jail_conf() {
  local mode="${1:-multi}"
  local file="/etc/jail.conf"

  if [ "$mode" = "multi" ]; then
    info "Generating Multi-Jails VNET config: $file"
    cat > "$file" << JAILCONF
# Auto-generated by jail_setup.sh — edit with care.
exec.start  = "/bin/sh /etc/rc";
exec.stop   = "/bin/sh /etc/rc.shutdown";
exec.clean;
mount.devfs;

path = "/usr/local/jails/\$name";

nginx-proxy {
    \$ip     = "${NGINX_PROXY_IP}";
    \$bridge = "${BRIDGE}";
    vnet;
    vnet.interface = "epair0b";
    ip4.addr = \$ip;
    allow.raw_sockets;
    mount.fstab = "/etc/jails.fstab.nginx-proxy";
    exec.prestart  = "ifconfig epair0 create up && ifconfig epair0a up";
    exec.poststart = "ifconfig \$bridge addm epair0a";
    exec.poststop  = "ifconfig epair0a destroy";
}

web {
    \$ip     = "${WEB_IP}";
    \$bridge = "${BRIDGE}";
    vnet;
    vnet.interface = "epair1b";
    ip4.addr = \$ip;
    mount.fstab = "/etc/jails.fstab.web";
    exec.prestart  = "ifconfig epair1 create up && ifconfig epair1a up";
    exec.poststart = "ifconfig \$bridge addm epair1a";
    exec.poststop  = "ifconfig epair1a destroy";
}

api {
    \$ip     = "${API_IP}";
    \$bridge = "${BRIDGE}";
    vnet;
    vnet.interface = "epair2b";
    ip4.addr = \$ip;
    mount.fstab = "/etc/jails.fstab.api";
    exec.prestart  = "ifconfig epair2 create up && ifconfig epair2a up";
    exec.poststart = "ifconfig \$bridge addm epair2a";
    exec.poststop  = "ifconfig epair2a destroy";
}

data-services {
    \$ip     = "${DATA_IP}";
    \$bridge = "${BRIDGE}";
    vnet;
    vnet.interface = "epair3b";
    ip4.addr = \$ip;
    mount.fstab = "/etc/jails.fstab.data-services";
    exec.prestart  = "ifconfig epair3 create up && ifconfig epair3a up";
    exec.poststart = "ifconfig \$bridge addm epair3a";
    exec.poststop  = "ifconfig epair3a destroy";
}
JAILCONF
    ok "Generated $file for multi-jails VNET"
  else
    info "Generating Single Fat Jail config: $file"
    cat > "$file" << JAILCONF
# Auto-generated by jail_setup.sh — edit with care.
exec.start  = "/bin/sh /etc/rc";
exec.stop   = "/bin/sh /etc/rc.shutdown";
exec.clean;
mount.devfs;

path = "/usr/local/jails/\$name";

sibermas {
    ip4.addr = "${EXT_IF}|${NGINX_PROXY_IP}";
    interface = "${EXT_IF}";
    mount.fstab = "/etc/jails.fstab.sibermas";
    allow.raw_sockets;
}
JAILCONF
    ok "Generated $file for single fat jail (interface: ${EXT_IF})"
  fi
}

# ─── Post-Setup Info ───────────────────────────────────────────────────
print_summary() {
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Jail Setup Selesai!"
  echo "═══════════════════════════════════════════════════════"
  echo "
  Arsitektur jaringan:
    External NIC: ${EXT_IF}
    Bridge:       ${BRIDGE} = ${BRIDGE_IP}
    nginx-proxy:  ${NGINX_PROXY_IP}
    web:          ${WEB_IP}
    api:          ${API_IP}
    data:         ${DATA_IP}

  Langkah selanjutnya:
    1. Edit /etc/jails.fstab.* (stub sudah dibuat) — tambah nullfs mount
       untuk kode aplikasi dan shared storage.
    2. Salin kode aplikasi ke ${APP_DIR}/releases/current/
    3. Jalankan semua jail:
         for j in data-services api web nginx-proxy; do
           service jail start \$j
         done
    4. Install aplikasi di setiap jail (lihat docs/JAILS_MIGRATION.md)
    5. Setup SSL cert di nginx-proxy jail
    6. Deploy dan test

  Untuk deploy otomatis:
    bash deploy-atomic.sh

  Logs:
    tail -f /var/log/jail_*.log
  "
}

# ─── Main ──────────────────────────────────────────────────────────────
main() {
  check_root
  check_freebsd_version

  case "${1:-}" in
    --fat)
      setup_bridge
      generate_jail_conf single
      setup_fat_jail
      print_summary
      ;;
    --multi)
      setup_bridge
      generate_jail_conf multi
      setup_data_jail
      setup_api_jail
      setup_web_jail
      setup_proxy_jail
      print_summary
      ;;
    --bridge)
      setup_bridge
      generate_jail_conf multi
      ok "Bridge + jail.conf siap. Jalankan service jail start <nama> untuk masing-masing jail."
      ;;
    --jail)
      shift
      case "${1:-}" in
        data|data-services)  setup_data_jail ;;
        api)                 setup_api_jail ;;
        web)                 setup_web_jail ;;
        proxy|nginx-proxy)   setup_proxy_jail ;;
        fat)                 setup_bridge; generate_jail_conf single; setup_fat_jail ;;
        *)                   echo "Usage: $0 --jail <data|api|web|proxy|fat>" ;;
      esac
      ;;
    --conf)
      generate_jail_conf multi
      ;;
    *)
      echo "SIBERMAS FreeBSD Jails Setup"
      echo ""
      echo "Usage:"
      echo "  $0 --fat               Setup Single Fat Jail (semua service)"
      echo "  $0 --multi             Setup Multi-Jails VNET (4 jail)"
      echo "  $0 --bridge            Setup bridge network saja"
      echo "  $0 --jail <name>       Setup satu jail (data|api|web|proxy|fat)"
      echo "  $0 --conf              Generate /etc/jail.conf"
      echo ""
      echo "Sebelum mulai, pastikan:"
      echo "  1. Koneksi internet aktif"
      echo "  2. External NIC terdeteksi otomatis — override: EXT_IF=vtnet0 sh $0 ..."
      echo "  3. FreeBSD 14.x base.txz di /usr/freebsd-dist/ (opsional)"
      echo ""
      echo "Detected external NIC: ${EXT_IF}"
      ;;
  esac
}

main "$@"
