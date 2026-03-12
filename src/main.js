import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { initScene } from './scene.js';
import { initOutdoorRange } from './scene-outdoor.js';
import { GameManager } from './game/game-manager.js';
import { RangeManager } from './game/range-manager.js';
import { GameUI } from './game/ui.js';
import { BulletSystem } from './bullets/bullet.js';
import { Pistol } from './weapons/pistol.js';
import { triggerHaptic, HapticPatterns } from './utils/haptics.js';
import { audioSystem } from './utils/audio.js';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let gameManager, gameUI, bulletSystem, rangeManager;
let pistol1, pistol2;
let desktopPistol;
let mouseX = 0, mouseY = 0;
let keys = {};
let currentRange = 'menu';
let gameStarted = false;

init();
animate();

async function init() {
  const container = document.getElementById('container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.6, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  initScene(scene);

  gameManager = new GameManager(scene);
  gameUI = new GameUI(scene);
  bulletSystem = new BulletSystem(scene);
  rangeManager = new RangeManager(scene);

  // Add pistol to desktop view
  addDesktopPistol(camera);

  if ('xr' in navigator) {
    const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
    
    if (isSupported) {
      renderer.xr.addEventListener('sessionstart', onSessionStart);
      renderer.xr.addEventListener('sessionend', onSessionEnd);
    } else {
      document.getElementById('vr-button').style.display = 'none';
      document.getElementById('not-supported').style.display = 'block';
    }
  } else {
    document.getElementById('vr-button').style.display = 'none';
    document.getElementById('not-supported').style.display = 'block';
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', (event) => {
    audioSystem.init();
    audioSystem.resume();
    
    // Handle menu click for range selection
    if (currentRange === 'menu' && rangeManager) {
      // Get click position in normalized device coordinates
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // Raycasting for menu
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const intersect of intersects) {
        if (intersect.object && intersect.object.userData && intersect.object.userData.isMenu) {
          const uv = intersect.uv;
          const selectedRange = rangeManager.handleClick(uv);
          if (selectedRange) {
            loadRange(selectedRange);
          }
          break;
        }
      }
    }
  });
}

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onSessionStart() {
  console.log('VR Session Starting...');
  console.log('XR Session:', renderer.xr.getSession());
  console.log('XR isPresenting:', renderer.xr.isPresenting);
  
  document.getElementById('crosshair').style.display = 'none';
  
  audioSystem.init();
  
  const controllerModelFactory = new XRControllerModelFactory();
  
  controller1 = renderer.xr.getController(0);
  controller1.userData.index = 0;
  controller1.addEventListener('selectstart', onTriggerPull);
  scene.add(controller1);
  console.log('Controller 1 created');
  
  controller2 = renderer.xr.getController(1);
  controller2.userData.index = 1;
  controller2.addEventListener('selectstart', onTriggerPull);
  scene.add(controller2);
  console.log('Controller 2 created');

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  const model1 = controllerModelFactory.createControllerModel(controllerGrip1);
  controllerGrip1.add(model1);
  scene.add(controllerGrip1);
  console.log('Controller Grip 1 created with model');
  
  controllerGrip2 = renderer.xr.getControllerGrip(1);
  const model2 = controllerModelFactory.createControllerModel(controllerGrip2);
  controllerGrip2.add(model2);
  scene.add(controllerGrip2);
  console.log('Controller Grip 2 created with model');

  // Add simple pistol model directly
  addSimplePistol(controllerGrip1);
  addSimplePistol(controllerGrip2);

  // Add teleportation
  setupTeleportation(controller1);
  setupTeleportation(controller2);

  gameUI.addCrosshairToController(controller1);
  gameUI.addCrosshairToController(controller2);

  gameManager.startGame();
  
  console.log('VR Session Started');
}

function onSessionEnd() {
  if (gameManager) {
    gameManager.endGame();
  }
  document.getElementById('crosshair').style.display = 'block';
  console.log('VR Session Ended');
}

function addSimplePistol(grip) {
  const pistolGroup = new THREE.Group();
  
  const bodyGeo = new THREE.BoxGeometry(0.03, 0.06, 0.12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  pistolGroup.add(body);
  
  const barrelGeo = new THREE.CylinderGeometry(0.01, 0.012, 0.1, 8);
  const barrel = new THREE.Mesh(barrelGeo, bodyMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.1;
  pistolGroup.add(barrel);
  
  const gripGeo = new THREE.BoxGeometry(0.025, 0.07, 0.035);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const gripMesh = new THREE.Mesh(gripGeo, gripMat);
  gripMesh.position.set(0, -0.05, 0.02);
  gripMesh.rotation.x = 0.2;
  pistolGroup.add(gripMesh);
  
  pistolGroup.position.set(0, -0.02, -0.03);
  pistolGroup.rotation.x = -Math.PI / 8;
  
  grip.add(pistolGroup);
  console.log('Simple pistol added to grip');
}

function addDesktopPistol(camera) {
  const pistolGroup = new THREE.Group();
  
  // Realistic materials - Glock 19 style
  const slideMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.25,
    metalness: 0.9,
    envMapIntensity: 0.8
  });
  
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.6,
    metalness: 0.1,
    envMapIntensity: 0.3
  });
  
  const barrelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.95
  });
  
  const sightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.8
  });

  // === SLIDE ===
  const slideGroup = new THREE.Group();
  
  // Main slide body
  const slideBodyGeo = new THREE.BoxGeometry(0.032, 0.055, 0.175);
  const slideBody = new THREE.Mesh(slideBodyGeo, slideMaterial);
  slideBody.position.z = -0.01;
  slideGroup.add(slideBody);
  
  // Slide top rails
  const slideRailGeo = new THREE.BoxGeometry(0.028, 0.008, 0.15);
  const slideRail = new THREE.Mesh(slideRailGeo, slideMaterial);
  slideRail.position.y = 0.028;
  slideGroup.add(slideRail);
  
  // Front serrations
  for (let i = 0; i < 8; i++) {
    const serrationGeo = new THREE.BoxGeometry(0.028, 0.015, 0.004);
    const serration = new THREE.Mesh(serrationGeo, slideMaterial);
    serration.position.set(0, 0.008, -0.06 - i * 0.012);
    slideGroup.add(serration);
  }
  
  // Rear sight
  const rearSightGeo = new THREE.BoxGeometry(0.022, 0.015, 0.008);
  const rearSight = new THREE.Mesh(rearSightGeo, sightMaterial);
  rearSight.position.set(0, 0.038, 0.04);
  slideGroup.add(rearSight);
  
  // Rear sight notch
  const notchGeo = new THREE.BoxGeometry(0.012, 0.008, 0.002);
  const notch = new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  notch.position.set(0, 0.035, 0.044);
  slideGroup.add(notch);
  
  // Front sight
  const frontSightGeo = new THREE.BoxGeometry(0.01, 0.018, 0.006);
  const frontSight = new THREE.Mesh(frontSightGeo, sightMaterial);
  frontSight.position.set(0, 0.04, -0.08);
  slideGroup.add(frontSight);
  
  // Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.006, 0.007, 0.1, 16);
  const barrel = new THREE.Mesh(barrelGeo, barrelMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.005, -0.02);
  slideGroup.add(barrel);
  
  // Muzzle
  const muzzleGeo = new THREE.CylinderGeometry(0.007, 0.008, 0.015, 16);
  const muzzle = new THREE.Mesh(muzzleGeo, barrelMaterial);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.005, -0.095);
  slideGroup.add(muzzle);
  
  slideGroup.position.y = 0.02;
  pistolGroup.add(slideGroup);

  // === FRAME ===
  const frameGroup = new THREE.Group();
  
  // Main grip frame
  const gripShape = new THREE.Shape();
  gripShape.moveTo(-0.014, 0);
  gripShape.lineTo(0.014, 0);
  gripShape.lineTo(0.016, -0.08);
  gripShape.lineTo(0.012, -0.1);
  gripShape.lineTo(-0.012, -0.1);
  gripShape.lineTo(-0.016, -0.08);
  gripShape.closePath();
  
  const gripExtrudeSettings = { depth: 0.028, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002 };
  const gripGeo = new THREE.ExtrudeGeometry(gripShape, gripExtrudeSettings);
  gripGeo.rotateX(Math.PI / 2);
  const grip = new THREE.Mesh(gripGeo, frameMaterial);
  grip.position.set(0, -0.015, 0.02);
  grip.rotation.x = 0.35; // Glock grip angle
  frameGroup.add(grip);
  
  // Trigger guard
  const guardGeo = new THREE.BoxGeometry(0.028, 0.035, 0.02);
  const guard = new THREE.Mesh(guardGeo, frameMaterial);
  guard.position.set(0, -0.025, 0.035);
  frameGroup.add(guard);
  
  // Trigger guard opening
  const guardHoleGeo = new THREE.BoxGeometry(0.02, 0.025, 0.015);
  const guardHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const guardHole = new THREE.Mesh(guardHoleGeo, guardHoleMat);
  guardHole.position.set(0, -0.028, 0.04);
  frameGroup.add(guardHole);
  
  // Trigger
  const triggerGeo = new THREE.BoxGeometry(0.006, 0.025, 0.012);
  const trigger = new THREE.Mesh(triggerGeo, barrelMaterial);
  trigger.position.set(0, -0.018, 0.03);
  trigger.rotation.x = -0.3;
  frameGroup.add(trigger);
  
  // Trigger shoe
  const triggerShoeGeo = new THREE.BoxGeometry(0.008, 0.015, 0.006);
  const triggerShoe = new THREE.Mesh(triggerShoeGeo, frameMaterial);
  triggerShoe.position.set(0, -0.025, 0.018);
  triggerShoe.rotation.x = -0.2;
  frameGroup.add(triggerShoe);
  
  // Magazine well
  const magWellGeo = new THREE.BoxGeometry(0.024, 0.06, 0.015);
  const magWell = new THREE.Mesh(magWellGeo, frameMaterial);
  magWell.position.set(0, -0.05, 0.065);
  magWell.rotation.x = 0.35;
  frameGroup.add(magWell);
  
  // Magazine
  const magGeo = new THREE.BoxGeometry(0.022, 0.07, 0.012);
  const mag = new THREE.Mesh(magGeo, frameMaterial);
  mag.position.set(0, -0.065, 0.075);
  mag.rotation.x = 0.35;
  frameGroup.add(mag);
  
  // Magazine baseplate
  const magBaseGeo = new THREE.BoxGeometry(0.024, 0.015, 0.014);
  const magBase = new THREE.Mesh(magBaseGeo, frameMaterial);
  magBase.position.set(0, -0.1, 0.085);
  magBase.rotation.x = 0.35;
  frameGroup.add(magBase);
  
  // Rail (Picatinny style)
  const railGeo = new THREE.BoxGeometry(0.024, 0.012, 0.08);
  const rail = new THREE.Mesh(railGeo, barrelMaterial);
  rail.position.set(0, 0.005, 0.02);
  frameGroup.add(rail);
  
  // Rail grooves
  for (let i = 0; i < 5; i++) {
    const grooveGeo = new THREE.BoxGeometry(0.022, 0.001, 0.003);
    const groove = new THREE.Mesh(grooveGeo, new THREE.MeshBasicMaterial({ color: 0x111111 }));
    groove.position.set(0, -0.001, 0.01 + i * 0.015);
    frameGroup.add(groove);
  }
  
  // Slide release
  const releaseGeo = new THREE.BoxGeometry(0.015, 0.02, 0.004);
  const release = new THREE.Mesh(releaseGeo, barrelMaterial);
  release.position.set(0, 0.02, 0.055);
  frameGroup.add(release);
  
  // Magazine release
  const magReleaseGeo = new THREE.BoxGeometry(0.012, 0.015, 0.006);
  const magRelease = new THREE.Mesh(magReleaseGeo, barrelMaterial);
  magRelease.position.set(0.018, -0.04, 0.05);
  frameGroup.add(magRelease);
  
  // Beavertail
  const beaverGeo = new THREE.BoxGeometry(0.026, 0.015, 0.02);
  const beaver = new THREE.Mesh(beaverGeo, frameMaterial);
  beaver.position.set(0, 0.008, 0.04);
  frameGroup.add(beaver);
  
  pistolGroup.add(frameGroup);

  // Position: offset to right like FPS view, aligned with camera center
  pistolGroup.position.set(0.22, -0.2, -0.45);
  
  // Natural holding angle
  pistolGroup.rotation.x = -0.08;
  pistolGroup.rotation.y = 0.03;
  pistolGroup.rotation.z = -0.03;
  
  camera.add(pistolGroup);
  scene.add(camera);
  
  desktopPistol = pistolGroup;
  desktopPistol.originalRotationX = pistolGroup.rotation.x;
  desktopPistol.slide = slideGroup;
  
  console.log('Realistic Glock-style pistol added to camera');
}

function triggerDesktopRecoil() {
  if (!desktopPistol) return;
  
  // Recoil animation - rotate pistol up
  desktopPistol.rotation.x = desktopPistol.originalRotationX + 0.1;
  
  // Slide animation (blowback)
  if (desktopPistol.slide) {
    desktopPistol.slide.position.z = 0.015; // Slide moves back
  }
  
  // Muzzle flash - bright flash at barrel
  const flashGroup = new THREE.Group();
  
  // Core flash
  const flashCoreGeo = new THREE.SphereGeometry(0.02, 8, 8);
  const flashCoreMat = new THREE.MeshBasicMaterial({ 
    color: 0xffffee,
    transparent: true,
    opacity: 1.0
  });
  const flashCore = new THREE.Mesh(flashCoreGeo, flashCoreMat);
  flashGroup.add(flashCore);
  
  // Outer glow
  const flashGlowGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const flashGlowMat = new THREE.MeshBasicMaterial({ 
    color: 0xffaa00,
    transparent: true,
    opacity: 0.6
  });
  const flashGlow = new THREE.Mesh(flashGlowGeo, flashGlowMat);
  flashGroup.add(flashGlow);
  
  // Position at pistol muzzle
  const flashPos = camera.position.clone();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  flashPos.add(forward.multiplyScalar(0.6));
  flashPos.add(new THREE.Vector3(0.22, -0.14, 0));
  flashGroup.position.copy(flashPos);
  scene.add(flashGroup);
  
  // Point light for flash
  const flashLight = new THREE.PointLight(0xffaa00, 3, 3);
  flashLight.position.copy(flashPos);
  scene.add(flashLight);
  
  // Fade out animation
  let opacity = 1.0;
  const fadeInterval = setInterval(() => {
    opacity -= 0.15;
    flashCore.material.opacity = opacity;
    flashGlow.material.opacity = opacity * 0.6;
    flashLight.intensity = opacity * 3;
    flashGroup.scale.multiplyScalar(1.2);
    
    if (opacity <= 0) {
      clearInterval(fadeInterval);
      scene.remove(flashGroup);
      scene.remove(flashLight);
      flashCore.geometry.dispose();
      flashCore.material.dispose();
      flashGlow.geometry.dispose();
      flashGlow.material.dispose();
    }
  }, 16);
  
  // Recoil recovery - slide returns, pistol rotates down
  let recovery = 0;
  const recoverInterval = setInterval(() => {
    recovery += 0.02;
    
    // Slide return
    if (desktopPistol.slide) {
      desktopPistol.slide.position.z = 0.015 * Math.pow(0.7, recovery * 15);
    }
    
    // Pistol rotation recovery
    desktopPistol.rotation.x = desktopPistol.originalRotationX + 0.1 * Math.pow(0.8, recovery * 12);
    
    if (recovery >= 1) {
      clearInterval(recoverInterval);
      desktopPistol.rotation.x = desktopPistol.originalRotationX;
      if (desktopPistol.slide) {
        desktopPistol.slide.position.z = 0;
      }
    }
  }, 16);
}

function addControllerRay(controller) {
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -10)
  ]);
  const rayMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff88,
    transparent: true,
    opacity: 0.3
  });
  const ray = new THREE.Line(rayGeometry, rayMaterial);
  controller.add(ray);
  controller.userData.ray = ray;
}

function onTriggerPull(event) {
  const controller = event.target;
  const pistol = controller.userData.index === 0 ? pistol1 : pistol2;
  
  if (!pistol) return;
  
  if (gameManager.isGamePlaying()) {
    if (pistol.fire()) {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(controller.quaternion);
      
      bulletSystem.fire(controller.position.clone(), direction, controller);
      
      triggerHaptic(controller, 0.5, 100);
      audioSystem.playShoot();
      
      if (pistol.currentAmmo === 0) {
        triggerHapticPattern(controller, HapticPatterns.empty);
        audioSystem.playEmpty();
      }
    } else if (pistol.isReloadingNow()) {
      triggerHapticPattern(controller, HapticPatterns.empty);
    } else if (pistol.currentAmmo <= 0) {
      pistol.reload();
      audioSystem.playReload();
    }
  } else {
    if (gameUI.gameOverPlane) {
      gameUI.hideGameOver();
      gameManager.startGame();
    }
  }
}

let teleportMarker;
let teleportTarget;
const userGroup = new THREE.Group();
scene.add(userGroup);

function setupTeleportation(controller) {
  // Create teleport marker (circle on floor)
  const markerGeometry = new THREE.RingGeometry(0.2, 0.3, 32);
  const markerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  teleportMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  teleportMarker.rotation.x = -Math.PI / 2;
  teleportMarker.visible = false;
  teleportMarker.position.y = 0.02;
  scene.add(teleportMarker);

  // Direction arrow
  const arrowGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
  arrow.rotation.x = Math.PI / 2;
  arrow.position.z = -0.4;
  teleportMarker.add(arrow);

  // Track trigger for teleportation
  controller.addEventListener('squeezestart', onTeleportStart);
  controller.addEventListener('squeezeend', onTeleportEnd);
}

const tempMatrix = new THREE.Matrix4();
const raycaster = new THREE.Raycaster();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function onTeleportStart(event) {
  const controller = event.target;
  updateTeleportMarker(controller);
}

function onTeleportEnd(event) {
  const controller = event.target;
  
  if (teleportMarker && teleportMarker.visible && teleportTarget) {
    // Teleport the user
    teleportPlayer(teleportTarget);
  }
  
  if (teleportMarker) {
    teleportMarker.visible = false;
  }
}

function updateTeleportMarker(controller) {
  // Get controller direction
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(controller.quaternion);
  
  // Set up raycaster
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  
  // Check intersection with floor
  const intersection = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(floorPlane, intersection);
  
  if (hit && intersection.x >= -9 && intersection.x <= 9 && intersection.z >= -10 && intersection.z <= 5) {
    if (teleportMarker) {
      teleportMarker.position.copy(intersection);
      teleportMarker.visible = true;
      teleportTarget = intersection.clone();
    }
  } else {
    if (teleportMarker) {
      teleportMarker.visible = false;
    }
    teleportTarget = null;
  }
}

function teleportPlayer(targetPosition) {
  // For VR, we'll use a simpler approach - adjust the reference space
  const session = renderer.xr.getSession();
  if (!session) return;
  
  const referenceSpace = renderer.xr.getReferenceSpace();
  if (!referenceSpace) return;
  
  // Get current position from the reference space offset
  const currentPose = session.requestReferenceSpace('local');
  
  // Calculate the offset from the player's feet position
  // We'll store a user offset and apply it
  const transform = new XRRigidTransform(
    { x: -targetPosition.x, y: -targetPosition.y, z: -targetPosition.z + 2 },
    { x: 0, y: 0, z: 0, w: 1 }
  );
  
  const newReferenceSpace = referenceSpace.getOffsetReferenceSpace(transform);
  renderer.xr.setReferenceSpace(newReferenceSpace);
  
  console.log('Teleported to:', targetPosition);
}

function loadRange(rangeType) {
  // Clear existing scene
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
  
  // Re-add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Re-add user group for teleportation
  scene.add(userGroup);
  
  // Add teleport marker
  const markerGeometry = new THREE.RingGeometry(0.2, 0.3, 32);
  const markerMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  teleportMarker = new THREE.Mesh(markerGeometry, markerMaterial);
  teleportMarker.rotation.x = -Math.PI / 2;
  teleportMarker.visible = false;
  teleportMarker.position.y = 0.02;
  scene.add(teleportMarker);
  
  // Initialize range
  if (rangeType === 'indoor') {
    scene.background = new THREE.Color(0x1a1a2e);
    initScene(scene);
    camera.position.set(0, 1.6, 3);
  } else if (rangeType === 'outdoor') {
    initOutdoorRange(scene);
    camera.position.set(0, 1.6, 2);
  }
  
  // Dispose old gameUI properly before creating new one
  if (gameUI && gameUI.dispose) {
    gameUI.dispose();
  }
  
  // Reset game manager
  gameManager = new GameManager(scene);
  
  // Hide menu, show UI
  rangeManager.hide();
  gameUI = new GameUI(scene);
  
  // Re-add desktop pistol
  addDesktopPistol(camera);
  
  currentRange = rangeType;
  console.log(`Loaded ${rangeType} range`);
  
  // Start game automatically
  gameManager.startGame();
}

function returnToMenu() {
  // Clear scene
  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
  
  // Re-add lights
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  
  // Reset camera
  camera.position.set(0, 1.6, 3);
  camera.rotation.set(0, 0, 0);
  
  // Dispose old gameUI properly
  if (gameUI && gameUI.dispose) {
    gameUI.dispose();
  }
  
  // Reset game manager
  gameManager = new GameManager(scene);
  gameUI = new GameUI(scene);
  
  // Show menu
  rangeManager = new RangeManager(scene);
  currentRange = 'menu';
  
  console.log('Returned to menu');
}

function onKeyDown(event) {
  // Init audio on first interaction (required by browsers)
  audioSystem.init();
  audioSystem.resume();
  
  if (event.code === 'Space') {
    event.preventDefault();
    
    if (!gameManager.isGamePlaying()) {
      // Hide game over screen when restarting
      if (gameUI && gameUI.gameOverPlane) {
        gameUI.hideGameOver();
      }
      gameManager.startGame();
      return;
    }
    
    // Get shooting direction from camera (where player is looking through sights)
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.normalize();
    
    // Fire from camera position (sight alignment - bullets go where sights point)
    const startPos = camera.position.clone();
    
    bulletSystem.fire(startPos, direction);
    audioSystem.playShoot();
    triggerDesktopRecoil();
    
    console.log('Shoot (desktop test)');
  }
  
  if (event.code === 'KeyR') {
    if (pistol1) pistol1.reload();
    if (pistol2) pistol2.reload();
  }
  
  if (event.code === 'Escape') {
    // Return to menu
    if (currentRange !== 'menu') {
      returnToMenu();
    }
  }
  
  // Range selection in menu
  if (currentRange === 'menu') {
    if (event.code === 'Digit1' || event.code === 'Numpad1') {
      loadRange('indoor');
    }
    if (event.code === 'Digit2' || event.code === 'Numpad2') {
      loadRange('outdoor');
    }
  }
  
  if (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') {
    keys[event.code] = true;
  }
}

function onKeyUp(event) {
  if (event.code === 'KeyW' || event.code === 'KeyA' || event.code === 'KeyS' || event.code === 'KeyD') {
    keys[event.code] = false;
  }
}

function updateMovement(deltaTime) {
  const speed = 3;
  const moveVector = new THREE.Vector3();
  
  if (keys['KeyW']) moveVector.z -= 1;
  if (keys['KeyS']) moveVector.z += 1;
  if (keys['KeyA']) moveVector.x -= 1;
  if (keys['KeyD']) moveVector.x += 1;
  
  if (moveVector.length() > 0) {
    moveVector.normalize();
    moveVector.applyQuaternion(camera.quaternion);
    moveVector.y = 0; // Keep on floor
    moveVector.multiplyScalar(speed * deltaTime);
    
    // Apply bounds
    const newPos = camera.position.clone().add(moveVector);
    newPos.x = Math.max(-9, Math.min(9, newPos.x));
    newPos.z = Math.max(-10, Math.min(5, newPos.z));
    camera.position.copy(newPos);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(render);
}

let lastTime = performance.now();

function render() {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  if (!renderer.xr.isPresenting) {
    // Desktop mouse look
    camera.rotation.y = -mouseX * 0.5;
    camera.rotation.x = mouseY * 0.3;
    
    // WASD movement
    updateMovement(deltaTime);
  } else {
    // Update teleport marker while squeeze is held
    if (controller1 && teleportMarker && teleportMarker.visible) {
      updateTeleportMarker(controller1);
    }
    if (controller2 && teleportMarker && teleportMarker.visible) {
      updateTeleportMarker(controller2);
    }
  }
  
  if (gameManager && gameManager.isGamePlaying()) {
    gameManager.update(deltaTime);
    
    bulletSystem.update(deltaTime, gameManager.targets, 
      (target, bullet) => {
        gameManager.onTargetHit(target);
        triggerHaptic(bullet.controller, 1.0, 50);
        audioSystem.playHit();
        bulletSystem.removeBullet(bullet);
      },
      () => {
        gameManager.onMiss();
      }
    );
    
    gameUI.updateScore(gameManager.getScore(), gameManager.getCombo());
    gameUI.updateTimer(gameManager.getTime());
    gameUI.updateWave(gameManager.getWave());
    
    if (gameManager.timeRemaining <= 0 && !gameUI.gameOverPlane) {
      gameUI.showGameOver(gameManager.getScore());
    }
  } else {
    // Check for game over to restart
    if (gameUI.gameOverPlane) {
      // Game is over, waiting for restart
    }
  }
  
  renderer.render(scene, camera);
}
