#!/bin/bash

# Color replacement mappings based on DaisyUI migration
# These are the top priority replacements

find src -type f \( -name "*.css" -o -name "*.module.css" \) ! -path "*/node_modules/*" -print0 | while IFS= read -r -d '' file; do
  # #0099D9 → hsl(var(--p)) - Primary color
  sed -i 's/#0099D9/hsl(var(--p))/g' "$file"
  
  # #003580 → hsl(var(--p)) - Original primary blue
  sed -i 's/#003580/hsl(var(--p))/g' "$file"
  
  # #ffffff (white backgrounds/text)
  # More selective - only for known white color cases
  sed -i 's/#ffffff\b/hsl(var(--b1))/g' "$file"
  
  # #fff (shorthand white)
  sed -i "s/#fff\b/hsl(var(--b1))/g" "$file"
  
  # #333 (dark text)
  sed -i 's/#333\b/hsl(var(--bc))/g' "$file"
  
  # #666 (gray text)
  sed -i 's/#666\b/hsl(var(--bc) \/ 0.65)/g' "$file"
  
  # #ddd (light borders)
  sed -i 's/#ddd\b/hsl(var(--b3))/g' "$file"
  
  # #eee (very light backgrounds)
  sed -i 's/#eee\b/hsl(var(--b2))/g' "$file"
  
  # #ccc (light gray)
  sed -i 's/#ccc\b/hsl(var(--b3))/g' "$file"
  
  # #111 (very dark text)
  sed -i 's/#111\b/hsl(var(--bc))/g' "$file"
  
  # #ff4d4f (error red)
  sed -i 's/#ff4d4f/hsl(var(--er))/g' "$file"
  
  # #2ec158 (success green)
  sed -i 's/#2ec158/hsl(var(--su))/g' "$file"
  
  # #f59e0b (warning amber)
  sed -i 's/#f59e0b/hsl(var(--wa))/g' "$file"
  
  # #ed4a29 (orange/accent) - admin and vendor
  sed -i 's/#ed4a29/hsl(var(--a))/g' "$file"
  
  # #ff6b4a (orange lighter) 
  sed -i 's/#ff6b4a/hsl(var(--a))/g' "$file"
  
  # #1a73e8 (google blue)
  sed -i 's/#1a73e8/hsl(var(--in))/g' "$file"
done

echo "Color replacements complete!"
