#!/bin/bash

# Check if a token is provided
if [ -z "$1" ]; then
  echo "Please provide your GitHub token as an argument"
  echo "Usage: bash push-to-github.sh YOUR_GITHUB_TOKEN"
  exit 1
fi

# Set the token
TOKEN=$1

# Set up the remote URL with the token included
git remote set-url origin https://${TOKEN}@github.com/oghenetejiriorukpegmail/expensetrackerccMVP.git

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

# Reset the remote URL to not include the token
git remote set-url origin https://github.com/oghenetejiriorukpegmail/expensetrackerccMVP.git

echo "Push completed successfully!"