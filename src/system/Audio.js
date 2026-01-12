// system/Audio.js

/**
 * Motor de Audio Híbrido (Web Audio API).
 * - Latencia cero para efectos de sonido.
 * - Sintetizador retro integrado (¡No necesitas archivos mp3!).
 * - Soporte para cargar archivos reales si lo deseas.
 */
export class AudioManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.masterGain = null;
    this.buffers = {}; // Aquí se guardan los sonidos cargados (wav/mp3)
    
    // Inicializar contexto (puede requerir interacción del usuario)
    this._initContext();
  }

  _initContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3; // Volumen maestro (30%)
    this.masterGain.connect(this.ctx.destination);
  }

  setSoundOn(on) {
    this.enabled = !!on;
    if (this.ctx) {
      // Si está desactivado, bajamos el volumen a 0 suavemente
      // Si está activado, lo subimos a 0.3
      const now = this.ctx.currentTime;
      const vol = this.enabled ? 0.3 : 0;
      this.masterGain.gain.setTargetAtTime(vol, now, 0.1);
    }
  }

  /**
   * Importante: Los navegadores bloquean el audio hasta que el usuario toca la pantalla.
   * Llama a esto en el primer clic/toque del juego.
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Opción A: Cargar archivo real (wav/mp3)
   */
  async load(name, url) {
    if (!this.ctx) return;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers[name] = audioBuffer;
    } catch (e) {
      console.warn(`No se pudo cargar audio: ${name}`, e);
    }
  }

  /**
   * Reproduce un sonido.
   * Si existe el archivo cargado, usa ese.
   * Si no, usa el sintetizador para generar un sonido por defecto.
   */
  play(name) {
    if (!this.enabled || !this.ctx) return;

    // 1. Intentar reproducir archivo cargado
    if (this.buffers[name]) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[name];
      source.connect(this.masterGain);
      source.start(0);
      return;
    }

    // 2. Si no hay archivo, usar SINTETIZADOR RETRO (Procedural)
    // Esto te salva la vida para prototipar sin buscar assets.
    this._synthSound(name);
  }

  /* =========================
      SINTETIZADOR RETRO (Magic)
     ========================= */
  
  _synthSound(type) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    if (type === 'jump') {
      // Sonido de salto (Sube de frecuencia)
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } 
    else if (type === 'explode') {
      // Ruido blanco (o aproximación con diente de sierra grave)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.3);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    }
    else if (type === 'shield') {
      // Power up (fantasmal)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.1);
      osc.frequency.linearRampToValueAtTime(400, t + 0.3);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    }
    else if (type === 'ui') {
      // Click suave
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }
}