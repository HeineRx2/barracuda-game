// =========================================================================
// BARRACUDA PHOTOREALISTIC ENGINE (REAL WATER, CARBON HULL & HORIZON)
// =========================================================================

class PhotorealBarracudaEngine {
  constructor(onClickCallback) {
    this.onClickCallback = onClickCallback;
    this.viewport = document.getElementById('photoreal-viewport');
    this.droneWrapper = document.getElementById('drone-hero-wrapper');
    this.droneHull = document.getElementById('drone-hull-click');
    this.stencilPulse = document.getElementById('neon-stencil-pulse');

    this.waterCanvas = document.getElementById('water-physics-canvas');
    this.waterCtx = this.waterCanvas ? this.waterCanvas.getContext('2d') : null;

    this.radarCanvas = document.getElementById('tactical-radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    this.tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.recoil = 0;
    this.time = 0;
    this.ripples = [];

    this.init();
  }

  init() {
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());
    this.setupInteractions();
    this.startLoop();
  }

  resizeCanvases() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (this.waterCanvas) { this.waterCanvas.width = W; this.waterCanvas.height = H; }
    if (this.radarCanvas) { this.radarCanvas.width = W; this.radarCanvas.height = H; }
  }

  setupInteractions() {
    // 3D Mouse Parallax & Dynamic Tilt
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.tilt.targetX = nx * 14;
      this.tilt.targetY = -ny * 10;
    });

    // Direct Click on Drone
    const handleHit = (x, y) => {
      this.triggerClick(x, y);
    };

    if (this.droneHull) {
      this.droneHull.addEventListener('mousedown', (e) => {
        handleHit(e.clientX, e.clientY);
      });
      this.droneHull.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          handleHit(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
    }

    // Viewport general click
    if (this.viewport) {
      this.viewport.addEventListener('click', (e) => {
        // If clicked outside panels
        if (e.target === this.viewport || e.target === this.waterCanvas || e.target === this.radarCanvas) {
          handleHit(e.clientX, e.clientY);
        }
      });
    }
  }

  triggerClick(x, y) {
    this.recoil = 1.0;

    // Neon Stencil Energy Pulse
    if (this.stencilPulse) {
      this.stencilPulse.classList.remove('pulse-active');
      void this.stencilPulse.offsetWidth;
      this.stencilPulse.classList.add('pulse-active');
    }

    // Water Splash Ripple
    this.ripples.push({
      x: x || window.innerWidth * 0.5,
      y: y || window.innerHeight * 0.55,
      radius: 10,
      opacity: 0.8,
      speed: 4.0
    });

    if (this.onClickCallback) {
      this.onClickCallback(x || window.innerWidth * 0.5, (y || window.innerHeight * 0.5) - 20);
    }
  }

  triggerClickBounce() {
    this.recoil = 1.0;
    if (this.stencilPulse) {
      this.stencilPulse.classList.remove('pulse-active');
      void this.stencilPulse.offsetWidth;
      this.stencilPulse.classList.add('pulse-active');
    }
  }

  updateUpgrades(upgrades) {
    const setMod = (id, active) => {
      const el = document.getElementById(id);
      if (el) {
        if (active) el.classList.add('active-mod');
        else el.classList.remove('active-mod');
      }
    };

    setMod('vis-mod-satcom', upgrades.satcom > 0);
    setMod('vis-mod-optics', upgrades.optics > 0);
    setMod('vis-mod-armor', upgrades.armor > 0);
    setMod('vis-mod-waterjets', upgrades.waterjets > 0);
    setMod('vis-mod-missiles', upgrades.missiles > 0 || upgrades.prestige > 0);
  }

  startLoop() {
    let last = performance.now();

    const loop = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      this.time += dt;

      // 3D Spring Tilt Physics
      this.tilt.x += (this.tilt.targetX - this.tilt.x) * 0.08;
      this.tilt.y += (this.tilt.targetY - this.tilt.y) * 0.08;

      // Organic Water Heave & Roll Waves
      const heave = Math.sin(this.time * 2.2) * 5 + Math.cos(this.time * 1.6) * 3;
      const roll = Math.sin(this.time * 1.8) * 1.0;
      const pitch = Math.cos(this.time * 1.4) * 0.7;
      const recoilY = this.recoil * -18;
      const recoilScale = 1.0 + this.recoil * 0.035;

      if (this.droneWrapper) {
        this.droneWrapper.style.transform = `
          translate3d(${this.tilt.x * 1.2}px, ${heave + recoilY}px, 0)
          rotateX(${this.tilt.y * 0.7 + pitch}deg)
          rotateY(${this.tilt.x * 0.7 + roll}deg)
          scale(${recoilScale})
        `;
      }

      if (this.recoil > 0) {
        this.recoil *= 0.86;
      }

      this.renderWaterPhysics(dt);
      this.renderTacticalRadar();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // Dynamic Live Water Ripples & Wake Foam Shimmer
  renderWaterPhysics(dt) {
    if (!this.waterCtx || !this.waterCanvas) return;
    const ctx = this.waterCtx;
    const W = this.waterCanvas.width;
    const H = this.waterCanvas.height;

    ctx.clearRect(0, 0, W, H);

    // Update & draw click splash ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.opacity -= dt * 1.2;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.radius * 1.8, r.radius * 0.8, -0.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 255, 102, ${Math.max(0, r.opacity)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.radius * 1.2, r.radius * 0.5, -0.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, r.opacity * 0.7)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      if (r.opacity <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  // Real-Time Green Tactical 3D Radar Wave Terrain Grid
  renderTacticalRadar() {
    if (!this.radarCtx || !this.radarCanvas) return;
    const ctx = this.radarCtx;
    const W = this.radarCanvas.width;
    const H = this.radarCanvas.height;

    ctx.clearRect(0, 0, W, H);

    const horizonY = H * 0.48; // Sea horizon line
    const rows = 16;
    const cols = 26;

    ctx.strokeStyle = 'rgba(0, 255, 102, 0.22)';
    ctx.lineWidth = 1;

    // Longitudinal topographical wave lines
    for (let r = 0; r < rows; r++) {
      const rowT = r / rows;
      const yBase = horizonY + Math.pow(rowT, 1.5) * (H - horizonY);

      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const colT = (c / cols) * 2 - 1;
        const x = W * 0.5 + colT * (W * 0.68) * (0.25 + rowT * 0.85);

        // Undulating wave mathematical displacement
        const wave = Math.sin(colT * 4.5 + this.time * 2.0 + rowT * 4) * (3 + rowT * 14) +
                     Math.cos(rowT * 5.5 - this.time * 1.6) * (2 + rowT * 8);

        const y = yBase + wave;

        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Radial perspective lines radiating to sea horizon
    for (let c = 0; c <= cols; c += 2) {
      const colT = (c / cols) * 2 - 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + colT * (W * 0.12), horizonY);
      ctx.lineTo(W * 0.5 + colT * (W * 0.72), H);
      ctx.stroke();
    }

    // Concentric Scanner Radar Pulses
    const sweepRadius = (this.time * 80) % (W * 0.45);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.5, horizonY + (H - horizonY) * 0.45, sweepRadius * 1.6, sweepRadius * 0.65, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0, 255, 102, ${Math.max(0, 0.35 - (sweepRadius / (W * 0.45)) * 0.35)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// Global Engine Instance
window.BarracudaVisualEngine = PhotorealBarracudaEngine;
window.Barracuda3DEngine = PhotorealBarracudaEngine;
