/**
 * ShieldPowerUp
 * Power-Up coleccionable.
 * * - Se mueve a la velocidad del juego (scrolling).
 * - Flota suavemente (Seno).
 * - Efecto visual de "latido".
 */
export class ShieldPowerUp {
  constructor(x, y) {
    // Posición
    this.x = x;
    this.y = y;
    this.baseY = y; // Referencia para flotar

    // Dimensiones
    this.w = 24;
    this.h = 24;

    // Estado
    this.isActive = true;

    // Animación
    this.timer = 0;
    this.pulseTimer = 0;
  }

  // =========================
  // UPDATE
  // =========================
  // NOTA: Necesitamos recibir 'speed' para movernos junto con el mundo
  update(dt, speed = 200) {
    if (!this.isActive) return;

    // 1. Movimiento lateral (Scrolling)
    this.x -= speed * dt;

    // 2. Animación de flotar (Seno)
    this.timer += dt * 5;
    this.y = this.baseY + Math.sin(this.timer) * 6;

    // 3. Timer para efecto visual
    this.pulseTimer += dt;
  }

  // =========================
  // DRAW
  // =========================
  draw(ctx) {
    if (!this.isActive) return;

    // Si salió de la pantalla por la izquierda, no dibujamos (optimización)
    if (this.x < -50) return;

    const x = this.x + 12; // Centro X
    const y = this.y + 12; // Centro Y (ya incluye el flotar)

    ctx.save();

    // 1. Anillo pulsante (Efecto de onda)
    const pulse = (Math.sin(this.pulseTimer * 8) + 1) / 2; // va de 0 a 1
    const radiusPulse = 14 + pulse * 4; // Radio varía entre 14 y 18

    ctx.globalAlpha = 0.3 - (pulse * 0.2); // Se desvanece al crecer
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radiusPulse, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Núcleo Brillante (Fijo)
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = '#00f2ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00f2ff';
    
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Símbolo "+" o "S" adentro (Blanco)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x, y + 1);

    ctx.restore();
  }

  // =========================
  // HITBOX
  // =========================
  getBounds() {
    // La hitbox sigue al objeto flotante
    return {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h
    };
  }

  // =========================
  // ACTIONS
  // =========================
  deactivate() {
    this.isActive = false;
  }
}