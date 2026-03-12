import * as THREE from 'three';

export function initOutdoorRange(scene) {
  // Ground - natural earth/grass
  const groundGeometry = new THREE.PlaneGeometry(30, 40);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a5d23,
    roughness: 0.95,
    metalness: 0.0
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.position.z = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  // Concrete shooting platform (firing line)
  createFiringLine(scene);

  // IPSC Stage - Walls and obstacles
  createStageWalls(scene);

  // IPSC targets - proper layout
  createIPSCTargets(scene);

  // Poppers (steel targets)
  createPoppers(scene);

  // Props
  createProps(scene);

  // Safety signage
  createSafetySigns(scene);

  // Start position
  createStartPosition(scene);

  // Lighting
  createOutdoorLighting(scene);
}

function createFiringLine(scene) {
  // Concrete platform
  const platformMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x707070,
    roughness: 0.8,
    metalness: 0.1
  });
  
  const platformGeometry = new THREE.BoxGeometry(8, 0.15, 3);
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(0, 0.075, 1.5);
  platform.receiveShadow = true;
  platform.castShadow = true;
  scene.add(platform);

  // Yellow firing line
  const lineGeometry = new THREE.BoxGeometry(8, 0.02, 0.15);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const firingLine = new THREE.Mesh(lineGeometry, lineMaterial);
  firingLine.position.set(0, 0.16, 0.05);
  scene.add(firingLine);
}

function createStageWalls(scene) {
  const woodMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B7355,
    roughness: 0.85,
    metalness: 0.0
  });

  // Perimeter walls ( IPSC requires walls to define the stage)
  const wallConfigs = [
    // Back wall (behind targets)
    { x: 0, z: -12, width: 16, height: 2.5, depth: 0.15 },
    // Left side wall
    { x: -8, z: -5, width: 0.15, height: 2.5, depth: 14 },
    // Right side wall  
    { x: 8, z: -5, width: 0.15, height: 2.5, depth: 14 },
  ];

  wallConfigs.forEach(config => {
    const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
    const wall = new THREE.Mesh(geometry, woodMaterial);
    wall.position.set(config.x, config.height / 2, config.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // Shooting lane dividers (low walls)
  const laneDividerConfigs = [
    { x: -2.5, z: -4, width: 0.1, height: 1.0, depth: 8 },
    { x: 2.5, z: -4, width: 0.1, height: 1.0, depth: 8 },
  ];

  laneDividerConfigs.forEach(config => {
    const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
    const wall = new THREE.Mesh(geometry, woodMaterial);
    wall.position.set(config.x, config.height / 2, config.z);
    wall.castShadow = true;
    scene.add(wall);
  });

  // Barricade stations (VTAC style)
  createBarricade(scene, -5, 1.5);
  createBarricade(scene, 5, 1.5);

  // Backstop berm
  const bermMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 });
  const bermGeometry = new THREE.BoxGeometry(18, 2, 2);
  const berm = new THREE.Mesh(bermGeometry, bermMaterial);
  berm.position.set(0, 1, -13);
  berm.castShadow = true;
  scene.add(berm);
}

function createBarricade(scene, x, z) {
  const metalMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    metalness: 0.7,
    roughness: 0.4
  });
  
  const woodMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B7355,
    roughness: 0.85
  });

  // Angled shooting platform
  const platformGeo = new THREE.BoxGeometry(1.0, 0.08, 0.7);
  const platform = new THREE.Mesh(platformGeo, woodMaterial);
  platform.position.set(x, 0.7, z);
  platform.rotation.x = -0.4;
  platform.castShadow = true;
  scene.add(platform);

  // Support leg
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
  const leg = new THREE.Mesh(legGeo, metalMaterial);
  leg.position.set(x, 0.35, z + 0.25);
  scene.add(leg);

  // Shooting rest
  const restGeo = new THREE.BoxGeometry(0.6, 0.1, 0.08);
  const rest = new THREE.Mesh(restGeo, metalMaterial);
  rest.position.set(x, 0.95, z - 0.3);
  scene.add(rest);
}

function createIPSCTargets(scene) {
  // IPSC Standard Stage Layout - targets arranged in realistic course
  // No targets behind obstacles - clear shooting lanes
  const targetConfigs = [
    // Close targets (3m) - left lane
    { x: -3.5, y: 1.3, z: -3, angle: 0 },
    // Close targets (3m) - right lane
    { x: 3.5, y: 1.3, z: -3, angle: 0 },
    // Medium targets (5m) - left
    { x: -4.5, y: 1.25, z: -5, angle: 0 },
    // Medium targets (5m) - center
    { x: 0, y: 1.4, z: -5.5, angle: 0 },
    // Medium targets (5m) - right
    { x: 4.5, y: 1.25, z: -5, angle: 0 },
    // Far targets (7m) - left
    { x: -5, y: 1.2, z: -7, angle: 0 },
    // Far targets (7m) - right
    { x: 5, y: 1.2, z: -7, angle: 0 },
  ];

  targetConfigs.forEach((config, index) => {
    createOutdoorIPSCTarget(scene, config, index + 1);
  });
}

function createOutdoorIPSCTarget(scene, config, index) {
  // Target stand
  const frameGroup = new THREE.Group();
  frameGroup.position.set(config.x, 0, config.z);

  // Metal posts
  const postMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.4
  });
  const postGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.6, 8);
  
  const leftPost = new THREE.Mesh(postGeometry, postMaterial);
  leftPost.position.set(-0.32, 1.3, 0);
  leftPost.castShadow = true;
  frameGroup.add(leftPost);
  
  const rightPost = new THREE.Mesh(postGeometry, postMaterial);
  rightPost.position.set(0.32, 1.3, 0);
  rightPost.castShadow = true;
  frameGroup.add(rightPost);

  // IPSC Target
  const targetGroup = new THREE.Group();
  targetGroup.position.set(0, config.y, 0);

  // Main body (white A zone)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.14, 0.32);
  bodyShape.lineTo(0.14, 0.32);
  bodyShape.lineTo(0.17, 0.14);
  bodyShape.lineTo(0.11, -0.09);
  bodyShape.lineTo(0.17, -0.23);
  bodyShape.lineTo(0.11, -0.32);
  bodyShape.lineTo(-0.11, -0.32);
  bodyShape.lineTo(-0.17, -0.23);
  bodyShape.lineTo(-0.11, -0.09);
  bodyShape.lineTo(-0.17, 0.14);
  bodyShape.lineTo(-0.14, 0.32);

  const bodyGeometry = new THREE.ShapeGeometry(bodyShape);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    side: THREE.DoubleSide,
    roughness: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.z = 0.01;
  targetGroup.add(body);

  // Head
  const headGeometry = new THREE.CircleGeometry(0.07, 32);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 0.38, 0.02);
  targetGroup.add(head);

  // B zone (blue)
  const bZoneGeometry = new THREE.RingGeometry(0.18, 0.26, 32);
  const bZoneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0066cc, transparent: true, opacity: 0.5, side: THREE.DoubleSide
  });
  const bZone = new THREE.Mesh(bZoneGeometry, bZoneMaterial);
  bZone.position.set(0, 0.04, 0.03);
  targetGroup.add(bZone);

  // C zone (black)
  const cZoneGeometry = new THREE.RingGeometry(0.26, 0.32, 32);
  const cZoneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, transparent: true, opacity: 0.6, side: THREE.DoubleSide
  });
  const cZone = new THREE.Mesh(cZoneGeometry, cZoneMaterial);
  cZone.position.set(0, 0.04, 0.04);
  targetGroup.add(cZone);

  // D zone (brown)
  const dZoneGeometry = new THREE.RingGeometry(0.32, 0.42, 32);
  const dZoneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, transparent: true, opacity: 0.5, side: THREE.DoubleSide
  });
  const dZone = new THREE.Mesh(dZoneGeometry, dZoneMaterial);
  dZone.position.set(0, 0.04, 0.05);
  targetGroup.add(dZone);

  // Hit box
  const hitBoxGeo = new THREE.BoxGeometry(0.38, 0.55, 0.1);
  const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitBox.userData.isTarget = true;
  hitBox.userData.points = 10;
  targetGroup.add(hitBox);

  frameGroup.add(targetGroup);
  scene.add(frameGroup);
}

function createPoppers(scene) {
  const popperMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffaa00,
    metalness: 0.3,
    roughness: 0.6
  });

  // Steel poppers at known distances
  const popperConfigs = [
    { x: -1.5, z: -4, distance: 5 },  // 5m popper left
    { x: 1.5, z: -4, distance: 5 },   // 5m popper right
    { x: 0, z: -8, distance: 10 },    // 10m popper center
  ];

  popperConfigs.forEach(config => {
    const popperGroup = new THREE.Group();
    popperGroup.position.set(config.x, 0, config.z);

    // Popper body
    const shape = new THREE.Shape();
    shape.moveTo(-0.08, 0);
    shape.lineTo(0.08, 0);
    shape.lineTo(0.06, 0.2);
    shape.lineTo(-0.06, 0.2);
    shape.closePath();

    const extrudeSettings = { depth: 0.04, bevelEnabled: false };
    const popperGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const popper = new THREE.Mesh(popperGeo, popperMaterial);
    popper.rotation.x = -Math.PI / 2;
    popperGroup.add(popper);

    // Hit indicator
    const indicatorGeo = new THREE.CircleGeometry(0.04, 16);
    const indicatorMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    indicator.rotation.x = -Math.PI / 2;
    indicator.position.set(0, 0.21, 0);
    popperGroup.add(indicator);

    scene.add(popperGroup);
  });
}

function createProps(scene) {
  // Ammo table
  const tableMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321,
    roughness: 0.85
  });
  
  const tableTopGeo = new THREE.BoxGeometry(1.2, 0.04, 0.5);
  const tableTop = new THREE.Mesh(tableTopGeo, tableMaterial);
  tableTop.position.set(-6, 0.9, 0.5);
  tableTop.castShadow = true;
  scene.add(tableTop);

  // Table legs
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8);
  const legPositions = [
    { x: -6.5, z: 0.2 },
    { x: -5.5, z: 0.2 },
    { x: -6.5, z: 0.8 },
    { x: -5.5, z: 0.8 },
  ];
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, tableMaterial);
    leg.position.set(pos.x, 0.45, pos.z);
    scene.add(leg);
  });

  // Ammo boxes on table
  const ammoBoxMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
  const ammoBoxGeo = new THREE.BoxGeometry(0.2, 0.12, 0.12);
  
  for (let i = 0; i < 3; i++) {
    const ammoBox = new THREE.Mesh(ammoBoxGeo, ammoBoxMaterial);
    ammoBox.position.set(-6.2 + i * 0.22, 0.98, 0.5);
    ammoBox.castShadow = true;
    scene.add(ammoBox);
  }

  // Barrels (placed OUTSIDE shooting lanes - left and right sides)
  const barrelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcc6600,
    metalness: 0.2,
    roughness: 0.8
  });
  
  const barrelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.75, 16);
  
  // Left side barrels
  const barrel1 = new THREE.Mesh(barrelGeo, barrelMaterial);
  barrel1.position.set(-7, 0.375, -3);
  barrel1.castShadow = true;
  scene.add(barrel1);
  
  const barrel2 = new THREE.Mesh(barrelGeo, barrelMaterial);
  barrel2.position.set(-7, 0.375, -8);
  barrel2.castShadow = true;
  scene.add(barrel2);

  // Right side barrels
  const barrel3 = new THREE.Mesh(barrelGeo, barrelMaterial);
  barrel3.position.set(7, 0.375, -3);
  barrel3.castShadow = true;
  scene.add(barrel3);
  
  const barrel4 = new THREE.Mesh(barrelGeo, barrelMaterial);
  barrel4.position.set(7, 0.375, -8);
  barrel4.castShadow = true;
  scene.add(barrel4);
}

function createSafetySigns(scene) {
  // Distance markers on side wall
  const distances = [3, 5, 7, 10];
  distances.forEach((dist, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 64);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 124, 60);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${dist}m`, 64, 42);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(0.6, 0.3);
    const sign = new THREE.Mesh(geometry, material);
    sign.position.set(-7.9, 1.8, -3 - i * 2.5);
    sign.rotation.y = Math.PI / 2;
    scene.add(sign);
  });

  // 180-degree rule warning
  createWarningSign(scene, 0, 2.3, 0.5, '180° RULE', 'MUST NOT POINT UP RANGE');
}

function createWarningSign(scene, x, y, z, title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(0, 0, 400, 200);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 388, 188);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 44px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, 200, 80);
  ctx.font = '24px Arial';
  ctx.fillText(subtitle, 200, 140);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(2, 1);
  const sign = new THREE.Mesh(geometry, material);
  sign.position.set(x, y, z);
  scene.add(sign);
}

function createStartPosition(scene) {
  // Start position area marker
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.stroke();
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('START', 128, 120);
  ctx.font = '24px Arial';
  ctx.fillText('POSITION', 128, 160);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.CircleGeometry(0.7, 32);
  const startMarker = new THREE.Mesh(geometry, material);
  startMarker.rotation.x = -Math.PI / 2;
  startMarker.position.set(0, 0.01, 2.5);
  scene.add(startMarker);
}

function createOutdoorLighting(scene) {
  // Sunlight
  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
  sunLight.position.set(10, 20, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -15;
  sunLight.shadow.camera.right = 15;
  sunLight.shadow.camera.top = 15;
  sunLight.shadow.camera.bottom = -15;
  scene.add(sunLight);

  // Ambient
  const ambientLight = new THREE.AmbientLight(0x87ceeb, 0.5);
  scene.add(ambientLight);

  // Sky
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const skyCtx = skyCanvas.getContext('2d');
  const gradient = skyCtx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#1e90ff');
  gradient.addColorStop(0.5, '#87ceeb');
  gradient.addColorStop(1, '#b0e0e6');
  skyCtx.fillStyle = gradient;
  skyCtx.fillRect(0, 0, 512, 512);
  
  scene.background = new THREE.CanvasTexture(skyCanvas);
}
