// =========================================================================
// BARRACUDA GAME CORE — FULL TACTICAL MILITARY SIMULATOR v7
// (Multi-Phase FPV, Enhanced SIGINT, Random Events, Achievements, Save)
// =========================================================================

const DOSSIER_LORE = [
  {
    stage: 0, threshold: 0.0,
    title: "TOP-SECRET DOSSIER // DEPLOYMENT",
    timestamp: "03:14:22Z // BLACK SEA SECTOR 4",
    text: "Автономный надводный дрон «БАРРАКУДА» развёрнут под штормовым прикрытием. Задача: проникнуть сквозь радарный купол противника и перехватить боевые журналы."
  },
  {
    stage: 1, threshold: 25.0,
    title: "INTERCEPT // ENEMY RADAR 142.85 MHz",
    timestamp: "03:18:05Z // SIGINT RECORDING",
    text: "Береговой радар противника фиксирует быструю цель со скоростью 44 узла. Карбоновый стелс-корпус рассеивает отражение. Оптический сканер в режиме поиска."
  },
  {
    stage: 2, threshold: 50.0,
    title: "DECRYPT // NAVAL SATELLITE UPLINK",
    timestamp: "03:22:40Z // CIPHER KEY: ARES-9",
    text: "Идёт дешифровка спутникового канала ударной группы. Перехвачены координаты патрульного корвета. Буфер телеметрии заполняется на 50%."
  },
  {
    stage: 3, threshold: 75.0,
    title: "CRITICAL // WARSHIP TARGET VECTOR",
    timestamp: "03:27:12Z // FLIR THERMAL LOCK",
    text: "Корвет класса «Адмирал» обнаружен на дистанции 6.8 км. Пусковые стапели готовы к развёртыванию ударных FPV-дронов."
  },
  {
    stage: 4, threshold: 100.0,
    title: "AUTHORIZED // KINETIC STRIKE PROTOCOL",
    timestamp: "03:31:00Z // WAR ROOM OVERRIDE",
    text: "Буфер на 100% мощности. Санкция на удар получена. Запустите FPV-штурм, преодолейте эшелон ПВО и нанесите точечный кинетический удар!"
  }
];

const SECTOR_INFO = {
  'sector-1': { name: 'О. ЗМЕИНЫЙ', mult: 1.0, weather: 'storm' },
  'sector-2': { name: 'СЕВАСТОПОЛЬ', mult: 1.8, weather: 'night' },
  'sector-3': { name: 'НОВОРОССИЙСК', mult: 2.5, weather: 'sunset' },
  'sector-4': { name: 'КЕРЧЬ', mult: 3.2, weather: 'dawn' }
};

// =========================================================================
// ACHIEVEMENTS DEFINITION
// =========================================================================
const ACHIEVEMENTS_DEF = [
  { id: 'first_click', name: 'ПЕРВЫЙ КОНТАКТ', desc: 'Совершите первый клик по дрону', icon: '👆' },
  { id: 'first_assault', name: 'КРЕЩЕНИЕ ОГНЁМ', desc: 'Завершите первый FPV-штурм', icon: '🚀' },
  { id: 'first_prestige', name: 'ЭЛИТНЫЙ ЧЕРТЁЖ', desc: 'Получите первый чертёж престижа', icon: '📐' },
  { id: 'crit_master', name: 'СНАЙПЕР', desc: 'Нанесите 50 критических ударов', icon: '🎯' },
  { id: 'millionaire', name: 'ВОЕННЫЙ МАГНАТ', desc: 'Накопите 100,000 кредитов', icon: '💰' },
  { id: 'data_hoarder', name: 'ПЕРЕХВАТЧИК', desc: 'Соберите 10,000 МБ суммарно', icon: '📡' },
  { id: 'fleet_admiral', name: 'АДМИРАЛ ФЛОТА', desc: 'Потопите 10 кораблей', icon: '⚓' },
  { id: 'perfect_launch', name: 'ИДЕАЛЬНЫЙ СТАРТ', desc: 'Совершите идеальный запуск FPV', icon: '✨' },
  { id: 'rank_s', name: 'РАНГ S', desc: 'Получите рейтинг S в штурме', icon: '🏆' },
  { id: 'hacker', name: 'КИБЕРВЗЛОМЩИК', desc: 'Взломайте 10 радиоканалов', icon: '💻' },
  { id: 'all_sectors', name: 'КАРТОГРАФ', desc: 'Посетите все 4 сектора', icon: '🗺️' },
  { id: 'overclock_5', name: 'ФОРСАЖ', desc: 'Используйте разгон 5 раз', icon: '⚡' },
  { id: 'survivor', name: 'ЖИВУЧИЙ', desc: 'Выживите 3 раза после потери жизни в FPV', icon: '🛡️' },
  { id: 'no_damage', name: 'ФАНТОМ', desc: 'Пройдите FPV-штурм без урона', icon: '👻' },
  { id: 'speed_demon', name: 'ДЕМОН СКОРОСТИ', desc: 'Завершите штурм менее чем за 10 секунд', icon: '⏱️' }
];

// =========================================================================
// RANDOM EVENTS DEFINITION
// =========================================================================
const RANDOM_EVENTS = [
  {
    id: 'patrol',
    name: '⚠️ ВРАЖЕСКИЙ ПАТРУЛЬ',
    desc: 'Обнаружен вражеский катер! Кликните 20 раз за 12 секунд или потеряете 30% данных!',
    type: 'click_challenge',
    duration: 12,
    requirement: 20,
    penalty: 0.3,
    reward: { mb: 25, usd: 2000 }
  },
  {
    id: 'cable',
    name: '📡 ПОДВОДНЫЙ КАБЕЛЬ',
    desc: 'Обнаружен незащищённый подводный кабель связи! Бесплатные разведданные!',
    type: 'bonus',
    reward: { mb: 60, usd: 3000 }
  },
  {
    id: 'emp_storm',
    name: '⚡ ЭМ-ПОМЕХА',
    desc: 'Электромагнитный шторм! Пассив отключён на 8с, затем x3 на 5с!',
    type: 'emp',
    downDuration: 8,
    boostDuration: 5,
    boostMultiplier: 3
  },
  {
    id: 'recon',
    name: '✈️ РАЗВЕДСАМОЛЁТ',
    desc: 'Вражеский самолёт-разведчик! Нажмите кнопку за 6 секунд!',
    type: 'quick_action',
    duration: 6,
    penalty: { mb: -20, usd: -1500 },
    reward: { mb: 40, usd: 5000 }
  },
  {
    id: 'supply_drop',
    name: '📦 СБРОС СНАБЖЕНИЯ',
    desc: 'Союзный вертолёт сбрасывает запас разведданных!',
    type: 'bonus',
    reward: { mb: 35, usd: 8000 }
  }
];

// ==============================================
// FPV DRONE MULTI-PHASE MINIGAME ENGINE v2
// ==============================================
class FPVMinigame {
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

    // Difficulty multiplier (increases with prestige)
    this.difficultyMod = 1.0;
  }

  setDifficulty(prestigeLevel, armorLevel) {
    this.difficultyMod = 1.0 + prestigeLevel * 0.15;
    this.maxLives = 1 + Math.min(2, Math.floor(armorLevel / 2));
    this.lives = this.maxLives;
    this.requiredPass = Math.min(8, 5 + Math.floor(prestigeLevel / 2));
  }

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.active = true;
    this.phase = 'launch';
    this.phaseTimer = 0;
    this.totalTime = 0;

    const W = canvas.width;
    const H = canvas.height;

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
        this.crosshair.x = (clientX - rect.left) * (this.canvas.width / rect.width);
        this.crosshair.y = (clientY - rect.top) * (this.canvas.height / rect.height);
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
    const W = this.canvas.width;
    const H = this.canvas.height;
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

  // =========================================================================
  // DRAW — Cinematic Multi-Phase Rendering
  // =========================================================================
  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

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
      // Static noise overlay
      if (this.staticNoise > 0) {
        const imageData = ctx.getImageData(0, 0, W, H);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 16) {
          const noise = (Math.random() - 0.5) * 100 * this.staticNoise;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
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

// ==============================================
// MAIN BARRACUDA GAME CLASS v7
// ==============================================
class BarracudaGame {
  constructor() {
    this.dataMB = 0.0;
    this.totalDataMB = 0.0;
    this.maxCapacityMB = 100.0;
    this.creditsUSD = 500;
    this.blueprintsBP = 0;
    this.sunkenShips = 0;
    this.totalClicks = 0;
    this.totalCrits = 0;
    this.totalHacks = 0;
    this.overclockUses = 0;
    this.visitedSectors = new Set(['sector-1']);
    this.shieldSaves = 0;

    this.currentSector = 'sector-1';

    this.hw = { satcom: 0, optics: 0, armor: 0, waterjets: 0, missiles: 0 };
    this.cyber = { sniffer: 0, quantum: 0, autosiphon: 0 };
    this.tech = { swarmAI: false };

    this.isOverclocked = false;
    this.overclockTimer = 0;
    this.overclockCooldown = 0;

    // Dynamic contracts
    this.contractPool = this.generateContracts();
    this.activeContracts = this.contractPool.slice(0, 3);
    this.contractGenCounter = 0;

    this.currentDossierStage = 0;
    this.dossierHasUnread = false;
    this.typewriterTimer = null;

    // SIGINT Spectrum Hack — enhanced
    this.targetFreq = 142.5;
    this.targetAmp = 1.2;
    this.currentFreq = 100.0;
    this.currentAmp = 0.5;
    this.cyberHackTimer = 30;
    this.cyberHackActive = false;
    this.cyberInterferenceTimer = 0;
    this.cyberInterferenceActive = false;
    this.cyberComboChannel = 0;

    this.fpvGame = new FPVMinigame();
    this.minigameActive = false;
    this.lastAssaultRating = '';
    this.lastAssaultNoDamage = false;
    this.lastAssaultPerfectLaunch = false;
    this.lastAssaultSpeedDemon = false;

    // Random events
    this.eventTimer = 15 + Math.random() * 30;
    this.activeEvent = null;
    this.eventClickCount = 0;
    this.eventCountdown = 0;
    this.empState = null; // { phase: 'down'|'boost', timer: 0 }

    // Achievements
    this.unlockedAchievements = new Set();
    this.achievementQueue = [];

    // Notification queue
    this.notifications = [];

    this.loadGame();
    this.init3D();
    this.initDOM();
    this.initEvents();
    this.startLoop();
    this.updateDossier(DOSSIER_LORE[0], false);
    this.updateUI();

    // Auto-show help for first-time players
    if (!localStorage.getItem('barracuda_help_seen')) {
      setTimeout(() => {
        if (this.helpModal) this.helpModal.classList.add('active');
        localStorage.setItem('barracuda_help_seen', '1');
      }, 1500);
    }
  }

  // =========================================================================
  // DYNAMIC CONTRACT GENERATION
  // =========================================================================
  generateContracts() {
    const templates = [
      { base: 'ПОДВОДНЫЙ КАБЕЛЬ', costMB: 30, costUSD: 0, rewardUSD: 1500, rewardMB: 80, duration: 6 },
      { base: 'РАДАРНАЯ ЛОВУШКА', costMB: 150, costUSD: 500, rewardUSD: 6000, rewardMB: 300, duration: 12 },
      { base: 'КОНВОЙ СНАБЖЕНИЯ', costMB: 80, costUSD: 1000, rewardUSD: 8000, rewardMB: 200, duration: 8 },
      { base: 'ПЕРЕХВАТ СПУТНИКА', costMB: 200, costUSD: 2000, rewardUSD: 15000, rewardMB: 500, duration: 15 },
      { base: 'ДЕСАНТНАЯ ОПЕРАЦИЯ', costMB: 120, costUSD: 1500, rewardUSD: 10000, rewardMB: 350, duration: 10 },
      { base: 'МИННОЕ ЗАГРАЖДЕНИЕ', costMB: 60, costUSD: 300, rewardUSD: 4000, rewardMB: 150, duration: 7 },
    ];

    const scale = 1 + this.contractGenCounter * 0.3;
    const contracts = [];
    const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 3);

    shuffled.forEach((t, i) => {
      contracts.push({
        id: `c${this.contractGenCounter * 10 + i}`,
        name: `ОП: ${t.base}`,
        costMB: Math.floor(t.costMB * scale),
        costUSD: Math.floor(t.costUSD * scale),
        rewardUSD: Math.floor(t.rewardUSD * scale),
        rewardMB: Math.floor(t.rewardMB * scale),
        rewardBP: 0,
        progress: 0,
        duration: t.duration,
        active: false,
        completed: false
      });
    });

    return contracts;
  }

  refreshContracts() {
    const allDone = this.activeContracts.every(c => c.completed);
    if (allDone) {
      this.contractGenCounter++;
      this.activeContracts = this.generateContracts();
      this.rebuildContractDOM();
      this.addNotification('📜 НОВЫЕ КОНТРАКТЫ', 'Доступны новые спецоперации!');
    }
  }

  // =========================================================================
  // SAVE / LOAD (localStorage)
  // =========================================================================
  saveGame() {
    try {
      const data = {
        dataMB: this.dataMB,
        totalDataMB: this.totalDataMB,
        maxCapacityMB: this.maxCapacityMB,
        creditsUSD: this.creditsUSD,
        blueprintsBP: this.blueprintsBP,
        sunkenShips: this.sunkenShips,
        totalClicks: this.totalClicks,
        totalCrits: this.totalCrits,
        totalHacks: this.totalHacks,
        overclockUses: this.overclockUses,
        visitedSectors: [...this.visitedSectors],
        shieldSaves: this.shieldSaves,
        currentSector: this.currentSector,
        hw: this.hw,
        cyber: this.cyber,
        tech: this.tech,
        contractGenCounter: this.contractGenCounter,
        currentDossierStage: this.currentDossierStage,
        unlockedAchievements: [...this.unlockedAchievements],
        savedAt: Date.now()
      };
      localStorage.setItem('barracuda_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('barracuda_save');
      if (!raw) return;
      const data = JSON.parse(raw);

      this.dataMB = data.dataMB || 0;
      this.totalDataMB = data.totalDataMB || 0;
      this.maxCapacityMB = data.maxCapacityMB || 100;
      this.creditsUSD = data.creditsUSD || 500;
      this.blueprintsBP = data.blueprintsBP || 0;
      this.sunkenShips = data.sunkenShips || 0;
      this.totalClicks = data.totalClicks || 0;
      this.totalCrits = data.totalCrits || 0;
      this.totalHacks = data.totalHacks || 0;
      this.overclockUses = data.overclockUses || 0;
      this.visitedSectors = new Set(data.visitedSectors || ['sector-1']);
      this.shieldSaves = data.shieldSaves || 0;
      this.currentSector = data.currentSector || 'sector-1';
      this.hw = data.hw || this.hw;
      this.cyber = data.cyber || this.cyber;
      this.tech = data.tech || this.tech;
      this.contractGenCounter = data.contractGenCounter || 0;
      this.currentDossierStage = data.currentDossierStage || 0;
      this.unlockedAchievements = new Set(data.unlockedAchievements || []);

      // Regenerate contracts for current tier
      this.activeContracts = this.generateContracts();
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  // =========================================================================
  // ACHIEVEMENTS
  // =========================================================================
  checkAchievement(id) {
    if (this.unlockedAchievements.has(id)) return;
    const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (!def) return;

    this.unlockedAchievements.add(id);
    this.addNotification(`${def.icon} ДОСТИЖЕНИЕ`, def.name);
    window.tacticalAudio.playAchievementUnlock();
    this.saveGame();
  }

  checkAllAchievements() {
    if (this.totalClicks >= 1) this.checkAchievement('first_click');
    if (this.totalCrits >= 50) this.checkAchievement('crit_master');
    if (this.creditsUSD >= 100000) this.checkAchievement('millionaire');
    if (this.totalDataMB >= 10000) this.checkAchievement('data_hoarder');
    if (this.sunkenShips >= 10) this.checkAchievement('fleet_admiral');
    if (this.totalHacks >= 10) this.checkAchievement('hacker');
    if (this.visitedSectors.size >= 4) this.checkAchievement('all_sectors');
    if (this.overclockUses >= 5) this.checkAchievement('overclock_5');
    if (this.shieldSaves >= 3) this.checkAchievement('survivor');
  }

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  addNotification(title, text) {
    const notif = { title, text, timer: 4.0, id: Date.now() + Math.random() };
    this.notifications.push(notif);
    this.renderNotifications();
  }

  renderNotifications() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }

    // Only add newest one
    const latest = this.notifications[this.notifications.length - 1];
    if (!latest) return;

    const el = document.createElement('div');
    el.className = 'tactical-notification';
    el.innerHTML = `<div class="notif-title">${latest.title}</div><div class="notif-text">${latest.text}</div>`;
    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => el.classList.add('show'));

    // Auto remove
    setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => el.remove(), 400);
    }, 4000);
  }

  // =========================================================================
  // RANDOM EVENTS
  // =========================================================================
  updateRandomEvents(dt) {
    if (this.minigameActive) return;

    this.eventTimer -= dt;
    if (this.eventTimer <= 0 && !this.activeEvent) {
      this.eventTimer = 30 + Math.random() * 45;
      this.triggerRandomEvent();
    }

    // Active event processing
    if (this.activeEvent) {
      this.eventCountdown -= dt;

      if (this.activeEvent.type === 'click_challenge') {
        if (this.eventClickCount >= this.activeEvent.requirement) {
          // Success!
          this.addData(this.activeEvent.reward.mb * this.getGlobalMultiplier());
          this.addCredits(this.activeEvent.reward.usd * this.getGlobalMultiplier());
          this.addNotification('✅ ПАТРУЛЬ ОТБИТ', `+${this.activeEvent.reward.mb} МБ, +$${this.activeEvent.reward.usd}`);
          this.clearActiveEvent();
          return;
        }
        if (this.eventCountdown <= 0) {
          // Failed — penalty
          this.dataMB = Math.max(0, this.dataMB * (1 - this.activeEvent.penalty));
          this.addNotification('❌ ДАННЫЕ ПЕРЕХВАЧЕНЫ', `Потеряно ${Math.floor(this.activeEvent.penalty * 100)}% данных!`);
          this.clearActiveEvent();
          return;
        }
      }

      if (this.activeEvent.type === 'quick_action') {
        if (this.eventCountdown <= 0) {
          this.dataMB = Math.max(0, this.dataMB + this.activeEvent.penalty.mb);
          this.creditsUSD = Math.max(0, this.creditsUSD + this.activeEvent.penalty.usd);
          this.addNotification('❌ ОБНАРУЖЕНЫ', 'Разведсамолёт зафиксировал координаты!');
          this.clearActiveEvent();
          return;
        }
      }
    }

    // EMP state machine
    if (this.empState) {
      this.empState.timer -= dt;
      if (this.empState.phase === 'down' && this.empState.timer <= 0) {
        this.empState = { phase: 'boost', timer: this.empState.boostDuration || 5 };
        this.addNotification('⚡ РЕЗОНАНС', 'Пассивный доход x3 на 5 секунд!');
      } else if (this.empState.phase === 'boost' && this.empState.timer <= 0) {
        this.empState = null;
      }
    }
  }

  triggerRandomEvent() {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    window.tacticalAudio.playEventAlert();

    if (event.type === 'bonus') {
      this.addData(event.reward.mb * this.getGlobalMultiplier());
      this.addCredits(event.reward.usd * this.getGlobalMultiplier());
      this.addNotification(event.name, `${event.desc} +${event.reward.mb} МБ, +$${event.reward.usd}`);
      return;
    }

    if (event.type === 'emp') {
      this.empState = { phase: 'down', timer: event.downDuration, boostDuration: event.boostDuration };
      this.addNotification(event.name, event.desc);
      return;
    }

    // Interactive events
    this.activeEvent = { ...event };
    this.eventCountdown = event.duration;
    this.eventClickCount = 0;
    this.showEventBanner();
  }

  clearActiveEvent() {
    this.activeEvent = null;
    const banner = document.getElementById('event-banner');
    if (banner) banner.classList.remove('show');
  }

  handleEventAction() {
    if (!this.activeEvent) return;
    if (this.activeEvent.type === 'quick_action') {
      this.addData(this.activeEvent.reward.mb * this.getGlobalMultiplier());
      this.addCredits(this.activeEvent.reward.usd * this.getGlobalMultiplier());
      this.addNotification('✅ РАЗВЕДЧИК НЕЙТРАЛИЗОВАН', `+${this.activeEvent.reward.mb} МБ, +$${this.activeEvent.reward.usd}`);
      this.clearActiveEvent();
    }
  }

  showEventBanner() {
    let banner = document.getElementById('event-banner');
    if (!banner) return;

    const ev = this.activeEvent;
    document.getElementById('event-banner-title').textContent = ev.name;
    document.getElementById('event-banner-desc').textContent = ev.desc;
    document.getElementById('event-banner-timer').textContent = `${Math.ceil(ev.duration)}с`;

    const actionBtn = document.getElementById('event-banner-action');
    if (ev.type === 'quick_action') {
      actionBtn.style.display = 'block';
      actionBtn.textContent = '🎯 НЕЙТРАЛИЗОВАТЬ';
    } else if (ev.type === 'click_challenge') {
      actionBtn.style.display = 'none';
    }

    banner.classList.add('show');
  }

  updateEventBannerUI() {
    if (!this.activeEvent) return;
    const timerEl = document.getElementById('event-banner-timer');
    if (timerEl) timerEl.textContent = `${Math.max(0, this.eventCountdown).toFixed(1)}с`;

    if (this.activeEvent.type === 'click_challenge') {
      const progEl = document.getElementById('event-banner-progress');
      if (progEl) progEl.textContent = `КЛИКОВ: ${this.eventClickCount} / ${this.activeEvent.requirement}`;
    }
  }

  // =========================================================================
  // ENGINE INIT & MULTIPLIERS
  // =========================================================================
  init3D() {
    this.engine3D = new Barracuda3DEngine('drone-3d-viewport', (x, y) => {
      this.handleClick(x, y);
    });
  }

  getGlobalMultiplier() {
    const sectorMult = SECTOR_INFO[this.currentSector]?.mult || 1.0;
    return (1.0 + this.blueprintsBP * 0.5) * sectorMult;
  }

  getClickPower() {
    let base = 1.0 + (this.hw.satcom * 2.0) + (this.hw.optics * 4.0);
    if (this.isOverclocked) base *= 3.0;
    return base * this.getGlobalMultiplier();
  }

  getClickCashGain() {
    return Math.floor((10 + this.hw.optics * 25 + this.cyber.autosiphon * 50) * this.getGlobalMultiplier());
  }

  getCritChance() {
    return Math.min(0.75, 0.05 + this.hw.optics * 0.08 + this.cyber.quantum * 0.12);
  }

  getPassiveRate() {
    let rate = (this.hw.armor * 1.5) + (this.hw.waterjets * 3.0) + (this.cyber.sniffer * 2.5);
    if (this.tech.swarmAI) rate *= 2.0;
    if (this.isOverclocked) rate *= 2.0;

    // EMP states
    if (this.empState) {
      if (this.empState.phase === 'down') return 0;
      if (this.empState.phase === 'boost') rate *= 3.0;
    }

    return rate * this.getGlobalMultiplier();
  }

  getUSDPassiveRate() {
    let rate = (25 + this.cyber.autosiphon * 75) * this.getGlobalMultiplier();
    if (this.empState && this.empState.phase === 'down') return 0;
    if (this.empState && this.empState.phase === 'boost') rate *= 3.0;
    return rate;
  }

  getHWCost(type) {
    const bases = { satcom: 15, optics: 45, armor: 80, waterjets: 150, missiles: 300 };
    const scales = { satcom: 1.45, optics: 1.5, armor: 1.55, waterjets: 1.6, missiles: 1.7 };
    return Math.floor(bases[type] * Math.pow(scales[type], this.hw[type]));
  }

  getCyberCost(type) {
    const bases = { sniffer: 30, quantum: 100, autosiphon: 200 };
    const scales = { sniffer: 1.5, quantum: 1.65, autosiphon: 1.7 };
    return Math.floor(bases[type] * Math.pow(scales[type], this.cyber[type]));
  }

  // =========================================================================
  // DOM INIT
  // =========================================================================
  initDOM() {
    this.lblBuffer = document.getElementById('val-buffer');
    this.lblCredits = document.getElementById('val-credits');
    this.lblEnergyPercent = document.getElementById('label-energy-percent');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.btnAssault = document.getElementById('btn-assault');
    this.btnDirectMissile = document.getElementById('btn-direct-missile');

    this.lblPassiveUSD = document.getElementById('val-passive-usd');
    this.lblPassive = document.getElementById('val-passive');
    this.lblClick = document.getElementById('val-click');
    this.lblMultiplier = document.getElementById('val-multiplier');
    this.lblTotalData = document.getElementById('val-total-data');
    this.lblSunkenCount = document.getElementById('val-sunken-count');
    this.lblKillsStatus = document.getElementById('val-kills-status');

    this.panelDossier = document.getElementById('panel-dossier');
    this.dossierBody = document.getElementById('dossier-body');
    this.dossierTime = document.getElementById('dossier-timestamp');
    this.btnToggleDossier = document.getElementById('btn-toggle-dossier');
    this.btnCloseDossier = document.getElementById('btn-close-dossier');
    this.dossierBeacon = document.getElementById('dossier-unread-beacon');

    this.boosterWidget = document.getElementById('booster-widget');
    this.btnOverclock = document.getElementById('btn-overclock');
    this.boosterStatusTitle = document.getElementById('booster-status-title');
    this.boosterStatusSub = document.getElementById('booster-status-sub');

    this.flirOverlay = document.getElementById('flir-thermal-overlay');
    this.btnOpenFlir = document.getElementById('btn-open-flir');
    this.btnExitFlir = document.getElementById('btn-exit-flir');

    this.mapModal = document.getElementById('map-modal');
    this.btnOpenMap = document.getElementById('btn-open-map');
    this.btnCloseMap = document.getElementById('btn-close-map');
    this.lblCurrentSector = document.getElementById('label-current-sector');

    this.cyberModal = document.getElementById('cyber-modal');
    this.btnOpenCyber = document.getElementById('btn-open-cyber');
    this.btnCloseCyber = document.getElementById('btn-close-cyber');
    this.cyberCanvas = document.getElementById('cyber-wave-canvas');
    this.cyberSliderFreq = document.getElementById('cyber-slider-freq');
    this.cyberSliderAmp = document.getElementById('cyber-slider-amp');
    this.cyberFreqVal = document.getElementById('cyber-freq-val');
    this.cyberAmpVal = document.getElementById('cyber-amp-val');
    this.cyberMatchStatus = document.getElementById('cyber-match-status');
    this.btnCyberSubmit = document.getElementById('btn-cyber-submit');
    this.cyberTimerLabel = document.getElementById('cyber-timer-label');

    this.assaultModal = document.getElementById('assault-modal');
    this.modalTimer = document.getElementById('modal-timer');
    this.lockBarFill = document.getElementById('lock-bar-fill');
    this.lockStatusLabel = document.getElementById('lock-status-label');
    this.screenFlash = document.getElementById('screen-flash');
    this.fpvCanvas = document.getElementById('fpv-canvas');

    // Help modal
    this.helpModal = document.getElementById('help-modal');
    this.btnOpenHelp = document.getElementById('btn-open-help');
    this.btnCloseHelp = document.getElementById('btn-close-help');
  }

  // =========================================================================
  // EVENT BINDING
  // =========================================================================
  initEvents() {
    // Ring Buttons
    document.querySelectorAll('.ring-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetPanelId = btn.getAttribute('data-panel');
        const targetPanel = document.getElementById(targetPanelId);
        const wasActive = targetPanel && targetPanel.classList.contains('active');

        document.querySelectorAll('.concept-slide-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.ring-action-btn').forEach(b => b.classList.remove('active'));

        if (!wasActive && targetPanel) {
          targetPanel.classList.add('active');
          btn.classList.add('active');
        }
      });
    });

    document.querySelectorAll('.btn-close-panel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.concept-slide-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.ring-action-btn').forEach(b => b.classList.remove('active'));
      });
    });

    // Dossier Toggle
    if (this.btnToggleDossier) {
      this.btnToggleDossier.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.panelDossier) {
          const isCollapsed = this.panelDossier.classList.contains('collapsed');
          if (isCollapsed) {
            this.panelDossier.classList.remove('collapsed');
            this.btnToggleDossier.classList.add('active');
            this.dossierHasUnread = false;
            if (this.dossierBeacon) this.dossierBeacon.style.display = 'none';
          } else {
            this.panelDossier.classList.add('collapsed');
            this.btnToggleDossier.classList.remove('active');
          }
        }
      });
    }

    if (this.btnCloseDossier) {
      this.btnCloseDossier.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.panelDossier) {
          this.panelDossier.classList.add('collapsed');
          if (this.btnToggleDossier) this.btnToggleDossier.classList.remove('active');
        }
      });
    }

    // FLIR Thermal Recon Mode
    if (this.btnOpenFlir) {
      this.btnOpenFlir.addEventListener('click', () => {
        window.tacticalAudio.playThermalModeSfx();
        this.flirOverlay.classList.add('active');
        if (this.engine3D) this.engine3D.cameraMode = 'flir';
      });
    }

    // Help Modal
    if (this.btnOpenHelp) {
      this.btnOpenHelp.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.classList.add('active');
      });
    }
    if (this.btnCloseHelp) {
      this.btnCloseHelp.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.classList.remove('active');
      });
    }
    if (this.helpModal) {
      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) this.helpModal.classList.remove('active');
      });
    }

    if (this.btnExitFlir) {
      this.btnExitFlir.addEventListener('click', () => {
        this.flirOverlay.classList.remove('active');
        if (this.engine3D) this.engine3D.cameraMode = 'orbit';
      });
    }

    document.querySelectorAll('.flir-lock-point').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetType = btn.getAttribute('data-target');
        let multiplier = 4;
        if (targetType === 'ammo') multiplier = 8;
        if (targetType === 'bridge') multiplier = 5;

        this.fireMissileSalvo(multiplier);
        this.flirOverlay.classList.remove('active');
        if (this.engine3D) this.engine3D.cameraMode = 'orbit';
      });
    });

    // Direct 3D Missile Fire
    if (this.btnDirectMissile) {
      this.btnDirectMissile.addEventListener('click', () => {
        this.fireMissileSalvo(3);
      });
    }

    // Sector Map
    if (this.btnOpenMap) {
      this.btnOpenMap.addEventListener('click', () => {
        this.mapModal.classList.add('active');
        window.tacticalAudio.playRadioSquelch();
      });
    }
    if (this.btnCloseMap) {
      this.btnCloseMap.addEventListener('click', () => {
        this.mapModal.classList.remove('active');
      });
    }

    document.querySelectorAll('.sector-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.sector-choice-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.changeSector(card.getAttribute('data-sector'));
      });
    });

    // SIGINT Cyber Hack Modal — Enhanced
    if (this.btnOpenCyber) {
      this.btnOpenCyber.addEventListener('click', () => {
        this.cyberModal.classList.add('active');
        window.tacticalAudio.playSonarPing();
        this.targetFreq = 80 + Math.floor(Math.random() * 140);
        this.targetAmp = +(0.5 + Math.random() * 1.2).toFixed(1);
        this.cyberHackTimer = 30;
        this.cyberHackActive = true;
        this.cyberComboChannel = 0;
        this.cyberInterferenceTimer = 5 + Math.random() * 5;
      });
    }

    if (this.btnCloseCyber) {
      this.btnCloseCyber.addEventListener('click', () => {
        this.cyberModal.classList.remove('active');
        this.cyberHackActive = false;
      });
    }

    if (this.cyberSliderFreq) {
      this.cyberSliderFreq.addEventListener('input', (e) => {
        this.currentFreq = parseFloat(e.target.value);
        if (this.cyberFreqVal) this.cyberFreqVal.textContent = this.currentFreq.toFixed(1);
        this.checkCyberMatch();
      });
    }

    if (this.cyberSliderAmp) {
      this.cyberSliderAmp.addEventListener('input', (e) => {
        this.currentAmp = parseFloat(e.target.value);
        if (this.cyberAmpVal) this.cyberAmpVal.textContent = this.currentAmp.toFixed(1);
        this.checkCyberMatch();
      });
    }

    if (this.btnCyberSubmit) {
      this.btnCyberSubmit.addEventListener('click', () => {
        const match = this.getCyberMatchPercent();
        if (match >= 85) {
          window.tacticalAudio.playCyberHackTone(true);
          const mult = this.getGlobalMultiplier();
          this.creditsUSD += 2000 * mult;
          this.addData(50 * mult);
          this.totalHacks++;
          this.cyberComboChannel++;

          if (this.cyberComboChannel < 3) {
            // Spawn next channel
            this.targetFreq = 80 + Math.floor(Math.random() * 140);
            this.targetAmp = +(0.5 + Math.random() * 1.2).toFixed(1);
            this.cyberHackTimer = Math.max(15, 30 - this.cyberComboChannel * 5);
            this.addNotification('📡 КАНАЛ ВЗЛОМАН', `Combo x${this.cyberComboChannel}! Следующий канал...`);
          } else {
            // All channels hacked — big reward
            this.creditsUSD += 10000 * mult;
            this.addData(150 * mult);
            this.addNotification('🏆 ПОЛНЫЙ ВЗЛОМ', 'Все 3 канала дешифрованы! Мега-бонус!');
            this.cyberModal.classList.remove('active');
            this.cyberHackActive = false;
          }
          this.checkAllAchievements();
          this.updateUI();
        } else {
          window.tacticalAudio.playCyberHackTone(false);
        }
      });
    }

    // Booster
    if (this.btnOverclock) {
      this.btnOverclock.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activateOverclock();
      });
    }

    // Quick Sell
    const sellBtn = document.getElementById('btn-quick-sell');
    if (sellBtn) sellBtn.addEventListener('click', () => this.sellDataForCash());

    // Hardware
    document.querySelectorAll('[data-buy-hw]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.buyHardware(btn.getAttribute('data-buy-hw'));
      });
    });

    // Cyber
    document.querySelectorAll('[data-buy-cyber]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.buyCyber(btn.getAttribute('data-buy-cyber'));
      });
    });

    // Contracts
    document.querySelectorAll('[data-start-contract]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startContract(btn.getAttribute('data-start-contract'));
      });
    });

    // Tech
    document.querySelectorAll('[data-buy-tech]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tech = btn.getAttribute('data-buy-tech');
        const cost = parseInt(btn.getAttribute('data-cost-bp'), 10);
        if (!this.tech[tech] && this.blueprintsBP >= cost) {
          this.blueprintsBP -= cost;
          this.tech[tech] = true;
          window.tacticalAudio.playContractSfx();
          if (this.engine3D) this.engine3D.updateSwarmEscorts(true);
          this.updateUI();
        }
      });
    });

    // Assault
    if (this.btnAssault) {
      this.btnAssault.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dataMB >= this.maxCapacityMB && !this.minigameActive) {
          this.startAssault();
        }
      });
    }

    // TMA Toggle
    const tmaBtn = document.getElementById('btn-toggle-tma');
    if (tmaBtn) {
      tmaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const frame = document.getElementById('game-frame');
        if (frame) frame.classList.toggle('hud-hidden');
      });
    }

    // Event banner action
    const eventActionBtn = document.getElementById('event-banner-action');
    if (eventActionBtn) {
      eventActionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEventAction();
      });
    }

    // Autosave every 30s
    setInterval(() => this.saveGame(), 30000);
  }

  // =========================================================================
  // GAMEPLAY METHODS
  // =========================================================================
  changeSector(sectorId) {
    this.currentSector = sectorId;
    this.visitedSectors.add(sectorId);
    const info = SECTOR_INFO[sectorId];
    if (info && this.lblCurrentSector) {
      this.lblCurrentSector.textContent = info.name;
    }
    if (this.engine3D) {
      this.engine3D.setWeatherSector(sectorId);
    }
    this.mapModal.classList.remove('active');
    this.checkAllAchievements();
    this.updateUI();
  }

  fireMissileSalvo(multiplier = 3) {
    if (this.engine3D) {
      this.engine3D.launchMissileStrike(() => {
        const gainMB = this.getClickPower() * multiplier * 4.0;
        const gainUSD = this.getClickCashGain() * multiplier * 3;
        this.addData(gainMB);
        this.addCredits(gainUSD);
        this.sunkenShips++;
        this.spawnFloatingGain(window.innerWidth / 2, window.innerHeight / 2, gainMB, gainUSD, true);
        this.checkAllAchievements();
        this.updateUI();
      });
    }
  }

  checkCyberMatch() {
    const match = this.getCyberMatchPercent();
    if (this.cyberMatchStatus) {
      this.cyberMatchStatus.textContent = `СОВПАДЕНИЕ: ${match.toFixed(0)}% ${this.cyberComboChannel > 0 ? '// COMBO x' + this.cyberComboChannel : ''}`;
      this.cyberMatchStatus.style.color = match >= 85 ? '#00ff66' : (match >= 50 ? '#ffcc00' : '#ff4444');
    }
  }

  getCyberMatchPercent() {
    const freqDiff = Math.abs(this.currentFreq - this.targetFreq);
    const ampDiff = Math.abs(this.currentAmp - this.targetAmp);
    const freqMatch = Math.max(0, 100 - freqDiff * 2.5);
    const ampMatch = Math.max(0, 100 - ampDiff * 50);
    return (freqMatch * 0.7 + ampMatch * 0.3);
  }

  drawCyberWave(t) {
    if (!this.cyberCanvas) return;
    const ctx = this.cyberCanvas.getContext('2d');
    const W = this.cyberCanvas.width;
    const H = this.cyberCanvas.height;

    ctx.fillStyle = '#05140e';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Interference noise overlay
    if (this.cyberInterferenceActive) {
      ctx.fillStyle = 'rgba(255, 40, 40, 0.06)';
      for (let i = 0; i < 30; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 40, 2);
      }
    }

    // Target Wave (Cyan)
    ctx.strokeStyle = this.cyberInterferenceActive ? '#ff4444' : '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      let y = H / 2 + Math.sin(x * (this.targetFreq / 2500) + t * 4) * (this.targetAmp * 40);
      if (this.cyberInterferenceActive) y += (Math.random() - 0.5) * 15;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Player Wave (Green dashed)
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = H / 2 + Math.sin(x * (this.currentFreq / 2500) + t * 4) * (this.currentAmp * 40);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Timer display on canvas
    if (this.cyberHackActive) {
      ctx.fillStyle = this.cyberHackTimer < 10 ? '#ff4444' : '#ffcc00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ТАЙМЕР: ${Math.ceil(this.cyberHackTimer)}с`, W - 10, 20);

      // Channel indicator
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'left';
      ctx.fillText(`КАНАЛ: ${this.cyberComboChannel + 1} / 3`, 10, 20);
      ctx.textAlign = 'left';
    }
  }

  handleClick(x, y) {
    let gainMB = this.getClickPower();
    let gainUSD = this.getClickCashGain();
    let isCrit = Math.random() < this.getCritChance();
    this.totalClicks++;

    // Event click challenge
    if (this.activeEvent && this.activeEvent.type === 'click_challenge') {
      this.eventClickCount++;
    }

    if (isCrit) {
      gainMB *= 5.0;
      gainUSD *= 5;
      this.totalCrits++;
      window.tacticalAudio.playCritPing();
      this.spawnFloatingGain(x, y, gainMB, gainUSD, true);
    } else {
      window.tacticalAudio.playPing();
      this.spawnFloatingGain(x, y, gainMB, gainUSD, false);
    }

    this.addData(gainMB);
    this.addCredits(gainUSD);
    this.engine3D.triggerClickBounce();
    this.checkAllAchievements();
  }

  spawnFloatingGain(x, y, gainMB, gainUSD, isCrit) {
    const el = document.createElement('div');
    el.className = isCrit ? 'floating-gain crit' : 'floating-gain';
    const mbText = gainMB < 10 ? `+${gainMB.toFixed(1)} МБ` : `+${Math.floor(gainMB)} МБ`;
    el.textContent = isCrit ? `КРИТ! ${mbText} (+$${gainUSD})` : `${mbText} (+$${gainUSD})`;
    el.style.left = `${x + (Math.random() * 30 - 15)}px`;
    el.style.top = `${y - 20}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  addData(amount) {
    this.dataMB = Math.min(this.dataMB + amount, this.maxCapacityMB);
    this.totalDataMB += amount;
    this.checkDossierProgression();
    this.updateUI();
  }

  addCredits(amount) {
    this.creditsUSD += amount;
    this.updateUI();
  }

  sellDataForCash() {
    if (this.dataMB >= 10) {
      this.dataMB -= 10;
      this.creditsUSD += Math.floor(10 * 35 * this.getGlobalMultiplier());
      window.tacticalAudio.playContractSfx();
      this.updateUI();
    }
  }

  buyHardware(type) {
    const cost = this.getHWCost(type);
    if (this.dataMB >= cost) {
      this.dataMB -= cost;
      this.hw[type]++;
      window.tacticalAudio.playMountingSfx();
      if (this.engine3D) {
        this.engine3D.updateUpgrades({ ...this.hw, prestige: this.blueprintsBP });
        this.engine3D.addModule(type);
      }
      this.saveGame();
      this.updateUI();
    }
  }

  buyCyber(type) {
    const cost = this.getCyberCost(type);
    if (this.dataMB >= cost) {
      this.dataMB -= cost;
      this.cyber[type]++;
      window.tacticalAudio.playMountingSfx();
      if (this.engine3D) this.engine3D.addModule(type);
      this.saveGame();
      this.updateUI();
    }
  }

  startContract(id) {
    const c = this.activeContracts.find(item => item.id === id);
    if (c && !c.active && !c.completed) {
      if (this.dataMB >= c.costMB && this.creditsUSD >= c.costUSD) {
        this.dataMB -= c.costMB;
        this.creditsUSD -= c.costUSD;
        c.active = true;
        c.progress = 0;
        window.tacticalAudio.playMountingSfx();
        this.updateUI();
      }
    }
  }

  activateOverclock() {
    if (!this.isOverclocked && this.overclockCooldown <= 0) {
      this.isOverclocked = true;
      this.overclockTimer = 10.0;
      this.overclockCooldown = 25.0;
      this.overclockUses++;
      window.tacticalAudio.playCritPing();
      this.checkAllAchievements();
      this.updateUI();
    }
  }

  checkDossierProgression() {
    const percent = (this.dataMB / this.maxCapacityMB) * 100.0;
    for (let i = 0; i < DOSSIER_LORE.length; i++) {
      if (percent >= DOSSIER_LORE[i].threshold && this.currentDossierStage <= i) {
        this.currentDossierStage = i + 1;
        this.updateDossier(DOSSIER_LORE[i], true);
      }
    }
  }

  updateDossier(lore, markUnread) {
    if (this.dossierTime) this.dossierTime.textContent = lore.timestamp;
    if (markUnread && this.dossierBeacon) {
      this.dossierHasUnread = true;
      this.dossierBeacon.style.display = 'inline-block';
    }

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    let index = 0;
    const fullText = lore.text;
    if (this.dossierBody) {
      this.dossierBody.textContent = '';
      this.typewriterTimer = setInterval(() => {
        index++;
        this.dossierBody.textContent = fullText.slice(0, index) + '█';
        if (Math.random() > 0.5) window.tacticalAudio.playTypewriter();
        if (index >= fullText.length) {
          this.dossierBody.textContent = fullText;
          clearInterval(this.typewriterTimer);
        }
      }, 20);
    }
  }

  // =========================================================================
  // FPV ASSAULT — Enhanced Multi-Phase
  // =========================================================================
  startAssault() {
    this.minigameActive = true;
    this.assaultModal.classList.add('active');
    this.fpvGame.setDifficulty(this.blueprintsBP, this.hw.armor);
    this.fpvGame.start(this.fpvCanvas);
    window.tacticalAudio.playAlarm();
    this.checkAchievement('first_assault');
  }

  updateMinigame(dt) {
    if (!this.minigameActive) return;

    const result = this.fpvGame.update(dt);
    try { this.fpvGame.draw(); } catch(e) { console.warn('FPV draw error:', e.message); }

    // Update HUD elements
    const progress = Math.min(100, (this.fpvGame.passed / this.fpvGame.requiredPass) * 100);
    if (this.lockBarFill) this.lockBarFill.style.width = `${progress}%`;

    if (this.fpvGame.phase === 'launch') {
      if (this.modalTimer) this.modalTimer.textContent = 'ФАЗА 1: ЗАПУСК ДРОНА';
      if (this.lockStatusLabel) {
        this.lockStatusLabel.textContent = '>>> НАЖМИ [ПРОБЕЛ] В ЗЕЛЁНОЙ ЗОНЕ <<<';
        this.lockStatusLabel.style.color = '#ffcc00';
      }
    } else if (this.fpvGame.phase === 'obstacle') {
      if (this.modalTimer) this.modalTimer.textContent = `ПРОРЫВ ПВО: ${this.fpvGame.passed} / ${this.fpvGame.requiredPass}`;
      if (this.lockStatusLabel) {
        this.lockStatusLabel.textContent = `♥ ${this.fpvGame.lives}/${this.fpvGame.maxLives} // [ПРОБЕЛ] = ВЗЛЁТ`;
        this.lockStatusLabel.style.color = '#00ff66';
      }
    } else if (this.fpvGame.phase === 'strike') {
      if (this.lockBarFill) this.lockBarFill.style.width = '100%';
      const lockPct = Math.floor((this.fpvGame.lockTimer / this.fpvGame.requiredLockTime) * 100);
      if (this.modalTimer) this.modalTimer.textContent = `ЗАХВАТ: ${lockPct}%`;
      if (this.lockStatusLabel) {
        this.lockStatusLabel.textContent = '>>> УДЕРЖИВАЙ ПРИЦЕЛ НА ЦЕЛИ <<<';
        this.lockStatusLabel.style.color = '#ff2a2a';
      }
    } else if (this.fpvGame.phase === 'explosion' || this.fpvGame.phase === 'rating') {
      if (this.modalTimer) this.modalTimer.textContent = this.fpvGame.phase === 'rating' ? `РЕЙТИНГ: ${this.fpvGame.rating}` : 'УДАР!';
    }

    if (result === 'success') {
      this.finishAssault(true);
    } else if (result === 'fail') {
      this.finishAssault(false);
    }
  }

  finishAssault(success) {
    this.minigameActive = false;

    // Track stats from the minigame
    this.lastAssaultRating = this.fpvGame.rating;
    this.lastAssaultNoDamage = this.fpvGame.score.noDamage;
    this.lastAssaultPerfectLaunch = this.fpvGame.score.perfectLaunch;
    this.lastAssaultSpeedDemon = this.fpvGame.totalTime < 10;

    // Track shield saves
    if (!this.fpvGame.score.noDamage && this.fpvGame.lives > 0) {
      this.shieldSaves += (this.fpvGame.maxLives - this.fpvGame.lives);
    }

    this.fpvGame.stop();

    if (success) {
      this.lockStatusLabel.textContent = '💥 КИНЕТИЧЕСКИЙ УДАР ПОДТВЕРЖДЁН!';
      this.lockStatusLabel.style.color = '#ffcc00';

      this.screenFlash.style.opacity = '1';
      setTimeout(() => { this.screenFlash.style.opacity = '0'; }, 600);

      // Rewards scaled by rating
      const ratingMults = { S: 2.0, A: 1.5, B: 1.2, C: 1.0 };
      const rMult = ratingMults[this.lastAssaultRating] || 1.0;

      this.blueprintsBP++;
      this.sunkenShips++;
      this.creditsUSD += Math.floor(15000 * rMult);
      this.dataMB = 0;
      this.maxCapacityMB = Math.floor(100.0 * (1.0 + this.blueprintsBP * 0.35));
      this.currentDossierStage = 0;

      // Bonus data from pickups
      if (this.fpvGame.collectedData > 0) {
        this.totalDataMB += this.fpvGame.collectedData * 15;
      }

      // Check special achievements
      if (this.lastAssaultRating === 'S') this.checkAchievement('rank_s');
      if (this.lastAssaultPerfectLaunch) this.checkAchievement('perfect_launch');
      if (this.lastAssaultNoDamage) this.checkAchievement('no_damage');
      if (this.lastAssaultSpeedDemon) this.checkAchievement('speed_demon');
      this.checkAchievement('first_prestige');

      setTimeout(() => {
        this.assaultModal.classList.remove('active');
        this.updateDossier(DOSSIER_LORE[0], false);
        this.checkAllAchievements();
        this.saveGame();
        this.updateUI();
      }, 3500);
    } else {
      this.lockStatusLabel.textContent = 'FPV-ДРОН УНИЧТОЖЕН // ШТУРМ ПРОВАЛЕН';
      this.lockStatusLabel.style.color = '#ff2a2a';

      setTimeout(() => {
        this.assaultModal.classList.remove('active');
      }, 1500);
    }
  }

  // =========================================================================
  // DYNAMIC CONTRACT DOM REBUILD
  // =========================================================================
  rebuildContractDOM() {
    const panel = document.querySelector('#panel-contracts .upgrade-list-scroll');
    if (!panel) return;

    // Keep the tech card (last child usually)
    const techCard = panel.querySelector('[data-buy-tech]')?.closest('.upgrade-item-card');

    // Remove contract cards
    panel.querySelectorAll('.contract-card-dynamic').forEach(c => c.remove());

    // Add new contracts
    this.activeContracts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'upgrade-item-card contract-card-dynamic';
      card.innerHTML = `
        <div>
          <div class="item-card-title text-cyan">${c.name}</div>
          <div class="item-card-sub text-dim-cyan">+$${c.rewardUSD.toLocaleString()} // +${c.rewardMB} МБ</div>
          <div class="contract-bar-track">
            <div id="prog-contract-${c.id}" class="contract-bar-fill"></div>
          </div>
        </div>
        <button class="btn-buy-action" data-start-contract="${c.id}">СТАРТ</button>
      `;
      if (techCard) panel.insertBefore(card, techCard);
      else panel.appendChild(card);

      // Bind event
      card.querySelector('[data-start-contract]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.startContract(c.id);
      });
    });
  }

  // =========================================================================
  // MAIN GAME LOOP
  // =========================================================================
  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000.0);
      lastTime = now;

      // Overclock timers
      if (this.isOverclocked) {
        this.overclockTimer -= dt;
        if (this.overclockTimer <= 0) this.isOverclocked = false;
      }
      if (this.overclockCooldown > 0) this.overclockCooldown -= dt;

      // Passive income
      const passiveMB = this.getPassiveRate();
      if (passiveMB > 0 && this.dataMB < this.maxCapacityMB && !this.minigameActive) {
        this.addData(passiveMB * dt);
      }

      const passiveUSD = this.getUSDPassiveRate();
      if (passiveUSD > 0) this.addCredits(passiveUSD * dt);

      // Contracts
      this.activeContracts.forEach(c => {
        if (c.active && !c.completed) {
          c.progress += dt;
          if (c.progress >= c.duration) {
            c.completed = true;
            c.active = false;
            this.creditsUSD += c.rewardUSD;
            this.addData(c.rewardMB);
            window.tacticalAudio.playContractSfx();
            this.addNotification('✅ КОНТРАКТ ВЫПОЛНЕН', `${c.name} — +$${c.rewardUSD.toLocaleString()}`);
            this.updateUI();
          }
        }
      });
      this.refreshContracts();

      // SIGINT Cyber Hack timer & interference
      if (this.cyberHackActive) {
        this.cyberHackTimer -= dt;
        if (this.cyberHackTimer <= 0) {
          this.cyberHackActive = false;
          this.cyberModal.classList.remove('active');
          this.addNotification('❌ ВРЕМЯ ВЫШЛО', 'Сигнал потерян! Взлом провален.');
        }

        // Interference bursts
        this.cyberInterferenceTimer -= dt;
        if (this.cyberInterferenceTimer <= 0) {
          this.cyberInterferenceActive = true;
          this.cyberInterferenceTimer = 4 + Math.random() * 6;
          window.tacticalAudio.playCyberInterference();
          setTimeout(() => { this.cyberInterferenceActive = false; }, 1500 + Math.random() * 1500);
        }
      }

      // Random events
      this.updateRandomEvents(dt);
      this.updateEventBannerUI();

      // Minigame
      this.updateMinigame(dt);
      this.drawCyberWave(now / 1000.0);
      this.updateUIElements();
      this.checkAllAchievements();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // =========================================================================
  // UI UPDATE
  // =========================================================================
  updateUI() {
    const percent = (this.dataMB / this.maxCapacityMB) * 100.0;

    if (this.lblBuffer) this.lblBuffer.textContent = `${this.dataMB.toFixed(1)} / ${this.maxCapacityMB.toFixed(0)} МБ`;
    if (this.lblCredits) this.lblCredits.textContent = `$${Math.floor(this.creditsUSD).toLocaleString()}`;
    if (this.lblEnergyPercent) this.lblEnergyPercent.textContent = `${percent.toFixed(0)}%`;
    if (this.progressBarFill) this.progressBarFill.style.width = `${percent}%`;

    if (this.lblPassiveUSD) this.lblPassiveUSD.textContent = `+$${Math.floor(this.getUSDPassiveRate())}/с`;
    if (this.lblPassive) this.lblPassive.textContent = `+${this.getPassiveRate().toFixed(1)} МБ/с`;
    if (this.lblClick) this.lblClick.textContent = `+${this.getClickPower().toFixed(1)} МБ`;
    if (this.lblMultiplier) this.lblMultiplier.textContent = `x${this.getGlobalMultiplier().toFixed(1)} [${this.blueprintsBP} ЧЖ]`;
    if (this.lblTotalData) this.lblTotalData.textContent = `ВСЕГО: ${this.totalDataMB.toFixed(0)} МБ`;

    if (this.lblSunkenCount) this.lblSunkenCount.textContent = `${this.sunkenShips} ВЫМПЕЛОВ`;
    if (this.lblKillsStatus) {
      let rank = 'ОПЕРАТОР БПА';
      if (this.sunkenShips >= 3) rank = 'КОМАНДИР ЗВЕНА';
      if (this.sunkenShips >= 8) rank = 'КОМАНДОР ФЛОТА';
      if (this.sunkenShips >= 15) rank = 'АДМИРАЛ';
      this.lblKillsStatus.textContent = `РАНГ: ${rank}`;
    }

    const isReady = this.dataMB >= this.maxCapacityMB;
    if (this.btnAssault) {
      if (isReady) {
        this.btnAssault.classList.add('ready');
        this.btnAssault.textContent = '>>> ЗАПУСК FPV-ШТУРМА [ГОТОВ] <<<';
      } else {
        this.btnAssault.classList.remove('ready');
        this.btnAssault.textContent = 'ЗАПУСК FPV-ШТУРМА';
      }
    }
  }

  updateUIElements() {
    ['satcom', 'optics', 'armor', 'waterjets', 'missiles'].forEach(k => {
      const cost = this.getHWCost(k);
      const costEl = document.getElementById(`cost-hw-${k}`);
      const tierEl = document.getElementById(`tier-hw-${k}`);
      if (costEl) {
        costEl.textContent = `${cost} МБ`;
        costEl.disabled = this.dataMB < cost;
      }
      if (tierEl) tierEl.textContent = `МК ${this.hw[k] + 1}`;
    });

    ['sniffer', 'quantum', 'autosiphon'].forEach(k => {
      const cost = this.getCyberCost(k);
      const costEl = document.getElementById(`cost-cyber-${k}`);
      const tierEl = document.getElementById(`tier-cyber-${k}`);
      if (costEl) {
        costEl.textContent = `${cost} МБ`;
        costEl.disabled = this.dataMB < cost;
      }
      if (tierEl) tierEl.textContent = `V.${this.cyber[k] + 1}`;
    });

    this.activeContracts.forEach(c => {
      const progBar = document.getElementById(`prog-contract-${c.id}`);
      if (progBar) progBar.style.width = c.completed ? '100%' : `${(c.progress / c.duration) * 100}%`;
    });

    if (this.boosterWidget) {
      if (this.isOverclocked) {
        this.boosterWidget.className = 'booster-floating-widget active';
        if (this.boosterStatusTitle) this.boosterStatusTitle.textContent = `⚡ ${this.overclockTimer.toFixed(1)}с`;
        if (this.boosterStatusSub) this.boosterStatusSub.textContent = '+200% РАЗГОН';
      } else if (this.overclockCooldown > 0) {
        this.boosterWidget.className = 'booster-floating-widget cooldown';
        if (this.boosterStatusTitle) this.boosterStatusTitle.textContent = `КД ${this.overclockCooldown.toFixed(0)}с`;
        if (this.boosterStatusSub) this.boosterStatusSub.textContent = 'ОХЛАЖДЕНИЕ';
      } else {
        this.boosterWidget.className = 'booster-floating-widget';
        if (this.boosterStatusTitle) this.boosterStatusTitle.textContent = 'РАЗГОН +200%';
        if (this.boosterStatusSub) this.boosterStatusSub.textContent = 'ГОТОВ К ЗАПУСКУ';
      }
    }

    // EMP indicator
    if (this.empState) {
      const empEl = document.getElementById('emp-status');
      if (empEl) {
        if (this.empState.phase === 'down') {
          empEl.textContent = `⚡ ЭМ-ПОМЕХА: ${this.empState.timer.toFixed(0)}с`;
          empEl.style.color = '#ff4444';
          empEl.style.display = 'block';
        } else if (this.empState.phase === 'boost') {
          empEl.textContent = `⚡ РЕЗОНАНС x3: ${this.empState.timer.toFixed(0)}с`;
          empEl.style.color = '#00ff66';
          empEl.style.display = 'block';
        }
      }
    } else {
      const empEl = document.getElementById('emp-status');
      if (empEl) empEl.style.display = 'none';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.barracudaGame = new BarracudaGame();
});
