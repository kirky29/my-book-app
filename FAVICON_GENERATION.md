# Favicon Generation Guide

## Current Favicon Files

The app currently has these favicon-related files:
- `public/favicon.svg` - Main favicon (32x32 SVG)
- `public/book-icon.svg` - App icon (192x192 SVG)
- `public/manifest.json` - PWA manifest with icon references

## Missing Files to Generate

The manifest.json references these PNG files that need to be generated:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `favicon.ico` (16x16, 32x32, 48x48)

## How to Generate

### Option 1: Online Tools
1. Use https://realfavicongenerator.net/
2. Upload `public/favicon.svg`
3. Generate all required sizes
4. Download and place files in `public/` directory

### Option 2: Command Line (if you have ImageMagick)
```bash
# Generate PNG files from SVG
convert public/favicon.svg -resize 72x72 public/icon-72x72.png
convert public/favicon.svg -resize 96x96 public/icon-96x96.png
convert public/favicon.svg -resize 128x128 public/icon-128x128.png
convert public/favicon.svg -resize 144x144 public/icon-144x144.png
convert public/favicon.svg -resize 152x152 public/icon-152x152.png
convert public/favicon.svg -resize 384x384 public/icon-384x384.png
convert public/favicon.svg -resize 512x512 public/icon-512x512.png

# Generate favicon.ico (multiple sizes)
convert public/favicon.svg -resize 16x16 public/favicon-16.png
convert public/favicon.svg -resize 32x32 public/favicon-32.png
convert public/favicon.svg -resize 48x48 public/favicon-48.png
convert public/favicon-16.png public/favicon-32.png public/favicon-48.png public/favicon.ico
```

### Option 3: Design Tools
- Use Figma, Sketch, or Adobe Illustrator
- Export the SVG at different sizes
- Save as PNG files

## Current Favicon Design

The favicon features:
- Blue gradient background (matching app theme)
- White book with spine
- Red bookmark
- Clean, recognizable design at small sizes
- Matches the app's "Lorna's Books!" branding

## Browser Support

- Modern browsers: SVG favicon
- Legacy browsers: ICO favicon
- iOS: Apple touch icon
- Android: Manifest icons
- PWA: All sizes in manifest.json
