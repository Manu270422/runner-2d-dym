<div align="center">

# 🥷 Runner 2D DyM

### Endless Runner 2D · Estética Cyberpunk Ninja · Phaser 3 Edition

[![Made with Phaser](https://img.shields.io/badge/Made%20with-Phaser%203.88-00f2ff?style=flat-square&logo=javascript)](https://phaser.io)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-9b59ff?style=flat-square)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff3355?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-00f2ff?style=flat-square)](https://manu270422.github.io/runner-2d-dym/)

<br/>

> **Un ninja cyberpunk que nunca se detiene. Tú decides si sobrevive.**

<br/>

[🎮 Jugar en línea](https://manu270422.github.io/runner-2d-dym/) · [📦 Descargar APK](https://manu270422.github.io/runner-2d-dym/) · [🐛 Reportar bug](https://github.com/Manu270422/runner-2d-dym/issues)

</div>

---

## 📸 Capturas

> *El ninja corre a través de una ciudad cyberpunk con edificios iluminados, obstáculos ninja SVG y efectos de partículas.*

---

## 🎮 Gameplay

Tu ninja avanza automáticamente por un mundo cyberpunk lleno de obstáculos que requieren reflejos rápidos y decisiones precisas.

### Controles

| Acción | PC (Teclado) | Móvil / Táctil |
|--------|-------------|----------------|
| **Saltar** | `Espacio` · `W` · `↑` | Toque mitad superior |
| **Slide / Agacharse** | `S` · `↓` | Toque mitad inferior |
| **Pausar** | `ESC` | Botón PAUSA |

### Mecánicas principales

- **Coyote Time** — puedes saltar brevemente después de caer de un borde
- **Jump Buffering** — el input de salto se recuerda si llegó un poco antes de tocar tierra
- **Slide dinámico** — reduce la hitbox del ninja para esquivar obstáculos aéreos
- **Escudo temporal** — aparece a partir del Nivel 3 y absorbe un golpe completo
- **Dificultad progresiva** — cada 15 segundos el sistema acelera y desbloquea nuevos obstáculos

---

## 🗡️ Obstáculos

Los obstáculos son archivos **SVG escalables** — se ven nítidos en cualquier resolución y pesan muy poco.

### Saltar (evasión normal)

| Obstáculo | Descripción |
|-----------|-------------|
| **Katana** | Espadas clavadas en el suelo, verticales o inclinadas |
| **Roca** | Peñascos con musgo y grietas |
| **Tronco** | Árbol caído con corteza animada |
| **Caja / Cajas apiladas** | Suministros de madera con kanji decorativo |
| **Hoguera ninja** | Fogata enemiga con llamas y humo |
| **Muro Shoji** | Panel de papel japonés con marco de madera |

### Slide / Agacharse (evasión baja)

| Obstáculo | Descripción |
|-----------|-------------|
| **Torii roto** | Arco japonés caído — pasa por debajo |
| **Bambú** | Ramas dobladas a media altura |
| **Cuerda con cascabeles** | Trampa de alarma ninja colgante |

---

## 🏗️ Arquitectura

```
runner-2d-dym/
│
├── public/
│   └── assets/
│       ├── audio/          ← Efectos de sonido (.wav)
│       ├── images/         ← Logo y recursos gráficos
│       └── svg/            ← Obstáculos vectoriales (SVG)
│           ├── katana.svg
│           ├── hoguera.svg
│           ├── caja.svg
│           ├── torii.svg
│           ├── bambu.svg
│           ├── roca.svg
│           ├── shoji.svg
│           ├── cuerda.svg
│           └── tronco.svg
│
├── src/
│   ├── main.js             ← Entry point + configuración Phaser
│   │
│   ├── config/
│   │   └── GameConfig.js   ← Todas las constantes (GROUND_Y, velocidad, etc.)
│   │
│   ├── scenes/
│   │   ├── BootScene.js    ← Oculta splash y arranca PreloadScene
│   │   ├── PreloadScene.js ← Carga assets con barra de progreso
│   │   ├── MenuScene.js    ← Menú principal + ninja idle animado
│   │   ├── PlayScene.js    ← Gameplay completo
│   │   └── GameOverScene.js← Pantalla de fin + scoreboard
│   │
│   ├── entities/
│   │   └── Player.js       ← Ninja con animación procedural + slide
│   │
│   ├── systems/
│   │   ├── AudioSystem.js  ← Sintetizador retro (sin archivos externos requeridos)
│   │   ├── DifficultySystem.js ← Velocidad y desbloqueo por nivel
│   │   ├── SpawnSystem.js  ← Object pooling de obstáculos SVG
│   │   └── StorageSystem.js ← Persistencia con localStorage
│   │
│   └── ui/
│       └── HUD.js          ← Score, nivel, barra de escudo
│
├── index.html
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker (offline)
├── vite.config.js
└── package.json
```

### Decisiones de arquitectura

| Decisión | Por qué |
|----------|---------|
| **Phaser 3 + Arcade Physics** | Motor maduro y optimizado, perfecto para runners 2D |
| **SVG para obstáculos** | Escalables sin pixelación, pesan ~1-3KB cada uno |
| **Sintetizador Web Audio** | Audio sin archivos externos → funciona offline al instante |
| **Object Pooling** | Los obstáculos se reciclan en lugar de crearse/destruirse → 0 GC pressure |
| **Gráficos procedurales (ninja)** | El personaje se dibuja con código → no requiere spritesheet externo |
| **Scale Manager FIT** | Phaser gestiona el responsive automáticamente en todos los dispositivos |

---

## 🚀 Instalación y desarrollo local

### Requisitos

- Node.js ≥ 18
- npm ≥ 9

### Comandos

```bash
# Clonar el repositorio
git clone https://github.com/Manu270422/runner-2d-dym.git
cd runner-2d-dym

# Instalar dependencias
npm install

# Servidor de desarrollo (con hot-reload)
npm run dev
# → http://localhost:3000

# Build de producción
npm run build
# → carpeta /dist lista para deploy

# Preview del build
npm run preview
```

---

## 📱 PWA — Instalación como App

Runner 2D DyM es una **Progressive Web App** instalable:

- **Android** → Chrome → Menú → "Añadir a pantalla de inicio"
- **iOS** → Safari → Compartir → "Añadir a pantalla de inicio"
- **PC** → Chrome/Edge → Icono de instalación en la barra de direcciones

El juego funciona **completamente offline** gracias al Service Worker.

---

## 🌐 Deploy en GitHub Pages

```bash
# 1. Hacer build
npm run build

# 2. Subir la carpeta /dist a tu rama gh-pages
# (con gh-pages CLI)
npm install -g gh-pages
gh-pages -d dist

# O configurar GitHub Actions para auto-deploy en cada push a main
```

---

## 🎨 Personalización

### Ajustar dificultad

Editar `src/config/GameConfig.js`:

```js
BASE_SPEED:    220,    // Velocidad inicial (px/seg)
MAX_SPEED:     450,    // Velocidad máxima
LEVEL_DURATION: 15,   // Segundos entre cada nivel
SPAWN_MIN_GAP:  0.75, // Mínimo tiempo entre obstáculos
```

### Agregar un obstáculo nuevo

**1. Crear el SVG** en `public/assets/svg/mi_obstaculo.svg`

**2. Registrarlo en `GameConfig.js`:**
```js
svg: {
  // ...existentes...
  mi_obstaculo: 'assets/svg/mi_obstaculo.svg'
}
```

**3. Cargarlo en `PreloadScene.js`** (se carga automáticamente si está en `ASSETS.svg`)

**4. Definirlo en `SpawnSystem.js`:**
```js
const OBSTACLE_DEFS = {
  // ...existentes...
  mi_obstaculo: {
    key: 'mi_obstaculo',
    evasion: 'jump',       // 'jump' o 'slide'
    w: 60, h: 80,          // dimensiones en pantalla
    posY: -80,             // -altura (cuánto sube desde el suelo)
    hitBox: { ox: 8, oy: 8, w: 44, h: 64 },  // hitbox justa (más pequeña que el visual)
    minLevel: 2            // nivel mínimo para que aparezca
  }
};
```

**5. Desbloquearlo automáticamente** — `DifficultySystem` lo mostrará en el nivel indicado.

### Agregar sprites reales al ninja

En `src/entities/Player.js`, el método `_draw()` dibuja el ninja con Graphics.
Para reemplazarlo con un spritesheet:

```js
// En PreloadScene:
this.load.spritesheet('ninja', 'assets/sprites/ninja.png', {
  frameWidth: 48, frameHeight: 64
});

// En Player.js, reemplaza this._gfx por:
this._sprite = scene.add.sprite(0, -22, 'ninja');
this.add(this._sprite);

// Y crea animaciones:
scene.anims.create({
  key: 'run',
  frames: scene.anims.generateFrameNumbers('ninja', { start: 0, end: 7 }),
  frameRate: 14, repeat: -1
});
```

### Modificar paletas de color por nivel

En `PlayScene.js`, array `LEVEL_PALETTES`:
```js
const LEVEL_PALETTES = [
  { bg: 0x0a0c12, groundTop: 0x0d1520, groundLine: 0x00f2ff, ... },
  // Agregar más paletas aquí
];
```

---

## ⚡ Performance

| Métrica | Valor |
|---------|-------|
| Bundle JS del juego | ~30 KB (gzip) |
| Phaser (chunk separado) | ~340 KB (gzip) |
| SVG de obstáculos | 1-3 KB c/u |
| FPS objetivo | 60 FPS constantes |
| Estrategia GC | Object pooling — 0 allocations en runtime |

---

## 🛠️ Stack tecnológico

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| [Phaser](https://phaser.io) | 3.88 | Motor de juego |
| [Vite](https://vitejs.dev) | 5.x | Bundler + Dev server |
| Web Audio API | Nativa | Sintetizador de sonido |
| Service Worker | Nativo | PWA offline |
| SVG | Estándar W3C | Gráficos de obstáculos |

---

## 📄 Licencia

MIT © 2026 **Carlos Manuel Turizo Hernández** — DyM

---

<div align="center">

Hecho con 🥷 y mucho café en Colombia 🇨🇴

</div>
