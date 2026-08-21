// =========================================================================
// BARRACUDA VISUAL & PHYSICS ENGINE (PHOTOREALISTIC LAYER)
// - Dynamic 3D mouse parallax & heave/roll bounce physics on drone
// - Real-time green tactical radar wave scanner canvas
// - Modular hardpoint mounting system (visual upgrade evolution)
// =========================================================================

class BarracudaVisualEngine {
  constructor(onClickCallback) {
    this.onClickCallback = onClickCallback;
    this.container = document.getElementById('photoreal-hero-container');
    this.backdrop = document.getElementById('photoreal-backdrop');
    this.droneAnchor = document.getElementById('drone-interactive-anchor');
    this.stencilGlow = document.querySelector('.stencil-glow-layer');

    this.waterCanvas = document.getElementById('water-fx-canvas');
    this.waterCtx = this.waterCanvas ? this.waterCanvas.getContext('2d') : null;

    this.radarCanvas = document.getElementById('radar-grid-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    this.tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.bounce = 0;
    this.time = 0;

    this.modules = { satcom: 0, optics: 0, armor: 0, waterjets: 0, missiles: 0 };

    this.init();
  }

  init() {
    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());
    this.setupInteractions();
    this.startRenderLoop();
  }

  resizeCanvases() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    if (this.waterCanvas) { this.waterCanvas.width = W; this.waterCanvas.height = H; }
    if (this.radarCanvas) { this.radarCanvas.width = W; this.radarCanvas.height = H; }
  }

  setupInteractions() {
    // Interactive mouse parallax & tilt on drone
    window.addEventListener('mousemove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      this.tilt.targetX = normX * 12;
      this.tilt.targetY = -normY * 8;
    });

    // Drone click interaction
    if (this.droneAnchor) {
      this.droneAnchor.addEventListener('click', (e) => {
        this.triggerClick(e.clientX, e.clientY);
      });
    }

    // Touch support
    if (this.droneAnchor) {
      this.droneAnchor.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
          this.triggerClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      }, { passive: true });
    }
  }

  triggerClick(x, y) {
    this.bounce = 1.0;
    if (this.stencilGlow) {
      this.stencilGlow.classList.remove('pulsing');
      void this.stencilGlow.offsetWidth; // trigger reflow
      this.stencilGlow.classList.add('pulsing');
    }
    if (this.onClickCallback) {
      this.onClickCallback(x, y);
    }
  }

  triggerClickBounce() {
    this.bounce = 1.0;
    if (this.stencilGlow) {
      this.stencilGlow.classList.remove('pulsing');
      void this.stencilGlow.offsetWidth;
      this.stencilGlow.classList.add('pulsing');
    }
  }

  updateUpgrades(upgrades) {
    this.modules = { ...upgrades };
    
    // Mount visual upgrade layers on drone
    const setMod = (id, active) => {
      const el = document.getElementById(id);
      if (el) {
        if (active) el.classList.add('mounted');
        else el.classList.remove('mounted');
      }
    };

    setMod('mod-layer-satcom', upgrades.satcom > 0);
    setMod('mod-layer-optics', upgrades.optics > 0);
    setMod('mod-layer-armor', upgrades.armor > 0);
    setMod('mod-layer-waterjets', upgrades.waterjets > 0);
    setMod('mod-layer-missiles', upgrades.missiles > 0 || upgrades.prestige > 0);
  }

  startRenderLoop() {
    let last = performance.now();

    const loop = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      this.time += dt;

      // Smooth spring tilt physics
      this.tilt.x += (this.tilt.targetX - this.tilt.x) * 0.08;
      this.tilt.y += (this.tilt.targetY - this.tilt.y) * 0.08;

      // Organic heave & roll floating motion + bounce shockwave
      const heave = Math.sin(this.time * 2.2) * 6 + Math.cos(this.time * 1.5) * 3;
      const roll = Math.sin(this.time * 1.8) * 1.2;
      const pitch = Math.cos(this.time * 1.4) * 0.8;
      const bounceOffset = this.bounce * -16;

      if (this.droneAnchor) {
        this.droneAnchor.style.transform = `
          translate(-50%, -50%)
          translate3d(${this.tilt.x * 1.5}px, ${heave + bounceOffset}px, 0)
          rotateX(${this.tilt.y * 0.8 + pitch}deg)
          rotateY(${this.tilt.x * 0.8 + roll}deg)
          scale(${1.0 + this.bounce * 0.04})
        `;
      }

      if (this.backdrop) {
        this.backdrop.style.transform = `
          translate3d(${-this.tilt.x * 0.6}px, ${-this.tilt.y * 0.6 + heave * 0.3}px, 0)
          scale(1.03)
        `;
      }

      if (this.bounce > 0) {
        this.bounce *= 0.85;
      }

      this.drawRadarGrid();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // Draw animated undulating green radar grid over sea surface (Concept Art replica)
  drawRadarGrid() {
    if (!this.radarCtx || !this.radarCanvas) return;
    const ctx = this.radarCtx;
    const W = this.radarCanvas.width;
    const H = this.radarCanvas.height;

    ctx.clearRect(0, 0, W, H);

    const seaY = H * 0.52; // Water horizon level
    const gridCols = 24;
    const gridRows = 14;

    ctx.strokeStyle = 'rgba(0, 255, 102, 0.18)';
    ctx.lineWidth = 1;

    // Perspective terrain radar wave lines
    for (let r = 0; r < gridRows; r++) {
      const rowT = r / gridRows;
      const yBase = seaY + Math.pow(rowT, 1.4) * (H - seaY);

      ctx.beginPath();
      for (let c = 0; c <= gridCols; c++) {
        const colT = (c / gridCols) * 2 - 1; // -1 .. 1
        const x = W * 0.5 + colT * (W * 0.65) * (0.3 + rowT * 0.8);
        
        // Undulating 3D wave displacement
        const wave = Math.sin(colT * 4 + this.time * 2.0 + rowT * 5) * (4 + rowT * 12) +
                     Math.cos(rowT * 6 - this.time * 1.5) * (3 + rowT * 8);

        const y = yBase + wave;

        if (c === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Radial perspective lines radiating to horizon
    for (let c = 0; c <= gridCols; c += 2) {
      const colT = (c / gridCols) * 2 - 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + colT * (W * 0.15), seaY);
      ctx.lineTo(W * 0.5 + colT * (W * 0.7), H);
      ctx.stroke();
    }

    // Radar scanning pulse sweep
    const sweepAngle = (this.time * 1.5) % (Math.PI * 2);
    ctx.save();
    ctx.translate(W * 0.5, seaY + 120);
    ctx.rotate(sweepAngle);
    const radGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 320);
    radGrad.addColorStop(0, 'rgba(0, 255, 102, 0.35)');
    radGrad.addColorStop(0.5, 'rgba(0, 255, 102, 0.08)');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 320, 0, Math.PI / 3);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();
  }
}

window.BarracudaVisualEngine = BarracudaVisualEngine;
window.Barracuda3DEngine = BarracudaVisualEngine; // Alias for backward compatibility
