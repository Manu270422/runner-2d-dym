import { Game } from './system/Game.js';
import { SceneRunner } from './scenes/SceneRunner.js';

const canvas = document.getElementById('game');

// ==========================================
// 1. CONFIGURACIÓN DEL MOTOR
// ==========================================

// MEJORA MOBILE (Punto 2): Evitamos gestos del navegador en el canvas
canvas.style.touchAction = 'none'; 
canvas.tabIndex = 1; // Permite que el canvas reciba foco del teclado
canvas.focus();      // Enfocar inmediatamente

// Inicializamos el juego a 60 FPS con resolución virtual HD (16:9)
const game = new Game(canvas, 60, { virtualWidth: 960, virtualHeight: 540 });

// ==========================================
// 2. INICIAR ESCENA
// ==========================================

const scene = new SceneRunner(game);
game.setScene(scene);
game.start();

// ==========================================
// 3. GESTIÓN DE ENERGÍA (VISIBILITY API)
// ==========================================
// Pausa automática si cambias de pestaña
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.pause();
  } else {
    game.resume();
    canvas.focus(); 
  }
});

// ==========================================
// 4. ESCALADO INTELIGENTE (RESPONSIVE)
// ==========================================
function fitCanvas() {
  const panel = canvas.parentElement; 
  const availableW = panel ? panel.clientWidth : window.innerWidth;
  const availableH = panel ? panel.clientHeight : window.innerHeight;

  const maxW = availableW - 4; 
  const maxH = availableH - 4;

  const aspect = game.virtualWidth / game.virtualHeight;
  
  let cssW = maxW;
  let cssH = cssW / aspect;

  if (cssH > maxH) {
    cssH = maxH;
    cssW = cssH * aspect;
  }

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  game.updateDeviceScale();
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fitCanvas, 100);
});
fitCanvas();

// ==========================================
// 5. REGISTRO PWA
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}