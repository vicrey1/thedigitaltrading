#!/bin/bash

# MongoDB Backup Script for LuxHedge Production
# This script creates encrypted backups and uploads them to cloud storage

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../server/.env"

# Load environment variables
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "❌ Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Backup configuration
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE_DIR:-/tmp/backups}/mongodb"
DB_NAME="${MONGO_DB_NAME:-luxhedge_production}"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Cloud storage configuration
S3_BUCKET="${BACKUP_S3_BUCKET}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting MongoDB backup for $DB_NAME at $(date)"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to cleanup on exit
cleanup() {
    if [ -d "$BACKUP_DIR/$DATE" ]; then
        rm -rf "$BACKUP_DIR/$DATE"
        log "🧹 Cleaned up temporary files"
    fi
}
trap cleanup EXIT

# Check if MongoDB is accessible
log "🔍 Checking MongoDB connection..."
if ! mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    log "❌ Cannot connect to MongoDB at $MONGO_URI"
    exit 1
fi
log "✅ MongoDB connection successful"

# Create backup
log "📦 Creating MongoDB dump..."
if ! mongodump --uri="$MONGO_URI" --db="$DB_NAME" --out="$BACKUP_DIR/$DATE"; then
    log "❌ MongoDB dump failed"
    exit 1
fi
log "✅ MongoDB dump completed"

# Create compressed archive
log "🗜️ Compressing backup..."
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_${DATE}.tar.gz"
if ! tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR" "$DATE"; then
    log "❌ Backup compression failed"
    exit 1
fi
log "✅ Backup compressed: $(du -h "$BACKUP_FILE" | cut -f1)"

# Encrypt backup if encryption key is provided
if [ -n "$ENCRYPTION_KEY" ]; then
    log "🔐 Encrypting backup..."
    ENCRYPTED_FILE="${BACKUP_FILE}.enc"
    if ! openssl enc -aes-256-cbc -salt -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" -k "$ENCRYPTION_KEY"; then
        log "❌ Backup encryption failed"
        exit 1
    fi
    rm "$BACKUP_FILE"
    BACKUP_FILE="$ENCRYPTED_FILE"
    log "✅ Backup encrypted"
fi

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    log "☁️ Uploading to S3..."
    S3_KEY="mongodb/$(basename "$BACKUP_FILE")"
    if ! aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$S3_KEY"; then
        log "❌ S3 upload failed"
        exit 1
    fi
    log "✅ Backup uploaded to s3://$S3_BUCKET/$S3_KEY"
    
    # Set lifecycle policy for automatic cleanup
    aws s3api put-object-tagging \
        --bucket "$S3_BUCKET" \
        --key "$S3_KEY" \
        --tagging "TagSet=[{Key=backup-type,Value=mongodb},{Key=retention-days,Value=$RETENTION_DAYS}]" \
        > /dev/null 2>&1 || log "⚠️ Failed to set S3 object tags"
fi

# Verify backup integrity
log "🔍 Verifying backup integrity..."
if [ "${BACKUP_FILE##*.}" = "enc" ]; then
    # Verify encrypted file can be decrypted
    if ! openssl enc -aes-256-cbc -d -in "$BACKUP_FILE" -k "$ENCRYPTION_KEY" | tar -tzf - > /dev/null 2>&1; then
        log "❌ Backup integrity verification failed (encrypted)"
        exit 1
    fi
else
    # Verify unencrypted tar file
    if ! tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
        log "❌ Backup integrity verification failed"
        exit 1
    fi
fi
log "✅ Backup integrity verified"

# Clean up old local backups
log "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
CLEANED=$(find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz*" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
if [ "$CLEANED" -gt 0 ]; then
    log "🗑️ Removed $CLEANED old backup files"
fi

# Generate backup report
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_REPORT="$BACKUP_DIR/backup_report_${DATE}.json"

cat > "$BACKUP_REPORT" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": "$DB_NAME",
    "backup_file": "$(basename "$BACKUP_FILE")",
    "size": "$BACKUP_SIZE",
    "encrypted": $([ "${BACKUP_FILE##*.}" = "enc" ] && echo "true" || echo "false"),
    "s3_uploaded": $([ -n "$S3_BUCKET" ] && echo "true" || echo "false"),
    "integrity_verified": true,
    "retention_days": $RETENTION_DAYS
}
EOF

log "📊 Backup report generated: $BACKUP_REPORT"

# Send notification (if configured)
if [ -n "$BACKUP_WEBHOOK_URL" ]; then
    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"MongoDB backup completed successfully\", \"database\": \"$DB_NAME\", \"size\": \"$BACKUP_SIZE\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        > /dev/null 2>&1 || log "⚠️ Failed to send notification"
fi

log "🎉 Backup completed successfully!"
log "📁 Backup file: $BACKUP_FILE"
log "📊 Backup size: $BACKUP_SIZE"
log "⏰ Duration: $(($(date +%s) - $(date -d "$(echo $DATE | sed 's/_/ /')" +%s))) seconds"

exit 0