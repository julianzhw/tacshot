import * as THREE from 'three';

export class Pistol {
  constructor(scene) {
    this.scene = scene;
    this.magazineSize = 12;
    this.currentAmmo = this.magazineSize;
    this.reloadTime = 2000;
    this.fireRate = 333;
    this.lastFireTime = 0;
    this.isReloading = false;
    this.recoilRecovery = 0.9;
    
    this.mesh = null;
    this.muzzleFlash = null;
    
    this.createModel();
  }

  createModel() {
    this.mesh = new THREE.Group();

    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.8
    });

    const gripMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a3a3a,
      roughness: 0.7,
      metalness: 0.5
    });

    const accentMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.9
    });

    const bodyGeometry = new THREE.BoxGeometry(0.035, 0.07, 0.14);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(body);

    const barrelGeometry = new THREE.CylinderGeometry(0.012, 0.015, 0.12, 16);
    const barrel = new THREE.Mesh(barrelGeometry, bodyMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.12;
    this.mesh.add(barrel);

    const gripGeometry = new THREE.BoxGeometry(0.03, 0.08, 0.04);
    const grip = new THREE.Mesh(gripGeometry, gripMaterial);
    grip.position.set(0, -0.06, 0.02);
    grip.rotation.x = 0.2;
    this.mesh.add(grip);

    const triggerGeometry = new THREE.BoxGeometry(0.008, 0.03, 0.015);
    const trigger = new THREE.Mesh(triggerGeometry, bodyMaterial);
    trigger.position.set(0, -0.02, 0.04);
    trigger.rotation.x = -0.3;
    this.mesh.add(trigger);
    this.trigger = trigger;

    const sightGeometry = new THREE.BoxGeometry(0.005, 0.015, 0.005);
    const sight = new THREE.Mesh(sightGeometry, accentMaterial);
    sight.position.set(0, 0.04, -0.06);
    this.mesh.add(sight);

    const railGeometry = new THREE.BoxGeometry(0.008, 0.015, 0.06);
    const rail1 = new THREE.Mesh(railGeometry, accentMaterial);
    rail1.position.set(0.018, 0.02, -0.02);
    this.mesh.add(rail1);
    
    const rail2 = new THREE.Mesh(railGeometry, accentMaterial);
    rail2.position.set(-0.018, 0.02, -0.02);
    this.mesh.add(rail2);

    this.mesh.rotation.x = -Math.PI / 8;
    this.mesh.position.set(0, -0.02, -0.05);
    
    this.originalRotation = this.mesh.rotation.x;
  }

  canFire() {
    const now = Date.now();
    return !this.isReloading && 
           this.currentAmmo > 0 && 
           now - this.lastFireTime >= this.fireRate;
  }

  fire() {
    if (!this.canFire()) {
      if (this.isReloading) {
        console.log('Reloading...');
      } else if (this.currentAmmo <= 0) {
        console.log('Out of ammo!');
        this.reload();
      }
      return false;
    }
    
    this.lastFireTime = Date.now();
    this.currentAmmo--;
    
    this.triggerRecoil();
    
    console.log(`Bang! ${this.currentAmmo}/${this.magazineSize}`);
    
    return true;
  }

  triggerRecoil() {
    this.mesh.rotation.x = this.originalRotation + 0.15;
    
    let recovery = 0;
    const recoverInterval = setInterval(() => {
      recovery += 0.02;
      this.mesh.rotation.x = this.originalRotation + 0.15 * Math.pow(this.recoilRecovery, recovery * 10);
      
      if (recovery >= 1) {
        clearInterval(recoverInterval);
        this.mesh.rotation.x = this.originalRotation;
      }
    }, 16);
  }

  reload() {
    if (this.isReloading || this.currentAmmo === this.magazineSize) {
      return;
    }
    
    this.isReloading = true;
    console.log('Reloading...');
    
    setTimeout(() => {
      this.currentAmmo = this.magazineSize;
      this.isReloading = false;
      console.log('Reload complete!');
    }, this.reloadTime);
  }

  getMuzzlePosition() {
    const worldPos = new THREE.Vector3();
    this.mesh.getWorldPosition(worldPos);
    worldPos.z -= 0.12;
    return worldPos;
  }

  getDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.getWorldQuaternion(new THREE.Quaternion()));
    return direction;
  }

  getAmmo() {
    return this.currentAmmo;
  }

  isReloadingNow() {
    return this.isReloading;
  }

  attachToGrip(grip) {
    grip.add(this.mesh);
  }

  dispose() {
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
