// systems/DifficultySystem.js
// Yo gestiono la dificultad de forma centralizada para que sea predecible y fácil de balancear.
// La filosofía es: difícil → desafiante → JUSTA. Nunca aleatoria injusta.

import { GAMEPLAY } from '../config/GameConfig.js';

export class DifficultySystem {
  constructor() {
    this.level = 1;
    this.elapsed = 0;
    this._lastLevel = 1;
  }

  reset() {
    this.level = 1;
    this.elapsed = 0;
    this._lastLevel = 1;
  }

  // Yo actualizo el sistema cada frame — retorno true si el nivel subió
  update(dt) {
    this.elapsed += dt;
    const newLevel = Math.min(
      GAMEPLAY.MAX_LEVEL,
      1 + Math.floor(this.elapsed / GAMEPLAY.LEVEL_DURATION)
    );

    if (newLevel !== this.level) {
      this._lastLevel = this.level;
      this.level = newLevel;
      return true; // Señal de level-up
    }
    return false;
  }

  // Yo calculo la velocidad actual interpolando suavemente entre nivel y nivel
  get speed() {
    return Math.min(
      GAMEPLAY.MAX_SPEED,
      GAMEPLAY.BASE_SPEED + (this.level - 1) * GAMEPLAY.SPEED_PER_LEVEL
    );
  }

  // Yo calculo el tiempo entre spawns — disminuye conforme la dificultad sube
  get spawnGap() {
    const t = (this.level - 1) / (GAMEPLAY.MAX_LEVEL - 1); // 0..1
    return GAMEPLAY.SPAWN_MAX_GAP - t * (GAMEPLAY.SPAWN_MAX_GAP - GAMEPLAY.SPAWN_MIN_AT_MAX);
  }

  // Yo desbloqueo tipos de obstáculos progresivamente para no abrumar al jugador desde el inicio
  get allowedObstacleTypes() {
    const types = ['ground_short'];
    if (this.level >= 2) types.push('ground_tall');
    if (this.level >= 3) types.push('air_low');
    if (this.level >= 4) types.push('ground_wide');
    if (this.level >= 5) types.push('air_mid');
    if (this.level >= 7) types.push('combo');
    return types;
  }

  // Yo permito el shield a partir del nivel definido en config
  get shieldAllowed() {
    return this.level >= GAMEPLAY.SHIELD_MIN_LEVEL;
  }

  // Índice visual para paleta de colores (0..2)
  get paletteIndex() {
    return (this.level - 1) % 3;
  }
}
