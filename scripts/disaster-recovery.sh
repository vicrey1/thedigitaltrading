#!/bin/bash

# Disaster Recovery Script for LuxHedge Production
# This script automates the disaster recovery process

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
BACKUP_DIR="${BACKUP_BASE_DIR:-/tmp/backups}"
DB_NAME="${MONGO_DB_NAME:-luxhedge_production}"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017}"
S3_BUCKET="${BACKUP_S3_BUCKET}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY}"
WEBHOOK_URL="${BACKUP_WEBHOOK_URL}"
PROJECT_ROOT="${SCRIPT_DIR}/.."

# Recovery options
RECOVERY_DATE=""
RECOVERY_TYPE="full"  # full, database-only, files-only
DRY_RUN=false
FORCE_RECOVERY=false

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
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\",\"type\":\"disaster_recovery\"}" \
            > /dev/null 2>&1 || true
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Disaster Recovery Script for LuxHedge Production"
    echo ""
    echo "Options:"
    echo "  -d, --date DATE          Recovery date (YYYYMMDD_HHMMSS)"
    echo "  -t, --type TYPE          Recovery type: full, database-only, files-only (default: full)"
    echo "  -l, --list               List available recovery points"
    echo "  --dry-run                Show what would be recovered without actually doing it"
    echo "  --force                  Force recovery without confirmation prompts"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list                                    # List available recovery points"
    echo "  $0 --date 20240115_020000                   # Full recovery from specific date"
    echo "  $0 --date 20240115_020000 --type database-only  # Database only recovery"
    echo "  $0 --dry-run --date 20240115_020000         # Dry run recovery"
}

# Function to list available recovery points
list_recovery_points() {
    log "📋 Available Recovery Points:"
    echo ""
    
    # Check local backups
    log "💾 Local Backups:"
    if [ -d "$BACKUP_DIR" ]; then
        # MongoDB backups
        echo "  📊 Database Backups:"
        find "$BACKUP_DIR/mongodb" -name "mongodb_backup_*.tar.gz*" -type f 2>/dev/null | sort -r | head -10 | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(basename "$file" | sed 's/mongodb_backup_\(.*\)\.tar\.gz.*/\1/' | sed 's/_/ /')
            echo "    📁 $(basename "$file") ($size) - $date"
        done
        
        # File backups
        echo "  📁 File Backups:"
        find "$BACKUP_DIR/files" -name "files_backup_*.tar.gz*" -type f 2>/dev/null | sort -r | head -10 | while read -r file; do
            local size=$(du -h "$file" | cut -f1)
            local date=$(basename "$file" | sed 's/files_backup_\(.*\)\.tar\.gz.*/\1/' | sed 's/_/ /')
            echo "    📁 $(basename "$file") ($size) - $date"
        done
    else
        echo "  No local backup directory found"
    fi
    
    # Check S3 backups
    if [ -n "$S3_BUCKET" ] && command -v aws > /dev/null; then
        log "☁️ S3 Backups:"
        echo "  📊 Database Backups:"
        aws s3 ls "s3://$S3_BUCKET/mongodb/" --recursive 2>/dev/null | sort -r | head -10 | while read -r line; do
            echo "    📁 $line"
        done
        
        echo "  📁 File Backups:"
        aws s3 ls "s3://$S3_BUCKET/files/" --recursive 2>/dev/null | sort -r | head -10 | while read -r line; do
            echo "    📁 $line"
        done
    fi
    
    echo ""
    log "💡 Use --date YYYYMMDD_HHMMSS to recover from a specific backup"
}

# Function to check system prerequisites
check_prerequisites() {
    log "🔍 Checking system prerequisites..."
    
    local missing_deps=()
    
    # Check required commands
    if ! command -v mongosh > /dev/null && ! command -v mongo > /dev/null; then
        missing_deps+=("mongosh or mongo")
    fi
    
    if ! command -v mongorestore > /dev/null; then
        missing_deps+=("mongorestore")
    fi
    
    if ! command -v tar > /dev/null; then
        missing_deps+=("tar")
    fi
    
    if [ -n "$ENCRYPTION_KEY" ] && ! command -v openssl > /dev/null; then
        missing_deps+=("openssl")
    fi
    
    if [ -n "$S3_BUCKET" ] && ! command -v aws > /dev/null; then
        missing_deps+=("aws")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log "❌ Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            log "  - $dep"
        done
        exit 1
    fi
    
    log "✅ All prerequisites met"
}

# Function to check MongoDB connection
check_mongodb() {
    log "🔍 Checking MongoDB connection..."
    
    local mongo_cmd="mongosh"
    if ! command -v mongosh > /dev/null; then
        mongo_cmd="mongo"
    fi
    
    if ! $mongo_cmd "$MONGO_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "❌ Cannot connect to MongoDB at $MONGO_URI"
        return 1
    fi
    
    log "✅ MongoDB connection successful"
    return 0
}

# Function to stop application services
stop_services() {
    log "🛑 Stopping application services..."
    
    # Stop Docker containers if running
    if command -v docker > /dev/null; then
        cd "$PROJECT_ROOT"
        if [ -f "docker-compose.yml" ]; then
            docker-compose down > /dev/null 2>&1 || true
        fi
        if [ -f "docker-compose.prod.yml" ]; then
            docker-compose -f docker-compose.prod.yml down > /dev/null 2>&1 || true
        fi
    fi
    
    # Stop Node.js processes
    pkill -f "node.*server" > /dev/null 2>&1 || true
    
    log "✅ Services stopped"
}

# Function to start application services
start_services() {
    log "🚀 Starting application services..."
    
    cd "$PROJECT_ROOT"
    
    # Start with Docker if available
    if command -v docker > /dev/null && [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    elif command -v docker > /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose up -d
    else
        # Start manually
        cd server
        npm start > /dev/null 2>&1 &
    fi
    
    log "✅ Services started"
}

# Function to recover database
recover_database() {
    local recovery_date="$1"
    
    log "📊 Starting database recovery for date: $recovery_date"
    
    # Use the MongoDB restore script
    local restore_script="$SCRIPT_DIR/restore-mongodb.sh"
    if [ ! -f "$restore_script" ]; then
        log "❌ MongoDB restore script not found: $restore_script"
        exit 1
    fi
    
    if [ "$DRY_RUN" = true ]; then
        bash "$restore_script" --date "$recovery_date" --dry-run --drop-database
    else
        bash "$restore_script" --date "$recovery_date" --drop-database
    fi
    
    log "✅ Database recovery completed"
}

# Function to recover files
recover_files() {
    local recovery_date="$1"
    
    log "📁 Starting file recovery for date: $recovery_date"
    
    local backup_file=""
    local temp_files=""
    
    # Find backup file
    local local_backup="$BACKUP_DIR/files/files_backup_${recovery_date}.tar.gz"
    if [ -f "$local_backup" ]; then
        backup_file="$local_backup"
    elif [ -f "${local_backup}.enc" ]; then
        backup_file="${local_backup}.enc"
    elif [ -n "$S3_BUCKET" ]; then
        # Try to download from S3
        local s3_key="files/files_backup_${recovery_date}.tar.gz"
        local downloaded_file="$BACKUP_DIR/files/$(basename "$s3_key")"
        
        if aws s3 ls "s3://$S3_BUCKET/$s3_key" > /dev/null 2>&1; then
            aws s3 cp "s3://$S3_BUCKET/$s3_key" "$downloaded_file"
            backup_file="$downloaded_file"
            temp_files="$temp_files $downloaded_file"
        else
            s3_key="files/files_backup_${recovery_date}.tar.gz.enc"
            downloaded_file="$BACKUP_DIR/files/$(basename "$s3_key")"
            if aws s3 ls "s3://$S3_BUCKET/$s3_key" > /dev/null 2>&1; then
                aws s3 cp "s3://$S3_BUCKET/$s3_key" "$downloaded_file"
                backup_file="$downloaded_file"
                temp_files="$temp_files $downloaded_file"
            fi
        fi
    fi
    
    if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
        log "❌ File backup not found for date: $recovery_date"
        exit 1
    fi
    
    log "📁 Using backup file: $backup_file"
    
    if [ "$DRY_RUN" = true ]; then
        log "🔍 DRY RUN - Would restore files from: $backup_file"
        return 0
    fi
    
    # Decrypt if needed
    local restore_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        log "🔓 Decrypting backup..."
        restore_file="${backup_file%.enc}"
        if ! openssl enc -aes-256-cbc -d -in "$backup_file" -out "$restore_file" -k "$ENCRYPTION_KEY"; then
            log "❌ Failed to decrypt backup"
            exit 1
        fi
        temp_files="$temp_files $restore_file"
    fi
    
    # Create backup of current files
    local current_backup="$PROJECT_ROOT/current_backup_$(date +%s).tar.gz"
    log "💾 Creating backup of current files..."
    cd "$PROJECT_ROOT"
    tar -czf "$current_backup" server/uploads server/public 2>/dev/null || true
    
    # Extract and restore files
    log "📦 Extracting and restoring files..."
    if ! tar -xzf "$restore_file" -C "$PROJECT_ROOT" --overwrite; then
        log "❌ Failed to extract files"
        exit 1
    fi
    
    # Cleanup temporary files
    for file in $temp_files; do
        rm -f "$file"
    done
    
    log "✅ File recovery completed"
    log "💾 Current files backed up to: $current_backup"
}

# Function to perform health check
health_check() {
    log "🏥 Performing post-recovery health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check if MongoDB is accessible
    if ! check_mongodb; then
        log "❌ MongoDB health check failed"
        return 1
    fi
    
    # Check if application is responding
    local app_port="${PORT:-3000}"
    if command -v curl > /dev/null; then
        if curl -s "http://localhost:$app_port/api/health" > /dev/null 2>&1; then
            log "✅ Application health check passed"
        else
            log "⚠️ Application health check failed (may still be starting)"
        fi
    fi
    
    log "✅ Health check completed"
}

# Function to generate recovery report
generate_recovery_report() {
    local recovery_date="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    cat << EOF

📊 DISASTER RECOVERY REPORT
===========================
Recovery Date: $recovery_date
Recovery Type: $RECOVERY_TYPE
Duration: ${duration}s
Dry Run: $DRY_RUN
Status: ✅ SUCCESS

Recovery Components:
$([ "$RECOVERY_TYPE" = "full" ] || [ "$RECOVERY_TYPE" = "database-only" ] && echo "  ✅ Database restored")
$([ "$RECOVERY_TYPE" = "full" ] || [ "$RECOVERY_TYPE" = "files-only" ] && echo "  ✅ Files restored")

Next Steps:
1. Verify application functionality
2. Check data integrity
3. Monitor system performance
4. Update DNS/load balancer if needed

EOF
}

# Main recovery function
perform_recovery() {
    local recovery_date="$1"
    local start_time=$(date +%s)
    
    log "🚨 Starting disaster recovery for date: $recovery_date"
    log "🔧 Recovery type: $RECOVERY_TYPE"
    
    send_notification "started" "Disaster recovery started for $recovery_date"
    
    # Confirmation prompt
    if [ "$FORCE_RECOVERY" != true ] && [ "$DRY_RUN" != true ]; then
        echo ""
        echo "⚠️  WARNING: This will perform a disaster recovery operation"
        echo "⚠️  This may overwrite current data and configurations"
        echo "⚠️  Recovery date: $recovery_date"
        echo "⚠️  Recovery type: $RECOVERY_TYPE"
        echo ""
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm
        if [ "$confirm" != "yes" ]; then
            log "❌ Recovery cancelled by user"
            exit 1
        fi
    fi
    
    # Stop services
    if [ "$DRY_RUN" != true ]; then
        stop_services
    fi
    
    # Perform recovery based on type
    case "$RECOVERY_TYPE" in
        "full")
            recover_database "$recovery_date"
            recover_files "$recovery_date"
            ;;
        "database-only")
            recover_database "$recovery_date"
            ;;
        "files-only")
            recover_files "$recovery_date"
            ;;
        *)
            log "❌ Invalid recovery type: $RECOVERY_TYPE"
            exit 1
            ;;
    esac
    
    # Start services
    if [ "$DRY_RUN" != true ]; then
        start_services
        health_check
    fi
    
    # Generate report
    generate_recovery_report "$recovery_date" "$start_time"
    
    send_notification "success" "Disaster recovery completed successfully"
    log "🎉 Disaster recovery completed successfully!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--date)
            RECOVERY_DATE="$2"
            shift 2
            ;;
        -t|--type)
            RECOVERY_TYPE="$2"
            shift 2
            ;;
        -l|--list)
            list_recovery_points
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE_RECOVERY=true
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

# Validate recovery type
case "$RECOVERY_TYPE" in
    "full"|"database-only"|"files-only")
        ;;
    *)
        echo "❌ Invalid recovery type: $RECOVERY_TYPE"
        echo "Valid types: full, database-only, files-only"
        exit 1
        ;;
esac

# Check if recovery date is provided
if [ -z "$RECOVERY_DATE" ]; then
    echo "❌ Recovery date not specified"
    usage
    exit 1
fi

# Validate date format
if ! [[ "$RECOVERY_DATE" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
    echo "❌ Invalid date format. Use YYYYMMDD_HHMMSS"
    exit 1
fi

# Check prerequisites
check_prerequisites

# Perform recovery
perform_recovery "$RECOVERY_DATE"

exit 0