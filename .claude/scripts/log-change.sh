#!/bin/bash

# Script to log individual changes to CHANGELOG.md
# Usage: log-change.sh <tool_name> <target> <description>

TOOL_NAME="$1"
TARGET="$2"
DESCRIPTION="$3"
CHANGELOG_FILE="/mnt/c/carbon-calculator/CHANGELOG.md"

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create log entry
LOG_ENTRY="- **${TIMESTAMP}** | \`${TOOL_NAME}\` | ${DESCRIPTION}: \`${TARGET}\`"

# Append to changelog (before the last line to keep it organized)
echo "$LOG_ENTRY" >> "$CHANGELOG_FILE"
