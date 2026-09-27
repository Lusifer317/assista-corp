#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/assista/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

# The application uses SQLite WAL. Stop the application briefly so the database
# and WAL are captured consistently by the filesystem archive.
docker compose -f docker-compose.prod.yml stop assista
trap 'docker compose -f docker-compose.prod.yml start assista >/dev/null' EXIT

docker run --rm \
  -v assista-corp-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine:3.22 \
  tar -czf "/backup/assista-data-${TIMESTAMP}.tar.gz" -C /data .

find "$BACKUP_DIR" -type f -name 'assista-data-*.tar.gz' -mtime +"$RETENTION_DAYS" -delete

echo "Backup created: $BACKUP_DIR/assista-data-${TIMESTAMP}.tar.gz"
