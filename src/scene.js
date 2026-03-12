import * as THREE from 'three';

export function initScene(scene) {
  // Concrete floor with lane markings
  const floorGeometry = new THREE.PlaneGeometry(20, 25);
  
  // Create concrete-like material
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x606060,
    roughness: 0.85,
    metalness: 0.1
  });
  
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.position.z = 2.5;
  floor.receiveShadow = true;
  scene.add(floor);

  // Lane dividers (yellow lines)
  for (let i = -2; i <= 2; i++) {
    const laneLineGeometry = new THREE.PlaneGeometry(0.08, 25);
    const laneLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const laneLine = new THREE.Mesh(laneLineGeometry, laneLineMaterial);
    laneLine.rotation.x = -Math.PI / 2;
    laneLine.position.set(i * 3.5, 0.01, 2.5);
    scene.add(laneLine);
  }

  // Firing line (yellow safety line)
  const firingLineGeometry = new THREE.PlaneGeometry(20, 0.12);
  const firingLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const firingLine = new THREE.Mesh(firingLineGeometry, firingLineMaterial);
  firingLine.rotation.x = -Math.PI / 2;
  firingLine.position.set(0, 0.02, 0);
  scene.add(firingLine);

  // Shooting stalls (rubber mats)
  createShootingStalls(scene);

  // Back wall with target frames
  createBackWall(scene);

  // IPSC Targets
  createIPSCTargets(scene);

  // Ceiling with lights
  createCeilingLights(scene);

  // Timer/scoreboard
  createTimerBoard(scene);

  // Add side walls and environment
  addEnvironmentObjects(scene);
}

function createShootingStalls(scene) {
  const stallPositions = [-6, -4, -2, 0, 2, 4];
  
  stallPositions.forEach((x, index) => {
    // Rubber mat
    const matGeometry = new THREE.BoxGeometry(1.5, 0.05, 2);
    const matMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.95
    });
    const mat = new THREE.Mesh(matGeometry, matMaterial);
    mat.position.set(x, 0.025, 1);
    mat.receiveShadow = true;
    scene.add(mat);

    // Stall divider (metal pole)
    const poleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
    
    const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
    leftPole.position.set(x - 0.8, 0.8, 1);
    scene.add(leftPole);
    
    const rightPole = new THREE.Mesh(poleGeometry, poleMaterial);
    rightPole.position.set(x + 0.8, 0.8, 1);
    scene.add(rightPole);

    // Stall number plate
    createStallNumber(scene, x, index + 1);
  });
}

function createStallNumber(scene, x, number) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Yellow background
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(0, 0, 128, 128);
  
  // Black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  
  // Number
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), 64, 68);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(0.5, 0.5);
  const plate = new THREE.Mesh(geometry, material);
  plate.position.set(x, 1.4, 0.05);
  scene.add(plate);
}

function createBackWall(scene) {
  // Back wall with concrete texture feel
  const backWallGeometry = new THREE.PlaneGeometry(20, 6);
  const backWallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a3a3a,
    roughness: 0.9,
    metalness: 0.0
  });
  const backWall = new THREE.Mesh(backWallGeometry, backWallMaterial);
  backWall.position.set(0, 3, -10);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Target frame rails (horizontal metal bars)
  const railGeometry = new THREE.BoxGeometry(18, 0.06, 0.06);
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
  
  [1.2, 1.6, 2.0].forEach(y => {
    const rail = new THREE.Mesh(railGeometry, railMaterial);
    rail.position.set(0, y, -9.9);
    scene.add(rail);
  });
}

function createIPSCTargets(scene) {
  const targetConfigs = [
    { x: -6, z: -7 },
    { x: -3, z: -8 },
    { x: 0, z: -9 },
    { x: 3, z: -8 },
    { x: 6, z: -7 },
  ];

  targetConfigs.forEach(config => {
    createIPSCTarget(scene, config.x, config.z);
  });
}

function createIPSCTarget(scene, x, z) {
  // Target frame (metal)
  const frameGeometry = new THREE.BoxGeometry(0.65, 0.95, 0.02);
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.set(x, 1.5, z);
  frame.castShadow = true;
  scene.add(frame);

  // IPSC target silhouette
  const targetGroup = new THREE.Group();
  targetGroup.position.set(x, 1.5, z + 0.02);

  // Main body (white A zone)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.15, 0.35);
  bodyShape.lineTo(0.15, 0.35);
  bodyShape.lineTo(0.18, 0.15);
  bodyShape.lineTo(0.12, -0.1);
  bodyShape.lineTo(0.18, -0.25);
  bodyShape.lineTo(0.12, -0.35);
  bodyShape.lineTo(-0.12, -0.35);
  bodyShape.lineTo(-0.18, -0.25);
  bodyShape.lineTo(-0.12, -0.1);
  bodyShape.lineTo(-0.18, 0.15);
  bodyShape.lineTo(-0.15, 0.35);

  const bodyGeometry = new THREE.ShapeGeometry(bodyShape);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide,
    roughness: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.z = 0.01;
  targetGroup.add(body);

  // Head circle
  const headGeometry = new THREE.CircleGeometry(0.08, 32);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 0.42, 0.02);
  targetGroup.add(head);

  // Zone overlays
  // B zone (blue)
  const bZoneGeometry = new THREE.RingGeometry(0.2, 0.28, 32);
  const bZoneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0066cc,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.7
  });
  const bZone = new THREE.Mesh(bZoneGeometry, bZoneMaterial);
  bZone.position.set(0, 0.05, 0.03);
  targetGroup.add(bZone);

  // C zone (black)
  const cZoneGeometry = new THREE.RingGeometry(0.28, 0.35, 32);
  const cZoneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    roughness: 0.9
  });
  const cZone = new THREE.Mesh(cZoneGeometry, cZoneMaterial);
  cZone.position.set(0, 0.05, 0.04);
  targetGroup.add(cZone);

  // D zone (brown)
  const dZoneGeometry = new THREE.RingGeometry(0.35, 0.45, 32);
  const dZoneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    roughness: 0.9
  });
  const dZone = new THREE.Mesh(dZoneGeometry, dZoneMaterial);
  dZone.position.set(0, 0.05, 0.05);
  targetGroup.add(dZone);

  // Mark as target for hit detection
  targetGroup.userData.isTarget = true;
  targetGroup.userData.points = 10;
  
  // Add invisible hit box
  const hitBoxGeo = new THREE.BoxGeometry(0.4, 0.6, 0.1);
  const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitBox.userData.isTarget = true;
  hitBox.userData.points = 10;
  targetGroup.add(hitBox);

  scene.add(targetGroup);

  // Target stand pole
  const poleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 2.5, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.set(x, 1.25, z - 0.5);
  pole.castShadow = true;
  scene.add(pole);
}

function createCeilingLights(scene) {
  const lightPositions = [-6, -2, 2, 6];
  
  lightPositions.forEach(x => {
    // Light fixture housing
    const fixtureGeometry = new THREE.BoxGeometry(1.6, 0.15, 0.35);
    const fixtureMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.5
    });
    const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
    fixture.position.set(x, 4.92, 0);
    scene.add(fixture);

    // Light panel (glowing)
    const panelGeometry = new THREE.PlaneGeometry(1.5, 0.25);
    const panelMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffee,
      transparent: true,
      opacity: 0.95
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(x, 4.85, 0);
    scene.add(panel);
  });
}

function createTimerBoard(scene) {
  // Timer/scoreboard frame
  const boardGeometry = new THREE.BoxGeometry(3.2, 1.3, 0.08);
  const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.3, roughness: 0.7 });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.set(0, 4.2, -9.8);
  scene.add(board);

  // Timer display (red LED style)
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#ff2200';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('00:00.00', 256, 160);
  
  // Add glow effect
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 20;
  ctx.fillText('00:00.00', 256, 160);
  
  const texture = new THREE.CanvasTexture(canvas);
  const displayMaterial = new THREE.MeshBasicMaterial({ map: texture });
  const displayGeometry = new THREE.PlaneGeometry(2.8, 1.1);
  const display = new THREE.Mesh(displayGeometry, displayMaterial);
  display.position.set(0, 4.2, -9.74);
  scene.add(display);
}

function addEnvironmentObjects(scene) {
  // Side walls
  const wallGeometry = new THREE.PlaneGeometry(25, 6);
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a4a4a,
    roughness: 0.85
  });

  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.set(-10, 3, 2.5);
  leftWall.rotation.y = Math.PI / 2;
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.set(10, 3, 2.5);
  rightWall.rotation.y = -Math.PI / 2;
  scene.add(rightWall);

  // Ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(20, 25);
  const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a2a2a,
    roughness: 0.95
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 5;
  ceiling.position.z = 2.5;
  scene.add(ceiling);
}
