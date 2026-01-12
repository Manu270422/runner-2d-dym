// entities/Player.js

/**
 * Entidad Jugador
 * - Física ajustada para saltos precisos.
 * - Animación procedural (dibujada con código).
 * - Lógica de Escudo temporal.
 */
export class Player {
  constructor(game) {
    this.game = game;

    // Dimensiones
    this.w = 32;
    this.h = 32;

    // Configuración del Mundo (Debe coincidir con SceneRunner)
    this.groundY = 480;

    // Física
    this.gravity = 1500;   // Un poco más pesado para caer rápido (mejor game feel)
    this.jumpForce = -550; // Fuerza de salto
    this.rotation = 0;     // Para girar al saltar

    // Animación
    this.timer = 0;

    // Inicializar estado
    this.reset();
  }

  reset() {
    this.x = 60;
    this.y = this.groundY - this.h;
    this.vy = 0;
    this.isDead = false;
    this.rotation = 0;

    // Estado del Escudo
    this.hasShield = false;
    this.shieldTime = 0;
    this.shieldMaxTime = 0;
  }

  // =========================
  // ACCIONES
  // =========================
  
  /**
   * Intenta saltar. Retorna true si tuvo éxito (para reproducir sonido).
   */
  jump() {
    if (this.isDead) return false;

    // Margen de error de 5px para saltar (Coyote time simple)
    const onGround = this.y + this.h >= this.groundY - 5;
    
    if (onGround) {
      this.vy = this.jumpForce;
      return true; 
    }
    return false;
  }

  activateShield(durationSeconds) {
    this.hasShield = true;
    this.shieldMaxTime = durationSeconds;
    this.shieldTime = durationSeconds;
  }

  breakShield() {
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldTime = 0;
      return true; // Golpe absorbido
    }
    return false;
  }

  getBounds() {
    // Hitbox ligeramente más pequeña que el dibujo para ser amable con el jugador
    return {
      x: this.x + 8,
      y: this.y + 4,
      w: 16,
      h: 24
    };
  }

  // =========================
  // BUCLE PRINCIPAL
  // =========================
  
  update(dt) {
    if (this.isDead) return;

    this.timer += dt * 15;

    // 1. Física Vertical
    this.vy += this.gravity * dt;
    this.y += this.vy * dt;

    // 2. Colisión con Suelo
    if (this.y + this.h > this.groundY) {
      this.y = this.groundY - this.h;
      this.vy = 0;
      
      // Resetear rotación al tocar suelo
      this.rotation = 0; 
      // Alinear rotación suavemente a 0 si no es exacta
    } else {
      // Si está en el aire, girar
      this.rotation += dt * 10;
    }

    // 3. Lógica de Escudo (Cuenta regresiva)
    if (this.hasShield) {
      this.shieldTime -= dt;
      if (this.shieldTime <= 0) {
        this.hasShield = false;
        this.shieldTime = 0;
      }
    }
  }

  // =========================
  // RENDERIZADO
  // =========================
  
  draw(ctx) {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const cx = x + this.w / 2; // Centro X
    const cy = y + this.h / 2; // Centro Y

    // -------- ESCUDO (Campo de Fuerza) --------
    if (this.hasShield) {
      ctx.save();
      
      // Parpadeo cuando queda poco tiempo (< 1.5s)
      let alpha = 0.3;
      if (this.shieldTime < 1.5) {
          alpha = (Math.sin(this.timer * 2) > 0) ? 0.1 : 0.4;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#00f2ff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.8;
      ctx.stroke();

      ctx.restore();
    }

    // -------- NINJA (Con rotación) --------
    ctx.save();
    
    // Transladar al centro del personaje para rotar
    ctx.translate(cx, cy);
    if (this.y + this.h < this.groundY) {
        ctx.rotate(this.rotation); // Girar solo en el aire
    }
    ctx.translate(-cx, -cy);

    // -- Dibujo del cuerpo relativo a (x,y) --
    
    // Cuerpo
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 4, y + 8, 24, 20);

    // Cabeza
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(x + 6, y, 20, 16);

    // Ojos (Visor estilo Cyberpunk)
    ctx.fillStyle = '#00f2ff'; // Ojos neón cian
    ctx.shadowColor = '#00f2ff';
    ctx.shadowBlur = 5;
    ctx.fillRect(x + 18, y + 6, 8, 4);
    ctx.shadowBlur = 0; // Reset sombra

    // Banda roja (bufanda)
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x, y + 14, 32, 4);

    // Cola de la cinta (animada con seno)
    const tailOffset = Math.sin(this.timer) * 3;
    ctx.fillRect(x - 6, y + 14 + tailOffset, 6, 4);

    // Pies
    ctx.fillStyle = '#1a252f';
    // Animación de correr
    if (this.y + this.h >= this.groundY) {
      const footAnim = Math.sin(this.timer) * 8;
      ctx.fillRect(cx - 4 + footAnim, y + 26, 8, 6); // Pie derecho
      ctx.fillRect(cx - 4 - footAnim, y + 26, 8, 6); // Pie izquierdo
    } else {
      // Pose de salto (pies encogidos)
      ctx.fillRect(cx - 2, y + 24, 6, 6); 
    }

    ctx.restore();
  }
}