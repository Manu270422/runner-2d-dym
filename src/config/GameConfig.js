// config/GameConfig.js

export const VIRTUAL_W = 960;
export const VIRTUAL_H = 540;

export const ASSETS = {
  audio: {
    jump: 'assets/audio/jump.wav',
    hit:  'assets/audio/hit.wav'
  },
  svg: {
    katana: 'assets/svg/katana.svg',
    hoguera:'assets/svg/hoguera.svg',
    caja:   'assets/svg/caja.svg',
    torii:  'assets/svg/torii.svg',
    bambu:  'assets/svg/bambu.svg',
    roca:   'assets/svg/roca.svg',
    shoji:  'assets/svg/shoji.svg',
    cuerda: 'assets/svg/cuerda.svg',
    tronco: 'assets/svg/tronco.svg'
  }
};

export const PALETTE = {
  bgDeep:   '#0a0c12',
  bgDark:   '#0f1623',
  bgMid:    '#141d2e',
  bgNear:   '#1a2438',
  panel:    '#131b2a',
  border:   '#1e2d44',
  cyan:     '#00f2ff',
  cyanDim:  '#007a80',
  purple:   '#9b59ff',
  red:      '#ff3355',
  textHi:   '#ffffff',
  textMid:  '#a0b4cc',
  ground:   '#0d1520',
};

// GROUND_Y es la Y donde el suelo empieza (arriba del bloque de suelo).
// El ninja corre con los pies en esta línea.
export const GAMEPLAY = {
  GROUND_Y:              400,   // línea del suelo
  GROUND_BLOCK_H:        140,   // altura del bloque de suelo hasta el fondo

  BASE_SPEED:            220,
  MAX_SPEED:             450,
  SPEED_PER_LEVEL:       16,

  GRAVITY:               1500,
  JUMP_FORCE:            -560,
  COYOTE_TIME:           0.1,
  JUMP_BUFFER_TIME:      0.14,

  // Slide
  SLIDE_DURATION:        0.55,   // segundos que dura el slide
  SLIDE_SPEED_BOOST:     1.15,

  SPAWN_MIN_GAP:         0.75,
  SPAWN_MAX_GAP:         1.6,
  SPAWN_MIN_AT_MAX:      0.4,

  LEVEL_DURATION:        15,
  MAX_LEVEL:             10,

  SHIELD_DURATION:       5,
  SHIELD_MIN_LEVEL:      3,

  SCORE_PER_SECOND:      10,

  PARALLAX_FAR:          0.08,
  PARALLAX_MID:          0.25,
  PARALLAX_NEAR:         0.55,
};
