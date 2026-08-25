// scenes/PlayScene.js
// Yo orquesto el gameplay completo con Phaser 3 Arcade Physics.

import Phaser from 'phaser';
import { VIRTUAL_W, VIRTUAL_H, GAMEPLAY } from '../config/GameConfig.js';
import { Player, PLAYER_STATE } from '../entities/Player.js';
import { DifficultySystem } from '../systems/DifficultySystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';
import { StorageSystem } from '../systems/StorageSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { HUD } from '../ui/HUD.js';

const GY = GAMEPLAY.GROUND_Y;

const LEVEL_PALETTES = [
  { bg: 0x0a0c12, groundTop: 0x0d1520, groundLine: 0x00f2ff, buildA: 0x0f1623, buildB: 0x131d2e, buildC: 0x18263c },
  { bg: 0x100810, groundTop: 0x180a12, groundLine: 0xff3355, buildA: 0x1a0a14, buildB: 0x220e1a, buildC: 0x2c1220 },
  { bg: 0x060e0e, groundTop: 0x0a1418, groundLine: 0x00ffcc, buildA: 0x0a1a18, buildB: 0x0e2020, buildC: 0x122828 },
];

export class PlayScene extends Phaser.Scene {
  constructor() { super({ key: 'PlayScene' }); }

  init(data) {
    this._audio = data.audio || new AudioSystem();
  }

  create() {
    this._score     = 0;
    this._bestScore = StorageSystem.loadBest();
    this._isOver    = false;
    this._isPaused  = false;
    this._pal       = LEVEL_PALETTES[0];

    this._difficulty = new DifficultySystem();
    this._spawn      = new SpawnSystem(this);

    this._buildWorld();
    this._buildPlayer();
    this._buildParticles();
    this._buildInputs();
    this._buildHUD();

    this._audio.resume();
    this._audio.startAmbientMusic();

    this.events.on('player_jumped', () => this._audio.play('jump'));
    this.events.on('player_landed', () => {
      this._audio.play('land');
      this._emitDust(this._player.x, GY);
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Yo uso un botón de pausa táctil visible para móviles
    this._buildMobileUI();
  }

  // ══════════════════════════════════════════════════════
  // MUNDO / BACKGROUND
  // ══════════════════════════════════════════════════════

  _buildWorld() {
    // Fondo base
    this._bgRect = this.add.rectangle(VIRTUAL_W/2, VIRTUAL_H/2, VIRTUAL_W, VIRTUAL_H, 0x0a0c12).setDepth(0);

    // Grid cyberpunk de fondo
    this._gridGfx = this.add.graphics().setDepth(1);
    this._drawGrid();

    // Luna cyberpunk tenebrosa — fija, no se mueve con parallax
    this._moonGfx = this.add.graphics().setDepth(1);
    this._drawMoon();

    // Capa LEJANA: edificios altos bien espaciados (skyline de fondo)
    this._buildingsF = this._createBuildingsSpaced(8, 0x0f1623, 140, 240, 45, 85, 0.06, 2);
    // Capa MEDIA: edificios medianos con hueco entre ellos
    this._buildingsM = this._createBuildingsSpaced(6, 0x131d2e, 70, 130, 28, 55, 0.2, 3);
    // Capa CERCANA: siluetas pequeñas en primer plano
    this._buildingsN = this._createBuildingsSpaced(5, 0x18263c, 30, 60,  18, 38, 0.48, 4);

    // Ventanas neón — datos relativos a cada edificio, se redibujan cada frame
    this._windowsGfx = this.add.graphics().setDepth(3);
    this._windowData = this._generateWindowData();

    // Suelo
    this._groundGfx = this.add.graphics().setDepth(5);
    this._drawGround();

    // Línea neón del suelo
    this._groundLineGfx = this.add.graphics().setDepth(6);
    this._drawGroundLine();

    // Detalles del suelo
    this._floorDetails = this.add.graphics().setDepth(5);
    this._drawFloorDetails();

    // Graphics del escudo del jugador
    this._shieldGfx = this.add.graphics().setDepth(20);
  }

  _drawMoon() {
    // Luna fija en posición — NO usa coordenadas que se muevan con el parallax
    const mx = VIRTUAL_W - 100;
    const my = 80;
    const g = this._moonGfx;
    g.clear();

    // Resplandor exterior tenebroso
    g.fillStyle(0x00f2ff, 0.03);
    g.fillCircle(mx, my, 65);
    g.fillStyle(0x00f2ff, 0.05);
    g.fillCircle(mx, my, 52);

    // Disco principal
    g.fillStyle(0x0a1a1f, 1);
    g.fillCircle(mx, my, 40);

    // Borde neón
    g.lineStyle(2, 0x00f2ff, 0.55);
    g.strokeCircle(mx, my, 40);

    // Cráteres para look tenebroso
    g.lineStyle(1, 0x00f2ff, 0.18);
    g.strokeCircle(mx - 12, my - 8, 9);
    g.strokeCircle(mx + 14, my + 10, 6);
    g.strokeCircle(mx - 5, my + 14, 4);

    // Reflejo interior
    g.fillStyle(0x00f2ff, 0.06);
    g.fillCircle(mx - 10, my - 12, 14);
  }

  _drawGrid() {
    const g = this._gridGfx;
    g.clear();
    g.lineStyle(1, 0x00f2ff, 0.04);
    for (let x = 0; x < VIRTUAL_W; x += 48) g.lineBetween(x, 0, x, VIRTUAL_H);
    for (let y = 0; y < VIRTUAL_H; y += 48) g.lineBetween(0, y, VIRTUAL_W, y);
  }

  _createBuildings(count, color, minH, maxH, minW, maxW, pSpeed, depth) {
    return this._createBuildingsSpaced(count, color, minH, maxH, minW, maxW, pSpeed, depth);
  }

  // Yo distribuyo los edificios en columnas separadas uniformemente para evitar amontonamiento
  _createBuildingsSpaced(count, color, minH, maxH, minW, maxW, pSpeed, depth) {
    const list = [];
    // Divido la pantalla + un margen extra para el wrap-around en count slots iguales
    const totalSpan = VIRTUAL_W + 200;
    const slotW = totalSpan / count;

    for (let i = 0; i < count; i++) {
      const w = Phaser.Math.Between(minW, maxW);
      const h = Phaser.Math.Between(minH, maxH);
      // Yo pongo el edificio en una posición aleatoria DENTRO de su slot, con margen
      const slotLeft = i * slotW - 100; // empieza un poco antes del borde izquierdo
      const margin   = Math.max(4, (slotW - w) * 0.5);
      const x = slotLeft + margin + Math.random() * Math.max(0, slotW - w - margin * 2);
      const y = GY - h;
      const r = this.add.rectangle(x, y, w, h, color).setOrigin(0, 0).setDepth(depth);
      r._pSpeed = pSpeed;
      r._color  = color;
      list.push(r);
    }
    return list;
  }

  // Yo genero los datos de ventanas UNA SOLA VEZ y los guardo relativos al edificio
  _generateWindowData() {
    const colors = [0x00f2ff, 0x9b59ff, 0xffcc00, 0xff3355];
    const allBuildings = [...this._buildingsF, ...this._buildingsM];
    const data = new Map();

    allBuildings.forEach(b => {
      const windows = [];
      const rows = Math.floor(b.height / 18);
      const cols = Math.floor(b.width  / 12);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.55) {
            const col = colors[Math.floor(Math.random() * colors.length)];
            const alpha = 0.15 + Math.random() * 0.2;
            // Yo guardo posición RELATIVA al origen del edificio (b.x, b.y)
            windows.push({
              relX: c * 12 + 2,
              relY: r * 18 + 3,
              w: 8, h: 10,
              color: col,
              alpha
            });
          }
        }
      }
      data.set(b, windows);
    });
    return data;
  }

  // Yo redibuj las ventanas cada frame usando la posición ACTUAL de cada edificio
  _drawWindowLights() {
    const g = this._windowsGfx;
    g.clear();
    this._windowData.forEach((windows, building) => {
      windows.forEach(win => {
        g.fillStyle(win.color, win.alpha);
        // Uso building.x y building.y (posición actual del edificio en parallax)
        g.fillRect(building.x + win.relX, building.y + win.relY, win.w, win.h);
      });
    });
  }

  _drawGround() {
    const g = this._groundGfx;
    g.clear();
    g.fillStyle(this._pal.groundTop, 1);
    g.fillRect(0, GY, VIRTUAL_W, VIRTUAL_H - GY);

    // Yo agrego una franja más oscura en la base
    g.fillStyle(0x060c14, 1);
    g.fillRect(0, VIRTUAL_H - 20, VIRTUAL_W, 20);
  }

  _drawGroundLine() {
    const g = this._groundLineGfx;
    g.clear();
    g.lineStyle(3, this._pal.groundLine, 0.7);
    g.lineBetween(0, GY, VIRTUAL_W, GY);
    // Glow difuso
    g.lineStyle(8, this._pal.groundLine, 0.08);
    g.lineBetween(0, GY, VIRTUAL_W, GY);
    g.lineStyle(14, this._pal.groundLine, 0.04);
    g.lineBetween(0, GY, VIRTUAL_W, GY);
  }

  _drawFloorDetails() {
    // Líneas de perspectiva isométrica en el suelo — efecto cyberpunk
    const g = this._floorDetails;
    g.clear();
    g.lineStyle(1, 0x00f2ff, 0.06);
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const yOff = (i / steps) * (VIRTUAL_H - GY);
      g.lineBetween(0, GY + yOff, VIRTUAL_W, GY + yOff);
    }
  }

  // ══════════════════════════════════════════════════════
  // JUGADOR Y SUELO FÍSICO
  // ══════════════════════════════════════════════════════

  _buildPlayer() {
    // FIX PRINCIPAL: Yo creo el suelo físico usando StaticGroup + zona explícita.
    // staticImage con '__DEFAULT' tiene un bug conocido en Phaser 3 donde el
    // árbol espacial de colisiones no indexa correctamente el cuerpo escalado,
    // haciendo que la separación física nunca ocurra.
    this._groundGroup = this.physics.add.staticGroup();

    // Yo creo un rectángulo de Phaser con física estática real
    const groundRect = this.add.rectangle(
      VIRTUAL_W / 2,  // cx
      GY + 10,        // cy — justo debajo de la línea del suelo
      VIRTUAL_W,      // ancho = todo el escenario
      20,             // alto del colisionador
      0x000000, 0     // transparente (invisible)
    );
    this.physics.add.existing(groundRect, true); // true = estático
    this._groundCollider = groundRect;

    // Yo posiciono al ninja CON LOS PIES EN GY.
    // Player.js descuenta internamente la mitad de la altura del body,
    // así que sólo paso GY y el ninja queda parado justo en la línea.
    this._player = new Player(this, 100, GY);
    this._player.setDepth(10);

    // Colisionador jugador ↔ suelo
    this.physics.add.collider(this._player, groundRect);
  }

  // ══════════════════════════════════════════════════════
  // PARTÍCULAS MANUALES (pool)
  // ══════════════════════════════════════════════════════

  _buildParticles() {
    this._particles    = [];
    this._pPool        = [];
    this._particleGfx  = this.add.graphics().setDepth(50);
  }

  _spawnP(x, y, vx, vy, color, life, size, gravity = 500) {
    let p = this._pPool.pop() || {};
    Object.assign(p, { x, y, vx, vy, color, life, maxLife: life, size, gravity });
    this._particles.push(p);
  }

  _emitExplosion(x, y) {
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 70 + Math.random() * 200;
      const col = Math.random() > 0.5 ? 0xff3355 : 0xff8800;
      this._spawnP(x, y, Math.cos(a)*s, Math.sin(a)*s - 60, col, 0.5 + Math.random()*0.5, 2 + Math.random()*3);
    }
  }

  _emitShieldBreak(x, y) {
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 90 + Math.random() * 200;
      const col = Math.random() > 0.5 ? 0x00f2ff : 0xffffff;
      this._spawnP(x, y, Math.cos(a)*s, Math.sin(a)*s, col, 0.6 + Math.random()*0.5, 1 + Math.random()*3, 350);
    }
  }

  _emitDust(x, y) {
    for (let i = 0; i < 6; i++) {
      this._spawnP(x + (Math.random()-0.5)*20, y,
        (Math.random()-0.5)*45, -15 - Math.random()*25,
        0x3a5066, 0.25 + Math.random()*0.25, 2 + Math.random()*2, 0);
    }
  }

  _emitShieldAura(x, y) {
    if (Math.random() > 0.4) return; // Yo limito la cantidad de partículas del aura
    this._spawnP(x + (Math.random()-0.5)*28, y + (Math.random()-0.5)*28,
      (Math.random()-0.5)*14, -22 - Math.random()*28,
      0x00f2ff, 0.4, 1 + Math.random()*2, 0);
  }

  _updateParticles(dt) {
    const g = this._particleGfx;
    g.clear();
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life -= dt;
      if (p.life <= 0) { this._pPool.push(this._particles.splice(i, 1)[0]); continue; }
      p.vy += p.gravity * dt;
      p.x  += p.vx * dt;
      p.y  += p.vy * dt;
      const alpha = p.life / p.maxLife;
      g.fillStyle(p.color, alpha);
      g.fillCircle(p.x, p.y, p.size);
    }
  }

  // ══════════════════════════════════════════════════════
  // INPUT
  // ══════════════════════════════════════════════════════

  _buildInputs() {
    // Teclado: salto
    this._jumpKeys = this.input.keyboard.addKeys({
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      w:     Phaser.Input.Keyboard.KeyCodes.W,
      up:    Phaser.Input.Keyboard.KeyCodes.UP
    });
    // Teclado: slide
    this._slideKeys = this.input.keyboard.addKeys({
      s:    Phaser.Input.Keyboard.KeyCodes.S,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN
    });

    this.input.keyboard.on('keydown', (e) => {
      if (this._isOver || this._isPaused) return;
      const k = e.keyCode;
      if (k === 32 || k === 87 || k === 38) this._player.requestJump();
      if (k === 83 || k === 40)              this._player.requestSlide();
      if (k === 27) this._togglePause();
    });

    // Touch — Yo divido la pantalla: mitad superior = saltar, mitad inferior = slide
    this.input.on('pointerdown', (ptr) => {
      if (this._isOver || this._isPaused) return;
      // Ignoro controles táctiles del HUD (primeros 60px)
      if (ptr.y < 60 / (VIRTUAL_H / this.scale.height)) return;

      // Yo normalizo la posición Y del puntero al espacio virtual
      const gameY = ptr.y * (VIRTUAL_H / this.scale.height);

      if (gameY < VIRTUAL_H * 0.55) {
        this._player.requestJump();
      } else {
        this._player.requestSlide();
      }
    });

    // Soporte gamepad (básico)
    this.input.gamepad?.on('down', (pad, btn) => {
      if (btn.index === 0) this._player.requestJump();
      if (btn.index === 1) this._player.requestSlide();
    });
  }

  _buildMobileUI() {
    // Yo creo botones táctiles visibles solo en pantallas táctiles
    const isTouchDevice = this.sys.game.device.input.touch;

    if (!isTouchDevice) return;

    const btnJump = this.add.text(VIRTUAL_W - 90, VIRTUAL_H - 55, '▲ SALTAR', {
      fontFamily: 'monospace', fontSize: '11px', color: '#00f2ff40',
      backgroundColor: '#00f2ff10', padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(200).setInteractive()
      .on('pointerdown', () => { if (!this._isOver) this._player.requestJump(); });

    const btnSlide = this.add.text(VIRTUAL_W - 90, VIRTUAL_H - 25, '▼ SLIDE', {
      fontFamily: 'monospace', fontSize: '11px', color: '#9b59ff40',
      backgroundColor: '#9b59ff10', padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(200).setInteractive()
      .on('pointerdown', () => { if (!this._isOver) this._player.requestSlide(); });

    this._mobileBtns = [btnJump, btnSlide];
  }

  // ══════════════════════════════════════════════════════
  // HUD
  // ══════════════════════════════════════════════════════

  _buildHUD() {
    this._hud = new HUD(this);
  }

  // ══════════════════════════════════════════════════════
  // PAUSA
  // ══════════════════════════════════════════════════════

  _togglePause() {
    this._isPaused = !this._isPaused;
    if (this._isPaused) {
      this.physics.pause();
      this._showPauseOverlay();
    } else {
      this.physics.resume();
      if (this._pauseGroup) { this._pauseGroup.destroy(true); this._pauseGroup = null; }
    }
  }

  _showPauseOverlay() {
    const cx = VIRTUAL_W / 2, cy = VIRTUAL_H / 2;
    this._pauseGroup = this.add.group();
    const bg  = this.add.rectangle(cx, cy, VIRTUAL_W, VIRTUAL_H, 0x000000, 0.65).setDepth(200);
    const txt = this.add.text(cx, cy - 20, 'PAUSA', { fontFamily: 'monospace', fontSize: '40px', color: '#00f2ff' }).setOrigin(0.5).setDepth(201);
    const sub = this.add.text(cx, cy + 22, 'ESC · TOQUE para continuar', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff40' }).setOrigin(0.5).setDepth(201);
    bg.setInteractive().on('pointerdown', () => this._togglePause());
    this._pauseGroup.addMultiple([bg, txt, sub]);
  }

  // ══════════════════════════════════════════════════════
  // GAME OVER
  // ══════════════════════════════════════════════════════

  _triggerGameOver() {
    if (this._isOver) return;
    this._isOver = true;

    this.cameras.main.shake(450, 0.022);
    this._audio.play('hit');
    this._player.die();
    this._emitExplosion(this._player.x, this._player.y);

    this.time.delayedCall(750, () => {
      const isRecord = StorageSystem.saveBest(Math.floor(this._score));
      if (isRecord) this._audio.play('record');

      this.cameras.main.fade(400, 0, 0, 0, false, (cam, p) => {
        if (p === 1) {
          this.scene.start('GameOverScene', {
            score: Math.floor(this._score),
            best:  StorageSystem.loadBest(),
            level: this._difficulty.level,
            audio: this._audio,
            isRecord
          });
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════
  // UPDATE PRINCIPAL
  // ══════════════════════════════════════════════════════

  update(time, deltaMs) {
    if (this._isOver || this._isPaused) return;
    const dt = Math.min(deltaMs / 1000, 0.05);

    this._score += GAMEPLAY.SCORE_PER_SECOND * dt;

    // Dificultad
    const leveledUp = this._difficulty.update(dt);
    if (leveledUp) {
      this._audio.play('levelup');
      this._hud.showLevelUp(this._difficulty.level);
      this._applyPalette(this._difficulty.paletteIndex);
    }

    // Jugador
    this._player.update(dt);

    // Spawns
    this._spawn.update(dt, this._difficulty);

    // Colisiones
    this._checkCollisions();

    // Parallax
    this._updateParallax(dt);

    // Ventanas: Yo las redibujoo cada frame para que sigan al edificio
    this._drawWindowLights();

    // Partículas
    this._updateParticles(dt);

    // Aura del escudo
    if (this._player.hasShield) {
      this._emitShieldAura(this._player.x, this._player.y - 10);
    }

    // Dibujo del escudo
    this._drawShield(time);

    // HUD
    this._hud.update(this._score, this._difficulty.level, this._bestScore, this._player);
  }

  _checkCollisions() {
    const pb = this._player.getHitBounds();
    const hits = this._spawn.getObstacleBoundsForPlayer(pb);

    if (hits.length > 0) {
      const { obj, evasion } = hits[0];
      const sliding = this._player.state === PLAYER_STATE.SLIDE;
      const jumping = this._player.state === PLAYER_STATE.JUMP || this._player.state === PLAYER_STATE.FALL;

      const evaded = (evasion === 'slide' && sliding) || (evasion === 'jump' && jumping);

      if (evaded) {
        return;
      }

      const saved = this._player.absorbHit();
      if (saved) {
        this._audio.play('shield_break');
        this._emitShieldBreak(this._player.x, this._player.y);
        this.cameras.main.shake(200, 0.012);
        this._spawn.destroyObstacle(obj);
      } else {
        this._triggerGameOver();
      }
    }

    // Shield power-up
    const sb = this._spawn.getShieldBounds();
    if (sb) {
      const p = pb;
      if (p.x < sb.x + sb.w && p.x + p.w > sb.x && p.y < sb.y + sb.h && p.y + p.h > sb.y) {
        this._player.activateShield(GAMEPLAY.SHIELD_DURATION);
        this._spawn.collectShield();
        this._audio.play('shield_get');
        this._emitShieldBreak(this._player.x, this._player.y);
      }
    }
  }

  _drawShield(time) {
    this._shieldGfx.clear();
    if (!this._player.hasShield) return;

    const alpha = this._player.shieldTime < 1.5
      ? (Math.sin(time * 0.02) > 0 ? 0.18 : 0.55)
      : 0.32;

    const x = this._player.x;
    const y = this._player.y - 10;

    this._shieldGfx.lineStyle(2, 0x00f2ff, Math.min(1, alpha * 2.5));
    this._shieldGfx.fillStyle(0x00f2ff, alpha * 0.4);
    this._shieldGfx.strokeCircle(x, y, 30);
    this._shieldGfx.fillCircle(x, y, 30);

    // Hexágono interior
    this._shieldGfx.lineStyle(1, 0xffffff, alpha * 0.5);
    this._shieldGfx.strokeCircle(x, y, 22);
  }

  _updateParallax(dt) {
    const speed = this._difficulty.speed;
    const layers = [this._buildingsF, this._buildingsM, this._buildingsN];

    layers.forEach(layer => {
      // Yo encuentro el edificio más a la derecha de esta capa para hacer wrap correcto
      let maxX = -Infinity;
      layer.forEach(r => { if (r.x + r.width > maxX) maxX = r.x + r.width; });

      layer.forEach(r => {
        r.x -= speed * r._pSpeed * dt;

        if (r.x + r.width < -10) {
          // Aparezco a la derecha del edificio más lejano + un hueco aleatorio
          const gap = Phaser.Math.Between(30, 100);
          r.x = Math.max(VIRTUAL_W + 20, maxX + gap);
          maxX = r.x + r.width; // actualizo el máximo para el siguiente wrap

          // Vario ligeramente la altura para diversidad visual
          const newH = Phaser.Math.Between(
            Math.floor(r.height * 0.8),
            Math.floor(r.height * 1.2)
          );
          r.height = newH;
          r.y = GY - newH;

          // Regenero ventanas para el edificio reciclado
          if (this._windowData.has(r)) {
            this._windowData.set(r, this._regenerateWindowsForBuilding(r));
          }
        }
      });
    });
  }

  // Yo regenero ventanas para un edificio que salió del lado izquierdo y reapareció a la derecha
  _regenerateWindowsForBuilding(b) {
    const colors = [0x00f2ff, 0x9b59ff, 0xffcc00, 0xff3355];
    const windows = [];
    const rows = Math.floor(b.height / 18);
    const cols = Math.floor(b.width  / 12);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.55) {
          const col = colors[Math.floor(Math.random() * colors.length)];
          windows.push({
            relX: c * 12 + 2,
            relY: r * 18 + 3,
            w: 8, h: 10,
            color: col,
            alpha: 0.15 + Math.random() * 0.2
          });
        }
      }
    }
    return windows;
  }

  _applyPalette(index) {
    this._pal = LEVEL_PALETTES[index] || LEVEL_PALETTES[0];
    this._bgRect.setFillStyle(this._pal.bg);

    // Actualizo colores de capas de edificios
    this._buildingsF.forEach(b => b.setFillStyle(this._pal.buildA));
    this._buildingsM.forEach(b => b.setFillStyle(this._pal.buildB));
    this._buildingsN.forEach(b => b.setFillStyle(this._pal.buildC));

    this._drawGround();
    this._drawGroundLine();
  }
}


