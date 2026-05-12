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

# IP per jail
NGINX_PROXY_IP="10.0.0.10"
WEB_IP="10.0.0.11"
API_IP="10.0.0.12"
DATA_IP="10.0.0.13"

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

# ─── Bridge Network ────────────────────────────────────────────────────
setup_bridge() {
  info "Setup bridge network..."
  if ! ifconfig bridge0 >/dev/null 2>&1; then
    sysrc cloned_interfaces+="bridge0"
    service netif cloneup
  fi
  ifconfig bridge0 addm em0 2>/dev/null || warn "em0 not added to bridge (maybe already added)"
  ifconfig bridge0 "$BRIDGE_IP" up
  sysctl net.link.bridge.pfil_onlyip=0
  ok "Bridge bridge0 = $BRIDGE_IP"

  # pf.conf
  if ! grep -q "jailnet" /etc/pf.conf 2>/dev/null; then
    cat >> /etc/pf.conf << 'EOPF'

# jailnet — NAT + port forwarding untuk jail
nat on egress from 10.0.0.0/24 to any -> (egress)
rdr on egress proto tcp to port { 80 443 } -> 10.0.0.10
EOPF
    sysrc pf_enable="YES"
    service pf restart 2>/dev/null || service pf enable 2>/dev/null || true
    ok "pf.conf updated"
  fi
}

# ─── Bootstrap Jail ────────────────────────────────────────────────────
bootstrap_jail() {
  local name="$1"
  local ip="$2"

  info "Bootstrapping jail: $name ($ip)..."
  mkdir -p "${JAIL_ROOT}/${name}"

  # Periksa apakah base sudah ada
  if [ ! -f "${JAIL_ROOT}/${name}/etc/hosts" ]; then
    if [ -f "/usr/freebsd-dist/base.txz" ]; then
      tar -xzf /usr/freebsd-dist/base.txz -C "${JAIL_ROOT}/${name}" 2>/dev/null || \
        warn "base.txz not found at /usr/freebsd-dist/ — jail directory created empty."
    else
      warn "FreeBSD base.txz not found. Install via:"
      warn "  fetch https://download.freebsd.org/releases/amd64/amd64/14.1-RELEASE/base.txz \\"
      warn "    -o /usr/freebsd-dist/base.txz"
      warn "  tar -xzf /usr/freebsd-dist/base.txz -C ${JAIL_ROOT}/${name}"
      mkdir -p "${JAIL_ROOT}/${name}/etc"
    fi
  fi

  # Basic jail config files
  mkdir -p "${JAIL_ROOT}/${name}/usr/local/etc"
  echo "hostname=\"${name}\"" > "${JAIL_ROOT}/${name}/etc/rc.conf.local"
  echo 'sendmail_enable="NONE"' >> "${JAIL_ROOT}/${name}/etc/rc.conf.local"

  ok "Jail $name directory ready at ${JAIL_ROOT}/${name}"
}

# ─── Install Packages in Jail ──────────────────────────────────────────
pkg_inside() {
  local jail="$1"
  shift
  jexec "$jail" pkg install -y "$@" || \
    jexec "$jail" env ASSUME_ALWAYS_YES=YES pkg install -y "$@"
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

  # Install semua paket
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
  warn "Path aplikasi di dalam fat jail: /usr/local/www/apache24/data/Sibermas2026"
  warn "Gunakan install-freebsd.sh untuk setup aplikasi di dalam jail."
}

# ─── Generate jail.conf ────────────────────────────────────────────────
generate_jail_conf() {
  local mode="${1:-multi}"
  local file="/etc/jail.conf"

  if [ "$mode" = "multi" ]; then
    info "Generating Multi-Jails VNET config: $file"
    cat > "$file" << 'JAILCONF'
exec.start  = "/bin/sh /etc/rc";
exec.stop   = "/bin/sh /etc/rc.shutdown";
exec.clean;
mount.devfs;

path = /usr/local/jails/$name;

nginx-proxy {
    vnet;
    vnet.interface = "epair0b";
    $ip = "10.0.0.10";
    $bridge = "jailnet";
    ip4.addr = $ip;
    allow.raw_sockets;
    mount.fstab = "/etc/jails.fstab.nginx-proxy";
    exec.prestart  = "ifconfig epair0a up";
    exec.poststart = "ifconfig $bridge addm epair0a";
    exec.poststop  = "ifconfig epair0a destroy";
}

web {
    vnet;
    vnet.interface = "epair1b";
    $ip = "10.0.0.11";
    $bridge = "jailnet";
    ip4.addr = $ip;
    mount.fstab = "/etc/jails.fstab.web";
    exec.prestart  = "ifconfig epair1a up";
    exec.poststart = "ifconfig $bridge addm epair1a";
    exec.poststop  = "ifconfig epair1a destroy";
}

api {
    vnet;
    vnet.interface = "epair2b";
    $ip = "10.0.0.12";
    $bridge = "jailnet";
    ip4.addr = $ip;
    mount.fstab = "/etc/jails.fstab.api";
    exec.prestart  = "ifconfig epair2a up";
    exec.poststart = "ifconfig $bridge addm epair2a";
    exec.poststop  = "ifconfig epair2a destroy";
}

data-services {
    vnet;
    vnet.interface = "epair3b";
    $ip = "10.0.0.13";
    $bridge = "jailnet";
    ip4.addr = $ip;
    mount.fstab = "/etc/jails.fstab.data";
    exec.prestart  = "ifconfig epair3a up";
    exec.poststart = "ifconfig $bridge addm epair3a";
    exec.poststop  = "ifconfig epair3a destroy";
}
JAILCONF
  ok "Generated $file for multi-jails VNET"
  else
    info "Generating Single Fat Jail config: $file"
    cat > "$file" << 'JAILCONF'
exec.start  = "/bin/sh /etc/rc";
exec.stop   = "/bin/sh /etc/rc.shutdown";
exec.clean;
mount.devfs;

path = /usr/local/jails/sibermas;

sibermas {
    ip4.addr = "10.0.0.10";
    interface = "em0";
    mount.fstab = "/etc/jails.fstab.sibermas";
    allow.raw_sockets;
}
JAILCONF
  ok "Generated $file for single fat jail"
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
    Bridge:   bridge0 = ${BRIDGE_IP}
    nginx-proxy: ${NGINX_PROXY_IP}
    web:         ${WEB_IP}
    api:         ${API_IP}
    data:        ${DATA_IP}

  Langkah selanjutnya:
    1. Salin kode aplikasi ke ${APP_DIR}/releases/current/
    2. Setup nullfs mounts (/etc/jails.fstab.*)
    3. Jalankan semua jail:  for j in data-services api web nginx-proxy; do
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
      echo "  2. Interface network: em0 (ganti jika berbeda)"
      echo "  3. FreeBSD 14.x base.txz di /usr/freebsd-dist/ (opsional)"
      ;;
  esac
}

main "$@"
