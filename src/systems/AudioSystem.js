// systems/AudioSystem.js
// Yo manejo todo el audio a través de esta clase para no repartir lógica de sonido por el proyecto.
// Uso Web Audio API directamente para efectos de baja latencia, sin depender de archivos .wav
// cuando el sintetizador retro es suficiente.

export class AudioSystem {
  constructor() {
    this.soundOn = true;
    this._ctx = null;
    this._masterGain = null;
    this._musicGain = null;
    this._musicOscs = [];

    this._initContext();
  }

  _initContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this._ctx = new AC();

    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 0.35;
    this._masterGain.connect(this._ctx.destination);

    this._musicGain = this._ctx.createGain();
    this._musicGain.gain.value = 0.18;
    this._musicGain.connect(this._ctx.destination);
  }

  // Yo desbloqueo el AudioContext en el primer gesto del usuario (requisito de los navegadores)
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
  }

  setSoundOn(on) {
    this.soundOn = !!on;
    if (!this._ctx) return;
    const vol = this.soundOn ? 0.35 : 0;
    this._masterGain.gain.setTargetAtTime(vol, this._ctx.currentTime, 0.05);
  }

  setMusicOn(on) {
    if (!this._ctx) return;
    const vol = on ? 0.18 : 0;
    this._musicGain.gain.setTargetAtTime(vol, this._ctx.currentTime, 0.2);
  }

  // Yo uso un sintetizador retro en lugar de archivos de audio para garantizar
  // que el juego funcione offline y sin assets faltantes
  play(name) {
    if (!this.soundOn || !this._ctx) return;
    if (this._ctx.state === 'suspended') this.resume();
    this._synth(name);
  }

  _synth(type) {
    const ctx = this._ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this._masterGain);

    switch (type) {
      case 'jump':
        // Sweep hacia arriba — sensación de impulso
        osc.type = 'square';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(640, t + 0.12);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t); osc.stop(t + 0.12);
        break;

      case 'land':
        // Thump suave al tocar tierra
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t); osc.stop(t + 0.08);
        break;

      case 'hit':
        // Explosión de ruido — sawtooth grave que cae
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 0.35);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t); osc.stop(t + 0.35);
        break;

      case 'shield_get':
        // Power-up: acorde ascendente
        [400, 600, 800].forEach((freq, i) => {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(this._masterGain);
          o2.type = 'sine';
          o2.frequency.value = freq;
          g2.gain.setValueAtTime(0, t + i * 0.07);
          g2.gain.linearRampToValueAtTime(0.08, t + i * 0.07 + 0.05);
          g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.2);
          o2.start(t + i * 0.07); o2.stop(t + i * 0.07 + 0.2);
        });
        break;

      case 'shield_break':
        // Quiebre del escudo: glitch descendente
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.25);
        break;

      case 'levelup':
        // Fanfarria rápida de nivel
        [300, 400, 600, 800].forEach((freq, i) => {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(this._masterGain);
          o2.type = 'square';
          o2.frequency.value = freq;
          g2.gain.setValueAtTime(0.06, t + i * 0.06);
          g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
          o2.start(t + i * 0.06); o2.stop(t + i * 0.06 + 0.1);
        });
        break;

      case 'ui':
        osc.type = 'triangle';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.start(t); osc.stop(t + 0.06);
        break;

      case 'record':
        // Nuevo récord: jingle especial
        [500, 700, 900, 1200].forEach((freq, i) => {
          const o2 = ctx.createOscillator();
          const g2 = ctx.createGain();
          o2.connect(g2); g2.connect(this._masterGain);
          o2.type = 'sine';
          o2.frequency.value = freq;
          g2.gain.setValueAtTime(0.1, t + i * 0.09);
          g2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.18);
          o2.start(t + i * 0.09); o2.stop(t + i * 0.09 + 0.18);
        });
        break;

      default:
        osc.start(t); osc.stop(t + 0.001);
    }
  }

  // Yo genero un loop de música ambiental proceduralmente usando Web Audio API puro
  // Esto garantiza música sin archivos de audio externos
  startAmbientMusic() {
    if (!this._ctx) return;
    this._stopAmbientMusic();

    const ctx = this._ctx;
    const dest = this._musicGain;

    // Bajo que pulsa
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.value = 55;
    bassGain.gain.value = 0.4;
    bassOsc.connect(bassGain);
    bassGain.connect(dest);
    bassOsc.start();
    this._musicOscs.push(bassOsc);

    // Pad ambiental
    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    padOsc.type = 'sine';
    padOsc.frequency.value = 110;
    padGain.gain.value = 0.25;
    padOsc.connect(padGain);
    padGain.connect(dest);
    padOsc.start();
    this._musicOscs.push(padOsc);

    // Yo uso un LFO para darle movimiento al pad y hacerlo más vivo
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(padOsc.frequency);
    lfo.start();
    this._musicOscs.push(lfo);
  }

  _stopAmbientMusic() {
    this._musicOscs.forEach(o => { try { o.stop(); } catch { /* ya parado */ } });
    this._musicOscs = [];
  }

  destroy() {
    this._stopAmbientMusic();
    if (this._ctx) this._ctx.close().catch(() => {});
  }
}
