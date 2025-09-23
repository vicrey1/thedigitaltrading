#!/bin/bash

# File Backup Script for LuxHedge Production
# This script backs up application files, uploads, and configurations

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

# Default configuration
BACKUP_DIR="${BACKUP_BASE_DIR:-/tmp/backups}/files"
PROJECT_ROOT="${SCRIPT_DIR}/.."
S3_BUCKET="${BACKUP_S3_BUCKET}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"
WEBHOOK_URL="${BACKUP_WEBHOOK_URL}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Backup timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="files_backup_${TIMESTAMP}"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\",\"type\":\"file_backup\"}" \
            > /dev/null 2>&1 || true
    fi
}

# Function to calculate directory size
get_dir_size() {
    local dir="$1"
    if [ -d "$dir" ]; then
        du -sh "$dir" 2>/dev/null | cut -f1 || echo "0B"
    else
        echo "0B"
    fi
}

# Function to create backup
create_backup() {
    local backup_file="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    
    log "📦 Creating file backup..."
    mkdir -p "$BACKUP_DIR"
    
    # Create temporary exclude file
    local exclude_file=$(mktemp)
    cat > "$exclude_file" << EOF
node_modules
.git
.env*
*.log
*.tmp
.DS_Store
Thumbs.db
coverage
.nyc_output
dist
build
.cache
.vscode
.idea
*.swp
*.swo
*~
EOF
    
    # Define directories to backup
    local backup_paths=(
        "server/uploads"
        "server/public"
        "server/config"
        "server/scripts"
        "server/middleware"
        "server/models"
        "server/routes"
        "server/utils"
        "server/package.json"
        "server/package-lock.json"
        "client/src"
        "client/public"
        "client/package.json"
        "client/package-lock.json"
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "Dockerfile"
        "nginx.conf"
        "README.md"
    )
    
    # Log what we're backing up
    log "📁 Backup contents:"
    local total_size=0
    for path in "${backup_paths[@]}"; do
        if [ -e "$PROJECT_ROOT/$path" ]; then
            local size=$(get_dir_size "$PROJECT_ROOT/$path")
            log "  ✓ $path ($size)"
        else
            log "  ⚠ $path (not found)"
        fi
    done
    
    # Create the backup
    cd "$PROJECT_ROOT"
    if ! tar -czf "$backup_file" --exclude-from="$exclude_file" "${backup_paths[@]}" 2>/dev/null; then
        log "❌ Failed to create backup archive"
        rm -f "$exclude_file"
        exit 1
    fi
    
    rm -f "$exclude_file"
    
    # Verify backup was created
    if [ ! -f "$backup_file" ]; then
        log "❌ Backup file was not created"
        exit 1
    fi
    
    local backup_size=$(du -h "$backup_file" | cut -f1)
    log "✅ Backup created: $(basename "$backup_file") ($backup_size)"
    
    echo "$backup_file"
}

# Function to encrypt backup
encrypt_backup() {
    local backup_file="$1"
    local encrypted_file="${backup_file}.enc"
    
    if [ -n "$ENCRYPTION_KEY" ]; then
        log "🔒 Encrypting backup..."
        if ! openssl enc -aes-256-cbc -salt -in "$backup_file" -out "$encrypted_file" -k "$ENCRYPTION_KEY"; then
            log "❌ Failed to encrypt backup"
            exit 1
        fi
        
        # Remove unencrypted file
        rm -f "$backup_file"
        log "✅ Backup encrypted: $(basename "$encrypted_file")"
        echo "$encrypted_file"
    else
        log "⚠️ No encryption key provided, backup will be stored unencrypted"
        echo "$backup_file"
    fi
}

# Function to upload to S3
upload_to_s3() {
    local backup_file="$1"
    local s3_key="files/$(basename "$backup_file")"
    
    if [ -n "$S3_BUCKET" ]; then
        log "☁️ Uploading to S3..."
        if ! aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" --storage-class STANDARD_IA; then
            log "❌ Failed to upload to S3"
            exit 1
        fi
        
        log "✅ Uploaded to S3: s3://$S3_BUCKET/$s3_key"
        
        # Verify upload
        if ! aws s3 ls "s3://$S3_BUCKET/$s3_key" > /dev/null; then
            log "❌ S3 upload verification failed"
            exit 1
        fi
        
        log "✅ S3 upload verified"
    else
        log "⚠️ No S3 bucket configured, skipping cloud upload"
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "🔍 Verifying backup integrity..."
    
    # Check if file exists and is not empty
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log "❌ Backup file is missing or empty"
        exit 1
    fi
    
    # For encrypted files, we can't easily verify content without decrypting
    if [[ "$backup_file" == *.enc ]]; then
        log "✅ Encrypted backup file exists and has content"
    else
        # For unencrypted files, test the archive
        if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
            log "❌ Backup archive is corrupted"
            exit 1
        fi
        log "✅ Backup archive integrity verified"
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # Local cleanup
    if [ -d "$BACKUP_DIR" ]; then
        local deleted_count=0
        find "$BACKUP_DIR" -name "files_backup_*.tar.gz*" -type f -mtime +$RETENTION_DAYS | while read -r old_file; do
            rm -f "$old_file"
            log "🗑️ Deleted old backup: $(basename "$old_file")"
            ((deleted_count++))
        done
        
        if [ $deleted_count -eq 0 ]; then
            log "✅ No old local backups to clean up"
        else
            log "✅ Cleaned up $deleted_count old local backups"
        fi
    fi
    
    # S3 cleanup (if configured)
    if [ -n "$S3_BUCKET" ]; then
        log "☁️ Cleaning up old S3 backups..."
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
        
        aws s3 ls "s3://$S3_BUCKET/files/" | while read -r line; do
            local file_date=$(echo "$line" | grep -o 'files_backup_[0-9]\{8\}_[0-9]\{6\}' | grep -o '[0-9]\{8\}' || echo "")
            if [ -n "$file_date" ] && [ "$file_date" -lt "$cutoff_date" ]; then
                local file_name=$(echo "$line" | awk '{print $4}')
                aws s3 rm "s3://$S3_BUCKET/files/$file_name"
                log "🗑️ Deleted old S3 backup: $file_name"
            fi
        done
    fi
}

# Function to generate backup report
generate_report() {
    local backup_file="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local backup_size=$(du -h "$backup_file" | cut -f1)
    
    cat << EOF

📊 BACKUP REPORT
================
Backup Type: File Backup
Timestamp: $TIMESTAMP
Duration: ${duration}s
Backup Size: $backup_size
Local Path: $backup_file
S3 Bucket: ${S3_BUCKET:-"Not configured"}
Encryption: $([ -n "$ENCRYPTION_KEY" ] && echo "Enabled" || echo "Disabled")
Status: ✅ SUCCESS

EOF
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    log "🚀 Starting file backup at $(date)"
    send_notification "started" "File backup started"
    
    # Check dependencies
    if ! command -v tar > /dev/null; then
        log "❌ tar command not found"
        exit 1
    fi
    
    if [ -n "$ENCRYPTION_KEY" ] && ! command -v openssl > /dev/null; then
        log "❌ openssl command not found (required for encryption)"
        exit 1
    fi
    
    if [ -n "$S3_BUCKET" ] && ! command -v aws > /dev/null; then
        log "❌ aws command not found (required for S3 upload)"
        exit 1
    fi
    
    # Create backup
    local backup_file=$(create_backup)
    
    # Encrypt backup
    backup_file=$(encrypt_backup "$backup_file")
    
    # Verify backup
    verify_backup "$backup_file"
    
    # Upload to S3
    upload_to_s3 "$backup_file"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Generate report
    generate_report "$backup_file" "$start_time"
    
    send_notification "success" "File backup completed successfully"
    log "🎉 File backup completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--help]"
        echo ""
        echo "File backup script for LuxHedge production environment"
        echo ""
        echo "Environment variables:"
        echo "  BACKUP_BASE_DIR       Base directory for backups (default: /tmp/backups)"
        echo "  BACKUP_S3_BUCKET      S3 bucket for cloud storage"
        echo "  BACKUP_ENCRYPTION_KEY Key for backup encryption"
        echo "  BACKUP_WEBHOOK_URL    Webhook URL for notifications"
        echo "  BACKUP_RETENTION_DAYS Days to keep backups (default: 30)"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac