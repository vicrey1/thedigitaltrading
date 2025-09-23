#!/bin/bash

# MongoDB Restore Script for LuxHedge Production
# This script restores MongoDB from encrypted backups

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
BACKUP_DIR="${BACKUP_BASE_DIR:-/tmp/backups}/mongodb"
DB_NAME="${MONGO_DB_NAME:-luxhedge_production}"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
S3_BUCKET="${BACKUP_S3_BUCKET}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -f, --file FILE          Restore from local backup file"
    echo "  -s, --s3-key KEY         Restore from S3 backup key"
    echo "  -d, --date DATE          Restore from backup date (YYYYMMDD_HHMMSS)"
    echo "  -l, --list               List available backups"
    echo "  --dry-run                Show what would be restored without actually doing it"
    echo "  --drop-database          Drop existing database before restore (DANGEROUS)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list                                    # List available backups"
    echo "  $0 --date 20240115_020000                   # Restore from specific date"
    echo "  $0 --file /path/to/backup.tar.gz.enc       # Restore from local file"
    echo "  $0 --s3-key mongodb/backup_20240115.tar.gz # Restore from S3"
}

# Function to list available backups
list_backups() {
    log "📋 Available local backups:"
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz*" -type f | sort -r | head -10 | while read -r file; do
            size=$(du -h "$file" | cut -f1)
            date=$(basename "$file" | sed 's/mongodb_backup_\(.*\)\.tar\.gz.*/\1/' | sed 's/_/ /')
            echo "  📁 $(basename "$file") ($size) - $date"
        done
    else
        echo "  No local backup directory found"
    fi
    
    if [ -n "$S3_BUCKET" ]; then
        log "☁️ Available S3 backups (last 10):"
        aws s3 ls "s3://$S3_BUCKET/mongodb/" --recursive | sort -r | head -10 | while read -r line; do
            echo "  📁 $line"
        done
    fi
}

# Function to download from S3
download_from_s3() {
    local s3_key="$1"
    local local_file="$BACKUP_DIR/$(basename "$s3_key")"
    
    log "☁️ Downloading from S3: $s3_key"
    if ! aws s3 cp "s3://$S3_BUCKET/$s3_key" "$local_file"; then
        log "❌ Failed to download from S3"
        exit 1
    fi
    echo "$local_file"
}

# Function to decrypt backup
decrypt_backup() {
    local encrypted_file="$1"
    local decrypted_file="${encrypted_file%.enc}"
    
    if [ "${encrypted_file##*.}" = "enc" ]; then
        log "🔓 Decrypting backup..."
        if [ -z "$ENCRYPTION_KEY" ]; then
            log "❌ Encryption key not provided"
            exit 1
        fi
        
        if ! openssl enc -aes-256-cbc -d -in "$encrypted_file" -out "$decrypted_file" -k "$ENCRYPTION_KEY"; then
            log "❌ Failed to decrypt backup"
            exit 1
        fi
        echo "$decrypted_file"
    else
        echo "$encrypted_file"
    fi
}

# Function to extract backup
extract_backup() {
    local backup_file="$1"
    local extract_dir="$BACKUP_DIR/restore_$(date +%s)"
    
    log "📦 Extracting backup..."
    mkdir -p "$extract_dir"
    
    if ! tar -xzf "$backup_file" -C "$extract_dir"; then
        log "❌ Failed to extract backup"
        rm -rf "$extract_dir"
        exit 1
    fi
    
    echo "$extract_dir"
}

# Function to perform restore
perform_restore() {
    local extract_dir="$1"
    local db_path="$extract_dir/$DB_NAME"
    
    if [ ! -d "$db_path" ]; then
        log "❌ Database directory not found in backup: $db_path"
        exit 1
    fi
    
    log "🔍 Checking MongoDB connection..."
    if ! mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "❌ Cannot connect to MongoDB at $MONGO_URI"
        exit 1
    fi
    
    if [ "$DROP_DATABASE" = "true" ]; then
        log "⚠️ Dropping existing database: $DB_NAME"
        mongosh "$MONGO_URI" --eval "db.getSiblingDB('$DB_NAME').dropDatabase()" > /dev/null
    fi
    
    log "🔄 Restoring database: $DB_NAME"
    if ! mongorestore --uri="$MONGO_URI" --db="$DB_NAME" "$db_path" --drop; then
        log "❌ Database restore failed"
        exit 1
    fi
    
    log "✅ Database restore completed"
}

# Function to verify restore
verify_restore() {
    log "🔍 Verifying restore..."
    
    # Check if database exists and has collections
    collections=$(mongosh "$MONGO_URI" --eval "db.getSiblingDB('$DB_NAME').getCollectionNames().length" --quiet)
    
    if [ "$collections" -gt 0 ]; then
        log "✅ Restore verification successful ($collections collections found)"
    else
        log "❌ Restore verification failed (no collections found)"
        exit 1
    fi
}

# Function to cleanup temporary files
cleanup() {
    if [ -n "$TEMP_FILES" ]; then
        for file in $TEMP_FILES; do
            if [ -f "$file" ] || [ -d "$file" ]; then
                rm -rf "$file"
                log "🧹 Cleaned up: $file"
            fi
        done
    fi
}
trap cleanup EXIT

# Parse command line arguments
BACKUP_FILE=""
S3_KEY=""
BACKUP_DATE=""
LIST_ONLY=false
DRY_RUN=false
DROP_DATABASE=false
TEMP_FILES=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -s|--s3-key)
            S3_KEY="$2"
            shift 2
            ;;
        -d|--date)
            BACKUP_DATE="$2"
            shift 2
            ;;
        -l|--list)
            LIST_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --drop-database)
            DROP_DATABASE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Handle list option
if [ "$LIST_ONLY" = true ]; then
    list_backups
    exit 0
fi

# Validate input
if [ -z "$BACKUP_FILE" ] && [ -z "$S3_KEY" ] && [ -z "$BACKUP_DATE" ]; then
    echo "❌ No backup source specified"
    usage
    exit 1
fi

log "🚀 Starting MongoDB restore for $DB_NAME at $(date)"

# Determine backup file
if [ -n "$BACKUP_FILE" ]; then
    if [ ! -f "$BACKUP_FILE" ]; then
        log "❌ Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    RESTORE_FILE="$BACKUP_FILE"
elif [ -n "$S3_KEY" ]; then
    RESTORE_FILE=$(download_from_s3 "$S3_KEY")
    TEMP_FILES="$TEMP_FILES $RESTORE_FILE"
elif [ -n "$BACKUP_DATE" ]; then
    # Look for local backup first
    RESTORE_FILE="$BACKUP_DIR/mongodb_backup_${BACKUP_DATE}.tar.gz"
    if [ ! -f "$RESTORE_FILE" ]; then
        RESTORE_FILE="$BACKUP_DIR/mongodb_backup_${BACKUP_DATE}.tar.gz.enc"
    fi
    
    if [ ! -f "$RESTORE_FILE" ] && [ -n "$S3_BUCKET" ]; then
        # Try to download from S3
        S3_KEY="mongodb/mongodb_backup_${BACKUP_DATE}.tar.gz"
        if aws s3 ls "s3://$S3_BUCKET/$S3_KEY" > /dev/null 2>&1; then
            RESTORE_FILE=$(download_from_s3 "$S3_KEY")
            TEMP_FILES="$TEMP_FILES $RESTORE_FILE"
        else
            S3_KEY="mongodb/mongodb_backup_${BACKUP_DATE}.tar.gz.enc"
            if aws s3 ls "s3://$S3_BUCKET/$S3_KEY" > /dev/null 2>&1; then
                RESTORE_FILE=$(download_from_s3 "$S3_KEY")
                TEMP_FILES="$TEMP_FILES $RESTORE_FILE"
            fi
        fi
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
        log "❌ Backup not found for date: $BACKUP_DATE"
        exit 1
    fi
fi

log "📁 Using backup file: $RESTORE_FILE"

if [ "$DRY_RUN" = true ]; then
    log "🔍 DRY RUN - Would restore from: $RESTORE_FILE"
    log "🔍 Target database: $DB_NAME"
    log "🔍 MongoDB URI: $MONGO_URI"
    log "🔍 Drop database: $DROP_DATABASE"
    exit 0
fi

# Confirm destructive operation
if [ "$DROP_DATABASE" = true ]; then
    echo "⚠️  WARNING: This will DROP the existing database '$DB_NAME'"
    echo "⚠️  This action is IRREVERSIBLE!"
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
    if [ "$confirm" != "yes" ]; then
        log "❌ Restore cancelled by user"
        exit 1
    fi
fi

# Decrypt if needed
DECRYPTED_FILE=$(decrypt_backup "$RESTORE_FILE")
if [ "$DECRYPTED_FILE" != "$RESTORE_FILE" ]; then
    TEMP_FILES="$TEMP_FILES $DECRYPTED_FILE"
fi

# Extract backup
EXTRACT_DIR=$(extract_backup "$DECRYPTED_FILE")
TEMP_FILES="$TEMP_FILES $EXTRACT_DIR"

# Perform restore
perform_restore "$EXTRACT_DIR"

# Verify restore
verify_restore

log "🎉 Restore completed successfully!"
log "📊 Database: $DB_NAME"
log "📁 Restored from: $(basename "$RESTORE_FILE")"
log "⏰ Duration: $(($(date +%s) - $(date -d "$(echo $BACKUP_DATE | sed 's/_/ /')" +%s 2>/dev/null || echo 0))) seconds"

exit 0