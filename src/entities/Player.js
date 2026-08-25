// entities/Player.js
// Yo construyo el ninja DyM con animación de frames procedurales,
// salto con coyote time, jump buffering y slide/agacharse.

import Phaser from 'phaser';
import { GAMEPLAY } from '../config/GameConfig.js';

// Yo defino los estados del ninja como constantes para que el código sea legible
export const PLAYER_STATE = {
  RUN:   'run',
  JUMP:  'jump',
  FALL:  'fall',
  SLIDE: 'slide',
  HIT:   'hit',
  DEAD:  'dead'
};

// Dimensiones del ninja según estado
const SIZES = {
  normal: { w: 28, h: 44 },  // corriendo
  slide:  { w: 44, h: 22 }   // agachado
};

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    // y = GY (línea del suelo). El ninja se centra en este punto,
    // así que lo subimos la mitad de su altura para que los PIES queden en GY.
    super(scene, x, y - SIZES.normal.h / 2);
    this._scene = scene;

    // Yo uso un Graphics para dibujar el ninja proceduralmente cada frame
    this._gfx = scene.add.graphics();
    this.add(this._gfx);

    // Física
    scene.physics.add.existing(this);

    // Body: tamaño normal, centrado en el Container
    this.body.setSize(SIZES.normal.w, SIZES.normal.h);
    this.body.setOffset(-SIZES.normal.w / 2, -SIZES.normal.h / 2);

    // Gravedad: usamos la gravedad del juego sobre el body
    this.body.setGravityY(GAMEPLAY.GRAVITY);
    this.body.setMaxVelocityY(900);

    // Estado
    this.state       = PLAYER_STATE.RUN;
    this.hasShield   = false;
    this.shieldTime  = 0;
    this.shieldMaxTime = 0;
    this.isDead      = false;

    // Timers de mecánicas
    this._coyoteTimer     = 0;
    this._jumpBufferTimer = 0;
    this._slideTimer      = 0;
    this._wasOnGround     = false;

    // Animación
    this._animTimer = 0;   // acumula tiempo para animar pies y demás
    this._hitTimer  = 0;   // flash de daño
    this._shieldPulse = 0;

    scene.add.existing(this);
  }

  reset(x, y) {
    this.setPosition(x, y - SIZES.normal.h / 2);
    this.setRotation(0);
    this.setAlpha(1);
    this.setScale(1);

    this.state       = PLAYER_STATE.RUN;
    this.isDead      = false;
    this.hasShield   = false;
    this.shieldTime  = 0;

    this._coyoteTimer     = 0;
    this._jumpBufferTimer = 0;
    this._slideTimer      = 0;
    this._wasOnGround     = false;
    this._animTimer = 0;
    this._hitTimer  = 0;

    // Restaurar hitbox normal
    this._setHitboxNormal();
    this.body.setVelocity(0, 0);
    this.body.allowGravity = true;
  }

  // ── Hitbox helpers ───────────────────────────────────────
  _setHitboxNormal() {
    const s = SIZES.normal;
    this.body.setSize(s.w, s.h);
    this.body.setOffset(-s.w / 2, -s.h / 2);
  }

  _setHitboxSlide() {
    const s = SIZES.slide;
    this.body.setSize(s.w, s.h);
    // Yo posiciono la hitbox en la parte baja para que coincida con el ninja agachado
    this.body.setOffset(-s.w / 2, -s.h / 2 + 11);
  }

  // ── Input público ─────────────────────────────────────────
  requestJump() {
    this._jumpBufferTimer = GAMEPLAY.JUMP_BUFFER_TIME;
  }

  requestSlide() {
    if (this.isDead) return;
    const onGround = this.body.blocked.down;
    if (onGround && this.state !== PLAYER_STATE.SLIDE) {
      this.state = PLAYER_STATE.SLIDE;
      this._slideTimer = GAMEPLAY.SLIDE_DURATION;
      this._setHitboxSlide();
    }
  }

  // ── Acciones ─────────────────────────────────────────────
  _tryJump() {
    const onGround  = this.body.blocked.down;
    const coyoteOK  = this._coyoteTimer > 0;
    const sliding   = this.state === PLAYER_STATE.SLIDE;

    // Saltar cancela el slide
    if ((onGround || coyoteOK) && !sliding) {
      this.body.setVelocityY(GAMEPLAY.JUMP_FORCE);
      this._coyoteTimer     = 0;
      this._jumpBufferTimer = 0;
      this._scene.events.emit('player_jumped');
      return true;
    }
    // Si estaba slideando, el salto cancela el slide primero
    if (sliding) {
      this._endSlide();
      return false;
    }
    return false;
  }

  _endSlide() {
    this._slideTimer = 0;
    this.state = PLAYER_STATE.RUN;
    this._setHitboxNormal();
  }

  activateShield(duration) {
    this.hasShield     = true;
    this.shieldTime    = duration;
    this.shieldMaxTime = duration;
  }

  absorbHit() {
    if (this.hasShield) {
      this.hasShield  = false;
      this.shieldTime = 0;
      this._hitTimer  = 0.3;
      return true;
    }
    return false;
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state  = PLAYER_STATE.DEAD;
    this.body.setVelocity(0, 0);
    this.body.allowGravity = false;

    // Tween de muerte: gira y sube antes de desaparecer
    this._scene.tweens.add({
      targets: this,
      angle:   { from: 0, to: -180 },
      y:       this.y - 50,
      alpha:   { from: 1, to: 0 },
      duration: 500,
      ease: 'Back.easeIn'
    });
  }

  // ── Update ────────────────────────────────────────────────
  update(dt) {
    if (this.isDead) return;

    this._animTimer  += dt;
    this._shieldPulse += dt;

    const onGround = this.body.blocked.down;

    // ── Coyote time ──
    if (onGround) {
      if (!this._wasOnGround) {
        this._scene.events.emit('player_landed');
      }
      this._coyoteTimer = GAMEPLAY.COYOTE_TIME;
    } else {
      this._coyoteTimer = Math.max(0, this._coyoteTimer - dt);
    }
    this._wasOnGround = onGround;

    // ── Jump buffer ──
    if (this._jumpBufferTimer > 0) {
      this._jumpBufferTimer -= dt;
      if (this._jumpBufferTimer > 0) this._tryJump();
    }

    // ── Slide countdown ──
    if (this.state === PLAYER_STATE.SLIDE) {
      this._slideTimer -= dt;
      if (this._slideTimer <= 0) this._endSlide();
    }

    // ── Hit flash ──
    if (this._hitTimer > 0) {
      this._hitTimer -= dt;
    }

    // ── Estado según física ──
    if (this.state !== PLAYER_STATE.SLIDE) {
      const vy = this.body.velocity.y;
      if (!onGround) {
        this.state = vy < 0 ? PLAYER_STATE.JUMP : PLAYER_STATE.FALL;
      } else {
        this.state = PLAYER_STATE.RUN;
      }
    }

    // ── Inclinación en salto ──
    if (!onGround && this.state !== PLAYER_STATE.SLIDE) {
      const vy = this.body.velocity.y;
      const target = vy < 0 ? -0.22 : 0.18;
      this.rotation = Phaser.Math.Linear(this.rotation, target, 0.14);
    } else {
      this.rotation = Phaser.Math.Linear(this.rotation, 0, 0.2);
    }

    // ── Shield countdown ──
    if (this.hasShield) {
      this.shieldTime -= dt;
      if (this.shieldTime <= 0) {
        this.hasShield = false;
        this.shieldTime = 0;
      }
    }

    // ── Dibujar ──
    this._draw();
  }

  // ── Render procedural del ninja ──────────────────────────
  _draw() {
    const g = this._gfx;
    g.clear();

    const sliding = this.state === PLAYER_STATE.SLIDE;
    const inAir   = this.state === PLAYER_STATE.JUMP || this.state === PLAYER_STATE.FALL;
    const t       = this._animTimer;

    // Colores base con flash de daño
    const hitFlash = this._hitTimer > 0 && Math.sin(this._hitTimer * 40) > 0;

    // ── SLIDE / AGACHADO ──────────────────────────────────
    if (sliding) {
      // Cuerpo alargado bajo
      g.fillStyle(hitFlash ? 0xffffff : 0x1e2c3d, 1);
      g.fillRoundedRect(-20, -8, 40, 16, 4);

      // Cabeza hacia adelante
      g.fillStyle(hitFlash ? 0xffffff : 0x141e2b, 1);
      g.fillRoundedRect(8, -14, 18, 14, 3);

      // Visor
      g.fillStyle(0x00f2ff, 1);
      g.fillRect(16, -10, 10, 4);
      if (!hitFlash) {
        g.fillStyle(0x00f2ff, 0.4);
        g.fillRect(16, -10, 10, 2);
      }

      // Bufanda flameando atrás
      g.fillStyle(0xff3355, 1);
      g.fillRect(-24, -4, 8, 4);
      g.fillStyle(0xcc2244, 1);
      g.fillRect(-28, -4, 6, 3);
      return;
    }

    // ── NORMAL / AIRE ─────────────────────────────────────
    // Cuerpo principal
    g.fillStyle(hitFlash ? 0xffffff : 0x1e2c3d, 1);
    g.fillRoundedRect(-13, -16, 26, 22, 4);

    // Cabeza
    g.fillStyle(hitFlash ? 0xffffff : 0x141e2b, 1);
    g.fillRoundedRect(-11, -32, 22, 18, 4);

    // Máscara ninja (parte inferior de la cara)
    g.fillStyle(hitFlash ? 0xffffff : 0x0d1520, 1);
    g.fillRect(-11, -22, 22, 8);

    // Visor (ojos) — resplandece en cyan
    g.fillStyle(0x00f2ff, 1);
    g.fillRect(-1, -28, 13, 5);
    // Brillo interior del visor
    g.fillStyle(0xffffff, 0.3);
    g.fillRect(-1, -28, 13, 2);

    // Bufanda roja (emblema DyM) — animada con el correr
    g.fillStyle(0xff3355, 1);
    g.fillRect(-14, -18, 28, 5);
    // Cola de la bufanda que ondea
    const tailY = inAir ? 0 : Math.sin(t * 12) * 2.5;
    g.fillStyle(0xcc2244, 1);
    g.fillRect(-20, -18 + tailY, 8, 4);
    g.fillRect(-24, -17 + tailY * 0.6, 5, 3);

    // Banda del cinturón / faja
    g.fillStyle(0x0a0f18, 1);
    g.fillRect(-13, -8, 26, 4);

    // Brazos
    if (inAir) {
      // Brazos extendidos en el aire (pose de parkour)
      g.fillStyle(hitFlash ? 0xffffff : 0x1e2c3d, 1);
      g.fillRect(-22, -18, 10, 6);  // brazo izquierdo extendido
      g.fillRect(12, -22, 10, 6);   // brazo derecho arriba
    } else {
      // Brazos corriendo (oscilan)
      const armSwing = Math.sin(t * 14) * 6;
      g.fillStyle(hitFlash ? 0xffffff : 0x1e2c3d, 1);
      g.fillRect(-18, -14 + armSwing, 7, 10);   // brazo izq
      g.fillRect(11, -14 - armSwing, 7, 10);    // brazo der
    }

    // Piernas y pies
    g.fillStyle(hitFlash ? 0xffffff : 0x0d1520, 1);

    if (inAir) {
      // Piernas encogidas al saltar
      g.fillRoundedRect(-10, 6, 9, 12, 2);
      g.fillRoundedRect(1, 10, 9, 10, 2);
    } else {
      // Piernas corriendo — ciclo de pasos alternados
      const legPhase = Math.sin(t * 14);
      const legA = legPhase * 8;
      const legB = -legA;

      // Muslo izquierdo
      g.fillRoundedRect(-10, 6, 9, 10, 2);
      // Pie izquierdo
      g.fillStyle(hitFlash ? 0xffffff : 0x141e2b, 1);
      g.fillRect(-12 + legA, 14, 12, 6);

      // Muslo derecho
      g.fillStyle(hitFlash ? 0xffffff : 0x0d1520, 1);
      g.fillRoundedRect(1, 6, 9, 10, 2);
      // Pie derecho
      g.fillStyle(hitFlash ? 0xffffff : 0x141e2b, 1);
      g.fillRect(-1 + legB, 14, 12, 6);
    }

    // ── DETALLES EXTRA ───────────────────────────────────
    // Banda de la frente (hachimaki)
    g.fillStyle(0xff3355, 1);
    g.fillRect(-11, -32, 22, 4);

    // Nudo del hachimaki a la derecha
    g.fillRect(11, -32, 5, 4);
    const knotY = inAir ? 0 : Math.sin(t * 10) * 1.5;
    g.fillRect(12, -28 + knotY, 4, 6);
  }

  // ── Bounding box de colisión para obstáculos ─────────────
  getHitBounds() {
    const s = this.state === PLAYER_STATE.SLIDE ? SIZES.slide : SIZES.normal;
    const offsetY = this.state === PLAYER_STATE.SLIDE ? 11 : 0;
    return {
      x: this.x - s.w / 2,
      y: this.y - s.h / 2 + offsetY,
      w: s.w,
      h: s.h
    };
  }
}
