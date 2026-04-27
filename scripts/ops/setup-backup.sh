#!/usr/bin/env bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║    Setup Backup Automation with Cron for KKN System                   ║
# ║    Run this script as root to configure automatic backups              ║
# ║    Compatible with FreeBSD & Linux                                    ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
LOG_DIR="/var/log/kkn"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  KKN System - Backup Automation Setup                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Error: This script must be run as root"
    echo "   Run: sudo bash setup-backup.sh"
    exit 1
fi

# Create log directory
mkdir -p "${LOG_DIR}"
touch "${LOG_DIR}/backup.log"
chmod 755 "${LOG_DIR}"
chmod 644 "${LOG_DIR}/backup.log"

echo "✓ Log directory created: ${LOG_DIR}"

# Make backup script executable
chmod +x "${BACKUP_SCRIPT}"
echo "✓ Backup script made executable"

# OS Detection
IS_FREEBSD=false
if [ "$(uname)" == "FreeBSD" ]; then
    IS_FREEBSD=true
fi

echo "✓ OS Detected: $(uname)"

# Create cron job entry
CRON_ENTRY="30 2 * * * root ${BACKUP_SCRIPT} >> ${LOG_DIR}/backup.log 2>&1"

if [ "$IS_FREEBSD" = true ]; then
    echo ""
    echo "📝 FreeBSD detected. Please add the following line to /etc/crontab:"
    echo "─────────────────────────────────────────────────────────────"
    echo "${CRON_ENTRY}"
    echo "─────────────────────────────────────────────────────────────"
    echo ""
    echo "Or run this command to append it automatically:"
    echo "echo \"${CRON_ENTRY}\" >> /etc/crontab"
else
    CRON_FILE="/etc/cron.d/kkn-backup"
    cat > "${CRON_FILE}" << EOF
# KKN System Automated Backups
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
${CRON_ENTRY}
EOF
    chmod 644 "${CRON_FILE}"
    echo "✓ Cron job installed: ${CRON_FILE}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Backup Schedule: 2:30 AM Daily"
echo "Log Location:    ${LOG_DIR}/backup.log"
echo ""
echo "Manual Backup Test:"
echo "  • FreeBSD: sudo -u www ${BACKUP_SCRIPT}"
echo "  • Linux:   sudo -u www-data ${BACKUP_SCRIPT}"
echo ""

exit 0
