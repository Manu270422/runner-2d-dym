// ui/HUD.js — HUD que no se ve afectado por el camera shake
import Phaser from 'phaser';
import { VIRTUAL_W, VIRTUAL_H, GAMEPLAY } from '../config/GameConfig.js';

export class HUD {
  constructor(scene) {
    this._scene = scene;
    const depth = 100;

    // Score
    this._scoreTxt = scene.add.text(20, 36, 'SCORE: 0', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
      stroke: '#000', strokeThickness: 4
    }).setScrollFactor(0).setDepth(depth);

    // Nivel
    this._levelTxt = scene.add.text(20, 60, 'NIVEL: 1', {
      fontFamily: 'monospace', fontSize: '13px', color: '#00f2ff',
      stroke: '#000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(depth);

    // Récord
    this._bestTxt = scene.add.text(VIRTUAL_W - 20, 36, 'RÉCORD: 0', {
      fontFamily: 'monospace', fontSize: '13px', color: '#ffcc00',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(depth);

    // Hint de controles (arriba izquierda, se desvanece)
    this._hintTxt = scene.add.text(20, VIRTUAL_H - 22, 'ESPACIO·SALTAR   ↓·SLIDE', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff20'
    }).setScrollFactor(0).setDepth(depth);

    // Shield bar
    this._shieldLabel = scene.add.text(VIRTUAL_W - 140, 56, 'ESCUDO', {
      fontFamily: 'monospace', fontSize: '10px', color: '#00f2ff'
    }).setScrollFactor(0).setDepth(depth).setVisible(false);

    this._shieldBg  = scene.add.rectangle(VIRTUAL_W - 20, 70, 110, 8, 0x003344)
      .setOrigin(1, 0.5).setScrollFactor(0).setDepth(depth).setVisible(false);
    this._shieldBar = scene.add.rectangle(VIRTUAL_W - 20, 70, 110, 8, 0x00f2ff)
      .setOrigin(1, 0.5).setScrollFactor(0).setDepth(depth).setVisible(false);

    // Level-up notification
    this._levelUpTxt = scene.add.text(VIRTUAL_W / 2, VIRTUAL_H / 2 - 70, '', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffcc00',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(110).setAlpha(0);

    // Indicador de tipo de acción (slide vs jump)
    this._actionHint = scene.add.text(VIRTUAL_W / 2, VIRTUAL_H - 24, '', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ff335540'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(depth);
  }

  update(score, level, bestScore, player) {
    this._scoreTxt.setText(`SCORE: ${Math.floor(score)}`);
    this._levelTxt.setText(`NIVEL: ${level}`);
    this._bestTxt.setText(`RÉCORD: ${bestScore}`);

    const hs = player?.hasShield;
    this._shieldLabel.setVisible(!!hs);
    this._shieldBg.setVisible(!!hs);
    this._shieldBar.setVisible(!!hs);

    if (hs) {
      const pct = player.shieldTime / player.shieldMaxTime;
      this._shieldBar.setDisplaySize(110 * pct, 8);
      const flash = player.shieldTime < 1.5 && Math.sin(Date.now() * 0.018) > 0;
      this._shieldBar.setFillStyle(flash ? 0xffffff : 0x00f2ff);
    }
  }

  showLevelUp(level) {
    this._levelUpTxt.setText(`⚡ NIVEL ${level} — SISTEMA ACELERADO ⚡`).setAlpha(1).setY(VIRTUAL_H / 2 - 70);
    this._scene.tweens.add({
      targets: this._levelUpTxt,
      alpha: { from: 1, to: 0 },
      y: { from: VIRTUAL_H / 2 - 70, to: VIRTUAL_H / 2 - 110 },
      duration: 2000, ease: 'Cubic.easeOut'
    });
  }
}
