// systems/StorageSystem.js
// Yo encapsulo todo acceso a localStorage para que no haya accesos directos dispersos en el código

const PREFIX = 'dym_runner_v2_';

const KEYS = {
  BEST:  'best_score',
  SOUND: 'sound_on',
  MUSIC: 'music_on'
};

export const StorageSystem = {

  loadBest() {
    const val = Number(this._get(KEYS.BEST));
    return Number.isFinite(val) ? val : 0;
  },

  // Yo guardo solo si es nuevo récord — retorno true si batió el récord
  saveBest(score) {
    const current = this.loadBest();
    if (score > current) {
      this._set(KEYS.BEST, score);
      return true;
    }
    return false;
  },

  loadSoundOn() {
    const val = this._get(KEYS.SOUND);
    return val === null ? true : val === 'true';
  },

  saveSoundOn(on) {
    this._set(KEYS.SOUND, String(!!on));
  },

  loadMusicOn() {
    const val = this._get(KEYS.MUSIC);
    return val === null ? true : val === 'true';
  },

  saveMusicOn(on) {
    this._set(KEYS.MUSIC, String(!!on));
  },

  _get(key) {
    try { return localStorage.getItem(PREFIX + key); }
    catch { return null; }
  },

  _set(key, value) {
    try { localStorage.setItem(PREFIX + key, value); }
    catch { /* localStorage no disponible — modo incógnito o límite */ }
  }
};
