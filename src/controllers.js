import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const controllerModelFactory = new XRControllerModelFactory();

let scene;
let controllers = {
  controller1: null,
  controller2: null,
  controllerGrip1: null,
  controllerGrip2: null
};

export function initControllers(renderer, sceneRef) {
  scene = sceneRef;

  // Controller 1
  const controller1 = renderer.xr.getController(0);
  controller1.userData.index = 0;
  scene.add(controller1);
  controllers.controller1 = controller1;

  // Controller 2
  const controller2 = renderer.xr.getController(1);
  controller2.userData.index = 1;
  scene.add(controller2);
  controllers.controller2 = controller2;

  // Controller Grip 1
  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);
  controllers.controllerGrip1 = controllerGrip1;

  // Controller Grip 2
  const controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);
  controllers.controllerGrip2 = controllerGrip2;

  // Add simple weapon models to controllers
  addWeaponToController(controller1, controllerGrip1);
  addWeaponToController(controller2, controllerGrip2);

  // Add ray lines to controllers
  addControllerRay(controller1);
  addControllerRay(controller2);

  return controllers;
}

function addWeaponToController(controller, grip) {
  // Simple box weapon model
  const weaponGroup = new THREE.Group();

  // Gun body
  const bodyGeometry = new THREE.BoxGeometry(0.04, 0.08, 0.15);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.3,
    metalness: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  weaponGroup.add(body);

  // Barrel
  const barrelGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 16);
  const barrelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x222222,
    roughness: 0.2,
    metalness: 0.9
  });
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.12;
  weaponGroup.add(barrel);

  // Grip
  const gripGeometry = new THREE.BoxGeometry(0.03, 0.08, 0.04);
  const gripMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    roughness: 0.7
  });
  const gripMesh = new THREE.Mesh(gripGeometry, gripMaterial);
  gripMesh.position.y = -0.06;
  gripMesh.position.z = 0.02;
  weaponGroup.add(gripMesh);

  // Position weapon
  weaponGroup.rotation.x = -Math.PI / 8;
  weaponGroup.position.set(0, -0.02, -0.05);

  grip.add(weaponGroup);
  
  // Store reference for shooting
  grip.userData.weapon = weaponGroup;
}

function addControllerRay(controller) {
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -5)
  ]);
  const rayMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff88,
    transparent: true,
    opacity: 0.5
  });
  const ray = new THREE.Line(rayGeometry, rayMaterial);
  controller.add(ray);
  controller.userData.ray = ray;
}

export function onShoot(event) {
  const controller = event.target;
  const index = controller.userData.index;
  
  console.log(`Controller ${index + 1} shot!`);
  
  // Get shooting direction
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(controller.quaternion);
  
  // Get start position (tip of the gun)
  const startPosition = controller.position.clone();
  
  // Raycast for hit detection
  const raycaster = new THREE.Raycaster(startPosition, direction);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  let hitTarget = false;
  
  for (const intersect of intersects) {
    if (intersect.object.userData.isTarget) {
      // Hit a target!
      hitTarget = true;
      const target = intersect.object;
      
      // Visual feedback - flash white
      const originalColor = target.material.color.getHex();
      target.material.color.setHex(0xffffff);
      
      setTimeout(() => {
        target.material.color.setHex(originalColor);
      }, 100);
      
      console.log('Target hit! Points:', target.userData.points);
      break;
    }
  }
  
  // Haptic feedback
  if (event.data.gamepad && event.data.gamepad.hapticActuators) {
    const hapticActuator = event.data.gamepad.hapticActuators[0];
    if (hapticActuator) {
      hapticActuator.pulse(0.5, 100);
    }
  }
  
  // Muzzle flash effect
  triggerMuzzleFlash(controller);
}

function triggerMuzzleFlash(controller) {
  // Simple muzzle flash - bright point light
  const flash = new THREE.PointLight(0xffff00, 2, 2);
  flash.position.copy(controller.position);
  flash.position.y += 0.1;
  scene.add(flash);
  
  // Fade out and remove
  let intensity = 2;
  const fadeInterval = setInterval(() => {
    intensity -= 0.2;
    flash.intensity = intensity;
    
    if (intensity <= 0) {
      clearInterval(fadeInterval);
      scene.remove(flash);
    }
  }, 16);
}

export function getControllers() {
  return controllers;
}
