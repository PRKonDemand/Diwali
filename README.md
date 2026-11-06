# Diwali City Simulator

A browser-based 3D Indian neighbourhood festival simulator built with Three.js. The project uses native JavaScript ES modules and a modular, feature-oriented structure.

## Project structure

- `index.html` — semantic app shell, intro screen and game HUD.
- `styles.css` — responsive styling, safe-area spacing and touch controls.
- `src/main.js` — app composition, Three.js renderer, lifecycle, game loop and system coordination.
- `src/world/createCity.js` — roads, walkways, houses, lights, trees, diyas, sky and house collision boundaries.
- `src/world/createPedestrians.js` — ambient walkers and child-sized pedestrians.
- `src/player/createCharacter.js` — reusable character model and walk animation.
- `src/controls/createInputController.js` — keyboard, touch joystick and camera drag/zoom input.
- `src/effects/createFireworks.js` — visual-only particle bursts with geometry/material cleanup.

## Runtime

Three.js is imported as an ES module from jsDelivr. No bundler is required for this static version. Run through a static web server or deploy as a static site; opening the page with `file://` may block module imports.

## Architecture rules

1. `main.js` coordinates systems; feature implementation belongs in its own module.
2. World generation and world collision data stay in `src/world/`.
3. Character creation and animation stay in `src/player/`.
4. Input devices stay in `src/controls/`; they expose state instead of directly moving scene objects.
5. Visual effects stay in `src/effects/` and must dispose temporary GPU resources.
6. Keep game state in memory for this single-player simulator; do not add a backend or browser storage without a clear requirement.

## Progress

- Part 1 — app shell, responsive HUD and Three.js foundation.
- Part 2 — modular Diwali neighbourhood environment.
- Part 3 — player character, keyboard/touch movement, camera follow, pedestrians, pause/resume and visual fireworks.

## Controls

- Desktop: WASD or arrow keys to move; drag the scene to orbit the camera.
- Mobile: use the on-screen joystick; drag the scene to orbit the camera.
- Camera button: cycle camera distance.
- Fireworks button: trigger a decorative in-game particle burst.
