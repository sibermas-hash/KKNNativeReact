#!/bin/sh
# SIBERMAS Daily Backup - DB + .env
# Runs via crontab: 0 2 * * *

BACKUP_DIR="/var/backups/sibermas"
APP_DIR="/usr/local/www/apache24/data/Sibermas2026"
DB_NAME="kknnative"
RETENTION_DAYS=14
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# PostgreSQL dump (custom format, compressed)
sudo -u postgres pg_dump -Fc $DB_NAME > $BACKUP_DIR/db_${DATE}.dump

# Backup .env
cp $APP_DIR/apps/api/.env $BACKUP_DIR/env_api_${DATE}.bak 2>/dev/null

# Cleanup old backups
find $BACKUP_DIR -name "db_*.dump" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_*.bak" -mtime +$RETENTION_DAYS -delete

echo "$(date): Backup completed - db_${DATE}.dump" >> $BACKUP_DIR/backup.log
