// scenes/MenuScene.js
import Phaser from 'phaser';
import { VIRTUAL_W, VIRTUAL_H, GAMEPLAY } from '../config/GameConfig.js';
import { StorageSystem } from '../systems/StorageSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';

const GY = GAMEPLAY.GROUND_Y;

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  init(data) {
    this._audio   = data.audio || new AudioSystem();
    this._soundOn = StorageSystem.loadSoundOn();
    this._audio.setSoundOn(this._soundOn);
  }

  create() {
    this._buildBg();
    this._buildParallax();
    this._buildUI();
    this._buildIdleNinja();
    this._animateIn();
  }

  _buildBg() {
    // Fondo degradado cyberpunk
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x0a0c12, 0x0a0c12, 0x0f1e34, 0x0f1e34, 1);
    g.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

    // Grid
    const grid = this.add.graphics().setDepth(1);
    grid.lineStyle(1, 0x00f2ff, 0.04);
    for (let x = 0; x < VIRTUAL_W; x += 48) grid.lineBetween(x, 0, x, VIRTUAL_H);
    for (let y = 0; y < VIRTUAL_H; y += 48) grid.lineBetween(0, y, VIRTUAL_W, y);

    // Luna
    this.add.circle(VIRTUAL_W - 110, 85, 44, 0x00f2ff, 0.07).setDepth(1);
    this.add.circle(VIRTUAL_W - 110, 85, 38, 0x00f2ff, 0.05).setDepth(1);

    // Suelo
    this.add.rectangle(VIRTUAL_W/2, (GY + VIRTUAL_H)/2, VIRTUAL_W, VIRTUAL_H - GY, 0x0d1520).setDepth(4);

    // Línea neón del suelo
    const gl = this.add.graphics().setDepth(5);
    gl.lineStyle(3, 0x00f2ff, 0.6);
    gl.lineBetween(0, GY, VIRTUAL_W, GY);
    gl.lineStyle(10, 0x00f2ff, 0.07);
    gl.lineBetween(0, GY, VIRTUAL_W, GY);
  }

  _buildParallax() {
    this._bldFar  = this._mkBuildings(14, 0x0f1623, 100, 200, 35, 75, 0.08, 2);
    this._bldMid  = this._mkBuildings(10, 0x131d2e, 60, 110, 22, 50, 0.22, 3);
    this._bldNear = this._mkBuildings(7,  0x18263c, 30, 65,  15, 35, 0.50, 4);

    // Ventanas en los edificios
    this._winGfx = this.add.graphics().setDepth(3);
    this._drawWins();
  }

  _mkBuildings(n, col, minH, maxH, minW, maxW, spd, depth) {
    const list = [];
    for (let i = 0; i < n; i++) {
      const w = Phaser.Math.Between(minW, maxW);
      const h = Phaser.Math.Between(minH, maxH);
      const x = Phaser.Math.Between(0, VIRTUAL_W);
      const r = this.add.rectangle(x, GY - h, w, h, col).setOrigin(0, 0).setDepth(depth);
      r._spd = spd; list.push(r);
    }
    return list;
  }

  _drawWins() {
    const g = this._winGfx; g.clear();
    const colors = [0x00f2ff, 0x9b59ff, 0xffcc00, 0xff3355];
    [...this._bldFar, ...this._bldMid].forEach(b => {
      const rows = Math.floor(b.height / 18);
      const cols = Math.floor(b.width / 12);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.55) {
          g.fillStyle(colors[Math.floor(Math.random()*colors.length)], 0.12 + Math.random()*0.18);
          g.fillRect(b.x + c*12 + 2, b.y + r*18 + 3, 8, 10);
        }
      }
    });
  }

  _buildUI() {
    const cx = VIRTUAL_W / 2, cy = VIRTUAL_H / 2;

    // Panel central semitransparente
    this._panel = this.add.rectangle(cx, cy + 20, 340, 260, 0x0f1a2b, 0.9)
      .setStrokeStyle(1, 0x1e3d55).setDepth(10).setAlpha(0);

    // Título
    this._title = this.add.text(cx, cy - 115, 'RUNNER 2D', {
      fontFamily: 'monospace', fontSize: '46px', color: '#00f2ff',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    this._sub = this.add.text(cx, cy - 70, '⬡  D  y  M  ⬡', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff30'
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    const best = StorageSystem.loadBest();
    this._bestTxt = this.add.text(cx, cy - 48, best > 0 ? `RÉCORD: ${best}` : '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffcc0070'
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    // Botón JUGAR
    this._btnPlay = this._btn(cx, cy - 10, 170, 46, '▶  INICIAR MISIÓN', 0x00f2ff, () => {
      this._audio.resume();
      this._audio.play('ui');
      this.cameras.main.fade(280, 0, 0, 0, false, (c, p) => {
        if (p === 1) this.scene.start('PlayScene', { audio: this._audio });
      });
    });

    // Toggle sonido
    this._btnSound = this._toggle(cx, cy + 50, this._soundOn, 'SONIDO', v => {
      this._soundOn = v;
      this._audio.setSoundOn(v);
      StorageSystem.saveSoundOn(v);
      if (v) this._audio.play('ui');
    });

    // Controles hint
    this.add.text(cx, cy + 95, 'ESPACIO · W · ↑  →  SALTAR', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff25'
    }).setOrigin(0.5).setDepth(11);
    this.add.text(cx, cy + 110, 'S · ↓  →  SLIDE / AGACHARSE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff25'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, VIRTUAL_H - 12, 'DyM · Phaser 3 Edition · v2.0', {
      fontFamily: 'monospace', fontSize: '9px', color: '#ffffff12'
    }).setOrigin(0.5).setDepth(11);
  }

  _animateIn() {
    const delay = [80, 200, 350, 480, 580, 680];
    const targets = [this._panel, this._title, this._sub, this._bestTxt, ...this._btnPlay, ...this._btnSound];
    targets.forEach((t, i) => {
      if (!t) return;
      this.tweens.add({ targets: t, alpha: { from: 0, to: 1 }, duration: 400, delay: delay[i] || i * 80 });
    });

    // Pulso del título
    this.tweens.add({
      targets: this._title, alpha: { from: 1, to: 0.75 },
      yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut', delay: 1000
    });
  }

  _buildIdleNinja() {
    this._ninjaGfx = this.add.graphics().setDepth(6);
    this._ninjaT   = 0;
    this._ninjaX   = 180;
    this._ninjaY   = GY;
  }

  _btn(x, y, w, h, label, tint, cb) {
    const bg = this.add.rectangle(x, y, w, h, 0x0d1a2a)
      .setStrokeStyle(1, tint, 0.6)
      .setInteractive({ useHandCursor: true })
      .setDepth(11).setAlpha(0)
      .on('pointerover',  () => bg.setFillStyle(0x163050))
      .on('pointerout',   () => bg.setFillStyle(0x0d1a2a))
      .on('pointerdown',  () => bg.setFillStyle(0x090f1c))
      .on('pointerup',    () => { bg.setFillStyle(0x163050); cb(); });

    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(12).setAlpha(0);

    return [bg, txt];
  }

  _toggle(x, y, val, label, onChange) {
    let on = val;
    const getC  = () => on ? 0x00f2ff18 : 0x0d1a2a;
    const getTxt = () => label + ': ' + (on ? 'ON' : 'OFF');
    const getTxtC = () => on ? '#00f2ff' : '#ffffff50';

    const bg = this.add.rectangle(x, y, 140, 32, getC())
      .setStrokeStyle(1, 0x1e3d55)
      .setInteractive({ useHandCursor: true })
      .setDepth(11).setAlpha(0)
      .on('pointerup', () => {
        on = !on;
        bg.setFillStyle(getC());
        txt.setText(getTxt()).setColor(getTxtC());
        onChange(on);
      });

    const txt = this.add.text(x, y, getTxt(), {
      fontFamily: 'monospace', fontSize: '12px', color: getTxtC()
    }).setOrigin(0.5).setDepth(12).setAlpha(0);

    return [bg, txt];
  }

  update(_, delta) {
    const dt = delta / 1000;
    this._ninjaT += dt;

    // Parallax
    [...this._bldFar, ...this._bldMid, ...this._bldNear].forEach(b => {
      b.x -= b._spd * delta * 0.06;
      if (b.x + b.width < 0) b.x = VIRTUAL_W + Phaser.Math.Between(0, 80);
    });

    // Ninja idle animado
    const g = this._ninjaGfx; g.clear();
    const t  = this._ninjaT;
    const nx = this._ninjaX, ny = this._ninjaY;

    // Cuerpo
    g.fillStyle(0x1e2c3d); g.fillRoundedRect(nx-13, ny-60, 26, 22, 4);
    g.fillStyle(0x141e2b); g.fillRoundedRect(nx-11, ny-76, 22, 18, 4);
    // Máscara
    g.fillStyle(0x0d1520); g.fillRect(nx-11, ny-66, 22, 8);
    // Visor
    g.fillStyle(0x00f2ff); g.fillRect(nx-1, ny-72, 13, 5);
    // Hachimaki
    g.fillStyle(0xff3355); g.fillRect(nx-11, ny-76, 22, 4);
    const kY = Math.sin(t * 8) * 1.5;
    g.fillRect(nx+11, ny-76+kY, 5, 8);
    // Bufanda
    g.fillStyle(0xff3355); g.fillRect(nx-14, ny-62, 28, 5);
    const tailY = Math.sin(t * 10) * 2.5;
    g.fillStyle(0xcc2244); g.fillRect(nx-20, ny-62+tailY, 8, 4);
    // Piernas corriendo
    const legA = Math.sin(t * 12) * 8;
    g.fillStyle(0x0d1520);
    g.fillRoundedRect(nx-10, ny-38, 9, 12, 2);
    g.fillStyle(0x141e2b); g.fillRect(nx-12+legA, ny-28, 12, 6);
    g.fillStyle(0x0d1520); g.fillRoundedRect(nx+1, ny-38, 9, 12, 2);
    g.fillStyle(0x141e2b); g.fillRect(nx-1-legA, ny-28, 12, 6);
    // Brazos
    const armA = Math.sin(t * 12) * 5;
    g.fillStyle(0x1e2c3d);
    g.fillRect(nx-18, ny-58+armA, 7, 10);
    g.fillRect(nx+11, ny-58-armA, 7, 10);
  }
}
