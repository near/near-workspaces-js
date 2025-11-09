#!/bin/bash

# Post-build script to add .js extensions to all relative imports in ESM build
# This is necessary because Node.js ESM requires explicit file extensions

ESM_DIR="$(dirname "$0")/../dist/esm"

if [ ! -d "$ESM_DIR" ]; then
  echo "ESM directory not found: $ESM_DIR"
  exit 1
fi

echo "Adding .js extensions to ESM imports..."

# Fix the top-level index.js first (special handling for directory imports)
TOP_INDEX="$ESM_DIR/index.js"
if [ -f "$TOP_INDEX" ]; then
  sed -i.bak -E \
    -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])(\.\/(account|record|server))(['\"])/\1\2\/index.js\4/g" \
    -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])(\.\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/\.js\.js/.js/g" \
    "$TOP_INDEX"
  rm -f "$TOP_INDEX.bak"
fi

# Find all other .js files and fix imports/exports
find "$ESM_DIR" -name "*.js" -type f | while read -r file; do
  # Skip the top-level index.js as we already processed it
  if [ "$file" = "$TOP_INDEX" ]; then
    continue
  fi
  
  # Fix relative imports and exports: from './something' -> from './something.js'
  sed -i.bak -E \
    -e "s/(from[[:space:]]+['\"])(\.\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/(from[[:space:]]+['\"])(\.\.\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])(\.\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])(\.\.\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/\.js\.js/.js/g" \
    "$file"
  
  # Remove backup files
  rm -f "$file.bak"
  
  # Fix external module imports with subpaths
  sed -i.bak3 -E \
    -e "s/(import[[:space:]]+\{[^}]*\}[[:space:]]+from[[:space:]]+['\"])([^'\"@\.][^'\"]*\/lib\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/(import[[:space:]]+\{[^}]*\}[[:space:]]+from[[:space:]]+['\"])([^'\"@\.][^'\"]*\/dist\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/(export[[:space:]]+\{[^}]*\}[[:space:]]+from[[:space:]]+['\"])([^'\"@\.][^'\"]*\/lib\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])([^'\"@\.][^'\"]*\/lib\/[^'\"]+)(['\"])/\1\2.js\3/g" \
    -e "s/\.js\.js/.js/g" \
    "$file"
  
  # Fix directory imports by adding /index.js
  # But only if NOT already inside that directory
  if [[ "$file" != *"/account/"* ]]; then
    sed -i.tmp -E \
      -e "s/(from[[:space:]]+['\"])\.\/account\.js(['\"])/\1.\/account\/index.js\2/g" \
      -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])\.\/account\.js(['\"])/\1.\/account\/index.js\2/g" \
      "$file"
  fi
  
  if [[ "$file" != *"/server/"* ]]; then
    sed -i.tmp -E \
      -e "s/(from[[:space:]]+['\"])\.\/server\.js(['\"])/\1.\/server\/index.js\2/g" \
      -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])\.\/server\.js(['\"])/\1.\/server\/index.js\2/g" \
      "$file"
  fi
  
  if [[ "$file" != *"/record/"* ]]; then
    sed -i.tmp -E \
      -e "s/(from[[:space:]]+['\"])\.\/record\.js(['\"])/\1.\/record\/index.js\2/g" \
      -e "s/(from[[:space:]]+['\"])\.\.\/record\.js(['\"])/\1.\.\/record\/index.js\2/g" \
      -e "s/(export[[:space:]]+\*[[:space:]]+from[[:space:]]+['\"])\.\/record\.js(['\"])/\1.\/record\/index.js\2/g" \
      "$file"
  fi
  
  # Fix external module directory imports
  sed -i.bak4 -E \
    -e "s/near-api-js\/lib\/utils\.js/near-api-js\/lib\/utils\/index.js/g" \
    -e "s/near-api-js\/lib\/key_stores\.js/near-api-js\/lib\/key_stores\/index.js/g" \
    "$file"
  
  # Remove backup files
  rm -f "$file.bak" "$file.bak2" "$file.bak3" "$file.bak4" "$file.tmp"
done

echo "✓ Done!"
