#!/bin/bash
# =============================================================================
# Database Restore Script
# Restores from pg_dump backup with safety confirmations
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Show usage
usage() {
  echo "Usage: $0 <backup_file> [--force]"
  echo ""
  echo "Arguments:"
  echo "  backup_file   Path to the .sql.gz backup file"
  echo "  --force       Skip confirmation prompt (use with caution)"
  echo ""
  echo "Environment:"
  echo "  DATABASE_URL  PostgreSQL connection string (required)"
  echo ""
  echo "Examples:"
  echo "  $0 ./backups/cindral_20240101_120000.sql.gz"
  echo "  $0 s3://mybucket/backups/cindral_20240101_120000.sql.gz"
  exit 1
}

# Check prerequisites
check_prerequisites() {
  if ! command -v psql &> /dev/null; then
    log_error "psql not found. Install PostgreSQL client tools."
    exit 1
  fi

  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable not set."
    exit 1
  fi
}

# Get database name from URL
get_db_name() {
  echo "$DATABASE_URL" | sed -E 's/.*\/([^?]+).*/\1/'
}

# Download from S3 if needed
download_if_s3() {
  local filepath="$1"
  
  if [[ "$filepath" == s3://* ]]; then
    if ! command -v aws &> /dev/null; then
      log_error "AWS CLI required for S3 downloads"
      exit 1
    fi
    
    local local_file="/tmp/$(basename "$filepath")"
    log_info "Downloading from S3..."
    aws s3 cp "$filepath" "$local_file" --quiet
    echo "$local_file"
  else
    echo "$filepath"
  fi
}

# Confirm restore
confirm_restore() {
  local db_name="$1"
  local filepath="$2"
  
  echo ""
  echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                    ⚠️  WARNING ⚠️                           ║${NC}"
  echo -e "${RED}╠════════════════════════════════════════════════════════════╣${NC}"
  echo -e "${RED}║  This will OVERWRITE all data in database: ${db_name}${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "Backup file: ${BLUE}$filepath${NC}"
  echo ""
  
  read -p "Type 'RESTORE' to confirm: " confirmation
  
  if [ "$confirmation" != "RESTORE" ]; then
    log_info "Restore cancelled."
    exit 0
  fi
}

# Perform restore
restore_backup() {
  local filepath="$1"
  local db_name=$(get_db_name)
  
  log_info "Starting restore to database: $db_name"
  
  # Check if file exists and is gzipped
  if [ ! -f "$filepath" ]; then
    log_error "Backup file not found: $filepath"
    exit 1
  fi
  
  # Restore
  log_info "Decompressing and restoring..."
  gunzip -c "$filepath" | psql "$DATABASE_URL" --quiet --single-transaction
  
  log_info "Restore complete!"
}

# Verify restore
verify_restore() {
  log_info "Verifying restore..."
  
  # Count tables
  local table_count=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
  log_info "Tables in database: $(echo $table_count | xargs)"
  
  # Check key tables
  local checks=(
    "SELECT count(*) FROM organization"
    "SELECT count(*) FROM regulations"
    "SELECT count(*) FROM systems"
  )
  
  for check in "${checks[@]}"; do
    local table=$(echo "$check" | sed 's/.*FROM //')
    local count=$(psql "$DATABASE_URL" -t -c "$check" 2>/dev/null || echo "N/A")
    log_info "  $table: $(echo $count | xargs) rows"
  done
}

# Main
main() {
  if [ $# -lt 1 ]; then
    usage
  fi
  
  local backup_file="$1"
  local force="${2:-}"
  
  log_info "=== Cindral Database Restore ==="
  
  check_prerequisites
  
  # Download from S3 if needed
  local local_file=$(download_if_s3 "$backup_file")
  
  # Confirm unless --force
  if [ "$force" != "--force" ]; then
    confirm_restore "$(get_db_name)" "$local_file"
  fi
  
  restore_backup "$local_file"
  verify_restore
  
  # Cleanup temp file if downloaded from S3
  if [[ "$backup_file" == s3://* ]]; then
    rm -f "$local_file"
  fi
  
  log_info "=== Restore Complete ==="
}

main "$@"

