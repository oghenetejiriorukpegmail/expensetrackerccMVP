#!/bin/bash

# This script pushes to an existing GitHub repo
# To be used when the repository already exists

# GitHub username and repository name
GITHUB_USER="oghenetejiriorukpegmail"  # GitHub username
REPO_NAME="expensetrackerccMVP"

# GitHub Personal Access Token
GITHUB_TOKEN="***TOKEN_REMOVED***"

echo "Configuring remote and pushing to existing GitHub repository..."

# Remove existing origin if present
git remote remove origin

# Add the GitHub remote with token auth
echo "Adding GitHub remote..."
git remote add origin https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git

# Pull first to avoid rejection
echo "Fetching from remote to integrate changes..."
git fetch origin

# Force push to GitHub
echo "Force pushing code to GitHub..."
git push -f origin main

echo "Push complete! Repository updated at: https://github.com/$GITHUB_USER/$REPO_NAME"