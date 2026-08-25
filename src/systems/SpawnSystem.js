// systems/SpawnSystem.js
// Yo gestiono todos los obstáculos SVG con object pooling.

import Phaser from 'phaser';
import { GAMEPLAY, VIRTUAL_W } from '../config/GameConfig.js';

const GY = GAMEPLAY.GROUND_Y; // línea del suelo (y=400)

// ── Definiciones de obstáculos ─────────────────────────────
// posY: qué tan alto sobre el suelo aparece el TOP del obstáculo (valor positivo = hacia arriba)
// origin del img = (0.5, 1) => la base del sprite toca GY
const OBSTACLE_DEFS = {

  // ═══ TERRESTRES — jugador debe SALTAR ════════════════════

  katana: {
    key: 'katana', evasion: 'jump',
    w: 36, h: 88,
    hitBox: { ox: 8, oy: 4, w: 20, h: 78 },
    minLevel: 1
  },
  roca: {
    key: 'roca', evasion: 'jump',
    w: 72, h: 50,
    hitBox: { ox: 8, oy: 8, w: 56, h: 36 },
    minLevel: 1
  },
  tronco: {
    key: 'tronco', evasion: 'jump',
    w: 90, h: 36,
    hitBox: { ox: 8, oy: 6, w: 74, h: 24 },
    minLevel: 1
  },
  caja: {
    key: 'caja', evasion: 'jump',
    w: 48, h: 48,
    hitBox: { ox: 4, oy: 4, w: 40, h: 40 },
    minLevel: 2
  },
  cajas2: {
    key: 'caja', evasion: 'jump',
    w: 48, h: 96, stacked: 2,
    hitBox: { ox: 4, oy: 4, w: 40, h: 88 },
    minLevel: 3
  },
  hoguera: {
    key: 'hoguera', evasion: 'jump',
    w: 60, h: 76,
    hitBox: { ox: 12, oy: 28, w: 36, h: 44 },
    minLevel: 2
  },
  shoji: {
    key: 'shoji', evasion: 'jump',
    w: 55, h: 84,
    hitBox: { ox: 4, oy: 4, w: 47, h: 76 },
    minLevel: 4
  },
  katana2: {
    key: 'katana', evasion: 'jump',
    w: 36, h: 88, angle: -25,
    hitBox: { ox: 4, oy: 4, w: 28, h: 78 },
    minLevel: 3
  },

  // ═══ AÉREOS — jugador debe AGACHARSE / SLIDE ══════════════

  torii: {
    key: 'torii', evasion: 'slide',
    w: 120, h: 70,
    hitBox: { ox: 0, oy: 0, w: 120, h: 26 }, // solo la viga superior
    minLevel: 2
  },
  bambu: {
    key: 'bambu', evasion: 'slide',
    w: 140, h: 58,
    hitBox: { ox: 0, oy: 0, w: 140, h: 18 },
    minLevel: 3
  },
  cuerda: {
    key: 'cuerda', evasion: 'slide',
    w: 160, h: 52,
    hitBox: { ox: 8, oy: 10, w: 144, h: 16 },
    minLevel: 2
  },
};

function getAllowedTypes(level) {
  return Object.entries(OBSTACLE_DEFS)
    .filter(([, d]) => d.minLevel <= level)
    .map(([k]) => k);
}

export class SpawnSystem {
  constructor(scene) {
    this._scene   = scene;
    this._active  = [];
    this._pool    = {};
    this._timer   = 2.0; // Yo espero 2s antes del primer obstáculo

    this._shieldObj     = null;
    this._shieldSpawned = false;
  }

  reset() {
    this._active.forEach(o => this._recycle(o));
    this._active = [];
    if (this._shieldObj) {
      this._shieldObj.setVisible(false).setActive(false);
      this._shieldObj = null;
    }
    this._timer         = 2.0;
    this._shieldSpawned = false;
  }

  update(dt, difficulty) {
    // ── Timer de spawn ──
    this._timer -= dt;
    if (this._timer <= 0) {
      this._spawnNext(difficulty);
      const gap = difficulty.spawnGap;
      this._timer = gap * (0.8 + Math.random() * 0.4);
    }

    const speed = difficulty.speed;

    // ── Mover obstáculos activos ──
    for (let i = this._active.length - 1; i >= 0; i--) {
      const o = this._active[i];
      o.container.x -= speed * dt;
      if (o.container.x < -200) {
        this._recycle(o);
        this._active.splice(i, 1);
      }
    }

    // ── Shield ──
    this._updateShield(speed, dt);

    if (!this._shieldSpawned && difficulty.shieldAllowed) {
      this._spawnShield();
      this._shieldSpawned = true;
    }
  }

  _spawnNext(difficulty) {
    const allowed = getAllowedTypes(difficulty.level);
    const type    = allowed[Math.floor(Math.random() * allowed.length)];
    this._spawnObstacle(type);
  }

  _spawnObstacle(type) {
    const def = OBSTACLE_DEFS[type];
    if (!def) return;

    const pool = this._pool[type] || (this._pool[type] = []);
    let obj = pool.pop();

    if (!obj) {
      obj = this._createObstacle(type, def);
    }

    // Yo posiciono el container con origin en el suelo (GY)
    // El img tiene origin=(0.5,1) → su base queda exactamente en GY
    const x = VIRTUAL_W + 80;
    obj.container.setPosition(x, GY);
    obj.container.setVisible(true).setActive(true);

    if (def.angle && obj.img) {
      obj.img.setAngle(def.angle);
    } else if (obj.img) {
      obj.img.setAngle(0);
    }

    this._active.push(obj);
  }

  _createObstacle(type, def) {
    // container en GY — los sprites cuelgan hacia arriba desde origin (0.5,1)
    const container = this._scene.add.container(VIRTUAL_W + 80, GY);
    container.setDepth(8);

    let img;

    if (def.stacked === 2) {
      // Dos cajas apiladas: la primera base en y=0, la segunda en y = -h/2
      const half = def.h / 2;
      const img1 = this._scene.add.image(0,     0,    def.key).setOrigin(0.5, 1).setDisplaySize(def.w, half);
      const img2 = this._scene.add.image(0, -half,    def.key).setOrigin(0.5, 1).setDisplaySize(def.w, half);
      container.add([img1, img2]);
      img = img1; // referencia para el angle (no aplica en cajas)
    } else {
      img = this._scene.add.image(0, 0, def.key).setOrigin(0.5, 1).setDisplaySize(def.w, def.h);
      container.add(img);
    }

    return { container, img, def, type };
  }

  _recycle(obj) {
    obj.container.setVisible(false).setActive(false);
    if (obj.img) obj.img.setAngle(0);
    const pool = this._pool[obj.type] || (this._pool[obj.type] = []);
    pool.push(obj);
  }

  // ── Shield power-up ──────────────────────────────────────
  _spawnShield() {
    const x     = VIRTUAL_W + 100;
    const baseY = GY - 70;

    const glow   = this._scene.add.circle(x, baseY, 20, 0x00f2ff, 0.15);
    const circle = this._scene.add.circle(x, baseY, 14, 0x00f2ff, 0.9);
    circle.setStrokeStyle(2, 0xffffff, 0.8);
    const label  = this._scene.add.text(x, baseY, '盾', {
      fontFamily: 'serif', fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5);

    // Yo uso el glow como objeto principal para mover todo junto
    glow.setDepth(9);
    circle.setDepth(9);
    label.setDepth(9);

    // Grupo lógico: muevo el glow y los demás lo siguen
    glow._circle = circle;
    glow._label  = label;
    glow._baseY  = baseY;
    glow._t      = 0;
    glow.setActive(true).setVisible(true);

    this._shieldObj = glow;

    // Actualización del shield se hace en update() — aquí solo apunto los hijos
    this._shieldCircle = circle;
    this._shieldLabel  = label;
  }

  // Sobreescribo el update del shield para mover los 3 elementos juntos
  _updateShield(speed, dt) {
    if (!this._shieldObj || !this._shieldObj.active) return;
    const dx = speed * dt;
    this._shieldObj.x    -= dx;
    this._shieldCircle.x -= dx;
    this._shieldLabel.x  -= dx;

    this._shieldObj._t += dt * 4;
    const dy = Math.sin(this._shieldObj._t) * 8;
    this._shieldObj.y    = this._shieldObj._baseY + dy;
    this._shieldCircle.y = this._shieldObj._baseY + dy;
    this._shieldLabel.y  = this._shieldObj._baseY + dy;

    if (this._shieldObj.x < -100) {
      this._shieldObj.setVisible(false).setActive(false);
      this._shieldCircle.setVisible(false);
      this._shieldLabel.setVisible(false);
      this._shieldObj = null;
    }
  }

  // ── Colisiones ───────────────────────────────────────────
  getObstacleBoundsForPlayer(pb) {
    const hits = [];
    for (const o of this._active) {
      if (!o.container.active || !o.container.visible) continue;

      const cx  = o.container.x;  // centro X
      const def = o.def;

      // container.y = GY, img origin=(0.5,1)
      // → top del sprite en mundo = GY - def.h
      // → left = cx - def.w/2
      const worldTop  = GY - def.h;
      const worldLeft = cx - def.w / 2;

      const hb = def.hitBox;
      const bx = worldLeft + hb.ox;
      const by = worldTop  + hb.oy;
      const bw = hb.w;
      const bh = hb.h;

      if (this._overlap(pb.x, pb.y, pb.w, pb.h, bx, by, bw, bh)) {
        hits.push({ obj: o, evasion: def.evasion });
      }
    }
    return hits;
  }

  getShieldBounds() {
    if (!this._shieldObj || !this._shieldObj.active) return null;
    return {
      x: this._shieldObj.x - 16,
      y: this._shieldObj.y - 16,
      w: 32, h: 32
    };
  }

  collectShield() {
    if (!this._shieldObj) return;
    this._shieldObj.setVisible(false).setActive(false);
    if (this._shieldCircle) this._shieldCircle.setVisible(false);
    if (this._shieldLabel)  this._shieldLabel.setVisible(false);
    this._shieldObj = null;
  }

  destroyObstacle(obj) {
    const idx = this._active.indexOf(obj);
    if (idx !== -1) {
      this._recycle(obj);
      this._active.splice(idx, 1);
    }
  }

  _overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
}
