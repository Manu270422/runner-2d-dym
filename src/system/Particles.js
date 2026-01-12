// system/Particles.js

/**
 * Sistema de Partículas Optimizado
 * Usa Object Pooling y Batch Rendering para máximo rendimiento.
 */
export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.pool = []; // Aquí guardamos las partículas "muertas" para reciclarlas
  }

  reset() {
    // Mover todas las partículas activas al pool al reiniciar nivel
    while(this.particles.length > 0) {
      this.pool.push(this.particles.pop());
    }
  }

  /* =========================
      CORE (Pooling)
     ========================= */

  _spawn({ x, y, vx, vy, life, size, color, gravity = 0, friction = 1 }) {
    let p;
    // Si hay partículas en la basura, recicla una. Si no, crea nueva.
    if (this.pool.length > 0) {
      p = this.pool.pop();
      p.x = x; p.y = y;
      p.vx = vx; p.vy = vy;
      p.life = life; p.maxLife = life;
      p.size = size;
      p.color = color;
      p.gravity = gravity;
      p.friction = friction;
    } else {
      p = { x, y, vx, vy, life, maxLife: life, size, color, gravity, friction };
    }
    this.particles.push(p);
  }

  /* =========================
      EMITTERS
     ========================= */

  emit(x, y, color, count = 10, type = 'explode') {
    const isDust = type === 'dust';
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isDust ? 50 : 200);
      
      this._spawn({
        x, 
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (isDust ? 0 : -100), // Un poco hacia arriba si es explosión
        life: 0.5 + Math.random() * 0.5,
        size: Math.random() * 4 + 2,
        color: color,
        gravity: isDust ? 0 : 800, // Gravedad solo para explosiones
        friction: isDust ? 0.95 : 0.98 // Fricción para frenarlas suavemente
      });
    }
  }

  emitShieldAura(x, y) {
    // Aura suave que flota
    for (let i = 0; i < 2; i++) {
      this._spawn({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 20,
        vy: -20 - Math.random() * 30, // Flota hacia arriba
        life: 0.6,
        size: Math.random() * 3 + 1,
        color: '#00f2ff',
        gravity: 0,
        friction: 1
      });
    }
  }

  emitShieldHit(x, y) {
    // Chispas rápidas
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      this._spawn({
        x, y,
        vx: Math.cos(a) * 250,
        vy: Math.sin(a) * 250,
        life: 0.3,
        size: 2,
        color: '#ffffff',
        gravity: 0,
        friction: 0.9
      });
    }
  }

  emitShieldBreak(x, y) {
    // Explosión dramática del escudo
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      this._spawn({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.8,
        size: Math.random() * 4 + 2,
        color: '#7df9ff',
        gravity: 500, // Caen un poco
        friction: 0.95
      });
    }
  }

  /* =========================
      UPDATE & RENDER
     ========================= */

  update(dt) {
    // Iteramos al revés para poder eliminar elementos sin romper índices
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life -= dt;

      if (p.life <= 0) {
        // MUERTE: Sacar del array activo y guardar en el pool
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }

      // Física
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.vy += p.gravity * dt;
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    
    // TRUCO PRO: Usar 'lighter' UNA SOLA VEZ fuera del bucle.
    // Esto hace que las partículas se sumen brillante (efecto neón)
    // sin el costo bestial de calcular gradientes.
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      // Opacidad basada en la vida restante
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      
      ctx.beginPath();
      // Dibujamos un círculo simple. Al superponerse con 'lighter', brilla solo.
      ctx.arc(p.x | 0, p.y | 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}