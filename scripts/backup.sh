#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║         KKN UIN Saizu - Database Backup Script                        ║
# ║         Automatic backup untuk PostgreSQL + MySQL                      ║
# ║         Author: DevOps Team                                            ║
# ║         Version: 1.0                                                   ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────

# PostgreSQL Configuration (KKN Database)
PG_HOST="${DB_KKN_HOST:-127.0.0.1}"
PG_PORT="${DB_KKN_PORT:-5433}"
PG_DB="${DB_KKN_DATABASE:-kkn}"
PG_USER="${DB_KKN_USERNAME:-kknuinsaizu}"
PG_PASSWORD="${DB_KKN_PASSWORD:-kknuinsaizu2026}"

# MySQL Configuration (Main Database) - if used
MYSQL_HOST="${DB_HOST:-127.0.0.1}"
MYSQL_PORT="${DB_PORT:-3306}"
MYSQL_DB="${DB_DATABASE:-kknuinsaizu}"
MYSQL_USER="${DB_USERNAME:-root}"
MYSQL_PASSWORD="${DB_PASSWORD:-}"

# Backup Directory
BACKUP_DIR="/var/backups/kkn-system"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
MONTHLY_DIR="${BACKUP_DIR}/monthly"

# Retention Policy
DAILY_RETENTION=7          # Keep 7 days of daily backups
WEEKLY_RETENTION=4         # Keep 4 weeks of weekly backups  
MONTHLY_RETENTION=12       # Keep 12 months of monthly backups

# Logging
LOG_FILE="/var/log/kkn-backup.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE_SUFFIX=$(date '+%Y%m%d_%H%M%S')

# ─────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────

log() {
    echo "[${TIMESTAMP}] $*" | tee -a "${LOG_FILE}"
}

error() {
    echo "[ERROR] $*" | tee -a "${LOG_FILE}" >&2
}

create_dirs() {
    mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}" "${MONTHLY_DIR}"
    chmod 700 "${BACKUP_DIR}"
    log "Backup directories ready"
}

# ─────────────────────────────────────────────────────────────────────────
# POSTGRESQL BACKUP
# ─────────────────────────────────────────────────────────────────────────

backup_postgresql() {
    log "Starting PostgreSQL backup (KKN Database)..."
    
    local backup_file="${DAILY_DIR}/kkn_pgsql_${DATE_SUFFIX}.sql.gz"
    
    PGPASSWORD="${PG_PASSWORD}" pg_dump \
        -h "${PG_HOST}" \
        -p "${PG_PORT}" \
        -U "${PG_USER}" \
        -d "${PG_DB}" \
        -v --no-password | gzip > "${backup_file}"
    
    if [ -f "${backup_file}" ]; then
        local size=$(du -h "${backup_file}" | cut -f1)
        log "PostgreSQL backup successful: ${backup_file} (${size})"
        chmod 600 "${backup_file}"
        return 0
    else
        error "PostgreSQL backup failed"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────
# MYSQL BACKUP (Optional)
# ─────────────────────────────────────────────────────────────────────────

backup_mysql() {
    log "Starting MySQL backup (Main Database)..."
    
    local backup_file="${DAILY_DIR}/kkn_mysql_${DATE_SUFFIX}.sql.gz"
    
    # Check if MySQL is available
    if ! command -v mysqldump &> /dev/null; then
        log "MySQL not installed, skipping MySQL backup"
        return 0
    fi
    
    if [ -z "${MYSQL_PASSWORD}" ]; then
        mysqldump \
            -h "${MYSQL_HOST}" \
            -u "${MYSQL_USER}" \
            "${MYSQL_DB}" | gzip > "${backup_file}"
    else
        mysqldump \
            -h "${MYSQL_HOST}" \
            -u "${MYSQL_USER}" \
            -p"${MYSQL_PASSWORD}" \
            "${MYSQL_DB}" | gzip > "${backup_file}"
    fi
    
    if [ -f "${backup_file}" ]; then
        local size=$(du -h "${backup_file}" | cut -f1)
        log "MySQL backup successful: ${backup_file} (${size})"
        chmod 600 "${backup_file}"
        return 0
    else
        error "MySQL backup failed"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────
# FILE SYSTEM BACKUP
# ─────────────────────────────────────────────────────────────────────────

backup_filesystems() {
    log "Starting filesystem backup..."
    
    local backup_file="${DAILY_DIR}/kkn_files_${DATE_SUFFIX}.tar.gz"
    
    tar --gzip \
        --create \
        --file "${backup_file}" \
        --exclude='node_modules' \
        --exclude='vendor' \
        --exclude='.git' \
        --exclude='storage/logs' \
        --exclude='storage/debugbar' \
        /var/www/kkn-system/storage \
        /var/www/kkn-system/config \
        /var/www/kkn-system/.env 2>/dev/null || true
    
    if [ -f "${backup_file}" ]; then
        local size=$(du -h "${backup_file}" | cut -f1)
        log "Filesystem backup successful: ${backup_file} (${size})"
        chmod 600 "${backup_file}"
        return 0
    else
        error "Filesystem backup failed"
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────
# ARCHIVE ROTATION
# ─────────────────────────────────────────────────────────────────────────

rotate_daily_to_weekly() {
    # Move oldest daily backup to weekly
    local oldest_daily=$(find "${DAILY_DIR}" -type f -name "*.sql.gz" -printf '%T@ %p\n' | sort -n | head -1 | cut -d' ' -f2-)
    
    if [ -n "${oldest_daily}" ]; then
        mv "${oldest_daily}" "${WEEKLY_DIR}/"
        log "Rotated daily backup to weekly: $(basename ${oldest_daily})"
    fi
}

rotate_weekly_to_monthly() {
    # Move oldest weekly backup to monthly
    local oldest_weekly=$(find "${WEEKLY_DIR}" -type f -name "*.sql.gz" -printf '%T@ %p\n' | sort -n | head -1 | cut -d' ' -f2-)
    
    if [ -n "${oldest_weekly}" ]; then
        mv "${oldest_weekly}" "${MONTHLY_DIR}/"
        log "Rotated weekly backup to monthly: $(basename ${oldest_weekly})"
    fi
}

# ─────────────────────────────────────────────────────────────────────────
# CLEANUP OLD BACKUPS
# ─────────────────────────────────────────────────────────────────────────

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Daily: Keep only DAILY_RETENTION newest
    find "${DAILY_DIR}" -type f -mtime +${DAILY_RETENTION} -delete
    log "Removed daily backups older than ${DAILY_RETENTION} days"
    
    # Weekly: Keep only WEEKLY_RETENTION newest
    find "${WEEKLY_DIR}" -type f -mtime +$((WEEKLY_RETENTION * 7)) -delete
    log "Removed weekly backups older than ${WEEKLY_RETENTION} weeks"
    
    # Monthly: Keep only MONTHLY_RETENTION newest
    find "${MONTHLY_DIR}" -type f -mtime +$((MONTHLY_RETENTION * 30)) -delete
    log "Removed monthly backups older than ${MONTHLY_RETENTION} months"
}

# ─────────────────────────────────────────────────────────────────────────
# VERIFY BACKUPS
# ─────────────────────────────────────────────────────────────────────────

verify_backups() {
    log "Verifying backup integrity..."
    
    local failed=0
    local verified=0
    
    for backup in "${DAILY_DIR}"/*.sql.gz; do
        if [ -f "${backup}" ]; then
            if gzip -t "${backup}" 2>/dev/null; then
                ((verified++))
            else
                error "Backup verification failed: ${backup}"
                ((failed++))
            fi
        fi
    done
    
    log "Backup verification: ${verified} verified, ${failed} failed"
    
    if [ ${failed} -gt 0 ]; then
        return 1
    fi
}

# ─────────────────────────────────────────────────────────────────────────
# SEND NOTIFICATIONS
# ─────────────────────────────────────────────────────────────────────────

send_notification() {
    local status=$1
    local message=$2
    
    # Send to syslog
    logger -t "kkn-backup" "${message}"
    
    # Optional: Send email notification
    # echo "${message}" | mail -s "KKN Backup ${status}" admin@kkn.uinsaizu.ac.id
    
    log "Notification sent: ${message}"
}

# ─────────────────────────────────────────────────────────────────────────
# MAIN EXECUTION
# ─────────────────────────────────────────────────────────────────────────

main() {
    log "═════════════════════════════════════════════════════════════"
    log "KKN System Backup Started"
    log "═════════════════════════════════════════════════════════════"
    
    create_dirs
    
    local backup_success=true
    
    if ! backup_postgresql; then
        backup_success=false
    fi
    
    if ! backup_mysql; then
        backup_success=false
    fi
    
    if ! backup_filesystems; then
        backup_success=false
    fi
    
    rotate_daily_to_weekly
    rotate_weekly_to_monthly
    cleanup_old_backups
    
    if verify_backups; then
        send_notification "SUCCESS" "All backups completed successfully"
        log "═════════════════════════════════════════════════════════════"
        log "KKN System Backup Completed Successfully"
        log "═════════════════════════════════════════════════════════════"
        exit 0
    else
        send_notification "FAILED" "Backup verification failed"
        error "═════════════════════════════════════════════════════════════"
        error "KKN System Backup Failed Verification"
        error "═════════════════════════════════════════════════════════════"
        exit 1
    fi
}

main "$@"
