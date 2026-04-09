#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║    Setup Backup Automation with Cron for KKN System                   ║
# ║    Run this script as root to configure automatic backups              ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
CRON_FILE="/etc/cron.d/kkn-backup"
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

# Create cron job
cat > "${CRON_FILE}" << 'EOF'
# ─────────────────────────────────────────────────────────────────────
# KKN System Automated Backups
# ─────────────────────────────────────────────────────────────────────

# Environment variables
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root

# Schedule: Daily at 2:30 AM
30 2 * * * root /var/www/kkn-system/scripts/backup.sh >> /var/log/kkn/backup.log 2>&1

# Schedule: Weekly summary every Sunday at 3:00 AM
0 3 * * 0 root /var/www/kkn-system/scripts/backup-summary.sh >> /var/log/kkn/backup.log 2>&1
EOF

chmod 644 "${CRON_FILE}"
echo "✓ Cron job installed: ${CRON_FILE}"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Backup Schedule:"
echo "  • Daily:   2:30 AM (7 days retention)"
echo "  • Weekly:  4 weeks retention"
echo "  • Monthly: 12 months retention"
echo ""
echo "Logs:"
echo "  • Location: /var/log/kkn/backup.log"
echo "  • View:     tail -f /var/log/kkn/backup.log"
echo ""
echo "Manual Backup:"
echo "  • Run: ${BACKUP_SCRIPT}"
echo ""
echo "Test Backup:"
echo "  • Run: sudo -u www-data ${BACKUP_SCRIPT}"
echo ""
echo "Next backup: $(date -d 'tomorrow 02:30' '+%Y-%m-%d %H:%M')"
echo ""

exit 0
