// system/Game.js

export class Game {
  constructor(canvas, targetFPS = 60, { virtualWidth, virtualHeight }) {
    this.canvas = canvas;
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.timestep = 1000 / targetFPS;

    // Configuración del contexto para alto rendimiento
    this.ctx = canvas.getContext('2d', { 
      alpha: false, // Fondo opaco es más rápido
      desynchronized: true // Menor latencia
    });

    // Desactivar suavizado para que el Pixel Art se vea nítido
    this.ctx.imageSmoothingEnabled = false;

    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;

    this.scene = null;

    // Estado del Input (Para que la UI y el update lo lean)
    this.input = {
      keys: {},           // Teclas presionadas actualmente
      lastKeys: {},       // Teclas del frame anterior (para detectar "just pressed")
      mouse: { x: 0, y: 0, isDown: false, isClicked: false }
    };

    this._initInput();
  }

  setScene(scene) { 
    this.scene = scene; 
    // Resetear inputs al cambiar de escena para evitar "teclas pegadas"
    this.input.keys = {};
    this.input.mouse.isDown = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.updateDeviceScale(); // Asegurar tamaño correcto al inicio
    requestAnimationFrame((t) => this._loop(t));
  }

  pause() { this.running = false; }
  
  resume() { 
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(timestamp) {
    if (!this.running) return;
    requestAnimationFrame((t) => this._loop(t));

    let dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (dt > 1000) dt = 1000; // Protección contra espirales de muerte

    this.accumulator += dt;

    while (this.accumulator >= this.timestep) {
      // Actualizamos la escena
      this.scene?.update(this.timestep / 1000);
      
      // Limpieza de inputs de un solo frame (clicks)
      this.input.mouse.isClicked = false; 
      
      this.accumulator -= this.timestep;
    }

    this._render();
  }

  _render() {
    // IMPORTANTE: Guardar estado antes de escalar
    this.ctx.save();
    
    // Escalar todo el contexto al tamaño virtual
    const scaleX = this.canvas.width / this.virtualWidth;
    const scaleY = this.canvas.height / this.virtualHeight;
    this.ctx.scale(scaleX, scaleY);
    
    // Limpiar pantalla (Fondo negro por defecto)
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

    this.scene?.render(this.ctx);
    
    this.ctx.restore();
  }

  updateDeviceScale() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    if (rect.width > 0 && rect.height > 0) {
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Al redimensionar, el contexto pierde sus propiedades, hay que reasignar:
        this.ctx.imageSmoothingEnabled = false;
    }
  }

  // --- SISTEMA DE INPUT MEJORADO ---
  _initInput() {
    // 1. TECLADO
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return; // Ignorar repeticiones automáticas del OS
      
      const key = e.key.toLowerCase();
      this.input.keys[key] = true;

      // Evento directo para acciones rápidas (Salto)
      if (this.scene?.onInput) {
        this.scene.onInput('keydown', key);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.input.keys[key] = false;
    });

    // 2. MOUSE / TOUCH
    const updatePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.virtualWidth / rect.width;
      const scaleY = this.virtualHeight / rect.height;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (clientX !== undefined) {
          this.input.mouse.x = (clientX - rect.left) * scaleX;
          this.input.mouse.y = (clientY - rect.top) * scaleY;
      }
    };

    const onDown = (e) => {
      if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
      updatePos(e);
      
      this.input.mouse.isDown = true;
      this.input.mouse.isClicked = true; // Bandera de un solo frame

      // Notificar a la escena (útil para saltar al tocar)
      if (this.scene?.onInput) {
        this.scene.onInput('mousedown', { x: this.input.mouse.x, y: this.input.mouse.y });
      }
    };

    const onUp = (e) => {
      this.input.mouse.isDown = false;
    };

    // Listeners del Canvas
    this.canvas.addEventListener('mousedown', onDown);
    this.canvas.addEventListener('touchstart', onDown, { passive: false });
    
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    this.canvas.addEventListener('mousemove', updatePos);
    this.canvas.addEventListener('touchmove', updatePos, { passive: false });
  }
}