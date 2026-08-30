// =========================================================================
// BARRACUDA — REALISTIC TACTICAL AUDIO ENGINE v4
// (Web Audio API — All sounds synthesized, zero external files)
// Designed for military naval drone simulation: layered noise,
// convolution reverb, waveshaper saturation, dynamic compression.
// =========================================================================
class TacticalAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
    this._ambientExtras = [];
    this._fpvMotorOsc = null;
    this._fpvMotorGain = null;
    this._fpvMotorFilter = null;
    this._fpvMotors = [];
    this._engineIdleOsc = null;
    this._reverbBuffer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master chain: gain → compressor → destination
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 12;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.15;
      this.compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.compressor);

      // Pre-build impulse response for reverb
      this._reverbBuffer = this._buildReverbIR(2.5, 2.0);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // =========================================================================
  // UTILITY: Noise buffer
  // =========================================================================
  createNoiseBuffer(duration) {
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Brownian (red) noise — smoother, deeper
  _createBrownNoiseBuffer(duration) {
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  // =========================================================================
  // UTILITY: Impulse-response reverb buffer
  // =========================================================================
  _buildReverbIR(duration, decay) {
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // Create a convolver node with reverb
  _makeReverb(wetGain = 0.3) {
    const conv = this.ctx.createConvolver();
    conv.buffer = this._reverbBuffer;
    const wet = this.ctx.createGain();
    wet.gain.value = wetGain;
    conv.connect(wet);
    return { convolver: conv, wetGain: wet };
  }

  // =========================================================================
  // UTILITY: Waveshaper distortion
  // =========================================================================
  _makeDistortion(amount = 50) {
    const ws = this.ctx.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    ws.curve = curve;
    ws.oversample = '4x';
    return ws;
  }

  // Soft-clip saturation (warmer than hard distortion)
  _makeSaturation(drive = 2.0) {
    const ws = this.ctx.createWaveShaper();
    const n = 8192;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * drive);
    }
    ws.curve = curve;
    ws.oversample = '2x';
    return ws;
  }

  // =========================================================================
  // UTILITY: Quick filtered noise source
  // =========================================================================
  _filteredNoise(type, freq, Q, duration) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(duration);
    const filt = this.ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = freq;
    filt.Q.value = Q;
    src.connect(filt);
    return { source: src, filter: filt };
  }

  // =========================================================================
  // CORE CLICK SOUNDS — Tactical toggle clicks & pleasant UI tones
  // =========================================================================
  playPing() {
    this.init();
    const now = this.ctx.currentTime;

    // High-tech resonant pulse — pure sine with smooth decay
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1320, now);
    osc1.frequency.exponentialRampToValueAtTime(660, now + 0.05);

    g1.gain.setValueAtTime(0.22, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc1.connect(g1);
    g1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.055);

    // Warm sub-thump for tactile feel
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.045);

    g2.gain.setValueAtTime(0.18, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc2.connect(g2);
    g2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + 0.05);
  }

  playCritPing() {
    this.init();
    const now = this.ctx.currentTime;

    // Heavy sub-bass punch
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.22);
    subG.gain.setValueAtTime(0.5, now);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    sub.connect(subG);
    subG.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.25);

    // Bright harmonic ping
    const ping = this.ctx.createOscillator();
    const pingG = this.ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.setValueAtTime(1760, now);
    ping.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    pingG.gain.setValueAtTime(0.28, now);
    pingG.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    ping.connect(pingG);
    pingG.connect(this.masterGain);
    ping.start(now);
    ping.stop(now + 0.15);
  }

  // =========================================================================
  // UPGRADE & PURCHASE — Mechanical hydraulic & clean high-tech sounds
  // =========================================================================
  playMountingSfx() {
    this.init();
    const now = this.ctx.currentTime;

    // Heavy hydraulic servo clamp — metallic impact + pressurized hiss
    const { source: hiss, filter: hf } = this._filteredNoise('bandpass', 4000, 3, 0.15);
    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(0.001, now);
    hg.gain.linearRampToValueAtTime(0.12, now + 0.01);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    hf.connect(hg);
    hg.connect(this.masterGain);
    hiss.start(now);
    hiss.stop(now + 0.15);

    // Metallic clank
    const clank = this.ctx.createOscillator();
    const cg = this.ctx.createGain();
    clank.type = 'square';
    clank.frequency.setValueAtTime(180, now + 0.05);
    clank.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    cg.gain.setValueAtTime(0.2, now + 0.05);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    clank.connect(cg);
    cg.connect(this.masterGain);
    clank.start(now + 0.05);
    clank.stop(now + 0.13);
  }

  playUpgradeSfx() {
    this.init();
    const now = this.ctx.currentTime;

    // Heavy industrial servo whine — descending then ascending sweep
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
    g.gain.setValueAtTime(0.15, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.36);

    // Pressurized air release
    const { source: air, filter: af } = this._filteredNoise('highpass', 6000, 2, 0.1);
    const ag = this.ctx.createGain();
    ag.gain.setValueAtTime(0.001, now + 0.2);
    ag.gain.linearRampToValueAtTime(0.08, now + 0.22);
    ag.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    af.connect(ag);
    ag.connect(this.masterGain);
    air.start(now + 0.2);
    air.stop(now + 0.33);
  }

  playContractSfx() {
    this.init();
    const now = this.ctx.currentTime;

    // Radio dispatch confirmation — low-frequency pulse + static burst
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(440, now + 0.08);
    osc.frequency.setValueAtTime(660, now + 0.12);
    g.gain.setValueAtTime(0.18, now);
    g.gain.setValueAtTime(0.18, now + 0.08);
    g.gain.setValueAtTime(0.001, now + 0.09);
    g.gain.setValueAtTime(0.18, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);

    // Radio static
    const { source: n, filter: flt } = this._filteredNoise('bandpass', 2400, 4, 0.06);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.08, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    flt.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.06);
  }

  // =========================================================================
  // DOSSIER TYPEWRITER — Realistic mechanical tick
  // =========================================================================
  playTypewriter() {
    this.init();
    const now = this.ctx.currentTime;

    // Mechanical noise impulse
    const { source: n, filter: f } = this._filteredNoise('highpass', 2500 + Math.random() * 2000, 1, 0.015);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    f.connect(g);
    g.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.015);
  }

  // =========================================================================
  // FLIR / THERMAL MODE — Sensor activation
  // =========================================================================
  playThermalModeSfx() {
    this.init();
    const now = this.ctx.currentTime;

    // Electronic startup sweep
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(2800, now + 0.2);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);

    // Digital noise burst
    const { source: n, filter: f } = this._filteredNoise('bandpass', 4000, 8, 0.1);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.001, now + 0.15);
    ng.gain.linearRampToValueAtTime(0.1, now + 0.18);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    f.connect(ng);
    ng.connect(this.masterGain);
    n.start(now + 0.15);
    n.stop(now + 0.3);
  }

  // =========================================================================
  // MISSILE LAUNCH — Realistic ignition + roar + doppler
  // =========================================================================
  playMissileLaunch() {
    this.init();
    const now = this.ctx.currentTime;

    // Ignition click
    const { source: ic, filter: icf } = this._filteredNoise('bandpass', 2000, 5, 0.03);
    const icg = this.ctx.createGain();
    icg.gain.setValueAtTime(0.3, now);
    icg.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    icf.connect(icg);
    icg.connect(this.masterGain);
    ic.start(now);
    ic.stop(now + 0.03);

    // Rocket roar — rising bandpass noise
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(2.2);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(300, now + 0.02);
    bp.frequency.exponentialRampToValueAtTime(1800, now + 0.6);
    bp.frequency.exponentialRampToValueAtTime(3500, now + 1.5);
    bp.Q.value = 2.0;
    const rg = this.ctx.createGain();
    rg.gain.setValueAtTime(0.01, now + 0.02);
    rg.gain.linearRampToValueAtTime(0.5, now + 0.2);
    rg.gain.linearRampToValueAtTime(0.55, now + 0.8);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    const sat = this._makeSaturation(2.0);
    src.connect(bp);
    bp.connect(sat);
    sat.connect(rg);
    rg.connect(this.masterGain);
    src.start(now + 0.02);
    src.stop(now + 2.2);

    // Motor whine with doppler shift
    const motor = this.ctx.createOscillator();
    const mg = this.ctx.createGain();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(200, now + 0.05);
    motor.frequency.exponentialRampToValueAtTime(1400, now + 0.5);
    motor.frequency.exponentialRampToValueAtTime(600, now + 1.8);
    mg.gain.setValueAtTime(0.15, now + 0.05);
    mg.gain.linearRampToValueAtTime(0.2, now + 0.3);
    mg.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    const mlp = this.ctx.createBiquadFilter();
    mlp.type = 'lowpass';
    mlp.frequency.value = 2500;
    motor.connect(mlp);
    mlp.connect(mg);
    mg.connect(this.masterGain);
    motor.start(now + 0.05);
    motor.stop(now + 1.8);
  }

  // =========================================================================
  // RADIO SQUELCH — Realistic crackle
  // =========================================================================
  playRadioSquelch() {
    this.init();
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.18);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 4.0;
    const dist = this._makeDistortion(30);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    src.connect(bp);
    bp.connect(dist);
    dist.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.18);
  }

  // =========================================================================
  // SIGINT CYBER HACK — Layered digital tones
  // =========================================================================
  playCyberHackTone(success) {
    this.init();
    const now = this.ctx.currentTime;
    const freqs = success ? [330, 440, 550, 660] : [500, 400, 300, 200];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = success ? 3000 : 1500;
      osc.type = success ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.08);
      g.gain.setValueAtTime(0.14, now + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.18);
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });

    // Noise texture
    if (!success) {
      const { source: n, filter: nf } = this._filteredNoise('bandpass', 1200, 6, 0.3);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.08, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      nf.connect(ng);
      ng.connect(this.masterGain);
      n.start(now);
      n.stop(now + 0.3);
    }
  }

  playSonarPing() {
    this.init();
    const now = this.ctx.currentTime;

    // Underwater ping with long reverb tail
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(1420, now + 0.8);
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    const { convolver, wetGain } = this._makeReverb(0.5);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.connect(convolver);
    wetGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  // =========================================================================
  // ALARM SIREN — Military warship klaxon
  // =========================================================================
  playAlarm() {
    this.init();
    const now = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.45;
      // Two detuned square oscillators with LFO modulation
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      const g = this.ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(680, t);
      osc2.frequency.setValueAtTime(690, t);
      osc1.frequency.linearRampToValueAtTime(850, t + 0.2);
      osc2.frequency.linearRampToValueAtTime(860, t + 0.2);

      lfo.type = 'sine';
      lfo.frequency.value = 6;
      lfoG.gain.value = 30;
      lfo.connect(lfoG);
      lfoG.connect(osc1.frequency);

      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2200;

      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      lfo.start(t);
      osc1.stop(t + 0.4);
      osc2.stop(t + 0.4);
      lfo.stop(t + 0.4);
    }
  }

  // =========================================================================
  // EXPLOSION — Massive layered with shockwave & reverb tail
  // =========================================================================
  playExplosion() {
    this.init();
    const now = this.ctx.currentTime;

    // Initial shockwave impulse
    const impulse = this.ctx.createBufferSource();
    const impBuf = this.ctx.createBuffer(1, 128, this.ctx.sampleRate);
    const impD = impBuf.getChannelData(0);
    for (let i = 0; i < 128; i++) impD[i] = (1 - i / 128) * (Math.random() * 0.6 + 0.4);
    impulse.buffer = impBuf;
    const impG = this.ctx.createGain();
    impG.gain.setValueAtTime(0.7, now);
    impG.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    impulse.connect(impG);
    impG.connect(this.masterGain);
    impulse.start(now);

    // Sub-bass sweep
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    const subSat = this._makeSaturation(3.0);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(18, now + 1.2);
    subG.gain.setValueAtTime(0.65, now);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    sub.connect(subSat);
    subSat.connect(subG);
    subG.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 1.5);

    // Main noise body — lowpass with dynamic Q
    const nSrc = this.ctx.createBufferSource();
    nSrc.buffer = this.createNoiseBuffer(2.5);
    const nlp = this.ctx.createBiquadFilter();
    nlp.type = 'lowpass';
    nlp.frequency.setValueAtTime(800, now);
    nlp.frequency.exponentialRampToValueAtTime(60, now + 2.0);
    nlp.Q.setValueAtTime(1, now);
    nlp.Q.linearRampToValueAtTime(4, now + 0.5);
    nlp.Q.linearRampToValueAtTime(0.5, now + 2.0);
    const nG = this.ctx.createGain();
    nG.gain.setValueAtTime(0.7, now);
    nG.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    nSrc.connect(nlp);
    nlp.connect(nG);
    nG.connect(this.masterGain);
    nSrc.start(now);
    nSrc.stop(now + 2.5);

    // Mid debris crackle
    const { source: cr, filter: crf } = this._filteredNoise('bandpass', 3000, 5, 0.6);
    const crG = this.ctx.createGain();
    crG.gain.setValueAtTime(0.25, now + 0.03);
    crG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    crf.connect(crG);
    crG.connect(this.masterGain);
    cr.start(now + 0.03);
    cr.stop(now + 0.6);

    // Reverb tail
    const { convolver, wetGain } = this._makeReverb(0.35);
    nSrc.connect(convolver);
    wetGain.connect(this.masterGain);
  }

  // =========================================================================
  // HEAVY EXPLOSION — Extra-powerful version for mission events
  // =========================================================================
  playHeavyExplosion() {
    this.init();
    const now = this.ctx.currentTime;

    // Massive shockwave
    const sub = this.ctx.createOscillator();
    const subG = this.ctx.createGain();
    const sat = this._makeSaturation(4.0);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(100, now);
    sub.frequency.exponentialRampToValueAtTime(12, now + 1.8);
    subG.gain.setValueAtTime(0.8, now);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    sub.connect(sat);
    sat.connect(subG);
    subG.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 2.0);

    // Massive noise body
    const n = this.ctx.createBufferSource();
    n.buffer = this._createBrownNoiseBuffer(3.5);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, now);
    lp.frequency.exponentialRampToValueAtTime(40, now + 3.0);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.75, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    n.connect(lp);
    lp.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 3.5);

    // Debris crackle
    const { source: cr, filter: cf } = this._filteredNoise('bandpass', 4500, 6, 1.0);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.3, now + 0.05);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    cf.connect(cg);
    cg.connect(this.masterGain);
    cr.start(now + 0.05);
    cr.stop(now + 1.0);

    // Metal groan
    const groan = this.ctx.createOscillator();
    const gg = this.ctx.createGain();
    groan.type = 'sawtooth';
    groan.frequency.setValueAtTime(80, now + 0.3);
    groan.frequency.linearRampToValueAtTime(45, now + 2.0);
    gg.gain.setValueAtTime(0.001, now + 0.3);
    gg.gain.linearRampToValueAtTime(0.12, now + 0.8);
    gg.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    const glp = this.ctx.createBiquadFilter();
    glp.type = 'lowpass';
    glp.frequency.value = 300;
    groan.connect(glp);
    glp.connect(gg);
    gg.connect(this.masterGain);
    groan.start(now + 0.3);
    groan.stop(now + 2.5);

    // Reverb
    const { convolver, wetGain } = this._makeReverb(0.4);
    n.connect(convolver);
    wetGain.connect(this.masterGain);
  }

  // =========================================================================
  // EMP EXPLOSION — Electronic shutdown + boom
  // =========================================================================
  playEmpExplosion() {
    this.init();
    const now = this.ctx.currentTime;

    // EMP sweep — rising high frequency
    const sweep = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(200, now);
    sweep.frequency.exponentialRampToValueAtTime(8000, now + 0.15);
    sweep.frequency.exponentialRampToValueAtTime(100, now + 0.4);
    sg.gain.setValueAtTime(0.2, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 2;
    sweep.connect(bp);
    bp.connect(sg);
    sg.connect(this.masterGain);
    sweep.start(now);
    sweep.stop(now + 0.5);

    // Bass thump
    const sub = this.ctx.createOscillator();
    const subg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(70, now + 0.1);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.8);
    subg.gain.setValueAtTime(0.5, now + 0.1);
    subg.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    sub.connect(subg);
    subg.connect(this.masterGain);
    sub.start(now + 0.1);
    sub.stop(now + 1.0);

    // Static discharge noise
    const { source: n, filter: nf } = this._filteredNoise('highpass', 3000, 1, 0.6);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.25, now + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    nf.connect(ng);
    ng.connect(this.masterGain);
    n.start(now + 0.05);
    n.stop(now + 0.6);
  }

  // =========================================================================
  // ENEMY SHOOT — Gunfire / cannon shot
  // =========================================================================
  playEnemyShoot() {
    this.init();
    const now = this.ctx.currentTime;

    // Gunshot crack — sharp noise burst
    const { source: crack, filter: cf } = this._filteredNoise('bandpass', 2200, 3, 0.08);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.4, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    cf.connect(cg);
    cg.connect(this.masterGain);
    crack.start(now);
    crack.stop(now + 0.08);

    // Bass thump of gunpowder
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    sg.gain.setValueAtTime(0.35, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    const sat = this._makeSaturation(2.0);
    sub.connect(sat);
    sat.connect(sg);
    sg.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.2);

    // Distance echo
    const { source: echo, filter: ef } = this._filteredNoise('lowpass', 500, 1, 0.3);
    const eg = this.ctx.createGain();
    eg.gain.setValueAtTime(0.001, now + 0.1);
    eg.gain.linearRampToValueAtTime(0.08, now + 0.15);
    eg.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    ef.connect(eg);
    eg.connect(this.masterGain);
    echo.start(now + 0.1);
    echo.stop(now + 0.4);
  }

  // =========================================================================
  // TARGET LOCK — Steady tracking tone
  // =========================================================================
  playTargetLock() {
    this.init();
    const now = this.ctx.currentTime;

    // Lock-on confirmation double pulse
    [0, 0.12].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2200;
      g.gain.setValueAtTime(0.2, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // =========================================================================
  // FPV MINIGAME SOUNDS
  // =========================================================================

  playPVOFlyby() {
    this.init();
    const now = this.ctx.currentTime;

    // Doppler whoosh — frequency-swept bandpass noise
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.4);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(600, now);
    bp.frequency.exponentialRampToValueAtTime(2800, now + 0.15);
    bp.frequency.exponentialRampToValueAtTime(350, now + 0.4);
    bp.Q.value = 1.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.4);
  }

  playRWR() {
    this.init();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 2800;
      const t = now + i * 0.07;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 4000;
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

  playCountermeasure() {
    this.init();
    const now = this.ctx.currentTime;

    // Flare ignition hiss
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.5);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2000, now);
    hp.frequency.linearRampToValueAtTime(5000, now + 0.2);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.1, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.5);

    // Pop
    const osc = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    og.gain.setValueAtTime(0.25, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(og);
    og.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playFPVLaunch() {
    this.init();
    const now = this.ctx.currentTime;

    // 4 motors spinning up (detuned sawtooth cluster)
    const baseFreq = 120;
    const detunes = [-12, -5, 5, 15];
    detunes.forEach(det => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
      osc.detune.value = det;
      g.gain.setValueAtTime(0.04, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2000;
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    });

    // Wind noise
    const { source: w, filter: wf } = this._filteredNoise('highpass', 1500, 0.5, 0.6);
    const wg = this.ctx.createGain();
    wg.gain.setValueAtTime(0.001, now + 0.1);
    wg.gain.linearRampToValueAtTime(0.12, now + 0.4);
    wg.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    wf.connect(wg);
    wg.connect(this.masterGain);
    w.start(now + 0.1);
    w.stop(now + 0.7);
  }

  playPerfectLaunch() {
    this.init();
    const now = this.ctx.currentTime;

    // Clean confirmation chime — two military tones
    [880, 1320].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t = now + i * 0.08;
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playShieldHit() {
    this.init();
    const now = this.ctx.currentTime;

    // Metallic deflection
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    const sat = this._makeSaturation(2.0);
    osc.connect(sat);
    sat.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // Impact noise
    const { source: n, filter: nf } = this._filteredNoise('bandpass', 1500, 3, 0.06);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.2, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    nf.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.06);
  }

  playDataPickup() {
    this.init();
    const now = this.ctx.currentTime;

    // Digital chirp
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.06);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);

    // Confirmation tick
    const { source: n, filter: nf } = this._filteredNoise('highpass', 4000, 1, 0.02);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.12, now + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    nf.connect(ng);
    ng.connect(this.masterGain);
    n.start(now + 0.05);
    n.stop(now + 0.07);
  }

  playLockOnTone(isLocked) {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = isLocked ? 2200 : 1100;
    g.gain.setValueAtTime(isLocked ? 0.12 : 0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playPhaseTransition() {
    this.init();
    const now = this.ctx.currentTime;

    // Deep cinematic impact
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    const sat = this._makeSaturation(2.5);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.6);
    sg.gain.setValueAtTime(0.5, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    sub.connect(sat);
    sat.connect(sg);
    sg.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.8);

    // Rising sweep
    const rise = this.ctx.createOscillator();
    const rg = this.ctx.createGain();
    rise.type = 'sawtooth';
    rise.frequency.setValueAtTime(200, now + 0.1);
    rise.frequency.exponentialRampToValueAtTime(1500, now + 0.5);
    rg.gain.setValueAtTime(0.1, now + 0.1);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    const rlp = this.ctx.createBiquadFilter();
    rlp.type = 'lowpass';
    rlp.frequency.value = 2000;
    rise.connect(rlp);
    rlp.connect(rg);
    rg.connect(this.masterGain);
    rise.start(now + 0.1);
    rise.stop(now + 0.55);

    // Noise wash
    const { source: n, filter: nf } = this._filteredNoise('lowpass', 600, 1, 0.5);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.15, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    nf.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.5);
  }

  // =========================================================================
  // RATING REVEAL — Military drum roll + stinger
  // =========================================================================
  playRatingReveal(rank) {
    this.init();
    const now = this.ctx.currentTime;

    // Drum roll — rapid filtered noise pulses
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.05;
      const { source: n, filter: f } = this._filteredNoise('bandpass', 300 + Math.random() * 200, 3, 0.04);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12 + i * 0.01, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      f.connect(g);
      g.connect(this.masterGain);
      n.start(t);
      n.stop(t + 0.05);
    }

    // Stinger chord — varies by rank
    const stingerTime = now + 0.45;
    const chords = {
      'S': [440, 554, 660],
      'A': [392, 494, 587],
      'B': [349, 440, 523],
      'C': [330, 392, 494]
    };
    const notes = chords[rank] || chords['C'];
    notes.forEach(f => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = rank === 'S' ? 'triangle' : 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.001, stingerTime);
      g.gain.linearRampToValueAtTime(0.18, stingerTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, stingerTime + 0.5);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2500;
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(stingerTime);
      osc.stop(stingerTime + 0.55);
    });
  }

  // =========================================================================
  // ACHIEVEMENT UNLOCK — Short military bugle
  // =========================================================================
  playAchievementUnlock() {
    this.init();
    const now = this.ctx.currentTime;

    // Two-note trumpet via shaped sawtooth
    const notes = [392, 523];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      // Formant filter for trumpet-like quality
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 2;
      osc.connect(bp);
      bp.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
    });

    // Short snare roll
    const { source: n, filter: nf } = this._filteredNoise('bandpass', 400, 2, 0.1);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.12, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    nf.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.1);
  }

  // =========================================================================
  // EVENT ALERT — Urgent tactical double-pulse
  // =========================================================================
  playEventAlert() {
    this.init();
    const now = this.ctx.currentTime;

    [0, 0.18].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1400;
      g.gain.setValueAtTime(0.15, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2500;
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.12);
    });
  }

  // =========================================================================
  // THUNDER CRACK — Sharp crack + rolling thunder
  // =========================================================================
  playThunderCrack() {
    this.init();
    const now = this.ctx.currentTime;

    // Sharp crack
    const { source: cr, filter: cf } = this._filteredNoise('bandpass', 4000, 3, 0.15);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.45, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    cf.connect(cg);
    cg.connect(this.masterGain);
    cr.start(now);
    cr.stop(now + 0.15);

    // Rolling thunder
    const t = this.ctx.createBufferSource();
    t.buffer = this._createBrownNoiseBuffer(3.0);
    const tlp = this.ctx.createBiquadFilter();
    tlp.type = 'lowpass';
    tlp.frequency.setValueAtTime(280, now + 0.12);
    tlp.frequency.exponentialRampToValueAtTime(50, now + 3.0);
    const tg = this.ctx.createGain();
    tg.gain.setValueAtTime(0.01, now + 0.1);
    tg.gain.linearRampToValueAtTime(0.3, now + 0.4);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
    t.connect(tlp);
    tlp.connect(tg);
    tg.connect(this.masterGain);
    t.start(now + 0.1);
    t.stop(now + 3.0);
  }

  // =========================================================================
  // CYBER INTERFERENCE BUZZ
  // =========================================================================
  playCyberInterference() {
    this.init();
    const now = this.ctx.currentTime;

    const { source: n, filter: f } = this._filteredNoise('bandpass', 1500 + Math.random() * 2000, 10, 0.25);
    const g = this.ctx.createGain();
    const dist = this._makeDistortion(40);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    f.connect(dist);
    dist.connect(g);
    g.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.25);
  }

  // =========================================================================
  // SHOCKWAVE BOOM — Cinematic
  // =========================================================================
  playShockwave() {
    this.init();
    const now = this.ctx.currentTime;

    // Clip impulse
    const clip = this.ctx.createBufferSource();
    const clipBuf = this.ctx.createBuffer(1, 64, this.ctx.sampleRate);
    const clipD = clipBuf.getChannelData(0);
    for (let i = 0; i < 64; i++) clipD[i] = (1 - i / 64) * 0.9;
    clip.buffer = clipBuf;
    const clipG = this.ctx.createGain();
    clipG.gain.value = 0.8;
    clip.connect(clipG);
    clipG.connect(this.masterGain);
    clip.start(now);

    // Massive saturated sub-bass
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    const sat = this._makeSaturation(4.0);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(12, now + 1.5);
    sg.gain.setValueAtTime(0.85, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    sub.connect(sat);
    sat.connect(sg);
    sg.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 1.8);

    // Wide noise blast
    const n = this.ctx.createBufferSource();
    n.buffer = this._createBrownNoiseBuffer(2.0);
    const nlp = this.ctx.createBiquadFilter();
    nlp.type = 'lowpass';
    nlp.frequency.setValueAtTime(900, now);
    nlp.frequency.exponentialRampToValueAtTime(25, now + 2.0);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.55, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    n.connect(nlp);
    nlp.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 2.0);

    // Debris ring
    const deb = this.ctx.createOscillator();
    const dg = this.ctx.createGain();
    deb.type = 'triangle';
    deb.frequency.setValueAtTime(3800, now + 0.04);
    deb.frequency.exponentialRampToValueAtTime(200, now + 0.8);
    dg.gain.setValueAtTime(0.15, now + 0.04);
    dg.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    deb.connect(dg);
    dg.connect(this.masterGain);
    deb.start(now + 0.04);
    deb.stop(now + 0.9);

    // Reverb tail
    const { convolver, wetGain } = this._makeReverb(0.45);
    n.connect(convolver);
    wetGain.connect(this.masterGain);
  }

  // =========================================================================
  // AMBIENT SECTOR SOUNDSCAPES — Tonal drones + environmental noise
  // =========================================================================
  startAmbient(sectorId) {
    this.init();
    this.stopAmbient();

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.connect(this.masterGain);
    this._ambientExtras = [];

    // Tonal drone helper
    const makeDrone = (freq, type, vol, detune) => {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      if (detune) osc.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      osc.connect(g);
      g.connect(this.ambientGain);
      osc.start(now);
      this._ambientExtras.push(osc);
    };

    // Wave/water noise — universal for all sectors (river ambience)
    const waveSrc = this.ctx.createBufferSource();
    waveSrc.buffer = this._createBrownNoiseBuffer(10);
    waveSrc.loop = true;
    const waveLp = this.ctx.createBiquadFilter();
    waveLp.type = 'lowpass';
    waveLp.frequency.value = 350;
    const waveLfo = this.ctx.createOscillator();
    const waveLfoG = this.ctx.createGain();
    waveLfo.type = 'sine';
    waveLfo.frequency.value = 0.15;
    waveLfoG.gain.value = 100;
    waveLfo.connect(waveLfoG);
    waveLfoG.connect(waveLp.frequency);
    const waveG = this.ctx.createGain();
    waveG.gain.value = 0.06;
    waveSrc.connect(waveLp);
    waveLp.connect(waveG);
    waveG.connect(this.ambientGain);
    waveSrc.start(now);
    waveLfo.start(now);
    this._ambientExtras.push(waveSrc, waveLfo);

    // Wind noise — bandpass
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.createNoiseBuffer(8);
    windSrc.loop = true;
    const windBp = this.ctx.createBiquadFilter();
    windBp.type = 'bandpass';
    windBp.frequency.value = 400;
    windBp.Q.value = 0.5;
    const windLfo = this.ctx.createOscillator();
    const windLfoG = this.ctx.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.08;
    windLfoG.gain.value = 150;
    windLfo.connect(windLfoG);
    windLfoG.connect(windBp.frequency);
    const windG = this.ctx.createGain();
    windG.gain.value = 0.03;
    windSrc.connect(windBp);
    windBp.connect(windG);
    windG.connect(this.ambientGain);
    windSrc.start(now);
    windLfo.start(now);
    this._ambientExtras.push(windSrc, windLfo);

    switch (sectorId) {
      case 'sector-1': // Storm — ominous
        this.ambientGain.gain.linearRampToValueAtTime(0.08, now + 3.0);
        makeDrone(38, 'sine', 0.4, 0);
        makeDrone(57, 'sine', 0.2, -8);
        windG.gain.value = 0.06; // Stronger wind in storm
        break;
      case 'sector-2': // Night — eerie
        this.ambientGain.gain.linearRampToValueAtTime(0.04, now + 3.0);
        makeDrone(55, 'sine', 0.25, 0);
        makeDrone(78, 'sine', 0.12, -3);
        break;
      case 'sector-3': // Sunset — warm
        this.ambientGain.gain.linearRampToValueAtTime(0.05, now + 3.0);
        makeDrone(65, 'sine', 0.25, 0);
        makeDrone(82, 'sine', 0.15, 4);
        break;
      case 'sector-4': // Dawn
      default:
        this.ambientGain.gain.linearRampToValueAtTime(0.04, now + 3.0);
        makeDrone(50, 'sine', 0.2, 0);
        makeDrone(75, 'sine', 0.12, 6);
        break;
    }

    this.isAmbientPlaying = true;
  }

  stopAmbient() {
    if (this.ambientNode) {
      try { this.ambientNode.stop(); } catch(e) {}
      this.ambientNode = null;
    }
    if (this._ambientExtras) {
      this._ambientExtras.forEach(n => { try { n.stop(); } catch(e) {} });
      this._ambientExtras = [];
    }
    this.isAmbientPlaying = false;
  }

  // =========================================================================
  // RADIO COMMS & STORY SFX
  // =========================================================================
  playCommsChirp() {
    this.init();
    const now = this.ctx.currentTime;

    // Radio chirp — two tones + noise texture
    const osc1 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(680, now);
    osc1.frequency.setValueAtTime(1020, now + 0.04);
    osc1.frequency.setValueAtTime(1360, now + 0.08);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 2;
    osc1.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.16);
  }

  playTeletypeChar() {
    this.init();
    const now = this.ctx.currentTime;
    const { source: n, filter: f } = this._filteredNoise('bandpass', 2000 + Math.random() * 800, 5, 0.02);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    f.connect(g);
    g.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.025);
  }

  playRadioStatic(duration = 0.12) {
    this.init();
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(duration);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 3.0;
    const dist = this._makeDistortion(15);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.07, now);
    g.gain.linearRampToValueAtTime(0.001, now + duration);
    src.connect(bp);
    bp.connect(dist);
    dist.connect(g);
    g.connect(this.masterGain);
    src.start(now);
  }

  playSalvagePickup() {
    this.init();
    const now = this.ctx.currentTime;

    // Metal clank
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3500, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2000;
    bp.Q.value = 2;
    osc.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // Sub impact
    const sub = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    sg.gain.setValueAtTime(0.18, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    sub.connect(sg);
    sg.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.12);
  }

  playMissionVictory() {
    this.init();
    const now = this.ctx.currentTime;

    // Victory horn — stacked fifths
    const freqs = [220, 330, 440];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.12, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1500;
      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.85);
    });

    // Impact drum
    const { source: n, filter: nf } = this._filteredNoise('lowpass', 200, 1, 0.15);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    nf.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.15);
  }

  playAlertAlarm() {
    this.init();
    const now = this.ctx.currentTime;

    // Warship klaxon — modulated square
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 800;
    lfo.type = 'sine';
    lfo.frequency.value = 4;
    lfoG.gain.value = 120;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);
    g.gain.setValueAtTime(0.14, now);
    g.gain.linearRampToValueAtTime(0.001, now + 0.35);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2000;
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.35);
    lfo.stop(now + 0.35);
  }

  // =========================================================================
  // FPV FLIGHT MOTOR — Multi-oscillator drone motor simulation
  // =========================================================================
  startFpvMotorSound() {
    this.init();
    if (this._fpvMotorOsc) return;
    try {
      const now = this.ctx.currentTime;
      this._fpvMotorGain = this.ctx.createGain();
      this._fpvMotorGain.gain.setValueAtTime(0.06, now);
      this._fpvMotorFilter = this.ctx.createBiquadFilter();
      this._fpvMotorFilter.type = 'lowpass';
      this._fpvMotorFilter.frequency.value = 2200;
      this._fpvMotorFilter.connect(this._fpvMotorGain);
      this._fpvMotorGain.connect(this.masterGain);

      // 4 motors with slight detuning
      this._fpvMotors = [];
      const detunes = [-10, -4, 4, 12];
      detunes.forEach(det => {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.detune.value = det;
        osc.connect(this._fpvMotorFilter);
        osc.start(now);
        this._fpvMotors.push(osc);
      });
      this._fpvMotorOsc = this._fpvMotors[0]; // Reference for checks

      // Wind noise layer
      this._fpvWindSrc = this.ctx.createBufferSource();
      this._fpvWindSrc.buffer = this.createNoiseBuffer(10);
      this._fpvWindSrc.loop = true;
      this._fpvWindFilter = this.ctx.createBiquadFilter();
      this._fpvWindFilter.type = 'highpass';
      this._fpvWindFilter.frequency.value = 1500;
      this._fpvWindGain = this.ctx.createGain();
      this._fpvWindGain.gain.value = 0.02;
      this._fpvWindSrc.connect(this._fpvWindFilter);
      this._fpvWindFilter.connect(this._fpvWindGain);
      this._fpvWindGain.connect(this.masterGain);
      this._fpvWindSrc.start(now);
    } catch (e) {}
  }

  updateFpvMotorSound(speedRatio = 0.5, boost = false) {
    if (!this._fpvMotorOsc || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const targetFreq = 170 + speedRatio * 350 + (boost ? 160 : 0);
      const targetGain = 0.04 + speedRatio * 0.07 + (boost ? 0.04 : 0);
      this._fpvMotors.forEach(osc => {
        osc.frequency.setTargetAtTime(targetFreq, now, 0.05);
      });
      this._fpvMotorGain.gain.setTargetAtTime(Math.min(0.18, targetGain), now, 0.05);
      // Wind increases with speed
      if (this._fpvWindGain) {
        this._fpvWindGain.gain.setTargetAtTime(0.01 + speedRatio * 0.04, now, 0.1);
      }
    } catch (e) {}
  }

  stopFpvMotorSound() {
    if (this._fpvMotorOsc) {
      try {
        const now = this.ctx.currentTime;
        this._fpvMotorGain.gain.setTargetAtTime(0.001, now, 0.1);
        if (this._fpvWindGain) this._fpvWindGain.gain.setTargetAtTime(0.001, now, 0.1);
        setTimeout(() => {
          if (this._fpvMotors) {
            this._fpvMotors.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch(e) {} });
            this._fpvMotors = [];
          }
          if (this._fpvWindSrc) { try { this._fpvWindSrc.stop(); this._fpvWindSrc.disconnect(); } catch(e) {} }
          this._fpvMotorOsc = null;
          this._fpvMotorGain = null;
          this._fpvMotorFilter = null;
          this._fpvWindSrc = null;
          this._fpvWindGain = null;
          this._fpvWindFilter = null;
        }, 200);
      } catch (e) {
        this._fpvMotorOsc = null;
      }
    }
  }

  playCiwsBurst() {
    this.init();
    const now = this.ctx.currentTime;

    // Rapid-fire 6-round burst — distorted noise impulses
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.035;
      const { source: n, filter: f } = this._filteredNoise('bandpass', 1800 + Math.random() * 400, 4, 0.03);
      const g = this.ctx.createGain();
      const dist = this._makeDistortion(25);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      f.connect(dist);
      dist.connect(g);
      g.connect(this.masterGain);
      n.start(t);
      n.stop(t + 0.03);

      // Sub kick per shot
      const sub = this.ctx.createOscillator();
      const sg = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(160, t);
      sub.frequency.exponentialRampToValueAtTime(50, t + 0.03);
      sg.gain.setValueAtTime(0.15, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      sub.connect(sg);
      sg.connect(this.masterGain);
      sub.start(t);
      sub.stop(t + 0.04);
    }
  }

  playGlitchStatic() {
    this.init();
    const now = this.ctx.currentTime;

    const { source: n, filter: f } = this._filteredNoise('bandpass', 2400, 5, 0.25);
    const dist = this._makeDistortion(35);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    f.connect(dist);
    dist.connect(g);
    g.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.25);
  }

  // =========================================================================
  // NEW: RECONNAISSANCE MODE SOUNDS
  // =========================================================================
  playReconScan() {
    this.init();
    const now = this.ctx.currentTime;

    // Scanning sweep tone
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(2400, now + 0.5);
    osc.frequency.linearRampToValueAtTime(600, now + 1.0);
    g.gain.setValueAtTime(0.08, now);
    g.gain.setValueAtTime(0.08, now + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  playTargetFound() {
    this.init();
    const now = this.ctx.currentTime;

    // Triple confirmation beep
    [0, 0.1, 0.2].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1800;
      g.gain.setValueAtTime(0.15, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  playPhotoCaptured() {
    this.init();
    const now = this.ctx.currentTime;

    // Camera shutter — click + mechanical noise
    const { source: n, filter: f } = this._filteredNoise('highpass', 3000, 2, 0.03);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    f.connect(g);
    g.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.03);

    // Second curtain
    const { source: n2, filter: f2 } = this._filteredNoise('bandpass', 2000, 3, 0.03);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.15, now + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    f2.connect(g2);
    g2.connect(this.masterGain);
    n2.start(now + 0.04);
    n2.stop(now + 0.07);
  }

  // =========================================================================
  // NEW: WATER & ENVIRONMENT SOUNDS
  // =========================================================================
  playWaterSplash() {
    this.init();
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(0.4);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, now);
    bp.frequency.exponentialRampToValueAtTime(300, now + 0.35);
    bp.Q.value = 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.4);
  }

  playHullImpact() {
    this.init();
    const now = this.ctx.currentTime;

    // Metal hull hit
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const sat = this._makeSaturation(3.0);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(sat);
    sat.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);

    // Impact noise
    const { source: n, filter: f } = this._filteredNoise('lowpass', 800, 2, 0.08);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.3, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    f.connect(ng);
    ng.connect(this.masterGain);
    n.start(now);
    n.stop(now + 0.08);
  }

  // =========================================================================
  // NEW: REW Hack Minigame sounds
  // =========================================================================
  playRewScanPulse() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.linearRampToValueAtTime(3000, now + 0.15);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playRewSuccess() {
    this.init();
    const now = this.ctx.currentTime;
    [660, 880].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      const t = now + i * 0.08;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  playRewFail() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // =========================================================================
  // ADVANCED TACTICAL AUDIO (Sonar, VSA, ROV, AI Lock, Shallow Alert)
  // =========================================================================
  playSonarPing() {
    this.init();
    const now = this.ctx.currentTime;
    // Primary resonant hydroacoustic chirp (downward/upward chirped sine)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 4.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.9);

    // Deep water echo reverberation
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(420, now + 0.05);
    subOsc.frequency.exponentialRampToValueAtTime(320, now + 0.7);
    subGain.gain.setValueAtTime(0.12, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now + 0.05);
    subOsc.stop(now + 0.75);
  }

  playShallowWaterAlarm() {
    this.init();
    const now = this.ctx.currentTime;
    // Dual emergency warning beep (Naval echo sounder collision alarm)
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + i * 0.12);
      gain.gain.setValueAtTime(0.12, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.09);
    }
  }

  playVsaToggle(enabled) {
    this.init();
    const now = this.ctx.currentTime;
    // Heavy mechanical relay switch + tactical servo confirm
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = enabled ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(enabled ? 480 : 320, now);
    osc.frequency.linearRampToValueAtTime(enabled ? 960 : 180, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playWaterDrift() {
    this.init();
    const now = this.ctx.currentTime;
    const buf = this._createBrownNoiseBuffer(0.35);
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    src.buffer = buf;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.15);
    filter.Q.value = 2.0;

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.36);
  }

  playRovThruster() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.2);

    filter.type = 'lowpass';
    filter.frequency.value = 400;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playSiphonLock() {
    this.init();
    const now = this.ctx.currentTime;
    // Harmonic locking chord
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + idx * 0.04;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  playAiLockEngaged() {
    this.init();
    const now = this.ctx.currentTime;
    // High-tech AI optical lock target beep (triplet)
    [1200, 1600, 2400].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + idx * 0.05;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.07);
    });
  }
}

window.tacticalAudio = new TacticalAudioEngine();

