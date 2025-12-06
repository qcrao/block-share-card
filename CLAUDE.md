# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Block Share Card is a Roam Research extension that allows users to share zoomed-in blocks as images optimized for mobile (320px) or desktop (640px) viewing.

## Build Command

```bash
./build.sh    # npm install && npx roamjs-scripts build --depot
```

## Architecture

### Extension Entry Point
- `src/index.js` - Exports `onload`/`onunload` hooks for Roam extension lifecycle. Creates a toolbar button in `.rm-topbar`.

### Core Flow
1. User clicks toolbar button → `BlockShareCardComponent.jsx` shows Mobile/Desktop menu
2. Selection triggers `shareAndDownloadImage()` in `download.js`
3. Finds the zoomed block container, injects Header/Footer components
4. Uses `html2canvas` to capture the styled block as an image
5. Downloads the image and cleans up injected elements

### Key Files
- `src/download.js` - Main image generation logic, DOM manipulation, and canvas rendering
- `src/panelConfig.js` - Extension settings panel (card style, time display, hide stats)
- `src/api/roamQueries.js` - Datalog queries for Roam's database (block counts, dates)
- `src/api/roamSelect.js` - Extracts block metadata from DOM attributes
- `extension.css` - Styles for the share card (header, footer, double-line divider)

## Technical Notes

- Uses BlueprintJS components (`@blueprintjs/core`) for UI
- Uses `htm` library for tagged template JSX alternative
- Roam API accessed via global `roamAlphaAPI.q()` with Datalog queries
- Card styling controlled by CSS custom property `--share-block-card-font-family-base`
