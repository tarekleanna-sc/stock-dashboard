#!/bin/bash
# Auto-sync: polls every 30 seconds and pushes any changes to GitHub
# Run this in a terminal: bash sync.sh

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
INTERVAL=30

echo "Auto-sync started for: $REPO_DIR"
echo "Checking for changes every ${INTERVAL}s. Press Ctrl+C to stop."
echo ""

cd "$REPO_DIR"

while true; do
  sleep $INTERVAL

  # Check if there's anything to commit
  if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] Changes detected — syncing..."
    git add -A
    git commit -m "auto-sync: $TIMESTAMP"
    git push origin main
    echo "[$TIMESTAMP] Pushed to GitHub"
    echo ""
  fi
done
