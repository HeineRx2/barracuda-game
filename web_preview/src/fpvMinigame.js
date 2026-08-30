export class FPVMinigame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.active = false;

    // Phases: 'launch' -> 'obstacle' -> 'strike' -> 'explosion' -> 'rating'
    this.phase = 'launch';
    this.phaseTimer = 0;
    this.totalTime = 0;

    // Launch phase
    this.launchProgress = 0;
    this.launchQTE = { active: false, marker: 0, speed: 1.8, hit: false, zone: 0.15 };

    // Obstacle phase
    this.drone = { x: 100, y: 250, vy: 0, size: 16, alive: true };
    this.gravity = 650;
    this.flapPower = -290;
    this.lives = 1;
    this.maxLives = 1;
    this.invincibleTimer = 0;

    this.obstacles = [];
    this.obstacleSpeed = 200;
    this.baseGap = 150;
    this.obstacleGap = 150;
    this.obstacleWidth = 50;
    this.spawnTimer = 0;
    this.spawnInterval = 1.7;
    this.passed = 0;
    this.requiredPass = 5;

    // Radar beams (horizontal toggling barriers)
    this.radarBeams = [];
    this.radarBeamTimer = 0;

    // Interceptor missiles
    this.interceptors = [];

    // Data pickups
    this.dataPickups = [];
    this.collectedData = 0;

    // Drone trail particles
    this.trailParticles = [];

    // Strike phase
    this.target = { x: 0, y: 0, w: 80, h: 45, hit: false, vx: 0, vy: 0 };
    this.crosshair = { x: 400, y: 250 };
    this.lockTimer = 0;
    this.requiredLockTime = 2.0;
    this.lockRadius = 55;
    this.countermeasureTimer = 0;
    this.staticNoise = 0;

    // Pre-generated noise canvas for static effect (avoids getImageData)
    this._noiseCanvas = null;
    this._noiseCtx = null;

    // Explosion phase
    this.explosionParticles = [];
    this.shockwaveRadius = 0;
    this.shockwaveAlpha = 1;

    // Rating
    this.rating = 'C';
    this.ratingTimer = 0;
    this.score = { time: 0, accuracy: 0, bonus: 0, noDamage: true, perfectLaunch: false };

    // Background stars/clouds
    this.bgStars = [];
    this.bgClouds = [];

    // Boss mode
    this.isBoss = false;
    this.bossData = null;

    // Difficulty multiplier (increases with prestige)
    this.difficultyMod = 1.0;
  }

  setDifficulty(prestigeLevel, armorLevel, ghostProtocol) {
    this.difficultyMod = 1.0 + prestigeLevel * 0.15;
    if (ghostProtocol) this.difficultyMod *= 0.6; // -40% obstacle density
    this.maxLives = 1 + Math.min(2, Math.floor(armorLevel / 2));
    this.lives = this.maxLives;
    this.requiredPass = Math.min(8, 5 + Math.floor(prestigeLevel / 2));
    if (ghostProtocol) this.requiredPass = Math.max(3, this.requiredPass - 2);
  }

  start(canvas) {
    this.canvas = canvas;
    this.active = true;
    this.phase = 'launch';
    this.phaseTimer = 0;
    this.totalTime = 0;

    // Match canvas pixel buffer to CSS display size for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for performance
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);

    // Use CSS pixel dimensions for all drawing calculations
    this._drawW = rect.width;
    this._drawH = rect.height;

    const W = this._drawW;
    const H = this._drawH;

    // Reset launch
    this.launchProgress = 0;
    this.launchQTE = { active: true, marker: 0, speed: 1.8 * this.difficultyMod, hit: false, zone: 0.15 };

    // Reset drone
    this.drone = { x: 100, y: H / 2, vy: 0, size: 16, alive: true };
    this.lives = this.maxLives;
    this.invincibleTimer = 0;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.passed = 0;
    this.trailParticles = [];
    this.radarBeams = [];
    this.radarBeamTimer = 0;
    this.interceptors = [];
    this.dataPickups = [];
    this.collectedData = 0;

    // Reset strike
    this.target = { x: W - 160, y: H / 2, w: 80, h: 45, hit: false, vx: 0, vy: 0 };
    this.crosshair = { x: W / 2, y: H / 2 };
    this.lockTimer = 0;
    this.countermeasureTimer = 0;
    this.staticNoise = 0;

    // Generate noise canvas once for static effect
    this._generateNoiseCanvas(Math.round(rect.width * dpr), Math.round(rect.height * dpr));

    // Reset explosion
    this.explosionParticles = [];
    this.shockwaveRadius = 0;
    this.shockwaveAlpha = 1;

    // Reset rating
    this.ratingTimer = 0;
    this.score = { time: 0, accuracy: 0, bonus: 0, noDamage: true, perfectLaunch: false };

    // Obstacle gap scales with difficulty
    this.obstacleGap = Math.max(100, this.baseGap - this.difficultyMod * 8);
    this.obstacleSpeed = 200 + this.difficultyMod * 30;

    // Generate background stars
    this.bgStars = [];
    for (let i = 0; i < 60; i++) {
      this.bgStars.push({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 2, speed: 50 + Math.random() * 100 });
    }
    this.bgClouds = [];
    for (let i = 0; i < 5; i++) {
      this.bgClouds.push({ x: W + Math.random() * W, y: 30 + Math.random() * (H - 60), w: 80 + Math.random() * 120, h: 20 + Math.random() * 30, speed: 30 + Math.random() * 40 });
    }

    // Input handlers
    this.onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.handleAction();
      }
    };

    this.onAction = (e) => {
      if (e) e.preventDefault();
      this.handleAction();
    };

    this.onPointerMove = (e) => {
      if (this.phase === 'strike') {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.crosshair.x = (clientX - rect.left);
        this.crosshair.y = (clientY - rect.top);
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('click', this.onAction);
    this.canvas.addEventListener('touchstart', this.onAction, { passive: false });
    this.canvas.addEventListener('mousemove', this.onPointerMove);
    this.canvas.addEventListener('touchmove', this.onPointerMove, { passive: true });
  }

  handleAction() {
    if (this.phase === 'launch' && this.launchQTE.active && !this.launchQTE.hit) {
      const dist = Math.abs(this.launchQTE.marker - 0.5);
      if (dist < this.launchQTE.zone) {
        this.launchQTE.hit = true;
        this.score.perfectLaunch = (dist < this.launchQTE.zone * 0.4);
        if (this.score.perfectLaunch) {
          window.tacticalAudio.playPerfectLaunch();
        } else {
          window.tacticalAudio.playPing();
        }
      }
    } else if (this.phase === 'obstacle' && this.drone.alive) {
      this.drone.vy = this.flapPower;
      window.tacticalAudio.playPing();
    } else if (this.phase === 'strike') {
      // Strike is lock-based now, no single-click
    }
  }

  stop() {
    this.active = false;
    if (this.onKeyDown) window.removeEventListener('keydown', this.onKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.onAction);
      this.canvas.removeEventListener('touchstart', this.onAction);
      this.canvas.removeEventListener('mousemove', this.onPointerMove);
      this.canvas.removeEventListener('touchmove', this.onPointerMove);
    }
  }

  update(dt) {
    if (!this.active) return null;
    this.totalTime += dt;

    // Update background
    const W = this._drawW || this.canvas.width;
    const H = this._drawH || this.canvas.height;
    this.bgStars.forEach(s => { s.x -= s.speed * dt; if (s.x < 0) { s.x = W; s.y = Math.random() * H; } });
    this.bgClouds.forEach(c => { c.x -= c.speed * dt; if (c.x + c.w < 0) { c.x = W + 50; c.y = 30 + Math.random() * (H - 60); } });

    // ======================== LAUNCH PHASE ========================
    if (this.phase === 'launch') {
      this.phaseTimer += dt;

      if (this.launchQTE.active && !this.launchQTE.hit) {
        this.launchQTE.marker += this.launchQTE.speed * dt;
        if (this.launchQTE.marker > 1.0) this.launchQTE.marker -= 1.0;
      }

      this.launchProgress = Math.min(1.0, this.phaseTimer / 2.5);

      if (this.phaseTimer > 2.5 || (this.launchQTE.hit && this.phaseTimer > 1.0)) {
        this.phase = 'obstacle';
        this.phaseTimer = 0;
        // Give drone an initial upward velocity so it doesn't immediately drop
        this.drone.vy = this.flapPower * 0.5;
        // Grace period: invincible for first 1.2 seconds
        this.invincibleTimer = 1.2;
        window.tacticalAudio.playFPVLaunch();
        if (this.score.perfectLaunch) {
          this.obstacleSpeed *= 0.85; // Slightly slower obstacles as bonus
        }
        // Delay first obstacle spawn
        this.spawnTimer = -0.8;
      }
      return null;
    }

    // ======================== OBSTACLE PHASE ========================
    if (this.phase === 'obstacle') {
      this.phaseTimer += dt;
      if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

      // Clamp dt for consistent physics (prevent huge jumps)
      const pdt = Math.min(dt, 0.033);

      // Gravity and movement
      this.drone.vy += this.gravity * pdt;
      this.drone.y += this.drone.vy * pdt;

      // Ceiling clamp
      if (this.drone.y < this.drone.size) { this.drone.y = this.drone.size; this.drone.vy = 0; }
      // Floor: bounce gently instead of instant death (gives player a chance)
      if (this.drone.y > H - this.drone.size) {
        this.drone.y = H - this.drone.size;
        this.drone.vy = -Math.abs(this.drone.vy) * 0.3; // Bounce up
        if (this.invincibleTimer <= 0) {
          const result = this.takeDamage();
          if (result) return result;
        }
      }

      // Trail particles
      if (this.drone.alive && Math.random() > 0.3) {
        this.trailParticles.push({
          x: this.drone.x - this.drone.size,
          y: this.drone.y + (Math.random() - 0.5) * 4,
          vx: -40 - Math.random() * 60,
          vy: (Math.random() - 0.5) * 20,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.4 + Math.random() * 0.3,
          color: Math.random() > 0.6 ? '#ffcc00' : '#ff6600'
        });
      }

      // Update trail
      for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        const p = this.trailParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.trailParticles.splice(i, 1);
      }

      // Spawn obstacles
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const gapY = 70 + Math.random() * (H - 140);
        this.obstacles.push({ x: W, gapY: gapY, passed: false, type: 'wall' });

        // Spawn data pickups with obstacles (40% chance)
        if (Math.random() < 0.4) {
          this.dataPickups.push({
            x: W + this.obstacleWidth / 2,
            y: gapY + (Math.random() - 0.5) * (this.obstacleGap * 0.4),
            collected: false,
            pulse: 0
          });
        }

        // After 3 obstacles, add radar beams (25% chance)
        if (this.passed >= 2 && Math.random() < 0.25 * this.difficultyMod) {
          const beamY = 60 + Math.random() * (H - 120);
          this.radarBeams.push({
            x: W + 100,
            y: beamY,
            active: true,
            toggleTimer: 0,
            toggleInterval: 0.8 + Math.random() * 0.6,
            width: 200
          });
        }

        // After 2 obstacles, spawn interceptors (20% chance)
        if (this.passed >= 1 && Math.random() < 0.2 * this.difficultyMod) {
          this.interceptors.push({
            x: W + 50,
            y: Math.random() * H,
            vy: (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 100),
            size: 8
          });
        }

        // Progressive difficulty
        this.obstacleGap = Math.max(90, this.baseGap - this.passed * 5 - this.difficultyMod * 6);
        this.obstacleSpeed = Math.min(400, 200 + this.passed * 15 + this.difficultyMod * 25);
        this.spawnInterval = Math.max(0.9, 1.7 - this.passed * 0.08);
      }

      // Move obstacles
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= this.obstacleSpeed * dt;

        if (!obs.passed && obs.x + this.obstacleWidth < this.drone.x) {
          obs.passed = true;
          this.passed++;
          window.tacticalAudio.playPVOFlyby();
          if (this.passed >= this.requiredPass) {
            this.phase = 'strike';
            this.phaseTimer = 0;
            window.tacticalAudio.playPhaseTransition();
            return null;
          }
        }

        // Collision check
        if (this.invincibleTimer <= 0 &&
            this.drone.x + this.drone.size > obs.x && this.drone.x - this.drone.size < obs.x + this.obstacleWidth) {
          if (this.drone.y - this.drone.size < obs.gapY - this.obstacleGap / 2 ||
              this.drone.y + this.drone.size > obs.gapY + this.obstacleGap / 2) {
            const result = this.takeDamage();
            if (result) return result;
          }
        }

        if (obs.x < -this.obstacleWidth) this.obstacles.splice(i, 1);
      }

      // Move data pickups
      for (let i = this.dataPickups.length - 1; i >= 0; i--) {
        const dp = this.dataPickups[i];
        dp.x -= this.obstacleSpeed * dt;
        dp.pulse += dt * 4;

        if (!dp.collected) {
          const distToDrone = Math.hypot(dp.x - this.drone.x, dp.y - this.drone.y);
          if (distToDrone < 25) {
            dp.collected = true;
            this.collectedData++;
            window.tacticalAudio.playDataPickup();
          }
        }

        if (dp.x < -20) this.dataPickups.splice(i, 1);
      }

      // Move radar beams
      for (let i = this.radarBeams.length - 1; i >= 0; i--) {
        const rb = this.radarBeams[i];
        rb.x -= this.obstacleSpeed * 0.7 * dt;
        rb.toggleTimer += dt;
        if (rb.toggleTimer >= rb.toggleInterval) {
          rb.toggleTimer = 0;
          rb.active = !rb.active;
        }

        // Collision with active beam
        if (rb.active && this.invincibleTimer <= 0 &&
            this.drone.x > rb.x && this.drone.x < rb.x + rb.width &&
            Math.abs(this.drone.y - rb.y) < 12) {
          const result = this.takeDamage();
          if (result) return result;
        }

        if (rb.x + rb.width < -20) this.radarBeams.splice(i, 1);
      }

      // Move interceptors
      for (let i = this.interceptors.length - 1; i >= 0; i--) {
        const ic = this.interceptors[i];
        ic.x -= this.obstacleSpeed * 0.5 * dt;
        ic.y += ic.vy * dt;
        if (ic.y < 20 || ic.y > H - 20) ic.vy *= -1;

        if (this.invincibleTimer <= 0) {
          const dist = Math.hypot(ic.x - this.drone.x, ic.y - this.drone.y);
          if (dist < this.drone.size + ic.size) {
            const result = this.takeDamage();
            if (result) return result;
            this.interceptors.splice(i, 1);
            continue;
          }
        }

        if (ic.x < -20) this.interceptors.splice(i, 1);
      }

      // Timeout fail
      if (this.phaseTimer > 25) return 'fail';
      return null;
    }

    // ======================== STRIKE PHASE ========================
    if (this.phase === 'strike') {
      this.phaseTimer += dt;

      // Target evasive movement (AI-driven dodging)
      const evadeIntensity = 60 * this.difficultyMod;
      this.target.vx = Math.sin(this.phaseTimer * 2.5) * evadeIntensity + Math.cos(this.phaseTimer * 4.1) * evadeIntensity * 0.5;
      this.target.vy = Math.cos(this.phaseTimer * 1.8) * evadeIntensity * 0.8 + Math.sin(this.phaseTimer * 3.7) * evadeIntensity * 0.3;

      this.target.x += this.target.vx * dt;
      this.target.y += this.target.vy * dt;
      this.target.x = Math.max(W * 0.3, Math.min(W - 120, this.target.x));
      this.target.y = Math.max(60, Math.min(H - 80, this.target.y));

      // Countermeasures (visual interference)
      this.countermeasureTimer += dt;
      if (this.countermeasureTimer > 3.0 + Math.random() * 4.0) {
        this.countermeasureTimer = 0;
        this.staticNoise = 1.0;
        window.tacticalAudio.playCountermeasure();
      }
      if (this.staticNoise > 0) this.staticNoise -= dt * 2.5;

      // Check lock-on
      const dx = this.crosshair.x - (this.target.x + this.target.w / 2);
      const dy = this.crosshair.y - (this.target.y + this.target.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isLocked = dist < this.lockRadius && this.staticNoise <= 0.3;

      if (isLocked) {
        this.lockTimer += dt;
        if (this.lockTimer % 0.15 < dt) {
          window.tacticalAudio.playLockOnTone(true);
        }
      } else {
        this.lockTimer = Math.max(0, this.lockTimer - dt * 0.5);
        if (this.lockTimer > 0.1 && this.phaseTimer % 0.3 < dt) {
          window.tacticalAudio.playLockOnTone(false);
        }
      }

      // Lock complete → strike!
      if (this.lockTimer >= this.requiredLockTime) {
        this.target.hit = true;
        this.score.accuracy = Math.min(100, (this.lockTimer / this.requiredLockTime) * 80 + (1 - dist / this.lockRadius) * 20);
        this.phase = 'explosion';
        this.phaseTimer = 0;
        window.tacticalAudio.playShockwave();

        // Generate explosion particles
        const cx = this.target.x + this.target.w / 2;
        const cy = this.target.y + this.target.h / 2;
        for (let i = 0; i < 60; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 80 + Math.random() * 300;
          this.explosionParticles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6 + Math.random() * 0.8,
            maxLife: 0.6 + Math.random() * 0.8,
            size: 2 + Math.random() * 6,
            color: ['#ff4400', '#ffcc00', '#ff8800', '#ffffff', '#ff2200'][Math.floor(Math.random() * 5)]
          });
        }
        this.shockwaveRadius = 0;
        this.shockwaveAlpha = 1;

        return null;
      }

      // Timeout
      if (this.phaseTimer > 12) return 'fail';
      return null;
    }

    // ======================== EXPLOSION PHASE ========================
    if (this.phase === 'explosion') {
      this.phaseTimer += dt;

      // Shockwave expansion
      this.shockwaveRadius += 600 * dt;
      this.shockwaveAlpha = Math.max(0, 1.0 - this.phaseTimer / 1.2);

      // Update explosion particles
      for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
        const p = this.explosionParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt; // gravity
        p.vx *= 0.98;
        p.life -= dt;
        if (p.life <= 0) this.explosionParticles.splice(i, 1);
      }

      if (this.phaseTimer > 2.0) {
        this.phase = 'rating';
        this.phaseTimer = 0;
        this.calculateRating();
        window.tacticalAudio.playRatingReveal(this.rating);
      }
      return null;
    }

    // ======================== RATING PHASE ========================
    if (this.phase === 'rating') {
      this.ratingTimer += dt;
      if (this.ratingTimer > 3.0) {
        return 'success';
      }
      return null;
    }

    return null;
  }

  takeDamage() {
    this.lives--;
    this.score.noDamage = false;
    if (this.lives <= 0) {
      this.drone.alive = false;
      return 'fail';
    }
    // Shield absorb
    this.invincibleTimer = 1.5;
    window.tacticalAudio.playShieldHit();
    return null;
  }

  calculateRating() {
    let points = 0;
    // Time bonus (faster = better)
    this.score.time = this.totalTime;
    if (this.totalTime < 10) points += 40;
    else if (this.totalTime < 15) points += 30;
    else if (this.totalTime < 20) points += 20;
    else points += 10;

    // Accuracy
    points += Math.floor(this.score.accuracy * 0.3);

    // Data pickups
    this.score.bonus = this.collectedData;
    points += this.collectedData * 5;

    // Perfect launch bonus
    if (this.score.perfectLaunch) points += 10;

    // No damage bonus
    if (this.score.noDamage) points += 15;

    if (points >= 80) this.rating = 'S';
    else if (points >= 55) this.rating = 'A';
    else if (points >= 35) this.rating = 'B';
    else this.rating = 'C';
  }

  _generateNoiseCanvas(w, h) {
    this._noiseCanvas = document.createElement('canvas');
    this._noiseCanvas.width = w;
    this._noiseCanvas.height = h;
    this._noiseCtx = this._noiseCanvas.getContext('2d');
    const imageData = this._noiseCtx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
    }
    this._noiseCtx.putImageData(imageData, 0, 0);
  }

  // =========================================================================
  // DRAW — Cinematic Multi-Phase Rendering
  // =========================================================================
  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const W = this._drawW || this.canvas.width;
    const H = this._drawH || this.canvas.height;

    // Background
    ctx.fillStyle = '#060e0a';
    ctx.fillRect(0, 0, W, H);

    // Stars parallax
    ctx.fillStyle = 'rgba(180, 220, 200, 0.6)';
    this.bgStars.forEach(s => {
      ctx.globalAlpha = 0.3 + Math.sin(this.totalTime * 2 + s.x) * 0.2;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;

    // Clouds
    this.bgClouds.forEach(c => {
      ctx.fillStyle = 'rgba(30, 60, 45, 0.25)';
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Military grid (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Scanlines
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, y, W, 1);
    }

    // ======================== DRAW LAUNCH ========================
    if (this.phase === 'launch') {
      // Drone on catapult
      const droneY = H / 2;
      const launchX = 60 + this.launchProgress * 200;

      // Catapult rail
      ctx.strokeStyle = '#334433';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, droneY + 15);
      ctx.lineTo(280, droneY + 15);
      ctx.stroke();

      // Drone body
      ctx.save();
      ctx.translate(launchX, droneY);
      ctx.fillStyle = '#00ff66';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // QTE bar
      const barX = W / 2 - 200;
      const barY = H - 100;
      const barW = 400;
      const barH = 30;

      ctx.fillStyle = '#0a1a10';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = '#1a3a20';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      // Perfect zone (center)
      const zoneW = barW * this.launchQTE.zone;
      ctx.fillStyle = this.launchQTE.hit ? 'rgba(0, 255, 102, 0.4)' : 'rgba(255, 204, 0, 0.3)';
      ctx.fillRect(barX + barW / 2 - zoneW, barY, zoneW * 2, barH);

      // Moving marker
      if (!this.launchQTE.hit) {
        const markerX = barX + this.launchQTE.marker * barW;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(markerX - 3, barY - 5, 6, barH + 10);
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(markerX - 3, barY - 5, 6, barH + 10);
        ctx.shadowBlur = 0;
      }

      // Instructions
      ctx.fillStyle = this.launchQTE.hit ? '#00ff66' : '#ffcc00';
      ctx.font = 'bold 18px "Rajdhani", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.launchQTE.hit ? (this.score.perfectLaunch ? '✨ ИДЕАЛЬНЫЙ ЗАПУСК! БОНУС СКОРОСТИ!' : '✓ ЗАПУСК ПОДТВЕРЖДЁН') : '>>> НАЖМИ [ПРОБЕЛ] В ЗЕЛЁНОЙ ЗОНЕ ДЛЯ ЗАПУСКА <<<', W / 2, barY - 20);

      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.fillText('ФАЗА 1/4: КАТАПУЛЬТА FPV-ДРОНА', W / 2, 30);
      ctx.textAlign = 'left';
      return;
    }

    // ======================== DRAW OBSTACLE ========================
    if (this.phase === 'obstacle') {
      // Trail particles
      this.trailParticles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, 2 + (1 - p.life / p.maxLife) * 3), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Radar beams
      this.radarBeams.forEach(rb => {
        if (rb.active) {
          const pulseAlpha = 0.3 + Math.sin(this.totalTime * 8) * 0.15;
          ctx.fillStyle = `rgba(255, 40, 40, ${pulseAlpha})`;
          ctx.fillRect(rb.x, rb.y - 6, rb.width, 12);
          ctx.strokeStyle = '#ff2a2a';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(rb.x, rb.y - 6, rb.width, 12);
          ctx.setLineDash([]);

          ctx.fillStyle = '#ff4444';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('РАДАР', rb.x + 5, rb.y - 10);
        } else {
          ctx.fillStyle = 'rgba(100, 40, 40, 0.15)';
          ctx.fillRect(rb.x, rb.y - 3, rb.width, 6);
        }
      });

      // Obstacles (PVO walls)
      for (const obs of this.obstacles) {
        // Top wall
        const topH = obs.gapY - this.obstacleGap / 2;
        const grad = ctx.createLinearGradient(obs.x, 0, obs.x + this.obstacleWidth, 0);
        grad.addColorStop(0, '#0a1f18');
        grad.addColorStop(0.5, '#132820');
        grad.addColorStop(1, '#0a1f18');
        ctx.fillStyle = grad;
        ctx.fillRect(obs.x, 0, this.obstacleWidth, topH);

        // Bottom wall
        const botY = obs.gapY + this.obstacleGap / 2;
        ctx.fillRect(obs.x, botY, this.obstacleWidth, H - botY);

        // Red border glow
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, 0, this.obstacleWidth, topH);
        ctx.strokeRect(obs.x, botY, this.obstacleWidth, H - botY);

        // Hazard stripes
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(obs.x, topH - 4, this.obstacleWidth, 4);
        ctx.fillRect(obs.x, botY, this.obstacleWidth, 4);

        // Label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('ПВО', obs.x + 8, topH - 10);
      }

      // Data pickups
      this.dataPickups.forEach(dp => {
        if (!dp.collected) {
          const pulseScale = 1 + Math.sin(dp.pulse) * 0.2;
          ctx.save();
          ctx.translate(dp.x, dp.y);
          ctx.scale(pulseScale, pulseScale);

          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#001a22';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MB', 0, 3);
          ctx.textAlign = 'left';
          ctx.restore();
        }
      });

      // Interceptors
      this.interceptors.forEach(ic => {
        ctx.save();
        ctx.translate(ic.x, ic.y);
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(-ic.size, 0);
        ctx.lineTo(ic.size, -ic.size * 0.5);
        ctx.lineTo(ic.size, ic.size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // FPV Drone
      if (this.drone.alive) {
        ctx.save();
        ctx.translate(this.drone.x, this.drone.y);
        const tilt = Math.min(0.4, this.drone.vy * 0.001);
        ctx.rotate(tilt);

        // Invincibility flash
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = '#00ff66';
        ctx.beginPath();
        ctx.moveTo(this.drone.size, 0);
        ctx.lineTo(-this.drone.size * 0.6, -this.drone.size * 0.7);
        ctx.lineTo(-this.drone.size * 0.3, 0);
        ctx.lineTo(-this.drone.size * 0.6, this.drone.size * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Engine flame
        const flameLen = 8 + Math.random() * 10;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(-this.drone.size * 0.3, -3);
        ctx.lineTo(-this.drone.size * 0.3 - flameLen, 0);
        ctx.lineTo(-this.drone.size * 0.3, 3);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // HUD overlay
      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ФАЗА 2/4: ПРОРЫВ ПВО — ${this.passed} / ${this.requiredPass} ЗОН`, W / 2, 30);
      ctx.textAlign = 'left';

      // Lives display
      ctx.fillStyle = '#00ff66';
      ctx.font = '14px monospace';
      for (let i = 0; i < this.maxLives; i++) {
        ctx.fillText(i < this.lives ? '♥' : '♡', 15 + i * 22, 30);
      }

      // Data collected
      if (this.collectedData > 0) {
        ctx.fillStyle = '#00e5ff';
        ctx.fillText(`📡 +${this.collectedData * 15} МБ`, W - 130, 30);
      }
      return;
    }

    // ======================== DRAW STRIKE ========================
    if (this.phase === 'strike') {
      // Static noise overlay — optimized (pre-generated noise canvas)
      if (this.staticNoise > 0 && this._noiseCanvas) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.6, this.staticNoise * 0.5);
        ctx.globalCompositeOperation = 'overlay';
        // Shift noise position each frame for variety
        const ox = (Math.random() * 100 - 50) | 0;
        const oy = (Math.random() * 100 - 50) | 0;
        ctx.drawImage(this._noiseCanvas, ox, oy);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Target ship
      if (!this.target.hit) {
        ctx.save();
        ctx.translate(this.target.x, this.target.y);

        // Ship hull
        ctx.fillStyle = '#3a4a55';
        ctx.beginPath();
        ctx.moveTo(this.target.w, this.target.h / 2);
        ctx.lineTo(this.target.w * 0.75, 0);
        ctx.lineTo(0, 2);
        ctx.lineTo(-12, this.target.h / 2);
        ctx.lineTo(0, this.target.h - 2);
        ctx.lineTo(this.target.w * 0.75, this.target.h);
        ctx.closePath();
        ctx.fill();

        // Superstructure
        ctx.fillStyle = '#2a3a44';
        ctx.fillRect(this.target.w * 0.2, -8, this.target.w * 0.35, 12);

        // Target reticle
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(this.target.w / 2, this.target.h / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.target.w / 2, this.target.h / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // Crosshair
      const lockProgress = Math.min(1, this.lockTimer / this.requiredLockTime);
      const cx = this.crosshair.x;
      const cy = this.crosshair.y;

      ctx.save();
      ctx.translate(cx, cy);

      // Lock arc
      if (lockProgress > 0) {
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + lockProgress * Math.PI * 2);
        ctx.stroke();
      }

      // Crosshair outer
      ctx.strokeStyle = lockProgress > 0.8 ? '#ff2a2a' : '#00ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(-40, 0); ctx.lineTo(-14, 0);
      ctx.moveTo(14, 0); ctx.lineTo(40, 0);
      ctx.moveTo(0, -40); ctx.lineTo(0, -14);
      ctx.moveTo(0, 14); ctx.lineTo(0, 40);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = lockProgress > 0.8 ? '#ff2a2a' : '#00ff66';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Phase label
      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ФАЗА 3/4: ТЕРМАЛЬНЫЙ ЗАХВАТ ЦЕЛИ', W / 2, 30);

      // Lock status
      ctx.fillStyle = lockProgress > 0.8 ? '#ff2a2a' : '#00ff66';
      ctx.font = 'bold 16px "Rajdhani", monospace';
      const lockPct = Math.floor(lockProgress * 100);
      ctx.fillText(lockProgress > 0.8 ? `>>> ЗАХВАТ: ${lockPct}% — УДЕРЖИВАЙ ПРИЦЕЛ! <<<` : `НАВЕДИ ПРИЦЕЛ НА ЦЕЛЬ (${lockPct}%)`, W / 2, H - 30);
      ctx.textAlign = 'left';

      // RWR warning flashes
      if (this.staticNoise > 0.3) {
        ctx.fillStyle = `rgba(255, 40, 40, ${this.staticNoise * 0.3})`;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ КОНТРМЕРЫ ПРОТИВНИКА ⚠', W / 2, H / 2 - 40);
        ctx.textAlign = 'left';
      }
      return;
    }

    // ======================== DRAW EXPLOSION ========================
    if (this.phase === 'explosion') {
      // White flash
      const flashAlpha = Math.max(0, 1.0 - this.phaseTimer / 0.4);
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Shockwave ring
      if (this.shockwaveAlpha > 0) {
        const cx = this.target.x + this.target.w / 2;
        const cy = this.target.y + this.target.h / 2;
        ctx.strokeStyle = `rgba(255, 200, 100, ${this.shockwaveAlpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, this.shockwaveRadius), 0, Math.PI * 2);
        ctx.stroke();

        // Inner shockwave
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.shockwaveAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, this.shockwaveRadius * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Explosion particles
      this.explosionParticles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * (p.life / p.maxLife)), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Title
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 32px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      ctx.fillText('💥 КИНЕТИЧЕСКИЙ УДАР ПОДТВЕРЖДЁН!', W / 2, H / 2);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.fillText('ФАЗА 4/4: УДАР И УНИЧТОЖЕНИЕ', W / 2, 30);
      ctx.textAlign = 'left';
      return;
    }

    // ======================== DRAW RATING ========================
    if (this.phase === 'rating') {
      // Dark cinematic background
      ctx.fillStyle = 'rgba(5, 10, 8, 0.95)';
      ctx.fillRect(0, 0, W, H);

      // Rating letter with glow
      const colors = { S: '#ffcc00', A: '#00ff66', B: '#00bfff', C: '#888888' };
      const ratingColor = colors[this.rating] || '#888888';

      ctx.textAlign = 'center';
      ctx.fillStyle = ratingColor;
      ctx.shadowColor = ratingColor;
      ctx.shadowBlur = 40;
      ctx.font = `bold ${Math.min(120, 60 + this.ratingTimer * 30)}px "Rajdhani", sans-serif`;
      ctx.fillText(this.rating, W / 2, H / 2 - 20);
      ctx.shadowBlur = 0;

      // Details
      ctx.font = '16px monospace';
      ctx.fillStyle = '#ccddcc';
      const statY = H / 2 + 40;
      ctx.fillText(`ВРЕМЯ: ${this.score.time.toFixed(1)}с`, W / 2, statY);
      ctx.fillText(`ТОЧНОСТЬ ЗАХВАТА: ${Math.floor(this.score.accuracy)}%`, W / 2, statY + 25);
      ctx.fillText(`БОНУСНЫЕ ДАННЫЕ: +${this.collectedData * 15} МБ`, W / 2, statY + 50);

      if (this.score.perfectLaunch) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('✨ ИДЕАЛЬНЫЙ ЗАПУСК', W / 2, statY + 75);
      }
      if (this.score.noDamage) {
        ctx.fillStyle = '#00ff66';
        ctx.fillText('👻 БЕЗ ПОВРЕЖДЕНИЙ', W / 2, statY + (this.score.perfectLaunch ? 100 : 75));
      }

      ctx.textAlign = 'left';
    }
  }
}

// =========================================================================
// DAILY QUEST TEMPLATES
// =========================================================================
const DAILY_QUEST_TEMPLATES = [
  {
    id: 'clicks',
    desc: 'Произвести {n} тактических кликов/разведок',
    icon: '🎯',
    getN: (p) => 50 + p * 25,
    check: (g, target) => (g.dailyClicks || 0) >= target
  },
  {
    id: 'data',
    desc: 'Собрать {n} МБ разведывательных данных',
    icon: '📡',
    getN: (p) => 200 + p * 150,
    check: (g, target) => (g.dailyDataCollected || 0) >= target
  },
  {
    id: 'credits',
    desc: 'Заработать ${n} на контрактах и потоках',
    icon: '💰',
    getN: (p) => 5000 + p * 5000,
    check: (g, target) => (g.dailyCreditsEarned || 0) >= target
  },
  {
    id: 'crits',
    desc: 'Выполнить {n} критических перехватов данных',
    icon: '⚡',
    getN: (p) => 10 + p * 5,
    check: (g, target) => (g.dailyCrits || 0) >= target
  },
  {
    id: 'hacks',
    desc: 'Успешно завершить {n} взломов РЭБ врага',
    icon: '📻',
    getN: (p) => 2 + p,
    check: (g, target) => (g.dailyHacks || 0) >= target
  },
  {
    id: 'overclock',
    desc: 'Использовать боевой разгон {n} раз(а)',
    icon: '🚀',
    getN: (p) => 3 + p,
    check: (g, target) => (g.dailyOverclocks || 0) >= target
  }
];

// ==============================================
// MAIN BARRACUDA GAME CLASS v8
// (Optimized + Boss Ships + Daily Quests + Offline Income + Campaign + Hangar)
// ==============================================
