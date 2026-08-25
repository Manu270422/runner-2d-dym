// scenes/BootScene.js
// Yo uso esta escena para ocultar el splash HTML y arrancar el preloader de Phaser.

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    // Yo oculto el boot screen HTML con una transición suave
    const bootEl = document.getElementById('boot-screen');
    if (bootEl) {
      bootEl.classList.add('hidden');
      setTimeout(() => bootEl.remove(), 500);
    }

    this.scene.start('PreloadScene');
  }
}
