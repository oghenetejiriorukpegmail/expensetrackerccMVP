#!/bin/bash

# Run the Nuxt build
npm run build

# Ensure the output directory exists
if [ ! -d ".output/public" ]; then
  echo "Creating .output/public directory..."
  mkdir -p .output/public
fi

# Check for any files we need to copy
if [ -d ".nuxt/dist/public" ]; then
  echo "Copying files from .nuxt/dist/public to .output/public..."
  cp -r .nuxt/dist/public/* .output/public/
fi

# Ensure there's at least an index.html
if [ ! -f ".output/public/index.html" ]; then
  echo "Creating placeholder index.html..."
  cp -r public/* .output/public/ 2>/dev/null || echo "No public files to copy"
fi

# List the output directory for debugging
echo "Content of .output/public:"
ls -la .output/public/