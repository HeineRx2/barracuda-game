
function safeAdd(arr, item) {
    if (!arr.includes(item)) {
        arr.push(item);
    }
}

import { DOSSIER_LORE, SECTOR_INFO, ACHIEVEMENTS_DEF, ENEMY_SHIP_CLASSES, getEnemyShipData, DRONE_PROTOTYPES_DEF, SALVAGE_CRAFT_RECIPES, CAMPAIGN_ACTS_DEF, BOSS_SHIPS, shuffleArray, RANDOM_EVENTS, DAILY_QUEST_TEMPLATES } from './data.js';
import { FPVMinigame } from './fpvMinigame.js';
import { store } from './store.js';

class BarracudaGame {
  constructor() {

    // Drone Prototype & Hangar

    // Story Campaign & Mission System
    this.activeMission = null;
    this.missionPhase = 0; // 0: Idle, 1: SIGINT Scan, 2: EW Jam, 3: FPV Strike, 4: Extraction

    // Tactical Radio Comms Terminal
    this.commsActive = false;
    this.commsQueue = [];
    this.commsTypewriterInterval = null;

    // Assault charge — separate progressive counter
    this.assaultCharge = 0;
    this.assaultChargeMax = 500;

    this.currentSector = 'sector-1';


    // Ship HP system
    this.shipHP = 100;
    this.shipMaxHP = 100;

    // Weapon cooldown
    this.weaponCooldown = 0;
    this.weaponCooldownMax = 1.5; // seconds

    // Settings

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
    this.achievementQueue = [];

    // Notification queue
    this.notifications = [];

    // === PERFORMANCE: UI throttle timers ===
    this._uiDirty = true;
    this._uiThrottleAccum = 0;
    this._achieveCheckAccum = 0;

    // === BOSS SHIPS ===
    this.bossActive = false;
    this.currentBoss = null;
    this.bossesDefeated = 0;

    // === DAILY QUESTS ===
    this.dailyQuests = [];
    this.dailyQuestDate = '';
    this.dailyClicks = 0;
    this.dailyDataCollected = 0;
    this.dailyCreditsEarned = 0;
    this.dailyAssaults = 0;
    this.dailyHacks = 0;
    this.dailyCrits = 0;
    this.dailyOverclocks = 0;

    try { store.subscribe(() => { this.updateUI(); this.updateUIElements(); }); } catch(e) { console.error('[INIT] loadGame error:', e); }
    try { this.processOfflineIncome(); } catch(e) { console.error('[INIT] processOfflineIncome error:', e); }
    try { this.initDailyQuests(); } catch(e) { console.error('[INIT] initDailyQuests error:', e); }
    try { this.init3D(); } catch(e) { console.error('[INIT] init3D error:', e); }
    try { this.initDOM(); } catch(e) { console.error('[INIT] initDOM error:', e); }
    try { this.initCampaignAndHangar(); } catch(e) { console.error('[INIT] initCampaignAndHangar error:', e); }
    try { this.initEvents(); } catch(e) { console.error('[INIT] initEvents error:', e); }
    try { this.startLoop(); } catch(e) { console.error('[INIT] startLoop error:', e); }
    try { this.updateDossier(DOSSIER_LORE[0], false); } catch(e) { console.error('[INIT] updateDossier error:', e); }
    this._uiDirty = true;
    console.log('[BARRACUDA] ✓ Game initialized successfully');

    // Auto-show help or initial Comms transmission for new players
    if (!localStorage.getItem('barracuda_intro_seen')) {
      setTimeout(() => {
        this.showCommsTransmission({
          speaker: 'ШТАБ [МАЯК]',
          role: 'HQ',
          text: 'Оператор! Вас приветствует Центр Морских Спецопераций. Автономный дрон «Барракуда» спущен на воду в квадрате 4. Ваша первоочередная задача — начать перехват данных РЛС противника и провести первую разведку в меню ОПЕРАЦИИ.',
          choices: [
            { text: '«Вас понял, штаб. Начинаю операцию.»', action: () => { this.addNotification('📡 СВЯЗЬ УСТАНОВЛЕНА', 'Штаб подтвердил радиоканал.'); } },
            { text: '«Запросить тактическую справку.»', action: () => { const h = document.getElementById('help-modal'); if (h) h.classList.add('active'); } }
          ]
        });
        localStorage.setItem('barracuda_intro_seen', '1');
      }, 1200);
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
    const shuffled = shuffleArray(templates).slice(0, 3);

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
        dataMB: store.state.dataMB,
        totalDataMB: store.state.totalDataMB,
        maxCapacityMB: this.assaultChargeMax,
        assaultCharge: this.assaultCharge,
        assaultChargeMax: this.assaultChargeMax,
        creditsUSD: store.state.creditsUSD,
        blueprintsBP: store.state.blueprintsBP,
        sunkenShips: store.state.sunkenShips,
        totalClicks: store.state.totalClicks,
        totalCrits: store.state.totalCrits,
        totalHacks: store.state.totalHacks,
        overclockUses: store.state.overclockUses,
        visitedSectors: [...store.state.visitedSectors],
        shieldSaves: store.state.shieldSaves,
        currentSector: this.currentSector,
        selectedPrototype: store.state.selectedPrototype,
        unlockedPrototypes: [...store.state.unlockedPrototypes],
        salvage: store.state.salvage,
        craftedModules: [...store.state.craftedModules],
        campaignAct: store.state.campaignAct,
        completedMissions: [...store.state.completedMissions],
        hw: store.state.hw,
        cyber: store.state.cyber,
        tech: store.state.tech,
        contractGenCounter: this.contractGenCounter,
        currentDossierStage: this.currentDossierStage,
        unlockedAchievements: [...store.state.unlockedAchievements],
        bossesDefeated: this.bossesDefeated,
        dailyQuestDate: this.dailyQuestDate,
        dailyQuests: this.dailyQuests,
        shipHP: this.shipHP,
        shipMaxHP: this.shipMaxHP,
        shipLevel: store.state.shipLevel,
        soundEnabled: store.state.soundEnabled,
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

      store.state.dataMB = data.dataMB || 0;
      store.state.totalDataMB = data.totalDataMB || 0;
      this.assaultCharge = data.assaultCharge || 0;
      this.assaultChargeMax = Math.max(500, Math.floor(500 * (1.0 + (data.blueprintsBP || 0) * 0.4)));
      store.state.creditsUSD = data.creditsUSD || 500;
      store.state.blueprintsBP = data.blueprintsBP || 0;
      store.state.sunkenShips = data.sunkenShips || 0;
      store.state.totalClicks = data.totalClicks || 0;
      store.state.totalCrits = data.totalCrits || 0;
      store.state.totalHacks = data.totalHacks || 0;
      store.state.overclockUses = data.overclockUses || 0;
      store.state.visitedSectors = Array.from(data.visitedSectors || ['sector-1']);
      store.state.shieldSaves = data.shieldSaves || 0;
      this.currentSector = data.currentSector || 'sector-1';

      store.state.selectedPrototype = data.selectedPrototype || 'phantom';
      store.state.unlockedPrototypes = Array.from(data.unlockedPrototypes || ['phantom']);
      store.state.salvage = Object.assign({ box: 0, chips: 0, titanium: 0, aicore: 0 }, data.salvage || {});
      store.state.craftedModules = Array.from(data.craftedModules || []);
      store.state.campaignAct = data.campaignAct || 1;
      store.state.completedMissions = Array.from(data.completedMissions || []);

      store.state.hw = data.hw || store.state.hw;
      store.state.cyber = data.cyber || store.state.cyber;
      store.state.tech = data.tech || store.state.tech;
      this.contractGenCounter = data.contractGenCounter || 0;
      this.currentDossierStage = data.currentDossierStage || 0;
      store.state.unlockedAchievements = Array.from(data.unlockedAchievements || []);
      this.bossesDefeated = data.bossesDefeated || 0;
      this.dailyQuestDate = data.dailyQuestDate || '';
      this.dailyQuests = data.dailyQuests || [];
      this.shipHP = data.shipHP || 100;
      this.shipMaxHP = data.shipMaxHP || 100;
      store.state.shipLevel = data.shipLevel || 1;
      store.state.soundEnabled = data.soundEnabled !== false;
      this._savedAt = data.savedAt || 0;

      // Regenerate contracts for current tier
      this.activeContracts = this.generateContracts();

      // Re-apply persistent tech effects
      if (store.state.tech.ecm_suite) this.weaponCooldownMax = Math.max(0.5, 1.5 * 0.5);
      if (store.state.tech.swarmAI && this.engine3D) this.engine3D.updateSwarmEscorts(true);
      if (this.engine3D) this.engine3D.setDronePrototype(store.state.selectedPrototype);
      if (this.engine3D) this.engine3D.updateEnemyShipForLevel(store.state.shipLevel);
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  // =========================================================================
  // OFFLINE INCOME — award passive income for time away (capped at 4 hours)
  // =========================================================================
  processOfflineIncome() {
    if (!this._savedAt) return;
    const elapsed = (Date.now() - this._savedAt) / 1000;
    if (elapsed < 30) return; // less than 30 seconds away — skip

    const maxOffline = 4 * 3600; // 4 hours cap
    const offlineSec = Math.min(elapsed, maxOffline);
    const passiveMB = this.getPassiveRate();
    const passiveUSD = this.getUSDPassiveRate();

    // Apply at 50% efficiency (offline penalty)
    const gainMB = passiveMB * offlineSec * 0.5;
    const gainUSD = passiveUSD * offlineSec * 0.5;

    if (gainMB > 0 || gainUSD > 0) {
      store.state.dataMB += gainMB;
      store.state.totalDataMB += gainMB;
      store.state.creditsUSD += gainUSD;

      const hours = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;

      setTimeout(() => {
        this.addNotification('🌙 ОФЛАЙН ДОХОД', `За ${timeStr} отсутствия: +${Math.floor(gainMB)} МБ, +$${Math.floor(gainUSD).toLocaleString()}`);
      }, 2000);
    }
  }

  // =========================================================================
  // DAILY QUESTS
  // =========================================================================
  initDailyQuests() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.dailyQuestDate !== today) {
      // New day — generate new quests, reset counters
      this.dailyQuestDate = today;
      this.dailyClicks = 0;
      this.dailyDataCollected = 0;
      this.dailyCreditsEarned = 0;
      this.dailyAssaults = 0;
      this.dailyHacks = 0;
      this.dailyCrits = 0;
      this.dailyOverclocks = 0;

      const prestige = store.state.blueprintsBP;
      const shuffled = shuffleArray(DAILY_QUEST_TEMPLATES).slice(0, 3);
      this.dailyQuests = shuffled.map((tmpl, i) => {
        const n = tmpl.getN(prestige);
        return {
          id: tmpl.id,
          desc: tmpl.desc.replace('{n}', n),
          icon: tmpl.icon,
          target: n,
          completed: false,
          reward: { mb: 20 + prestige * 10, usd: 3000 + prestige * 1500 }
        };
      });
      this.saveGame();
    }
  }

  checkDailyQuests() {
    if (!this.dailyQuests || this.dailyQuests.length === 0) return;

    let allDone = true;
    this.dailyQuests.forEach(q => {
      if (q.completed) return;

      const tmpl = DAILY_QUEST_TEMPLATES.find(t => t.id === q.id);
      if (tmpl && tmpl.check(this, q.target)) {
        q.completed = true;
        store.state.dataMB += q.reward.mb;
        store.state.totalDataMB += q.reward.mb;
        store.state.creditsUSD += q.reward.usd;
        this.addNotification(`${q.icon} КВЕСТ ВЫПОЛНЕН`, `${q.desc} — +${q.reward.mb} МБ, +$${q.reward.usd}`);
        window.tacticalAudio.playContractSfx();
      }

      if (!q.completed) allDone = false;
    });

    if (allDone && this.dailyQuests.every(q => q.completed)) {
      this.checkAchievement('daily_complete');
    }
  }

  // =========================================================================
  // BOSS SHIPS — triggered every 5 sunk ships
  // =========================================================================
  shouldTriggerBoss() {
    return store.state.sunkenShips > 0 && store.state.sunkenShips % 5 === 0 && !this.bossActive;
  }

  getBossForLevel() {
    const idx = Math.min(BOSS_SHIPS.length - 1, Math.floor(this.bossesDefeated / 2));
    return BOSS_SHIPS[idx];
  }

  // =========================================================================
  // ACHIEVEMENTS
  // =========================================================================
  checkAchievement(id) {
    if (store.state.unlockedAchievements.includes(id)) return;
    const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (!def) return;

    safeAdd(store.state.unlockedAchievements, id);
    this.addNotification(`${def.icon} ДОСТИЖЕНИЕ`, def.name);
    window.tacticalAudio.playAchievementUnlock();
    this.saveGame();
  }

  checkAllAchievements() {
    if (store.state.totalClicks >= 1) this.checkAchievement('first_click');
    if (store.state.totalCrits >= 50) this.checkAchievement('crit_master');
    if (store.state.creditsUSD >= 100000) this.checkAchievement('millionaire');
    if (store.state.totalDataMB >= 10000) this.checkAchievement('data_hoarder');
    if (store.state.sunkenShips >= 10) this.checkAchievement('fleet_admiral');
    if (store.state.totalHacks >= 10) this.checkAchievement('hacker');
    if (store.state.visitedSectors.size >= 4) this.checkAchievement('all_sectors');
    if (store.state.overclockUses >= 5) this.checkAchievement('overclock_5');
    if (store.state.shieldSaves >= 3) this.checkAchievement('survivor');
    if (this.bossesDefeated >= 1) this.checkAchievement('boss_slayer');
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
    if (this.minigameActive || this.sortieActive) return;

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
          store.state.dataMB = Math.max(0, store.state.dataMB * (1 - this.activeEvent.penalty));
          this.addNotification('❌ ДАННЫЕ ПЕРЕХВАЧЕНЫ', `Потеряно ${Math.floor(this.activeEvent.penalty * 100)}% данных!`);
          this.clearActiveEvent();
          return;
        }
      }

      if (this.activeEvent.type === 'quick_action') {
        if (this.eventCountdown <= 0) {
          store.state.dataMB = Math.max(0, store.state.dataMB + this.activeEvent.penalty.mb);
          store.state.creditsUSD = Math.max(0, store.state.creditsUSD + this.activeEvent.penalty.usd);
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
    try {
      this.engine3D = new Barracuda3DEngine('drone-3d-viewport', (x, y) => {
        this.handleClick(x, y);
      });
    } catch (e) {
      console.error('[BARRACUDA 3D] Engine initialization error:', e);
    }

    // Scale enemy ship to match current level
    if (this.engine3D) {
      this.engine3D.updateEnemyShipForLevel(store.state.shipLevel || 1);
    }
  }

  getMaxBufferMB() {
    if (store.state.tech && store.state.tech.data_nexus) return Infinity;
    const base = 5000; // 5.0 GB default capacity
    const satcomBonus = (store.state.hw.satcom || 0) * 2500;
    const snifferBonus = (store.state.cyber.sniffer || 0) * 5000;
    const quantumBonus = (store.state.craftedModules && store.state.craftedModules.includes('quantum_booster') ? 25000 : 0);
    const prestigeBonus = (store.state.blueprintsBP || 0) * 10000;
    return base + satcomBonus + snifferBonus + quantumBonus + prestigeBonus;
  }

  getGlobalMultiplier() {
    const sectorMult = SECTOR_INFO[this.currentSector]?.mult || 1.0;
    return (1.0 + store.state.blueprintsBP * 0.5) * sectorMult;
  }

  getClickPower() {
    let base = 4.0 + (store.state.hw.satcom * 6.0) + (store.state.hw.optics * 12.0);
    if (this.isOverclocked) base *= 3.0;
    const proto = DRONE_PROTOTYPES_DEF[store.state.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    base *= (proto.clickMult || 1.0);
    return base * this.getGlobalMultiplier();
  }

  getClickCashGain() {
    let base = 25 + store.state.hw.optics * 50 + store.state.cyber.autosiphon * 100;
    const proto = DRONE_PROTOTYPES_DEF[store.state.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    base *= (proto.clickMult || 1.0);
    return Math.floor(base * this.getGlobalMultiplier());
  }

  getCritChance() {
    let base = 0.05 + store.state.hw.optics * 0.08 + store.state.cyber.quantum * 0.12;
    if (store.state.craftedModules && store.state.craftedModules.includes('quantum_booster')) base += 0.20;
    return Math.min(0.85, base);
  }

  getPassiveRate() {
    let rate = (store.state.hw.armor * 0.2) + (store.state.hw.waterjets * 0.8) + (store.state.cyber.sniffer * 1.5);
    const proto = DRONE_PROTOTYPES_DEF[store.state.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    rate *= (proto.passiveMult || 1.0);
    if (store.state.craftedModules && store.state.craftedModules.includes('escort_wingman')) rate *= 2.0;
    if (store.state.tech.swarmAI) rate *= 2.0;
    if (this.isOverclocked) rate *= 2.0;

    // EMP states
    if (this.empState) {
      if (this.empState.phase === 'down') return 0;
      if (this.empState.phase === 'boost') rate *= 3.0;
    }

    return rate * this.getGlobalMultiplier();
  }

  getUSDPassiveRate() {
    let rate = 5 + store.state.cyber.autosiphon * 15;
    const proto = DRONE_PROTOTYPES_DEF[store.state.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    rate *= (proto.passiveMult || 1.0);
    if (store.state.craftedModules && store.state.craftedModules.includes('escort_wingman')) rate *= 2.0;
    rate *= this.getGlobalMultiplier();
    if (this.empState && this.empState.phase === 'down') return 0;
    if (this.empState && this.empState.phase === 'boost') rate *= 3.0;
    return rate;
  }

  getHWCost(type) {
    const basesMB = { satcom: 250, optics: 600, armor: 1200, waterjets: 2500, missiles: 4000 };
    const basesUSD = { satcom: 1200, optics: 3500, armor: 8000, waterjets: 15000, missiles: 30000 };
    const scales = { satcom: 1.8, optics: 1.85, armor: 1.9, waterjets: 1.95, missiles: 2.0 };
    const lvl = store.state.hw[type] || 0;
    return {
      mb: Math.floor(basesMB[type] * Math.pow(scales[type], lvl)),
      usd: Math.floor(basesUSD[type] * Math.pow(scales[type], lvl)),
      isMax: lvl >= 10
    };
  }

  getCyberCost(type) {
    const basesMB = { sniffer: 500, quantum: 1500, autosiphon: 3000 };
    const basesUSD = { sniffer: 2500, quantum: 8000, autosiphon: 20000 };
    const scales = { sniffer: 1.85, quantum: 1.95, autosiphon: 2.05 };
    const lvl = store.state.cyber[type] || 0;
    return {
      mb: Math.floor(basesMB[type] * Math.pow(scales[type], lvl)),
      usd: Math.floor(basesUSD[type] * Math.pow(scales[type], lvl)),
      isMax: lvl >= 10
    };
  }

  // =========================================================================
  // TACTICAL RADIO COMMS TERMINAL
  // =========================================================================
  showCommsTransmission({ speaker = 'ШТАБ [МАЯК]', role = 'HQ', text = '', choices = [] }) {
    this.commsActive = true;
    const modal = document.getElementById('comms-terminal-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    const speakerEl = document.getElementById('comms-speaker-title');
    const subEl = document.getElementById('comms-speaker-sub');
    const bodyEl = document.getElementById('comms-dialogue-text');
    const choicesEl = document.getElementById('comms-choices-container');
    const avatarEl = document.getElementById('comms-avatar-icon');

    if (speakerEl) speakerEl.textContent = speaker;

    let avatarIcon = '📡';
    let subTitle = 'ГЕНЕРАЛЬНЫЙ ОПЕРАТИВНЫЙ ЦЕНТР';
    if (role === 'HQ') { avatarIcon = '📡'; subTitle = 'КОМАНДОВАНИЕ ОПЕРАЦИИ'; }
    else if (role === 'EW') { avatarIcon = '💻'; subTitle = 'ОФИЦЕР КИБЕРРАЗВЕДКИ И РЭБ'; }
    else if (role === 'ENEMY') { avatarIcon = '💀'; subTitle = 'ЭШЕЛОН ОБОРОНЫ ПРОТИВНИКА'; }
    else if (role === 'AI') { avatarIcon = '🤖'; subTitle = 'БОРТОВОЙ ИИ «БАРРАКУДА»'; }

    if (avatarEl) avatarEl.innerHTML = `${avatarIcon}<span class="comms-avatar-badge" id="comms-speaker-role">${role}</span>`;
    if (subEl) subEl.textContent = subTitle;

    if (window.tacticalAudio) {
      window.tacticalAudio.playRadioStatic(0.18);
      setTimeout(() => window.tacticalAudio.playCommsChirp(), 150);
    }

    if (this.commsTypewriterInterval) clearInterval(this.commsTypewriterInterval);
    if (bodyEl) {
      bodyEl.textContent = '';
      let i = 0;
      this.commsTypewriterInterval = setInterval(() => {
        i++;
        bodyEl.textContent = text.slice(0, i) + '█';
        if (Math.random() > 0.4 && window.tacticalAudio) window.tacticalAudio.playTeletypeChar();
        if (i >= text.length) {
          bodyEl.textContent = text;
          clearInterval(this.commsTypewriterInterval);
        }
      }, 18);
    }

    if (choicesEl) {
      choicesEl.innerHTML = '';
      if (!choices || choices.length === 0) {
        choices = [{ text: '«Принято. Продолжаю выполнение.»', action: () => this.closeCommsTransmission() }];
      }

      choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'comms-choice-btn';
        btn.innerHTML = `<span class="comms-choice-tag">ОТВЕТ</span><span>${ch.text}</span>`;
        btn.addEventListener('click', () => {
          if (window.tacticalAudio) window.tacticalAudio.playPing();
          if (ch.action) ch.action();
          this.closeCommsTransmission();
        });
        choicesEl.appendChild(btn);
      });
    }
  }

  closeCommsTransmission() {
    this.commsActive = false;
    if (this.commsTypewriterInterval) clearInterval(this.commsTypewriterInterval);
    const modal = document.getElementById('comms-terminal-modal');
    if (modal) modal.style.display = 'none';
  }

  // =========================================================================
  // STORY CAMPAIGN & MISSIONS SYSTEM
  // =========================================================================
  initCampaignAndHangar() {
    const btnOpenCampaign = document.getElementById('btn-open-campaign');
    const btnCloseCampaign = document.getElementById('btn-close-campaign');
    const campaignModal = document.getElementById('campaign-modal');

    if (btnOpenCampaign) {
      btnOpenCampaign.addEventListener('click', (e) => {
        e.stopPropagation();
        if (campaignModal) campaignModal.classList.add('active'); // Open FIRST
        try { this.renderCampaignDOM(); } catch(err) { console.error('[CAMPAIGN] render error:', err); }
      });
    }
    if (btnCloseCampaign) {
      btnCloseCampaign.addEventListener('click', () => {
        if (campaignModal) campaignModal.classList.remove('active');
      });
    }

    document.querySelectorAll('.campaign-act-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const act = parseInt(tab.getAttribute('data-act'), 10);
        try { this.selectCampaignAct(act); } catch(err) { console.error('[CAMPAIGN ACT] error:', err); }
      });
    });

    const btnOpenHangar = document.getElementById('btn-open-hangar');
    const btnCloseHangar = document.getElementById('btn-close-hangar');
    const hangarModal = document.getElementById('hangar-modal');

    if (btnOpenHangar) {
      btnOpenHangar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hangarModal) hangarModal.classList.add('active'); // Open FIRST
        try { this.renderHangarDOM(); } catch(err) { console.error('[HANGAR] render error:', err); }
      });
    }
    if (btnCloseHangar) {
      btnCloseHangar.addEventListener('click', () => {
        if (hangarModal) hangarModal.classList.remove('active');
      });
    }

    const btnCloseComms = document.getElementById('btn-close-comms');
    if (btnCloseComms) {
      btnCloseComms.addEventListener('click', () => this.closeCommsTransmission());
    }

    try { this.renderCampaignDOM(); } catch(e) { console.error('[INIT CAMPAIGN]', e); }
    try { this.renderHangarDOM(); } catch(e) { console.error('[INIT HANGAR]', e); }
  }

  selectCampaignAct(actNum) {
    store.state.campaignAct = actNum;
    document.querySelectorAll('.campaign-act-tab').forEach(t => {
      const a = parseInt(t.getAttribute('data-act'), 10);
      t.classList.toggle('active', a === actNum);
    });
    this.renderCampaignDOM();
    if (window.tacticalAudio) window.tacticalAudio.playPing();
  }

  renderCampaignDOM() {
    const list = document.getElementById('campaign-missions-list');
    if (!list) return;

    const actData = CAMPAIGN_ACTS_DEF.find(a => a.act === store.state.campaignAct) || CAMPAIGN_ACTS_DEF[0];
    list.innerHTML = '';

    actData.missions.forEach((m, idx) => {
      const isCompleted = store.state.completedMissions.includes(m.id);
      const isActive = this.activeMission && this.activeMission.id === m.id;
      const isUnlocked = idx === 0 || store.state.completedMissions.includes(actData.missions[idx - 1].id) || isCompleted;

      const card = document.createElement('div');
      card.className = `campaign-mission-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

      let statusPill = isCompleted
        ? '<span class="mission-status-pill done">✓ ВЫПОЛНЕНО</span>'
        : (isActive
            ? '<span class="mission-status-pill ready">▶ В ПРОЦЕССЕ</span>'
            : (isUnlocked ? '<span class="mission-status-pill ready">ГОТОВО К ПУСКУ</span>' : '<span class="mission-status-pill locked">🔒 ЗАБЛОКИРОВАНО</span>'));

      let phaseTrack = '';
      if (m.phases) {
        phaseTrack = `<div class="mission-phases-track">` + m.phases.map((p, pIdx) => {
          let stepClass = '';
          if (isCompleted) stepClass = 'done';
          else if (isActive) {
            if (this.missionPhase > pIdx + 1) stepClass = 'done';
            else if (this.missionPhase === pIdx + 1) stepClass = 'active';
          }
          return `<div class="mission-phase-step ${stepClass}"><span>${pIdx + 1}</span><span>${p}</span></div>`;
        }).join('') + `</div>`;
      }

      let salvageText = '';
      if (m.reward.salvage) {
        const parts = [];
        if (m.reward.salvage.box) parts.push(`📦 x${m.reward.salvage.box}`);
        if (m.reward.salvage.chips) parts.push(`💎 x${m.reward.salvage.chips}`);
        if (m.reward.salvage.titanium) parts.push(`🛡️ x${m.reward.salvage.titanium}`);
        if (m.reward.salvage.aicore) parts.push(`🔮 x${m.reward.salvage.aicore}`);
        salvageText = parts.join(' ');
      }

      // Mission type badge
      const typeLabels = {
        'recon': '🔭 РАЗВЕДКА',
        'rew': '📡 РЭБ-ВЗЛОМ',
        'strike': '💥 УДАРНАЯ',
        'rov': '🔮 МИКРО-ROV',
        'sonar': '📡 СОНАР 3D',
        'drift': '🚤 VSA ДРИФТ',
        'ai_strike': '🧠 ИИ JETSON',
        'kinburn': '🏝️ КИНБУРН'
      };
      const typeColors = {
        'recon': '#00ccff',
        'rew': '#ff9900',
        'strike': '#ff3333',
        'rov': '#00f0ff',
        'sonar': '#00ff88',
        'drift': '#ffcc00',
        'ai_strike': '#d070ff',
        'kinburn': '#ff5577'
      };
      const mType = m.missionType || 'strike';
      const typeColor = typeColors[mType] || '#00ccff';
      const typeLabel = typeLabels[mType] || '💥 ОПЕРАЦИЯ';
      const typeBadge = `<span class="mission-type-badge" style="background:${typeColor}22;color:${typeColor};border:1px solid ${typeColor}44;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:1px;">${typeLabel}</span>`;

      // Enemy list
      let enemyList = '';
      if (m.enemies && m.enemies.length > 0) {
        enemyList = `<div style="margin-top:6px;padding:6px 8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:9px;color:#8da4af;letter-spacing:1px;margin-bottom:4px;">ПРОТИВНИК В ЗОНЕ:</div>
          ${m.enemies.map(e => `<div style="font-size:11px;color:#e0e8ec;margin:2px 0;"><span style="color:#ff6644;">▸</span> ${e.name} <span style="color:#667;font-size:10px;">×${e.count}</span></div>`).join('')}
        </div>`;
      }

      // Launch button text based on mission type
      let launchText = 'НАЧАТЬ ОПЕРАЦИЮ';
      if (isCompleted) launchText = 'ПОВТОРИТЬ ОПЕРАЦИЮ';
      else if (isActive) launchText = 'ПРОДОЛЖИТЬ';
      else if (mType === 'recon') launchText = '🔭 ВЫЛЕТ НА РАЗВЕДКУ';
      else if (mType === 'rew') launchText = '📡 НАЧАТЬ ВЗЛОМ';
      else if (mType === 'rov') launchText = '🔮 СПУСТИТЬ ROV';
      else if (mType === 'sonar') launchText = '📡 ПРОРЫВ ПО СОНАРУ';
      else if (mType === 'drift') launchText = '🚤 ДРИФТ-ИСПЫТАНИЕ';
      else if (mType === 'ai_strike') launchText = '🧠 НЕЙРО-ШТУРМ';
      else launchText = '💥 НАЧАТЬ ШТУРМ';

      card.innerHTML = `
        <div>
          <div class="mission-header-row">
            <span class="mission-code-badge">${m.code}</span>
            ${typeBadge}
            ${statusPill}
          </div>
          <div class="mission-title-text">${m.title}</div>
          <div class="mission-desc-text">${m.desc}</div>
          ${enemyList}
          ${phaseTrack}
          <div class="mission-rewards-row">
            <span>НАГРАДЫ: <strong>+$${m.reward.usd.toLocaleString()}</strong></span>
            <span><strong>+${m.reward.mb} МБ</strong></span>
            ${m.reward.bp > 0 ? `<span>+${m.reward.bp} ЧЖ</span>` : ''}
            ${salvageText ? `<span style="color:#00f0ff;">${salvageText}</span>` : ''}
          </div>
        </div>
        <button class="btn-launch-mission" data-mission-id="${m.id}" ${!isUnlocked ? 'disabled' : ''}>
          ${launchText}
        </button>
      `;

      card.querySelector('[data-mission-id]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.startCampaignMission(m.id);
      });

      list.appendChild(card);
    });
  }

  // =========================================================================
  // REAL-TIME 3D BOAT SORTIES & INTERACTIVE MISSIONS
  // =========================================================================

  // =========================================================================
  // REAL-TIME 3D BOAT SORTIES & FPV COMBAT STRIKES
  // =========================================================================

  startCampaignMission(missionId) {
    let found = null;
    let foundAct = null;
    for (const act of CAMPAIGN_ACTS_DEF) {
      const m = act.missions.find(item => item.id === missionId);
      if (m) { found = m; foundAct = act; break; }
    }
    if (!found) return;

    // AUTO-CLOSE all modals immediately
    document.querySelectorAll('.help-modal-overlay, .tactical-modal-overlay').forEach(el => el.classList.remove('active'));

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    if (found.commsIntro && !isMobile) {
      this.showCommsTransmission({
        speaker: found.commsIntro.speaker,
        role: found.commsIntro.role,
        text: found.commsIntro.text,
        choices: [
          { text: '«Вас понял. Приступаю к операции.»', action: () => {
            this._launchMissionByType(found, foundAct);
          }},
          { text: '«Отмена. Возвращаюсь на базу.»', action: () => {
            this.addNotification('🔙 ОТМЕНА', 'Операция отменена по решению оператора.');
          }}
        ]
      });
    } else {
      this._launchMissionByType(found, foundAct);
      if (found.commsIntro) {
        this.addNotification(found.commsIntro.speaker, found.commsIntro.text);
      }
    }
  }

  _launchMissionByType(mission, actData) {
    const mType = mission.missionType || 'strike';
    
    if (mType === 'recon') {
      this._startReconMission(mission, actData);
    } else if (mType === 'rew') {
      this._startRewMission(mission, actData);
    } else if (mType === 'rov') {
      this._startRovMission(mission, actData);
    } else if (mType === 'sonar') {
      this.start3DMissionSortie(mission.id);
      setTimeout(() => {
        if (this.engine3D) {
          this.engine3D.setSonarActive(true);
          this.sonarActive = true;
          const sonarPanel = document.getElementById('sonar-waterfall-panel');
          if (sonarPanel) sonarPanel.style.display = 'block';
        }
      }, 500);
    } else if (mType === 'drift') {
      this.start3DMissionSortie(mission.id);
      setTimeout(() => {
        if (this.engine3D) {
          this.engine3D.setVsaState(false);
          this.vsaEnabled = false;
          this.showMissionWarning('⚠️ РЕЖИМ ДРИФТА: VSA ОТКЛЮЧЕНА! Маневрируйте на полной скорости!');
        }
      }, 500);
    } else if (mType === 'ai_strike') {
      this.start3DMissionSortie(mission.id);
      setTimeout(() => {
        if (this.engine3D) {
          this.engine3D.setFpvAiModule(true);
          this.startFpvFlightPhase();
          this.showMissionWarning('🧠 РЭБ-ПОДАВЛЕНИЕ АКТИВИРОВАНО: ИИ Jetson NPU выполняет авто-доводку!');
        }
      }, 800);
    } else {
      this.start3DMissionSortie(mission.id);
    }
  }

  // =========================================================================
  // ROV UNDERWATER MISSION — Submarine Tether & Magnetometer Cable Tap
  // =========================================================================
  _startRovMission(mission, actData) {
    this.activeMission = mission;
    this.sortieActive = true;
    this.sortieTimeLeft = mission.timeLimit || 200;

    // Switch sector
    if (actData.sector && this.currentSector !== actData.sector) {
      this.changeSector(actData.sector);
    }

    // Hide base HUD & modals
    document.querySelectorAll('.help-modal-overlay, .tactical-modal-overlay').forEach(el => el.classList.remove('active'));
    const gameFrame = document.getElementById('game-frame');
    if (gameFrame) gameFrame.style.display = 'none';

    // Show ROV overlay
    const rovOverlay = document.getElementById('rov-mission-overlay');
    if (rovOverlay) rovOverlay.style.display = 'flex';

    if (this.engine3D) {
      this.engine3D.startRovMode();
    }
    if (window.tacticalAudio) {
      window.tacticalAudio.playRovThruster();
    }
    this.startSortieTimer();
    this.addNotification('🔮 МИКРО-ROV СПУЩЕН', 'Ориентируйтесь по шкале магнитометра и подключите сифон данных!');
    this.showMissionWarning('🔮 Подводный дрон активен. Нажмите [ПОДКЛЮЧИТЬ СИФОН], когда магнитометр зафиксирует максимум поля!');
  }

  // =========================================================================
  // RECONNAISSANCE MISSION — FPV drone scout + photograph targets
  // =========================================================================
  _startReconMission(mission, actData) {
    this.activeMission = mission;
    this.sortieActive = true;
    this.fpvFlightPhase = true; // Start directly in FPV
    this.sortieTimeLeft = mission.reconTimeLimit || 240;

    this.reconState = {
      targetsTotal: mission.reconTargets || 3,
      targetsFound: 0,
      targetPositions: [],
      photosTaken: 0,
      startTime: Date.now(),
      scanCooldown: 0,
      lockedAudioPlayed: false
    };

    // Generate target positions along the north bank (enemy side)
    const targetNames = [
      'ЗРК «ТОР-М2»', 'Комплекс РЭБ «ПОЛЕ-21»', 'Береговой капонир Д-30',
      'РЛС обнаружения «МЫС»', 'Склад боеприпасов ГСМ', 'Пост наблюдения ДШК'
    ];

    for (let i = 0; i < this.reconState.targetsTotal; i++) {
      const spread = 240;
      const x = (i / (this.reconState.targetsTotal - 1 || 1) - 0.5) * spread + (Math.random() - 0.5) * 30;
      const z = -(110 + i * 25 + Math.random() * 20); // North bank (enemy side)
      this.reconState.targetPositions.push({
        x: x,
        z: z,
        found: false,
        name: targetNames[i % targetNames.length]
      });
    }

    // Close any open modals
    document.querySelectorAll('.help-modal-overlay, .tactical-modal-overlay').forEach(el => el.classList.remove('active'));

    // Switch sector if needed
    if (actData.sector && this.currentSector !== actData.sector) {
      this.changeSector(actData.sector);
    }

    // Hide base HUD
    const gameFrame = document.getElementById('game-frame');
    if (gameFrame) gameFrame.style.display = 'none';

    // Show FPV overlay
    const fpvOverlay = document.getElementById('fpv-flight-overlay');
    if (fpvOverlay) {
      fpvOverlay.classList.remove('mission-hud-hidden');
      fpvOverlay.style.display = 'flex';
    }

    // Show Recon HUD Overlay with Waypoints
    const reconOverlay = document.getElementById('recon-hud-overlay');
    if (reconOverlay) reconOverlay.style.display = 'block';

    // Hide boat cockpit
    const cockpit = document.getElementById('mission-cockpit-overlay');
    if (cockpit) { cockpit.classList.add('mission-hud-hidden'); cockpit.style.display = 'none'; }

    // Configure 3D recon
    const reconConfig = {
      type: 'recon',
      targetPositions: this.reconState.targetPositions,
      mineCount: 0,
      crateCount: 0,
      searchlightCount: actData.act >= 2 ? 2 : 1,
      targetDist: 100,
      targetLabel: mission.title
    };

    if (this.engine3D) {
      this.engine3D.startPilotMission(reconConfig, (event, data) => this._handleReconEvent(event, data));
      this.engine3D.startFpvFlight((event, data) => this._handleReconEvent(event, data));
      // Position drone pointing towards enemy north bank
      this.engine3D.fpvPos.set(0, 18, 50);
      this.engine3D.fpvYaw = 0;
      this.engine3D.fpvPitch = -0.15;
      // Create 3D target markers and physical compound objects
      this.engine3D.createReconTargetMarkers(this.reconState.targetPositions);
    }

    this.inputState = { throttle: 0, steer: 0, boost: false, fpvPitch: 0, fpvYaw: 0, hover: false };
    this.initPilotInputListeners();
    this.startSortieTimer();

    const firstTarget = this.reconState.targetPositions[0];
    this.addNotification('🔭 РАЗВЕДКА НАЧАТА', `Найдите ${this.reconState.targetsTotal} целей на северном берегу! Первая цель: ${firstTarget.name}`);
    this.showMissionWarning(`🔍 ЛЕТИТЕ К СВЕТЯЩЕМУСЯ МАЯКУ: ${firstTarget.name}! Подлетите на расстояние <45м и нажмите [ПРОБЕЛ]`);

    if (window.tacticalAudio) {
      window.tacticalAudio.playFPVLaunch();
      window.tacticalAudio.startFpvMotorSound();
    }

    // Bind on-screen snap button, screen tap zone, and spacebar
    const snapBtn = document.getElementById('btn-recon-snap');
    const tapZone = document.getElementById('recon-screen-tap-zone');
    const fpvPhotoBtn = document.getElementById('btn-fpv-photo');

    const doSnap = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      this._attemptReconPhoto();
    };

    if (snapBtn) {
      snapBtn.onpointerdown = doSnap;
      snapBtn.onclick = doSnap;
    }

    if (tapZone) {
      tapZone.onpointerdown = doSnap;
      tapZone.onclick = doSnap;
    }

    if (fpvPhotoBtn) {
      fpvPhotoBtn.onpointerdown = doSnap;
      fpvPhotoBtn.onclick = doSnap;
    }

    this._reconPhotoHandler = (e) => {
      if (!this.sortieActive || !this.reconState) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this._attemptReconPhoto();
      }
    };
    window.addEventListener('keydown', this._reconPhotoHandler);

    // Start 60fps recon HUD update loop
    this._reconHudInterval = setInterval(() => {
      if (!this.sortieActive || !this.reconState || !this.engine3D) {
        clearInterval(this._reconHudInterval);
        return;
      }
      this._updateReconHUD();
    }, 50);
  }

  _attemptReconPhoto() {
    if (!this.reconState || this.reconState.scanCooldown > Date.now()) return;
    this.reconState.scanCooldown = Date.now() + 1000;

    // Flash screen white briefly for photo effect
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.75);z-index:9999;pointer-events:none;transition:opacity 0.3s';
    document.body.appendChild(flash);
    setTimeout(() => { flash.style.opacity = '0'; }, 40);
    setTimeout(() => flash.remove(), 350);

    if (window.tacticalAudio) window.tacticalAudio.playPhotoCaptured();

    // Check if any unfound target is close to drone position (< 50m)
    if (this.engine3D && this.engine3D.fpvPos) {
      const dronePos = this.engine3D.fpvPos;
      
      let nearestTarget = null;
      let nearestDist = Infinity;
      
      this.reconState.targetPositions.forEach((t, idx) => {
        if (t.found) return;
        const dx = dronePos.x - t.x;
        const dz = dronePos.z - t.z;
        const dist = Math.hypot(dx, dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestTarget = { target: t, idx };
        }
      });

      if (nearestTarget && nearestDist < 50) {
        nearestTarget.target.found = true;
        this.reconState.targetsFound++;
        this.reconState.photosTaken++;
        this.reconState.lockedAudioPlayed = false;

        // Remove 3D marker for found target
        if (this.engine3D.removeReconMarker) {
          this.engine3D.removeReconMarker(nearestTarget.idx);
        }

        if (window.tacticalAudio) window.tacticalAudio.playTargetFound();

        // Show Polaroid Photo Card on screen
        const photoCard = document.getElementById('recon-photo-card');
        const photoName = document.getElementById('photo-last-name');
        if (photoCard && photoName) {
          photoName.textContent = `${nearestTarget.target.name} [${this.reconState.targetsFound}/${this.reconState.targetsTotal}]`;
          photoCard.classList.add('show');
          setTimeout(() => photoCard.classList.remove('show'), 3500);
        }

        this.showMissionWarning(`📸 ЦЕЛЬ ЗАФИКСИРОВАНА: ${nearestTarget.target.name} [${this.reconState.targetsFound}/${this.reconState.targetsTotal}]`);
        this.addNotification('📸 ФОТОФИКСАЦИЯ УСПЕШНА', `${nearestTarget.target.name} занесён в протокол разведки!`);

        // Check completion
        if (this.reconState.targetsFound >= this.reconState.targetsTotal) {
          this.showMissionWarning('✅ ВСЕ ЦЕЛИ ОБНАРУЖЕНЫ! Завершение разведки...');
          setTimeout(() => {
            const reconOverlay = document.getElementById('recon-hud-overlay');
            if (reconOverlay) reconOverlay.style.display = 'none';
            this.finishSortie(true, 'Все цели разведаны и сфотографированы');
          }, 2000);
        } else {
          // Find next target for guidance
          const nextTarget = this.reconState.targetPositions.find(t => !t.found);
          if (nextTarget) {
            setTimeout(() => {
              this.showMissionWarning(`🔭 СЛЕДУЮЩАЯ ЦЕЛЬ: ${nextTarget.name}! Летите к следующему световому маяку.`);
            }, 1500);
          }
        }
      } else if (nearestTarget && nearestDist < 90) {
        this.showMissionWarning(`📷 Почти в зоне! Цель «${nearestTarget.target.name}» в ${Math.round(nearestDist)}м — подлетите ближе (<45м)!`);
      } else {
        this.showMissionWarning('📷 Цель слишком далеко! Подлетите ближе к световому столбу маяка (<45м).');
      }
    }
  }

  _handleReconEvent(event, data) {
    if (!this.sortieActive) return;
    if (event === 'fpv_crashed') {
      this.finishSortie(false, data.reason || 'FPV-дрон потерпел крушение');
    } else if (event === 'fpv_damaged') {
      this.reconState.scanCooldown = Date.now() + 500;
      const glitchLayer = document.getElementById('fpv-glitch-layer');
      if (glitchLayer) {
        glitchLayer.classList.add('fpv-glitched');
        setTimeout(() => glitchLayer.classList.remove('fpv-glitched'), 200);
      }
    }
  }

  // =========================================================================
  // REW (Electronic Warfare) HACK MINIGAME — Timing-based frequency capture
  // =========================================================================
  _startRewMission(mission, actData) {
    this.activeMission = mission;
    
    const channels = mission.rewChannels || 4;
    const timePerChannel = mission.rewTimePerChannel || 8;

    this.rewState = {
      channels: channels,
      channelsDone: 0,
      channelsFailed: 0,
      timePerChannel: timePerChannel,
      currentBarPos: 0,
      greenZoneStart: 0.35 + Math.random() * 0.2,
      greenZoneWidth: 0.15 - (actData.act - 1) * 0.02, // Gets harder with acts
      barSpeed: 1.2 + actData.act * 0.3,
      barDirection: 1,
      active: true,
      startTime: Date.now()
    };

    // Close modals
    document.querySelectorAll('.help-modal-overlay, .tactical-modal-overlay').forEach(el => el.classList.remove('active'));

    // Switch sector
    if (actData.sector && this.currentSector !== actData.sector) {
      this.changeSector(actData.sector);
    }

    // Create REW overlay
    this._createRewOverlay();
    this._startRewLoop();

    if (window.tacticalAudio) window.tacticalAudio.playCyberHackTone(true);
    this.addNotification('📡 РЭБ-ВЗЛОМ НАЧАТ', `Подавите ${channels} частотных каналов!`);
  }

  _createRewOverlay() {
    // Remove old if exists
    let overlay = document.getElementById('rew-hack-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'rew-hack-overlay';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%; z-index:5000;
      background:rgba(0,8,16,0.95); display:flex; flex-direction:column;
      align-items:center; justify-content:center; font-family:'Rajdhani',monospace;
    `;
    overlay.innerHTML = `
      <div style="color:#00ff88;font-size:11px;letter-spacing:3px;margin-bottom:8px;">ELECTRONIC WARFARE MODULE // FREQUENCY CAPTURE</div>
      <div style="color:#fff;font-size:22px;font-weight:800;margin-bottom:16px;" id="rew-channel-label">КАНАЛ 1 / ${this.rewState.channels}</div>
      <div style="color:#8da4af;font-size:13px;margin-bottom:24px;" id="rew-instruction">Нажмите [ПРОБЕЛ] когда курсор окажется в ЗЕЛЁНОЙ зоне!</div>
      
      <div id="rew-bar-container" style="
        width:80%; max-width:600px; height:50px; background:#0a1a28;
        border:2px solid #1a3a4a; border-radius:8px; position:relative;
        overflow:hidden; margin-bottom:20px;
      ">
        <div id="rew-green-zone" style="
          position:absolute; top:0; height:100%; background:rgba(0,255,100,0.15);
          border-left:2px solid #00ff88; border-right:2px solid #00ff88;
        "></div>
        <div id="rew-cursor" style="
          position:absolute; top:0; width:4px; height:100%; background:#ff4400;
          box-shadow:0 0 12px #ff4400, 0 0 24px rgba(255,68,0,0.5);
        "></div>
      </div>
      
      <div style="display:flex;gap:12px;margin-bottom:16px;" id="rew-channel-dots"></div>
      
      <div style="display:flex;gap:16px;">
        <button id="rew-hack-btn" style="
          padding:12px 32px; background:linear-gradient(135deg,#00aa44,#00ff88);
          border:none; border-radius:8px; color:#000; font-size:16px; font-weight:800;
          font-family:'Rajdhani',sans-serif; cursor:pointer; letter-spacing:1px;
        ">⚡ ЗАХВАТ ЧАСТОТЫ [ПРОБЕЛ]</button>
        <button id="rew-abort-btn" style="
          padding:12px 24px; background:rgba(255,50,50,0.2); border:1px solid #ff3333;
          border-radius:8px; color:#ff5555; font-size:14px; font-weight:700;
          font-family:'Rajdhani',sans-serif; cursor:pointer;
        ">✕ ОТМЕНА</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Update green zone visual
    this._updateRewGreenZone();
    this._updateRewDots();

    // Button handlers
    document.getElementById('rew-hack-btn').addEventListener('click', () => this._rewAttemptCapture());
    document.getElementById('rew-abort-btn').addEventListener('click', () => this._finishRewMission(false));

    // Keyboard handler
    this._rewKeyHandler = (e) => {
      if (e.code === 'Space' && this.rewState && this.rewState.active) {
        e.preventDefault();
        this._rewAttemptCapture();
      }
    };
    window.addEventListener('keydown', this._rewKeyHandler);
  }

  _updateRewGreenZone() {
    const zone = document.getElementById('rew-green-zone');
    if (zone && this.rewState) {
      zone.style.left = `${this.rewState.greenZoneStart * 100}%`;
      zone.style.width = `${this.rewState.greenZoneWidth * 100}%`;
    }
  }

  _updateRewDots() {
    const dotsEl = document.getElementById('rew-channel-dots');
    if (!dotsEl || !this.rewState) return;
    let html = '';
    for (let i = 0; i < this.rewState.channels; i++) {
      let color = '#1a3a4a';
      if (i < this.rewState.channelsDone) color = '#00ff88';
      else if (i < this.rewState.channelsDone + this.rewState.channelsFailed) color = '#ff3333';
      html += `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid ${color === '#1a3a4a' ? '#2a4a5a' : color};"></div>`;
    }
    dotsEl.innerHTML = html;
  }

  _startRewLoop() {
    this._rewAnimFrame = requestAnimationFrame(() => this._rewAnimStep());
  }

  _rewAnimStep() {
    if (!this.rewState || !this.rewState.active) return;

    // Move cursor
    this.rewState.currentBarPos += this.rewState.barSpeed * this.rewState.barDirection * 0.012;
    if (this.rewState.currentBarPos >= 1) {
      this.rewState.currentBarPos = 1;
      this.rewState.barDirection = -1;
    } else if (this.rewState.currentBarPos <= 0) {
      this.rewState.currentBarPos = 0;
      this.rewState.barDirection = 1;
    }

    // Update cursor visual
    const cursor = document.getElementById('rew-cursor');
    if (cursor) cursor.style.left = `${this.rewState.currentBarPos * 100}%`;

    // Play scanning pulse periodically
    if (Math.random() < 0.02 && window.tacticalAudio) {
      window.tacticalAudio.playRewScanPulse();
    }

    this._rewAnimFrame = requestAnimationFrame(() => this._rewAnimStep());
  }

  _rewAttemptCapture() {
    if (!this.rewState || !this.rewState.active) return;

    const pos = this.rewState.currentBarPos;
    const inGreen = pos >= this.rewState.greenZoneStart && 
                    pos <= this.rewState.greenZoneStart + this.rewState.greenZoneWidth;

    if (inGreen) {
      this.rewState.channelsDone++;
      if (window.tacticalAudio) window.tacticalAudio.playRewSuccess();

      const label = document.getElementById('rew-channel-label');
      if (label) label.textContent = `КАНАЛ ${this.rewState.channelsDone + 1} / ${this.rewState.channels}`;

      // Randomize next green zone
      this.rewState.greenZoneStart = 0.1 + Math.random() * 0.65;
      this.rewState.barSpeed += 0.15; // Gets faster
      this._updateRewGreenZone();
    } else {
      this.rewState.channelsFailed++;
      if (window.tacticalAudio) window.tacticalAudio.playRewFail();
      
      // Flash screen red
      const overlay = document.getElementById('rew-hack-overlay');
      if (overlay) {
        overlay.style.background = 'rgba(80,0,0,0.95)';
        setTimeout(() => { if (overlay) overlay.style.background = 'rgba(0,8,16,0.95)'; }, 200);
      }
    }

    this._updateRewDots();

    // Check completion
    if (this.rewState.channelsDone >= this.rewState.channels) {
      setTimeout(() => this._finishRewMission(true), 800);
    } else if (this.rewState.channelsFailed >= 3) {
      setTimeout(() => this._finishRewMission(false), 800);
    }
  }

  _finishRewMission(success) {
    if (!this.rewState) return;
    this.rewState.active = false;

    if (this._rewAnimFrame) cancelAnimationFrame(this._rewAnimFrame);
    if (this._rewKeyHandler) window.removeEventListener('keydown', this._rewKeyHandler);

    const overlay = document.getElementById('rew-hack-overlay');
    if (overlay) overlay.remove();

    if (success) {
      // Mark mission as completed + give rewards
      safeAdd(store.state.completedMissions, this.activeMission.id);
      const m = this.activeMission;
      const usdEarned = Math.floor(m.reward.usd * this.getGlobalMultiplier());
      const mbEarned = Math.floor(m.reward.mb * this.getGlobalMultiplier());
      store.state.creditsUSD += usdEarned;
      this.addData(mbEarned);
      store.state.blueprintsBP += (m.reward.bp || 0);
      if (m.reward.salvage) {
        Object.keys(m.reward.salvage).forEach(k => {
          store.state.salvage[k] = (store.state.salvage[k] || 0) + m.reward.salvage[k];
        });
      }

      if (window.tacticalAudio) window.tacticalAudio.playMissionVictory();
      this.addNotification('✅ РЭБ-ВЗЛОМ УСПЕШЕН', `Все каналы подавлены! +$${usdEarned.toLocaleString()} +${mbEarned} МБ`);
    } else {
      if (window.tacticalAudio) window.tacticalAudio.playAlertAlarm();
      this.addNotification('❌ ВЗЛОМ ПРОВАЛЕН', 'Противник обнаружил вмешательство! Каналы восстановлены.');
    }

    this.renderCampaignDOM();
    this.saveGame();
    this.updateUI();
  }

  // =========================================================================
  // STANDARD STRIKE MISSIONS — 3D Boat Sortie + FPV
  // =========================================================================
  start3DMissionSortie(missionId) {
    let found = null;
    let foundAct = null;
    for (const act of CAMPAIGN_ACTS_DEF) {
      const m = act.missions.find(item => item.id === missionId);
      if (m) { found = m; foundAct = act; break; }
    }
    if (!found) {
      found = {
        id: missionId || 'test_sortie',
        code: 'TEST-001 // ТАКТИЧЕСКИЙ ВЫХОД',
        title: missionId === 'sonar_test' ? 'Испытания 3D-Сонара' : (missionId === 'drift_test' ? 'Тест-драйв VSA / Дрифт' : 'Боевое патрулирование'),
        desc: 'Испытание бортовых систем, манёвренности катера и гидродинамики.',
        phases: ['Выход в квадрат', 'Тестирование систем', 'Возврат на базу'],
        reward: { usd: 3500, mb: 100, bp: 0, salvage: { box: 1 } },
        enemies: [{ type: 'patrol_boat', name: 'Учебный катер «Раптор»', count: 1 }]
      };
      foundAct = CAMPAIGN_ACTS_DEF[0];
    }

    this.activeMission = found;
    this.sortieActive = true;
    this.fpvFlightPhase = false;
    this.sortieTimeLeft = 300; // 5 minutes
    this.sortieStats = {
      crates: 0,
      totalCrates: 3,
      hitMines: 0,
      detected: 0,
      flakHitsTaken: 0,
      targetSubsystem: null,
      startTime: Date.now()
    };
    this.inputState = { throttle: 0, steer: 0, boost: false, fpvPitch: 0, fpvYaw: 0 };

    // Close any open modals
    document.querySelectorAll('.help-modal-overlay, .tactical-modal-overlay').forEach(el => el.classList.remove('active'));

    // Switch weather / sector if specified
    if (foundAct.sector && this.currentSector !== foundAct.sector) {
      this.changeSector(foundAct.sector);
    }

    // Hide base HUD, show 3D Mission Boat Cockpit Overlay
    const gameFrame = document.getElementById('game-frame');
    if (gameFrame) gameFrame.style.display = 'none';

    const fpvOverlay = document.getElementById('fpv-flight-overlay');
    if (fpvOverlay) {
      fpvOverlay.classList.add('mission-hud-hidden');
      fpvOverlay.style.display = 'none';
    }

    const cockpit = document.getElementById('mission-cockpit-overlay');
    if (cockpit) {
      cockpit.classList.remove('mission-hud-hidden');
      cockpit.style.display = 'flex';
    }

    // Setup HUD labels
    const badgeEl = document.getElementById('hud-mission-code');
    if (badgeEl) badgeEl.textContent = `ОПЕРАЦИЯ: «${found.title}»`;

    // Configure 3D Engine Mission World
    const mission3DConfig = {
      type: 'sortie',
      mineCount: foundAct.act === 1 ? 6 : (foundAct.act === 2 ? 8 : 12),
      crateCount: 3,
      searchlightCount: foundAct.act >= 2 ? 3 : 1,
      targetDist: 120 + foundAct.act * 25,
      targetLabel: found.title,
      lootPool: ['Микрочип GaN', 'Титановый сплав', 'Чёрный ящик', 'Шифровальный ключ']
    };

    if (this.engine3D) {
      this.engine3D.startPilotMission(mission3DConfig, (event, data) => this.handle3DMissionEvent(event, data));
    }

    // Start mission loop & inputs
    this.initPilotInputListeners();
    this.startSortieTimer();

    this.addNotification('⚓ ВЫЛАЗКА НАЧАТА', `Прорывайтесь на катере к цели или запустите FPV-дрон!`);
    if (window.tacticalAudio) window.tacticalAudio.playCritPing();
  }

  startFpvFlightPhase() {
    if (!this.sortieActive || this.fpvFlightPhase || !this.engine3D) return;
    this.fpvFlightPhase = true;

    // Switch HUD from Boat Cockpit to FPV OSD
    const boatCockpit = document.getElementById('mission-cockpit-overlay');
    if (boatCockpit) {
      boatCockpit.classList.add('mission-hud-hidden');
      boatCockpit.style.display = 'none';
    }

    const fpvOverlay = document.getElementById('fpv-flight-overlay');
    if (fpvOverlay) {
      fpvOverlay.classList.remove('mission-hud-hidden');
      fpvOverlay.style.display = 'flex';
    }

    // Start FPV Drone Flight in 3D Engine
    this.engine3D.startFpvFlight((event, data) => this.handle3DMissionEvent(event, data));

    this.showMissionWarning('🚀 FPV-ШТУРМ НАЧАТ: Наводитесь на уязвимые узлы корабля противника!');
    if (window.tacticalAudio) window.tacticalAudio.playPhaseTransition();
  }

  handle3DMissionEvent(event, data) {
    if (!this.sortieActive) return;

    if (event === 'mine_hit') {
      if (window.tacticalAudio) window.tacticalAudio.playHeavyExplosion();
      this.showMissionWarning('💥 ПОДРЫВ НА МИНЕ! -35 HP КОРПУСА');
      this.sortieStats.hitMines++;
      if (data.hp <= 0) {
        this.finishSortie(false, 'Корпус катера уничтожен серией взрывов морских мин');
      }
    } else if (event === 'crate_collected') {
      if (window.tacticalAudio) window.tacticalAudio.playSalvagePickup();
      if (!this.sortieStats) this.sortieStats = { crates: 0, totalCrates: 3 };
      this.sortieStats.crates = data.collected;
      this.sortieStats.totalCrates = data.total;
      this.showMissionWarning(`📦 ГРУЗ СОБРАН: ${data.loot} (${data.collected}/${data.total})`);
      const cratesEl = document.getElementById('hud-val-crates');
      if (cratesEl) cratesEl.textContent = `${data.collected} / ${data.total}`;
    } else if (event === 'searchlight_detected') {
      this.showMissionWarning('⚠️ ВНИМАНИЕ: ВАС ЗАСЕКЛИ! ОГОНЬ БЕРЕГОВОЙ БАТАРЕИ!');
      this.sortieStats.detected++;
    } else if (event === 'tracer_hit') {
      if (window.tacticalAudio) window.tacticalAudio.playEnemyShoot();
      this.showMissionWarning('⚡ ПОПАДАНИЕ СНАРЯДА! -8 HP');
      if (data.hp <= 0) {
        this.finishSortie(false, 'Катер потоплен огнём береговой артиллерии');
      }
    } else if (event === 'waypoint_reached') {
      if (window.tacticalAudio) window.tacticalAudio.playTargetLock();
      this.showMissionWarning('🎯 ЗОНА ЦЕЛИ ДОСТИГНУТА! НАЖМИТЕ [ПУСК FPV] ДЛЯ УДАРА!');
    } else if (event === 'fpv_damaged') {
      this.sortieStats.flakHitsTaken++;
      const glitchLayer = document.getElementById('fpv-glitch-layer');
      if (glitchLayer) {
        glitchLayer.classList.add('fpv-glitched');
        setTimeout(() => glitchLayer.classList.remove('fpv-glitched'), 200);
      }
    } else if (event === 'fpv_crashed') {
      this.finishSortie(false, data.reason || 'FPV-дрон потерпел крушение');
    } else if (event === 'fpv_target_hit') {
      this.sortieStats.targetSubsystem = data.subsystem || 'Ходовой мостик';
      this.sortieStats.damageBonus = data.damageBonus;
      this.sortieStats.scoreMult = data.scoreMult || 1.5;
      
      // Delay slightly for cinematic explosion & sinking to play
      setTimeout(() => {
        this.finishSortie(true, 'Успешный удар');
      }, 2800);
    }
  }

  showMissionWarning(text) {
    const banner = document.getElementById('hud-warning-banner');
    if (banner) {
      banner.textContent = text;
      banner.style.display = 'block';
      clearTimeout(this._warnTimer);
      this._warnTimer = setTimeout(() => {
        if (banner) banner.textContent = '⚠️ ВНИМАНИЕ: МИННОЕ ПОЛЕ // ЛУЧИ ПРОЖЕКТОРОВ';
      }, 3500);
    }
  }

  initPilotInputListeners() {
    if (this._pilotInputsBound) return;
    this._pilotInputsBound = true;

    // 1. Keyboard Controls (PC)
    window.addEventListener('keydown', (e) => {
      if (!this.sortieActive) return;

      if (!this.fpvFlightPhase) {
        // Boat Mode Controls
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputState.throttle = 1.0;
        else if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputState.throttle = -0.6;
        else if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputState.steer = -0.75;
        else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputState.steer = 0.75;
        else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.inputState.boost = true;
        else if (e.code === 'Space') {
          e.preventDefault();
          this.startFpvFlightPhase();
        }
        this.applyPilotInputs();
      } else {
        // FPV Drone Mode Controls
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.inputState.fpvPitch = -0.9; // Nose down (dive / accelerate)
        else if (e.code === 'KeyS' || e.code === 'ArrowDown') this.inputState.fpvPitch = 0.9;  // Nose up (climb)
        else if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.inputState.fpvYaw = -0.8;  // Bank / Yaw left
        else if (e.code === 'KeyD' || e.code === 'ArrowRight') this.inputState.fpvYaw = 0.8;   // Bank / Yaw right
        else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.inputState.boost = true;
        else if (e.code === 'KeyH') {
          // HOVER MODE toggle
          this.inputState.hover = !this.inputState.hover;
          if (this.engine3D) this.engine3D.fpvHover = this.inputState.hover;
          this.showMissionWarning(this.inputState.hover ? '🚁 РЕЖИМ ЗАВИСАНИЯ — дрон стабилизирован' : '🚁 ПОЛЁТ ВОЗОБНОВЛЁН');
        }
        else if (e.code === 'Space') {
          e.preventDefault();
          // In recon mode, Space is photo — don't use for boost
          if (!this.reconState) {
            this.inputState.boost = true;
          }
        }
        this.applyFpvInputs();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.sortieActive) return;

      if (!this.fpvFlightPhase) {
        if ((e.code === 'KeyW' || e.code === 'ArrowUp') && this.inputState.throttle > 0) this.inputState.throttle = 0;
        else if ((e.code === 'KeyS' || e.code === 'ArrowDown') && this.inputState.throttle < 0) this.inputState.throttle = 0;
        else if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && this.inputState.steer < 0) this.inputState.steer = 0;
        else if ((e.code === 'KeyD' || e.code === 'ArrowRight') && this.inputState.steer > 0) this.inputState.steer = 0;
        else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.inputState.boost = false;
        this.applyPilotInputs();
      } else {
        if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyS' || e.code === 'ArrowDown') this.inputState.fpvPitch = 0;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') this.inputState.fpvYaw = 0;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') this.inputState.boost = false;
        this.applyFpvInputs();
      }
    });

    // 2. Mobile Touch Virtual Joystick for Boat
    const joyZone = document.getElementById('virtual-joystick-zone');
    const joyThumb = document.getElementById('joystick-thumb-knob');
    if (joyZone && joyThumb) {
      let touchId = null;
      let startX = 0, startY = 0;
      const maxR = 45;

      joyZone.addEventListener('touchstart', (e) => {
        if (!this.sortieActive || this.fpvFlightPhase) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = joyZone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }, { passive: false });

      joyZone.addEventListener('touchmove', (e) => {
        if (!this.sortieActive || this.fpvFlightPhase) return;
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(maxR, dist);
            const angle = Math.atan2(dy, dx);
            const nx = Math.cos(angle) * (clampedDist / maxR);
            const ny = Math.sin(angle) * (clampedDist / maxR);

            this.inputState.steer = nx * 0.8;
            this.inputState.throttle = -ny * 1.0;
            joyThumb.style.transform = `translate(${nx * maxR}px, ${ny * maxR}px)`;
            this.applyPilotInputs();
            break;
          }
        }
      }, { passive: false });

      const onTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            joyThumb.style.transform = 'translate(0px, 0px)';
            this.inputState.steer = 0;
            this.inputState.throttle = 0;
            this.applyPilotInputs();
            break;
          }
        }
      };
      joyZone.addEventListener('touchend', onTouchEnd);
      joyZone.addEventListener('touchcancel', onTouchEnd);
    }

    // 3. FPV Touch Flight Joystick (Mobile)
    const fpvJoyZone = document.getElementById('fpv-joystick-zone');
    const fpvJoyThumb = document.getElementById('fpv-joystick-thumb');
    if (fpvJoyZone && fpvJoyThumb) {
      let touchId = null;
      let startX = 0, startY = 0;
      const maxR = 45;

      fpvJoyZone.addEventListener('touchstart', (e) => {
        if (!this.sortieActive || !this.fpvFlightPhase) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = fpvJoyZone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }, { passive: false });

      fpvJoyZone.addEventListener('touchmove', (e) => {
        if (!this.sortieActive || !this.fpvFlightPhase) return;
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(maxR, dist);
            const angle = Math.atan2(dy, dx);
            const nx = Math.cos(angle) * (clampedDist / maxR);
            const ny = Math.sin(angle) * (clampedDist / maxR);

            this.inputState.fpvYaw = nx * 0.9;
            this.inputState.fpvPitch = ny * 0.9;
            fpvJoyThumb.style.transform = `translate(${nx * maxR}px, ${ny * maxR}px)`;
            this.applyFpvInputs();
            break;
          }
        }
      }, { passive: false });

      const onFpvTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            fpvJoyThumb.style.transform = 'translate(0px, 0px)';
            this.inputState.fpvYaw = 0;
            this.inputState.fpvPitch = 0;
            this.applyFpvInputs();
            break;
          }
        }
      };
      fpvJoyZone.addEventListener('touchend', onFpvTouchEnd);
      fpvJoyZone.addEventListener('touchcancel', onFpvTouchEnd);
    }

    // 4. Action Buttons
    const btnBoost = document.getElementById('btn-mission-boost');
    if (btnBoost) {
      btnBoost.addEventListener('pointerdown', () => {
        this.inputState.boost = true;
        btnBoost.classList.add('active');
        this.applyPilotInputs();
      });
      const endBoost = () => {
        this.inputState.boost = false;
        btnBoost.classList.remove('active');
        this.applyPilotInputs();
      };
      btnBoost.addEventListener('pointerup', endBoost);
      btnBoost.addEventListener('pointerleave', endBoost);
    }

    const btnStrike = document.getElementById('btn-mission-strike');
    if (btnStrike) {
      btnStrike.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startFpvFlightPhase();
      });
    }

    const btnFpvBoost = document.getElementById('btn-fpv-boost');
    if (btnFpvBoost) {
      btnFpvBoost.addEventListener('pointerdown', () => {
        this.inputState.boost = true;
        btnFpvBoost.classList.add('active');
        this.applyFpvInputs();
      });
      const endFpvBoost = () => {
        this.inputState.boost = false;
        btnFpvBoost.classList.remove('active');
        this.applyFpvInputs();
      };
      btnFpvBoost.addEventListener('pointerup', endFpvBoost);
      btnFpvBoost.addEventListener('pointerleave', endFpvBoost);
    }

    const btnFpvDetonate = document.getElementById('btn-fpv-detonate');
    if (btnFpvDetonate) {
      btnFpvDetonate.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.engine3D) {
          this.engine3D.triggerShipExplosion();
          this.finishSortie(true, 'Ручная детонация в зоне цели');
        }
      });
    }

    // HOVER MODE button (mobile)
    const btnFpvHover = document.getElementById('btn-fpv-hover');
    if (btnFpvHover) {
      btnFpvHover.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inputState.hover = !this.inputState.hover;
        if (this.engine3D) this.engine3D.fpvHover = this.inputState.hover;
        btnFpvHover.classList.toggle('active', this.inputState.hover);
        btnFpvHover.querySelector('span').textContent = this.inputState.hover ? '🚁 ПОЛЁТ' : '🚁 HOVER';
        this.showMissionWarning(this.inputState.hover ? '🚁 РЕЖИМ ЗАВИСАНИЯ — дрон стабилизирован' : '🚁 ПОЛЁТ ВОЗОБНОВЛЁН');
        this.applyFpvInputs();
      });
    }

    // PHOTO CAPTURE button (mobile recon)
    const btnFpvPhoto = document.getElementById('btn-fpv-photo');
    if (btnFpvPhoto) {
      btnFpvPhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.reconState) {
          this._attemptReconPhoto();
        }
      });
    }

    const btnAbort = document.getElementById('btn-abort-sortie');
    if (btnAbort) {
      btnAbort.addEventListener('click', (e) => {
        e.stopPropagation();
        this.finishSortie(false, 'Экстренная эвакуация по решению оператора');
      });
    }

    // Game Over & Victory Modal Buttons
    const btnGameoverRetry = document.getElementById('btn-gameover-retry');
    if (btnGameoverRetry) {
      btnGameoverRetry.addEventListener('click', () => {
        const modal = document.getElementById('mission-gameover-modal');
        if (modal) modal.classList.remove('active');
        if (this.activeMission) {
          this.start3DMissionSortie(this.activeMission.id);
        }
      });
    }

    const btnGameoverBase = document.getElementById('btn-gameover-base');
    if (btnGameoverBase) {
      btnGameoverBase.addEventListener('click', () => {
        const modal = document.getElementById('mission-gameover-modal');
        if (modal) modal.classList.remove('active');
      });
    }

    const btnVictoryRetry = document.getElementById('btn-victory-retry');
    if (btnVictoryRetry) {
      btnVictoryRetry.addEventListener('click', () => {
        const modal = document.getElementById('mission-victory-modal');
        if (modal) modal.classList.remove('active');
        if (this.activeMission) {
          this.start3DMissionSortie(this.activeMission.id);
        }
      });
    }

    const btnVictoryClaim = document.getElementById('btn-victory-claim');
    if (btnVictoryClaim) {
      btnVictoryClaim.addEventListener('click', () => {
        const modal = document.getElementById('mission-victory-modal');
        if (modal) modal.classList.remove('active');
      });
    }
  }

  applyPilotInputs() {
    if (this.engine3D && !this.fpvFlightPhase) {
      this.engine3D.setPilotInput(this.inputState.throttle, this.inputState.steer, this.inputState.boost);
    }
  }

  applyFpvInputs() {
    if (this.engine3D && this.fpvFlightPhase) {
      const throttle = this.inputState.hover ? 0.0 : 0.8;
      this.engine3D.setFpvInput(this.inputState.fpvYaw, this.inputState.fpvPitch, throttle, this.inputState.boost);
    }
  }

  // Recon HUD update: show proximity and 3D screen projection for nearest unfound target
  _updateReconHUD() {
    if (!this.reconState || !this.engine3D) return;

    const screenTargets = this.engine3D.getReconTargetsScreenInfo();
    const unfound = screenTargets.filter(t => {
      const match = this.reconState.targetPositions[t.idx];
      return match && !match.found;
    });

    if (unfound.length === 0) return;

    // Find closest target
    unfound.sort((a, b) => a.dist - b.dist);
    const nearest = unfound[0];
    const foundCount = this.reconState.targetsFound;
    const totalCount = this.reconState.targetsTotal;

    // 1. Update Top Objective Banner
    const bannerEl = document.getElementById('recon-objective-banner');
    if (bannerEl) {
      if (nearest.dist <= 45) {
        bannerEl.innerHTML = `🎯 <b>${nearest.name} В ПРИЦЕЛЕ (${nearest.dist}м)!</b> НАЖМИТЕ <b>[ПРОБЕЛ]</b> ИЛИ КНОПКУ <b>[📸 СНИМОК]</b>!`;
        bannerEl.style.borderColor = '#00ff88';
        bannerEl.style.color = '#00ff88';
      } else {
        bannerEl.innerHTML = `🔭 <b>ЭТАП [${foundCount + 1}/${totalCount}]:</b> Подлетите к <b>${nearest.name}</b> (${nearest.dist}м прямо) | [H] Зависнуть | [ПРОБЕЛ] Снимок`;
        bannerEl.style.borderColor = '#00ffcc';
        bannerEl.style.color = '#00ffcc';
      }
    }

    // 2. Update Navigation Compass Arrow
    const compassIcon = document.getElementById('compass-pointer-icon');
    const compassLabel = document.getElementById('recon-compass-label');
    if (compassIcon && compassLabel) {
      const bDeg = nearest.bearingDeg || 0;
      compassIcon.style.transform = `rotate(${bDeg}deg)`;
      compassLabel.textContent = `КУРС: ${bDeg >= 0 ? '+' : ''}${bDeg}° // ${nearest.dist}м`;
      if (nearest.dist <= 45) {
        compassIcon.classList.add('locked');
      } else {
        compassIcon.classList.remove('locked');
      }
    }

    // 3. Update 3D Screen Space Waypoint Reticle
    const reticleEl = document.getElementById('recon-waypoint-reticle');
    const tagEl = document.getElementById('wp-target-tag');
    const snapBtn = document.getElementById('btn-recon-snap');
    const mainCrosshair = document.getElementById('fpv-main-crosshair');

    if (reticleEl && tagEl) {
      reticleEl.style.display = 'block';

      // If target is in front of camera
      if (nearest.inFront) {
        const clampedX = Math.max(40, Math.min(window.innerWidth - 40, nearest.screenX));
        const clampedY = Math.max(40, Math.min(window.innerHeight - 80, nearest.screenY));
        reticleEl.style.left = `${clampedX}px`;
        reticleEl.style.top = `${clampedY}px`;
      } else {
        // Target is behind drone — point arrow towards edge
        const edgeX = nearest.rawX > 0 ? window.innerWidth - 40 : 40;
        reticleEl.style.left = `${edgeX}px`;
        reticleEl.style.top = `50%`;
      }

      tagEl.textContent = `🎯 ${nearest.name} [${nearest.dist}м]`;

      // Lock-On State (< 45m)
      if (nearest.dist <= 45) {
        reticleEl.classList.add('locked');
        if (snapBtn) snapBtn.style.display = 'block';
        if (mainCrosshair) mainCrosshair.style.borderColor = '#00ff88';

        if (!this.reconState.lockedAudioPlayed && window.tacticalAudio) {
          window.tacticalAudio.playTargetLock();
          this.reconState.lockedAudioPlayed = true;
        }
      } else {
        reticleEl.classList.remove('locked');
        if (snapBtn) snapBtn.style.display = 'none';
        if (mainCrosshair) mainCrosshair.style.borderColor = '';
        this.reconState.lockedAudioPlayed = false;
      }
    }

    // 4. Update FPV top OSD chip
    const reconOsd = document.getElementById('fpv-osd-recon-info');
    if (!reconOsd) {
      const topOsd = document.querySelector('.fpv-top-osd');
      if (topOsd) {
        const el = document.createElement('span');
        el.id = 'fpv-osd-recon-info';
        el.className = 'fpv-osd-chip';
        topOsd.appendChild(el);
      }
    }
    const infoEl = document.getElementById('fpv-osd-recon-info');
    if (infoEl) {
      if (nearest.dist <= 45) {
        infoEl.textContent = `📸 НАЖМИТЕ ПРОБЕЛ // ${nearest.name} [${nearest.dist}м]`;
        infoEl.style.color = '#00ff88';
        infoEl.style.animation = 'fpvAlertBlink 0.4s infinite alternate';
      } else {
        infoEl.textContent = `🔭 ${nearest.name}: ${nearest.dist}м [${foundCount}/${totalCount}]`;
        infoEl.style.color = '#00ccff';
        infoEl.style.animation = '';
      }
    }
  }

  startSortieTimer() {
    clearInterval(this._sortieInterval);
    this._sortieInterval = setInterval(() => {
      if (!this.sortieActive) {
        clearInterval(this._sortieInterval);
        return;
      }
      this.sortieTimeLeft--;

      // Update timer HUD
      const m = Math.floor(this.sortieTimeLeft / 60);
      const s = this.sortieTimeLeft % 60;
      const timeStr = `⏱️ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      const timerEl = document.getElementById('hud-mission-timer');
      if (timerEl) timerEl.textContent = timeStr;

      const fpvTimerEl = document.getElementById('fpv-osd-timer');
      if (fpvTimerEl) fpvTimerEl.textContent = timeStr;

      if (this.sortieTimeLeft <= 0) {
        this.finishSortie(false, 'Время операции истекло // Топливные баки пусты');
      }

      this.updateSortieTelemetryHUD();
    }, 100);
  }

  updateSortieTelemetryHUD() {
    if (!this.sortieActive || !this.engine3D) return;
    const telem = this.engine3D.getPilotTelemetry();

    if (telem.isFpv) {
      // Hide boat nav arrow when in FPV
      const boatNav = document.getElementById('boat-nav-arrow');
      if (boatNav) boatNav.style.display = 'none';
      // 1. Update FPV OSD HUD
      const spdEl = document.getElementById('fpv-val-spd');
      if (spdEl) spdEl.textContent = telem.speedKmh;

      const altEl = document.getElementById('fpv-val-alt');
      if (altEl) altEl.textContent = telem.altM;

      const distEl = document.getElementById('fpv-val-dist');
      if (distEl) distEl.textContent = telem.distToTarget;

      const batEl = document.getElementById('fpv-osd-bat');
      if (batEl) {
        batEl.textContent = `🔋 ${telem.batteryVolts}V (${telem.batteryPct}%)`;
        batEl.style.color = telem.batteryPct > 40 ? '#00ff88' : (telem.batteryPct > 20 ? '#ffcc00' : '#ff3333');
      }

      const rssiEl = document.getElementById('fpv-osd-rssi');
      if (rssiEl) {
        const signalDbm = Math.max(-90, -35 - Math.round(telem.distToTarget * 0.35));
        rssiEl.textContent = `📶 RSSI: ${signalDbm}dBm`;
      }

      // Pitch Ladder transform
      const pitchLadder = document.getElementById('fpv-pitch-ladder');
      if (pitchLadder) {
        pitchLadder.style.transform = `translateY(${telem.pitchDeg * 2.5}px) rotate(${telem.rollDeg}deg)`;
      }

      // Lock on bracket
      const bracketEl = document.getElementById('fpv-target-bracket');
      const bracketTag = document.getElementById('fpv-target-tag');
      if (bracketEl && bracketTag) {
        if (telem.lockTarget) {
          bracketEl.style.display = 'flex';
          bracketTag.textContent = `🎯 [${telem.lockTarget.name}] ${telem.lockTarget.dist}м`;
        } else {
          bracketEl.style.display = 'none';
        }
      }

      // CIWS Warning Alert
      const ciwsAlert = document.getElementById('fpv-ciws-alert');
      if (ciwsAlert) {
        ciwsAlert.style.display = telem.ciwsActive ? 'block' : 'none';
      }

      // Bearing Direction Arrow to Target (top of FPV OSD)
      let bearingEl = document.getElementById('fpv-bearing-arrow');
      if (!bearingEl) {
        bearingEl = document.createElement('div');
        bearingEl.id = 'fpv-bearing-arrow';
        bearingEl.style.cssText = 'position:fixed; top:18%; left:50%; transform:translateX(-50%); font-size:20px; font-family:monospace; font-weight:bold; color:#ff4400; text-shadow:0 0 12px #ff2200, 0 0 24px rgba(255,34,0,0.5); z-index:200; text-align:center; pointer-events:none; letter-spacing:2px;';
        document.body.appendChild(bearingEl);
      }
      if (telem.bearingArrow && telem.distToTarget > 12) {
        bearingEl.style.display = 'block';
        bearingEl.innerHTML = `<div style="font-size:15px;color:#ff8844;">🎯 ЦЕЛЬ: ${telem.distToTarget}м</div><div style="font-size:22px;margin-top:3px;">${telem.bearingArrow}</div>`;
      } else if (telem.distToTarget <= 12) {
        bearingEl.style.display = 'block';
        bearingEl.innerHTML = `<div style="font-size:18px;color:#ff0000;animation:fpvAlertBlink 0.4s infinite alternate;">⚠️ ЦЕЛЬ РЯДОМ — АТАКУЙ!</div>`;
      } else {
        bearingEl.style.display = 'none';
      }
    } else {
      // Hide FPV bearing arrow when in boat mode
      const fpvNav = document.getElementById('fpv-bearing-arrow');
      if (fpvNav) fpvNav.style.display = 'none';
      // 2. Update Boat Cockpit HUD
      const speedEl = document.getElementById('hud-val-speed');
      if (speedEl) speedEl.textContent = telem.speedKnots;

      const hpEl = document.getElementById('hud-val-hp');
      const hpFill = document.getElementById('hud-fill-hp');
      if (hpEl) {
        hpEl.textContent = `${telem.hullHP}%`;
        hpEl.className = telem.hullHP > 50 ? 'text-green' : (telem.hullHP > 25 ? 'text-yellow' : 'text-red');
      }
      if (hpFill) {
        hpFill.style.width = `${telem.hullHP}%`;
        hpFill.style.background = telem.hullHP > 50 ? 'linear-gradient(90deg, #00ff88, #00f0ff)' : (telem.hullHP > 25 ? '#ffcc00' : '#ff4444');
      }

      const distEl = document.getElementById('hud-val-target');
      if (distEl) distEl.textContent = `${telem.distToTarget} м`;

      const cratesEl = document.getElementById('hud-val-crates');
      if (cratesEl) cratesEl.textContent = `${telem.cratesCollected} / ${telem.totalCrates}`;

      // Depth sounder & Shallow warning
      const depthVal = document.getElementById('hud-val-depth');
      if (depthVal && telem.depthM) depthVal.textContent = `${telem.depthM} м`;

      const shallowBadge = document.getElementById('hud-shallow-badge');
      if (shallowBadge) {
        shallowBadge.style.display = telem.isShallow ? 'inline-block' : 'none';
      }

      // VSA & DPS toggle button states
      const vsaBtn = document.getElementById('btn-mission-vsa');
      const vsaText = document.getElementById('hud-vsa-text');
      if (vsaBtn && vsaText) {
        vsaBtn.classList.toggle('active', telem.vsaEnabled);
        vsaText.textContent = telem.vsaEnabled ? 'VSA: ВКЛ' : 'VSA: ВЫКЛ (ДРИФТ)';
      }

      const dpsBtn = document.getElementById('btn-mission-dps');
      const dpsText = document.getElementById('hud-dps-text');
      if (dpsBtn && dpsText) {
        dpsBtn.classList.toggle('active', telem.dpsActive);
        dpsText.textContent = telem.dpsActive ? 'DPS: УДЕРЖАНИЕ' : 'DPS: ВЫКЛ';
      }

      // Draw Sonar Waterfall if open
      if (this.sonarActive) {
        this.drawSonarWaterfall();
      }

      // ROV Magnetometer HUD update
      if (telem.rovActive) {
        if (this.rovMagVal) this.rovMagVal.textContent = `${telem.magnetometerNt.toLocaleString()} nT`;
        if (this.rovMagFill) {
          const norm = Math.min(100, Math.max(0, (telem.magnetometerNt - 48000) / 40));
          this.rovMagFill.style.width = `${norm}%`;
        }
        if (this.rovSiphonPct) this.rovSiphonPct.textContent = `${telem.siphonProgress}%`;
        if (this.rovSiphonFill) this.rovSiphonFill.style.width = `${telem.siphonProgress}%`;
      }
    }
  }

  finishSortie(isVictory, reason = '') {
    if (!this.sortieActive) return;
    this.sortieActive = false;
    clearInterval(this._sortieInterval);

    // Stop 3D Pilot and FPV modes
    if (this.engine3D) {
      if (this.fpvFlightPhase) this.engine3D.stopFpvFlight();
      this.engine3D.stopPilotMission();
    }

    // Clean up mission nav HUD elements
    ['boat-nav-arrow', 'fpv-bearing-arrow'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    // Hide Cockpit Overlays, show Base HUD
    const cockpit = document.getElementById('mission-cockpit-overlay');
    if (cockpit) {
      cockpit.classList.add('mission-hud-hidden');
      cockpit.style.display = 'none';
    }
    const fpvOverlay = document.getElementById('fpv-flight-overlay');
    if (fpvOverlay) {
      fpvOverlay.classList.add('mission-hud-hidden');
      fpvOverlay.style.display = 'none';
    }
    const gameFrame = document.getElementById('game-frame');
    if (gameFrame) gameFrame.style.display = 'flex';

    const currentSortieStats = this.sortieStats || { startTime: Date.now(), scoreMult: 1.5 };
    const missionElapsedSec = Math.round((Date.now() - currentSortieStats.startTime) / 1000);
    const m = this.activeMission || { reward: { usd: 0, mb: 0, bp: 0 } };

    if (isVictory) {
      // 🏆 VICTORY TRIUMPH MODAL
      if (m && m.id) safeAdd(store.state.completedMissions, m.id);

      const scoreMult = currentSortieStats.scoreMult || 1.5;
      const usdEarned = Math.floor(m.reward.usd * 1.8 * scoreMult * this.getGlobalMultiplier());
      const mbEarned = Math.floor(m.reward.mb * 1.8 * scoreMult * this.getGlobalMultiplier());
      const bpEarned = m.reward.bp || 1;

      store.state.creditsUSD += usdEarned;
      this.addData(mbEarned);
      store.state.blueprintsBP += bpEarned;
      store.state.sunkenShips++;
      store.state.salvage.box = (store.state.salvage.box || 0) + 3;
      store.state.salvage.chips = (store.state.salvage.chips || 0) + 4;
      store.state.salvage.titanium = (store.state.salvage.titanium || 0) + 3;

      // Calculate Battle Rating (S / A / B)
      let rank = 'S';
      if (this.sortieStats.flakHitsTaken > 2 || missionElapsedSec > 80) rank = 'A';
      if (this.sortieStats.hitMines > 1 || missionElapsedSec > 110) rank = 'B';

      const victoryModal = document.getElementById('mission-victory-modal');
      const rankBadge = document.getElementById('victory-rank-badge');
      const hitSubTitle = document.getElementById('victory-hit-sub');
      const statsEl = document.getElementById('victory-stats');

      if (rankBadge) rankBadge.textContent = `РАНГ: ${rank} (${rank === 'S' ? 'ИДЕАЛЬНЫЙ ШТУРМ' : (rank === 'A' ? 'ОТЛИЧНЫЙ ПРОРЫВ' : 'УСПЕШНАЯ ОПЕРАЦИЯ')})`;
      if (hitSubTitle) hitSubTitle.textContent = `${this.sortieStats.targetSubsystem || 'Ходовой мостик'} (${this.sortieStats.damageBonus || 'CRITICAL KILL x2.0'})`;

      if (statsEl) {
        statsEl.innerHTML = `
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">КУШ КРЕДИТОВ</div>
            <div class="debrief-stat-val text-green">+$${usdEarned.toLocaleString()}</div>
          </div>
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">РАЗВЕДДАННЫЕ</div>
            <div class="debrief-stat-val text-cyan">+${mbEarned} МБ</div>
          </div>
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">ЧЕРТЕЖИ ПРЕСТИЖА</div>
            <div class="debrief-stat-val text-yellow">+${bpEarned} ЧЖ</div>
          </div>
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">ТРОФЕЙНЫЙ ЛУТ</div>
            <div class="debrief-stat-val text-cyan">📦x3 💎x4 🛡️x3</div>
          </div>
        `;
      }

      if (victoryModal) victoryModal.classList.add('active');
      if (window.tacticalAudio) {
        window.tacticalAudio.playMissionVictory();
        window.tacticalAudio.playRatingReveal(rank);
      }
      this.addNotification('🏆 ОПЕРАЦИЯ ВЫПОЛНЕНА', `Вражеский корабль уничтожен! Получено: +$${usdEarned.toLocaleString()}`);
    } else {
      // 💀 GAME OVER MODAL (THE END)
      const gameoverModal = document.getElementById('mission-gameover-modal');
      const reasonEl = document.getElementById('gameover-reason');
      const statsEl = document.getElementById('gameover-stats');

      if (reasonEl) reasonEl.textContent = reason || 'Катер потерпел крушение // Связь с экипажем потеряна';

      // Partial salvage preserved
      const crates = this.sortieStats ? (this.sortieStats.crates || 0) : 0;
      const totalCrates = this.sortieStats ? (this.sortieStats.totalCrates || 3) : 3;
      const salvagedCredits = Math.floor(m.reward.usd * 0.25 * (crates / Math.max(1, totalCrates)));
      if (salvagedCredits > 0) store.state.creditsUSD += salvagedCredits;

      if (statsEl) {
        statsEl.innerHTML = `
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">ВРЕМЯ В БОЮ</div>
            <div class="debrief-stat-val text-yellow">${missionElapsedSec} сек</div>
          </div>
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">СОБРАНО ГРУЗОВ</div>
            <div class="debrief-stat-val text-cyan">${this.sortieStats.crates} / ${this.sortieStats.totalCrates}</div>
          </div>
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">КОМПЕНСАЦИЯ</div>
            <div class="debrief-stat-val text-green">+$${salvagedCredits.toLocaleString()}</div>
          </div>
          <div class="debrief-stat-box">
            <div class="debrief-stat-label">СТАТУС МИССИИ</div>
            <div class="debrief-stat-val text-red">ПРОВАЛЕНО</div>
          </div>
        `;
      }

      if (gameoverModal) gameoverModal.classList.add('active');
      if (window.tacticalAudio) {
        window.tacticalAudio.playEmpExplosion();
        window.tacticalAudio.playAlertAlarm();
      }
    }

    this.renderCampaignDOM();
    this.renderHangarDOM();
    this.saveGame();
    this.updateUI();
  }

  // =========================================================================
  // DRONE HANGAR & SALVAGE FORGE
  // =========================================================================
  renderHangarDOM() {
    const boxEl = document.getElementById('val-salvage-box');
    const chipsEl = document.getElementById('val-salvage-chips');
    const titEl = document.getElementById('val-salvage-titanium');
    const aiEl = document.getElementById('val-salvage-aicore');

    if (boxEl) boxEl.textContent = `${store.state.salvage.box || 0} шт`;
    if (chipsEl) chipsEl.textContent = `${store.state.salvage.chips || 0} шт`;
    if (titEl) titEl.textContent = `${store.state.salvage.titanium || 0} шт`;
    if (aiEl) aiEl.textContent = `${store.state.salvage.aicore || 0} шт`;

    document.querySelectorAll('.proto-card').forEach(card => {
      const pid = card.getAttribute('data-proto');
      const isSelected = store.state.selectedPrototype === pid;
      const isUnlocked = store.state.unlockedPrototypes.includes(pid);
      const proto = DRONE_PROTOTYPES_DEF[pid];

      card.classList.toggle('selected', isSelected);
      const selectBtn = card.querySelector('.btn-proto-select');
      if (selectBtn) {
        if (isSelected) {
          selectBtn.textContent = '✓ ВЫБРАН КОРПУС';
          selectBtn.style.background = '#00ff88';
          selectBtn.style.color = '#000';
          selectBtn.disabled = true;
        } else if (isUnlocked) {
          selectBtn.textContent = 'АКТИВИРОВАТЬ';
          selectBtn.style.background = 'rgba(0, 240, 255, 0.2)';
          selectBtn.style.color = '#00f0ff';
          selectBtn.disabled = false;
        } else {
          let reqParts = [`$${proto.costUSD.toLocaleString()}`];
          if (proto.reqShips) reqParts.push(`${proto.reqShips} Вымпелов`);
          if (proto.reqSalvage) {
            for (const [res, amt] of Object.entries(proto.reqSalvage)) {
              reqParts.push(`${amt} ${res}`);
            }
          }
          selectBtn.textContent = `РАЗБЛОКИРОВАТЬ (${reqParts.join(' | ')})`;
          
          let canUnlock = store.state.creditsUSD >= proto.costUSD && (!proto.reqShips || store.state.sunkenShips >= proto.reqShips);
          if (proto.reqSalvage) {
            for (const [res, amt] of Object.entries(proto.reqSalvage)) {
              if ((store.state.salvage[res] || 0) < amt) canUnlock = false;
            }
          }
          selectBtn.style.background = canUnlock ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)';
          selectBtn.style.color = canUnlock ? '#ffcc00' : '#8da4af';
          selectBtn.disabled = !canUnlock;
        }

        selectBtn.onclick = (e) => {
          e.stopPropagation();
          this.selectDronePrototype(pid);
        };
      }
    });

    const craftGrid = document.getElementById('crafting-recipes-grid');
    if (craftGrid) {
      craftGrid.innerHTML = '';
      SALVAGE_CRAFT_RECIPES.forEach(r => {
        const isCrafted = store.state.craftedModules.includes(r.id);
        const card = document.createElement('div');
        card.className = 'craft-card';

        let costParts = [];
        let canAfford = true;
        if (r.cost.box) {
          costParts.push(`📦 ${r.cost.box} ящ`);
          if ((store.state.salvage.box || 0) < r.cost.box) canAfford = false;
        }
        if (r.cost.chips) {
          costParts.push(`💎 ${r.cost.chips} чип`);
          if ((store.state.salvage.chips || 0) < r.cost.chips) canAfford = false;
        }
        if (r.cost.titanium) {
          costParts.push(`🛡️ ${r.cost.titanium} титан`);
          if ((store.state.salvage.titanium || 0) < r.cost.titanium) canAfford = false;
        }
        if (r.cost.aicore) {
          costParts.push(`🔮 ${r.cost.aicore} ядро`);
          if ((store.state.salvage.aicore || 0) < r.cost.aicore) canAfford = false;
        }

        card.innerHTML = `
          <div>
            <div class="craft-card-header">
              <span class="craft-card-title">${r.name}</span>
              <span class="craft-card-cost">${costParts.join(' // ')}</span>
            </div>
            <div class="craft-card-effect">${r.desc}</div>
          </div>
          <button class="btn-craft-action" ${isCrafted ? 'disabled' : (!canAfford ? 'disabled' : '')}>
            ${isCrafted ? '✓ СКРАФЧЕНО (АКТИВНО)' : (canAfford ? '🛠️ СОБРАТЬ МОДУЛЬ' : 'НЕДОСТАТОЧНО ТРОФЕЕВ')}
          </button>
        `;

        card.querySelector('.btn-craft-action').addEventListener('click', (e) => {
          e.stopPropagation();
          this.craftModule(r.id);
        });

        craftGrid.appendChild(card);
      });
    }
  }

  selectDronePrototype(protoId) {
    const proto = DRONE_PROTOTYPES_DEF[protoId];
    if (!proto) return;

    if (!store.state.unlockedPrototypes.includes(protoId)) {
      if (proto.reqShips && store.state.sunkenShips < proto.reqShips) {
        this.addNotification('🔒 ЗАБЛОКИРОВАНО', `Требуется потопить ${proto.reqShips} вымпелов (Ваш счет: ${store.state.sunkenShips})`);
        return;
      }
      if (proto.reqSalvage) {
        for (const [res, amt] of Object.entries(proto.reqSalvage)) {
          if ((store.state.salvage[res] || 0) < amt) {
            this.addNotification('❌ НЕДОСТАТОЧНО ТРОФЕЕВ', `Требуется ${amt} шт. ${res.toUpperCase()}`);
            return;
          }
        }
      }
      if (store.state.creditsUSD < proto.costUSD) {
        this.addNotification('❌ НЕДОСТАТОЧНО КРЕДИТОВ', `Требуется $${proto.costUSD.toLocaleString()}`);
        return;
      }

      store.state.creditsUSD -= proto.costUSD;
      if (proto.reqSalvage) {
        for (const [res, amt] of Object.entries(proto.reqSalvage)) {
          store.state.salvage[res] -= amt;
        }
      }

      safeAdd(store.state.unlockedPrototypes, protoId);
      this.addNotification('⚓ НОВЫЙ КОРПУС', `Разблокирован: ${proto.name}!`);
      if (window.tacticalAudio) window.tacticalAudio.playMountingSfx();
    }

    store.state.selectedPrototype = protoId;
    if (this.engine3D) {
      this.engine3D.setDronePrototype(protoId);
    }
    if (window.tacticalAudio) window.tacticalAudio.playUpgradeSfx();
    this.addNotification('⚡ КОРПУС АКТИВИРОВАН', `Выбран дрон: ${proto.name}`);
    this.renderHangarDOM();
    this.saveGame();
    this._uiDirty = true;
  }

  craftModule(recipeId) {
    const r = SALVAGE_CRAFT_RECIPES.find(item => item.id === recipeId);
    if (!r || store.state.craftedModules.includes(recipeId)) return;

    if (r.cost.box && (store.state.salvage.box || 0) < r.cost.box) return;
    if (r.cost.chips && (store.state.salvage.chips || 0) < r.cost.chips) return;
    if (r.cost.titanium && (store.state.salvage.titanium || 0) < r.cost.titanium) return;
    if (r.cost.aicore && (store.state.salvage.aicore || 0) < r.cost.aicore) return;

    if (r.cost.box) store.state.salvage.box -= r.cost.box;
    if (r.cost.chips) store.state.salvage.chips -= r.cost.chips;
    if (r.cost.titanium) store.state.salvage.titanium -= r.cost.titanium;
    if (r.cost.aicore) store.state.salvage.aicore -= r.cost.aicore;

    safeAdd(store.state.craftedModules, recipeId);
    if (window.tacticalAudio) window.tacticalAudio.playSalvagePickup();
    this.addNotification('🛠️ МОДУЛЬ СОБРАН', `${r.name}\n${r.desc}`);
    this.checkAchievement('salvage_master');
    this.renderHangarDOM();
    this.saveGame();
    this._uiDirty = true;
  }

  awardSalvage(lootObj = {}) {
    const parts = [];
    if (lootObj.box) {
      store.state.salvage.box = (store.state.salvage.box || 0) + lootObj.box;
      parts.push(`📦 +${lootObj.box} Черный ящик`);
    }
    if (lootObj.chips) {
      store.state.salvage.chips = (store.state.salvage.chips || 0) + lootObj.chips;
      parts.push(`💎 +${lootObj.chips} GaN-чип`);
    }
    if (lootObj.titanium) {
      store.state.salvage.titanium = (store.state.salvage.titanium || 0) + lootObj.titanium;
      parts.push(`🛡️ +${lootObj.titanium} Титан`);
    }
    if (lootObj.aicore) {
      store.state.salvage.aicore = (store.state.salvage.aicore || 0) + lootObj.aicore;
      parts.push(`🔮 +${lootObj.aicore} ИИ-Ядро`);
    }

    if (parts.length > 0) {
      this.addNotification('💠 ТРОФЕИ ПОДНЯТЫ', parts.join(' | '));
      if (window.tacticalAudio) window.tacticalAudio.playSalvagePickup();
      if (this.engine3D) this.engine3D.spawnFloatingSalvage(parts);
      this.renderHangarDOM();
    }
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

    this.flirOverlay = document.getElementById('flir-overlay');
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

    // Telemetry and HUD DOM Cache
    this.sonarCanvas = document.getElementById('sonar-waterfall-canvas');
    this.sonarDepthEl = document.getElementById('sonar-telemetry-depth');
    this.rovMagVal = document.getElementById('rov-val-mag');
    this.rovMagFill = document.getElementById('rov-fill-mag');
    this.rovSiphonPct = document.getElementById('rov-siphon-pct');
    this.rovSiphonFill = document.getElementById('rov-siphon-fill');
  }

  // =========================================================================
  // EVENT BINDING
  // =========================================================================
  initEvents() {
    // Primary Click Collector: Center Interact Zone & Viewport
    const centerZone = document.querySelector('.center-interact-zone');
    if (centerZone) {
      centerZone.addEventListener('click', (e) => {
        this.handleClick(e.clientX, e.clientY);
      });
    }

    const viewport = document.getElementById('drone-3d-viewport');
    if (viewport) {
      viewport.addEventListener('click', (e) => {
        this.handleClick(e.clientX, e.clientY);
      });
    }

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

    // FLIR Thermal Recon Mode (only works when overlay element exists — operations only)
    if (this.btnOpenFlir) {
      this.btnOpenFlir.addEventListener('click', () => {
        if (!this.flirOverlay) return;  // No FLIR overlay in lobby — do nothing
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
    const btnUnderstood = document.getElementById('btn-help-understood');
    if (btnUnderstood) {
      btnUnderstood.addEventListener('click', () => {
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
        this.mapModal?.classList.add('active');
        if (window.tacticalAudio) window.tacticalAudio.playRadioSquelch();
      });
    }
    if (this.btnCloseMap) {
      this.btnCloseMap.addEventListener('click', () => {
        this.mapModal?.classList.remove('active');
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
        this.cyberModal?.classList.add('active');
        if (window.tacticalAudio) window.tacticalAudio.playSonarPing();
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
        this.cyberModal?.classList.remove('active');
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
          store.state.creditsUSD += 2000 * mult;
          this.addData(50 * mult);
          store.state.totalHacks++;
          this.dailyHacks++;
          this.cyberComboChannel++;

          if (this.cyberComboChannel < 3) {
            // Spawn next channel
            this.targetFreq = 80 + Math.floor(Math.random() * 140);
            this.targetAmp = +(0.5 + Math.random() * 1.2).toFixed(1);
            this.cyberHackTimer = Math.max(15, 30 - this.cyberComboChannel * 5);
            this.addNotification('📡 КАНАЛ ВЗЛОМАН', `Combo x${this.cyberComboChannel}! Следующий канал...`);
          } else {
            // All channels hacked — big reward
            store.state.creditsUSD += 10000 * mult;
            this.addData(150 * mult);
            this.addNotification('🏆 ПОЛНЫЙ ВЗЛОМ', 'Все 3 канала дешифрованы! Мега-бонус!');
            this.cyberModal?.classList.remove('active');
            this.cyberHackActive = false;

            // Check if active campaign mission in phase 1
            if (this.activeMission && this.missionPhase === 1) {
              this.advanceMissionPhase();
            }
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
        if (!store.state.tech[tech] && store.state.blueprintsBP >= cost) {
          store.state.blueprintsBP -= cost;
          store.state.tech[tech] = true;
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
        if (this.assaultCharge >= this.assaultChargeMax && !this.minigameActive) {
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
    safeAdd(store.state.visitedSectors, sectorId);
    const info = SECTOR_INFO[sectorId];
    if (info && this.lblCurrentSector) {
      this.lblCurrentSector.textContent = info.name;
    }
    if (this.engine3D) {
      this.engine3D.setWeatherSector(sectorId);
    }
    // Start ambient soundscape for new sector
    if (window.tacticalAudio) window.tacticalAudio.startAmbient(sectorId);
    this.mapModal?.classList.remove('active');
    this.checkAllAchievements();
    this._uiDirty = true;
  }

  fireMissileSalvo(multiplier = 3) {
    // Check FPV drone salvo cooldown
    if (this.weaponCooldown > 0) {
      this.addNotification('⏳ ПЕРЕЗАРЯДКА', `Дроны готовы через ${this.weaponCooldown.toFixed(1)}с`);
      return;
    }

    // Start salvo cooldown
    this.weaponCooldown = this.weaponCooldownMax;

    if (this.engine3D) {
      this.engine3D.launchMissileStrike(() => {
        const gainMB = this.getClickPower() * multiplier * 4.0;
        const gainUSD = this.getClickCashGain() * multiplier * 3;
        this.addData(gainMB);
        this.addCredits(gainUSD);
        this.spawnFloatingGain(window.innerWidth / 2, window.innerHeight / 2, gainMB, gainUSD, true);

        // Heavy damage to ship from salvo
        const salvoDmg = gainMB * 2.0;
        this.damageShip(salvoDmg);

        this.checkAllAchievements();
        this._uiDirty = true;
      });
    }
  }

  drawSonarWaterfall() {
    const canvas = this.sonarCanvas;
    if (!canvas || canvas.offsetParent === null) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Scroll canvas down
    const imgData = ctx.getImageData(0, 0, W, H - 3);
    ctx.putImageData(imgData, 0, 3);

    // Top scanline
    const depth = parseFloat((this.engine3D && this.engine3D.currentDepth) || 12.4);
    const speed = Math.abs((this.engine3D && this.engine3D.pilotSpeed) || 0);
    const isClean = speed < 18;

    const depthEl = this.sonarDepthEl;
    if (depthEl) depthEl.textContent = `ГЛУБИНА: ${depth.toFixed(1)} м`;

    ctx.fillStyle = isClean ? '#003300' : '#330000';
    ctx.fillRect(0, 0, W, 3);
    if (!isClean) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(Math.random() * W, 0, 2, 3);
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
    store.state.totalClicks++;
    this.dailyClicks++;

    // Event click challenge
    if (this.activeEvent && this.activeEvent.type === 'click_challenge') {
      this.eventClickCount++;
    }

    if (isCrit) {
      gainMB *= 5.0;
      gainUSD *= 5;
      store.state.totalCrits++;
      this.dailyCrits++;
      window.tacticalAudio.playCritPing();
      this.spawnFloatingGain(x, y, gainMB, gainUSD, true);
    } else {
      window.tacticalAudio.playPing();
      this.spawnFloatingGain(x, y, gainMB, gainUSD, false);
    }

    this.addData(gainMB);
    this.addCredits(gainUSD);
    this.engine3D.triggerClickBounce();
  }

  damageShip(dmg) {
    const proto = DRONE_PROTOTYPES_DEF[store.state.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    dmg *= (proto.fpvDamageMult || 1.0);
    this.shipHP = Math.max(0, this.shipHP - dmg);
    this._uiDirty = true;

    if (this.shipHP <= 0) {
      // Ship destroyed!
      store.state.sunkenShips++;
      store.state.shipLevel++;
      const reward = Math.floor(500 * store.state.shipLevel * this.getGlobalMultiplier());
      store.state.creditsUSD += reward;
      this.addNotification('💥 КОРАБЛЬ УНИЧТОЖЕН', `+$${reward.toLocaleString()} // Уровень ${store.state.shipLevel}`);
      window.tacticalAudio.playExplosion();

      if (this.engine3D) {
        this.engine3D.triggerShipExplosion();
      }

      // Drop random salvage from sunken ship
      const shipLoot = {};
      if (Math.random() < 0.65) shipLoot.titanium = 1 + Math.floor(Math.random() * 2);
      if (Math.random() < 0.45) shipLoot.chips = 1;
      if (store.state.shipLevel % 5 === 0) {
        shipLoot.box = 1;
        shipLoot.aicore = 1;
      }
      this.awardSalvage(shipLoot);

      // Spawn new ship with more HP
      this.shipMaxHP = Math.floor(100 * Math.pow(1.6, store.state.shipLevel - 1));
      this.shipHP = this.shipMaxHP;

      // Update 3D ship model size for new level
      if (this.engine3D) {
        this.engine3D.updateEnemyShipForLevel(store.state.shipLevel);
        this.engine3D.isEnemyBurning = false;  // Reset fire for new ship
      }

      this.checkAllAchievements();
      this.saveGame();
    }
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
    const maxBuf = this.getMaxBufferMB();
    if (store.state.dataMB < maxBuf) {
      store.state.dataMB = Math.min(store.state.dataMB + amount, maxBuf);
    }
    store.state.totalDataMB += amount;
    this.dailyDataCollected += amount;
    // Also charge assault meter (proportional) — plasma_warhead doubles rate
    const chargeRate = store.state.tech.plasma_warhead ? 1.6 : 0.8;
    this.assaultCharge = Math.min(this.assaultCharge + amount * chargeRate, this.assaultChargeMax);
    this.checkDossierProgression();
    this._uiDirty = true;
  }

  addCredits(amount) {
    store.state.creditsUSD += amount;
    this.dailyCreditsEarned += amount;
    this._uiDirty = true;
  }

  sellDataForCash() {
    if (store.state.dataMB >= 10) {
      store.state.dataMB -= 10;
      store.state.creditsUSD += Math.floor(10 * 35 * this.getGlobalMultiplier());
      window.tacticalAudio.playContractSfx();
      this.updateUI();
    }
  }

  buyHardware(type) {
    const cost = this.getHWCost(type);
    if (!cost.isMax && store.state.dataMB >= cost.mb && store.state.creditsUSD >= cost.usd) {
      store.state.dataMB -= cost.mb;
      store.state.creditsUSD -= cost.usd;
      store.state.hw[type] = (store.state.hw[type] || 0) + 1;
      window.tacticalAudio.playMountingSfx();
      if (this.engine3D) {
        this.engine3D.updateUpgrades({ ...store.state.hw, prestige: store.state.blueprintsBP });
        this.engine3D.addModule(type);
      }
      this.saveGame();
      this.updateUI();
    }
  }

  buyCyber(type) {
    const cost = this.getCyberCost(type);
    if (!cost.isMax && store.state.dataMB >= cost.mb && store.state.creditsUSD >= cost.usd) {
      store.state.dataMB -= cost.mb;
      store.state.creditsUSD -= cost.usd;
      store.state.cyber[type] = (store.state.cyber[type] || 0) + 1;
      window.tacticalAudio.playMountingSfx();
      if (this.engine3D) this.engine3D.addModule(type);
      this.saveGame();
      this.updateUI();
    }
  }

  startContract(id) {
    const c = this.activeContracts.find(item => item.id === id);
    if (c && !c.active && !c.completed) {
      if (store.state.dataMB >= c.costMB && store.state.creditsUSD >= c.costUSD) {
        store.state.dataMB -= c.costMB;
        store.state.creditsUSD -= c.costUSD;
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
      store.state.overclockUses++;
      this.dailyOverclocks++;
      window.tacticalAudio.playCritPing();
      this._uiDirty = true;
    }
  }

  checkDossierProgression() {
    const percent = Math.min(100, (this.assaultCharge / this.assaultChargeMax) * 100.0);
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
    this.assaultModal?.classList.add('active');

    // Check if this should be a boss fight
    if (this.shouldTriggerBoss()) {
      this.bossActive = true;
      this.currentBoss = this.getBossForLevel();
      this.fpvGame.isBoss = true;
      this.fpvGame.bossData = this.currentBoss;
      this.addNotification(this.currentBoss.name, `БОСС: ${this.currentBoss.desc}`);
    } else {
      this.fpvGame.isBoss = false;
      this.fpvGame.bossData = null;
    }

    const proto = DRONE_PROTOTYPES_DEF[store.state.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    let extraArmor = store.state.hw.armor + (proto.fpvExtraLives || 0) * 2;
    if (store.state.craftedModules && store.state.craftedModules.includes('armor_titan')) extraArmor += 2;

    this.fpvGame.setDifficulty(store.state.blueprintsBP, extraArmor, store.state.tech.ghost_protocol || proto.id === 'phantom');
    this.fpvGame.start(this.fpvCanvas);
    window.tacticalAudio.playAlarm();
    this.checkAchievement('first_assault');
    this.dailyAssaults++;
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
      store.state.shieldSaves += (this.fpvGame.maxLives - this.fpvGame.lives);
    }

    this.fpvGame.stop();

    if (success) {
      this.lockStatusLabel.textContent = this.bossActive
        ? '👑 БОСС-КОРАБЛЬ УНИЧТОЖЕН!'
        : '💥 КИНЕТИЧЕСКИЙ УДАР ПОДТВЕРЖДЁН!';
      this.lockStatusLabel.style.color = '#ffcc00';

      this.screenFlash.style.opacity = '1';
      setTimeout(() => { this.screenFlash.style.opacity = '0'; }, 600);

      // Rewards scaled by rating + boss multiplier
      const ratingMults = { S: 2.0, A: 1.5, B: 1.2, C: 1.0 };
      const rMult = ratingMults[this.lastAssaultRating] || 1.0;
      let bossMult = this.bossActive && this.currentBoss ? this.currentBoss.rewardMult : 1.0;
      if (store.state.craftedModules && store.state.craftedModules.includes('plasma_warhead')) bossMult *= 2.0;

      store.state.blueprintsBP++;
      store.state.creditsUSD += Math.floor(15000 * rMult * bossMult);
      this.assaultCharge = 0;
      this.assaultChargeMax = Math.floor(500 * (1.0 + store.state.blueprintsBP * 0.4));
      this.currentDossierStage = 0;

      // Deliver kinetic impact to enemy warship
      this.damageShip(this.shipMaxHP);

      // Boss defeat tracking
      if (this.bossActive) {
        this.bossesDefeated++;
        this.addNotification('👑 БОСС ПОВЕРЖЕН', `${this.currentBoss.name} — x${bossMult} награды!`);
        this.bossActive = false;
        this.currentBoss = null;
      }

      // Bonus data from pickups
      if (this.fpvGame.collectedData > 0) {
        store.state.totalDataMB += this.fpvGame.collectedData * 50;
      }

      // Salvage Drop from assault
      const assaultLoot = {
        box: this.lastAssaultRating === 'S' ? 2 : 1,
        chips: 1 + Math.floor(Math.random() * 2),
        titanium: 1 + Math.floor(Math.random() * 2)
      };
      if (this.lastAssaultRating === 'S') assaultLoot.aicore = 1;
      this.awardSalvage(assaultLoot);

      // Advance campaign mission if active
      if (this.activeMission) {
        this.advanceMissionPhase();
      }

      // Check special achievements
      if (this.lastAssaultRating === 'S') this.checkAchievement('rank_s');
      if (this.lastAssaultPerfectLaunch) this.checkAchievement('perfect_launch');
      if (this.lastAssaultNoDamage) this.checkAchievement('no_damage');
      if (this.lastAssaultSpeedDemon) this.checkAchievement('speed_demon');
      this.checkAchievement('first_prestige');

      setTimeout(() => {
        this.assaultModal?.classList.remove('active');
        this.updateDossier(DOSSIER_LORE[0], false);
        this.checkAllAchievements();
        this.saveGame();
        this._uiDirty = true;
      }, 3500);
    } else {
      this.lockStatusLabel.textContent = 'FPV-ДРОН УНИЧТОЖЕН // ШТУРМ ПРОВАЛЕН';
      this.lockStatusLabel.style.color = '#ff2a2a';

      setTimeout(() => {
        this.assaultModal?.classList.remove('active');
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
        if (this.overclockTimer <= 0) { this.isOverclocked = false; this._uiDirty = true; }
      }
      if (this.overclockCooldown > 0) this.overclockCooldown -= dt;

      // Weapon cooldown
      if (this.weaponCooldown > 0) {
        this.weaponCooldown = Math.max(0, this.weaponCooldown - dt);
        const cdFill = document.getElementById('cooldown-fill');
        if (cdFill) cdFill.style.width = `${(1 - this.weaponCooldown / this.weaponCooldownMax) * 100}%`;
      }

      // Passive income — data is uncapped, also charges assault meter
      if (!this.minigameActive) {
        let passiveMB = this.getPassiveRate();
        if (store.state.tech.data_nexus) passiveMB *= 2.0;
        if (passiveMB > 0) {
          const maxBuf = this.getMaxBufferMB();
          if (store.state.dataMB < maxBuf) {
            store.state.dataMB = Math.min(store.state.dataMB + passiveMB * dt, maxBuf);
          }
          store.state.totalDataMB += passiveMB * dt;
          this.dailyDataCollected += passiveMB * dt;
          // Charge assault meter — plasma_warhead doubles rate
          if (this.assaultCharge < this.assaultChargeMax) {
            const chargeRate = store.state.tech.plasma_warhead ? 1.6 : 0.8;
            this.assaultCharge = Math.min(this.assaultCharge + passiveMB * dt * chargeRate, this.assaultChargeMax);
          }
          this.checkDossierProgression();
          this._uiDirty = true;
        }
      }

      const passiveUSD = this.getUSDPassiveRate();
      if (passiveUSD > 0) {
        store.state.creditsUSD += passiveUSD * dt;
        this.dailyCreditsEarned += passiveUSD * dt;
        this._uiDirty = true;
      }

      // Contracts
      this.activeContracts.forEach(c => {
        if (c.active && !c.completed) {
          c.progress += dt;
          if (c.progress >= c.duration) {
            c.completed = true;
            c.active = false;
            store.state.creditsUSD += c.rewardUSD;
            this.addData(c.rewardMB);
            window.tacticalAudio.playContractSfx();
            this.addNotification('✅ КОНТРАКТ ВЫПОЛНЕН', `${c.name} — +$${c.rewardUSD.toLocaleString()}`);
            this._uiDirty = true;
          }
        }
      });
      this.refreshContracts();

      // SIGINT Cyber Hack timer & interference
      if (this.cyberHackActive) {
        this.cyberHackTimer -= dt;
        if (this.cyberHackTimer <= 0) {
          this.cyberHackActive = false;
          this.cyberModal?.classList.remove('active');
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

        // Only draw cyber wave when modal is visible
        this.drawCyberWave(now / 1000.0);
      }

      // Random events
      this.updateRandomEvents(dt);
      if (this.activeEvent) this.updateEventBannerUI();

      // Minigame
      this.updateMinigame(dt);

      // === THROTTLED UI UPDATES (max ~4/sec) ===
      this._uiThrottleAccum += dt;
      if (this._uiDirty && this._uiThrottleAccum >= 0.25) {
        this._uiThrottleAccum = 0;
        this._uiDirty = false;
        this.updateUI();
        this.updateUI(); this.updateUIElements();
      }

      // === THROTTLED ACHIEVEMENT CHECK (every 2 sec) ===
      this._achieveCheckAccum += dt;
      if (this._achieveCheckAccum >= 2.0) {
        this._achieveCheckAccum = 0;
        this.checkAllAchievements();
        this.checkDailyQuests();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // =========================================================================
  // UI UPDATE
  // =========================================================================
  updateUI() {
    const maxBuf = this.getMaxBufferMB();
    const maxBufStr = isFinite(maxBuf) ? (maxBuf >= 1000 ? `${(maxBuf / 1000).toFixed(1)} ГБ` : `${maxBuf} МБ`) : '∞ БЕЗЛИМИТ';
    const dataStr = store.state.dataMB >= 1000 ? `${(store.state.dataMB / 1000).toFixed(2)} ГБ` : `${store.state.dataMB.toFixed(1)} МБ`;

    const chargePercent = Math.min(100, (this.assaultCharge / this.assaultChargeMax) * 100.0);

    if (this.lblBuffer) this.lblBuffer.textContent = `${dataStr} / ${maxBufStr}`;
    if (this.lblCredits) this.lblCredits.textContent = `$${Math.floor(store.state.creditsUSD).toLocaleString()}`;
    if (this.lblEnergyPercent) this.lblEnergyPercent.textContent = `${chargePercent.toFixed(0)}%`;
    if (this.progressBarFill) this.progressBarFill.style.width = `${chargePercent}%`;

    const passUSD = this.getUSDPassiveRate();
    if (this.lblPassiveUSD) this.lblPassiveUSD.textContent = `+$${Math.floor(passUSD)}/с`;
    if (this.lblPassive) this.lblPassive.textContent = `+${this.getPassiveRate().toFixed(1)} МБ/с`;
    if (this.lblClick) this.lblClick.textContent = `+${this.getClickPower().toFixed(1)} МБ`;
    if (this.lblMultiplier) this.lblMultiplier.textContent = `x${this.getGlobalMultiplier().toFixed(1)} [${store.state.blueprintsBP} ЧЖ]`;
    if (this.lblTotalData) this.lblTotalData.textContent = `ВСЕГО: ${store.state.totalDataMB >= 1000 ? (store.state.totalDataMB / 1000).toFixed(2) + ' ГБ' : store.state.totalDataMB.toFixed(0) + ' МБ'}`;

    if (this.lblSunkenCount) this.lblSunkenCount.textContent = `${store.state.sunkenShips} ВЫМПЕЛОВ`;
    if (this.lblKillsStatus) {
      let rank = 'ОПЕРАТОР БПА';
      if (store.state.sunkenShips >= 3) rank = 'КОМАНДИР ЗВЕНА';
      if (store.state.sunkenShips >= 8) rank = 'КОМАНДОР ФЛОТА';
      if (store.state.sunkenShips >= 15) rank = 'АДМИРАЛ';
      this.lblKillsStatus.textContent = `РАНГ: ${rank}`;
    }

    const isReady = this.assaultCharge >= this.assaultChargeMax;
    if (this.btnAssault) {
      if (isReady) {
        this.btnAssault.classList.add('ready');
        this.btnAssault.textContent = `>>> ЗАПУСК FPV-ШТУРМА [ГОТОВ] <<<`;
      } else {
        this.btnAssault.classList.remove('ready');
        this.btnAssault.textContent = `FPV-ЗАРЯД [${chargePercent.toFixed(0)}%] (${Math.floor(this.assaultCharge)}/${this.assaultChargeMax} МБ)`;
      }
    }

    // Ship HP bar
    const hpFill = document.getElementById('ship-hp-fill');
    const hpLabel = document.getElementById('ship-hp-label');
    if (hpFill) {
      const hpPct = Math.max(0, (this.shipHP / this.shipMaxHP) * 100);
      hpFill.style.width = `${hpPct}%`;
      hpFill.style.background = hpPct > 50 ? '#ff4444' : hpPct > 25 ? '#ff8800' : '#ff0000';
    }
    const shipData = getEnemyShipData(store.state.shipLevel);
    if (hpLabel) {
      hpLabel.textContent = `${shipData.icon} ${shipData.name} [Ур.${store.state.shipLevel}]: ${Math.ceil(this.shipHP).toLocaleString()} / ${this.shipMaxHP.toLocaleString()} HP`;
    }
  }

  updateUIElements() {
    ['satcom', 'optics', 'armor', 'waterjets', 'missiles'].forEach(k => {
      const c = this.getHWCost(k);
      const costEl = document.getElementById(`cost-hw-${k}`);
      const tierEl = document.getElementById(`tier-hw-${k}`);
      if (costEl) {
        if (c.isMax) {
          costEl.textContent = 'MAX (МК 10)';
          costEl.disabled = true;
        } else {
          costEl.textContent = `${c.mb >= 1000 ? (c.mb / 1000).toFixed(1) + ' ГБ' : c.mb + ' МБ'} | $${c.usd >= 1000 ? Math.floor(c.usd / 1000) + 'k' : c.usd}`;
          costEl.disabled = store.state.dataMB < c.mb || store.state.creditsUSD < c.usd;
        }
      }
      if (tierEl) tierEl.textContent = `МК ${Math.min(10, (store.state.hw[k] || 0) + 1)}`;
    });

    ['sniffer', 'quantum', 'autosiphon'].forEach(k => {
      const c = this.getCyberCost(k);
      const costEl = document.getElementById(`cost-cyber-${k}`);
      const tierEl = document.getElementById(`tier-cyber-${k}`);
      if (costEl) {
        if (c.isMax) {
          costEl.textContent = 'MAX (V.10)';
          costEl.disabled = true;
        } else {
          costEl.textContent = `${c.mb >= 1000 ? (c.mb / 1000).toFixed(1) + ' ГБ' : c.mb + ' МБ'} | $${c.usd >= 1000 ? Math.floor(c.usd / 1000) + 'k' : c.usd}`;
          costEl.disabled = store.state.dataMB < c.mb || store.state.creditsUSD < c.usd;
        }
      }
      if (tierEl) tierEl.textContent = `V.${Math.min(10, (store.state.cyber[k] || 0) + 1)}`;
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

  // =========================================================================
  // TECH TREE (TACTICAL R&D MATRIX)
  // =========================================================================
  initTechTree() {
    this.techTreeModal = document.getElementById('techtree-modal');
    const openBtn = document.getElementById('btn-open-techtree');
    const closeBtn = document.getElementById('btn-close-techtree');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.refreshTechTree();
        if (this.techTreeModal) this.techTreeModal.classList.add('active');
        if (this.allNodeIds && this.allNodeIds.length > 0) {
          this.selectTechNode(this.allNodeIds[this.selectedNodeIndex || 0]);
        }
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.techTreeModal) this.techTreeModal.classList.remove('active');
      });
    }

    // Filter Branch Tabs
    document.querySelectorAll('.tt-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tt-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.tt-branch').forEach(branch => {
          if (filter === 'all' || branch.getAttribute('data-branch') === filter) {
            branch.style.display = 'flex';
          } else {
            branch.style.display = 'none';
          }
        });
      });
    });

    // Tech node extended specifications & lore
    this.techDescriptions = {
      sniffer: {
        icon: '📡',
        tier: 'TIER 1',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Пассивный широкополосный анализатор радиочастот. Перехватывает пакеты телеметрии и навигации кораблей противника в скрытном режиме. Не демаскирует катер излучением.'
      },
      quantum: {
        icon: '🔮',
        tier: 'TIER 2',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Квантовый сопроцессор дешифровки протоколов военного стандарта. Мгновенно вычисляет уязвимости в шифровании бортовых систем врага, увеличивая шанс критического взлома.'
      },
      ghost_protocol: {
        icon: '👻',
        tier: 'TIER 3',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Электродинамический протокол поглощения радиоволн и тепловой сигнатуры. В режиме FPV-штурма подавляет сигналы ПВО противника, снижая количество препятствий на 40%.'
      },
      ecm_suite: {
        icon: '🛡️',
        tier: 'TIER 4',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Комплекс активного подавления радаров и каналов связи противника. Сокращает время перезарядки и подготовки к пуску боевых FPV-дронов в 2 раза.'
      },
      optics: {
        icon: '🔭',
        tier: 'TIER 1',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Многоспектральный гиростабилизированный оптико-электронный комплекс FLIR. Обеспечивает сопровождение теплоконтрастных целей в тумане, дыму и ночных условиях.'
      },
      missiles: {
        icon: '🚀',
        tier: 'TIER 2',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Складные стапели катапультного старта боевых FPV-дронов. Позволяют нести увеличенную кумулятивную боевую часть, повышая урон каждого удара на 50%.'
      },
      plasma_warhead: {
        icon: '💥',
        tier: 'TIER 3',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Высокотемпературная плазменная БЧ с кумулятивной струёй. Вызывает вторичные детонации боезапаса на вражеских судах и в 2 раза ускоряет накопление заряда штурма.'
      },
      swarm_ai: {
        icon: '🤖',
        tier: 'TIER 4',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Автономная нейросеть управления роем дронов. Поднимает в воздух звено эскортных БПА, синхронизируя перекрёстные удары и удваивая весь суммарный урон.'
      },
      satcom: {
        icon: '📡',
        tier: 'TIER 1',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Высокоскоростной терминал спутниковой связи SATCOM с фазированной антенной решёткой. Обеспечивает стабильный восходящий поток разведданных в штаб.'
      },
      armor: {
        icon: '🛡️',
        tier: 'TIER 2',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Многослойные бронепанели из карбида кремния и арамидных волокон. Защищают аккумуляторный отсек, давая дополнительную прочность в FPV-режиме и пассивный сбор данных.'
      },
      waterjets: {
        icon: '💨',
        tier: 'TIER 3',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Высокоэффективные водомётные движители с регулируемым вектором тяги. Повышают манёвренность на волнении, формируют скрытный кильватер и увеличивают скорость сбора данных.'
      },
      autosiphon: {
        icon: '💰',
        tier: 'TIER 4',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Автономный модуль перехвата и маршрутизации защищённых финансовых транзакций. Обеспечивает постоянный приток кредитов на счёт операции.'
      },
      data_nexus: {
        icon: '🌐',
        tier: 'TIER 5',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Главный квантовый дата-центр «НЕКСУС». Синхронизирует все спутниковые каналы, РЭБ-станции и сенсоры, удваивая весь пассивный доход данных.'
      }
    };

    this.allNodeIds = [...document.querySelectorAll('.tt-node[data-tt]')].map(n => n.getAttribute('data-tt'));
    this.selectedNodeIndex = 0;

    // Node click handlers
    document.querySelectorAll('.tt-node[data-tt]').forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = node.getAttribute('data-tt');
        this.selectTechNode(id);
        if (window.tacticalAudio) window.tacticalAudio.playPing();
      });
      // Double click or instant purchase
      node.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const id = node.getAttribute('data-tt');
        this.purchaseTechNode(id);
      });
    });

    // Primary action button inside inspector
    const buyBtn = document.getElementById('tt-btn-action-buy');
    if (buyBtn) {
      buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.allNodeIds && this.allNodeIds[this.selectedNodeIndex]) {
          this.purchaseTechNode(this.allNodeIds[this.selectedNodeIndex]);
        }
      });
    }

    // Navigation buttons
    const prevBtn = document.getElementById('tt-nav-prev');
    const nextBtn = document.getElementById('tt-nav-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedNodeIndex = (this.selectedNodeIndex - 1 + this.allNodeIds.length) % this.allNodeIds.length;
        this.selectTechNode(this.allNodeIds[this.selectedNodeIndex]);
        if (window.tacticalAudio) window.tacticalAudio.playPing();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedNodeIndex = (this.selectedNodeIndex + 1) % this.allNodeIds.length;
        this.selectTechNode(this.allNodeIds[this.selectedNodeIndex]);
        if (window.tacticalAudio) window.tacticalAudio.playPing();
      });
    }
  }

  selectTechNode(id) {
    if (!id) return;
    this.selectedNodeIndex = this.allNodeIds.indexOf(id);
    if (this.selectedNodeIndex < 0) this.selectedNodeIndex = 0;

    const node = document.querySelector(`.tt-node[data-tt="${id}"]`);
    if (!node) return;

    // Highlight selected node
    document.querySelectorAll('.tt-node').forEach(n => n.classList.remove('tt-selected'));
    node.classList.add('tt-selected');

    // Update inspector terminal
    const info = this.techDescriptions[id] || {};
    const nameEl = document.getElementById('tt-detail-name');
    const iconEl = document.getElementById('tt-detail-icon');
    const tierEl = document.getElementById('tt-detail-tier');
    const branchEl = document.getElementById('tt-detail-branch');
    const descEl = document.getElementById('tt-detail-desc');
    const statsEl = document.getElementById('tt-detail-stats');
    const statusWrap = document.getElementById('tt-detail-status-wrap');
    const buyBtn = document.getElementById('tt-btn-action-buy');

    if (nameEl) nameEl.textContent = node.querySelector('.tt-node-name')?.textContent || id;
    if (iconEl) iconEl.textContent = info.icon || '🔬';
    if (tierEl) tierEl.textContent = info.tier || `TIER ${node.getAttribute('data-tier') || '1'}`;
    if (branchEl) branchEl.textContent = info.branch || 'НИОКР КОРПУСА';
    if (descEl) descEl.textContent = info.lore || node.querySelector('.tt-node-desc')?.textContent || '';

    const cost = parseInt(node.getAttribute('data-tt-cost')) || 0;
    const req = node.getAttribute('data-tt-req');
    const effect = node.querySelector('.tt-node-desc')?.textContent || '';

    if (statsEl) {
      statsEl.innerHTML = `СТОИМОСТЬ: <strong>${cost.toLocaleString()} МБ</strong> // ЭФФЕКТ: <strong>${effect}</strong>${req ? ` // ТРЕБУЕТСЯ: <strong>${req.toUpperCase()}</strong>` : ''}`;
    }

    const isUnlocked = this.isTechUnlocked(id);
    const isReqMet = !req || this.isTechUnlocked(req);
    const hasEnoughData = store.state.dataMB >= cost;

    if (statusWrap) {
      if (isUnlocked) {
        statusWrap.innerHTML = `<div class="tt-status-pill unlocked">✓ МОДУЛЬ АКТИВИРОВАН</div>`;
      } else if (isReqMet) {
        if (hasEnoughData) {
          statusWrap.innerHTML = `<div class="tt-status-pill available">◉ ГОТОВО К ИССЛЕДОВАНИЮ</div>`;
        } else {
          statusWrap.innerHTML = `<div class="tt-status-pill ready">⚠️ НЕДОСТАТОЧНО ДАННЫХ</div>`;
        }
      } else {
        statusWrap.innerHTML = `<div class="tt-status-pill locked">🔒 ТРЕБУЕТСЯ ПРЕДШЕСТВЕННИК</div>`;
      }
    }

    if (buyBtn) {
      if (isUnlocked) {
        buyBtn.disabled = true;
        buyBtn.textContent = '✓ ИССЛЕДОВАНО';
      } else if (!isReqMet) {
        buyBtn.disabled = true;
        buyBtn.textContent = `🔒 ТРЕБУЕТСЯ: ${req.toUpperCase()}`;
      } else if (!hasEnoughData) {
        buyBtn.disabled = true;
        buyBtn.textContent = `НЕДОСТАТОЧНО (${cost.toLocaleString()} МБ)`;
      } else {
        buyBtn.disabled = false;
        buyBtn.textContent = `⚡ ИЗУЧИТЬ // ${cost.toLocaleString()} МБ`;
      }
    }
  }

  isTechUnlocked(id) {
    if (store.state.hw[id] !== undefined) return store.state.hw[id] > 0;
    if (store.state.cyber[id] !== undefined) return store.state.cyber[id] > 0;
    if (store.state.tech[id]) return true;
    return false;
  }

  purchaseTechNode(id) {
    const node = document.querySelector(`.tt-node[data-tt="${id}"]`);
    if (!node) return;

    if (this.isTechUnlocked(id)) return;

    const req = node.getAttribute('data-tt-req');
    if (req && !this.isTechUnlocked(req)) {
      this.addNotification('🔒 ЗАБЛОКИРОВАНО', `Сначала исследуйте предшественник: ${req.toUpperCase()}`);
      return;
    }

    const cost = parseInt(node.getAttribute('data-tt-cost')) || 0;
    if (store.state.dataMB < cost) {
      this.addNotification('❌ НЕ ХВАТАЕТ ДАННЫХ', `Нужно ${cost.toLocaleString()} МБ, у вас ${Math.floor(store.state.dataMB).toLocaleString()} МБ`);
      return;
    }

    store.state.dataMB -= cost;

    if (store.state.hw[id] !== undefined) {
      store.state.hw[id]++;
      if (this.engine3D) {
        this.engine3D.addModule(id);
        this.engine3D.updateUpgrades({ ...store.state.hw, ...store.state.cyber, prestige: store.state.blueprintsBP });
      }
    } else if (store.state.cyber[id] !== undefined) {
      store.state.cyber[id]++;
    } else {
      store.state.tech[id] = true;
    }

    const effectDesc = this.applyTechEffect(id);
    if (window.tacticalAudio) window.tacticalAudio.playMountingSfx();
    this.addNotification('🔬 МОДУЛЬ ИССЛЕДОВАН', `${node.querySelector('.tt-node-name')?.textContent || id}\n${effectDesc}`);
    
    this.refreshTechTree();
    this.selectTechNode(id);
    this.updateUI(); this.updateUIElements();
    this.saveGame();
    this._uiDirty = true;
  }

  applyTechEffect(id) {
    switch (id) {
      case 'satcom':
        return `+${(2.0 * store.state.hw.satcom).toFixed(1)} МБ/клик активно`;
      case 'optics':
        return `+${(4.0 * store.state.hw.optics).toFixed(1)} МБ/клик активно`;
      case 'armor':
        return `+1 жизнь в FPV, +${(1.5 * store.state.hw.armor).toFixed(1)} МБ/с`;
      case 'waterjets':
        return `+${(3.0 * store.state.hw.waterjets).toFixed(1)} МБ/с активно`;
      case 'missiles':
        return `FPV-дрон x${1 + store.state.hw.missiles * 0.5} к удару`;
      case 'sniffer':
        return `+${(2.5 * store.state.cyber.sniffer).toFixed(1)} МБ/с пассивно`;
      case 'quantum':
        return `+${(12 * store.state.cyber.quantum)}% крит шанс активен`;
      case 'autosiphon':
        return `+$${75 * store.state.cyber.autosiphon}/с пассивно`;

      case 'ghost_protocol':
        return '✓ FPV: -40% препятствий, -2 требуемых прохода';
      case 'ecm_suite':
        this.weaponCooldownMax = Math.max(0.5, this.weaponCooldownMax * 0.5);
        return `✓ Кулдаун пуска FPV: ${this.weaponCooldownMax.toFixed(1)}с (было 1.5с)`;
      case 'plasma_warhead':
        return '✓ Скорость заряда штурма x2 активна';
      case 'swarm_ai':
        store.state.tech.swarmAI = true;
        if (this.engine3D) this.engine3D.updateSwarmEscorts(true);
        return '✓ Рой ИИ дронов-эскортов активирован';
      case 'data_nexus':
        return '✓ Пассивный доход x2 активен';
      default:
        return '';
    }
  }

  refreshTechTree() {
    let unlockedTotal = 0;
    let stealthUnlocked = 0;
    let firepowerUnlocked = 0;
    let engineeringUnlocked = 0;

    const stealthNodes = ['sniffer', 'quantum', 'ghost_protocol', 'ecm_suite'];
    const firepowerNodes = ['optics', 'missiles', 'plasma_warhead', 'swarm_ai'];
    const engineeringNodes = ['satcom', 'armor', 'waterjets', 'autosiphon', 'data_nexus'];

    document.querySelectorAll('.tt-node[data-tt]').forEach(node => {
      const id = node.getAttribute('data-tt');
      const req = node.getAttribute('data-tt-req');
      const cost = parseInt(node.getAttribute('data-tt-cost')) || 0;

      node.classList.remove('tt-locked', 'tt-available', 'tt-unlocked');

      const isUnlocked = this.isTechUnlocked(id);
      const isReqMet = !req || this.isTechUnlocked(req);

      if (isUnlocked) {
        node.classList.add('tt-unlocked');
        unlockedTotal++;
        if (stealthNodes.includes(id)) stealthUnlocked++;
        if (firepowerNodes.includes(id)) firepowerUnlocked++;
        if (engineeringNodes.includes(id)) engineeringUnlocked++;
      } else if (isReqMet) {
        node.classList.add('tt-available');
      } else {
        node.classList.add('tt-locked');
      }
    });

    // Telemetry updates
    const userDataEl = document.getElementById('tt-user-data');
    if (userDataEl) {
      userDataEl.textContent = `${store.state.dataMB < 1000 ? store.state.dataMB.toFixed(1) : Math.floor(store.state.dataMB).toLocaleString()} МБ`;
    }

    const globalProgEl = document.getElementById('tt-global-progress');
    if (globalProgEl) {
      const percent = Math.round((unlockedTotal / 13) * 100);
      globalProgEl.textContent = `${unlockedTotal} / 13 [${percent}%]`;
    }

    const countStealthEl = document.getElementById('tt-count-stealth');
    if (countStealthEl) countStealthEl.textContent = `${stealthUnlocked}/4`;

    const countFirepowerEl = document.getElementById('tt-count-firepower');
    if (countFirepowerEl) countFirepowerEl.textContent = `${firepowerUnlocked}/4`;

    const countEngEl = document.getElementById('tt-count-engineering');
    if (countEngEl) countEngEl.textContent = `${engineeringUnlocked}/5`;
  }

  // Override passive rate to include tech tree bonuses
  getPassiveRateWithTech() {
    let rate = this.getPassiveRate();
    if (store.state.tech.data_nexus) rate *= 2.0;
    return rate;
  }

  // =========================================================================
  // SETTINGS UI REFRESH
  // =========================================================================
  refreshSettingsUI() {
    const soundToggle = document.getElementById('setting-sound');
    if (soundToggle) {
      soundToggle.textContent = store.state.soundEnabled ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ';
      soundToggle.classList.toggle('active', store.state.soundEnabled);
    }
    const volSlider = document.getElementById('setting-volume');
    if (volSlider) {
      const vol = (window.tacticalAudio && window.tacticalAudio.masterGain)
        ? Math.round(window.tacticalAudio.masterGain.gain.value * 100)
        : (store.state.soundEnabled ? 70 : 0);
      volSlider.value = vol;
    }
  }

  // =========================================================================
  // SETTINGS
  // =========================================================================
  initSettings() {
    const settingsModal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('btn-open-settings');
    const closeBtn = document.getElementById('btn-close-settings');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.refreshSettingsUI();
        if (settingsModal) settingsModal.classList.add('active');
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.remove('active');
      });
    }

    // Sound toggle
    const soundToggle = document.getElementById('setting-sound');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        store.state.soundEnabled = !store.state.soundEnabled;
        if (window.tacticalAudio) {
          window.tacticalAudio.masterGain.gain.value = store.state.soundEnabled ? 1.0 : 0.0;
        }
        this.refreshSettingsUI();
        this.saveGame();
      });
    }

    // Volume slider
    const volSlider = document.getElementById('setting-volume');
    if (volSlider) {
      volSlider.value = store.state.soundEnabled ? 70 : 0;
      volSlider.addEventListener('input', () => {
        const vol = parseInt(volSlider.value) / 100;
        if (window.tacticalAudio && window.tacticalAudio.masterGain) {
          window.tacticalAudio.masterGain.gain.value = vol;
        }
        store.state.soundEnabled = vol > 0;
        this.refreshSettingsUI();
      });
    }

    // New Game
    const newGameBtn = document.getElementById('btn-new-game');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        if (confirm('НОВАЯ ИГРА: Весь прогресс будет сброшен. Продолжить?')) {
          localStorage.removeItem('barracuda_save');
          location.reload();
        }
      });
    }

    // Apply saved sound setting
    if (!store.state.soundEnabled && window.tacticalAudio && window.tacticalAudio.masterGain) {
      window.tacticalAudio.masterGain.gain.value = 0;
    }
  }

  // =========================================================================
  // ADVANCED TACTICAL SYSTEMS (VSA, DPS, SONAR, ROV, PID, KINBURN)
  // =========================================================================
  initAdvancedTacticalSystems() {
    // 1. VSA Toggle
    const btnVsa = document.getElementById('btn-mission-vsa');
    if (btnVsa) {
      btnVsa.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.engine3D) {
          const active = this.engine3D.toggleVsa();
          this.vsaEnabled = active;
          btnVsa.classList.toggle('active', active);
          const textEl = document.getElementById('hud-vsa-text');
          if (textEl) textEl.textContent = active ? 'VSA: ВКЛ' : 'VSA: ВЫКЛ (ДРИФТ)';
          this.showMissionWarning(active ? '🛡️ VSA АКТИВИРОВАНА — Курсовая стабилизация' : '⚠️ VSA ОТКЛЮЧЕНА — РЕЖИМ ГИДРОДИНАМИЧЕСКОГО ДРИФТА!');
          if (!active) this.unlockAchievement('vsa_drift');
        }
      });
    }

    // 2. DPS Hold Anchor
    const btnDps = document.getElementById('btn-mission-dps');
    if (btnDps) {
      btnDps.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.engine3D) {
          const active = this.engine3D.toggleDps();
          this.dpsEnabled = active;
          btnDps.classList.toggle('active', active);
          const textEl = document.getElementById('hud-dps-text');
          if (textEl) textEl.textContent = active ? 'DPS: УДЕРЖАНИЕ' : 'DPS: ВЫКЛ';
          this.showMissionWarning(active ? '⚓ DPS АКТИВИРОВАН — Удержание позиции' : '⚓ DPS ОТКЛЮЧЕН — Свободный ход');
        }
      });
    }

    // 3. Sonar Waterfall Display
    const btnSonar = document.getElementById('btn-mission-sonar');
    const btnCloseSonar = document.getElementById('btn-close-sonar');
    const sonarPanel = document.getElementById('sonar-waterfall-panel');
    if (btnSonar) {
      btnSonar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sonarActive = !this.sonarActive;
        if (this.engine3D) this.engine3D.setSonarActive(this.sonarActive);
        if (sonarPanel) sonarPanel.style.display = this.sonarActive ? 'block' : 'none';
        btnSonar.classList.toggle('active', this.sonarActive);
        if (this.sonarActive) this.unlockAchievement('sonar_scan');
      });
    }
    if (btnCloseSonar && sonarPanel) {
      btnCloseSonar.addEventListener('click', () => {
        sonarPanel.style.display = 'none';
        this.sonarActive = false;
        if (this.engine3D) this.engine3D.setSonarActive(false);
        if (btnSonar) btnSonar.classList.remove('active');
      });
    }

    // 4. PID Avionics Tuning
    const sliderP = document.getElementById('slider-pid-p');
    const sliderD = document.getElementById('slider-pid-d');
    const sliderExpo = document.getElementById('slider-pid-expo');
    const valP = document.getElementById('val-pid-p');
    const valD = document.getElementById('val-pid-d');
    const valExpo = document.getElementById('val-pid-expo');

    const updatePid = () => {
      this.pidSettings = {
        pGain: parseFloat(sliderP ? sliderP.value : 1.0),
        dGain: parseFloat(sliderD ? sliderD.value : 1.0),
        expo: parseFloat(sliderExpo ? sliderExpo.value : 1.0)
      };
      if (valP) valP.textContent = this.pidSettings.pGain.toFixed(1) + 'x';
      if (valD) valD.textContent = this.pidSettings.dGain.toFixed(1) + 'x';
      if (valExpo) valExpo.textContent = this.pidSettings.expo.toFixed(1) + 'x';
      if (this.engine3D) this.engine3D.setFpvPidSettings(this.pidSettings);
      this.saveGame();
    };

    // Initialize pidSettings with defaults FIRST, before reading them
    if (!this.pidSettings) this.pidSettings = { pGain: 1.0, dGain: 1.0, expo: 1.0 };

    // Now safe to read pidSettings for slider defaults
    if (sliderP) { sliderP.value = this.pidSettings.pGain || 1.0; sliderP.addEventListener('input', updatePid); }
    if (sliderD) { sliderD.value = this.pidSettings.dGain || 1.0; sliderD.addEventListener('input', updatePid); }
    if (sliderExpo) { sliderExpo.value = this.pidSettings.expo || 1.0; sliderExpo.addEventListener('input', updatePid); }
    updatePid();

    // 5. Underwater ROV & Data Siphon
    const btnTriggerSiphon = document.getElementById('btn-trigger-siphon');
    const btnExitRov = document.getElementById('btn-exit-rov');
    const rovOverlay = document.getElementById('rov-mission-overlay');
    if (btnTriggerSiphon) {
      btnTriggerSiphon.addEventListener('click', () => {
        if (this.engine3D) {
          this.engine3D.siphonProgress = 100;
          this.engine3D.siphonLocked = true;
          if (window.tacticalAudio) window.tacticalAudio.playSiphonLock();
          this.unlockAchievement('underwater_siphon');
          store.state.dataMB += 8500;
          store.state.creditsUSD += 25000;
          this.addNotification('🔮 СИФОН ПОДКЛЮЧЕН', '+8,500 МБ и +$25,000 получены!');
          setTimeout(() => {
            if (rovOverlay) rovOverlay.style.display = 'none';
            if (this.engine3D) this.engine3D.stopRovMode();
          }, 1500);
        }
      });
    }
    if (btnExitRov && rovOverlay) {
      btnExitRov.addEventListener('click', () => {
        rovOverlay.style.display = 'none';
        if (this.engine3D) this.engine3D.stopRovMode();
      });
    }

    // 6. Tactical Systems Center Modal & Quick Actions
    const btnOpenTactical = document.getElementById('btn-open-tactical-hub');
    const btnCloseTactical = document.getElementById('btn-close-tactical-hub');
    const tacticalModal = document.getElementById('tactical-hub-modal');

    const openTacticalModal = (e) => {
      if (e) e.stopPropagation();
      if (tacticalModal) tacticalModal.classList.add('active');
    };
    const closeTacticalModal = (e) => {
      if (e) e.stopPropagation();
      if (tacticalModal) tacticalModal.classList.remove('active');
    };

    if (btnOpenTactical) {
      btnOpenTactical.addEventListener('click', openTacticalModal);
    }
    if (btnCloseTactical) {
      btnCloseTactical.addEventListener('click', closeTacticalModal);
    }

    // Mobile Drawer Handlers
    const btnOpenDrawer = document.getElementById('btn-open-mobile-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-mobile-drawer');
    const drawerModal = document.getElementById('mobile-drawer-modal');

    const openDrawer = (e) => {
      if (e) e.stopPropagation();
      if (drawerModal) drawerModal.classList.add('active');
    };
    const closeDrawer = (e) => {
      if (e) e.stopPropagation();
      if (drawerModal) drawerModal.classList.remove('active');
    };

    if (btnOpenDrawer) {
      btnOpenDrawer.addEventListener('click', openDrawer);
    }
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', closeDrawer);
    }

    // Drawer internal buttons
    const btnDrawerTactical = document.getElementById('btn-drawer-tactical');
    if (btnDrawerTactical) {
      btnDrawerTactical.onclick = (e) => {
        closeDrawer(e);
        openTacticalModal(e);
      };
    }
    const btnDrawerMap = document.getElementById('btn-drawer-map');
    if (btnDrawerMap) {
      btnDrawerMap.onclick = (e) => {
        closeDrawer(e);
        const mapModal = document.getElementById('map-modal');
        if (mapModal) mapModal.classList.add('active');
      };
    }
    const btnDrawerDossier = document.getElementById('btn-drawer-dossier');
    if (btnDrawerDossier) {
      btnDrawerDossier.onclick = (e) => {
        closeDrawer(e);
        this.toggleDossier();
      };
    }
    const btnDrawerSettings = document.getElementById('btn-drawer-settings');
    if (btnDrawerSettings) {
      btnDrawerSettings.onclick = (e) => {
        closeDrawer(e);
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) settingsModal.classList.add('active');
      };
    }
    const btnDrawerHelp = document.getElementById('btn-drawer-help');
    if (btnDrawerHelp) {
      btnDrawerHelp.onclick = (e) => {
        closeDrawer(e);
        const helpModal = document.getElementById('help-modal');
        if (helpModal) helpModal.classList.add('active');
      };
    }
    const btnDrawerMute = document.getElementById('btn-drawer-mute');
    if (btnDrawerMute) {
      btnDrawerMute.onclick = (e) => {
        this.toggleMute();
        const muteStatus = document.getElementById('drawer-mute-status');
        const muteIcon = document.getElementById('drawer-mute-icon');
        if (muteStatus) muteStatus.textContent = this.isMuted ? 'ВЫКЛЮЧЕНЫ' : 'ВКЛЮЧЕНЫ';
        if (muteIcon) muteIcon.textContent = this.isMuted ? '🔇' : '🔊';
      };
    }

    // Quick Combat Action Bar buttons
    const btnQuickSonar = document.getElementById('btn-quick-sonar');
    if (btnQuickSonar) {
      btnQuickSonar.addEventListener('click', (e) => {
        e.stopPropagation();
        const sonarPanel = document.getElementById('sonar-waterfall-panel');
        if (sonarPanel) {
          const isHidden = sonarPanel.style.display === 'none' || !sonarPanel.style.display;
          sonarPanel.style.display = isHidden ? 'block' : 'none';
          this.sonarActive = isHidden;
          if (this.engine3D) this.engine3D.setSonarActive(isHidden);
        }
      });
    }

    const btnQuickRov = document.getElementById('btn-quick-rov');
    if (btnQuickRov) {
      btnQuickRov.addEventListener('click', (e) => {
        e.stopPropagation();
        const mockMission = { id: 'm1_4', code: 'OP-104', title: 'Микро-ROV тест', timeLimit: 180 };
        this._startRovMission(mockMission, { act: 1, sector: this.currentSector });
      });
    }

    const btnQuickBoat = document.getElementById('btn-quick-boat');
    if (btnQuickBoat) {
      btnQuickBoat.addEventListener('click', (e) => {
        e.stopPropagation();
        this.start3DMissionSortie('pilot_test');
        setTimeout(() => {
          if (this.engine3D) {
            this.engine3D.setVsaState(false);
            this.vsaEnabled = false;
            this.showMissionWarning('🚤 ТЕСТ-ДРАЙВ КАТЕРА: Курсовая устойчивость VSA отключена для управляемого заноса!');
          }
        }, 600);
      });
    }

    // Tactical Hub Direct Launchers
    const btnThSonar = document.getElementById('btn-th-launch-sonar');
    if (btnThSonar) {
      btnThSonar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tacticalModal) tacticalModal.classList.remove('active');
        this.start3DMissionSortie('sonar_test');
        setTimeout(() => {
          if (this.engine3D) {
            this.engine3D.setSonarActive(true);
            this.sonarActive = true;
            const sonarPanel = document.getElementById('sonar-waterfall-panel');
            if (sonarPanel) sonarPanel.style.display = 'block';
          }
        }, 500);
      });
    }

    const btnThRov = document.getElementById('btn-th-launch-rov');
    if (btnThRov) {
      btnThRov.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tacticalModal) tacticalModal.classList.remove('active');
        const mockMission = { id: 'm1_4', code: 'OP-104', title: 'Микро-ROV спецоперация', timeLimit: 180 };
        this._startRovMission(mockMission, { act: 1, sector: this.currentSector });
      });
    }

    const btnThBoat = document.getElementById('btn-th-launch-boat');
    if (btnThBoat) {
      btnThBoat.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tacticalModal) tacticalModal.classList.remove('active');
        this.start3DMissionSortie('drift_test');
        setTimeout(() => {
          if (this.engine3D) {
            this.engine3D.setVsaState(false);
            this.vsaEnabled = false;
            this.showMissionWarning('🚤 ТЕСТ VSA: Попробуйте клавиши [V] (стабилизация) и [H] (динамический якорь)!');
          }
        }, 600);
      });
    }

    const btnThPid = document.getElementById('btn-th-open-pid');
    if (btnThPid) {
      btnThPid.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tacticalModal) tacticalModal.classList.remove('active');
        const hangarModal = document.getElementById('hangar-modal');
        if (hangarModal) hangarModal.classList.add('active');
      });
    }

    const btnThKinburn = document.getElementById('btn-th-launch-kinburn');
    if (btnThKinburn) {
      btnThKinburn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tacticalModal) tacticalModal.classList.remove('active');
        this.changeSector('sector-5');
        this.addNotification('🏝️ КИНБУРНСКАЯ КОСА', 'Сектор развёртывания изменён на Кинбурнскую косу (x4.0 Награды)!');
      });
    }

    // Apply crafted upgrades
    if (store.state.craftedModules.includes('non_magnetic_hull') && this.engine3D) {
      this.engine3D.setNonMagneticHull(true);
    }
    if (store.state.craftedModules.includes('ai_jetson_module') && this.engine3D) {
      this.engine3D.setFpvAiModule(true);
    }
  }

  drawSonarWaterfall() {
    const canvas = document.getElementById('sonar-waterfall-canvas');
    if (!canvas || canvas.offsetParent === null) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Scroll canvas down
    const imgData = ctx.getImageData(0, 0, W, H - 3);
    ctx.putImageData(imgData, 0, 3);

    // Top scanline
    const depth = parseFloat((this.engine3D && this.engine3D.currentDepth) || 12.4);
    const speed = Math.abs((this.engine3D && this.engine3D.pilotSpeed) || 0);
    const isClean = speed < 18;

    const depthEl = document.getElementById('sonar-telemetry-depth');
    if (depthEl) depthEl.textContent = `ГЛУБИНА: ${depth.toFixed(1)} м`;

    ctx.fillStyle = '#01060a';
    ctx.fillRect(0, 0, W, 3);

    // Gradient backscatter
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#00140c');
    grad.addColorStop(0.5, '#003822');
    grad.addColorStop(1, '#00140c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 3);

    if (Math.random() > 0.35) {
      ctx.fillStyle = isClean ? '#00ff88' : '#00aa55';
      const scatterX = Math.random() * W;
      ctx.fillRect(scatterX, 0, isClean ? 4 : 14, 2);
    }

    if (this.engine3D && this.engine3D.missionMines && this.engine3D.missionMines.length > 0) {
      this.engine3D.missionMines.forEach(m => {
        const dx = m.position.x - this.engine3D.pilotBoatPos.x;
        const dz = m.position.z - this.engine3D.pilotBoatPos.z;
        if (Math.abs(dz) < 18 && Math.abs(dx) < 40) {
          const mapX = (W / 2) + (dx / 40) * (W / 2);
          ctx.fillStyle = '#ff0033';
          ctx.fillRect(mapX - 4, 0, 8, 3);
        }
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.barracudaGame = new BarracudaGame();
  window.barracudaGame.initTechTree();
  window.barracudaGame.initSettings();
  window.barracudaGame.initAdvancedTacticalSystems();
});

