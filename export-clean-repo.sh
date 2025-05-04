#!/bin/bash

# This script creates a clean repository archive without tokens
# for safe manual upload to GitHub

echo "Creating clean repository archive for expensetrackerccMVP..."

# Create a temp directory for the clean content
TEMP_DIR="/home/admin/clean-repo-temp"
ARCHIVE_NAME="/home/admin/expensetrackerccMVP-clean.zip"

# Clean up any previous temporary files
rm -rf "$TEMP_DIR" 2>/dev/null
rm -f "$ARCHIVE_NAME" 2>/dev/null
mkdir -p "$TEMP_DIR"

# Copy all files except .git, node_modules, and other large directories
cd /home/admin/expensetrackercc
rsync -av --progress ./ "$TEMP_DIR/" --exclude .git --exclude node_modules --exclude .nuxt --exclude .output

# Remove any existing tokens or sensitive information
find "$TEMP_DIR" -type f -name "*.sh" -exec sed -i 's/ghp_[a-zA-Z0-9]*/**TOKEN_REMOVED**/g' {} \;
find "$TEMP_DIR" -type f -name "*.json" -exec sed -i 's/ghp_[a-zA-Z0-9]*/**TOKEN_REMOVED**/g' {} \;
find "$TEMP_DIR" -type f -name "*.service" -exec sed -i 's/ghp_[a-zA-Z0-9]*/**TOKEN_REMOVED**/g' {} \;

# Create the clean archive
cd "$TEMP_DIR"
zip -r "$ARCHIVE_NAME" .

# Clean up the temp directory
cd /home/admin
rm -rf "$TEMP_DIR"

echo "Clean archive created at: $ARCHIVE_NAME"
echo "You can now upload this archive to your GitHub repository manually."
echo "To upload:"
echo "1. Create a new repository on GitHub called 'expensetrackerccMVP'"
echo "2. Use the web interface to upload the archive or extract it and push using git"