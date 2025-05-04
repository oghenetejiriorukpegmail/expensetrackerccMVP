#!/bin/bash

# Set up Netlify functions before building
echo "Setting up Netlify functions..."
node netlify-functions-setup.js

# Run the Nuxt build with static generation
NITRO_PRESET=static npm run build

# Ensure the output directory exists
if [ ! -d ".output/public" ]; then
  echo "Creating .output/public directory..."
  mkdir -p .output/public
fi

# Create a basic index.html file if it doesn't exist
if [ ! -f ".output/public/index.html" ]; then
  echo "Creating index.html..."
  # Find the main CSS file
  CSS_FILE=$(find .output/public/_nuxt -name "entry.*.css" 2>/dev/null | sed 's|.output/public||' || echo "")
  
  # Find all JS files to include
  JS_FILES=$(find .output/public/_nuxt -name "*.js" | head -5 | sed 's|.output/public||' | awk '{print "  <script type=\"module\" src=\"" $0 "\"></script>"}' | tr '\n' ' ')
  
  cat > .output/public/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Expense Tracker</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  ${CSS_FILE:+<link rel="stylesheet" href="$CSS_FILE">}
  ${JS_FILES}
</head>
<body>
  <div id="__nuxt"></div>
</body>
</html>
EOL
fi

# Create a minimal favicon.ico
if [ ! -f ".output/public/favicon.ico" ]; then
  echo "Creating favicon.ico..."
  # Copy a minimal favicon (1x1 pixel transparent GIF)
  echo -ne '\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b' > .output/public/favicon.ico
fi

# List the output directory for debugging
echo "Content of .output/public:"
ls -la .output/public/