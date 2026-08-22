// =========================================================================
// BARRACUDA — PROCEDURAL TACTICAL AUDIO ENGINE v3
// (Web Audio API — All sounds synthesized, zero external files)
// =========================================================================
class TacticalAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // =========================================================================
  // UTILITY: Create filtered noise buffer
  // =========================================================================
  createNoiseBuffer(duration) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // =========================================================================
  // CORE CLICK SOUNDS
  // =========================================================================
  playPing() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCritPing() {
    this.init();
    const now = this.ctx.currentTime;

    // Layered critical hit: sawtooth sweep + harmonic ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);

    // Harmonic overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3500, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
    gain2.gain.setValueAtTime(0.15, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.2);
  }

  // =========================================================================
  // UPGRADE & PURCHASE SOUNDS
  // =========================================================================
  playMountingSfx() {
    this.init();
    const now = this.ctx.currentTime;

    // Mechanical clank
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // Pneumatic hiss
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15);
    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.value = 4000;
    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.12, now + 0.05);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.masterGain);
    noise.start(now + 0.05);
    noise.stop(now + 0.2);

    // Confirmation tone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.12);
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);
  }

  playContractSfx() {
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.2);
    });
  }

  // =========================================================================
  // DOSSIER TYPEWRITER
  // =========================================================================
  playTypewriter() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(750 + Math.random() * 350, now);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // =========================================================================
  // FLIR THERMAL MODE
  // =========================================================================
  playThermalModeSfx() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(3200, now + 0.18);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // =========================================================================
  // MISSILE LAUNCH — Enhanced with layered roar
  // =========================================================================
  playMissileLaunch() {
    this.init();
    const now = this.ctx.currentTime;

    // Rocket booster roar (filtered noise)
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.8);
    filter.Q.value = 3.0;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 1.8);

    // Ignite whine
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // =========================================================================
  // RADIO SQUELCH
  // =========================================================================
  playRadioSquelch() {
    this.init();
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  // =========================================================================
  // SIGINT CYBER HACK
  // =========================================================================
  playCyberHackTone(success) {
    this.init();
    const now = this.ctx.currentTime;
    const freqs = success ? [440, 554, 659, 880] : [550, 440, 330, 220];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);
      gain.gain.setValueAtTime(0.18, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.15);
    });
  }

  playSonarPing() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.8);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }

  // =========================================================================
  // ALARM SIREN (FPV Assault Start)
  // =========================================================================
  playAlarm() {
    this.init();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now + i * 0.4);
      osc.frequency.linearRampToValueAtTime(880, now + i * 0.4 + 0.2);
      gain.gain.setValueAtTime(0.25, now + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.4);
      osc.stop(now + i * 0.4 + 0.35);
    }
  }

  // =========================================================================
  // EXPLOSION — Enhanced with reverb tail & sub-bass thump
  // =========================================================================
  playExplosion() {
    this.init();
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(60, now);
    subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // Noise burst
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(2.0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(25, now + 1.8);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 2.0);

    // Mid crackle
    const crackle = this.ctx.createBufferSource();
    crackle.buffer = this.createNoiseBuffer(0.8);
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.value = 2500;
    crackFilter.Q.value = 5;
    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.35, now + 0.05);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    crackle.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    crackle.start(now + 0.05);
    crackle.stop(now + 0.8);
  }

  // =========================================================================
  // NEW: FPV MINIGAME SOUNDS
  // =========================================================================

  // PVO flyby whoosh — when drone passes through obstacle gap
  playPVOFlyby() {
    this.init();
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.35);
    filter.Q.value = 2.0;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.35);
  }

  // Radar Warning Receiver — pulsing threat tone
  playRWR() {
    this.init();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(3200, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.04);
    }
  }

  // Countermeasure flare — bright hiss
  playCountermeasure() {
    this.init();
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  // FPV Launch catapult whoosh
  playFPVLaunch() {
    this.init();
    const now = this.ctx.currentTime;

    // Catapult spring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(3000, now + 0.2);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);

    // Motor whine
    const motor = this.ctx.createOscillator();
    const motorGain = this.ctx.createGain();
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(150, now + 0.1);
    motor.frequency.exponentialRampToValueAtTime(1800, now + 0.6);
    motorGain.gain.setValueAtTime(0.2, now + 0.1);
    motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    motor.connect(motorGain);
    motorGain.connect(this.masterGain);
    motor.start(now + 0.1);
    motor.stop(now + 0.7);
  }

  // Perfect launch QTE hit
  playPerfectLaunch() {
    this.init();
    const now = this.ctx.currentTime;
    [1320, 1760, 2640].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);
      gain.gain.setValueAtTime(0.25, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.15);
    });
  }

  // Shield hit (when armor absorbs damage)
  playShieldHit() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3000, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Data pickup sound
  playDataPickup() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Lock-on sustained tone (thermal priming for strike)
  playLockOnTone(isLocked) {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = isLocked ? 2400 : 1200;
    gain.gain.setValueAtTime(isLocked ? 0.15 : 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Phase transition dramatic stinger
  playPhaseTransition() {
    this.init();
    const now = this.ctx.currentTime;

    // Deep impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);

    // Rise tone
    const rise = this.ctx.createOscillator();
    const riseGain = this.ctx.createGain();
    rise.type = 'sawtooth';
    rise.frequency.setValueAtTime(300, now + 0.1);
    rise.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    riseGain.gain.setValueAtTime(0.15, now + 0.1);
    riseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    rise.connect(riseGain);
    riseGain.connect(this.masterGain);
    rise.start(now + 0.1);
    rise.stop(now + 0.5);
  }

  // =========================================================================
  // NEW: RATING REVEAL
  // =========================================================================
  playRatingReveal(rank) {
    this.init();
    const now = this.ctx.currentTime;
    const chords = {
      'S': [880, 1108, 1318, 1760],
      'A': [659, 830, 988, 1318],
      'B': [523, 659, 783, 1046],
      'C': [392, 494, 587, 784]
    };
    const notes = chords[rank] || chords['C'];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = rank === 'S' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  // =========================================================================
  // NEW: ACHIEVEMENT FANFARE
  // =========================================================================
  playAchievementUnlock() {
    this.init();
    const now = this.ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    fanfare.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.09);
      gain.gain.setValueAtTime(0.22, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.3);
    });
  }

  // =========================================================================
  // NEW: EVENT ALERT (Random events)
  // =========================================================================
  playEventAlert() {
    this.init();
    const now = this.ctx.currentTime;

    // Urgent double beep
    [0, 0.15].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1600, now + offset);
      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // =========================================================================
  // NEW: LIGHTNING CRACK
  // =========================================================================
  playThunderCrack() {
    this.init();
    const now = this.ctx.currentTime;

    // Sharp crack
    const crack = this.ctx.createBufferSource();
    crack.buffer = this.createNoiseBuffer(0.15);
    const crackFilter = this.ctx.createBiquadFilter();
    crackFilter.type = 'bandpass';
    crackFilter.frequency.value = 3500;
    crackFilter.Q.value = 3;
    const crackGain = this.ctx.createGain();
    crackGain.gain.setValueAtTime(0.5, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    crack.connect(crackFilter);
    crackFilter.connect(crackGain);
    crackGain.connect(this.masterGain);
    crack.start(now);
    crack.stop(now + 0.15);

    // Rolling thunder
    const thunder = this.ctx.createBufferSource();
    thunder.buffer = this.createNoiseBuffer(2.5);
    const thFilter = this.ctx.createBiquadFilter();
    thFilter.type = 'lowpass';
    thFilter.frequency.setValueAtTime(250, now + 0.15);
    thFilter.frequency.exponentialRampToValueAtTime(60, now + 2.5);
    const thGain = this.ctx.createGain();
    thGain.gain.setValueAtTime(0.01, now + 0.1);
    thGain.gain.linearRampToValueAtTime(0.35, now + 0.4);
    thGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    thunder.connect(thFilter);
    thFilter.connect(thGain);
    thGain.connect(this.masterGain);
    thunder.start(now + 0.1);
    thunder.stop(now + 2.5);
  }

  // =========================================================================
  // NEW: CYBER HACK INTERFERENCE BUZZ
  // =========================================================================
  playCyberInterference() {
    this.init();
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.2);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500 + Math.random() * 2000;
    filter.Q.value = 8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  // =========================================================================
  // NEW: SHOCKWAVE BOOM (Cinematic explosion finish)
  // =========================================================================
  playShockwave() {
    this.init();
    const now = this.ctx.currentTime;

    // Massive sub-bass drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(100, now);
    sub.frequency.exponentialRampToValueAtTime(15, now + 1.0);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 1.2);

    // Wide noise blast
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(1.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(30, now + 1.5);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 1.5);

    // Metallic debris ring
    const debris = this.ctx.createOscillator();
    const debGain = this.ctx.createGain();
    debris.type = 'triangle';
    debris.frequency.setValueAtTime(4500, now + 0.05);
    debris.frequency.exponentialRampToValueAtTime(300, now + 0.8);
    debGain.gain.setValueAtTime(0.2, now + 0.05);
    debGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    debris.connect(debGain);
    debGain.connect(this.masterGain);
    debris.start(now + 0.05);
    debris.stop(now + 0.8);
  }

  // =========================================================================
  // AMBIENT SECTOR SOUNDSCAPES
  // =========================================================================
  startAmbient(sectorId) {
    this.init();
    this.stopAmbient();

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.connect(this.masterGain);
    this._ambientExtras = [];

    // Pure tonal drones — no white noise, no hissing
    const makeDrone = (freq, type, gain, detune) => {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      if (detune) osc.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = gain;
      osc.connect(g);
      g.connect(this.ambientGain);
      osc.start(now);
      this._ambientExtras.push(osc);
    };

    switch (sectorId) {
      case 'sector-1': // Storm — deep ominous rumble
        this.ambientGain.gain.linearRampToValueAtTime(0.06, now + 3.0);
        makeDrone(38, 'sine', 0.5, 0);      // sub-bass
        makeDrone(57, 'sine', 0.25, -8);     // power fifth below
        makeDrone(76, 'triangle', 0.1, 5);   // octave
        break;
      case 'sector-2': // Night — eerie quiet
        this.ambientGain.gain.linearRampToValueAtTime(0.03, now + 3.0);
        makeDrone(55, 'sine', 0.3, 0);       // low A
        makeDrone(78, 'sine', 0.15, -3);     // tritone — unsettling
        break;
      case 'sector-3': // Sunset — warm calm
        this.ambientGain.gain.linearRampToValueAtTime(0.04, now + 3.0);
        makeDrone(65, 'sine', 0.3, 0);       // low C
        makeDrone(82, 'sine', 0.2, 4);       // major third — warm
        makeDrone(98, 'triangle', 0.08, -2); // fifth — open
        break;
      case 'sector-4': // Dawn — gentle ethereal
      default:
        this.ambientGain.gain.linearRampToValueAtTime(0.03, now + 3.0);
        makeDrone(50, 'sine', 0.25, 0);      // low bass
        makeDrone(75, 'sine', 0.15, 6);      // perfect fifth
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
}

window.tacticalAudio = new TacticalAudioEngine();
