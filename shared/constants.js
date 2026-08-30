export const GAME_CONSTANTS = {
  MAX_PLAYERS_PER_ROOM: 20,
  MIN_PLAYERS_TO_START: 2, // For testing, maybe 8 for prod
  MAP_SIZE: {
    width: 2000,
    height: 2000
  },
  CLASSES: {
    ASSAULT: {
      health: 100,
      speed: 300,
      damageMultiplier: 1.2
    },
    TANK: {
      health: 200,
      speed: 180,
      damageMultiplier: 0.8
    },
    ENGINEER: {
      health: 120,
      speed: 220,
      damageMultiplier: 1.0
    },
    PHANTOM: {
      health: 80,
      speed: 350,
      damageMultiplier: 1.5
    }
  },
  RIFT_EVENTS: [
    'GRAVITY_INVERSION',
    'DARKNESS_MODE',
    'METEOR_SHOWER',
    'ZOMBIE_INVASION',
    'SPEED_BOOST',
    'WEAPON_OVERLOAD',
    'PORTALS_OPEN',
    'ARENA_SPLIT',
    'LOOT_EXPLOSION'
  ]
};
