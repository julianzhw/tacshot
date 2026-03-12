import * as THREE from 'three';

export class GameManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 3;
    this.timeRemaining = 60;
    this.isPlaying = false;
    this.wave = 1;
    this.targets = [];
    this.lastHitTime = 0;
    this.comboTimeout = 2000;
    
    this.targetSpawnPositions = [
      { x: -3, y: 1.5, z: -5 },
      { x: 0, y: 1.5, z: -6 },
      { x: 3, y: 1.5, z: -5 },
      { x: -2, y: 2.2, z: -7 },
      { x: 2, y: 2.2, z: -7 },
      { x: -4, y: 1.0, z: -4 },
      { x: 4, y: 1.0, z: -4 },
    ];
  }

  startGame() {
    this.score = 0;
    this.combo = 1;
    this.timeRemaining = 60;
    this.isPlaying = true;
    this.wave = 1;
    this.targets = [];
    
    this.spawnWave();
    this.startTimer();
    
    console.log('Game Started!');
  }

  spawnWave() {
    const targetCount = 3 + this.wave * 2;
    const positions = this.shuffleArray([...this.targetSpawnPositions]);
    
    for (let i = 0; i < Math.min(targetCount, positions.length); i++) {
      this.spawnTarget(positions[i]);
    }
    
    console.log(`Wave ${this.wave} spawned with ${targetCount} targets`);
  }

  spawnTarget(position) {
    const size = 0.2 + Math.random() * 0.2;
    const geometry = new THREE.CylinderGeometry(size, size, 0.05, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.5,
      metalness: 0.3
    });
    
    const target = new THREE.Mesh(geometry, material);
    target.position.set(position.x, position.y, position.z);
    target.rotation.x = Math.PI / 2;
    target.castShadow = true;
    
    target.userData.isTarget = true;
    target.userData.points = Math.floor((1 - size) * 30) + 10;
    target.userData.size = size;
    target.userData.originalY = position.y;
    target.userData.moveOffset = Math.random() * Math.PI * 2;
    target.userData.moveSpeed = 0.5 + Math.random() * 0.5;
    target.userData.moveAmount = 0.2 + Math.random() * 0.3;
    
    this.scene.add(target);
    this.targets.push(target);
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.endGame();
      }
    }, 1000);
  }

  onTargetHit(target) {
    const now = Date.now();
    
    if (now - this.lastHitTime < this.comboTimeout) {
      this.combo = Math.min(this.combo + 0.1, this.maxCombo);
    } else {
      this.combo = 1;
    }
    this.lastHitTime = now;
    
    const points = Math.floor(target.userData.points * this.combo);
    this.score += points;
    
    console.log(`Hit! +${points} points (combo: ${this.combo.toFixed(1)}x)`);
    
    this.removeTarget(target);
    
    if (this.targets.length === 0) {
      this.wave++;
      this.timeRemaining += 10;
      this.spawnWave();
    }
  }

  onMiss() {
    this.combo = 1;
  }

  removeTarget(target) {
    const index = this.targets.indexOf(target);
    if (index > -1) {
      this.targets.splice(index, 1);
    }
    this.scene.remove(target);
    target.geometry.dispose();
    target.material.dispose();
  }

  endGame() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    
    console.log(`Game Over! Final Score: ${this.score}`);
    
    this.clearAllTargets();
  }

  clearAllTargets() {
    for (const target of this.targets) {
      this.scene.remove(target);
      target.geometry.dispose();
      target.material.dispose();
    }
    this.targets = [];
  }

  update(deltaTime) {
    for (const target of this.targets) {
      const offset = target.userData.moveOffset + Date.now() * 0.001 * target.userData.moveSpeed;
      target.position.y = target.userData.originalY + Math.sin(offset) * target.userData.moveAmount;
      target.rotation.z = Math.sin(offset * 0.5) * 0.1;
    }
  }

  getScore() {
    return this.score;
  }

  getCombo() {
    return this.combo;
  }

  getTime() {
    return this.timeRemaining;
  }

  getWave() {
    return this.wave;
  }

  isGamePlaying() {
    return this.isPlaying;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
