#!/bin/bash

OUTPUT_FILE="arborescence.txt"
rm -f "$OUTPUT_FILE"

echo "📂 Arborescence du projet (sans node_modules, .git, dist, etc.)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

find . \
  -type d \( -name 'node_modules' -o -name '.git' -o -name 'dist' -o -name 'build' -o -name '.next' -o -name '.vercel' \) -prune -false -o \
  -print | sed 's|[^/]*/|  |g' >> "$OUTPUT_FILE"

echo "✅ Arborescence générée dans $OUTPUT_FILE"
