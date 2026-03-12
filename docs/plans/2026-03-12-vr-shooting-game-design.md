# TACSHOT - VR Shooting Game Plan

## Overview
A WebXR-based VR shooting game for Meta Quest 3, built from scratch using Three.js (no Unity/Unreal). Inspired by ACE Virtual Shooting.

## Technology Stack
- **WebXR API** - VR session, controller input, haptics
- **Three.js** - 3D rendering, scene management
- **Vanilla JavaScript** - All game logic
- **Webpack** - Build tool

## Project Structure
```
tacshot/
├── docs/
│   └── plans/
│       └── 2026-03-12-vr-shooting-game-design.md
├── src/
│   ├── index.html              # Entry point + VR enter button
│   ├── main.js                 # App initialization
│   ├── xr-session.js           # WebXR session management
│   ├── scene.js               # Three.js scene setup
│   ├── controllers.js          # Controller input handling
│   ├── weapons/
│   │   └── pistol.js           # Pistol class
│   ├── targets/
│   │   └── target.js           # Target class
│   ├── bullets/
│   │   └── bullet.js           # Bullet/projectile class
│   ├── game/
│   │   ├── game-manager.js    # Game state, waves, score
│   │   └── ui.js              # VR HUD
│   └── utils/
│       └── haptics.js         # Controller vibration
├── public/
│   └── models/                 # GLTF gun model
├── package.json
└── webpack.config.js
```

## Implementation Phases

### Phase 1: Foundation (1-2 days)
- [ ] Set up project with Three.js + WebXR
- [ ] Basic VR session + controller input
- [ ] Simple scene with floor/sky
- [ ] Test: Enter VR, see controllers

### Phase 2: Core Mechanics (2-3 days)
- [ ] Weapon model (simple box for now)
- [ ] Shooting with raycast hit detection  
- [ ] Bullet/projectile system
- [ ] Basic targets (static cubes)
- [ ] Test: Shoot targets, score increments

### Phase 3: Game Loop (2-3 days)
- [ ] Wave-based target spawning
- [ ] Score/combo system
- [ ] Timer
- [ ] Reload mechanic
- [ ] Test: Complete a wave, game over state

### Phase 4: Polish (2-3 days)
- [ ] Better gun model (GLTF)
- [ ] Sound effects
- [ ] Haptic feedback
- [ ] Muzzle flash particles
- [ ] Basic UI/HUD in VR
- [ ] Test: Full gameplay loop

### Phase 5: Quest 3 Optimization (1-2 days)
- [ ] Performance optimization
- [ ] Passthrough mode (mixed reality)
- [ ] Hand tracking support (optional)
- [ ] Test: On actual Quest 3

## Technical Details

### WebXR Session Setup
```javascript
// Check VR support
navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
  if (supported) {
    // Show "Enter VR" button
  }
});

// Request session with required features
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['hand-tracking', 'passthrough']
});
```

### Controller Input
```javascript
// Get controller
const controller = renderer.xr.getController(0);
controller.addEventListener('selectstart', onTriggerPull);

// Get grip (for holding weapon)
const grip = renderer.xr.getControllerGrip(0);
grip.add(weaponModel);
```

### Raycast Shooting
```javascript
// Raycast from controller position
const raycaster = new THREE.Raycaster();
raycaster.set(controller.position, controller.getWorldDirection(new THREE.Vector3()));

// Check hits
const hits = raycaster.intersectObjects(targets);
if (hits.length > 0) {
  score += points;
  triggerHaptic(controller, 0.5, 100);
}
```

### Key WebXR APIs
| API | Purpose |
|-----|---------|
| `navigator.xr.requestSession()` | Start VR mode |
| `renderer.xr.getController()` | Get controller position/rotation |
| `controller.addEventListener('selectstart')` | Trigger press |
| `gamepad.hapticActuators[0].pulse()` | Haptic feedback |
| `XRSession.requestReferenceSpace('local-floor')` | Player position |

### Performance Targets for Quest 3
- **72-90 FPS** (Quest 3 default)
- **Draw calls**: < 50
- **Triangles**: < 100k
- **Texture memory**: < 256MB

## Game Features (V1 - Pistol Only)

### Weapons
- **Pistol**: Standard semi-automatic handgun
  - Fire rate: 3 shots/second
  - Reload time: 2 seconds
  - Magazine: 12 rounds
  - Visual recoil animation

### Targets
- **Stationary targets**: Fixed position, various sizes
- **Moving targets**: Linear/circular movement patterns

### Scoring
- Small target: 10 points
- Medium target: 20 points
- Large target: 30 points
- Combo multiplier: +0.1x per consecutive hit (max 3x)

### Game Modes
- **Practice**: Endless, no timer
- **Timed Wave**: 60 seconds per wave, increasing difficulty

## Dependencies
```json
{
  "three": "^0.160.0",
  "webpack": "^5.89.0",
  "webpack-cli": "^5.1.4",
  "webpack-dev-server": "^4.15.1",
  "html-webpack-plugin": "^5.6.0"
}
```

## References
- Meta's WebXR First Steps: https://github.com/meta-quest/webxr-first-steps
- Three.js WebXR Examples: https://threejs.org/examples/?q=webxr
- WebXR Device API: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
