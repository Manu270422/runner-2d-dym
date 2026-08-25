// scenes/PreloadScene.js
import Phaser from 'phaser';
import { VIRTUAL_W, VIRTUAL_H, ASSETS } from '../config/GameConfig.js';

export class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    this._drawLoadingUI();

    // Audio
    this.load.audio('jump', ASSETS.audio.jump);
    this.load.audio('hit',  ASSETS.audio.hit);
    this.load.image('logo', 'assets/images/logo.png');

    // Yo cargo todos los SVGs como texturas de Phaser
    Object.entries(ASSETS.svg).forEach(([key, path]) => {
      this.load.svg(key, path, { width: 200, height: 200 });
    });

    this.load.on('progress', v => {
      if (this._bar) this._bar.setDisplaySize(260 * v, 6);
      if (this._pct) this._pct.setText(Math.round(v * 100) + '%');
    });

    this.load.on('loaderror', f => {
      console.warn('[Preload] Error cargando asset:', f.key);
    });
  }

  create() {
    this.scene.start('MenuScene');
  }

  _drawLoadingUI() {
    const cx = VIRTUAL_W / 2, cy = VIRTUAL_H / 2;
    this.add.rectangle(cx, cy, VIRTUAL_W, VIRTUAL_H, 0x0a0c12);

    this.add.text(cx, cy - 70, 'RUNNER 2D DyM', {
      fontFamily: 'monospace', fontSize: '30px', color: '#00f2ff',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(cx, cy - 34, 'CARGANDO SISTEMA...', {
      fontFamily: 'monospace', fontSize: '11px', color: '#3a5066'
    }).setOrigin(0.5);

    this.add.rectangle(cx, cy, 264, 10, 0x1a2438).setOrigin(0.5);
    this._bar = this.add.rectangle(cx - 130, cy, 0, 6, 0x00f2ff).setOrigin(0, 0.5);

    this._pct = this.add.text(cx, cy + 20, '0%', {
      fontFamily: 'monospace', fontSize: '12px', color: '#3a5066'
    }).setOrigin(0.5);
  }
}
