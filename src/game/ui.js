import * as THREE from 'three';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = null;
    this.comboText = null;
    this.timeText = null;
    this.waveText = null;
    this.crosshair = null;
    
    this.uiGroup = new THREE.Group();
    this.scene.add(this.uiGroup);
    
    this.createHUD();
  }

  createHUD() {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    this.context = canvas.getContext('2d');
    
    // Score display
    this.scoreTexture = new THREE.CanvasTexture(canvas);
    this.scoreTexture.needsUpdate = true;
    
    const scorePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 0.5),
      new THREE.MeshBasicMaterial({ 
        map: this.scoreTexture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    scorePlane.position.set(-1.5, 2.5, -3);
    scorePlane.rotation.y = 0.3;
    this.uiGroup.add(scorePlane);
    this.scorePlane = scorePlane;

    // Timer display
    this.timerTexture = new THREE.CanvasTexture(document.createElement('canvas'));
    this.timerTexture.needsUpdate = true;
    
    const timerPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.3),
      new THREE.MeshBasicMaterial({ 
        map: this.timerTexture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    timerPlane.position.set(1.2, 2.5, -3);
    timerPlane.rotation.y = -0.3;
    this.uiGroup.add(timerPlane);
    this.timerPlane = timerPlane;

    // Wave display
    this.waveTexture = new THREE.CanvasTexture(document.createElement('canvas'));
    this.waveTexture.needsUpdate = true;
    
    const wavePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.25),
      new THREE.MeshBasicMaterial({ 
        map: this.waveTexture,
        transparent: true,
        side: THREE.DoubleSide
      })
    );
    wavePlane.position.set(0, 2.8, -3);
    this.uiGroup.add(wavePlane);
    this.wavePlane = wavePlane;

    // Crosshair for VR controllers
    this.createCrosshair();

    this.updateScore(0, 1);
    this.updateTimer(60);
    this.updateWave(1);
  }

  createCrosshair() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#00ff88';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    
    const centerX = 64;
    const centerY = 64;
    const radius = 20;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX - radius - 10, centerY);
    ctx.lineTo(centerX - radius + 10, centerY);
    ctx.moveTo(centerX + radius - 10, centerY);
    ctx.lineTo(centerX + radius + 10, centerY);
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX, centerY - radius + 10);
    ctx.moveTo(centerX, centerY + radius - 10);
    ctx.lineTo(centerX, centerY + radius + 10);
    ctx.stroke();
    
    this.crosshairTexture = new THREE.CanvasTexture(canvas);
    
    this.crosshairGroup = new THREE.Group();
    this.scene.add(this.crosshairGroup);
  }

  addCrosshairToController(controller) {
    const crosshair = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.1),
      new THREE.MeshBasicMaterial({ 
        map: this.crosshairTexture,
        transparent: true,
        depthTest: false
      })
    );
    crosshair.position.set(0, 0, -0.5);
    controller.add(crosshair);
  }

  updateScore(score, combo) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    roundRect(ctx, 10, 10, 492, 236, 20);
    ctx.fill();
    
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 30, 70);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial';
    ctx.fillText(score.toString(), 30, 150);
    
    if (combo > 1) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(`x${combo.toFixed(1)} COMBO`, 30, 200);
    }
    
    this.scoreTexture.image = canvas;
    this.scoreTexture.needsUpdate = true;
  }

  updateTimer(time) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    roundRect(ctx, 10, 10, 236, 108, 15);
    ctx.fill();
    
    ctx.fillStyle = time <= 10 ? '#ff4444' : '#ffffff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(time.toString(), 128, 80);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '24px Arial';
    ctx.fillText('SEC', 128, 110);
    
    this.timerTexture.image = canvas;
    this.timerTexture.needsUpdate = true;
  }

  updateWave(wave) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    roundRect(ctx, 10, 10, 236, 108, 15);
    ctx.fill();
    
    ctx.fillStyle = '#8888ff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WAVE', 128, 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Arial';
    ctx.fillText(wave.toString(), 128, 100);
    
    this.waveTexture.image = canvas;
    this.waveTexture.needsUpdate = true;
  }

  showGameOver(finalScore) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 256, 150);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('FINAL SCORE', 256, 230);
    
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 96px Arial';
    ctx.fillText(finalScore.toString(), 256, 330);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '28px Arial';
    ctx.fillText('Pull trigger to restart', 256, 420);
    
    const gameOverTexture = new THREE.CanvasTexture(canvas);
    
    const gameOverPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ 
        map: gameOverTexture,
        transparent: true,
        depthTest: false
      })
    );
    gameOverPlane.position.set(0, 1.6, -2);
    this.scene.add(gameOverPlane);
    
    this.gameOverPlane = gameOverPlane;
  }

  hideGameOver() {
    if (this.gameOverPlane) {
      this.scene.remove(this.gameOverPlane);
      this.gameOverPlane = null;
    }
  }

  setVisible(visible) {
    this.uiGroup.visible = visible;
  }

  dispose() {
    this.scene.remove(this.uiGroup);
    if (this.gameOverPlane) {
      this.scene.remove(this.gameOverPlane);
      this.gameOverPlane = null;
    }
    this.scoreTexture.dispose();
    this.timerTexture.dispose();
    this.waveTexture.dispose();
    this.crosshairTexture.dispose();
  }
}
