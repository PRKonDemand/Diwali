# Diwali City Simulator

A mobile-friendly, browser-based 3D neighbourhood simulator built with Three.js.

## Architecture

- `index.html` — semantic application shell and HUD markup.
- `styles.css` — responsive presentation and mobile-safe controls.
- `src/main.js` — application entry point, renderer lifecycle, resize handling and module orchestration.
- `src/world/createCity.js` — procedural environment: roads, walkways, houses, lights, trees, diyas and night sky.

## Runtime

The project uses native JavaScript ES modules and imports Three.js from jsDelivr. No bundler is required for the current static build. Run it through a local static web server or deploy the repository as a static site; opening `index.html` directly with `file://` may block module imports.

## Development boundaries

Keep world generation inside `src/world/`, player logic inside `src/player/`, and input handling inside `src/controls/`. `src/main.js` should coordinate these systems rather than contain their implementation details. Keep persistent game state and UI state separate from Three.js scene objects.

## Current progress

- Part 1: application shell, responsive HUD and Three.js foundation.
- Part 2: modular Diwali neighbourhood environment.
- Part 3: player controller, camera follow, mobile joystick, keyboard input and visual-only in-game fireworks.
