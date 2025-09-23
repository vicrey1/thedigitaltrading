# LuxHedge Backup and Disaster Recovery Scripts

This directory contains comprehensive backup and disaster recovery scripts for the LuxHedge production environment.

## Scripts Overview

### 1. `backup-mongodb.sh`
**Purpose**: Automated MongoDB database backup with encryption and cloud storage.

**Features**:
- Compressed MongoDB dumps using `mongodump`
- AES-256-CBC encryption for security
- Automatic upload to AWS S3
- Integrity verification with checksums
- Configurable retention policies
- Webhook notifications
- Detailed logging and error handling

**Usage**:
```bash
# Basic backup
./backup-mongodb.sh

# Help and options
./backup-mongodb.sh --help
```

### 2. `restore-mongodb.sh`
**Purpose**: MongoDB database restoration from encrypted backups.

**Features**:
- Restore from local or S3 backups
- Automatic decryption of encrypted backups
- Support for specific date restoration
- Dry-run mode for testing
- Database verification after restore
- Safety prompts for destructive operations

**Usage**:
```bash
# List available backups
./restore-mongodb.sh --list

# Restore from specific date
./restore-mongodb.sh --date 20240115_020000

# Dry run
./restore-mongodb.sh --date 20240115_020000 --dry-run

# Force restore with database drop
./restore-mongodb.sh --date 20240115_020000 --drop-database
```

### 3. `backup-files.sh`
**Purpose**: Application files and uploads backup.

**Features**:
- Backup of application code, uploads, and configurations
- Excludes unnecessary files (node_modules, logs, etc.)
- Compression and optional encryption
- S3 cloud storage integration
- Automatic cleanup of old backups
- Size reporting and verification

**Usage**:
```bash
# Run file backup
./backup-files.sh

# Help
./backup-files.sh --help
```

### 4. `disaster-recovery.sh`
**Purpose**: Complete disaster recovery orchestration.

**Features**:
- Full system recovery (database + files)
- Selective recovery (database-only or files-only)
- Service management (stop/start)
- Health checks post-recovery
- Recovery point listing
- Comprehensive reporting

**Usage**:
```bash
# List available recovery points
./disaster-recovery.sh --list

# Full recovery
./disaster-recovery.sh --date 20240115_020000

# Database only recovery
./disaster-recovery.sh --date 20240115_020000 --type database-only

# Files only recovery
./disaster-recovery.sh --date 20240115_020000 --type files-only

# Dry run
./disaster-recovery.sh --date 20240115_020000 --dry-run
```

### 5. `backup-scheduler.sh`
**Purpose**: Automated backup scheduling and management.

**Features**:
- Cron job installation and management
- Multiple schedule options (hourly, daily, weekly)
- Configuration testing
- Status monitoring
- Manual backup execution
- Log rotation

**Usage**:
```bash
# Install daily backups at 2:00 AM
./backup-scheduler.sh install --schedule daily --time 02:00

# Check current status
./backup-scheduler.sh status

# Run backup immediately
./backup-scheduler.sh run-now

# Test configuration
./backup-scheduler.sh test

# Uninstall scheduled backups
./backup-scheduler.sh uninstall
```

## Environment Configuration

All scripts use environment variables from `../server/.env`. Required variables:

### Database Configuration
```bash
MONGODB_URI=mongodb://localhost:27017
MONGO_DB_NAME=luxhedge_production
```

### Backup Configuration
```bash
BACKUP_BASE_DIR=/var/backups/luxhedge
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION_KEY=your-encryption-key-here
```

### AWS S3 Configuration (Optional)
```bash
BACKUP_S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
```

### Notification Configuration (Optional)
```bash
BACKUP_WEBHOOK_URL=https://your-webhook-url.com/notify
```

### Scheduling Configuration
```bash
BACKUP_SCHEDULE=daily
BACKUP_TIME=02:00
```

## Prerequisites

### Required Tools
- `mongodump` and `mongorestore` (MongoDB tools)
- `tar` and `gzip` (compression)
- `openssl` (encryption, if enabled)
- `aws` CLI (for S3 integration, if enabled)
- `curl` (for webhook notifications, if enabled)
- `cron` service (for scheduling)

### Installation on Ubuntu/Debian
```bash
# MongoDB tools
sudo apt-get install mongodb-database-tools

# AWS CLI
sudo apt-get install awscli

# Other tools (usually pre-installed)
sudo apt-get install tar gzip openssl curl cron
```

### Installation on CentOS/RHEL
```bash
# MongoDB tools
sudo yum install mongodb-database-tools

# AWS CLI
sudo yum install awscli

# Other tools
sudo yum install tar gzip openssl curl cronie
```

## Security Considerations

### File Permissions
```bash
# Make scripts executable (Linux/macOS)
chmod +x scripts/*.sh

# Secure environment file
chmod 600 server/.env
```

### Encryption
- All backups can be encrypted using AES-256-CBC
- Store encryption keys securely (consider using a key management service)
- Never commit encryption keys to version control

### Access Control
- Limit access to backup directories
- Use IAM roles for S3 access instead of access keys when possible
- Regularly rotate access credentials

## Backup Strategy

### Recommended Schedule
- **MongoDB**: Daily at 2:00 AM
- **Files**: Daily at 2:30 AM
- **Retention**: 30 days local, 90 days in S3

### Recovery Time Objectives (RTO)
- **Database Recovery**: < 30 minutes
- **File Recovery**: < 15 minutes
- **Full System Recovery**: < 1 hour

### Recovery Point Objectives (RPO)
- **Maximum Data Loss**: 24 hours (daily backups)
- **Critical Data**: Consider hourly backups for high-frequency trading data

## Monitoring and Alerting

### Log Files
- Backup logs: `$BACKUP_BASE_DIR/scheduler.log`
- Individual script logs: Console output with timestamps
- Error logs: Captured in webhook notifications

### Health Checks
- Backup completion status
- File integrity verification
- S3 upload confirmation
- Database connectivity tests

### Notifications
Configure webhook notifications to receive alerts for:
- Backup completion/failure
- Recovery operations
- Configuration issues
- Storage space warnings

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   # Fix script permissions
   chmod +x scripts/*.sh
   
   # Fix backup directory permissions
   sudo chown -R $USER:$USER $BACKUP_BASE_DIR
   ```

2. **MongoDB Connection Failed**
   ```bash
   # Test connection
   mongosh $MONGODB_URI --eval "db.adminCommand('ping')"
   
   # Check MongoDB service
   sudo systemctl status mongod
   ```

3. **S3 Upload Failed**
   ```bash
   # Test AWS credentials
   aws s3 ls s3://your-backup-bucket
   
   # Check AWS configuration
   aws configure list
   ```

4. **Encryption/Decryption Failed**
   ```bash
   # Verify encryption key
   echo "test" | openssl enc -aes-256-cbc -k "$BACKUP_ENCRYPTION_KEY" | openssl enc -aes-256-cbc -d -k "$BACKUP_ENCRYPTION_KEY"
   ```

### Log Analysis
```bash
# View recent backup activity
tail -f $BACKUP_BASE_DIR/scheduler.log

# Check for errors
grep -i error $BACKUP_BASE_DIR/scheduler.log

# Monitor backup sizes
ls -lh $BACKUP_BASE_DIR/mongodb/
ls -lh $BACKUP_BASE_DIR/files/
```

## Testing

### Test Backup Configuration
```bash
./backup-scheduler.sh test
```

### Test Recovery Process
```bash
# Dry run recovery
./disaster-recovery.sh --date YYYYMMDD_HHMMSS --dry-run

# Test in staging environment
./disaster-recovery.sh --date YYYYMMDD_HHMMSS --type database-only
```

### Verify Backup Integrity
```bash
# List and verify backups
./restore-mongodb.sh --list
./disaster-recovery.sh --list
```

## Compliance and Auditing

### Backup Verification
- Regular restore testing (monthly recommended)
- Integrity checks on all backups
- Documentation of recovery procedures

### Data Retention
- Comply with regulatory requirements
- Implement proper data lifecycle management
- Secure deletion of expired backups

### Audit Trail
- All backup and recovery operations are logged
- Webhook notifications provide audit trail
- Regular review of backup success rates

## Support and Maintenance

### Regular Tasks
- Monitor backup success rates
- Test recovery procedures monthly
- Update retention policies as needed
- Review and rotate encryption keys quarterly

### Capacity Planning
- Monitor backup storage growth
- Plan for increased backup frequency if needed
- Consider backup compression optimization

### Updates and Patches
- Keep MongoDB tools updated
- Update AWS CLI regularly
- Review and update scripts as needed

For additional support or questions, refer to the main project documentation or contact the development team.