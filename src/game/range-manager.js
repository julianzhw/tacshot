import * as THREE from 'three';

export class RangeManager {
  constructor(scene) {
    this.scene = scene;
    this.currentRange = 'menu';
    this.menuMesh = null;
    this.createMenu();
  }

  createMenu() {
    // Create a menu plane for range selection
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 512, 512);
    
    // Title
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TACSHOT', 256, 80);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('Select Range', 256, 130);
    
    // Indoor button
    ctx.fillStyle = '#2a4a6a';
    ctx.fillRect(80, 180, 352, 100);
    ctx.strokeStyle = '#00aaff';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 180, 352, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('INDOOR RANGE', 256, 245);
    
    // Outdoor button  
    ctx.fillStyle = '#2a4a3a';
    ctx.fillRect(80, 310, 352, 100);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.strokeRect(80, 310, 352, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('OUTDOOR RANGE', 256, 375);
    
    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial';
    ctx.fillText('Click to select range', 256, 470);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.menuMesh = new THREE.Mesh(geometry, material);
    this.menuMesh.position.set(0, 1.5, -1.5);
    this.menuMesh.userData.isMenu = true;
    this.menuMesh.userData.buttons = [
      { x: 80, y: 180, width: 352, height: 100, range: 'indoor' },
      { x: 80, y: 310, width: 352, height: 100, range: 'outdoor' }
    ];
    
    this.scene.add(this.menuMesh);
  }

  show() {
    if (this.menuMesh) {
      this.menuMesh.visible = true;
    }
  }

  hide() {
    if (this.menuMesh) {
      this.menuMesh.visible = false;
    }
  }

  handleClick(uv) {
    if (!this.menuMesh || !this.menuMesh.visible) return null;
    
    // UV coordinates need to be mapped to canvas coordinates
    const x = uv.x * 512;
    const y = (1 - uv.y) * 512;
    
    for (const button of this.menuMesh.userData.buttons) {
      if (x >= button.x && x <= button.x + button.width &&
          y >= button.y && y <= button.y + button.height) {
        return button.range;
      }
    }
    return null;
  }
}
