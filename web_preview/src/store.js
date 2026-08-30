// =========================================================================
// BARRACUDA GAME STATE MANAGER (Vanilla JS Event Bus + Encrypted LocalStorage)
// =========================================================================

const SAVE_KEY = 'barracuda_save_v7';
const ENCRYPTION_SALT = 'brc_salt_x9';

const initialState = {
  creditsUSD: 500,
  dataMB: 0.0,
  totalDataMB: 0.0,
  blueprintsBP: 0,
  sunkenShips: 0,
  totalClicks: 0,
  totalCrits: 0,
  totalHacks: 0,
  overclockUses: 0,
  visitedSectors: ['sector-1'],
  shieldSaves: 0,
  selectedPrototype: 'phantom',
  unlockedPrototypes: ['phantom'],
  salvage: { box: 0, chips: 0, titanium: 0, aicore: 0 },
  craftedModules: [],
  campaignAct: 1,
  completedMissions: [],
  hw: { satcom: 0, optics: 0, armor: 0, waterjets: 0, missiles: 0 },
  cyber: { sniffer: 0, quantum: 0, autosiphon: 0 },
  tech: { swarmAI: false },
  shipLevel: 1,
  unlockedAchievements: [],
  prestigeLevel: 0,
  soundEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 1.0,
};

class Store {
  constructor() {
    this._rawState = JSON.parse(JSON.stringify(initialState));
    this.state = this._createProxy(this._rawState);
    this.listeners = new Set();
    this.load();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
    this.save();
  }

  getState() {
    return this.state;
  }

  updateState(key, value) {
    this.state[key] = value;
    this.notify();
  }

  _xorCrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  
  _createProxy(obj) {
    const self = this;
    return new Proxy(obj, {
      set(target, property, value) {
        target[property] = value;
        self.notify();
        return true;
      },
      get(target, property) {
        if (typeof target[property] === 'object' && target[property] !== null) {
          return self._createProxy(target[property]);
        }
        return target[property];
      }
    });
  }

  save() {
    try {
      const jsonStr = JSON.stringify(this._rawState);
      const encrypted = btoa(this._xorCrypt(jsonStr, ENCRYPTION_SALT));
      localStorage.setItem(SAVE_KEY, encrypted);
    } catch (e) {}
  }

  load() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (data) {
        const decrypted = this._xorCrypt(atob(data), ENCRYPTION_SALT);
        const parsed = JSON.parse(decrypted);
        this._rawState = { ...initialState, ...parsed };
        this.state = this._createProxy(this._rawState);
      }
    } catch (e) {
      console.warn('Failed to load game state, using defaults.');
      this._rawState = JSON.parse(JSON.stringify(initialState));
    this.state = this._createProxy(this._rawState);
    }
  }

  hardReset() {
    this._rawState = JSON.parse(JSON.stringify(initialState));
    this.state = this._createProxy(this._rawState);
    this.notify();
  }
}

export const store = new Store();
