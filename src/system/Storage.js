// system/Storage.js

const CONFIG = {
  PREFIX: 'dym_runner_v1_', // Cambia esto si haces una secuela
  MAX_SCORES: 10 // Tamaño máximo del leaderboard
};

const KEYS = {
  BEST: 'best_score',
  RANKING: 'ranking',
  SOUND: 'sound_on'
};

export const Storage = {
  
  /* =========================
      PUBLIC API
     ========================= */

  /**
   * Obtiene la mejor puntuación histórica (Número).
   */
  loadBest() {
    const val = Number(this._get(KEYS.BEST));
    return Number.isFinite(val) ? val : 0;
  },

  /**
   * Guarda la mejor puntuación solo si supera la anterior.
   * Retorna true si fue un nuevo récord.
   */
  saveBest(score) {
    const currentBest = this.loadBest();
    if (score > currentBest) {
      this._set(KEYS.BEST, score);
      return true; // ¡Nuevo Récord!
    }
    return false;
  },

  /**
   * Carga el ranking validado y ordenado.
   */
  loadRanking() {
    const raw = this._get(KEYS.RANKING);
    if (!raw) return [];

    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];

      // Validar integridad de datos (evitar nulls o datos corruptos)
      return arr
        .filter(item => item && typeof item.name === 'string' && Number.isFinite(item.score))
        .sort((a, b) => b.score - a.score); // Asegurar orden descendente
    } catch {
      return [];
    }
  },

  /**
   * Agrega una puntuación al ranking.
   * - Ordena automáticamente.
   * - Mantiene solo el Top 10.
   * - Retorna el nuevo ranking.
   */
  addScoreToRanking(name, score) {
    const list = this.loadRanking();
    
    // Agregamos nueva entrada
    list.push({ 
      name: name.trim().substring(0, 12) || 'Anónimo', // Limitar largo de nombre
      score: Math.floor(score),
      date: Date.now() 
    });

    // Ordenar (Mayor a menor)
    list.sort((a, b) => b.score - a.score);

    // Cortar sobrantes (Top 10)
    const topList = list.slice(0, CONFIG.MAX_SCORES);

    this._set(KEYS.RANKING, JSON.stringify(topList));
    
    // Sincronizar también el "Best Score" individual
    if (topList.length > 0) {
        this.saveBest(topList[0].score);
    }

    return topList;
  },

  /**
   * Configuración de Sonido
   */
  loadSoundOn() {
    const val = this._get(KEYS.SOUND);
    // Por defecto true si es null (primera vez)
    return val === null ? true : val === 'true';
  },

  saveSoundOn(on) {
    this._set(KEYS.SOUND, String(!!on));
  },

  /* =========================
      INTERNAL HELPERS
     ========================= */

  _get(key) {
    try {
      return localStorage.getItem(CONFIG.PREFIX + key);
    } catch (e) {
      console.warn('LocalStorage no disponible:', e);
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(CONFIG.PREFIX + key, value);
    } catch (e) {
      console.warn('Error guardando en LocalStorage:', e);
    }
  }
};