// Piezas comunes de las pestañas de Easy Lines (Calibration, Searcher e Initial Seed).
// Portado de Ten Lines de Lincoln-LM (GPL-3.0) — https://github.com/Lincoln-LM/ten-lines
import { h } from './dom.js';
import { t } from './i18n.js';
import { searchSelect } from './searchSelect.js';

let nextLabelId = 1;

export const MAX_ROWS = 1000;
export const UINT_MAX = 4294967295;
export const IV_NAMES = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

export const GAME_OPTIONS = [
  ['r_painting', t('game.painting', { g: t('game.ruby') })],
  ['s_painting', t('game.painting', { g: t('game.sapphire') })],
  ['e_painting', t('game.painting', { g: t('game.emerald') })],
  ['fr', `${t('game.fr')} (ENG)`],
  ['fr_eu', `${t('game.fr')} (SPA/FRE/ITA/GER)`],
  ['fr_jpn_1_0', `${t('game.fr')} (JPN) (1.0)`],
  ['fr_jpn_1_1', `${t('game.fr')} (JPN) (1.1)`],
  ['fr_nx', t('game.switch', { g: `${t('game.fr')} (ENG/SPA/FRE/ITA/GER)` })],
  ['fr_jpn_nx', t('game.switch', { g: `${t('game.fr')} (JPN)` })],
  ['fr_mgba', `${t('game.fr')} (ENG) (mGBA 10.5)`],
  ['lg', `${t('game.lg')} (ENG)`],
  ['lg_eu', `${t('game.lg')} (SPA/FRE/ITA/GER)`],
  ['lg_jpn', `${t('game.lg')} (JPN)`],
  ['lg_nx', t('game.switch', { g: `${t('game.lg')} (ENG/SPA/FRE/ITA/GER)` })],
  ['lg_jpn_nx', t('game.switch', { g: `${t('game.lg')} (JPN)` })],
  ['lg_mgba', `${t('game.lg')} (ENG) (mGBA 10.5)`],
];

export const STATIC_CATEGORIES = [
  [0, t('cat.starters')],
  [1, t('cat.fossils')],
  [2, t('cat.gifts')],
  [3, t('cat.gameCorner')], // solo FRLG
  [4, t('cat.stationary')],
  [5, t('cat.legends')],
  [6, t('cat.events')], // solo FRLG/E
  [7, t('cat.roamers')],
  [8, t('cat.blisy')], // solo RSE
];

export const WILD_CATEGORIES = [
  [0, t('wild.grass')],
  [3, t('wild.rockSmash')],
  [4, t('wild.surfing')],
  [6, t('wild.oldRod')],
  [7, t('wild.goodRod')],
  [8, t('wild.superRod')],
];

// Ajustes de FRLG con los que se consigue una semilla: sonido, modo de botones, botón y botón extra
export const SOUND_OPTIONS = [
  ['mono', t('opt.mono')],
  ['stereo', t('opt.stereo')],
];
export const BUTTON_MODE_OPTIONS = [
  ['a', 'L=A'],
  ['h', t('opt.help')],
  ['r', 'LR'],
];
export const BUTTON_OPTIONS = [
  ['a', 'A'],
  ['start', 'Start'],
  ['l', 'L (L=A)'],
];
export const HELD_BUTTON_OPTIONS = [
  ['none', t('none')],
  ['startup_select', t('held.startup', { b: 'Select' })],
  ['startup_a', t('held.startup', { b: 'A' })],
  ['blackout_r', t('held.blackout', { b: 'R' })],
  ['blackout_a', t('held.blackout', { b: 'A' })],
  ['blackout_l', t('held.blackout', { b: 'L' })],
  ['blackout_al', t('held.blackout', { b: 'A+L' })],
];

/** Consolas disponibles según el juego (Switch o el resto). */
export function consoleOptions(isSwitch) {
  return isSwitch
    ? [
        ['NX', 'Nintendo Switch 1'],
        ['NX2', 'Nintendo Switch 2'],
      ]
    : [
        ['GBA', 'Game Boy Advance'],
        ['GBP', 'Game Boy Player'],
        ['NDS', 'Nintendo DS'],
        ['3DS', 'Nintendo 3DS (open_agb_firm)'],
      ];
}

// Select cuyas opciones pueden cambiar (lugares, Pokémon, consolas…)
export function dynSelect({ label, get, set, visible, tooltip, numeric = true }) {
  const select = h('select', {
    onchange: () => set(numeric ? Number(select.value) : select.value),
  });
  const labelId = `tl-label-${nextLabelId++}`;
  const picker = searchSelect(select, { labelId });
  const el = h(
    'div',
    { class: 'field', title: tooltip },
    h('span', { class: 'field-label', id: labelId }, label),
    picker.el,
  );
  return {
    el,
    input: select,
    setOptions(options) {
      select.replaceChildren(...options.map(([value, text]) => h('option', { value: String(value) }, text)));
      picker.sync();
    },
    refresh(disabled = false) {
      select.value = String(get());
      select.disabled = disabled;
      el.hidden = visible ? !visible() : false;
      if (el.hidden) picker.close();
      picker.sync();
    },
  };
}

/** Copia un texto al portapapeles (con respaldo para navegadores sin la API moderna). */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

/** Número que se copia al portapapeles al pulsarlo, con un breve "¡Copiado!". */
export function copyable(value) {
  const button = h(
    'button',
    {
      type: 'button',
      class: 'tl-copy',
      title: t('tl.copy'),
      onclick: async () => {
        if (!(await copyText(String(value)))) return;
        button.classList.remove('copied');
        void button.offsetWidth; // reiniciar la animación
        button.classList.add('copied');
        clearTimeout(button._timer);
        button._timer = setTimeout(() => button.classList.remove('copied'), 1200);
      },
    },
    String(value),
  );
  button.dataset.copied = t('tl.copied');
  return button;
}

/** Icono de cronómetro para el botón que envía la seed al timer. */
export function timerIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: '15', height: '15', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) {
    svg.setAttribute(k, v);
  }
  for (const d of ['M12 9v4l2.5 2.5', 'M9.5 2h5', 'M12 2v3']) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  const circle = document.createElementNS(NS, 'circle');
  for (const [k, v] of Object.entries({ cx: '12', cy: '13', r: '8' })) circle.setAttribute(k, v);
  svg.append(circle);
  return svg;
}

/** Icono de mano señalando, para el aviso de "haz clic en una fila". */
export function pointerIcon() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ['M9 11V5.5a1.5 1.5 0 0 1 3 0V10', 'M12 9.5a1.5 1.5 0 0 1 3 0V11', 'M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.9-2.6L4.3 15a1.5 1.5 0 0 1 2.4-1.8L9 15.5']) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export function section(title, ...children) {
  return h('fieldset', { class: 'tl-section' }, h('legend', {}, title), h('div', { class: 'field-grid' }, ...children));
}
