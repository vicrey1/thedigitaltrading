#!/bin/bash

# Backup Scheduler for LuxHedge Production
# This script manages automated backup scheduling and execution

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
BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-daily}"  # daily, hourly, weekly
BACKUP_TIME="${BACKUP_TIME:-02:00}"          # Time for daily backups
WEBHOOK_URL="${BACKUP_WEBHOOK_URL}"
LOG_FILE="${BACKUP_BASE_DIR:-/tmp/backups}/scheduler.log"

# Function to log with timestamp
log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Function to send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    if [ -n "$WEBHOOK_URL" ]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\",\"type\":\"backup_scheduler\"}" \
            > /dev/null 2>&1 || true
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Backup Scheduler for LuxHedge Production"
    echo ""
    echo "Commands:"
    echo "  install                  Install backup cron jobs"
    echo "  uninstall               Remove backup cron jobs"
    echo "  status                  Show current backup schedule"
    echo "  run-now                 Execute backup immediately"
    echo "  test                    Test backup configuration"
    echo ""
    echo "Options:"
    echo "  --schedule SCHEDULE     Backup schedule: daily, hourly, weekly (default: daily)"
    echo "  --time TIME             Time for daily backups in HH:MM format (default: 02:00)"
    echo "  --dry-run               Show what would be done without executing"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  BACKUP_SCHEDULE         Backup frequency (daily, hourly, weekly)"
    echo "  BACKUP_TIME             Time for daily backups (HH:MM)"
    echo "  BACKUP_WEBHOOK_URL      Webhook URL for notifications"
    echo ""
    echo "Examples:"
    echo "  $0 install --schedule daily --time 03:00"
    echo "  $0 status"
    echo "  $0 run-now"
    echo "  $0 uninstall"
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log "⚠️ Running as root - cron jobs will be installed system-wide"
        return 0
    else
        log "ℹ️ Running as user - cron jobs will be installed for current user"
        return 1
    fi
}

# Function to get current cron jobs
get_current_cron() {
    crontab -l 2>/dev/null | grep -E "(backup-mongodb|backup-files|backup-scheduler)" || true
}

# Function to install cron jobs
install_cron_jobs() {
    local schedule="$1"
    local backup_time="$2"
    local dry_run="$3"
    
    log "📅 Installing backup cron jobs..."
    log "Schedule: $schedule"
    log "Time: $backup_time"
    
    # Parse time
    local hour=$(echo "$backup_time" | cut -d: -f1)
    local minute=$(echo "$backup_time" | cut -d: -f2)
    
    # Validate time format
    if ! [[ "$hour" =~ ^[0-9]{1,2}$ ]] || ! [[ "$minute" =~ ^[0-9]{1,2}$ ]]; then
        log "❌ Invalid time format: $backup_time (use HH:MM)"
        exit 1
    fi
    
    if [ "$hour" -gt 23 ] || [ "$minute" -gt 59 ]; then
        log "❌ Invalid time: $backup_time"
        exit 1
    fi
    
    # Create backup directory for logs
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Generate cron entries
    local mongodb_script="$SCRIPT_DIR/backup-mongodb.sh"
    local files_script="$SCRIPT_DIR/backup-files.sh"
    local cron_entries=""
    
    case "$schedule" in
        "hourly")
            # MongoDB backup every hour at minute 0
            cron_entries+="0 * * * * $mongodb_script >> $LOG_FILE 2>&1"$'\n'
            # File backup every 6 hours at minute 30
            cron_entries+="30 */6 * * * $files_script >> $LOG_FILE 2>&1"$'\n'
            ;;
        "daily")
            # MongoDB backup daily at specified time
            cron_entries+="$minute $hour * * * $mongodb_script >> $LOG_FILE 2>&1"$'\n'
            # File backup daily at specified time + 30 minutes
            local files_minute=$((minute + 30))
            local files_hour=$hour
            if [ $files_minute -ge 60 ]; then
                files_minute=$((files_minute - 60))
                files_hour=$((hour + 1))
                if [ $files_hour -ge 24 ]; then
                    files_hour=0
                fi
            fi
            cron_entries+="$files_minute $files_hour * * * $files_script >> $LOG_FILE 2>&1"$'\n'
            ;;
        "weekly")
            # MongoDB backup weekly on Sunday at specified time
            cron_entries+="$minute $hour * * 0 $mongodb_script >> $LOG_FILE 2>&1"$'\n'
            # File backup weekly on Sunday at specified time + 30 minutes
            local files_minute=$((minute + 30))
            local files_hour=$hour
            if [ $files_minute -ge 60 ]; then
                files_minute=$((files_minute - 60))
                files_hour=$((hour + 1))
                if [ $files_hour -ge 24 ]; then
                    files_hour=0
                fi
            fi
            cron_entries+="$files_minute $files_hour * * 0 $files_script >> $LOG_FILE 2>&1"$'\n'
            ;;
        *)
            log "❌ Invalid schedule: $schedule"
            exit 1
            ;;
    esac
    
    # Add log rotation (weekly)
    cron_entries+="0 1 * * 0 find $(dirname "$LOG_FILE") -name '*.log' -mtime +30 -delete 2>/dev/null || true"$'\n'
    
    if [ "$dry_run" = true ]; then
        log "🔍 DRY RUN - Would install these cron jobs:"
        echo "$cron_entries"
        return 0
    fi
    
    # Remove existing backup cron jobs
    local current_cron=$(crontab -l 2>/dev/null | grep -v -E "(backup-mongodb|backup-files|backup-scheduler)" || true)
    
    # Add new cron jobs
    local new_cron="$current_cron"$'\n'"$cron_entries"
    
    # Install new crontab
    echo "$new_cron" | crontab -
    
    log "✅ Cron jobs installed successfully"
    log "📋 Installed jobs:"
    echo "$cron_entries" | while read -r line; do
        if [ -n "$line" ]; then
            log "  $line"
        fi
    done
    
    send_notification "success" "Backup cron jobs installed with schedule: $schedule"
}

# Function to uninstall cron jobs
uninstall_cron_jobs() {
    local dry_run="$1"
    
    log "🗑️ Removing backup cron jobs..."
    
    local current_cron=$(get_current_cron)
    if [ -z "$current_cron" ]; then
        log "ℹ️ No backup cron jobs found"
        return 0
    fi
    
    if [ "$dry_run" = true ]; then
        log "🔍 DRY RUN - Would remove these cron jobs:"
        echo "$current_cron"
        return 0
    fi
    
    # Remove backup-related cron jobs
    local new_cron=$(crontab -l 2>/dev/null | grep -v -E "(backup-mongodb|backup-files|backup-scheduler)" || true)
    
    # Install updated crontab
    echo "$new_cron" | crontab -
    
    log "✅ Backup cron jobs removed successfully"
    send_notification "success" "Backup cron jobs uninstalled"
}

# Function to show current status
show_status() {
    log "📊 Backup Scheduler Status"
    echo ""
    
    # Check if cron service is running
    if systemctl is-active --quiet cron 2>/dev/null || systemctl is-active --quiet crond 2>/dev/null; then
        log "✅ Cron service is running"
    else
        log "❌ Cron service is not running"
    fi
    
    # Show current backup cron jobs
    local current_cron=$(get_current_cron)
    if [ -n "$current_cron" ]; then
        log "📅 Current backup cron jobs:"
        echo "$current_cron" | while read -r line; do
            log "  $line"
        done
    else
        log "ℹ️ No backup cron jobs installed"
    fi
    
    # Show recent backup activity
    if [ -f "$LOG_FILE" ]; then
        log "📋 Recent backup activity (last 10 entries):"
        tail -n 10 "$LOG_FILE" | while read -r line; do
            echo "  $line"
        done
    else
        log "ℹ️ No backup log file found"
    fi
    
    # Check backup scripts
    local mongodb_script="$SCRIPT_DIR/backup-mongodb.sh"
    local files_script="$SCRIPT_DIR/backup-files.sh"
    
    if [ -f "$mongodb_script" ] && [ -x "$mongodb_script" ]; then
        log "✅ MongoDB backup script is available and executable"
    else
        log "❌ MongoDB backup script is missing or not executable"
    fi
    
    if [ -f "$files_script" ] && [ -x "$files_script" ]; then
        log "✅ File backup script is available and executable"
    else
        log "❌ File backup script is missing or not executable"
    fi
}

# Function to run backup immediately
run_backup_now() {
    local backup_type="$1"
    
    log "🚀 Running backup immediately..."
    
    case "$backup_type" in
        "mongodb"|"database"|"db")
            log "📊 Running MongoDB backup..."
            bash "$SCRIPT_DIR/backup-mongodb.sh"
            ;;
        "files"|"file")
            log "📁 Running file backup..."
            bash "$SCRIPT_DIR/backup-files.sh"
            ;;
        "all"|"both"|"")
            log "📊 Running MongoDB backup..."
            bash "$SCRIPT_DIR/backup-mongodb.sh"
            log "📁 Running file backup..."
            bash "$SCRIPT_DIR/backup-files.sh"
            ;;
        *)
            log "❌ Invalid backup type: $backup_type"
            log "Valid types: mongodb, files, all"
            exit 1
            ;;
    esac
    
    log "✅ Backup completed"
}

# Function to test backup configuration
test_configuration() {
    log "🧪 Testing backup configuration..."
    
    # Check environment variables
    local missing_vars=()
    
    if [ -z "$MONGODB_URI" ]; then
        missing_vars+=("MONGODB_URI")
    fi
    
    if [ -z "$BACKUP_BASE_DIR" ]; then
        log "⚠️ BACKUP_BASE_DIR not set, using default: /tmp/backups"
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "❌ Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log "  - $var"
        done
        exit 1
    fi
    
    # Check script permissions
    local scripts=("backup-mongodb.sh" "backup-files.sh")
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        if [ ! -f "$script_path" ]; then
            log "❌ Script not found: $script_path"
            exit 1
        fi
        
        if [ ! -x "$script_path" ]; then
            log "⚠️ Script not executable: $script_path"
            chmod +x "$script_path"
            log "✅ Made script executable: $script_path"
        fi
    done
    
    # Test MongoDB connection
    if command -v mongosh > /dev/null || command -v mongo > /dev/null; then
        local mongo_cmd="mongosh"
        if ! command -v mongosh > /dev/null; then
            mongo_cmd="mongo"
        fi
        
        if $mongo_cmd "$MONGODB_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            log "✅ MongoDB connection test passed"
        else
            log "❌ MongoDB connection test failed"
            exit 1
        fi
    else
        log "⚠️ MongoDB client not found, skipping connection test"
    fi
    
    # Test backup directory
    local backup_dir="${BACKUP_BASE_DIR:-/tmp/backups}"
    if mkdir -p "$backup_dir" 2>/dev/null; then
        log "✅ Backup directory is writable: $backup_dir"
    else
        log "❌ Cannot create backup directory: $backup_dir"
        exit 1
    fi
    
    # Test S3 configuration (if configured)
    if [ -n "$BACKUP_S3_BUCKET" ]; then
        if command -v aws > /dev/null; then
            if aws s3 ls "s3://$BACKUP_S3_BUCKET" > /dev/null 2>&1; then
                log "✅ S3 bucket access test passed"
            else
                log "❌ S3 bucket access test failed"
                exit 1
            fi
        else
            log "⚠️ AWS CLI not found, skipping S3 test"
        fi
    else
        log "ℹ️ S3 backup not configured"
    fi
    
    log "✅ All configuration tests passed"
}

# Parse command line arguments
COMMAND=""
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        install|uninstall|status|run-now|test)
            COMMAND="$1"
            shift
            ;;
        --schedule)
            BACKUP_SCHEDULE="$2"
            shift 2
            ;;
        --time)
            BACKUP_TIME="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            # For run-now command, treat as backup type
            if [ "$COMMAND" = "run-now" ] && [ -z "$2" ]; then
                BACKUP_TYPE="$1"
                shift
            else
                echo "Unknown option: $1"
                usage
                exit 1
            fi
            ;;
    esac
done

# Validate command
if [ -z "$COMMAND" ]; then
    echo "❌ No command specified"
    usage
    exit 1
fi

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Execute command
case "$COMMAND" in
    "install")
        install_cron_jobs "$BACKUP_SCHEDULE" "$BACKUP_TIME" "$DRY_RUN"
        ;;
    "uninstall")
        uninstall_cron_jobs "$DRY_RUN"
        ;;
    "status")
        show_status
        ;;
    "run-now")
        run_backup_now "${BACKUP_TYPE:-all}"
        ;;
    "test")
        test_configuration
        ;;
    *)
        echo "❌ Invalid command: $COMMAND"
        usage
        exit 1
        ;;
esac

exit 0