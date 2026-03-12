import * as THREE from 'three';

export class BulletSystem {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.bulletSpeed = 30;
  }

  fire(position, direction, controller = null) {
    const bullet = {
      position: position.clone(),
      direction: direction.clone().normalize(),
      mesh: this.createBulletMesh(position),
      speed: this.bulletSpeed,
      lifetime: 2.0,
      controller: controller
    };
    
    this.scene.add(bullet.mesh);
    this.bullets.push(bullet);
    
    return bullet;
  }

  createBulletMesh(position) {
    const geometry = new THREE.SphereGeometry(0.02, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    return mesh;
  }

  update(deltaTime, targets, onHit, onMiss) {
    const bulletsToRemove = [];
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      if (!bullet || !bullet.mesh) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      bullet.lifetime -= deltaTime;
      
      if (bullet.lifetime <= 0) {
        bulletsToRemove.push(i);
        continue;
      }
      
      const movement = bullet.direction.clone().multiplyScalar(bullet.speed * deltaTime);
      bullet.position.add(movement);
      bullet.mesh.position.copy(bullet.position);
      
      const raycaster = new THREE.Raycaster(
        bullet.position.clone().sub(bullet.direction.clone().multiplyScalar(0.1)),
        bullet.direction
      );
      
      const intersects = raycaster.intersectObjects(targets, false);
      
      if (intersects.length > 0) {
        const hitTarget = intersects[0].object;
        onHit(hitTarget, bullet);
        bulletsToRemove.push(i);
      }
    }
    
    for (const index of bulletsToRemove) {
      this.removeBullet(index);
    }
  }

  removeBullet(bulletOrIndex) {
    let index;
    if (typeof bulletOrIndex === 'number') {
      index = bulletOrIndex;
    } else {
      index = this.bullets.indexOf(bulletOrIndex);
    }
    
    if (index === -1) return;
    
    const bullet = this.bullets[index];
    if (!bullet || !bullet.mesh) return;
    
    this.scene.remove(bullet.mesh);
    bullet.mesh.geometry.dispose();
    bullet.mesh.material.dispose();
    this.bullets.splice(index, 1);
  }

  clear() {
    while (this.bullets.length > 0) {
      this.removeBullet(0);
    }
  }

  getBulletCount() {
    return this.bullets.length;
  }
}
