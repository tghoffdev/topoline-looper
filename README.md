# Topoline Looper

Browser-based generative art tool for creating animated topographic and halftone pattern GIFs with real-time controls and transparent background support.

![Example](Examples/19ca5f20-d598-4a35-9281-70986a69d498.gif)

## Features

- **Two shader effects**: Topographic contour lines and halftone dot patterns
- **Real-time controls**: Adjust parameters and see changes instantly
- **GIF export**: Configurable duration, FPS, quality, and size
- **Transparent backgrounds**: Export GIFs with transparency for layering

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open http://localhost:3000 in your browser.

## Controls

### Topographic
- Line Count, Thickness
- Noise Scale, Speed, Distortion
- Line & Background Colors
- Transparent BG toggle

### Halftone
- Grid Density, Dot Size
- Animation Speed, Color Offset
- Two color channels + Background
- Transparent BG toggle

### Export
- Duration (1-10s)
- FPS (10-30)
- Quality (1-20)
- Size (256-800px)

## Tech Stack

- Svelte + Vite
- Three.js (WebGL shaders)
- lil-gui
- gif.js
