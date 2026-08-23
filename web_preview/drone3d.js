// =========================================================================
// BARRACUDA USV — 3D ENGINE v6
// (Enemy Warships + Searchlights + 3D Missile Strikes + Drone Swarm + Sectors)
// =========================================================================

class Barracuda3DEngine {
  constructor(containerOrId, onClickCallback) {
    if (typeof containerOrId === 'string') {
      this.container = document.getElementById(containerOrId);
    } else if (containerOrId && containerOrId.nodeType) {
      this.container = containerOrId;
    } else {
      this.container = document.getElementById('drone-3d-viewport') || document.body;
    }
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

    this.cameraMode = 'orbit'; // 'orbit', 'flir', or 'chase'
    this.flirZoom = 1.0;

    // -------------------------------------------------------------
    // REAL-TIME 3D PILOTING & TACTICAL SORTIES SYSTEM
    // -------------------------------------------------------------
    this.pilotMode = false;
    this.pilotBoatPos = new THREE.Vector3(0, 0, 0);
    this.pilotHeading = 0;
    this.pilotSpeed = 0;
    this.pilotThrottle = 0;
    this.pilotSteer = 0;
    this.pilotAngularVelocity = 0;
    this.pilotBoost = false;
    this.pilotRoll = 0;
    this.pilotPitch = 0;
    this.pilotHullHP = 100;
    this.pilotHullMaxHP = 100;
    this.smoothLookTarget = new THREE.Vector3(0, 0, 0);
    this.missionMines = [];
    this.missionCrates = [];
    this.missionSearchlights = [];
    this.missionWaypoints = [];
    this.missionTracers = [];
    this.missionConfig = null;
    this.missionStats = { cratesCollected: 0, totalCrates: 0, damageTaken: 0, detectedCount: 0 };
    this.missionActive = false;
    this.onMissionEvent = null;

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
    this.scene.background = new THREE.Color(0x05131e);
    this.scene.fog = new THREE.FogExp2(0x061826, 0.0018);

    this.camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 20000);
    this.camera.position.set(7, 4.5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x05131e, 1.0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.container.appendChild(this.renderer.domElement);

    this.createAtmosphericSky();
    this.createWater();
    this.createWakeSystem();
    this.setupLighting();
    this.createEnemyWarship();
    this.createLightningSystem();
    this.createRainSystem();
    this.createParticlePools();
    this.loadGLBModel();        // Loads real GLB boat model (falls back to procedural only if error)
    this.setupEvents();
    this.animate();
  }

  // =========================================================================
  // ATMOSPHERIC SKY & VOLUMETRIC CLOUDS
  // =========================================================================
  createAtmosphericSky() {
    const elevation = 16;
    const azimuth = 205;
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    this.sun = new THREE.Vector3();
    this.sun.setFromSphericalCoords(1, phi, theta);

    if (typeof THREE.Sky !== 'undefined') {
      this.sky = new THREE.Sky();
      this.sky.scale.setScalar(12000);
      if (this.sky.material) {
        this.sky.material.fog = false;
      }
      this.scene.add(this.sky);

      const skyUniforms = this.sky.material.uniforms;
      skyUniforms['turbidity'].value = 6.0;
      skyUniforms['rayleigh'].value = 1.6;
      skyUniforms['mieCoefficient'].value = 0.005;
      skyUniforms['mieDirectionalG'].value = 0.85;
      skyUniforms['sunPosition'].value.copy(this.sun);
    } else {
      this.scene.background = new THREE.Color(0x0a2234);
    }

    // Procedural Clouds
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x90c0dd,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.55,
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

    if (typeof THREE.Water !== 'undefined') {
      try {
        this.water = new THREE.Water(waterGeometry, {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: new THREE.TextureLoader().load(
            'assets/waternormals.jpg',
            (texture) => {
              texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
          ),
          sunDirection: this.sun ? this.sun.clone().normalize() : new THREE.Vector3(0, 1, 0),
          sunColor: 0xfff0d0,
          waterColor: 0x061824,
          distortionScale: 3.2,
          fog: true
        });

        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = 0.0;
        this.scene.add(this.water);
        return;
      } catch (e) {
        console.warn('THREE.Water init failed, falling back to standard plane:', e);
      }
    }

    // Fallback standard ocean surface
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x071e2c,
      roughness: 0.1,
      metalness: 0.85
    });
    this.water = new THREE.Mesh(waterGeometry, oceanMat);
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
    this.hemiLight = new THREE.HemisphereLight(0x70c0e8, 0x082030, 2.2);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8ee, 3.4);
    this.sunLight.position.set(16, 24, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -8;
    this.sunLight.shadow.camera.right = 8;
    this.sunLight.shadow.camera.top = 8;
    this.sunLight.shadow.camera.bottom = -8;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x3088b0, 1.4);
    this.fillLight.position.set(-12, 10, -10);
    this.scene.add(this.fillLight);

    this.greenGlow = new THREE.PointLight(0x00ff88, 2.8, 12, 1.5);
    this.greenGlow.position.set(0, 0.4, 0);
    this.scene.add(this.greenGlow);

    this.ambientLight = new THREE.AmbientLight(0x204860, 1.4);
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
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('[BARRACUDA 3D] GLTFLoader undefined, creating procedural boat hull.');
      this.createProceduralBoat();
      return;
    }

    const loader = new THREE.GLTFLoader();
    loader.load(
      'assets/barracuda.glb',
      (gltf) => {
        try {
          if (this.boatModel) {
            this.scene.remove(this.boatModel);
            this.boatModel = null;
          }
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
          this.createProceduralBoat();
        }
      },
      undefined,
      (err) => {
        console.warn('Failed to load GLB, building procedural boat:', err);
        this.createProceduralBoat();
      }
    );
  }

  createProceduralBoat() {
    if (this.boatModel) return;
    this.boatModel = new THREE.Group();

    const hullMat = new THREE.MeshStandardMaterial({ color: 0x222a30, roughness: 0.35, metalness: 0.8 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x141a20, roughness: 0.4, metalness: 0.7 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const opticMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Main stealth hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 4.4), hullMat);
    hull.position.y = 0.28;
    this.boatModel.add(hull);

    // Bow pointed wedge
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 4), hullMat);
    bow.rotation.x = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 0.28, 3.1);
    this.boatModel.add(bow);

    // Stealth cockpit / payload deck
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 1.8), deckMat);
    cab.position.set(0, 0.75, -0.2);
    this.boatModel.add(cab);

    // Satcom Dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x004466, roughness: 0.1 }));
    dome.position.set(0, 1.1, -0.2);
    this.boatModel.add(dome);

    // FLIR Sensor Turret
    const flir = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), opticMat);
    flir.position.set(0, 0.85, 1.4);
    this.boatModel.add(flir);

    // Green Port/Starboard Navigation LED Strips
    [-0.82, 0.82].forEach(x => {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 2.8), glowMat);
      led.position.set(x, 0.45, 0.2);
      this.boatModel.add(led);
    });

    this.scene.add(this.boatModel);
    this.boatBaseY = 0.0;
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

    // Camera orbit, Chase-cam for Piloting, or FLIR scope mode
    if (this.pilotMode && this.boatModel) {
      // Dynamic chase camera with damped tracking
      const camDist = this.pilotBoost ? 12.5 : 10.0;
      const camHeight = this.pilotBoost ? 4.8 : 4.2;
      const targetCamX = this.pilotBoatPos.x - Math.sin(this.pilotHeading) * camDist;
      const targetCamZ = this.pilotBoatPos.z - Math.cos(this.pilotHeading) * camDist;
      const targetCamY = this.boatBaseY + camHeight;

      // Smooth camera position interpolation
      this.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.07);

      // Smooth look-ahead target (eliminates jerking and camera snapping)
      const rawLookTarget = new THREE.Vector3(
        this.pilotBoatPos.x + Math.sin(this.pilotHeading) * 8.0,
        this.boatBaseY + 1.0,
        this.pilotBoatPos.z + Math.cos(this.pilotHeading) * 8.0
      );
      this.smoothLookTarget.lerp(rawLookTarget, 0.08);
      this.camera.lookAt(this.smoothLookTarget);
    } else if (this.cameraMode === 'flir') {
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

    // -------------------------------------------------------------
    // REAL-TIME 3D PILOTING PHYSICS & BOAT DYNAMICS (MISSIONS)
    // -------------------------------------------------------------
    if (this.pilotMode && this.boatModel) {
      const maxForwardSpeed = this.pilotBoost ? 36.0 : 22.0;
      const maxReverseSpeed = -8.0;
      const accelRate = (this.pilotThrottle > 0 ? 12.0 : 18.0) * dt;

      // Update speed with inertia:
      const targetSpeed = this.pilotThrottle > 0 ? this.pilotThrottle * maxForwardSpeed : this.pilotThrottle * (-maxReverseSpeed);
      this.pilotSpeed += (targetSpeed - this.pilotSpeed) * Math.min(1.0, accelRate);

      // Smooth hydrodynamic turning (prevents sudden twitching and jerking):
      const maxTurnRate = 1.25; // Gentle realistic naval rudder rate
      const speedFactor = Math.min(1.0, Math.max(0.2, Math.abs(this.pilotSpeed) / 10.0));
      const targetAngularVel = -this.pilotSteer * maxTurnRate * speedFactor;
      this.pilotAngularVelocity += (targetAngularVel - this.pilotAngularVelocity) * Math.min(1.0, 5.5 * dt);
      this.pilotHeading += this.pilotAngularVelocity * dt * (this.pilotSpeed >= 0 ? 1 : -0.7);

      // Translate coordinates:
      const vx = Math.sin(this.pilotHeading) * this.pilotSpeed;
      const vz = Math.cos(this.pilotHeading) * this.pilotSpeed;
      this.pilotBoatPos.x += vx * dt;
      this.pilotBoatPos.z += vz * dt;

      // Realistic hydrodynamic pitch and roll based on smoothed angular velocity:
      const waveHeave = Math.sin(t * 2.6) * 0.04 + Math.cos(t * 1.8) * 0.02;
      const targetRoll = this.pilotAngularVelocity * 0.32;
      const targetPitch = (this.pilotSpeed / 36.0) * 0.12 + (this.pilotBoost ? 0.04 : 0.0);
      this.pilotRoll += (targetRoll - this.pilotRoll) * Math.min(1.0, 6.0 * dt);
      this.pilotPitch += (targetPitch - this.pilotPitch) * Math.min(1.0, 6.0 * dt);

      this.boatModel.position.set(this.pilotBoatPos.x, this.boatBaseY + waveHeave, this.pilotBoatPos.z);
      this.boatModel.rotation.set(this.pilotPitch, this.pilotHeading, this.pilotRoll);

      // Waterjet Spray & Foaming Wake:
      if (Math.abs(this.pilotSpeed) > 1.0) {
        const sternDist = 2.2;
        const wakeX = this.pilotBoatPos.x - Math.sin(this.pilotHeading) * sternDist;
        const wakeZ = this.pilotBoatPos.z - Math.cos(this.pilotHeading) * sternDist;
        const sprayScale = this.pilotBoost ? 2.8 : 1.5;
        this.emitWakeParticle(wakeX - Math.cos(this.pilotHeading) * 0.4, wakeZ + Math.sin(this.pilotHeading) * 0.4, sprayScale);
        this.emitWakeParticle(wakeX + Math.cos(this.pilotHeading) * 0.4, wakeZ - Math.sin(this.pilotHeading) * 0.4, sprayScale);
        if (Math.random() > 0.4) {
          this.emitWakeParticle(wakeX, wakeZ, sprayScale * 1.2);
        }
      }

      // Sync module objects to boat:
      for (const [id, mod] of Object.entries(this.moduleObjects)) {
        if (mod.userData && mod.userData.modOffset) {
          const off = mod.userData.modOffset;
          const rotOffX = off.x * Math.cos(this.pilotHeading) + off.z * Math.sin(this.pilotHeading);
          const rotOffZ = -off.x * Math.sin(this.pilotHeading) + off.z * Math.cos(this.pilotHeading);
          mod.position.set(
            this.pilotBoatPos.x + rotOffX,
            this.boatModel.position.y + off.y,
            this.pilotBoatPos.z + rotOffZ
          );
          mod.rotation.set(this.pilotPitch, this.pilotHeading, this.pilotRoll);
        }
      }

      // Update Mission Objects & Collisions:
      this.updateMissionWorld(dt, t);
    } else if (this.boatModel) {
      // Idle base wave simulation
      const heave = Math.sin(t * 1.6) * 0.035 + Math.cos(t * 1.1) * 0.015;
      const pitch = Math.sin(t * 1.4) * 0.010;
      const roll = Math.cos(t * 1.0) * 0.008;

      this.boatModel.position.set(0, this.boatBaseY + heave - (this.bounceImpulse * 0.05), 0);
      this.boatModel.rotation.set(pitch + (this.bounceImpulse * 0.012), 0, roll);

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
        if (Math.random() > 0.6) {
          this.emitWakeParticle(this.boatModel.position.x - 0.5, this.boatModel.position.z - 1.2, 1.3);
          this.emitWakeParticle(this.boatModel.position.x + 0.5, this.boatModel.position.z - 1.2, 1.3);
        }
      }
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

    // Floating Salvage Crates on water
    if (this.floatingSalvage && this.floatingSalvage.length > 0) {
      for (let i = this.floatingSalvage.length - 1; i >= 0; i--) {
        const crate = this.floatingSalvage[i];
        crate.userData.age += dt;
        crate.position.y = Math.sin(t * 2.0 + crate.userData.seed) * 0.15 + 0.1;
        crate.rotation.y += 0.4 * dt;
        crate.rotation.x = Math.sin(t * 1.5 + crate.userData.seed) * 0.08;

        // Blinking beacon
        if (crate.userData.beaconLight) {
          const blink = Math.sin(t * 6.0 + crate.userData.seed) > 0.2;
          crate.userData.beaconLight.intensity = blink ? 2.5 : 0.2;
        }

        // Float towards player slightly or expire after 40s
        if (crate.userData.age > 40) {
          this.scene.remove(crate);
          this.floatingSalvage.splice(i, 1);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  // =========================================================================
  // PROTOTYPE HULL STYLING (PHANTOM / STRIKE / AEGIS)
  // =========================================================================
  setDronePrototype(protoId) {
    this.currentPrototype = protoId;
    if (!this.boatModel) return;

    let hullColor = 0x161a1e;
    let glowColor = 0x00ff66;
    let roughness = 0.25;
    let metalness = 0.85;

    if (protoId === 'phantom') {
      hullColor = 0x0a0c0e; // Ultra matte stealth black
      glowColor = 0x00ff88;
      roughness = 0.55;
      metalness = 0.4;
    } else if (protoId === 'strike') {
      hullColor = 0x242822; // Olive naval assault camo
      glowColor = 0xff4400;
      roughness = 0.2;
      metalness = 0.9;
    } else if (protoId === 'aegis') {
      hullColor = 0x122030; // Deep cyber blue
      glowColor = 0x00e5ff;
      roughness = 0.15;
      metalness = 0.95;
    }

    this.boatModel.traverse((child) => {
      if (child.isMesh && child.material && child.material.color) {
        child.material.color.setHex(hullColor);
        child.material.roughness = roughness;
        child.material.metalness = metalness;
        child.material.needsUpdate = true;
      }
    });

    if (this.greenGlow) {
      this.greenGlow.color.setHex(glowColor);
      this.greenGlow.intensity = protoId === 'aegis' ? 2.6 : 1.4;
    }
  }

  // =========================================================================
  // FLOATING SALVAGE / CARGO CRATES
  // =========================================================================
  spawnFloatingSalvage(lootList = []) {
    if (!this.floatingSalvage) this.floatingSalvage = [];
    const origin = this.enemyShip ? this.enemyShip.position.clone() : new THREE.Vector3(38, 0, -75);

    const count = Math.min(4, Math.max(2, lootList.length || 2));
    for (let i = 0; i < count; i++) {
      const crateGroup = new THREE.Group();

      // Carbon/Steel Crate
      const crateMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xffcc00 : 0x00e5ff,
        metalness: 0.8,
        roughness: 0.2
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), crateMat);
      crateGroup.add(box);

      // Flotation collars (orange buoys on sides)
      const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.3 });
      const buoyL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 8), buoyMat);
      buoyL.rotation.z = Math.PI / 2;
      buoyL.position.set(0, -0.2, 0.7);
      crateGroup.add(buoyL);
      const buoyR = buoyL.clone();
      buoyR.position.z = -0.7;
      crateGroup.add(buoyR);

      // Emergency Strobe Beacon
      const beaconLight = new THREE.PointLight(i % 2 === 0 ? 0xffaa00 : 0x00ffff, 2.0, 15);
      beaconLight.position.set(0, 0.6, 0);
      crateGroup.add(beaconLight);

      const offsetDist = 8 + Math.random() * 12;
      const offsetAngle = Math.random() * Math.PI * 2;
      crateGroup.position.set(
        origin.x + Math.cos(offsetAngle) * offsetDist,
        0.1,
        origin.z + Math.sin(offsetAngle) * offsetDist
      );

      crateGroup.userData = {
        seed: Math.random() * 10,
        age: 0,
        beaconLight: beaconLight,
        loot: lootList[i] || 'Трофейный контейнер'
      };

      this.scene.add(crateGroup);
      this.floatingSalvage.push(crateGroup);
    }
  }
  // =========================================================================
  // REAL-TIME 3D BOAT PILOTING & TACTICAL SORTIES API
  // =========================================================================

  setPilotInput(throttle, steer, boost) {
    this.pilotThrottle = Math.max(-1.0, Math.min(1.0, throttle));
    this.pilotSteer = Math.max(-1.0, Math.min(1.0, steer));
    this.pilotBoost = !!boost;
  }

  startPilotMission(missionConfig, onEventCallback) {
    this.pilotMode = true;
    this.missionActive = true;
    this.missionConfig = missionConfig || {};
    this.onMissionEvent = onEventCallback || null;
    this.cameraMode = 'chase';

    // Reset boat state
    this.pilotBoatPos.set(0, 0, 0);
    this.pilotHeading = 0;
    this.pilotSpeed = 0;
    this.pilotThrottle = 0;
    this.pilotSteer = 0;
    this.pilotBoost = false;
    this.pilotHullHP = 100;
    this.pilotHullMaxHP = 100;

    this.missionStats = {
      cratesCollected: 0,
      totalCrates: 0,
      damageTaken: 0,
      detectedCount: 0
    };

    // Clean old mission meshes
    this.clearMissionEnvironment();

    // Spawn 3D mission world elements based on mission config
    this.setupMissionWorld(this.missionConfig);
  }

  stopPilotMission() {
    this.pilotMode = false;
    this.missionActive = false;
    this.cameraMode = 'orbit';
    this.clearMissionEnvironment();

    // Reset boat back to center for base mode
    this.pilotBoatPos.set(0, 0, 0);
    this.pilotHeading = 0;
    this.pilotSpeed = 0;
    if (this.boatModel) {
      this.boatModel.position.set(0, this.boatBaseY, 0);
      this.boatModel.rotation.set(0, 0, 0);
    }
  }

  clearMissionEnvironment() {
    // Remove mines
    this.missionMines.forEach(m => this.scene.remove(m));
    this.missionMines = [];

    // Remove crates
    this.missionCrates.forEach(c => this.scene.remove(c));
    this.missionCrates = [];

    // Remove searchlights
    this.missionSearchlights.forEach(s => {
      if (s.coneMesh) this.scene.remove(s.coneMesh);
      if (s.light) this.scene.remove(s.light);
      if (s.target) this.scene.remove(s.target);
    });
    this.missionSearchlights = [];

    // Remove waypoints
    this.missionWaypoints.forEach(w => this.scene.remove(w));
    this.missionWaypoints = [];

    // Remove tracers
    this.missionTracers.forEach(tr => this.scene.remove(tr.mesh));
    this.missionTracers = [];
  }

  setupMissionWorld(config) {
    const type = config.type || 'patrol';

    // 1. Spawning Floating Naval Mines
    const mineCount = config.mineCount !== undefined ? config.mineCount : 6;
    for (let i = 0; i < mineCount; i++) {
      const dist = 35 + Math.random() * 80;
      const angle = (i / mineCount) * Math.PI * 1.5 - 0.4 + (Math.random() - 0.5) * 0.4;
      const mx = Math.sin(angle) * dist;
      const mz = Math.cos(angle) * dist;
      this.create3DMine(mx, mz);
    }

    // 2. Spawning Salvage Crates (Black Boxes, GaN Chips, Titanium)
    const crateCount = config.crateCount !== undefined ? config.crateCount : 3;
    this.missionStats.totalCrates = crateCount;
    const lootPool = config.lootPool || ['Микрочип GaN', 'Титановый сплав', 'Чёрный ящик'];
    for (let i = 0; i < crateCount; i++) {
      const dist = 30 + (i + 1) * 28 + (Math.random() - 0.5) * 10;
      const angle = (Math.random() - 0.5) * 1.2;
      const cx = Math.sin(angle) * dist;
      const cz = Math.cos(angle) * dist;
      this.create3DCrate(cx, cz, lootPool[i % lootPool.length]);
    }

    // 3. Spawning Coastal Searchlights
    const searchlightCount = config.searchlightCount !== undefined ? config.searchlightCount : 2;
    for (let i = 0; i < searchlightCount; i++) {
      const sx = (i === 0 ? -45 : 45) + (Math.random() - 0.5) * 10;
      const sz = 60 + i * 40;
      this.create3DSearchlight(sx, sz, 45, 0.6 + i * 0.3);
    }

    // 4. Spawning Extraction / Strike Waypoint
    const targetDist = config.targetDist || 140;
    const targetAngle = config.targetAngle || 0;
    const wx = Math.sin(targetAngle) * targetDist;
    const wz = Math.cos(targetAngle) * targetDist;
    this.create3DWaypoint(wx, wz, 15, config.targetLabel || 'ЗОНА ПУСКА FPV');

    // Position enemy warship at the objective point
    if (this.enemyShip) {
      this.enemyShip.position.set(wx, -0.6, wz + 12);
      this.enemyShip.lookAt(0, -0.6, 0);
    }
  }

  create3DMine(x, z) {
    const mineGroup = new THREE.Group();

    // Spherical Hull with Spike Horns
    const mineMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c1e,
      roughness: 0.7,
      metalness: 0.9
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 12), mineMat);
    mineGroup.add(sphere);

    // Spikes (contact detonators)
    const spikeGeom = new THREE.ConeGeometry(0.12, 0.6, 6);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const spike = new THREE.Mesh(spikeGeom, spikeMat);
      const theta = (i / 8) * Math.PI * 2;
      spike.position.set(Math.cos(theta) * 0.9, Math.sin(theta * 2) * 0.4, Math.sin(theta) * 0.9);
      spike.rotation.z = Math.PI / 2 + Math.cos(theta);
      mineGroup.add(spike);
    }

    // Blinking Danger Strobe LED
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), ledMat);
    led.position.set(0, 0.95, 0);
    mineGroup.add(led);

    const redLight = new THREE.PointLight(0xff0022, 1.5, 8);
    redLight.position.set(0, 1.1, 0);
    mineGroup.add(redLight);

    mineGroup.position.set(x, 0.1, z);
    mineGroup.userData = {
      type: 'mine',
      radius: 2.8,
      led: led,
      light: redLight,
      blinkSeed: Math.random() * 10
    };

    this.scene.add(mineGroup);
    this.missionMines.push(mineGroup);
  }

  create3DCrate(x, z, loot) {
    const crateGroup = new THREE.Group();

    // High-tech salvage crate
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x003344
    });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), crateMat);
    crateGroup.add(box);

    // Flotation Collars
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.4 });
    const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.6, 8), buoyMat);
    buoy.rotation.z = Math.PI / 2;
    buoy.position.set(0, -0.25, 0.8);
    crateGroup.add(buoy);
    const buoy2 = buoy.clone();
    buoy2.position.z = -0.8;
    crateGroup.add(buoy2);

    // Glowing Vertical Hologram Beacon
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.6, 18, 8, 1, true), beamMat);
    beam.position.set(0, 9.0, 0);
    crateGroup.add(beam);

    const light = new THREE.PointLight(0x00f0ff, 2.5, 15);
    light.position.set(0, 1.0, 0);
    crateGroup.add(light);

    crateGroup.position.set(x, 0.15, z);
    crateGroup.userData = {
      type: 'crate',
      radius: 3.2,
      loot: loot || 'Разведданные',
      beam: beam,
      light: light,
      collected: false
    };

    this.scene.add(crateGroup);
    this.missionCrates.push(crateGroup);
  }

  create3DSearchlight(x, z, range, speed) {
    const coneGeom = new THREE.ConeGeometry(8, range, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffcc,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    const coneMesh = new THREE.Mesh(coneGeom, coneMat);
    coneMesh.position.set(x, 8, z);
    coneMesh.rotation.x = Math.PI / 2.3;

    const spotLight = new THREE.SpotLight(0xffffdd, 5.0, range + 20, Math.PI / 6, 0.5, 1.5);
    spotLight.position.set(x, 10, z);

    const targetObj = new THREE.Object3D();
    targetObj.position.set(x, 0, z + range * 0.7);
    this.scene.add(targetObj);
    spotLight.target = targetObj;

    this.scene.add(coneMesh);
    this.scene.add(spotLight);

    this.missionSearchlights.push({
      originX: x,
      originZ: z,
      range: range,
      speed: speed || 0.8,
      coneMesh: coneMesh,
      light: spotLight,
      target: targetObj,
      sweepAngle: 0
    });
  }

  create3DWaypoint(x, z, radius, label) {
    const wpGroup = new THREE.Group();

    // Holographic Pulsing Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const ring1 = new THREE.Mesh(new THREE.RingGeometry(radius - 0.8, radius, 32), ringMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.2;
    wpGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(radius * 0.4, radius * 0.45, 24), ringMat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.25;
    wpGroup.add(ring2);

    const pLight = new THREE.PointLight(0x00ff88, 3.0, radius * 2.5);
    pLight.position.set(0, 2, 0);
    wpGroup.add(pLight);

    wpGroup.position.set(x, 0, z);
    wpGroup.userData = {
      type: 'waypoint',
      radius: radius,
      label: label,
      ring1: ring1,
      ring2: ring2,
      reached: false
    };

    this.scene.add(wpGroup);
    this.missionWaypoints.push(wpGroup);
  }

  fireEnemyTracer(fromPos, toPos) {
    const tracerGeom = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6);
    const tracerMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const mesh = new THREE.Mesh(tracerGeom, tracerMat);

    mesh.position.copy(fromPos);
    mesh.lookAt(toPos);
    mesh.rotateX(Math.PI / 2);

    const dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
    const speed = 75.0; // Tracer speed

    this.scene.add(mesh);
    this.missionTracers.push({
      mesh: mesh,
      dir: dir,
      speed: speed,
      targetPos: toPos.clone(),
      life: 0,
      maxLife: 2.0
    });
  }

  updateMissionWorld(dt, t) {
    if (!this.missionActive) return;

    // 1. Update Mines
    for (let i = this.missionMines.length - 1; i >= 0; i--) {
      const m = this.missionMines[i];
      const bob = Math.sin(t * 2.0 + m.userData.blinkSeed) * 0.08;
      m.position.y = 0.1 + bob;
      m.rotation.y += dt * 0.4;

      // LED Strobe Blink
      const blink = Math.sin(t * 6.0 + m.userData.blinkSeed) > 0.3;
      m.userData.led.material.color.setHex(blink ? 0xff0033 : 0x330000);
      m.userData.light.intensity = blink ? 2.5 : 0.2;

      // Distance collision check to player boat
      const dist = Math.hypot(this.pilotBoatPos.x - m.position.x, this.pilotBoatPos.z - m.position.z);
      if (dist < m.userData.radius) {
        // MINE DETONATION!
        this.create3DExplosion(m.position);
        this.scene.remove(m);
        this.missionMines.splice(i, 1);
        this.pilotHullHP = Math.max(0, this.pilotHullHP - 35);
        this.missionStats.damageTaken += 35;
        if (this.onMissionEvent) this.onMissionEvent('mine_hit', { hp: this.pilotHullHP });
      }
    }

    // 2. Update Salvage Crates
    for (let i = this.missionCrates.length - 1; i >= 0; i--) {
      const c = this.missionCrates[i];
      if (c.userData.collected) continue;
      const bob = Math.sin(t * 1.8 + c.position.x) * 0.06;
      c.position.y = 0.15 + bob;
      c.rotation.y += dt * 0.6;
      if (c.userData.beam) c.userData.beam.rotation.y = -t * 1.2;

      const dist = Math.hypot(this.pilotBoatPos.x - c.position.x, this.pilotBoatPos.z - c.position.z);
      if (dist < c.userData.radius) {
        // COLLECTED!
        c.userData.collected = true;
        this.create3DExplosion(c.position);
        this.scene.remove(c);
        this.missionCrates.splice(i, 1);
        this.missionStats.cratesCollected++;
        if (this.onMissionEvent) {
          this.onMissionEvent('crate_collected', {
            loot: c.userData.loot,
            collected: this.missionStats.cratesCollected,
            total: this.missionStats.totalCrates
          });
        }
      }
    }

    // 3. Update Searchlights & Detection
    this.missionSearchlights.forEach((s) => {
      s.sweepAngle = Math.sin(t * s.speed) * 0.75;
      const sweepX = s.originX + Math.sin(s.sweepAngle) * s.range;
      const sweepZ = s.originZ + Math.cos(s.sweepAngle) * s.range;
      s.target.position.set(sweepX, 0, sweepZ);
      s.coneMesh.lookAt(sweepX, 0, sweepZ);
      s.coneMesh.rotateX(Math.PI / 2);

      // Check if player boat is in the illuminated zone
      const distToLightBeam = Math.hypot(this.pilotBoatPos.x - sweepX, this.pilotBoatPos.z - sweepZ);
      if (distToLightBeam < 14.0) {
        // Detected by searchlight!
        this.missionStats.detectedCount++;
        if (Math.random() > 0.85) {
          // Fire tracer round from coastal battery
          const batteryPos = new THREE.Vector3(s.originX, 8, s.originZ);
          this.fireEnemyTracer(batteryPos, this.pilotBoatPos);
        }
        if (this.onMissionEvent) this.onMissionEvent('searchlight_detected');
      }
    });

    // 4. Update Enemy Tracers
    for (let i = this.missionTracers.length - 1; i >= 0; i--) {
      const tr = this.missionTracers[i];
      tr.life += dt;
      tr.mesh.position.addScaledVector(tr.dir, tr.speed * dt);

      // Check hit with boat
      const distToBoat = Math.hypot(tr.mesh.position.x - this.pilotBoatPos.x, tr.mesh.position.z - this.pilotBoatPos.z);
      if (distToBoat < 2.2 && Math.abs(tr.mesh.position.y - this.boatBaseY) < 2.0) {
        this.scene.remove(tr.mesh);
        this.missionTracers.splice(i, 1);
        this.pilotHullHP = Math.max(0, this.pilotHullHP - 8);
        this.missionStats.damageTaken += 8;
        if (this.onMissionEvent) this.onMissionEvent('tracer_hit', { hp: this.pilotHullHP });
        continue;
      }

      if (tr.life >= tr.maxLife || tr.mesh.position.y <= 0) {
        this.scene.remove(tr.mesh);
        this.missionTracers.splice(i, 1);
      }
    }

    // 5. Update Waypoints
    this.missionWaypoints.forEach((wp) => {
      wp.userData.ring1.rotation.z += dt * 0.8;
      wp.userData.ring2.rotation.z -= dt * 1.2;
      const pulseScale = 1.0 + Math.sin(t * 4.0) * 0.08;
      wp.userData.ring1.scale.set(pulseScale, pulseScale, 1);

      const dist = Math.hypot(this.pilotBoatPos.x - wp.position.x, this.pilotBoatPos.z - wp.position.z);
      if (dist < wp.userData.radius && !wp.userData.reached) {
        wp.userData.reached = true;
        if (this.onMissionEvent) this.onMissionEvent('waypoint_reached', { label: wp.userData.label });
      }
    });
  }

  getPilotTelemetry() {
    let targetX = 0, targetZ = 140;
    if (this.missionCrates.length > 0) {
      targetX = this.missionCrates[0].position.x;
      targetZ = this.missionCrates[0].position.z;
    } else if (this.missionWaypoints.length > 0) {
      targetX = this.missionWaypoints[0].position.x;
      targetZ = this.missionWaypoints[0].position.z;
    }

    const distToTarget = Math.hypot(targetX - this.pilotBoatPos.x, targetZ - this.pilotBoatPos.z);
    const speedKnots = Math.abs(Math.round(this.pilotSpeed * 1.852));
    const headingDeg = Math.round(((this.pilotHeading * (180 / Math.PI)) % 360 + 360) % 360);

    return {
      speedKnots: speedKnots,
      headingDeg: headingDeg,
      x: Math.round(this.pilotBoatPos.x),
      z: Math.round(this.pilotBoatPos.z),
      hullHP: Math.round(this.pilotHullHP),
      maxHP: this.pilotHullMaxHP,
      distToTarget: Math.round(distToTarget),
      cratesCollected: this.missionStats.cratesCollected,
      totalCrates: this.missionStats.totalCrates,
      boostActive: this.pilotBoost
    };
  }
}

window.Barracuda3DEngine = Barracuda3DEngine;

