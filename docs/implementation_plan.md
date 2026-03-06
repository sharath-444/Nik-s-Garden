# Implementation Plan: Collaborative Digital Garden V2 & V3

This document outlines the architecture for "Nik's Garden," which introduces highly interactive and engaging features.

## Proposed Changes

### 1. Database & Backend API
*   **MongoDB Schema `Flower`**: Add `likes` field (Number, default 0).
*   **API Endpoints**: 
    *   `PUT /api/flowers/:id/like`: Increments the like count for a specific flower.
    *   `GET /api/flowers/stats`: Returns aggregated stats (total flowers, active gardeners, top liked).
*   **Socket.io**: Broadcast `active-gardeners` count to all clients.

### 2. Context & State Management
*   **Theme Management**: Implement a Day/Night mode toggle that flips CSS variables.
*   **Audio Management**: Implement a Sound context/toggle to play soft nature/planting sounds.

### 3. Garden UI Enhancements (V2)
*   **Growth & Sparkle**: When a flower drops, scale it from 0 to 1 with an opacity fade, generating a CSS/Framer motion sparkle particle effect + a small soil "pop" ring.
*   **Creatures**: Implement `<Bee />` and `<Butterfly />` components that use Framer Motion to roam randomly around the screen bounds.
*   **Night Mode**: Transition the `#f5f3e7` background to a dark twilight color. Enable CSS `drop-shadow` on flowers to make them glow. Add `<Firefly />` particles.
*   **Stats Badge**: A floating badge displaying total flowers, active gardeners, and the most liked flower.

### 4. Gallery Improvements
*   **Like System**: Add a heart icon and like counter to each flower payload in the masonry grid.
*   **Filtering**: Add dropdown/tabs to sort by Newest, Most Loved, and Random.

### 5. Garden Environment Enhancements (V3)
*   **Decorations**: React component that maps an array of emoji or image-based decorations (trees, rocks, bushes) randomly placed in the background layer (z-index lower than planted flowers).
*   **Texture & Lighting**: Radial gradient overlays on the main lawn container combined with noise overlay for a realistic, soft grass texture.
*   **New Creatures**: Introduce a `<Ladybug />` that moves horizontally/randomly along the ground.
*   **Ambient Particles**: A `<Pollen />` component spawning tiny yellow dots that drift upwards.
*   **Planting Animation**: Update Framer Motion props for incoming flowers: initial `y` offset from far above screen `y: -200` dropping down to `y: 0`.
*   **Depth & Polish**: Increase CSS drop-shadow on the flower images. Add `hover:scale-105` for subtle interaction.

## Verification Plan
1.  **Backend Testing**: Verify `PUT` like endpoints successfully increment the DB and return the updated count.
2.  **Socket Testing**: Verify `active-gardeners` updates live when multiple tabs are opened.
3.  **UI Testing**: Verify animations (growth, creatures, sparkles) run smoothly without dropping frames. Switch to Night Mode to ensure visibility/contrast.
