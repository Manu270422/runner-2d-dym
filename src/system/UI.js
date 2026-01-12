// system/UI.js

// Configuración visual centralizada
const THEME = {
  bg: '#2b313b',
  bgHover: '#3a4150',
  bgPressed: '#1e232b',
  bgOn: '#1abc9c',
  border: '#4b5260',
  text: '#ffffff',
  textDim: '#a0a0a0',
  font: '14px monospace'
};

/**
 * Clase Base para componentes UI.
 * Maneja la lógica común de colisión.
 */
class UIComponent {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.isHovered = false;
    this.isPressed = false;
  }

  contains(mx, my) {
    return mx >= this.x && 
           mx <= this.x + this.w && 
           my >= this.y && 
           my <= this.y + this.h;
  }
}

/**
 * Botón estándar con estados: Normal, Hover, Pressed.
 */
export class UIButton extends UIComponent {
  constructor(x, y, w, h, label, onClick) {
    super(x, y, w, h);
    this.label = label;
    this.onClick = onClick;
    this.enabled = true;
  }

  // Retorna true si el evento fue consumido por la UI
  update(input) {
    if (!this.enabled) return false;

    this.isHovered = this.contains(input.mouse.x, input.mouse.y);
    const isDown = input.mouse.isDown;
    const isClicked = input.mouse.isClicked;

    // Lógica de presionado visual
    this.isPressed = this.isHovered && isDown;

    // Lógica de disparo de acción
    if (this.isHovered && isClicked) {
      this.onClick?.();
      return true; // Input capturado
    }

    return this.isHovered; // Retorna true si el mouse está encima (para bloquear otros hovers)
  }

  draw(ctx) {
    if (!this.enabled) return;

    // Selección de color según estado
    if (this.isPressed) ctx.fillStyle = THEME.bgPressed;
    else if (this.isHovered) ctx.fillStyle = THEME.bgHover;
    else ctx.fillStyle = THEME.bg;

    // Fondo
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // Borde (opcional: cambia de color al hover)
    ctx.strokeStyle = this.isHovered ? '#ffffff' : THEME.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.w, this.h);

    // Texto
    ctx.fillStyle = THEME.text;
    ctx.font = THEME.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Pequeño desplazamiento de texto al presionar para efecto 3D
    const offset = this.isPressed ? 1 : 0;
    ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2 + offset);
  }
}

/**
 * Interruptor ON/OFF
 */
export class UIToggle extends UIComponent {
  constructor(x, y, label, initialValue, onChange) {
    super(x, y, 120, 24); // Ancho fijo por defecto
    this.label = label;
    this.value = initialValue;
    this.onChange = onChange;
  }

  update(input) {
    this.isHovered = this.contains(input.mouse.x, input.mouse.y);
    
    if (this.isHovered && input.mouse.isClicked) {
      this.value = !this.value;
      this.onChange?.(this.value);
      return true;
    }
    return this.isHovered;
  }

  draw(ctx) {
    // Fondo indicador
    ctx.fillStyle = this.value ? THEME.bgOn : THEME.bg;
    ctx.fillRect(this.x, this.y, 40, this.h); // Caja del switch
    ctx.strokeStyle = THEME.border;
    ctx.strokeRect(this.x, this.y, 40, this.h);

    // Texto ON/OFF dentro del switch
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.value ? 'ON' : 'OFF', this.x + 20, this.y + this.h / 2);

    // Etiqueta descriptiva al lado
    ctx.fillStyle = this.isHovered ? '#fff' : THEME.textDim;
    ctx.font = THEME.font;
    ctx.textAlign = 'left';
    ctx.fillText(this.label, this.x + 50, this.y + this.h / 2);
  }
}

/**
 * Barra superior estilo ventana OS
 */
export class UIWindowBar extends UIComponent {
  constructor(x, y, w, title) {
    super(x, y, w, 28);
    this.title = title;
    
    // Definición de botones internos
    const btnSize = 20;
    const startX = w - 80;
    
    this.buttons = [
      { id: 'min', label: '_', x: startX, y: 4, w: btnSize, h: btnSize },
      { id: 'max', label: '□', x: startX + 24, y: 4, w: btnSize, h: btnSize },
      { id: 'close', label: '×', x: startX + 48, y: 4, w: btnSize, h: btnSize, danger: true }
    ];
  }

  // La barra no suele capturar clics globales, pero sus botones sí
  update(input) {
    // Si el mouse no está en la barra, ignoramos
    if (!this.contains(input.mouse.x, input.mouse.y)) return false;

    let captured = false;

    // Verificar botones internos
    for (const btn of this.buttons) {
      // Coordenadas absolutas del botón
      const btnX = this.x + btn.x;
      const btnY = this.y + btn.y;

      const isOver = input.mouse.x >= btnX && input.mouse.x <= btnX + btn.w &&
                     input.mouse.y >= btnY && input.mouse.y <= btnY + btn.h;
      
      btn.isHovered = isOver;

      if (isOver && input.mouse.isClicked) {
        this._handleAction(btn.id);
        captured = true;
      }
    }
    return captured;
  }

  _handleAction(id) {
    console.log(`Acción de ventana: ${id}`);
    if (id === 'max') {
        // Toggle Fullscreen nativo
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {});
        } else {
            document.exitFullscreen();
        }
    }
    // Aquí podrías agregar lógica para 'min' o 'close' si tu juego lo soporta
  }

  draw(ctx) {
    // Fondo Barra
    ctx.fillStyle = '#1a1d21';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    
    // Línea inferior
    ctx.strokeStyle = THEME.border;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.h);
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.stroke();

    // Título
    ctx.fillStyle = THEME.text;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.title, this.x + 10, this.y + this.h / 2);

    // Dibujar botones
    ctx.textAlign = 'center';
    for (const btn of this.buttons) {
      const bx = this.x + btn.x;
      const by = this.y + btn.y;

      // Color de fondo del botón
      if (btn.isHovered) {
        ctx.fillStyle = btn.danger ? '#e74c3c' : THEME.bgHover;
      } else {
        ctx.fillStyle = THEME.bg;
      }
      
      ctx.fillRect(bx, by, btn.w, btn.h);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(bx, by, btn.w, btn.h);

      // Icono
      ctx.fillStyle = '#fff';
      ctx.fillText(btn.label, bx + btn.w/2, by + btn.h/2);
    }
  }
}