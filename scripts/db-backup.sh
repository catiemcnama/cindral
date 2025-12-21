#!/bin/bash
# =============================================================================
# Database Backup Script
# Creates timestamped pg_dump backups with optional S3 upload
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
S3_BUCKET="${S3_BUCKET:-}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
  if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Install PostgreSQL client tools."
    exit 1
  fi

  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable not set."
    log_info "Set it via: export DATABASE_URL=postgresql://user:pass@host:5432/db"
    exit 1
  fi
}

# Create backup directory
setup_backup_dir() {
  mkdir -p "$BACKUP_DIR"
  log_info "Backup directory: $BACKUP_DIR"
}

# Generate backup filename
get_backup_filename() {
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local db_name=$(echo "$DATABASE_URL" | sed -E 's/.*\/([^?]+).*/\1/')
  echo "cindral_${db_name}_${timestamp}.sql.gz"
}

# Create backup
create_backup() {
  local filename="$1"
  local filepath="${BACKUP_DIR}/${filename}"
  
  log_info "Starting backup: $filename"
  
  # Parse DATABASE_URL for pg_dump
  # Format: postgresql://user:pass@host:port/database
  pg_dump "$DATABASE_URL" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip > "$filepath"
  
  local size=$(du -h "$filepath" | cut -f1)
  log_info "Backup created: $filepath ($size)"
  
  echo "$filepath"
}

# Upload to S3 (optional)
upload_to_s3() {
  local filepath="$1"
  local filename=$(basename "$filepath")
  
  if [ -z "$S3_BUCKET" ]; then
    log_info "S3_BUCKET not set, skipping upload"
    return 0
  fi
  
  if ! command -v aws &> /dev/null; then
    log_warn "AWS CLI not found, skipping S3 upload"
    return 0
  fi
  
  log_info "Uploading to S3: s3://${S3_BUCKET}/backups/${filename}"
  aws s3 cp "$filepath" "s3://${S3_BUCKET}/backups/${filename}" --quiet
  log_info "S3 upload complete"
}

# Cleanup old backups
cleanup_old_backups() {
  log_info "Cleaning up backups older than $RETENTION_DAYS days"
  
  # Local cleanup
  find "$BACKUP_DIR" -name "cindral_*.sql.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
  
  # S3 cleanup (if configured)
  if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
    # List and delete old S3 objects
    local cutoff_date=$(date -v-${RETENTION_DAYS}d +"%Y-%m-%d" 2>/dev/null || date -d "-${RETENTION_DAYS} days" +"%Y-%m-%d")
    aws s3 ls "s3://${S3_BUCKET}/backups/" 2>/dev/null | while read -r line; do
      local file_date=$(echo "$line" | awk '{print $1}')
      local file_name=$(echo "$line" | awk '{print $4}')
      if [[ "$file_date" < "$cutoff_date" && "$file_name" == cindral_*.sql.gz ]]; then
        aws s3 rm "s3://${S3_BUCKET}/backups/${file_name}" --quiet
        log_info "Deleted old backup: $file_name"
      fi
    done
  fi
}

# Main
main() {
  log_info "=== Cindral Database Backup ==="
  
  check_prerequisites
  setup_backup_dir
  
  local filename=$(get_backup_filename)
  local filepath=$(create_backup "$filename")
  
  upload_to_s3 "$filepath"
  cleanup_old_backups
  
  log_info "=== Backup Complete ==="
  echo ""
  echo "To restore this backup, run:"
  echo "  ./scripts/db-restore.sh $filepath"
}

main "$@"

