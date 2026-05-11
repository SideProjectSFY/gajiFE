#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/src/app"

if rg -n "getLegacyJourneyUrl|getCatalogRollbackUrl|isJourneyRollbackEnabled|isCatalogRollbackEnabled" "$TARGET_DIR" --glob "**/page.tsx"; then
  echo "Legacy page runtime references detected in App Router page entries."
  exit 1
fi

echo "Legacy page runtime guard passed."

