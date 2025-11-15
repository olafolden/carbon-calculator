#!/bin/bash

# Script to log session completion
# Runs when Claude Code stops responding

CHANGELOG_FILE="/mnt/c/carbon-calculator/CHANGELOG.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Add session separator
echo "" >> "$CHANGELOG_FILE"
echo "---" >> "$CHANGELOG_FILE"
echo "" >> "$CHANGELOG_FILE"
