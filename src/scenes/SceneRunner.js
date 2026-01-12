// scenes/SceneRunner.js

import { UIButton, UIToggle, UIWindowBar } from '../system/UI.js';
import { Storage } from '../system/Storage.js';
import { AudioManager } from '../system/Audio.js';
import { Player } from '../entities/Player.js';
import { ParticleSystem } from '../system/Particles.js';
import { ShieldPowerUp } from '../entities/ShieldPowerUp.js';

// CONFIGURACIÓN DE BALANCE
const GAME_CONFIG = {
  GROUND_Y: 480,
  BASE_SPEED: 220,
  SPEED_INCREASE_PER_LEVEL: 20,
  SPAWN_TIMER_MIN: 0.8,
  SPAWN_TIMER_RANDOM: 0.7,
  SHIELD_LEVEL_REQ: 3 // Nivel mínimo para que aparezca el escudo
};

export class SceneRunner {
  constructor(game) {
    this.game = game;
    
    // 1. Inicializar Sistemas
    this.state = 'menu'; // Estados: 'menu', 'playing', 'gameover'
    
    // Audio: Híbrido (Sintetizador + Archivos)
    this.soundOn = Storage.loadSoundOn();
    this.audio = new AudioManager();
    this.audio.setSoundOn(this.soundOn);

    // Entidades y Partículas
    this.player = new Player(game);
    this.particles = new ParticleSystem(game);
    
    // Variables de Juego
    this.score = 0;
    this.bestScore = Storage.loadBest();
    this.level = 1;
    this.elapsed = 0;
    
    // Listas de Objetos
    this.obstacles = [];
    this.powerUps = [];
    this.shieldSpawned = false;

    // Variables de Entorno
    this.spawnTimer = 0;
    this.currentObstacleSpeed = GAME_CONFIG.BASE_SPEED;
    this.shakeTime = 0;
    this.shakeStrength = 0;

    // 2. Inicializar Gráficos
    this._initPalettes();
    this._initParallax();
    
    // 3. Inicializar UI
    this._initUI();
  }

  /* =========================
      SETUP & UI
     ========================= */

  _initPalettes() {
    this.levelPalettes = [
      { bg: '#1a1d24', ground: '#2b313b', text: '#ffffff' }, // Nivel 1: Azul Oscuro
      { bg: '#240b15', ground: '#3d1626', text: '#ffcc00' }, // Nivel 2: Rojizo
      { bg: '#081c15', ground: '#123f31', text: '#00ffcc' }  // Nivel 3: Cyberpunk Verde
    ];
    this.colors = this.levelPalettes[0];
  }

  _initParallax() {
    this.parallaxLayers = [
      { y: 340, h: 24, speed: 40, color: '#20252e', items: [] },
      { y: 380, h: 28, speed: 60, color: '#242a34', items: [] },
      { y: 420, h: 32, speed: 80, color: '#28303a', items: [] }
    ];
    // Rellenar capas iniciales
    this.parallaxLayers.forEach(layer => {
      for(let i = 0; i < 4; i++) {
        this._addParallaxItem(layer, i * 250);
      }
    });
  }

  _initUI() {
    const cx = this.game.virtualWidth / 2;
    const cy = this.game.virtualHeight / 2;

    // Barra superior (Minimizar, Cerrar)
    this.windowBar = new UIWindowBar(0, 0, this.game.virtualWidth, 'Runner 2D [System]');

    // BOTÓN JUGAR
    this.btnPlay = new UIButton(cx - 70, cy + 20, 140, 40, 'JUGAR', () => {
        this.audio.play('ui'); // Sonido click
        this._startGame();
    });

    // BOTÓN REINTENTAR
    this.btnRetry = new UIButton(cx - 70, cy + 60, 140, 40, 'REINTENTAR', () => {
        this.audio.play('ui');
        this._startGame();
    });

    // TOGGLE SONIDO
    this.toggleSound = new UIToggle(cx - 60, cy + 90, 'Sonido', this.soundOn, (val) => {
        this.soundOn = val;
        this.audio.setSoundOn(val);
        Storage.saveSoundOn(val);
        // Si activamos sonido, probamos con un bip
        if(val) this.audio.play('ui');
    });
  }

  /* =========================
      INPUT & EVENTOS
     ========================= */

  /**
   * Recibe eventos directos desde Game.js (Teclado/Touch inmediato)
   */
  onInput(type, data) {
    // Si estamos jugando, cualquier tecla o toque válido es un SALTO
    if (this.state === 'playing') {
        if (type === 'keydown' || type === 'mousedown') {
            // Evitar saltar si hicimos clic en la barra superior (aprox 30px altura)
            if (type === 'mousedown' && data.y < 30) return;
            
            // Acción de salto
            const jumped = this.player.jump();
            if (jumped) this.audio.play('jump'); // Sonido sintético
        }
    }
  }

  /* =========================
      LÓGICA DEL JUEGO
     ========================= */

  _startGame() {
    this.audio.resume(); // Importante para desbloquear audio en navegador

    this.state = 'playing';
    this.score = 0;
    this.level = 1;
    this.elapsed = 0;
    this.colors = this.levelPalettes[0];
    this.currentObstacleSpeed = GAME_CONFIG.BASE_SPEED;
    
    // Resetear entidades
    this.obstacles = [];
    this.powerUps = [];
    this.shieldSpawned = false;
    this.player.reset();
    this.particles.reset(); 
    
    this.spawnTimer = 0;
    this.shakeTime = 0;
  }

  _gameOver() {
    this.state = 'gameover';
    this._shake(15, 0.5);
    
    // Guardar puntuación usando el nuevo Storage seguro
    const isNewRecord = Storage.saveBest(Math.floor(this.score));
    this.bestScore = Storage.loadBest(); // Recargar para asegurar
    
    if (isNewRecord) {
        this.audio.play('shield'); // Usamos sonido de powerup como "éxito" temporalmente
    }
  }

  update(dt) {
    // 1. UPDATE DE UI (Se hace primero)
    const input = this.game.input;
    
    this.windowBar.update(input);

    if (this.state === 'menu') {
        this.btnPlay.update(input);
        this.toggleSound.update(input);
        return; 
    }

    if (this.state === 'gameover') {
        this.btnRetry.update(input);
        this.toggleSound.update(input);
        return;
    }

    // 2. LÓGICA DE JUEGO (PLAYING)
    this.elapsed += dt;
    this.score += dt * 10; // 10 puntos por segundo

    this.player.update(dt);
    this.particles.update(dt);
    this._updateShake(dt);
    this._updateLevel();
    this._updateSpawners(dt);
    this._updateEntities(dt);
    this._updateParallax(dt);
  }

  _updateShake(dt) {
    if (this.shakeTime > 0) this.shakeTime -= dt;
  }

  _updateLevel() {
    // Subir nivel cada 15 segundos
    const newLevel = 1 + Math.floor(this.elapsed / 15);
    
    if (newLevel !== this.level) {
        this.level = newLevel;
        // Ciclar colores
        const paletteIndex = (this.level - 1) % this.levelPalettes.length;
        this.colors = this.levelPalettes[paletteIndex];
        
        // Aumentar velocidad
        this.currentObstacleSpeed = GAME_CONFIG.BASE_SPEED + (this.level * 15);
        this.audio.play('shield'); // Sonido de feedback al subir nivel
    }
  }

  _updateSpawners(dt) {
    // Lógica de Escudo (PowerUp)
    if (!this.shieldSpawned && this.level >= GAME_CONFIG.SHIELD_LEVEL_REQ) {
        // Aparece fuera de pantalla a la derecha
        this.powerUps.push(new ShieldPowerUp(this.game.virtualWidth + 50, 420));
        this.shieldSpawned = true;
    }

    // Lógica de Obstáculos
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
        this._spawnObstacle();
        
        // Fórmula de dificultad: Más rápido = spawns más seguidos
        const difficultyMod = Math.min(0.5, this.level * 0.05);
        this.spawnTimer = GAME_CONFIG.SPAWN_TIMER_MIN - difficultyMod + Math.random() * GAME_CONFIG.SPAWN_TIMER_RANDOM;
    }
  }

  _updateEntities(dt) {
    const pBounds = this.player.getBounds();

    // --- POWER UPS ---
    this.powerUps.forEach(pu => {
        // IMPORTANTE: Pasamos la velocidad para que el escudo se mueva hacia nosotros
        pu.update(dt, this.currentObstacleSpeed); 
        
        // Detección colisión
        if (pu.isActive && this._checkCollision(pBounds, pu.getBounds())) {
            pu.deactivate();
            this.player.activateShield(5); // 5 segundos de escudo
            this.audio.play('shield'); // Sonido synth
            this.particles.emitShieldAura(this.player.x + 16, this.player.y + 16);
        }
    });

    // --- OBSTÁCULOS ---
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const o = this.obstacles[i];
        o.x -= this.currentObstacleSpeed * dt;

        // Colisión Jugador
        if (this._checkCollision(pBounds, o)) {
            if (this.player.hasShield) {
                // Escudo salva
                this.player.breakShield();
                this.audio.play('explode'); // Sonido impacto suave
                this.particles.emitShieldBreak(this.player.x + 16, this.player.y + 16);
                this._shake(10, 0.3);
                this.obstacles.splice(i, 1); // Destruir obstáculo
            } else {
                // Muerte
                this.audio.play('explode'); // Sonido explosión fuerte
                this.particles.emit(this.player.x + 16, this.player.y + 16, '#e74c3c', 30, 'explode');
                this._shake(20, 0.5);
                this._gameOver();
            }
            continue; 
        }

        // Eliminar si sale de pantalla
        if (o.x + o.w < -100) {
            this.obstacles.splice(i, 1);
        }
    }
  }

  _updateParallax(dt) {
    this.parallaxLayers.forEach(layer => {
        layer.items.forEach(item => {
            item.x -= layer.speed * dt;
            // Loop infinito
            if (item.x + item.w < -50) {
                item.x = this.game.virtualWidth + Math.random() * 50;
            }
        });
    });
  }

  /* =========================
      RENDER
     ========================= */

  render(ctx) {
    ctx.save();

    // Aplicar Shake (Terremoto)
    if (this.shakeTime > 0) {
        const dx = (Math.random() - 0.5) * this.shakeStrength;
        const dy = (Math.random() - 0.5) * this.shakeStrength;
        ctx.translate(dx, dy);
    }

    // 1. Fondo
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.game.virtualWidth, this.game.virtualHeight);

    // 2. Parallax
    this._renderParallax(ctx);

    // 3. Juego (Solo si no es menú, o dibujamos fondo en menú también)
    this._renderGameObjects(ctx);

    // 4. UI y Overlay
    this.windowBar.draw(ctx);
    
    if (this.state === 'playing') {
        this._renderHUD(ctx);
    } else if (this.state === 'menu') {
        this._renderOverlay(ctx, 'CYBER RUNNER');
        this.btnPlay.draw(ctx);
        this.toggleSound.draw(ctx);
    } else if (this.state === 'gameover') {
        this._renderOverlay(ctx, 'SYSTEM FAILURE');
        this.btnRetry.draw(ctx);
        this._renderScoreBoard(ctx);
    }

    ctx.restore();
  }

  _renderParallax(ctx) {
    this.parallaxLayers.forEach(layer => {
        ctx.fillStyle = layer.color;
        layer.items.forEach(item => {
            ctx.fillRect(item.x | 0, item.y | 0, item.w | 0, item.h | 0);
        });
    });
    // Suelo
    ctx.fillStyle = this.colors.ground;
    ctx.fillRect(0, GAME_CONFIG.GROUND_Y, this.game.virtualWidth, this.game.virtualHeight - GAME_CONFIG.GROUND_Y);
  }

  _renderGameObjects(ctx) {
    // Powerups (Primero powerups)
    this.powerUps.forEach(pu => pu.draw(ctx));
    
    // Obstáculos
    ctx.fillStyle = '#ff3333';
    this.obstacles.forEach(o => ctx.fillRect(o.x | 0, o.y | 0, o.w | 0, o.h | 0));

    // Jugador (si no estamos muertos o si queremos que se vea el cadáver)
    if (this.state !== 'gameover') {
        this.player.draw(ctx);
    }
    
    // Partículas (siempre arriba de todo)
    this.particles.draw(ctx);
  }

  _renderHUD(ctx) {
    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 20, 50);
    ctx.fillText(`LEVEL: ${this.level}`, 20, 70);

    // Barra de Escudo
    if (this.player.hasShield) {
        const barW = 100;
        const pct = this.player.shieldTime / this.player.shieldMaxTime;
        
        ctx.fillStyle = '#004444';
        ctx.fillRect(this.game.virtualWidth - 120, 50, barW, 10);
        
        ctx.fillStyle = '#00f2ff';
        ctx.fillRect(this.game.virtualWidth - 120, 50, barW * pct, 10);
        
        ctx.fillText("SHIELD", this.game.virtualWidth - 120, 45);
    }
  }

  _renderOverlay(ctx, title) {
    ctx.fillStyle = 'rgba(15, 20, 30, 0.85)';
    ctx.fillRect(0, 0, this.game.virtualWidth, this.game.virtualHeight);
    
    ctx.shadowColor = this.colors.text;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.colors.text;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, this.game.virtualWidth / 2, this.game.virtualHeight / 2 - 50);
    ctx.shadowBlur = 0; // Reset
  }

  _renderScoreBoard(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillText(`Puntuación: ${Math.floor(this.score)}`, this.game.virtualWidth/2, this.game.virtualHeight/2 + 120);
    ctx.fillStyle = '#ffe600';
    ctx.fillText(`Récord: ${this.bestScore}`, this.game.virtualWidth/2, this.game.virtualHeight/2 + 145);
  }

  /* =========================
      UTILIDADES INTERNAS
     ========================= */

  _spawnObstacle() {
    const h = 30 + Math.random() * 20; // Altura variable
    const w = 30 + Math.random() * 20; // Ancho variable
    
    this.obstacles.push({
      x: this.game.virtualWidth,
      y: GAME_CONFIG.GROUND_Y - h,
      w: w, 
      h: h
    });
  }

  _addParallaxItem(layer, startX) {
     layer.items.push({
        x: startX,
        y: layer.y,
        w: 100 + Math.random() * 150,
        h: layer.h
     });
  }

  _shake(strength, duration) {
    this.shakeStrength = strength;
    this.shakeTime = duration;
  }

  _checkCollision(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }
}