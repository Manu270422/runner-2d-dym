// main.js
// Yo inicializo Phaser 3 con Scale Manager para responsive real en todos los dispositivos.

import Phaser from 'phaser';
import { VIRTUAL_W, VIRTUAL_H } from './config/GameConfig.js';
import { BootScene }    from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene }    from './scenes/MenuScene.js';
import { PlayScene }    from './scenes/PlayScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

// Yo uso FIT para que Phaser escale el canvas manteniendo el aspect ratio en cualquier pantalla
const config = {
  type: Phaser.AUTO,
  width:  VIRTUAL_W,
  height: VIRTUAL_H,
  backgroundColor: '#0a0c12',
  parent: 'game-container',

  // Yo uso Arcade Physics — ligero y perfecto para un runner 2D
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // Yo gestiono gravedad en el Player directamente para más control
      debug: false        // Cambiar a true para ver hitboxes durante desarrollo
    }
  },

  // Yo uso el Scale Manager de Phaser para responsive real sin código extra
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Phaser maneja el canvas y el redimensionado automáticamente
  },

  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    PlayScene,
    GameOverScene
  ],

  render: {
    antialias: false,       // Pixel art nítido
    pixelArt: true,
    roundPixels: true,      // Evita subpixel bleeding en sprites alineados a la cuadrícula
    powerPreference: 'high-performance'
  }
};

const game = new Phaser.Game(config);

// Yo pauso el juego automáticamente cuando el usuario cambia de pestaña
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.scenes.forEach(s => {
      if (s.scene.isActive() && s.physics) s.physics.pause();
    });
  } else {
    game.scene.scenes.forEach(s => {
      if (s.scene.isActive() && s.physics) s.physics.resume();
    });
  }
});

// Yo registro el Service Worker para PWA solo en producción
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // El juego funciona igual sin SW — no es crítico
    });
  });
}

export default game;
