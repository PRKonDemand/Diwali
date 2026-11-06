# Diwali City Simulator

A browser-based 3D Indian neighbourhood festival simulator built with Three.js. The project uses native JavaScript ES modules and a modular, feature-oriented structure.

## Project structure

- `index.html` — semantic app shell, intro screen and game HUD.
- `styles.css` — responsive styling, safe-area spacing, directional buttons and touch feedback.
- `src/main.js` — app composition, renderer, lifecycle, game loop and system coordination.
- `src/world/createCity.js` — roads, walkways, houses, lights, trees, diyas, sky and collision boundaries.
- `src/world/createPedestrians.js` — ambient walkers and child-sized pedestrians.
- `src/player/createCharacter.js` — reusable character model and walk animation.
- `src/controls/createInputController.js` — hold-to-move directional buttons, keyboard controls and camera drag/zoom.
- `src/effects/createFireworks.js` — visual-only particle bursts with GPU resource cleanup.

## Runtime

Three.js is imported as an ES module from jsDelivr. No bundler is required for this static version. Run through a static web server or deploy as a static site; opening the page with `file://` may block module imports.

## Architecture rules

1. `main.js` coordinates systems; feature implementation belongs in its own module.
2. World generation and collision data stay in `src/world/`.
3. Character creation and animation stay in `src/player/`.
4. Input handling stays in `src/controls/`; it returns movement state and never directly mutates the player or scene.
5. Visual effects stay in `src/effects/` and dispose temporary GPU resources.
6. Keep single-player state in memory; add backend or browser storage only when a clear requirement exists.
7. Keep UI structure in HTML, presentation in CSS and interaction/game orchestration in JavaScript.

## Controls

- Mobile: press and hold one of the four directional arrow buttons to move; release to stop.
- Desktop: WASD or arrow keys to move.
- Drag the 3D scene to rotate the camera.
- Camera button: cycle camera distance.
- Fireworks button: trigger a decorative in-game particle burst.
- Pause button: pause/resume simulation.

## Validation notes

The repository is designed as a static ES-module website. Validate with a static server and a real mobile browser for touch/pointer behaviour; a GitHub file update alone does not prove runtime or device compatibility.
