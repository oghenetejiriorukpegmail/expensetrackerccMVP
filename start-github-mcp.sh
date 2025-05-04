#!/bin/bash

# Check if @modelcontextprotocol/server-github is installed
if ! npm list -g @modelcontextprotocol/server-github >/dev/null 2>&1; then
  echo "Installing @modelcontextprotocol/server-github globally..."
  npm install -g @modelcontextprotocol/server-github
fi

# Set environment variable - Replace with your token before using
export GITHUB_PERSONAL_ACCESS_TOKEN="PLACEHOLDER_TOKEN_HERE"

# Start the MCP server
echo "Starting GitHub MCP server..."
npx @modelcontextprotocol/server-github