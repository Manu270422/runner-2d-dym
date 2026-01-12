# Runner 2D DyM — Cyberpunk Endless Runner (PWA)

> Un juego de plataformas infinito estilo Cyberpunk, desarrollado con JavaScript Moderno (ES Modules), Canvas API y optimizado como Progressive Web App (PWA).

![Status](https://img.shields.io/badge/Status-Stable-success)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)
![Mobile](https://img.shields.io/badge/Mobile-Optimized-orange)

---

## 🚀 Características Principales

* **Motor Personalizado:** Lógica de juego a 60 FPS con Delta Time.
* **Arquitectura Modular:** Código organizado en ES Modules (`src/system`, `src/entities`, `src/scenes`).
* **PWA Instalable:**
    * Funciona **Offline** (Service Worker con estrategia *Cache-First* y *Network-Fallback*).
    * Instalable en Android/iOS como App nativa (Manifest V2).
    * Pantalla de "Sin Conexión" personalizada.
* **Gráficos y FX:**
    * Fondo con **Parallax Scrolling** infinito.
    * Sistema de **Partículas** (explosiones, aura de escudo).
    * **Paletas de colores dinámicas** que cambian al subir de nivel.
* **Gameplay:**
    * Aceleración progresiva.
    * Power-Ups (Escudo de fuerza).
    * Persistencia de Récord (LocalStorage).
* **Audio Híbrido:** Soporte para efectos WAV y sintetizador web.

---

## 🛠 Requisitos y Ejecución

Debido al uso de `ES Modules` y `Service Workers`, el juego **requiere** un servidor local (no funcionará abriendo el `index.html` directamente).

### Entorno de Desarrollo
1.  **Editor:** Visual Studio Code.
2.  **Plugin:** Extensión **Live Server**.
3.  **Navegador:** Chrome, Edge, Safari o Firefox (Actualizados).

### Cómo iniciar
1.  Clona o descarga el proyecto.
2.  Abre la carpeta raíz en VS Code.
3.  Clic derecho en `index.html` → **Open with Live Server**.

---

## 🎮 Controles

El juego detecta automáticamente el dispositivo:

| Acción | PC (Teclado) | Móvil / Tablet |
| :--- | :--- | :--- |
| **Saltar** | `Espacio`, `Flecha Arriba`, `W` | Toque en pantalla (Tap) |
| **Menú** | Mouse | Toque |

> **Nota:** En móviles, el juego bloquea gestos nativos (zoom/scroll) para una experiencia fluida.

---

## 📂 Estructura del Proyecto

```text
/
├── assets/                 # Recursos estáticos
│   ├── audio/              # Efectos de sonido (wav)
│   ├── icons/              # Iconos para PWA
│   └── images/             # Sprites y logos
├── src/
│   ├── entities/           # Objetos de juego (Player, Obstáculos, PowerUps)
│   ├── scenes/             # Gestor de escenas (Menú, Juego, GameOver)
│   ├── system/             # Motor (Game Loop, Audio, Inputs, Storage)
│   └── main.js             # Punto de entrada y configuración
├── index.html              # Entry point
├── offline.html            # Pantalla de fallback sin conexión
├── manifest.json           # Configuración de instalación PWA
├── sw.js                   # Service Worker (Caché y Offline)
└── README.md               # Documentación 

⚙️ Personalización (Config)
Puedes ajustar el balance del juego editando src/scenes/SceneRunner.js en el objeto GAME_CONFIG: 

const GAME_CONFIG = {
  GROUND_Y: 480,              // Altura del suelo
  BASE_SPEED: 220,            // Velocidad inicial
  SPEED_INCREASE_PER_LEVEL: 20, // Aceleración por nivel
  SPAWN_TIMER_MIN: 0.8,       // Tiempo mínimo entre obstáculos
  SHIELD_LEVEL_REQ: 3         // Nivel para desbloquear escudos
};

📱 Instalación en Móviles (PWA)
Abre el juego en Chrome (Android) o Safari (iOS).

Android: Toca "Agregar a la pantalla principal" en el aviso inferior o en el menú.

iOS: Toca el botón "Compartir" → "Agregar al inicio".

¡El juego aparecerá como una App nativa sin barra de navegación! 

📝 Créditos
Desarrollado con ❤️ usando Vanilla JS. Concepto original: Runner 2D DyM. 

