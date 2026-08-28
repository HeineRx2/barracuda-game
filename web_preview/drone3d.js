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

    // -------------------------------------------------------------
    // REAL-TIME 1ST-PERSON FPV KAMIKAZE DRONE FLIGHT SYSTEM
    // -------------------------------------------------------------
    this.fpvFlightActive = false;
    this.fpvPos = new THREE.Vector3(0, 5, 0);
    this.fpvVel = new THREE.Vector3(0, 0, 0);
    this.fpvPitch = -0.05;
    this.fpvYaw = 0;
    this.fpvRoll = 0;
    this.fpvThrottle = 0.5;
    this.fpvBoost = false;
    this.fpvSteerX = 0;
    this.fpvSteerY = 0;
    this.fpvBattery = 25.2; // 6S LiPo battery in Volts
    this.fpvHP = 100;
    this.fpvMaxHP = 100;
    this.fpvFlightTime = 0;
    this.fpvDroneMesh = null;
    this.fpvPropellers = [];
    this.fpvGlowMesh = null;
    this.fpvLockTarget = null;
    this.fpvGlitchAmount = 0;
    this.fpvHover = false; // Hover mode: drone stabilizes and holds position
    this.reconMarkers = []; // 3D target markers for recon missions

    // Advanced Tactical Systems State (VSA, DPS, Sonar, Depth, ROV, PID, AI Lock)
    this.vsaEnabled = true;
    this.vsaDriftFactor = 0;
    this.lateralSlipVel = 0;
    this.dpsActive = false;
    this.dpsAnchorPos = new THREE.Vector3();
    this.sonarActive = false;
    this.sonarCanvas = null;
    this.sonarWaterfallHistory = [];
    this.sonarPingTimer = 0;
    this.currentDepth = 12.4;
    this.shallowWaterTimer = 0;
    this.shallowEnginePenalty = 1.0;
    this.nonMagneticHull = false;
    this.rovActive = false;
    this.rovPos = new THREE.Vector3(0, -6, 0);
    this.rovHeading = 0;
    this.rovSpeed = 0;
    this.rovMesh = null;
    this.rovTetherLine = null;
    this.siphonTargetPos = new THREE.Vector3(0, -6.5, 30);
    this.siphonProgress = 0;
    this.siphonLocked = false;
    this.magnetometerVal = 48200;
    this.fpvAiLockTarget = null;
    this.fpvAiModuleActive = false;
    this.fpvPidSettings = { pGain: 1.0, dGain: 1.0, expo: 1.0 };
    this.capsizeWarningTimer = 0;

    // Enemy CIWS Anti-Air Defenses
    this.ciwsTracers = [];
    this.ciwsCooldown = 0;
    this.ciwsBurstCount = 0;
    this.ciwsTargetPos = new THREE.Vector3();

    // Enemy Subsystems & Hitboxes
    this.enemySubsystems = [];
    this.shipSinking = { active: false, progress: 0, roll: 0, pitch: 0, depth: 0 };

    // Cinematic Orbit Camera on Strike
    this.cinematicOrbit = { active: false, center: new THREE.Vector3(), angle: 0, radius: 30, height: 10, speed: 0.4 };

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

    // Mobile detection for performance optimization
    this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 900);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,  // Disable antialiasing on mobile
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x05131e, 1.0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.0 : 1.75));
    this.renderer.shadowMap.enabled = !this.isMobile;  // Disable shadows on mobile
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
  // DNIPRO RIVER WATER — Murky green-brown river surface + RIVER BANKS
  // =========================================================================
  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(8000, 8000);

    if (typeof THREE.Water !== 'undefined') {
      try {
        const waterNormals = new THREE.TextureLoader().load(
          'assets/waternormals.jpg',
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(8, 8);
          }
        );

        this.water = new THREE.Water(waterGeometry, {
          textureWidth: 1024,
          textureHeight: 1024,
          waterNormals: waterNormals,
          sunDirection: this.sun ? this.sun.clone().normalize() : new THREE.Vector3(0.5, 0.7, 0.5).normalize(),
          sunColor: 0xd4c490,
          waterColor: 0x1a3020, // Murky green-brown river color
          distortionScale: 2.8,
          fog: true
        });

        this.water.rotation.x = -Math.PI / 2;
        this.water.position.y = 0.0;
        this.scene.add(this.water);

        // Create river banks
        this._createRiverBanks();
        return;
      } catch (e) {
        console.warn('THREE.Water init failed, falling back to standard plane:', e);
      }
    }

    // Fallback standard river surface
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x1a3020,  // Murky river green
      roughness: 0.2,
      metalness: 0.7
    });
    this.water = new THREE.Mesh(waterGeometry, oceanMat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = 0.0;
    this.scene.add(this.water);

    // Create river banks
    this._createRiverBanks();
  }

  // =========================================================================
  // RIVER BANKS — Terrain strips on both sides to create the Dnipro feeling
  // =========================================================================
  _createRiverBanks() {
    this.riverBanks = new THREE.Group();
    
    // River width ~240 units, banks on each side
    const bankLength = 4000;
    const bankWidth = 1500;
    const riverHalfWidth = 120;

    // Bank material — dark silty mud with grass patches
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x2e3820, // Dark earthy green-brown (Dnipro floodplain)
      roughness: 0.92,
      metalness: 0.05
    });

    // Mud/silt near water edge
    const mudMat = new THREE.MeshStandardMaterial({
      color: 0x1e2015,
      roughness: 0.95,
      metalness: 0.0
    });

    // Left bank (North/enemy side) — higher, more fortified
    const leftBankGeo = new THREE.PlaneGeometry(bankLength, bankWidth, 60, 30);
    const leftVerts = leftBankGeo.attributes.position;
    for (let i = 0; i < leftVerts.count; i++) {
      const x = leftVerts.getX(i);
      const y = leftVerts.getY(i);
      const distFromEdge = Math.max(0, -y);
      const slope = Math.min(1, distFromEdge / 40);
      const noise = Math.sin(x * 0.02) * 1.5 + Math.sin(x * 0.07) * 0.8 + Math.sin(x * 0.15 + y * 0.1) * 0.4;
      const height = slope * (2.5 + noise + Math.random() * 0.3);
      leftVerts.setZ(i, height);
    }
    leftBankGeo.computeVertexNormals();
    const leftBank = new THREE.Mesh(leftBankGeo, bankMat);
    leftBank.rotation.x = -Math.PI / 2;
    leftBank.position.set(0, 0.05, -(riverHalfWidth + bankWidth / 2));
    this.riverBanks.add(leftBank);

    // Right bank (South/friendly side) — lower, marshy
    const rightBankGeo = new THREE.PlaneGeometry(bankLength, bankWidth, 60, 30);
    const rightVerts = rightBankGeo.attributes.position;
    for (let i = 0; i < rightVerts.count; i++) {
      const x = rightVerts.getX(i);
      const y = rightVerts.getY(i);
      const distFromEdge = Math.max(0, y);
      const slope = Math.min(1, distFromEdge / 50);
      const noise = Math.cos(x * 0.018) * 1.2 + Math.sin(x * 0.06) * 0.6;
      const height = slope * (1.8 + noise + Math.random() * 0.3);
      rightVerts.setZ(i, height);
    }
    rightBankGeo.computeVertexNormals();
    const rightBank = new THREE.Mesh(rightBankGeo, bankMat);
    rightBank.rotation.x = -Math.PI / 2;
    rightBank.position.set(0, 0.05, (riverHalfWidth + bankWidth / 2));
    this.riverBanks.add(rightBank);

    // ===== MUD STRIPS along water edge =====
    for (let side = -1; side <= 1; side += 2) {
      const mudGeo = new THREE.PlaneGeometry(bankLength, 20, 20, 1);
      const mudStrip = new THREE.Mesh(mudGeo, mudMat);
      mudStrip.rotation.x = -Math.PI / 2;
      mudStrip.position.set(0, 0.08, side * (riverHalfWidth + 10));
      this.riverBanks.add(mudStrip);
    }

    // ===== DENSE REED / ТРОСТНИК CLUSTERS =====
    const reedColors = [0x4a6028, 0x506830, 0x3d5020, 0x5a7035, 0x445825];
    const reedStemGeo = new THREE.CylinderGeometry(0.06, 0.12, 1, 4); // Thin stem
    const reedTopGeo = new THREE.ConeGeometry(0.2, 0.6, 4); // Bushy top
    const reedTallStemGeo = new THREE.CylinderGeometry(0.05, 0.1, 1, 4);
    const reedBrushGeo = new THREE.ConeGeometry(0.35, 0.8, 5); // Thick cattail head

    for (let side = -1; side <= 1; side += 2) {
      // Dense reed patches along entire water edge
      for (let patch = 0; patch < 120; patch++) {
        const patchX = (Math.random() - 0.5) * bankLength * 0.85;
        const patchZ = side * (riverHalfWidth + Math.random() * 25);
        const reedsInPatch = 6 + Math.floor(Math.random() * 10);
        const patchColor = reedColors[Math.floor(Math.random() * reedColors.length)];
        const reedMat = new THREE.MeshStandardMaterial({
          color: patchColor,
          roughness: 0.9,
          metalness: 0.0
        });

        for (let r = 0; r < reedsInPatch; r++) {
          const rh = 2.0 + Math.random() * 3.5; // Height 2-5.5 units
          const rx = patchX + (Math.random() - 0.5) * 5;
          const rz = patchZ + (Math.random() - 0.5) * 4;

          // Stem
          const stem = new THREE.Mesh(reedStemGeo, reedMat);
          stem.scale.set(1, rh, 1);
          stem.position.set(rx, rh / 2, rz);
          stem.rotation.x = (Math.random() - 0.5) * 0.12;
          stem.rotation.z = (Math.random() - 0.5) * 0.12;
          this.riverBanks.add(stem);

          // Top (cone) — cattail brush or leaf tip
          if (Math.random() > 0.3) {
            const isCattail = Math.random() > 0.5;
            const top = new THREE.Mesh(isCattail ? reedBrushGeo : reedTopGeo, 
              new THREE.MeshStandardMaterial({
                color: isCattail ? 0x3a2810 : patchColor,
                roughness: 0.95
              })
            );
            top.position.set(rx, rh + (isCattail ? 0.3 : 0.2), rz);
            top.rotation.x = (Math.random() - 0.5) * 0.1;
            this.riverBanks.add(top);
          }
        }
      }

      // Low bushes further from water (squashed spheres)
      const bushMat = new THREE.MeshStandardMaterial({
        color: 0x2a4a18,
        roughness: 0.92,
        metalness: 0.0
      });
      const bushGeo = new THREE.SphereGeometry(1, 5, 4);
      for (let b = 0; b < 40; b++) {
        const bx = (Math.random() - 0.5) * bankLength * 0.8;
        const bz = side * (riverHalfWidth + 25 + Math.random() * 80);
        const bush = new THREE.Mesh(bushGeo, bushMat.clone());
        bush.material.color.setHSL(0.25 + Math.random() * 0.08, 0.45 + Math.random() * 0.15, 0.15 + Math.random() * 0.08);
        const scale = 0.8 + Math.random() * 1.5;
        bush.scale.set(scale, scale * 0.4, scale); // Flat/wide bushes
        bush.position.set(bx, scale * 0.3, bz);
        this.riverBanks.add(bush);
      }
    }

    // ===== FLOATING DEBRIS near banks (logs, trash) =====
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0x2a1e10,
      roughness: 0.95
    });
    const logGeo = new THREE.CylinderGeometry(0.2, 0.3, 4, 5);
    for (let i = 0; i < 30; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const log = new THREE.Mesh(logGeo, debrisMat);
      log.position.set(
        (Math.random() - 0.5) * bankLength * 0.6,
        0.1,
        side * (riverHalfWidth - 10 + Math.random() * 20)
      );
      log.rotation.z = Math.PI / 2;
      log.rotation.y = Math.random() * Math.PI;
      this.riverBanks.add(log);
    }

    this.scene.add(this.riverBanks);
  }

  // =========================================================================
  // RECON TARGET 3D MARKERS — Glowing pillars of light over target positions
  // =========================================================================
  createReconTargetMarkers(targetPositions) {
    // Clear old markers
    this.reconMarkers.forEach(m => {
      if (m.parent) m.parent.remove(m);
    });
    this.reconMarkers = [];

    targetPositions.forEach((t, idx) => {
      const group = new THREE.Group();
      group.userData = { targetIdx: idx };

      // Vertical light beam (tall thin box)
      const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 50, 6);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00ccff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 25, 0);
      group.add(beam);

      // Pulsing ring at ground level
      const ringGeo = new THREE.TorusGeometry(5, 0.3, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1;
      group.add(ring);

      // Second ring (larger, slower pulse)
      const ring2Geo = new THREE.TorusGeometry(8, 0.2, 8, 24);
      const ring2Mat = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.35
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.y = 1.5;
      group.add(ring2);

      // Small diamond shape floating above
      const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
      const diamondMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.8
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 12;
      group.add(diamond);

      group.position.set(t.x, 0, t.z);
      this.scene.add(group);
      this.reconMarkers.push(group);
    });
  }

  removeReconMarker(idx) {
    if (this.reconMarkers[idx]) {
      const marker = this.reconMarkers[idx];
      // Fade out animation
      const fadeOut = () => {
        marker.children.forEach(child => {
          if (child.material) {
            child.material.opacity -= 0.05;
          }
        });
        if (marker.children[0] && marker.children[0].material && marker.children[0].material.opacity > 0) {
          requestAnimationFrame(fadeOut);
        } else {
          if (marker.parent) marker.parent.remove(marker);
        }
      };
      fadeOut();
    }
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
      opacity: 0.4,
      depthWrite: false
    });
    const wakeGeom = new THREE.CircleGeometry(0.14, 8);
    wakeGeom.rotateX(-Math.PI / 2);

    for (let i = 0; i < 40; i++) {
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
      p.position.set(originX + (Math.random() - 0.5) * 0.18, 0.02, originZ - 0.2);
      p.scale.set(1, 1, 1);
      p.material.opacity = 0.5;
      p.userData.life = 0;
      p.userData.maxLife = 0.9 + Math.random() * 0.4;
      p.userData.vz = (-1.0 - Math.random() * 0.6) * speedMultiplier;
      p.userData.vx = (Math.random() - 0.5) * 0.35;
    }
  }

  // =========================================================================
  // LIGHTING & SPECULAR SHINE
  // =========================================================================
  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0x80ccee, 0x082030, 2.4);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8ee, 3.8);
    this.sunLight.position.set(18, 28, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -10;
    this.sunLight.shadow.camera.right = 10;
    this.sunLight.shadow.camera.top = 10;
    this.sunLight.shadow.camera.bottom = -10;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x3090b8, 1.6);
    this.fillLight.position.set(-14, 12, -12);
    this.scene.add(this.fillLight);

    this.greenGlow = new THREE.PointLight(0x00ff88, 3.0, 14, 1.4);
    this.greenGlow.position.set(0, 0.5, 0);
    this.scene.add(this.greenGlow);

    this.ambientLight = new THREE.AmbientLight(0x1a3d52, 1.5);
    this.scene.add(this.ambientLight);
  }

  // =========================================================================
  // 3D ENEMY WARSHIP ON HORIZON + SEARCHLIGHT + SUBSYSTEMS & CIWS
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

    // Superstructure & Bridge (Subsystem 1: Bridge)
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.0, 14), warshipGreyMat);
    bridge.position.set(0, 4.0, 2);
    this.enemyShip.add(bridge);

    const bridgeWindows = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.6, 3),
      new THREE.MeshStandardMaterial({ color: 0x051520, roughness: 0.05, metalness: 0.95, emissive: 0x00e5ff, emissiveIntensity: 0.4 })
    );
    bridgeWindows.position.set(0, 5.0, 7.5);
    this.enemyShip.add(bridgeWindows);

    // Radar Mast & Rotating Phased Array (Subsystem 2: Radar)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 7.0, 8), darkDeckMat);
    mast.position.set(0, 8.5, 0);
    this.enemyShip.add(mast);

    this.enemyRadarDish = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.2), radomeMat);
    this.enemyRadarDish.position.set(0, 12.0, 0);
    this.enemyShip.add(this.enemyRadarDish);

    // Naval Gun Turret on Bow (Subsystem 3: Main Gun Ammo Magazine)
    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 12), darkDeckMat);
    turretBase.position.set(0, 2.8, 14);
    const turretBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5, 8), darkDeckMat);
    turretBarrel.rotation.x = Math.PI / 2.3;
    turretBarrel.position.set(0, 0.4, 2.5);
    turretBase.add(turretBarrel);
    this.enemyShip.add(turretBase);

    // CIWS Gatling Flak Turrets (Port & Starboard)
    const ciwsMat = new THREE.MeshStandardMaterial({ color: 0x1a2228, metalness: 0.9, roughness: 0.3 });
    const ciwsGeom = new THREE.BoxGeometry(0.8, 0.8, 1.2);
    
    this.ciwsPort = new THREE.Mesh(ciwsGeom, ciwsMat);
    this.ciwsPort.position.set(-3.2, 4.2, -4);
    this.enemyShip.add(this.ciwsPort);

    this.ciwsStbd = new THREE.Mesh(ciwsGeom, ciwsMat);
    this.ciwsStbd.position.set(3.2, 4.2, -4);
    this.enemyShip.add(this.ciwsStbd);

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

    // Setup Subsystems Definitions with world hitboxes & 3D glowing markers
    const redHoloMat = new THREE.MeshBasicMaterial({ color: 0xff2200, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const yellowHoloMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.8, side: THREE.DoubleSide });

    this.enemySubsystems = [
      {
        id: 'bridge',
        name: 'Ходовой мостик',
        subName: 'COMMAND BRIDGE',
        localPos: new THREE.Vector3(0, 5.0, 4.0),
        radius: 4.5,
        damageBonus: 'CRITICAL KILL (x2.0)',
        scoreMult: 2.0,
        destroyed: false
      },
      {
        id: 'radar',
        name: 'РЛС / Купол РЭБ',
        subName: 'EW RADAR DOME',
        localPos: new THREE.Vector3(0, 11.5, 0),
        radius: 4.0,
        damageBonus: 'RADAR JAMMED (x1.5)',
        scoreMult: 1.5,
        destroyed: false
      },
      {
        id: 'turret',
        name: 'Носовая башня (БК)',
        subName: 'AMMO MAGAZINE',
        localPos: new THREE.Vector3(0, 3.0, 14.0),
        radius: 4.2,
        damageBonus: 'MAGAZINE DETONATION (x1.8)',
        scoreMult: 1.8,
        destroyed: false
      },
      {
        id: 'engine',
        name: 'Машинное отделение',
        subName: 'ENGINE ROOM',
        localPos: new THREE.Vector3(0, 1.0, -12.0),
        radius: 4.8,
        damageBonus: 'CATASTROPHIC FLOOD (x1.3)',
        scoreMult: 1.3,
        destroyed: false
      }
    ];

    // Add 3D Glowing Hologram Target Rings to each subsystem
    this.enemySubsystems.forEach(sub => {
      const ringGeom = new THREE.RingGeometry(sub.radius * 0.7, sub.radius * 0.85, 16);
      const ringMesh = new THREE.Mesh(ringGeom, sub.id === 'bridge' ? redHoloMat : yellowHoloMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.copy(sub.localPos);
      this.enemyShip.add(ringMesh);
      sub.markerMesh = ringMesh;
    });

    // Towering 35-meter Red Tactical Laser Marker Pillar over Warship (Visible across entire ocean)
    const pillarGeom = new THREE.CylinderGeometry(0.3, 1.8, 45, 12, 1, true);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: 0xff1100,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const markerPillar = new THREE.Mesh(pillarGeom, pillarMat);
    markerPillar.position.set(0, 22.5, 0);
    this.enemyShip.add(markerPillar);

    const shipWarningLight = new THREE.PointLight(0xff0022, 6.0, 35);
    shipWarningLight.position.set(0, 14, 0);
    this.enemyShip.add(shipWarningLight);

    // Position enemy warship (default lobby scale)
    this.enemyShip.position.set(25, -0.6, -65);
    this.enemyShip.rotation.y = THREE.MathUtils.degToRad(-135);
    this.enemyShip.scale.setScalar(0.5);  // Start small, updated by level
    this.scene.add(this.enemyShip);
  }

  // Scale enemy ship model based on shipLevel progression
  updateEnemyShipForLevel(level) {
    if (!this.enemyShip) return;

    // Ship class progression by level
    let scale, className;
    if (level <= 2) {
      scale = 0.5;     // Small patrol boat
      className = 'ПАТРУЛЬНЫЙ КАТЕР';
    } else if (level <= 5) {
      scale = 0.75;    // Cutter / large patrol
      className = 'СТОРОЖЕВОЙ КАТЕР';
    } else if (level <= 9) {
      scale = 1.1;     // Corvette
      className = 'КОРВЕТ';
    } else if (level <= 15) {
      scale = 1.5;     // Frigate
      className = 'ФРЕГАТ';
    } else {
      scale = 2.0;     // Heavy destroyer
      className = 'ЭСМИНЕЦ';
    }

    this.enemyShip.scale.setScalar(scale);
    this._enemyShipClass = className;
  }

  // =========================================================================
  // 1ST-PERSON FPV KAMIKAZE DRONE ENGINE & CIWS COMBAT
  // =========================================================================

  createFpvDroneModel() {
    if (this.fpvDroneMesh) {
      this.scene.remove(this.fpvDroneMesh);
    }

    const drone = new THREE.Group();

    // Carbon-fiber high-speed racing frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.35, metalness: 0.9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.42), frameMat);
    drone.add(body);

    // Front FPV High-Resolution Camera Lens
    const lensHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 12), frameMat);
    lensHousing.rotation.x = Math.PI / 2;
    lensHousing.position.set(0, 0.02, -0.24);
    const glassLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.05, metalness: 0.95, emissive: 0x00ff66, emissiveIntensity: 0.8 })
    );
    glassLens.position.set(0, 0.02, -0.3);
    drone.add(lensHousing);
    drone.add(glassLens);

    // High-Explosive Shaped-Charge Warhead (RPG-7 / HEAT)
    const warheadMat = new THREE.MeshStandardMaterial({ color: 0x2e3b2b, roughness: 0.5, metalness: 0.4 });
    const warheadNose = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 8), warheadMat);
    warheadNose.rotation.x = -Math.PI / 2;
    warheadNose.position.set(0, -0.1, -0.32);
    drone.add(warheadNose);

    // 4 High-KV Brushless Motor Arms & Propellers
    const armMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const propMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.5 });
    const armPositions = [
      { x: 0.28, z: 0.22 }, { x: -0.28, z: 0.22 },
      { x: 0.28, z: -0.22 }, { x: -0.28, z: -0.22 }
    ];

    this.fpvPropellers = [];
    armPositions.forEach(pos => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.35, 6), armMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(pos.x * 0.5, 0.02, pos.z * 0.5);
      drone.add(arm);

      // Motor bell
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8), frameMat);
      motor.position.set(pos.x, 0.06, pos.z);
      drone.add(motor);

      // Spinning translucent prop disc
      const prop = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12), propMat);
      prop.rotation.x = -Math.PI / 2;
      prop.position.set(pos.x, 0.09, pos.z);
      drone.add(prop);
      this.fpvPropellers.push(prop);
    });

    // 6S LiPo Battery Pack (Rear Mounted)
    const battMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.2 });
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 0.32), battMat);
    battery.position.set(0, 0.12, 0.08);
    drone.add(battery);

    // VTX Cloverleaf Antenna
    const antMat = new THREE.MeshStandardMaterial({ color: 0xff3300, roughness: 0.4 });
    const ant = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), antMat);
    ant.position.set(0, 0.3, 0.25);
    drone.add(ant);

    // Jet Thruster / Afterburner Glow
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 });
    this.fpvGlowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), glowMat);
    this.fpvGlowMesh.position.set(0, 0, 0.26);
    drone.add(this.fpvGlowMesh);

    this.scene.add(drone);
    this.fpvDroneMesh = drone;
    this.fpvDroneMesh.visible = false;
  }

  startFpvFlight(onEventCallback, autopilot = false) {
    if (!this.fpvDroneMesh) {
      this.createFpvDroneModel();
    }

    this.fpvFlightActive = true;
    this.fpvAutopilot = autopilot;   // true = lobby auto-flight, false = manual mission control
    if (!autopilot) {
      this.cameraMode = 'fpv';  // Only switch to 1st-person in missions
    }
    if (onEventCallback) this.onMissionEvent = onEventCallback;

    // Launch from boat position
    const launchX = this.pilotBoatPos ? this.pilotBoatPos.x : (this.boatModel ? this.boatModel.position.x : 0);
    const launchZ = this.pilotBoatPos ? this.pilotBoatPos.z : (this.boatModel ? this.boatModel.position.z : 0);
    const launchY = this.boatBaseY + 1.2;

    this.fpvPos.set(launchX, launchY, launchZ);

    // Auto-aim yaw toward enemy ship on launch (both modes)
    if (this.enemyShip) {
      const dx = this.enemyShip.position.x - launchX;
      const dz = this.enemyShip.position.z - launchZ;
      this.fpvYaw = Math.atan2(dx, dz);
    } else {
      this.fpvYaw = this.pilotHeading || 0;
    }

    this.fpvPitch = -0.04;
    this.fpvRoll = 0;
    this.fpvThrottle = autopilot ? 0.85 : 0.7;
    this.fpvBoost = false;
    this.fpvSteerX = 0;
    this.fpvSteerY = 0;
    this.fpvBattery = 25.2;
    this.fpvHP = 100;
    this.fpvFlightTime = 0;
    this.fpvGlitchAmount = 0;
    this.ciwsTracers = [];
    this.ciwsCooldown = 0.8;

    // Launch velocity
    const launchSpeed = autopilot ? 14.0 : 8.0;
    const fwdX = Math.sin(this.fpvYaw) * launchSpeed;
    const fwdZ = Math.cos(this.fpvYaw) * launchSpeed;
    this.fpvVel.set(fwdX, autopilot ? 6.0 : 4.0, fwdZ);

    // Create 3D guide line toward enemy ship (only in manual mode)
    if (!autopilot) {
      this._createFpvGuideLine();
    }

    this.fpvDroneMesh.position.copy(this.fpvPos);
    this.fpvDroneMesh.visible = true;

    if (window.tacticalAudio) {
      window.tacticalAudio.startFpvMotorSound();
      window.tacticalAudio.playMissileLaunch();
    }
  }

  stopFpvFlight() {
    this.fpvFlightActive = false;
    if (this.fpvDroneMesh) {
      this.fpvDroneMesh.visible = false;
    }
    if (window.tacticalAudio) {
      window.tacticalAudio.stopFpvMotorSound();
    }
    // Clean up CIWS flak tracers
    this.ciwsTracers.forEach(tr => this.scene.remove(tr.mesh));
    this.ciwsTracers = [];
    // Remove 3D guide line and waypoint marker
    if (this._fpvGuideLine) {
      this.scene.remove(this._fpvGuideLine);
      this._fpvGuideLine = null;
    }
    if (this._fpvGuideMarker) {
      this.scene.remove(this._fpvGuideMarker);
      this._fpvGuideMarker = null;
    }
  }

  // 3D Laser Guide Line: a pulsing dashed line from drone toward enemy warship
  _createFpvGuideLine() {
    if (this._fpvGuideLine) this.scene.remove(this._fpvGuideLine);
    if (this._fpvGuideMarker) this.scene.remove(this._fpvGuideMarker);

    // Thick glowing guide beam (cylinder-based, not Line which is always 1px)
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 6, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this._fpvGuideLine = new THREE.Mesh(beamGeo, beamMat);
    this.scene.add(this._fpvGuideLine);

    // Pulsing 3D diamond waypoint marker over target
    const markerGeo = new THREE.OctahedronGeometry(2.5, 0);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.7,
      wireframe: true
    });
    this._fpvGuideMarker = new THREE.Mesh(markerGeo, markerMat);
    this.scene.add(this._fpvGuideMarker);
  }

  _updateFpvGuideLine() {
    if (!this._fpvGuideLine || !this.enemyShip || !this.fpvDroneMesh) return;

    // Beam from drone toward enemy ship
    const dronePos = this.fpvPos.clone();
    const targetPos = this.enemyShip.position.clone();
    targetPos.y += 10.0;

    // Position beam at midpoint, stretch to full distance, orient toward target
    const midPoint = dronePos.clone().add(targetPos).multiplyScalar(0.5);
    const dist = dronePos.distanceTo(targetPos);

    this._fpvGuideLine.position.copy(midPoint);
    this._fpvGuideLine.scale.set(1, dist, 1);
    this._fpvGuideLine.lookAt(targetPos);
    this._fpvGuideLine.rotateX(Math.PI / 2);

    // Pulse beam opacity
    const t = performance.now() * 0.003;
    this._fpvGuideLine.material.opacity = 0.25 + Math.sin(t * 4.0) * 0.2;

    // Update waypoint marker position and animation
    if (this._fpvGuideMarker) {
      this._fpvGuideMarker.position.copy(targetPos);
      this._fpvGuideMarker.position.y += 4.0 + Math.sin(t * 2.0) * 1.5;
      this._fpvGuideMarker.rotation.y += 0.03;
      this._fpvGuideMarker.material.opacity = 0.5 + Math.sin(t * 3.0) * 0.3;
    }
  }

  setFpvInput(steerX, steerY, throttle, boost) {
    this.fpvSteerX = Math.max(-1.0, Math.min(1.0, steerX));
    this.fpvSteerY = Math.max(-1.0, Math.min(1.0, steerY));
    this.fpvThrottle = Math.max(0.0, Math.min(1.0, throttle));
    this.fpvBoost = !!boost;
  }

  updateFpvFlight(dt, t) {
    if (!this.fpvFlightActive || !this.fpvDroneMesh) return;

    this.fpvFlightTime += dt;
    // Battery discharge
    this.fpvBattery = Math.max(19.0, this.fpvBattery - (this.fpvBoost ? 0.22 : 0.08) * dt);

    // Check battery dead
    if (this.fpvBattery <= 20.0) {
      this.stopFpvFlight();
      if (this.onMissionEvent) {
        this.onMissionEvent('fpv_crashed', { reason: 'Аккумулятор LiPo 6S полностью разряжен' });
      }
      return;
    }

    // =====================================================
    // AUTOPILOT MODE (Lobby) vs MANUAL MODE (Missions)
    // =====================================================
    if (this.fpvAutopilot && this.enemyShip) {
      // ---- AUTOPILOT: Drone flies itself toward enemy ship ----
      const toTargetX = this.enemyShip.position.x - this.fpvPos.x;
      const toTargetZ = this.enemyShip.position.z - this.fpvPos.z;
      const toTargetY = (this.enemyShip.position.y + 3.0) - this.fpvPos.y;
      const horizDist = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);
      const targetYaw = Math.atan2(toTargetX, toTargetZ);

      // Smooth yaw steering toward target
      let yawDiff = targetYaw - this.fpvYaw;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      this.fpvYaw += yawDiff * Math.min(1.0, 2.0 * dt);

      // Auto-pitch: dive toward target at close range
      const desiredPitch = horizDist < 25 ? -Math.atan2(toTargetY - 2.0, horizDist) * 0.4 : -0.03;
      this.fpvPitch += (desiredPitch - this.fpvPitch) * Math.min(1.0, 2.0 * dt);
      this.fpvPitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, this.fpvPitch));

      // Banking into turns
      const turnAmount = Math.max(-1, Math.min(1, yawDiff * 2.0));
      const autoTargetRoll = -turnAmount * 0.45;
      this.fpvRoll += (autoTargetRoll - this.fpvRoll) * Math.min(1.0, 3.0 * dt);

      const euler = new THREE.Euler(this.fpvPitch, this.fpvYaw, this.fpvRoll, 'YXZ');
      this.fpvDroneMesh.quaternion.setFromEuler(euler);

      // Autopilot speed: faster and more aggressive
      const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(this.fpvDroneMesh.quaternion);
      const autoSpeed = horizDist < 30 ? 28.0 : 38.0;
      this.fpvVel.lerp(forwardVector.multiplyScalar(autoSpeed), Math.min(1.0, 5.0 * dt));
      this.fpvVel.y -= 1.0 * dt;

      // Auto-impact when very close to warship hull
      if (horizDist < 7.0) {
        this.create3DExplosion(this.fpvPos.clone());
        this.stopFpvFlight();
        if (this.onMissionEvent) {
          this.onMissionEvent('fpv_hit', { subsystem: 'hull', name: 'Корпус', damageBonus: 1.5 });
        }
        return;
      }
    } else {
      // ---- MANUAL MODE: Player-controlled FPV flight (missions only) ----

      // HOVER MODE: stabilize position, dampen velocity, hold altitude
      if (this.fpvHover) {
        // Dampen all velocity rapidly
        this.fpvVel.multiplyScalar(Math.max(0, 1.0 - 4.0 * dt));
        
        // Hold altitude with gentle correction
        const targetY = Math.max(3.0, this.fpvPos.y); // Don't let it sink
        this.fpvVel.y += (targetY - this.fpvPos.y) * 0.5 * dt;
        
        // Still allow slow yaw rotation for looking around
        this.fpvYaw -= this.fpvSteerX * 0.6 * dt;
        this.fpvPitch += this.fpvSteerY * 0.3 * dt;
        this.fpvPitch = Math.max(-0.3, Math.min(0.3, this.fpvPitch));
        
        // Stabilize roll to zero
        this.fpvRoll += (0 - this.fpvRoll) * Math.min(1.0, 5.0 * dt);
        
        const euler = new THREE.Euler(this.fpvPitch, this.fpvYaw, this.fpvRoll, 'YXZ');
        this.fpvDroneMesh.quaternion.setFromEuler(euler);
      } else {
        // Normal flight mode with PID Controller & Expo Curves
        const pGain = (this.fpvPidSettings && this.fpvPidSettings.pGain) ? this.fpvPidSettings.pGain : 1.0;
        const dGain = (this.fpvPidSettings && this.fpvPidSettings.dGain) ? this.fpvPidSettings.dGain : 1.0;
        const expo = (this.fpvPidSettings && this.fpvPidSettings.expo) ? this.fpvPidSettings.expo : 1.0;

        // Apply stick expo
        const rawSteerX = this.fpvSteerX;
        const rawSteerY = this.fpvSteerY;
        const shapedSteerX = Math.sign(rawSteerX) * (Math.abs(rawSteerX) * (1.0 - (expo - 1.0) * 0.35) + Math.pow(Math.abs(rawSteerX), 3) * ((expo - 1.0) * 0.35));
        const shapedSteerY = Math.sign(rawSteerY) * (Math.abs(rawSteerY) * (1.0 - (expo - 1.0) * 0.35) + Math.pow(Math.abs(rawSteerY), 3) * ((expo - 1.0) * 0.35));

        // AI Terminal Guidance Override under EW (RSSI < 25% & AI module active)
        if (this.fpvAiModuleActive && this.fpvGlitchAmount > 0.65 && this.enemyShip) {
          const toTargetX = this.enemyShip.position.x - this.fpvPos.x;
          const toTargetZ = this.enemyShip.position.z - this.fpvPos.z;
          const toTargetY = (this.enemyShip.position.y + 4.0) - this.fpvPos.y;
          const distH = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ);
          const aiTargetYaw = Math.atan2(toTargetX, toTargetZ);

          let diffYaw = aiTargetYaw - this.fpvYaw;
          while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
          while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
          this.fpvYaw += diffYaw * Math.min(1.0, 4.5 * dt);

          const aiPitch = -Math.atan2(toTargetY, Math.max(1, distH));
          this.fpvPitch += (aiPitch - this.fpvPitch) * Math.min(1.0, 4.0 * dt);
          this.fpvRoll += (-diffYaw * 0.6 - this.fpvRoll) * Math.min(1.0, 5.0 * dt);

          if (!this._aiLockAudioTriggered) {
            this._aiLockAudioTriggered = true;
            if (window.tacticalAudio) window.tacticalAudio.playAiLockEngaged();
            if (this.onMissionEvent) this.onMissionEvent('fpv_ai_terminal_engaged', { label: 'ИИ-НАВЕДЕНИЕ NPU JETSON [АКТИВНО]' });
          }
        } else {
          this._aiLockAudioTriggered = false;
          const turnRate = 1.35 * pGain;
          const pitchRate = 1.05 * pGain;

          this.fpvPitch += shapedSteerY * pitchRate * dt;
          this.fpvPitch = Math.max(-Math.PI / 3.0, Math.min(Math.PI / 3.5, this.fpvPitch));

          this.fpvYaw -= shapedSteerX * turnRate * dt;

          // Natural banking roll when turning (smoothed with D-Gain)
          const targetRoll = -shapedSteerX * 0.58;
          this.fpvRoll += (targetRoll - this.fpvRoll) * Math.min(1.0, 3.8 * dGain * dt);
        }

        // Apply orientation quaternion using Euler YXZ
        const euler = new THREE.Euler(this.fpvPitch, this.fpvYaw, this.fpvRoll, 'YXZ');
        this.fpvDroneMesh.quaternion.setFromEuler(euler);

        // Linear Flight Velocity & Thrust (smooth and controllable)
        const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(this.fpvDroneMesh.quaternion);
        const speed = (this.fpvBoost ? 34.0 : 20.0) * (0.5 + this.fpvThrottle * 0.5);

        // Very smooth forward acceleration (lerp damped by D-Gain)
        this.fpvVel.lerp(forwardVector.multiplyScalar(speed), Math.min(1.0, 4.5 * dGain * dt));

        // Aerodynamic gravity when diving / climbing
        this.fpvVel.y -= 1.4 * dt;
      }

      // Update 3D guide line from drone toward enemy ship
      this._updateFpvGuideLine();

      // Animate recon markers (pulsing rings)
      if (this.reconMarkers && this.reconMarkers.length > 0) {
        this.reconMarkers.forEach(marker => {
          if (!marker.parent) return;
          marker.children.forEach((child, ci) => {
            if (ci === 1 || ci === 2) { // rings
              child.rotation.z = t * (ci === 1 ? 0.5 : -0.3);
              const pulse = 0.8 + Math.sin(t * 3 + ci) * 0.2;
              child.scale.set(pulse, pulse, 1);
            }
            if (ci === 3) { // diamond
              child.position.y = 10 + Math.sin(t * 2) * 2;
              child.rotation.y = t * 1.5;
            }
          });
        });
      }
    }

    this.fpvPos.addScaledVector(this.fpvVel, dt);
    this.fpvDroneMesh.position.copy(this.fpvPos);

    // Spin propellers
    this.fpvPropellers.forEach((p, idx) => {
      p.rotation.z += dt * (this.fpvBoost ? 80 : 45) * (idx % 2 === 0 ? 1 : -1);
    });

    // Audio frequency update
    if (window.tacticalAudio) {
      window.tacticalAudio.updateFpvMotorSound(this.fpvThrottle, this.fpvBoost);
    }

    // 3. Camera Position (1st Person POV from nose) — ONLY in manual/mission mode
    if (!this.fpvAutopilot) {
      // Hide 1st-person drone body to eliminate black camera clipping spot
      this.fpvDroneMesh.visible = false;
      const camFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.fpvDroneMesh.quaternion);
      this.camera.position.copy(this.fpvPos).addScaledVector(camFwd, 0.45);
      this.camera.position.y += 0.05;
      this.camera.quaternion.copy(this.fpvDroneMesh.quaternion);

      // Slight tactical vibration based on speed
      const jitter = (this.fpvBoost ? 0.02 : 0.006);
      this.camera.position.x += (Math.random() - 0.5) * jitter;
      this.camera.position.y += (Math.random() - 0.5) * jitter;
    } else {
      // Autopilot (lobby): drone stays visible as 3D object, camera stays in lobby orbit
      this.fpvDroneMesh.visible = true;
    }

    // 4. Rotor Wash Trail Particles
    if (Math.random() > 0.35) {
      const smoke = this._acquireFromPool(this._smokePool);
      if (smoke) {
        smoke.visible = true;
        smoke.userData.active = true;
        smoke.scale.set(0.5, 0.5, 0.5);
        smoke.material.opacity = 0.35;
        smoke.material.color.setHex(this.fpvBoost ? 0x00ffcc : 0x88bbdd);
        smoke.position.copy(this.fpvPos);
        smoke.userData.life = 0;
        smoke.userData.maxLife = 0.4;
        this.explosionParticles.push(smoke);
      }
    }

    // 5. Water Surface Collision Check
    if (this.fpvPos.y <= 0.35) {
      this.create3DExplosion(this.fpvPos);
      this.stopFpvFlight();
      if (this.onMissionEvent) {
        this.onMissionEvent('fpv_crashed', { reason: 'Столкновение с водной поверхностью на высокой скорости' });
      }
      return;
    }

    // 6. Subsystem Hitbox & Target Collision Detection
    if (this.enemyShip) {
      let hitSubsystem = null;
      let minHitDist = Infinity;

      for (let sub of this.enemySubsystems) {
        const worldPos = this.enemyShip.localToWorld(sub.localPos.clone());
        const dist = this.fpvPos.distanceTo(worldPos);

        // Lock-on target detection
        if (dist < 85.0 && dist < minHitDist) {
          minHitDist = dist;
          this.fpvLockTarget = { ...sub, worldPos: worldPos, dist: Math.round(dist) };
        }

        // Direct Hit Detection
        if (dist <= sub.radius) {
          hitSubsystem = sub;
          break;
        }
      }

      // General Warship Hull Collision fallback
      const distToShipCenter = this.fpvPos.distanceTo(this.enemyShip.position);
      if (!hitSubsystem && distToShipCenter < 7.5) {
        hitSubsystem = this.enemySubsystems[0]; // Bridge / Hull fallback
      }

      if (hitSubsystem) {
        // TARGET STRUCK! MASSIVE TRIUMPH EXPLOSION
        this.create3DExplosion(this.fpvPos);
        setTimeout(() => this.triggerShipExplosion(), 150);

        // Mark subsystem destroyed
        hitSubsystem.destroyed = true;

        // Start warship sinking sequence
        this.startEnemyShipSinking();

        // Switch to slow-mo cinematic orbit camera
        this.startCinematicOrbit(this.enemyShip.position);

        this.stopFpvFlight();

        if (this.onMissionEvent) {
          this.onMissionEvent('fpv_target_hit', {
            subsystem: hitSubsystem.name,
            subName: hitSubsystem.subName,
            damageBonus: hitSubsystem.damageBonus,
            scoreMult: hitSubsystem.scoreMult,
            flightTime: this.fpvFlightTime.toFixed(1),
            remainingBattery: this.fpvBattery.toFixed(1)
          });
        }
      }
    }
  }

  // =========================================================================
  // ENEMY WARSHIP CIWS ANTI-AIR FLAK DEFENSE
  // =========================================================================
  updateCiwsFlak(dt, t) {
    if (!this.fpvFlightActive || !this.enemyShip) return;

    const distToShip = this.fpvPos.distanceTo(this.enemyShip.position);

    // CIWS Engagement Range: 70m (nerfed — gives player more approach time)
    if (distToShip < 70.0 && distToShip > 10.0) {
      this.ciwsCooldown -= dt;
      if (this.ciwsCooldown <= 0) {
        this.ciwsCooldown = 1.5 + Math.random() * 1.0;  // Much slower fire rate
        this.fireCiwsSalvo();
      }
    }

    // Update In-Flight Flak Tracers
    for (let i = this.ciwsTracers.length - 1; i >= 0; i--) {
      const tr = this.ciwsTracers[i];
      tr.life += dt;
      tr.mesh.position.addScaledVector(tr.dir, tr.speed * dt);

      // Distance to FPV drone
      const distToDrone = tr.mesh.position.distanceTo(this.fpvPos);
      if (distToDrone < 1.5) {
        // FLAK HIT ON FPV DRONE! (smaller hit radius, less damage)
        this.scene.remove(tr.mesh);
        this.ciwsTracers.splice(i, 1);
        this.fpvHP = Math.max(0, this.fpvHP - 8);
        this.fpvGlitchAmount = 1.0;

        if (window.tacticalAudio) {
          window.tacticalAudio.playShieldHit();
          window.tacticalAudio.playGlitchStatic();
        }

        if (this.onMissionEvent) {
          this.onMissionEvent('fpv_damaged', { hp: this.fpvHP });
        }

        if (this.fpvHP <= 0) {
          this.create3DExplosion(this.fpvPos);
          this.stopFpvFlight();
          if (this.onMissionEvent) {
            this.onMissionEvent('fpv_crashed', { reason: 'FPV-дрон сбит зенитным огнём CIWS корабля противника' });
          }
          return;
        }
        continue;
      }

      if (tr.life >= tr.maxLife || tr.mesh.position.y <= 0) {
        this.scene.remove(tr.mesh);
        this.ciwsTracers.splice(i, 1);
      }
    }
  }

  fireCiwsSalvo() {
    if (!this.enemyShip) return;
    const origin = this.enemyShip.position.clone();
    origin.y += 3.5;

    // CIWS Gatling Sound
    if (window.tacticalAudio) window.tacticalAudio.playCiwsBurst();

    // Fire 2-3 tracer rounds with slight dispersion
    for (let i = 0; i < 3; i++) {
      const tracerGeom = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 6);
      const tracerMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });
      const mesh = new THREE.Mesh(tracerGeom, tracerMat);

      mesh.position.copy(origin);
      // Predict lead target position
      const leadTarget = this.fpvPos.clone().addScaledVector(this.fpvVel, 0.25 + i * 0.08);
      leadTarget.x += (Math.random() - 0.5) * 5.0;
      leadTarget.y += (Math.random() - 0.5) * 3.0;
      leadTarget.z += (Math.random() - 0.5) * 5.0;

      mesh.lookAt(leadTarget);
      mesh.rotateX(Math.PI / 2);

      const dir = new THREE.Vector3().subVectors(leadTarget, origin).normalize();
      this.scene.add(mesh);
      this.ciwsTracers.push({
        mesh: mesh,
        dir: dir,
        speed: 110.0,
        life: 0,
        maxLife: 2.2
      });
    }
  }

  // =========================================================================
  // WARSHIP SINKING & CINEMATIC ORBIT
  // =========================================================================
  startEnemyShipSinking() {
    this.shipSinking.active = true;
    this.shipSinking.progress = 0;
    this.shipSinking.roll = 0;
    this.shipSinking.pitch = 0;
    this.shipSinking.depth = 0;
    this.isEnemyBurning = true;
  }

  updateEnemyShipSinking(dt, t) {
    if (!this.shipSinking.active || !this.enemyShip) return;

    this.shipSinking.progress += dt * 0.15; // Slow dramatic sinking
    const p = Math.min(1.0, this.shipSinking.progress);

    // List to starboard and pitch down by the bow
    this.enemyShip.rotation.z = -p * 0.65;
    this.enemyShip.rotation.x = p * 0.35;
    this.enemyShip.position.y = -0.6 - p * 8.0;

    // Periodic secondary explosions
    if (Math.random() > 0.88) {
      const blastPos = this.enemyShip.position.clone();
      blastPos.x += (Math.random() - 0.5) * 6;
      blastPos.z += (Math.random() - 0.5) * 14;
      blastPos.y += 2 + Math.random() * 3;
      this.create3DExplosion(blastPos);
    }
  }

  startCinematicOrbit(targetPos) {
    this.cameraMode = 'cinematic_orbit';
    this.cinematicOrbit.active = true;
    this.cinematicOrbit.center.copy(targetPos);
    this.cinematicOrbit.angle = 0;
    this.cinematicOrbit.radius = 32.0;
    this.cinematicOrbit.height = 12.0;
  }

  updateCinematicOrbit(dt) {
    if (!this.cinematicOrbit.active) return;
    this.cinematicOrbit.angle += dt * this.cinematicOrbit.speed;
    const cx = this.cinematicOrbit.center.x + Math.sin(this.cinematicOrbit.angle) * this.cinematicOrbit.radius;
    const cz = this.cinematicOrbit.center.z + Math.cos(this.cinematicOrbit.angle) * this.cinematicOrbit.radius;
    const cy = this.cinematicOrbit.center.y + this.cinematicOrbit.height;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.cinematicOrbit.center.x, this.cinematicOrbit.center.y + 2.0, this.cinematicOrbit.center.z);
  }

  // =========================================================================
  // LOBBY DRONE STRIKE — Simple animated 3D drone, NO FPV system
  // Camera stays in lobby orbit, drone flies as visual effect only
  // =========================================================================
  launchMissileStrike(onImpactCallback) {
    this._launchLobbyDrone(onImpactCallback);
  }

  launch3DMissile(targetPos, onImpactCallback) {
    this._launchLobbyDrone(onImpactCallback);
  }

  _launchLobbyDrone(onImpactCallback) {
    // Create a small drone mesh for the lobby animation
    const droneGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.3, 0.08, 0.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    droneGroup.add(body);

    // Arms + rotors
    const armPositions = [
      [0.2, 0, 0.2], [-0.2, 0, 0.2], [0.2, 0, -0.2], [-0.2, 0, -0.2]
    ];
    const rotors = [];
    armPositions.forEach(pos => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      arm.rotation.z = Math.PI / 4 * (pos[0] > 0 ? 1 : -1);
      arm.rotation.x = Math.PI / 4 * (pos[2] > 0 ? 1 : -1);
      arm.position.set(pos[0] * 0.5, 0, pos[2] * 0.5);
      droneGroup.add(arm);

      const rotor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.01, 8),
        new THREE.MeshStandardMaterial({ color: 0x555555, transparent: true, opacity: 0.6 })
      );
      rotor.position.set(pos[0], 0.04, pos[2]);
      droneGroup.add(rotor);
      rotors.push(rotor);
    });

    // Launch from boat
    const startX = this.boatModel ? this.boatModel.position.x : 0;
    const startZ = this.boatModel ? this.boatModel.position.z : 0;
    const startY = this.boatBaseY + 1.5;

    // Target: enemy ship or default position
    const targetPos = this.enemyShip
      ? this.enemyShip.position.clone()
      : new THREE.Vector3(38, -0.6, -75);

    droneGroup.position.set(startX, startY, startZ);
    this.scene.add(droneGroup);

    // Play launch sound
    if (window.tacticalAudio) {
      window.tacticalAudio.playMissileLaunch();
    }

    // Animate as an active missile entry (matches animation loop format)
    this.activeMissiles.push({
      mesh: droneGroup,
      propellers: rotors,
      startPos: new THREE.Vector3(startX, startY, startZ),
      liftOffPos: new THREE.Vector3(startX, startY + 4.0, startZ),
      targetPos: targetPos.clone().setY(targetPos.y + 2.0),
      progress: 0,
      duration: 3.0,  // ~3 seconds flight
      onImpact: () => {
        // Explosion is already called by the animation loop (line ~2079)
        // Just run the game callback safely
        try {
          if (onImpactCallback) onImpactCallback();
        } catch (e) {
          console.error('Lobby drone impact callback error:', e);
        }
      }
    });
  }

  triggerShipExplosion() {
    const shipPos = this.enemyShip ? this.enemyShip.position.clone() : new THREE.Vector3(38, -0.6, -75);
    this.create3DExplosion(shipPos);
    setTimeout(() => this.create3DExplosion(shipPos.clone().add(new THREE.Vector3(3, 2, -5))), 200);
    setTimeout(() => this.create3DExplosion(shipPos.clone().add(new THREE.Vector3(-4, 1, 3))), 400);
  }

  create3DExplosion(pos) {
    if (window.tacticalAudio) window.tacticalAudio.playExplosion();

    this.isEnemyBurning = true;

    if (!this._blastLight) {
      this._blastLight = new THREE.PointLight(0xffaa22, 0, 50, 1.2);
      this.scene.add(this._blastLight);
    }
    this._blastLight.position.copy(pos);
    this._blastLight.position.y += 3;
    this._blastLight.intensity = 14.0;
    setTimeout(() => { if (this._blastLight) this._blastLight.intensity = 0; }, 500);

    for (let i = 0; i < 32; i++) {
      const p = this._acquireFromPool(this._explosionPool);
      if (!p) break;
      p.visible = true;
      p.userData.active = true;
      p.position.copy(pos);
      p.scale.set(1, 1, 1);
      p.material.color.setHex(Math.random() > 0.4 ? 0xff4400 : 0xffcc00);
      p.material.opacity = 0.95;
      p.userData.vx = (Math.random() - 0.5) * 40;
      p.userData.vy = Math.random() * 30 + 10;
      p.userData.vz = (Math.random() - 0.5) * 40;
      p.userData.life = 0;
      p.userData.maxLife = 1.0 + Math.random() * 0.6;
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
      case 'c1': // Antonivskyi Bridge (Storm)
      case 'sector-1':
        this.weatherType = 'storm';
        this.scene.fog.color.setHex(0x152820);
        this.scene.fog.density = 0.0035;
        this.water.material.uniforms['waterColor'].value.setHex(0x142818);
        skyUniforms['turbidity'].value = 3.5;
        skyUniforms['rayleigh'].value = 2.4;
        this.sunLight.intensity = 2.2;
        this.sunLight.color.setHex(0xd8c8a0);
        break;

      case 'c2': // Kakhovka Dam (Night Infiltration)
      case 'sector-2':
        this.weatherType = 'night';
        this.scene.fog.color.setHex(0x04100a);
        this.scene.fog.density = 0.005;
        this.water.material.uniforms['waterColor'].value.setHex(0x081208);
        skyUniforms['turbidity'].value = 8.0;
        skyUniforms['rayleigh'].value = 0.2;
        this.sunLight.intensity = 0.6;
        this.sunLight.color.setHex(0x5588cc);
        this.greenGlow.intensity = 2.4;
        break;

      case 'sector-3': // Kherson Port (Sunset)
        this.weatherType = 'sunset';
        this.scene.fog.color.setHex(0x382418);
        this.scene.fog.density = 0.003;
        this.water.material.uniforms['waterColor'].value.setHex(0x1a1508);
        skyUniforms['turbidity'].value = 4.0;
        skyUniforms['rayleigh'].value = 4.5;
        this.sunLight.intensity = 3.0;
        this.sunLight.color.setHex(0xff7733);
        break;

      case 'sector-4': // Dnipro Delta (Dawn Mist)
        this.weatherType = 'dawn';
        this.scene.fog.color.setHex(0x1a2e20);
        this.scene.fog.density = 0.0045;
        this.water.material.uniforms['waterColor'].value.setHex(0x102218);
        skyUniforms['turbidity'].value = 2.0;
        skyUniforms['rayleigh'].value = 2.0;
        this.sunLight.intensity = 2.4;
        this.sunLight.color.setHex(0xfff0d0);
        break;
    }
  }

  // =========================================================================
  // LOAD GLB MODEL & HIGH-TECH BOAT SHADERS
  // =========================================================================
  loadGLBModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('[BARRACUDA 3D] GLTFLoader undefined, creating sleek procedural boat.');
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

          // Preserve and enhance original PBR materials without texture corruption
          this.boatModel.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.roughness = Math.max(0.15, (child.material.roughness !== undefined ? child.material.roughness : 0.4) * 0.9);
                child.material.metalness = Math.min(0.9, (child.material.metalness !== undefined ? child.material.metalness : 0.6) + 0.1);
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

    // High-tech stealth materials
    const stealthCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x12171c,
      roughness: 0.25,
      metalness: 0.85
    });
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x182028,
      roughness: 0.35,
      metalness: 0.75
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x2a333d,
      roughness: 0.2,
      metalness: 0.9
    });
    const glassSensorMat = new THREE.MeshStandardMaterial({
      color: 0x051d28,
      roughness: 0.05,
      metalness: 0.98,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.4
    });
    const ledGlowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    // 1. Multi-chine Hydrodynamic V-Hull
    const hullGeom = new THREE.CylinderGeometry(0.7, 0.9, 4.4, 6);
    hullGeom.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeom, stealthCarbonMat);
    hull.position.set(0, 0.25, 0);
    this.boatModel.add(hull);

    // 2. Piercing Wave-Cutter Bow (Angular stealth nose)
    const bowGeom = new THREE.ConeGeometry(0.7, 2.2, 5);
    bowGeom.rotateX(-Math.PI / 2);
    const bow = new THREE.Mesh(bowGeom, stealthCarbonMat);
    bow.position.set(0, 0.25, 3.1);
    this.boatModel.add(bow);

    // 3. Faceted Low-RCS Superstructure & Payload Deck
    const deckGeom = new THREE.BoxGeometry(1.25, 0.35, 2.4);
    const deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(0, 0.55, -0.2);
    this.boatModel.add(deck);

    // 4. Flat Starlink / Satcom Phased Array Dome
    const satcomBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.1, 16), trimMat);
    satcomBase.position.set(0, 0.75, -0.6);
    const satcomDome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.2), glassSensorMat);
    satcomDome.position.set(0, 0.78, -0.6);
    this.boatModel.add(satcomBase);
    this.boatModel.add(satcomDome);

    // 5. Gyro-stabilized Electro-Optical FLIR Turret (Bow)
    const flirBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.15, 12), trimMat);
    flirBase.position.set(0, 0.65, 1.3);
    const flirBall = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), stealthCarbonMat);
    flirBall.position.set(0, 0.8, 1.3);
    const flirLens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), glassSensorMat);
    flirLens.position.set(0, 0.8, 1.45);
    this.boatModel.add(flirBase);
    this.boatModel.add(flirBall);
    this.boatModel.add(flirLens);

    // 6. Dual High-Thrust Waterjet Nozzles (Stern)
    const jetGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.45, 12);
    jetGeom.rotateX(Math.PI / 2);
    const jetL = new THREE.Mesh(jetGeom, trimMat);
    jetL.position.set(-0.35, 0.15, -2.35);
    const jetR = jetL.clone();
    jetR.position.x = 0.35;
    this.boatModel.add(jetL);
    this.boatModel.add(jetR);

    // 7. Tactical Green Neon Hull Accent Lines
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 3.4), ledGlowMat);
    stripL.position.set(-0.75, 0.42, 0.2);
    const stripR = stripL.clone();
    stripR.position.x = 0.75;
    this.boatModel.add(stripL);
    this.boatModel.add(stripR);

    this.scene.add(this.boatModel);
    this.boatBaseY = 0.0;
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
        this.targetRotation.y += dx * 0.007;
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
          this.targetRotation.y += dx * 0.008;
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
    try {
    const t = this.clock.getElapsedTime();
    const dt = 0.016;

    // Camera Mode Switching: Cinematic Orbit, FPV 1st-person, Boat Chase, FLIR, or Base Orbit
    if (this.cameraMode === 'cinematic_orbit') {
      this.updateCinematicOrbit(dt);
    } else if (this.cameraMode === 'fpv' && this.fpvFlightActive) {
      // Handled dynamically in updateFpvFlight
    } else if (this.pilotMode && this.boatModel) {
      // =========================================================================
      // 3RD-PERSON CHASE CAMERA — BOAT PILOTING IN MISSIONS
      // =========================================================================
      const forwardX = Math.sin(this.pilotHeading);
      const forwardZ = Math.cos(this.pilotHeading);
      const waveJitter = Math.sin(t * 2.5) * 0.03;

      // Camera behind and above the boat
      const chaseDist = 8.0;
      const chaseHeight = 3.5;
      const camX = this.pilotBoatPos.x - forwardX * chaseDist;
      const camZ = this.pilotBoatPos.z - forwardZ * chaseDist;
      const camY = this.boatBaseY + chaseHeight + waveJitter;

      const targetCamPos = new THREE.Vector3(camX, camY, camZ);
      this.camera.position.lerp(targetCamPos, 0.12);

      // Look at a point ahead of the boat
      const lookAheadDist = 12.0;
      const rawLookTarget = new THREE.Vector3(
        this.pilotBoatPos.x + forwardX * lookAheadDist,
        this.boatBaseY + 0.8,
        this.pilotBoatPos.z + forwardZ * lookAheadDist
      );
      this.smoothLookTarget.lerp(rawLookTarget, 0.15);
      this.camera.lookAt(this.smoothLookTarget);

      // Keep camera upright — no roll
      this.camera.up.set(0, 1, 0);
    } else if (this.cameraMode === 'flir') {
      // Look directly through thermal FLIR optic towards enemy ship
      const shipPos = this.enemyShip ? this.enemyShip.position : new THREE.Vector3(38, 2, -75);
      this.camera.position.set(0, 2.2, 2.5);
      this.camera.lookAt(shipPos.x, shipPos.y + 3, shipPos.z);
    } else {
      // =========================================================================
      // LOBBY / BASE: SMOOTH ORBIT CAMERA TRACKING AUTONOMOUS DRONE CRUISE
      // =========================================================================
      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

      const trackCenter = this.boatModel ? this.boatModel.position : new THREE.Vector3(0, 0, 0);
      const R = 11.5;
      const camX = trackCenter.x + R * Math.sin(this.currentRotation.y) * Math.cos(this.currentRotation.x);
      const camZ = trackCenter.z + R * Math.cos(this.currentRotation.y) * Math.cos(this.currentRotation.x);
      const camY = Math.max(1.2, R * Math.sin(this.currentRotation.x));

      this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.15);
      this.camera.lookAt(trackCenter.x, trackCenter.y + 0.35, trackCenter.z);
    }

    // Update FPV Flight Physics & Drone controls
    this.updateFpvFlight(dt, t);

    // Update CIWS Anti-Air Flak
    this.updateCiwsFlak(dt, t);

    // Update Enemy Warship Sinking & Chain Explosions
    this.updateEnemyShipSinking(dt, t);

    // Lightning
    this.updateLightning(dt);

    // Rain
    this.updateRain(dt);

    // Clouds
    if (this.cloudsGroup) {
      this.cloudsGroup.rotation.y = t * 0.008;
    }

    // Water
    if (this.water && this.water.material && this.water.material.uniforms['time']) {
      this.water.material.uniforms['time'].value += dt * 0.9;
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
      // Dynamic Positioning System (DPS Auto-Hold Anchor)
      if (this.dpsActive) {
        const dpsDx = this.dpsAnchorPos.x - this.pilotBoatPos.x;
        const dpsDz = this.dpsAnchorPos.z - this.pilotBoatPos.z;
        const dpsDist = Math.hypot(dpsDx, dpsDz);
        if (dpsDist > 0.4) {
          const targetHeading = Math.atan2(dpsDx, dpsDz);
          let hDiff = targetHeading - this.pilotHeading;
          while (hDiff > Math.PI) hDiff -= Math.PI * 2;
          while (hDiff < -Math.PI) hDiff += Math.PI * 2;
          this.pilotHeading += hDiff * Math.min(1.0, 3.0 * dt);
          this.pilotSpeed += (Math.min(4.0, dpsDist * 1.5) - this.pilotSpeed) * Math.min(1.0, 4.0 * dt);
        } else {
          this.pilotSpeed *= Math.max(0, 1.0 - 5.0 * dt);
        }
      } else {
        // Normal Manual Piloting
        const maxForwardSpeed = (this.pilotBoost ? 36.0 : 22.0) * (this.currentDepth < 0.85 ? 0.55 : 1.0);
        const maxReverseSpeed = -8.0;
        const accelRate = (this.pilotThrottle > 0 ? 12.0 : 18.0) * dt;

        // Update speed with inertia:
        const targetSpeed = this.pilotThrottle > 0 ? this.pilotThrottle * maxForwardSpeed : this.pilotThrottle * (-maxReverseSpeed);
        this.pilotSpeed += (targetSpeed - this.pilotSpeed) * Math.min(1.0, accelRate);

        // Hydrodynamic turning authority: VSA ON (tight control) vs VSA OFF (drift mode)
        const maxTurnRate = this.vsaEnabled ? 1.25 : 2.45;
        const speedFactor = Math.min(1.0, Math.max(0.2, Math.abs(this.pilotSpeed) / 10.0));
        const targetAngularVel = -this.pilotSteer * maxTurnRate * speedFactor;
        this.pilotAngularVelocity += (targetAngularVel - this.pilotAngularVelocity) * Math.min(1.0, (this.vsaEnabled ? 5.5 : 8.0) * dt);
        this.pilotHeading += this.pilotAngularVelocity * dt * (this.pilotSpeed >= 0 ? 1 : -0.7);

        // VSA Drift / Lateral Slip Mechanics
        if (this.vsaEnabled) {
          this.lateralSlipVel *= Math.max(0, 1.0 - 9.0 * dt);
        } else {
          const latForce = -this.pilotSteer * Math.abs(this.pilotSpeed) * 0.55;
          this.lateralSlipVel += (latForce - this.lateralSlipVel) * Math.min(1.0, 3.8 * dt);
          if (Math.abs(this.lateralSlipVel) > 3.8 && Math.random() < 0.22) {
            if (window.tacticalAudio) window.tacticalAudio.playWaterDrift();
          }
        }
      }

      // Translate coordinates (forward velocity + lateral drift slip)
      const vx = Math.sin(this.pilotHeading) * this.pilotSpeed + Math.cos(this.pilotHeading) * this.lateralSlipVel;
      const vz = Math.cos(this.pilotHeading) * this.pilotSpeed - Math.sin(this.pilotHeading) * this.lateralSlipVel;
      this.pilotBoatPos.x += vx * dt;
      this.pilotBoatPos.z += vz * dt;

      // Bathymetric Depth Calculation & Shallow Water Hazard
      let calcDepth = 14.0 + Math.sin(this.pilotBoatPos.x * 0.015) * 3.0;
      if (this.isKinburnSector || (this.missionConfig && this.missionConfig.isShallow)) {
        calcDepth = 2.1 + Math.sin(this.pilotBoatPos.x * 0.045) * 1.5 + Math.cos(this.pilotBoatPos.z * 0.035) * 1.3;
      }
      this.currentDepth = Math.max(0.4, calcDepth);

      if (this.currentDepth < 0.85 && Math.abs(this.pilotSpeed) > 10.0 && (t - this.shallowWaterTimer > 2.8)) {
        this.shallowWaterTimer = t;
        if (window.tacticalAudio) window.tacticalAudio.playShallowWaterAlarm();
        if (this.onMissionEvent) this.onMissionEvent('shallow_water_warning', { depth: this.currentDepth.toFixed(1) });
      }

      // Realistic hydrodynamic pitch and roll based on smoothed angular velocity & wave interaction
      const waveHeave = Math.sin(t * 2.6) * 0.04 + Math.cos(t * 1.8) * 0.02;
      const targetRoll = this.vsaEnabled
        ? this.pilotAngularVelocity * 0.32
        : (this.pilotAngularVelocity * 0.68 + (this.lateralSlipVel / 8.0) * 0.35 + Math.sin(t * 3.2) * 0.08);
      const targetPitch = (this.pilotSpeed / 36.0) * 0.12 + (this.pilotBoost ? 0.04 : 0.0);

      this.pilotRoll += (targetRoll - this.pilotRoll) * Math.min(1.0, 6.0 * dt);
      this.pilotPitch += (targetPitch - this.pilotPitch) * Math.min(1.0, 6.0 * dt);

      // Capsize safety check in VSA OFF mode
      if (!this.vsaEnabled && Math.abs(this.pilotRoll) > 0.82 && Math.abs(this.pilotSpeed) > 14.0 && (t - this.capsizeWarningTimer > 2.5)) {
        this.capsizeWarningTimer = t;
        if (this.onMissionEvent) this.onMissionEvent('vsa_capsize_risk', { rollDeg: Math.round(this.pilotRoll * (180 / Math.PI)) });
      }

      this.boatModel.position.set(this.pilotBoatPos.x, this.boatBaseY + waveHeave, this.pilotBoatPos.z);
      this.boatModel.rotation.set(this.pilotPitch, this.pilotHeading, this.pilotRoll);

      // Waterjet Spray & Foaming Wake (larger on drift)
      if (Math.abs(this.pilotSpeed) > 1.0 || Math.abs(this.lateralSlipVel) > 1.5) {
        const sternDist = 2.2;
        const wakeX = this.pilotBoatPos.x - Math.sin(this.pilotHeading) * sternDist;
        const wakeZ = this.pilotBoatPos.z - Math.cos(this.pilotHeading) * sternDist;
        const sprayScale = (this.pilotBoost ? 2.8 : 1.5) * (this.vsaEnabled ? 1.0 : 1.4);
        this.emitWakeParticle(wakeX - Math.cos(this.pilotHeading) * 0.4, wakeZ + Math.sin(this.pilotHeading) * 0.4, sprayScale);
        this.emitWakeParticle(wakeX + Math.cos(this.pilotHeading) * 0.4, wakeZ - Math.sin(this.pilotHeading) * 0.4, sprayScale);
        if (Math.random() > 0.4) {
          this.emitWakeParticle(wakeX, wakeZ, sprayScale * 1.2);
        }
      }

      // Sonar Periodic Ping
      if (this.sonarActive) {
        this.sonarPingTimer += dt;
        if (this.sonarPingTimer > 2.2) {
          this.sonarPingTimer = 0;
          if (window.tacticalAudio) window.tacticalAudio.playSonarPing();
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
      // =========================================================================
      // AUTONOMOUS LIVING LOBBY CRUISE (ДРОН ЛЕТИТ / ПЛЫВЁТ САМ В ЛОББИ)
      // =========================================================================
      const cruiseR = 14.0;
      const cruiseSpeed = 0.28;
      const cruiseAngle = t * cruiseSpeed;
      const lobbyX = Math.sin(cruiseAngle) * cruiseR;
      const lobbyZ = Math.cos(cruiseAngle * 0.8) * (cruiseR * 0.85);

      // Instantaneous tangent heading
      const nextX = Math.sin(cruiseAngle + 0.04) * cruiseR;
      const nextZ = Math.cos((cruiseAngle + 0.04) * 0.8) * (cruiseR * 0.85);
      const lobbyHeading = Math.atan2(nextX - lobbyX, nextZ - lobbyZ);

      const lobbyHeave = Math.sin(t * 2.2) * 0.05 + Math.cos(t * 1.4) * 0.02;
      const lobbyPitch = 0.04 + Math.sin(t * 1.8) * 0.02;
      const lobbyRoll = -Math.sin(cruiseAngle) * 0.12;

      this.boatModel.position.set(lobbyX, this.boatBaseY + lobbyHeave - (this.bounceImpulse * 0.05), lobbyZ);
      this.boatModel.rotation.set(lobbyPitch + (this.bounceImpulse * 0.012), lobbyHeading, lobbyRoll);

      // Waterjet spray in lobby
      if (Math.random() > 0.35) {
        const sternDist = 2.2;
        const wakeX = lobbyX - Math.sin(lobbyHeading) * sternDist;
        const wakeZ = lobbyZ - Math.cos(lobbyHeading) * sternDist;
        this.emitWakeParticle(wakeX - Math.cos(lobbyHeading) * 0.35, wakeZ + Math.sin(lobbyHeading) * 0.35, 1.4);
        this.emitWakeParticle(wakeX + Math.cos(lobbyHeading) * 0.35, wakeZ - Math.sin(lobbyHeading) * 0.35, 1.4);
      }

      // Module position sync (modules follow moving boat in lobby)
      for (const [id, mod] of Object.entries(this.moduleObjects)) {
        if (mod.userData && mod.userData.modOffset) {
          const off = mod.userData.modOffset;
          const rotOffX = off.x * Math.cos(lobbyHeading) + off.z * Math.sin(lobbyHeading);
          const rotOffZ = -off.x * Math.sin(lobbyHeading) + off.z * Math.cos(lobbyHeading);
          mod.position.set(
            this.boatModel.position.x + rotOffX,
            this.boatModel.position.y + off.y,
            this.boatModel.position.z + rotOffZ
          );
          mod.rotation.set(lobbyPitch, lobbyHeading, lobbyRoll);
        }

        if (id === 'autosiphon') {
          const dish = mod.getObjectByName('siphon_dish');
          if (dish) dish.rotation.y = Math.sin(t * 1.5) * 0.6;
        }
      }

      // Swarm escorts follow moving boat
      this.swarmDrones.forEach((d) => {
        const offX = d.userData.offsetX;
        const offZ = d.userData.offsetZ;
        const escHeave = Math.sin(t * 1.6 + d.userData.index) * 0.03;
        const rotOffX = offX * Math.cos(lobbyHeading) + offZ * Math.sin(lobbyHeading);
        const rotOffZ = -offX * Math.sin(lobbyHeading) + offZ * Math.cos(lobbyHeading);
        d.position.set(
          this.boatModel.position.x + rotOffX,
          this.boatModel.position.y + escHeave,
          this.boatModel.position.z + rotOffZ
        );
        d.rotation.set(lobbyPitch, lobbyHeading, lobbyRoll);

        if (Math.random() > 0.5) {
          this.emitWakeParticle(d.position.x, d.position.z - 0.8, 0.7);
        }
      });

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
    } catch (e) {
      console.error('Animate error:', e);
    }
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

    // Remove patrol boats
    if (this.missionPatrolBoats) {
      this.missionPatrolBoats.forEach(b => this.scene.remove(b));
      this.missionPatrolBoats = [];
    }
  }

  setupMissionWorld(config) {
    const type = config.type || 'sortie';

    // 1. Spawning Floating Naval Mines
    const mineCount = config.mineCount !== undefined ? config.mineCount : 6;
    for (let i = 0; i < mineCount; i++) {
      const dist = 25 + Math.random() * 55;
      const angle = (i / mineCount) * Math.PI * 1.2 - 0.6 + (Math.random() - 0.5) * 0.3;
      const mx = Math.sin(angle) * dist;
      const mz = Math.cos(angle) * dist;
      this.create3DMine(mx, mz);
    }

    // 2. Spawning Salvage Crates (Black Boxes, GaN Chips, Titanium)
    const crateCount = config.crateCount !== undefined ? config.crateCount : 3;
    this.missionStats.totalCrates = crateCount;
    const lootPool = config.lootPool || ['Микрочип GaN', 'Титановый сплав', 'Чёрный ящик'];
    for (let i = 0; i < crateCount; i++) {
      const dist = 22 + (i + 1) * 20 + (Math.random() - 0.5) * 6;
      const angle = (Math.random() - 0.5) * 0.9;
      const cx = Math.sin(angle) * dist;
      const cz = Math.cos(angle) * dist;
      this.create3DCrate(cx, cz, lootPool[i % lootPool.length]);
    }

    // 3. Spawning Coastal Searchlights
    const searchlightCount = config.searchlightCount !== undefined ? config.searchlightCount : 2;
    for (let i = 0; i < searchlightCount; i++) {
      const sx = (i === 0 ? -35 : 35) + (Math.random() - 0.5) * 8;
      const sz = 45 + i * 30;
      this.create3DSearchlight(sx, sz, 45, 0.6 + i * 0.3);
    }

    // 4. Spawning Objective Strike Waypoint & Enemy Warship (85m ahead, clearly visible)
    const targetDist = config.targetDist || 85;
    const targetAngle = config.targetAngle || 0;
    const wx = Math.sin(targetAngle) * targetDist;
    const wz = Math.cos(targetAngle) * targetDist;
    this.create3DWaypoint(wx, wz, 16, config.targetLabel || '🎯 ЦЕЛЬ: БОЕВОЙ КОРАБЛЬ');

    // Position enemy warship right at the objective point with its laser pillar
    if (this.enemyShip) {
      this.enemyShip.visible = true;
      this.enemyShip.position.set(wx, -0.6, wz);
      this.enemyShip.lookAt(0, -0.6, 0);
      // Scale up for operations — massive warship
      this.enemyShip.scale.setScalar(2.5);
    }

    // 5. Spawn 2 Enemy Patrol Escort Boats flanking the warship
    if (!this.missionPatrolBoats) this.missionPatrolBoats = [];
    [-18, 18].forEach((offsetX, idx) => {
      const pBoat = new THREE.Group();
      const pMat = new THREE.MeshStandardMaterial({ color: 0x222a30, roughness: 0.4, metalness: 0.7 });
      const pGlow = new THREE.MeshBasicMaterial({ color: 0xff3300 });

      const pHull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 6.5), pMat);
      pHull.position.y = 0.4;
      pBoat.add(pHull);

      const pCab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), pMat);
      pCab.position.set(0, 0.9, -0.4);
      pBoat.add(pCab);

      const pBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), pGlow);
      pBeacon.position.set(0, 1.4, -0.4);
      pBoat.add(pBeacon);

      const pLight = new THREE.PointLight(0xff2200, 2.0, 15);
      pLight.position.set(0, 1.5, -0.4);
      pBoat.add(pLight);

      pBoat.position.set(wx + offsetX, 0, wz - 18 + (idx * 6));
      pBoat.lookAt(0, 0, 0);
      this.scene.add(pBoat);
      this.missionPatrolBoats.push(pBoat);
    });
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

      // Distance collision check to player boat (Non-Magnetic Hull reduces magnetic trigger radius)
      const dist = Math.hypot(this.pilotBoatPos.x - m.position.x, this.pilotBoatPos.z - m.position.z);
      const triggerRadius = this.nonMagneticHull ? 0.95 : m.userData.radius;
      if (dist < triggerRadius) {
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

  // =========================================================================
  // ADVANCED TACTICAL CONTROLS (VSA, DPS, SONAR, ROV, PID, AI LOCK)
  // =========================================================================
  toggleVsa() {
    this.vsaEnabled = !this.vsaEnabled;
    if (window.tacticalAudio) window.tacticalAudio.playVsaToggle(this.vsaEnabled);
    return this.vsaEnabled;
  }

  setVsaState(enabled) {
    this.vsaEnabled = !!enabled;
    if (window.tacticalAudio) window.tacticalAudio.playVsaToggle(this.vsaEnabled);
  }

  toggleDps() {
    this.dpsActive = !this.dpsActive;
    if (this.dpsActive) {
      this.dpsAnchorPos.copy(this.pilotBoatPos);
      if (window.tacticalAudio) window.tacticalAudio.playVsaToggle(true);
    }
    return this.dpsActive;
  }

  setDpsState(enabled) {
    this.dpsActive = !!enabled;
    if (this.dpsActive) this.dpsAnchorPos.copy(this.pilotBoatPos);
  }

  setSonarActive(active) {
    this.sonarActive = !!active;
    if (this.sonarActive && window.tacticalAudio) window.tacticalAudio.playSonarPing();
  }

  setNonMagneticHull(enabled) {
    this.nonMagneticHull = !!enabled;
  }

  setFpvPidSettings(settings) {
    if (settings) {
      this.fpvPidSettings = {
        pGain: settings.pGain !== undefined ? settings.pGain : 1.0,
        dGain: settings.dGain !== undefined ? settings.dGain : 1.0,
        expo: settings.expo !== undefined ? settings.expo : 1.0
      };
    }
  }

  setFpvAiModule(active) {
    this.fpvAiModuleActive = !!active;
  }

  // Underwater Micro-ROV & Magnetometer Data Siphon Mode
  startRovMode(config, onEventCallback) {
    this.rovActive = true;
    this.cameraMode = 'rov';
    this.onMissionEvent = onEventCallback || null;
    this.siphonProgress = 0;
    this.siphonLocked = false;
    this.rovPos.set(this.pilotBoatPos.x, -5.5, this.pilotBoatPos.z + 4);
    this.siphonTargetPos.set(this.pilotBoatPos.x + (Math.random() - 0.5) * 8, -6.8, this.pilotBoatPos.z + 18);

    if (window.tacticalAudio) window.tacticalAudio.playSonarPing();
  }

  stopRovMode() {
    this.rovActive = false;
    this.cameraMode = this.pilotMode ? 'chase' : 'orbit';
  }

  setRovInput(steerX, steerZ, boost) {
    if (!this.rovActive) return;
    const speed = boost ? 6.5 : 3.8;
    this.rovPos.x += steerX * speed * 0.016;
    this.rovPos.z += steerZ * speed * 0.016;

    // Magnetometer calculation (nT)
    const distToCable = Math.hypot(this.rovPos.x - this.siphonTargetPos.x, this.rovPos.z - this.siphonTargetPos.z);
    this.magnetometerVal = Math.round(48000 + (3800 / Math.max(0.5, distToCable * 0.8)) + (Math.random() - 0.5) * 60);

    // Check Siphon alignment
    if (distToCable < 2.5) {
      this.siphonProgress = Math.min(100, this.siphonProgress + 0.8);
      if (this.siphonProgress >= 100 && !this.siphonLocked) {
        this.siphonLocked = true;
        if (window.tacticalAudio) window.tacticalAudio.playSiphonLock();
        if (this.onMissionEvent) this.onMissionEvent('siphon_complete', { loot: 'Ключ шифрования ВМФ', mb: 8500 });
      }
    }
  }

  getPilotTelemetry() {
    if (this.fpvFlightActive) {
      const distToWarship = this.enemyShip ? Math.round(this.fpvPos.distanceTo(this.enemyShip.position)) : 0;
      const speedKmh = Math.round(this.fpvVel.length() * 3.6);
      const altM = Math.max(0, this.fpvPos.y).toFixed(1);
      const pitchDeg = Math.round((-this.fpvPitch * (180 / Math.PI)));
      const rollDeg = Math.round((this.fpvRoll * (180 / Math.PI)));
      const headingDeg = Math.round(((this.fpvYaw * (180 / Math.PI)) % 360 + 360) % 360);

      // Lock on nearest subsystem
      let lockTargetInfo = null;
      if (this.fpvLockTarget) {
        lockTargetInfo = {
          name: this.fpvLockTarget.name,
          subName: this.fpvLockTarget.subName,
          dist: this.fpvLockTarget.dist,
          bonus: this.fpvLockTarget.damageBonus
        };
      }

      // Compute bearing arrow: angle from drone heading to enemy ship
      let bearingArrow = '';
      if (this.enemyShip) {
        const toShipX = this.enemyShip.position.x - this.fpvPos.x;
        const toShipZ = this.enemyShip.position.z - this.fpvPos.z;
        const targetBearing = Math.atan2(toShipX, toShipZ);
        let relAngle = ((targetBearing - this.fpvYaw) * (180 / Math.PI) + 360) % 360;
        if (relAngle > 180) relAngle -= 360;
        if (Math.abs(relAngle) < 15) bearingArrow = '⬆️ ПРЯМО';
        else if (relAngle > 0 && relAngle < 60) bearingArrow = '↗️ ПРАВЕЕ';
        else if (relAngle >= 60) bearingArrow = '➡️ РЕЗКО ВПРАВО';
        else if (relAngle < 0 && relAngle > -60) bearingArrow = '↖️ ЛЕВЕЕ';
        else bearingArrow = '⬅️ РЕЗКО ВЛЕВО';
      }

      return {
        isFpv: true,
        speedKmh: speedKmh,
        altM: altM,
        pitchDeg: pitchDeg,
        rollDeg: rollDeg,
        headingDeg: headingDeg,
        batteryVolts: this.fpvBattery.toFixed(1),
        batteryPct: Math.round(Math.max(0, Math.min(100, (this.fpvBattery - 20.0) / (25.2 - 20.0) * 100))),
        fpvHP: Math.round(this.fpvHP),
        distToTarget: distToWarship,
        lockTarget: lockTargetInfo,
        ciwsActive: distToWarship < 120,
        boostActive: this.fpvBoost,
        glitchAmount: this.fpvGlitchAmount,
        bearingArrow: bearingArrow,
        aiModuleActive: this.fpvAiModuleActive,
        pidSettings: this.fpvPidSettings
      };
    }

    // Default: USV Boat Piloting Telemetry
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

    // Compute bearing arrow for boat toward target
    let boatBearing = '';
    const targetBearingAngle = Math.atan2(targetX - this.pilotBoatPos.x, targetZ - this.pilotBoatPos.z);
    let boatRelAngle = ((targetBearingAngle - this.pilotHeading) * (180 / Math.PI) + 360) % 360;
    if (boatRelAngle > 180) boatRelAngle -= 360;
    if (Math.abs(boatRelAngle) < 15) boatBearing = '⬆️ ПРЯМО';
    else if (boatRelAngle > 0 && boatRelAngle < 60) boatBearing = '↗️ ПРАВЕЕ';
    else if (boatRelAngle >= 60) boatBearing = '➡️ РЕЗКО ВПРАВО';
    else if (boatRelAngle < 0 && boatRelAngle > -60) boatBearing = '↖️ ЛЕВЕЕ';
    else boatBearing = '⬅️ РЕЗКО ВЛЕВО';

    return {
      isFpv: false,
      speedKnots: speedKnots,
      headingDeg: headingDeg,
      x: Math.round(this.pilotBoatPos.x),
      z: Math.round(this.pilotBoatPos.z),
      hullHP: Math.round(this.pilotHullHP),
      maxHP: this.pilotHullMaxHP,
      distToTarget: Math.round(distToTarget),
      cratesCollected: this.missionStats.cratesCollected,
      totalCrates: this.missionStats.totalCrates,
      boostActive: this.pilotBoost,
      bearingArrow: boatBearing,
      vsaEnabled: this.vsaEnabled,
      dpsActive: this.dpsActive,
      sonarActive: this.sonarActive,
      depthM: this.currentDepth.toFixed(1),
      isShallow: this.currentDepth < 1.0,
      lateralSlipVel: Math.round(this.lateralSlipVel * 10) / 10,
      magnetometerNt: this.magnetometerVal,
      siphonProgress: Math.round(this.siphonProgress),
      siphonLocked: this.siphonLocked,
      rovActive: this.rovActive
    };
  }
}

window.Barracuda3DEngine = Barracuda3DEngine;

