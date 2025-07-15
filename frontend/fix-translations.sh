#!/bin/bash

# This script updates all t() function calls from two parameters to one parameter
# It keeps the Korean text (first parameter) as the key

echo "Fixing translation function calls..."

# Find all TypeScript/TSX files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Skip the useTranslation hook file itself
  if [[ "$file" == *"useTranslation.ts" ]]; then
    continue
  fi
  
  # Create a temporary file
  temp_file="${file}.tmp"
  
  # Use sed to replace t('korean', 'english') with t('korean')
  # This regex matches t( followed by a quoted string, comma, space, and another quoted string
  sed -E "s/t\((['\"][^'\"]+['\"])[[:space:]]*,[[:space:]]*['\"][^'\"]+['\"]\)/t(\1)/g" "$file" > "$temp_file"
  
  # Check if the file was changed
  if ! cmp -s "$file" "$temp_file"; then
    mv "$temp_file" "$file"
    echo "Updated: $file"
  else
    rm "$temp_file"
  fi
done

echo "Translation fixes complete!"