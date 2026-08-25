// scenes/GameOverScene.js
// Yo muestro el game over con la puntuación, récord y opción de reintentar.

import Phaser from 'phaser';
import { VIRTUAL_W, VIRTUAL_H, GAMEPLAY } from '../config/GameConfig.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this._score    = data.score    || 0;
    this._best     = data.best     || 0;
    this._level    = data.level    || 1;
    this._audio    = data.audio;
    this._isRecord = data.isRecord || false;
  }

  create() {
    const cx = VIRTUAL_W / 2;
    const cy = VIRTUAL_H / 2;

    // Fondo oscuro
    this.add.rectangle(cx, cy, VIRTUAL_W, VIRTUAL_H, 0x0a0c12);

    // Línea inferior de suelo (contexto visual)
    const g = this.add.graphics();
    g.lineStyle(1, 0x00f2ff, 0.15);
    g.lineBetween(0, GAMEPLAY.GROUND_Y, VIRTUAL_W, GAMEPLAY.GROUND_Y);

    // Panel central
    this.add.rectangle(cx, cy, 380, 280, 0x0f1a2b).setStrokeStyle(1, 0x1e3d55);

    // Título
    const titleTxt = this._isRecord ? 'NUEVO RÉCORD' : 'SYSTEM FAILURE';
    const titleColor = this._isRecord ? '#ffcc00' : '#ff3355';
    const title = this.add.text(cx, cy - 100, titleTxt, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: titleColor,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0);

    // Puntuación
    const scoreTxt = this.add.text(cx, cy - 45, `PUNTUACIÓN: ${this._score}`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    // Récord
    const bestTxt = this.add.text(cx, cy - 15, `RÉCORD: ${this._best}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffcc00'
    }).setOrigin(0.5).setAlpha(0);

    // Nivel alcanzado
    const levelTxt = this.add.text(cx, cy + 10, `NIVEL ALCANZADO: ${this._level}`, {
      fontFamily: 'monospace', fontSize: '12px', color: '#00f2ff80'
    }).setOrigin(0.5).setAlpha(0);

    // Botón reintentar
    const btnRetry = this._makeButton(cx - 75, cy + 55, 140, 42, 'REINTENTAR', () => {
      this._audio?.play('ui');
      this.cameras.main.fade(250, 0, 0, 0, false, (cam, p) => {
        if (p === 1) this.scene.start('PlayScene', { audio: this._audio });
      });
    });

    // Botón menú
    const btnMenu = this._makeButton(cx + 75, cy + 55, 140, 42, 'MENÚ', () => {
      this._audio?.play('ui');
      this.cameras.main.fade(250, 0, 0, 0, false, (cam, p) => {
        if (p === 1) this.scene.start('MenuScene', { audio: this._audio });
      });
    });

    // Yo animo la entrada de los elementos con tweens encadenados
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.tweens.add({ targets: title, alpha: 1, y: '-=6', duration: 500, delay: 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: scoreTxt, alpha: 1, duration: 400, delay: 300 });
    this.tweens.add({ targets: bestTxt, alpha: 1, duration: 400, delay: 450 });
    this.tweens.add({ targets: levelTxt, alpha: 1, duration: 400, delay: 550 });
    this.tweens.add({ targets: [btnRetry.bg, btnRetry.txt, btnMenu.bg, btnMenu.txt], alpha: { from: 0, to: 1 }, duration: 400, delay: 650 });

    // Pulso del título de record
    if (this._isRecord) {
      this.tweens.add({
        targets: title, scaleX: { from: 1, to: 1.06 }, scaleY: { from: 1, to: 1.06 },
        yoyo: true, repeat: -1, duration: 700, delay: 700
      });
    }

    // Hint teclado
    this.add.text(cx, VIRTUAL_H - 18, 'ESPACIO / TOQUE para reintentar', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff20'
    }).setOrigin(0.5);

    // Atajo de teclado para reintentar
    this.input.keyboard.once('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        this._audio?.play('ui');
        this.cameras.main.fade(250, 0, 0, 0, false, (cam, p) => {
          if (p === 1) this.scene.start('PlayScene', { audio: this._audio });
        });
      }
    });
  }

  _makeButton(x, y, w, h, label, callback) {
    const bg = this.add.rectangle(x, y, w, h, 0x131b2a)
      .setStrokeStyle(1, 0x1e3d55)
      .setInteractive({ useHandCursor: true })
      .on('pointerover',  () => bg.setFillStyle(0x1a2d4a))
      .on('pointerout',   () => bg.setFillStyle(0x131b2a))
      .on('pointerdown',  () => bg.setFillStyle(0x0a1525))
      .on('pointerup',    () => callback());

    const txt = this.add.text(x, y, label, {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5);

    return { bg, txt };
  }
}
