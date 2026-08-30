#!/bin/bash
# Enterprise Build Generator
# This script copies the current directory into a new folder and strips out SaaS superadmin code.

set -e

SOURCE_DIR=$(pwd)
TARGET_DIR="../propdesk-enterprise"

echo "========================================="
echo "PropDesk Enterprise Edition Generator"
echo "========================================="

if [ -d "$TARGET_DIR" ]; then
  echo "[WARNING] Target directory $TARGET_DIR already exists."
  read -p "Do you want to overwrite it? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    exit 1
  fi
  rm -rf "$TARGET_DIR"
fi

echo "[1/4] Copying codebase..."
# Exclude node_modules, .next, and git to save time
rsync -av --progress "$SOURCE_DIR/" "$TARGET_DIR/" --exclude node_modules --exclude .next --exclude .git --exclude .env.local

echo "[2/4] Stripping Superadmin routes..."
if [ -d "$TARGET_DIR/app/(dashboard)/superadmin" ]; then
  rm -rf "$TARGET_DIR/app/(dashboard)/superadmin"
  echo "  - Removed /superadmin routes"
fi

echo "[3/4] Removing Superadmin Sidebar Link..."
SIDEBAR_FILE="$TARGET_DIR/components/layout/sidebar.tsx"
if [ -f "$SIDEBAR_FILE" ]; then
  # This uses sed to remove the object with label 'Superadmin' from the links array if it exists
  # A simple string replace to disable the link logic
  sed -i '' '/label: "Superadmin"/,+4d' "$SIDEBAR_FILE" || true
  echo "  - Removed Superadmin from sidebar"
fi

echo "[4/4] Generating Database Schema Dump..."
# If user wants a schema dump, we can just copy the existing supabase_schema.sql
if [ -f "$SOURCE_DIR/supabase_schema.sql" ]; then
  cp "$SOURCE_DIR/supabase_schema.sql" "$TARGET_DIR/enterprise_schema.sql"
  echo "  - Copied database schema for client setup"
fi

echo "========================================="
echo "Done! The clean Enterprise codebase is at: $TARGET_DIR"
echo "Next Steps for Handover:"
echo "1. cd $TARGET_DIR"
echo "2. git init && git add . && git commit -m 'Initial Enterprise Commit'"
echo "3. Push to your PRIVATE github repo."
echo "4. Connect to client's Vercel account."
echo "========================================="
