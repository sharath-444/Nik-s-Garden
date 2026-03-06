# Walkthrough: Nik's Garden V2 & V3

Nik's Garden has evolved into a vibrant, living ecosystem with advanced interactivity and rich environmental details.

## Key Enhancements

### 1. Living Garden Environment (V3)
The garden now feels alive with several environmental layers:
- **Decorations**: Randomly placed trees, bushes, rocks, mushrooms, and grass patches that sway gently in the breeze.
- **Atmospheric Effects**: Drifting pollen particles and a radial lighting effect that makes the center of the lawn glow warmly.
- **Creatures**: Along with the flying bees and butterflies, a ladybug now crawls slowly across the grass.
- **Texture**: A subtle rice-paper noise overlay provides a natural, organic feel to the grassy area.

### 2. Enhanced Planting & Depth
- **Soft Landing**: Newly planted flowers now drop gracefully from the sky and land with a "soft bounce" and a soil-pop effect.
- **Depth & Polish**: Flowers feature realistic drop shadows and a persistent ambient glow (blue in night mode, golden in day mode).
- **Interactivity**: Flowers grow slightly when hovered, and their tooltips now include a real-time "Like" button.

### 3. Gallery & Visual Polish
- **Real-Time Sync**: Both the Garden and Gallery use Socket.io to sync likes and new plants instantly across all users.
- **Filtering**: The Gallery supports sorting by Newest, Most Loved, and Shuffle.
- **Night Mode**: A complete theme overhaul with glowing assets, fireflies, and twinkling stars.

## Implementation Details
- **Frontend**: Built with React, Framer Motion for complex animations, and Tailwind CSS for styling.
- **Backend**: Node.js/Express with MongoDB for persistence and Socket.io for real-time collaboration.
- **Audio**: Synthesized nature sounds using the Web Audio API.

---
*Inspired by Anna's Garden.*
