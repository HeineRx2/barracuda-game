// =========================================================================
// BARRACUDA USV — 3D ENGINE v6
// (Enemy Warships + Searchlights + 3D Missile Strikes + Drone Swarm + Sectors)
// =========================================================================

class Barracuda3DEngine {
  constructor(containerId, onClickCallback) {
    this.container = document.getElementById(containerId);
    this.onClickCallback = onClickCallback;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.boatModel = null;
    this.boatBaseY = 0;
    this.water = null;
    this.sky = null;
    this.sun = null;
    this.cloudsGroup = null;
    this.wakeParticles = [];
    this.moduleObjects = {};
    this.swarmDrones = [];

    // Shared pool geometries & materials (created once, reused forever)
    this._poolGeomDodeca = null;
    this._poolGeomSphere = null;
    this._poolMatFire = null;
    this._poolMatSmoke = null;
    this._poolMatExplosion = [];

    // Particle pools (pre-allocated, toggled via .visible)
    this._firePool = [];
    this._smokePool = [];
    this._explosionPool = [];

    // Enemy Warship on Horizon
    this.enemyShip = null;
    this.enemySearchlight = null;
    this.searchlightTarget = null;
    this.enemyFireParticles = [];
    this.isEnemyBurning = false;

    // 3D In-flight Missiles
    this.activeMissiles = [];
    this.explosionParticles = [];

    // Weather / Sector State
    this.currentSector = 'sector-1';
    this.weatherType = 'storm'; // 'storm', 'night', 'sunset', 'dawn'
    this.lightningTimer = 0;
    this.currentSkin = 'stealth';

    // Lightning system
    this.lightningFlashTimer = 0;
    this.lightningNextFlash = 3 + Math.random() * 8;
    this.lightningLight = null;
    this.lightningFlashIntensity = 0;

    // Rain particle system
    this.rainParticles = null;
    this.rainActive = false;

    // Ship damage state
    this.shipDamageLevel = 0; // 0-5, increases after each prestige
    this.shipFirePoints = [];

    this.cameraMode = 'orbit'; // 'orbit' or 'flir'
    this.flirZoom = 1.0;

    this.clock = new THREE.Clock();
    this.isDragging = false;
    this.mouseDownPos = { x: 0, y: 0 };
    this.prevMouse = { x: 0, y: 0 };

    this.targetRotation = { x: 0.30, y: -0.50 };
    this.currentRotation = { x: 0.30, y: -0.50 };
    this.bounceImpulse = 0.0;

    this.init();
  }

  init() {
    const W = this.container.clientWidth || window.innerWidth;
    const H = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x112836, 0.0035);

    this.camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 20000);
    this.camera.position.set(7, 4.5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    this.createAtmosphericSky();
    this.createWater();
    this.createWakeSystem();
    this.setupLighting();
    this.createEnemyWarship();
    this.createLightningSystem();
    this.createRainSystem();
    this.createParticlePools();
    this.loadGLBModel();
    this.setupEvents();
    this.animate();
  }

  // =========================================================================
  // ATMOSPHERIC SKY & VOLUMETRIC CLOUDS
  // =========================================================================
  createAtmosphericSky() {
    this.sky = new THREE.Sky();
    this.sky.scale.setScalar(12000);
    this.scene.add(this.sky);

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 2.2;
    skyUniforms['rayleigh'].value = 1.8;
    skyUniforms['mieCoefficient'].value = 0.004;
    skyUniforms['mieDirectionalG'].value = 0.82;

    const elevation = 25;
    const azimuth = 195;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    this.sun = new THREE.Vector3();
    this.sun.setFromSphericalCoords(1, phi, theta);
    skyUniforms['sunPosition'].value.copy(this.sun);

    // Procedural Clouds
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xc8dce8,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });

    const cloudGeom = new THREE.DodecahedronGeometry(1, 1);
    for (let i = 0; i < 24; i++) {
      const puffCluster = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(cloudGeom, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 60
        );
        const s = 30 + Math.random() * 50;
        puff.scale.set(s * 1.6, s * 0.4, s);
        puffCluster.add(puff);
      }

      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.2;
      const dist = 650 + Math.random() * 350;
      const height = 180 + Math.random() * 100;
      puffCluster.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
      this.cloudsGroup.add(puffCluster);
    }
    this.scene.add(this.cloudsGroup);
  }

  // =========================================================================
  // LIGHTNING FLASH SYSTEM
  // =========================================================================
  createLightningSystem() {
    this.lightningLight = new THREE.PointLight(0xeeeeff, 0, 500);
    this.lightningLight.position.set(200, 300, -100);
    this.scene.add(this.lightningLight);
  }

  updateLightning(dt) {
    if (this.weatherType !== 'storm') {
      this.lightningFlashIntensity = 0;
      if (this.lightningLight) this.lightningLight.intensity = 0;
      return;
    }

    this.lightningNextFlash -= dt;
    if (this.lightningNextFlash <= 0) {
      this.lightningNextFlash = 4 + Math.random() * 10;
      this.lightningFlashIntensity = 1.0;

      // Randomize lightning position
      if (this.lightningLight) {
        this.lightningLight.position.set(
          (Math.random() - 0.5) * 400,
          200 + Math.random() * 200,
          -50 + (Math.random() - 0.5) * 200
        );
      }

      // Play thunder with delay
      setTimeout(() => {
        if (window.tacticalAudio) window.tacticalAudio.playThunderCrack();
      }, 200 + Math.random() * 1500);
    }

    if (this.lightningFlashIntensity > 0) {
      // Rapid flicker effect
      const flicker = Math.random() > 0.3 ? this.lightningFlashIntensity : this.lightningFlashIntensity * 0.3;
      if (this.lightningLight) {
        this.lightningLight.intensity = flicker * 15;
      }
      this.lightningFlashIntensity -= dt * 4.0;
      if (this.lightningFlashIntensity < 0) this.lightningFlashIntensity = 0;
    } else {
      if (this.lightningLight) this.lightningLight.intensity = 0;
    }
  }

  // =========================================================================
  // RAIN PARTICLE SYSTEM
  // =========================================================================
  createRainSystem() {
    const rainCount = 3000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    const velocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      velocities[i] = 15 + Math.random() * 10;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rainGeo.userData = { velocities: velocities };

    const rainMat = new THREE.PointsMaterial({
      color: 0xaaccdd,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
    this.rainActive = false;
  }

  updateRain(dt) {
    if (!this.rainParticles) return;

    const shouldRain = this.weatherType === 'storm' || this.weatherType === 'night';
    this.rainParticles.visible = shouldRain;
    if (!shouldRain) return;

    const positions = this.rainParticles.geometry.attributes.position.array;
    const velocities = this.rainParticles.geometry.userData.velocities;

    for (let i = 0; i < velocities.length; i++) {
      positions[i * 3 + 1] -= velocities[i] * dt;

      // Add slight wind effect
      positions[i * 3] += (this.weatherType === 'storm' ? 2.0 : 0.5) * dt;

      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 35 + Math.random() * 5;
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      }
    }

    this.rainParticles.geometry.attributes.position.needsUpdate = true;
  }

  // =========================================================================
  // PARTICLE POOL SYSTEM — eliminates GPU memory leaks
  // =========================================================================
  createParticlePools() {
    // Shared geometries (ONE instance each)
    this._poolGeomDodeca = new THREE.DodecahedronGeometry(0.5, 0);
    this._poolGeomSphere = new THREE.SphereGeometry(0.15, 6, 6);
    this._poolGeomBlast = new THREE.DodecahedronGeometry(0.8, 1);

    // Fire pool (burning warship) — 40 meshes
    for (let i = 0; i < 40; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(this._poolGeomDodeca, mat);
      mesh.visible = false;
      mesh.userData = { vy: 0, life: 0, maxLife: 0, active: false };
      this.scene.add(mesh);
      this._firePool.push(mesh);
    }

    // Smoke pool (missile trails) — 30 meshes
    for (let i = 0; i < 30; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(this._poolGeomSphere, mat);
      mesh.visible = false;
      mesh.userData = { life: 0, maxLife: 0, active: false };
      this.scene.add(mesh);
      this._smokePool.push(mesh);
    }

    // Explosion pool — 30 meshes
    for (let i = 0; i < 30; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0 });
      const mesh = new THREE.Mesh(this._poolGeomBlast, mat);
      mesh.visible = false;
      mesh.userData = { vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0, active: false };
      this.scene.add(mesh);
      this._explosionPool.push(mesh);
    }
  }

  _acquireFromPool(pool) {
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].userData.active) return pool[i];
    }
    return null; // pool exhausted — skip particle
  }

  _releaseToPool(mesh) {
    mesh.visible = false;
    mesh.userData.active = false;
    mesh.scale.set(1, 1, 1);
  }

  // =========================================================================
  // SHIP DAMAGE VISUALIZATION
  // =========================================================================
  updateShipDamage(damageLevel) {
    this.shipDamageLevel = Math.min(5, damageLevel);
  }

  // =========================================================================
  // REALISTIC OCEAN WATER
  // =========================================================================
  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(6000, 6000);

    this.water = new THREE.Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        'assets/waternormals.jpg',
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: this.sun.clone().normalize(),
      sunColor: 0xfff0d0,
      waterColor: 0x061824,
      distortionScale: 3.2,
      fog: true
    });

    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0.0;
    this.scene.add(this.water);
  }

  // =========================================================================
  // WATERJET WAKE PARTICLES
  // =========================================================================
  createWakeSystem() {
    this.wakeGroup = new THREE.Group();
    this.scene.add(this.wakeGroup);

    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xd0f0ff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    const wakeGeom = new THREE.CircleGeometry(0.12, 8);
    wakeGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < 35; i++) {
      const p = new THREE.Mesh(wakeGeom, wakeMat.clone());
      p.visible = false;
      p.userData = { life: 0, maxLife: 1.2, vx: 0, vz: 0 };
      this.wakeGroup.add(p);
      this.wakeParticles.push(p);
    }
  }

  emitWakeParticle(originX, originZ, speedMultiplier = 1.0) {
    const p = this.wakeParticles.find(item => !item.visible);
    if (p) {
      p.visible = true;
      p.position.set(originX + (Math.random() - 0.5) * 0.15, 0.02, originZ - 0.2);
      p.scale.set(1, 1, 1);
      p.material.opacity = 0.45;
      p.userData.life = 0;
      p.userData.maxLife = 0.8 + Math.random() * 0.4;
      p.userData.vz = (-0.8 - Math.random() * 0.6) * speedMultiplier;
      p.userData.vx = (Math.random() - 0.5) * 0.3;
    }
  }

  // =========================================================================
  // LIGHTING
  // =========================================================================
  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xbadcf2, 0x0a1e28, 1.1);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffae8, 2.6);
    this.sunLight.position.set(12, 18, 14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -6;
    this.sunLight.shadow.camera.right = 6;
    this.sunLight.shadow.camera.top = 6;
    this.sunLight.shadow.camera.bottom = -6;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x4080a0, 0.9);
    this.fillLight.position.set(-10, 8, -8);
    this.scene.add(this.fillLight);

    this.greenGlow = new THREE.PointLight(0x00ff66, 1.2, 8, 1.8);
    this.greenGlow.position.set(0, 0.6, 0);
    this.scene.add(this.greenGlow);

    this.ambientLight = new THREE.AmbientLight(0x182c38, 0.7);
    this.scene.add(this.ambientLight);
  }

  // =========================================================================
  // 3D ENEMY WARSHIP ON HORIZON + SEARCHLIGHT
  // =========================================================================
  createEnemyWarship() {
    this.enemyShip = new THREE.Group();

    const warshipGreyMat = new THREE.MeshStandardMaterial({ color: 0x3a444c, roughness: 0.35, metalness: 0.75 });
    const darkDeckMat = new THREE.MeshStandardMaterial({ color: 0x222a30, roughness: 0.5, metalness: 0.6 });
    const radomeMat = new THREE.MeshStandardMaterial({ color: 0xe0e8f0, roughness: 0.1, metalness: 0.8 });

    // Main Warship Hull (Corvette / Frigate silhouette)
    const hullGeom = new THREE.BoxGeometry(7, 3.5, 38);
    const hull = new THREE.Mesh(hullGeom, warshipGreyMat);
    hull.position.y = 0.5;
    this.enemyShip.add(hull);

    // Bow Wedge
    const bowGeom = new THREE.CylinderGeometry(0.1, 3.5, 10, 4);
    bowGeom.rotateX(Math.PI / 2);
    bowGeom.rotateY(Math.PI / 4);
    const bow = new THREE.Mesh(bowGeom, warshipGreyMat);
    bow.position.set(0, 0.5, 23);
    this.enemyShip.add(bow);

    // Superstructure & Bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.0, 14), warshipGreyMat);
    bridge.position.set(0, 4.0, 2);
    this.enemyShip.add(bridge);

    const bridgeWindows = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.6, 3),
      new THREE.MeshStandardMaterial({ color: 0x051520, roughness: 0.05, metalness: 0.95, emissive: 0x00e5ff, emissiveIntensity: 0.4 })
    );
    bridgeWindows.position.set(0, 5.0, 7.5);
    this.enemyShip.add(bridgeWindows);

    // Radar Mast & Rotating Phased Array
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 7.0, 8), darkDeckMat);
    mast.position.set(0, 8.5, 0);
    this.enemyShip.add(mast);

    this.enemyRadarDish = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.2), radomeMat);
    this.enemyRadarDish.position.set(0, 12.0, 0);
    this.enemyShip.add(this.enemyRadarDish);

    // Naval Gun Turret on Bow
    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 12), darkDeckMat);
    turretBase.position.set(0, 2.8, 14);
    const turretBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5, 8), darkDeckMat);
    turretBarrel.rotation.x = Math.PI / 2.3;
    turretBarrel.position.set(0, 0.4, 2.5);
    turretBase.add(turretBarrel);
    this.enemyShip.add(turretBase);

    // Searchlight on Bridge Roof
    this.searchlightMount = new THREE.Group();
    this.searchlightMount.position.set(0, 6.5, 7);

    const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.8, 12), darkDeckMat);
    lampHousing.rotation.x = Math.PI / 2;
    this.searchlightMount.add(lampHousing);

    // Spotlight cone beam
    this.enemySearchlight = new THREE.SpotLight(0xfffae0, 5.0, 180, Math.PI / 9, 0.4, 1.5);
    this.enemySearchlight.position.set(0, 0, 0.5);
    this.searchlightTarget = new THREE.Object3D();
    this.searchlightTarget.position.set(0, 0, 80);
    this.scene.add(this.searchlightTarget);
    this.enemySearchlight.target = this.searchlightTarget;
    this.searchlightMount.add(this.enemySearchlight);

    this.enemyShip.add(this.searchlightMount);

    // Position enemy warship on horizon
    this.enemyShip.position.set(38, -0.6, -75);
    this.enemyShip.rotation.y = THREE.MathUtils.degToRad(-135);
    this.enemyShip.scale.setScalar(0.75);
    this.scene.add(this.enemyShip);
  }

  // =========================================================================
  // 3D MISSILE STRIKE ENGINE
  // =========================================================================
  launchMissileStrike(onImpactCallback) {
    if (!this.boatModel) return;

    window.tacticalAudio.playMissileLaunch();

    // === FPV DRONE MODEL ===
    const drone = new THREE.Group();

    // Central body — flat rectangular frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.8 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.35), frameMat);
    drone.add(frame);

    // Warhead nose (orange-tipped)
    const warheadMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.3, metalness: 0.5 });
    const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 6), warheadMat);
    warhead.rotation.x = -Math.PI / 2;
    warhead.position.z = -0.25;
    drone.add(warhead);

    // 4 motor arms (X-config)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.7 });
    const armPositions = [
      { x: 0.25, z: 0.15 }, { x: -0.25, z: 0.15 },
      { x: 0.25, z: -0.15 }, { x: -0.25, z: -0.15 }
    ];

    const propellers = [];
    armPositions.forEach(pos => {
      // Arm strut
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), armMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(pos.x * 0.5, 0.04, pos.z);
      drone.add(arm);

      // Propeller disc
      const propMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4 });
      const prop = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), propMat);
      prop.rotation.x = -Math.PI / 2;
      prop.position.set(pos.x, 0.08, pos.z);
      drone.add(prop);
      propellers.push(prop);
    });

    // LED light
    const led = new THREE.PointLight(0x00ff44, 1.5, 5);
    led.position.set(0, -0.05, 0.15);
    drone.add(led);

    // Thruster glow (rear)
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.6 });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), glowMat);
    glow.position.z = 0.2;
    drone.add(glow);

    // Start position at drone deck/stanchions
    drone.position.copy(this.boatModel.position);
    drone.position.y += 0.3;
    drone.position.z -= 0.5;

    const liftOffPos = drone.position.clone();
    liftOffPos.y += 3.0; // Lift off height

    const targetPos = this.enemyShip ? this.enemyShip.position.clone() : new THREE.Vector3(38, 2, -75);
    targetPos.y += 2.5;

    this.scene.add(drone);
    this.activeMissiles.push({
      mesh: drone,
      propellers: propellers,
      glowMesh: glow,
      startPos: drone.position.clone(),
      liftOffPos: liftOffPos,
      targetPos: targetPos,
      progress: 0,
      duration: 3.5, // Slower flight
      phase: 'liftoff', // liftoff -> cruise
      onImpact: onImpactCallback
    });

    this.triggerClickBounce();
  }
  triggerShipExplosion() {
    // Big explosion on the target warship
    const shipPos = this.enemyShip ? this.enemyShip.position.clone() : new THREE.Vector3(38, -0.6, -75);
    this.create3DExplosion(shipPos);
    // Create secondary explosions
    setTimeout(() => this.create3DExplosion(shipPos.clone().add(new THREE.Vector3(3, 2, -5))), 200);
    setTimeout(() => this.create3DExplosion(shipPos.clone().add(new THREE.Vector3(-4, 1, 3))), 400);
  }

  create3DExplosion(pos) {
    window.tacticalAudio.playExplosion();

    // Trigger burning on warship
    this.isEnemyBurning = true;

    // Flash light (reuse single light)
    if (!this._blastLight) {
      this._blastLight = new THREE.PointLight(0xffaa22, 0, 50, 1.2);
      this.scene.add(this._blastLight);
    }
    this._blastLight.position.copy(pos);
    this._blastLight.position.y += 3;
    this._blastLight.intensity = 12.0;
    setTimeout(() => { if (this._blastLight) this._blastLight.intensity = 0; }, 500);

    // Blast particles from pool
    for (let i = 0; i < 28; i++) {
      const p = this._acquireFromPool(this._explosionPool);
      if (!p) break;
      p.visible = true;
      p.userData.active = true;
      p.position.copy(pos);
      p.scale.set(1, 1, 1);
      p.material.color.setHex(Math.random() > 0.4 ? 0xff4400 : 0xffcc00);
      p.material.opacity = 0.95;
      p.userData.vx = (Math.random() - 0.5) * 35;
      p.userData.vy = Math.random() * 25 + 8;
      p.userData.vz = (Math.random() - 0.5) * 35;
      p.userData.life = 0;
      p.userData.maxLife = 0.9 + Math.random() * 0.6;
    }
  }

  // =========================================================================
  // DRONE SWARM ESCORTS (Formation Escort Fleet)
  // =========================================================================
  updateSwarmEscorts(active) {
    if (!this.boatModel) return;

    if (active && this.swarmDrones.length === 0) {
      const offsets = [
        { x: -3.8, z: -2.2 },
        { x: 3.8, z: -2.2 }
      ];

      offsets.forEach((off, idx) => {
        const droneEscort = new THREE.Group();
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x12171a, roughness: 0.3, metalness: 0.85 });
        const domeMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.1, metalness: 0.9, emissive: 0x00e5ff, emissiveIntensity: 0.4 });

        const hull = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 2.2), hullMat);
        droneEscort.add(hull);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), domeMat);
        dome.position.set(0, 0.16, 0.2);
        droneEscort.add(dome);

        droneEscort.userData = { offsetX: off.x, offsetZ: off.z, index: idx };
        this.scene.add(droneEscort);
        this.swarmDrones.push(droneEscort);
      });
    } else if (!active && this.swarmDrones.length > 0) {
      this.swarmDrones.forEach(d => this.scene.remove(d));
      this.swarmDrones = [];
    }
  }

  // =========================================================================
  // SECTORS & WEATHER ENGINE
  // =========================================================================
  setWeatherSector(sectorId) {
    this.currentSector = sectorId;
    const skyUniforms = this.sky.material.uniforms;

    switch (sectorId) {
      case 'c1': // Snake Island (Storm)
      case 'sector-1':
        this.weatherType = 'storm';
        this.scene.fog.color.setHex(0x10222e);
        this.scene.fog.density = 0.0035;
        this.water.material.uniforms['waterColor'].value.setHex(0x061824);
        skyUniforms['turbidity'].value = 3.5;
        skyUniforms['rayleigh'].value = 2.4;
        this.sunLight.intensity = 2.2;
        this.sunLight.color.setHex(0xffe0c0);
        break;

      case 'c2': // Sevastopol (Night Infiltration)
      case 'sector-2':
        this.weatherType = 'night';
        this.scene.fog.color.setHex(0x030810);
        this.scene.fog.density = 0.005;
        this.water.material.uniforms['waterColor'].value.setHex(0x02070e);
        skyUniforms['turbidity'].value = 8.0;
        skyUniforms['rayleigh'].value = 0.2;
        this.sunLight.intensity = 0.6;
        this.sunLight.color.setHex(0x5588cc);
        this.greenGlow.intensity = 2.4;
        break;

      case 'sector-3': // Novorossiysk (Sunset Firestorm)
        this.weatherType = 'sunset';
        this.scene.fog.color.setHex(0x381814);
        this.scene.fog.density = 0.003;
        this.water.material.uniforms['waterColor'].value.setHex(0x180808);
        skyUniforms['turbidity'].value = 4.0;
        skyUniforms['rayleigh'].value = 4.5;
        this.sunLight.intensity = 3.0;
        this.sunLight.color.setHex(0xff6622);
        break;

      case 'sector-4': // Kerch (Naval Mist)
        this.weatherType = 'dawn';
        this.scene.fog.color.setHex(0x1a2e38);
        this.scene.fog.density = 0.0045;
        this.water.material.uniforms['waterColor'].value.setHex(0x0c202a);
        skyUniforms['turbidity'].value = 2.0;
        skyUniforms['rayleigh'].value = 2.0;
        this.sunLight.intensity = 2.4;
        this.sunLight.color.setHex(0xfff8ee);
        break;
    }
  }

  // =========================================================================
  // LOAD GLB MODEL & HARDPOINT SETUP
  // =========================================================================
  loadGLBModel() {
    const loader = new THREE.GLTFLoader();
    loader.load(
      'assets/barracuda.glb',
      (gltf) => {
        try {
          this.boatModel = gltf.scene;

          const box = new THREE.Box3().setFromObject(this.boatModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const targetSize = 5.2;
          const scale = targetSize / maxDim;

          // Store scale for module positioning
          this.modelScale = scale;
          this.modelBBox = { min: box.min.clone(), max: box.max.clone(), size: size.clone(), center: center.clone() };

          this.boatModel.scale.setScalar(scale);
          const bottomY = box.min.y * scale;
          const hullDepth = size.y * scale * 0.35;
          this.boatModel.position.set(
            -center.x * scale,
            -bottomY - hullDepth,
            -center.z * scale
          );

          this.scene.add(this.boatModel);
          this.boatBaseY = this.boatModel.position.y;

          console.log('[BARRACUDA 3D] Model loaded. Scale:', scale.toFixed(4), 'BBox size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2));

          this.boatModel.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                if (child.material.color) {
                  const c = child.material.color;
                  child.material.color.setRGB(c.r * 0.70, c.g * 0.70, c.b * 0.72);
                }
                child.material.roughness = Math.max(0.2, (child.material.roughness || 0.5) * 0.85);
                child.material.metalness = Math.min(0.85, (child.material.metalness || 0.5) + 0.15);
                if (child.material.map && child.material.map.image) {
                  this.cleanTexture(child);
                }
                child.material.needsUpdate = true;
              }
            }
          });

          if (window.barracudaGame) {
            this.syncActiveUpgrades(window.barracudaGame.hw, window.barracudaGame.cyber);
          }

        } catch (e) {
          console.error('Error during 3D model initialization:', e);
        }
      },
      undefined,
      (err) => console.error('Failed to load GLB:', err)
    );
  }

  cleanTexture(meshChild) {
    try {
      const oldTex = meshChild.material.map;
      if (!oldTex) return;
      const img = oldTex.image;
      if (!img || !img.width || !img.height) return;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 160) {
          data[i] = Math.floor(data[i] * 0.2);
          data[i + 1] = Math.floor(data[i + 1] * 0.2);
          data[i + 2] = Math.floor(data[i + 2] * 0.2);
        }
      }
      ctx.putImageData(imageData, 0, 0);

      const fs = Math.floor(canvas.width * 0.035);
      ctx.font = `italic 900 ${fs}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(0, 150, 80, 0.7)';
      ctx.fillText('BARRACUDA', canvas.width * 0.32, canvas.height * 0.48);

      const newTex = new THREE.CanvasTexture(canvas);
      newTex.flipY = oldTex.flipY;
      meshChild.material.map = newTex;
    } catch (e) {
      console.warn('cleanTexture skipped:', e);
    }
  }

  syncActiveUpgrades(hw, cyber) {
    console.log('[MODULE] syncActiveUpgrades hw:', JSON.stringify(hw), 'cyber:', JSON.stringify(cyber));
    if (hw) {
      Object.keys(hw).forEach(k => {
        if (hw[k] > 0) this.addModule(k);
      });
    }
    if (cyber) {
      Object.keys(cyber).forEach(k => {
        if (cyber[k] > 0) this.addModule(k);
      });
    }
  }

  // =========================================================================
  // MODULES — added directly to scene, position synced to boat each frame
  // =========================================================================
  addModule(moduleId) {
    if (!this.boatModel || this.moduleObjects[moduleId]) return;

    const group = new THREE.Group();
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x14181c, roughness: 0.25, metalness: 0.85 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.15, metalness: 0.95 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x052030, roughness: 0.05, metalness: 0.98, emissive: 0x00e5ff, emissiveIntensity: 0.35 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3, metalness: 0.4 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x004466, roughness: 0.1, metalness: 0.9, emissive: 0x00e5ff, emissiveIntensity: 0.75 });

    let oX = 0, oY = 0.15, oZ = 0;

    switch (moduleId) {
      case 'missiles': {
        // Missile rack platform
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.9), carbonMat));
        // Launch rails
        const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.0), metalMat);
        railL.position.set(-0.25, 0.05, 0); railL.rotation.x = -0.15; group.add(railL);
        const railR = railL.clone(); railR.position.x = 0.25; group.add(railR);
        // Kamikaze drones
        [-0.25, 0.25].forEach(px => {
          const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), yellowMat);
          wh.rotation.x = Math.PI / 2; wh.position.set(px, 0.14, 0.05);
          group.add(wh);
          const led = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
          led.position.set(px, 0.17, -0.08); group.add(led);
        });
        oY = 0.22; oZ = -1.2;
        break;
      }
      case 'optics': {
        // Turret pedestal
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.08, 16), metalMat));
        // Turret head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), carbonMat);
        head.position.y = 0.12; group.add(head);
        // Lens
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14), metalMat);
        lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.13, 0.12); group.add(lens);
        const optic = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), glassMat);
        optic.position.set(0, 0.13, 0.15); group.add(optic);
        // Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), metalMat);
        barrel.rotation.x = Math.PI / 2; barrel.position.set(0.07, 0.11, 0.2); group.add(barrel);
        oY = 0.22; oZ = 1.0;
        break;
      }
      case 'armor': {
        const armorMat = new THREE.MeshStandardMaterial({ color: 0x1c2126, roughness: 0.35, metalness: 0.85 });
        // Side armor plates
        const plateL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 3.0), armorMat);
        plateL.position.set(0.55, 0, -0.2); plateL.rotation.z = -0.1; group.add(plateL);
        const plateR = plateL.clone(); plateR.position.x = -0.55; plateR.rotation.z = 0.1; group.add(plateR);
        // Bow reinforcement
        const bow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.05), armorMat);
        bow.position.set(0, 0.06, 1.6); bow.rotation.x = 0.3; group.add(bow);
        oY = 0.04; oZ = 0;
        break;
      }
      case 'waterjets': {
        const ng = new THREE.CylinderGeometry(0.06, 0.10, 0.30, 12);
        ng.rotateX(Math.PI / 2);
        const nL = new THREE.Mesh(ng, metalMat);
        nL.position.set(-0.22, 0, -0.15); group.add(nL);
        const nR = nL.clone(); nR.position.x = 0.22; group.add(nR);
        // Inner glow
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.4 });
        const glL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), glowMat);
        glL.rotateX(Math.PI / 2); glL.position.set(-0.22, 0, -0.30); group.add(glL);
        const glR = glL.clone(); glR.position.x = 0.22; group.add(glR);
        oY = -0.06; oZ = -2.1;
        break;
      }
      case 'satcom': {
        // Mast
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.55, 8), metalMat);
        mast.position.y = 0.28; group.add(mast);
        // Dome base
        const dBase = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.03, 16), carbonMat);
        dBase.position.y = 0.55; group.add(dBase);
        // Dome
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
        dome.position.y = 0.56; group.add(dome);
        oY = 0.22; oZ = -0.4;
        break;
      }
      case 'sniffer': {
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.10), metalMat));
        for (let i = 0; i < 3; i++) {
          const bl = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.25, 0.035), carbonMat);
          bl.position.set((i - 1) * 0.04, 0.14, 0); bl.rotation.z = (i - 1) * 0.08;
          group.add(bl);
        }
        oX = 0.35; oY = 0.22; oZ = 0.3;
        break;
      }
      case 'quantum': {
        group.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), carbonMat));
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), cyanMat);
        core.position.y = 0.04; core.rotation.y = Math.PI / 4; group.add(core);
        oX = -0.35; oY = 0.22; oZ = 0.2;
        break;
      }
      case 'autosiphon': {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.20, 8), metalMat);
        stand.position.y = 0.10; group.add(stand);
        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), metalMat);
        dish.rotation.x = Math.PI * 0.8; dish.position.y = 0.22;
        dish.name = 'siphon_dish'; group.add(dish);
        oX = 0.25; oY = 0.22; oZ = -0.8;
        break;
      }
      default: return;
    }

    group.userData = { modOffset: { x: oX, y: oY, z: oZ } };
    group.position.set(
      this.boatModel.position.x + oX,
      this.boatModel.position.y + oY,
      this.boatModel.position.z + oZ
    );

    this.scene.add(group);
    this.moduleObjects[moduleId] = group;
  }

  updateUpgrades(upgrades) {
    if (this.greenGlow) {
      this.greenGlow.intensity = 1.0 + ((upgrades.prestige || 0) * 0.35);
    }
  }

  triggerClickBounce() {
    this.bounceImpulse = 1.0;
  }

  // =========================================================================
  // TOUCH & MOUSE EVENTS
  // =========================================================================
  setupEvents() {
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = false;
      this.mouseDownPos = { x: e.clientX, y: e.clientY };
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (Math.hypot(e.clientX - this.mouseDownPos.x, e.clientY - this.mouseDownPos.y) > 6 && e.buttons === 1) {
        this.isDragging = true;
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;
        this.targetRotation.y -= dx * 0.007;
        this.targetRotation.x = Math.max(0.05, Math.min(1.1, this.targetRotation.x - dy * 0.007));
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    dom.addEventListener('mouseup', (e) => {
      if (Math.hypot(e.clientX - this.mouseDownPos.x, e.clientY - this.mouseDownPos.y) < 8) {
        this.bounceImpulse = 1.0;
        if (this.onClickCallback) this.onClickCallback(e.clientX, e.clientY);
      }
      this.isDragging = false;
    });

    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.mouseDownPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.prevMouse = { ...this.mouseDownPos };
        this.isDragging = false;
      }
    }, { passive: true });

    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        if (Math.hypot(e.touches[0].clientX - this.mouseDownPos.x, e.touches[0].clientY - this.mouseDownPos.y) > 6) {
          this.isDragging = true;
          const dx = e.touches[0].clientX - this.prevMouse.x;
          const dy = e.touches[0].clientY - this.prevMouse.y;
          this.targetRotation.y -= dx * 0.008;
          this.targetRotation.x = Math.max(0.05, Math.min(1.1, this.targetRotation.x - dy * 0.008));
          this.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }
    }, { passive: true });

    dom.addEventListener('touchend', (e) => {
      if (!this.isDragging && e.changedTouches.length === 1) {
        this.bounceImpulse = 1.0;
        if (this.onClickCallback) this.onClickCallback(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      this.isDragging = false;
    });
  }

  // =========================================================================
  // ANIMATION LOOP
  // =========================================================================
  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();
    const dt = 0.016;

    // Camera orbit or FLIR scope targeting mode
    if (this.cameraMode === 'flir') {
      // Look directly through thermal FLIR optic towards enemy ship
      const shipPos = this.enemyShip ? this.enemyShip.position : new THREE.Vector3(38, 2, -75);
      this.camera.position.set(0, 2.2, 2.5);
      this.camera.lookAt(shipPos.x, shipPos.y + 3, shipPos.z);
    } else {
      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;
      const R = 10.5;
      this.camera.position.x = R * Math.sin(this.currentRotation.y) * Math.cos(this.currentRotation.x);
      this.camera.position.z = R * Math.cos(this.currentRotation.y) * Math.cos(this.currentRotation.x);
      this.camera.position.y = R * Math.sin(this.currentRotation.x);
      this.camera.lookAt(0, 0.25, 0);
    }

    // Lightning
    this.updateLightning(dt);

    // Rain
    this.updateRain(dt);

    // Clouds
    if (this.cloudsGroup) {
      this.cloudsGroup.rotation.y = t * 0.008;
    }

    // Water
    if (this.water) {
      this.water.material.uniforms['time'].value += 0.16 / 60.0;
    }

    // Enemy Warship animation & searchlight sweep
    if (this.enemyShip) {
      const shipHeave = Math.sin(t * 1.0 + 1.5) * 0.15;
      const shipRoll = Math.cos(t * 0.8) * 0.02;
      this.enemyShip.position.y = -0.6 + shipHeave;
      this.enemyShip.rotation.z = shipRoll;

      if (this.enemyRadarDish) {
        this.enemyRadarDish.rotation.y = t * 2.5;
      }

      // Searchlight beam sweep
      if (this.searchlightTarget) {
        const sweepAngle = Math.sin(t * 0.8) * 45;
        this.searchlightTarget.position.x = Math.sin(sweepAngle * (Math.PI / 180)) * 60;
        this.searchlightTarget.position.z = Math.cos(sweepAngle * (Math.PI / 180)) * 60;
      }

      // Burning smoke / fire if hit — uses pool
      if (this.isEnemyBurning && Math.random() > 0.3) {
        const flame = this._acquireFromPool(this._firePool);
        if (flame) {
          flame.visible = true;
          flame.userData.active = true;
          flame.scale.set(1, 1, 1);
          flame.material.color.setHex(Math.random() > 0.5 ? 0xff3300 : 0x222222);
          flame.material.opacity = 0.8;
          flame.position.set(
            this.enemyShip.position.x + (Math.random() - 0.5) * 4,
            this.enemyShip.position.y + 4 + Math.random() * 2,
            this.enemyShip.position.z + (Math.random() - 0.5) * 10
          );
          flame.userData.vy = 2.5 + Math.random() * 2;
          flame.userData.life = 0;
          flame.userData.maxLife = 1.5;
          this.enemyFireParticles.push(flame);
        }
      }
    }

    // Update enemy burning fire particles — pool-based
    for (let i = this.enemyFireParticles.length - 1; i >= 0; i--) {
      const p = this.enemyFireParticles[i];
      p.userData.life += dt;
      p.position.y += p.userData.vy * dt;
      p.scale.multiplyScalar(1.02);
      p.material.opacity = Math.max(0, (1.0 - p.userData.life / p.userData.maxLife) * 0.7);
      if (p.userData.life >= p.userData.maxLife) {
        this._releaseToPool(p);
        this.enemyFireParticles.splice(i, 1);
      }
    }

    // Update 3D In-flight FPV Drones
    for (let i = this.activeMissiles.length - 1; i >= 0; i--) {
      const m = this.activeMissiles[i];
      m.progress += dt / m.duration;

      // Spin propellers
      if (m.propellers) {
        m.propellers.forEach((p, idx) => {
          p.rotation.z += dt * 40 * (idx % 2 === 0 ? 1 : -1);
        });
      }

      // Thruster glow pulse
      if (m.glowMesh) {
        m.glowMesh.material.opacity = 0.4 + Math.sin(m.progress * 30) * 0.3;
      }

      const liftPhase = 0.12; // 12% of flight is liftoff

      if (m.progress < liftPhase) {
        // Phase 1: Vertical lift-off
        const liftT = m.progress / liftPhase;
        const eased = liftT * liftT * (3 - 2 * liftT); // smoothstep
        const curX = m.startPos.x + Math.sin(liftT * 8) * 0.05; // slight wobble
        const curZ = m.startPos.z;
        const curY = THREE.MathUtils.lerp(m.startPos.y, m.liftOffPos ? m.liftOffPos.y : m.startPos.y + 3, eased);
        m.mesh.position.set(curX, curY, curZ);
        // Level during liftoff
        m.mesh.rotation.set(0, 0, Math.sin(liftT * 12) * 0.08);
      } else {
        // Phase 2: Forward cruise toward target
        const cruiseT = (m.progress - liftPhase) / (1.0 - liftPhase);
        const cruiseStart = m.liftOffPos || m.startPos;
        const p2 = m.targetPos;
        const curX = THREE.MathUtils.lerp(cruiseStart.x, p2.x, cruiseT);
        const curZ = THREE.MathUtils.lerp(cruiseStart.z, p2.z, cruiseT);
        const arcHeight = Math.sin(cruiseT * Math.PI) * 6.0; // gentler arc
        const curY = THREE.MathUtils.lerp(cruiseStart.y, p2.y, cruiseT) + arcHeight;

        m.mesh.position.set(curX, curY, curZ);

        // Look in direction of travel
        const nt = Math.min(1.0, cruiseT + 0.05);
        const nextX = THREE.MathUtils.lerp(cruiseStart.x, p2.x, nt);
        const nextZ = THREE.MathUtils.lerp(cruiseStart.z, p2.z, nt);
        const nextY = THREE.MathUtils.lerp(cruiseStart.y, p2.y, nt) + Math.sin(nt * Math.PI) * 6.0;
        m.mesh.lookAt(nextX, nextY, nextZ);

        // Slight roll oscillation during cruise
        m.mesh.rotation.z = Math.sin(cruiseT * 15) * 0.1;
      }

      // Smoke/rotor wash trail
      if (Math.random() > 0.3) {
        const smoke = this._acquireFromPool(this._smokePool);
        if (smoke) {
          smoke.visible = true;
          smoke.userData.active = true;
          smoke.scale.set(0.6, 0.6, 0.6);
          smoke.material.opacity = 0.4;
          smoke.material.color.setHex(m.progress < liftPhase ? 0xaaddff : 0x999999);
          smoke.position.copy(m.mesh.position);
          smoke.position.y -= 0.1;
          smoke.userData.life = 0;
          smoke.userData.maxLife = 0.5;
          this.explosionParticles.push(smoke);
        }
      }

      if (m.progress >= 1.0) {
        this.create3DExplosion(m.targetPos);
        if (m.onImpact) m.onImpact();
        this.scene.remove(m.mesh);
        this.activeMissiles.splice(i, 1);
      }
    }

    // Update explosion & smoke particles — pool-based
    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const p = this.explosionParticles[i];
      p.userData.life += dt;
      if (p.userData.vx !== undefined && p.userData.vx !== 0) {
        p.position.x += p.userData.vx * dt;
        p.position.y += p.userData.vy * dt;
        p.position.z += p.userData.vz * dt;
        p.userData.vy -= 18.0 * dt; // gravity
      }
      p.scale.multiplyScalar(1.02);
      p.material.opacity = Math.max(0, 1.0 - p.userData.life / p.userData.maxLife);
      if (p.userData.life >= p.userData.maxLife) {
        this._releaseToPool(p);
        this.explosionParticles.splice(i, 1);
      }
    }

    // Boat wave simulation
    if (this.boatModel) {
      const heave = Math.sin(t * 1.6) * 0.035 + Math.cos(t * 1.1) * 0.015;
      const pitch = Math.sin(t * 1.4) * 0.010;
      const roll = Math.cos(t * 1.0) * 0.008;

      this.boatModel.position.y = this.boatBaseY + heave - (this.bounceImpulse * 0.05);
      this.boatModel.rotation.x = pitch + (this.bounceImpulse * 0.012);
      this.boatModel.rotation.z = roll;

      // Module position sync (modules are scene objects, follow boat)
      for (const [id, mod] of Object.entries(this.moduleObjects)) {
        if (mod.userData && mod.userData.modOffset) {
          const off = mod.userData.modOffset;
          mod.position.set(
            this.boatModel.position.x + off.x,
            this.boatModel.position.y + off.y,
            this.boatModel.position.z + off.z
          );
          mod.rotation.x = this.boatModel.rotation.x;
          mod.rotation.z = this.boatModel.rotation.z;
        }

        if (id === 'autosiphon') {
          const dish = mod.getObjectByName('siphon_dish');
          if (dish) dish.rotation.y = Math.sin(t * 1.5) * 0.6;
        }
      }

      // Swarm escorts follow in formation
      this.swarmDrones.forEach((d) => {
        const offX = d.userData.offsetX;
        const offZ = d.userData.offsetZ;
        const escHeave = Math.sin(t * 1.6 + d.userData.index) * 0.03;
        d.position.set(
          this.boatModel.position.x + offX,
          this.boatModel.position.y + escHeave,
          this.boatModel.position.z + offZ
        );
        d.rotation.x = pitch;
        d.rotation.z = roll;

        if (Math.random() > 0.5) {
          this.emitWakeParticle(d.position.x, d.position.z - 0.8, 0.7);
        }
      });

      // Emit waterjet foam wake if waterjets equipped — enhanced spray
      if (this.moduleObjects['waterjets'] && Math.random() > 0.3) {
        this.emitWakeParticle(this.boatModel.position.x - 0.2, this.boatModel.position.z - 1.8);
        this.emitWakeParticle(this.boatModel.position.x + 0.2, this.boatModel.position.z - 1.8);
        // Side spray particles
        if (Math.random() > 0.6) {
          this.emitWakeParticle(this.boatModel.position.x - 0.5, this.boatModel.position.z - 1.2, 1.3);
          this.emitWakeParticle(this.boatModel.position.x + 0.5, this.boatModel.position.z - 1.2, 1.3);
        }
      }
      // Bow spray at speed
      if (Math.random() > 0.7) {
        this.emitWakeParticle(this.boatModel.position.x + (Math.random() - 0.5) * 0.3, this.boatModel.position.z + 1.5, 0.5);
      }

      if (this.bounceImpulse > 0) {
        this.bounceImpulse *= 0.90;
        if (this.bounceImpulse < 0.01) this.bounceImpulse = 0;
      }
    }

    // Wake particles
    for (const p of this.wakeParticles) {
      if (p.visible) {
        p.userData.life += dt;
        p.position.x += p.userData.vx * dt;
        p.position.z += p.userData.vz * dt;
        const progress = p.userData.life / p.userData.maxLife;
        p.scale.setScalar(1 + progress * 2.5);
        p.material.opacity = (1.0 - progress) * 0.4;
        if (progress >= 1.0) p.visible = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Barracuda3DEngine = Barracuda3DEngine;
