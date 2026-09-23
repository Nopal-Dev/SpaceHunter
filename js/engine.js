// Conexión con el motor de Ten Lines (PokeFinderCore compilado a WebAssembly).
// Portado de Ten Lines de Lincoln-LM (GPL-3.0) — https://github.com/Lincoln-LM/ten-lines
import { wrap } from './vendor/comlink.mjs';
import { t, lang } from './i18n.js';

const BASE = new URL('../engine/', import.meta.url);

export const Game = Object.freeze({
  None: 0,
  Ruby: 1 << 0,
  Sapphire: 1 << 1,
  RS: (1 << 0) | (1 << 1),
  Emerald: 1 << 2,
  RSE: (1 << 0) | (1 << 1) | (1 << 2),
  FireRed: 1 << 3,
  LeafGreen: 1 << 4,
  FRLG: (1 << 3) | (1 << 4),
  Gen3: 0b11111,
});

export const STATIC_1 = 1;
export const STATIC_2 = 3;
export const STATIC_4 = 4;
export const WILD_1 = STATIC_1 + 4;
export const WILD_2 = STATIC_2 + 4;
export const WILD_4 = STATIC_4 + 4;
export const COMBINED_WILD_METHOD = (1 | 2 | 4) + 4;

export const SEED_IDENTIFIER_TO_GAME = {
  r_painting: Game.Ruby,
  s_painting: Game.Sapphire,
  e_painting: Game.Emerald,
  fr: Game.FireRed,
  fr_eu: Game.FireRed,
  fr_nx: Game.FireRed,
  fr_jpn_nx: Game.FireRed,
  lg: Game.LeafGreen,
  lg_eu: Game.LeafGreen,
  lg_nx: Game.LeafGreen,
  lg_jpn_nx: Game.LeafGreen,
  fr_jpn_1_0: Game.FireRed,
  fr_jpn_1_1: Game.FireRed,
  lg_jpn: Game.LeafGreen,
  fr_mgba: Game.FireRed,
  lg_mgba: Game.LeafGreen,
};

const SEED_FILES = {
  fr: 'fr_eng.bin',
  fr_eu: 'fr_eng.bin',
  fr_nx: 'fr_eng_nx.bin',
  fr_jpn_nx: 'fr_jpn_nx.bin',
  lg: 'lg_eng.bin',
  lg_eu: 'lg_eng.bin',
  lg_nx: 'lg_eng_nx.bin',
  lg_jpn_nx: 'lg_jpn_nx.bin',
  fr_jpn_1_0: 'fr_jpn_1_0.bin',
  fr_jpn_1_1: 'fr_jpn_1_1.bin',
  lg_jpn: 'lg_jpn.bin',
  fr_mgba: 'fr_eng_mgba.bin',
  lg_mgba: 'lg_eng_mgba.bin',
};

// ─── Motor (Web Worker, se carga una sola vez) ───

let enginePromise = null;

/** Devuelve el motor listo para usar (las funciones se llaman con await). */
export function getEngine() {
  if (!enginePromise) {
    enginePromise = new Promise((resolve, reject) => {
      const worker = new Worker(new URL('engine.js', BASE));
      worker.addEventListener('message', (m) => {
        if (m?.data?.ready === true) resolve(wrap(worker));
      });
      worker.addEventListener('error', (e) => {
        enginePromise = null;
        reject(new Error(e.message || 'No se pudo cargar el motor de Ten Lines'));
      });
    });
  }
  return enginePromise;
}

export async function fetchSeedData(game) {
  const response = await fetch(new URL(`data/${SEED_FILES[game]}`, BASE));
  if (!response.ok) throw new Error('No se pudo cargar la lista de seeds');
  return new Uint8Array(await response.arrayBuffer());
}

// ─── Tiempos por consola ───

const SYSTEM_TIMING_DATA = {
  Generic: { frame_rate: 16777216 / 280896, offset_ms: 0 },
  GBA: { frame_rate: 16777216 / 280896, offset_ms: -260 },
  GBP: { frame_rate: 16777216 / 280896, offset_ms: 200 },
  NDS: { frame_rate: 16756991 / 280896, offset_ms: 788 },
  '3DS': { frame_rate: 16756991 / 280896, offset_ms: 1558 },
  NX: { frame_rate: 16777216 / 280896, offset_ms: 0 },
  NX2: { frame_rate: 16777216 / 280896, offset_ms: -750 },
};

export function frameToMS(frame, system) {
  const timing = SYSTEM_TIMING_DATA[system] ?? SYSTEM_TIMING_DATA.Generic;
  return Math.floor((frame / timing.frame_rate) * 1000) + timing.offset_ms;
}

export function hexSeed(seed, bits) {
  return (seed >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(Math.ceil(bits) / 4, '0');
}

export function fixGameConsole(game, gameConsole) {
  if (game.endsWith('nx') && !gameConsole.startsWith('NX')) return 'NX';
  if (!game.endsWith('nx') && gameConsole.startsWith('NX')) return 'GBA';
  return gameConsole;
}

// ─── Textos de PokeFinder en el idioma elegido (los lugares solo existen en inglés) ───

const parseList = (text) =>
  text
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map((line) => line.trim());
const parseMap = (text) =>
  Object.fromEntries(
    parseList(text)
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf(',');
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );

let resourcesPromise = null;

export function getResources() {
  if (!resourcesPromise) {
    const fetchText = (file) =>
      fetch(new URL(`i18n/${file}.txt`, BASE)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(file))));
    const load = (name) => fetchText(name.replace(/_en$/, `_${lang}`)).catch(() => fetchText(name));
    resourcesPromise = Promise.all(
      ['powers_en', 'natures_en', 'abilities_en', 'species_en', 'forms_en', 'frlg_en', 'rs_en', 'e_en'].map(load),
    ).then(([types, natures, abilities, species, forms, frlg, rs, e]) => {
      const res = {
        TYPES: parseList(types),
        NATURES: parseList(natures).filter(Boolean),
        ABILITIES: parseList(abilities),
        SPECIES: ['Egg', ...parseList(species)],
        FORMS: Object.fromEntries(
          parseList(forms)
            .filter(Boolean)
            .map((line) => {
              const [sp, form, name] = line.split(',');
              return [`${sp}-${form}`, name];
            }),
        ),
        FRLG_LOCATIONS: parseMap(frlg),
        RS_LOCATIONS: parseMap(rs),
        E_LOCATIONS: parseMap(e),
      };
      res.getName = (species, form = 0) => {
        const formName = res.FORMS[`${species}-${form}`];
        return `${res.SPECIES[Number(species)]}${formName ? ` (${formName})` : ''}`;
      };
      res.getLocation = (game, location) => {
        if (game & Game.RS) return res.RS_LOCATIONS[location];
        if (game & Game.Emerald) return res.E_LOCATIONS[location];
        return res.FRLG_LOCATIONS[location];
      };
      return res;
    });
  }
  return resourcesPromise;
}

export const METHODS = {
  [STATIC_1]: 'Static 1',
  [STATIC_2]: 'Static 2',
  [STATIC_4]: 'Static 4',
  [WILD_1]: 'Wild 1',
  [WILD_2]: 'Wild 2',
  [WILD_4]: 'Wild 4',
  [COMBINED_WILD_METHOD]: t('method.allWild'),
};

export const GENDERS = ['♂', '♀', '-'];
export const SHININESS = [t('shiny.no'), t('shiny.star'), t('shiny.square')];

const GAME_BITS = [
  [Game.Ruby, 'game.ruby'],
  [Game.Sapphire, 'game.sapphire'],
  [Game.Emerald, 'game.emerald'],
  [Game.FireRed, 'game.fr'],
  [Game.LeafGreen, 'game.lg'],
];

/** Nombre de la(s) versión(es) de un template, p. ej. "FireRed & LeafGreen". */
export function gameName(flag) {
  return GAME_BITS.filter(([bit]) => flag & bit)
    .map(([, key]) => t(key))
    .join(' & ');
}
