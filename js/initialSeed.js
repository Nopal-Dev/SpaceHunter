// Pestaña "Initial Seed" de Ten Lines, reescrita para Easy Lines: dada una seed objetivo (32 bits, por
// ejemplo de la pestaña Searcher), lista las seeds iniciales más cercanas con los avances necesarios
// y cuánto se tarda. Cada resultado se abre en Calibration con su seed, su rango de avances y, en
// FRLG, los ajustes de sonido y botones con los que se consigue.
// Portado de Ten Lines de Lincoln-LM (GPL-3.0) — https://github.com/Lincoln-LM/ten-lines
import { proxy } from './vendor/comlink.mjs';
import { h, numberField, checkboxField } from './dom.js';
import { t } from './i18n.js';
import { dynSelect, section, copyable, GAME_OPTIONS, consoleOptions, UINT_MAX } from './shared.js';
import { getEngine, fetchSeedData, frameToMS, hexSeed, fixGameConsole } from './engine.js';

const STORAGE_KEY = 'easy-lines-initial-seed';

const DEFAULTS = {
  targetSeed: 0xdeadbeef,
  count: 10,
  offset: 0,
  game: 'r_painting',
  gameConsole: 'GBA',
  teachyTVMode: false,
  teachyTVRegularOut: 3600,
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { ...structuredClone(DEFAULTS), ...saved };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

/** Reparto de avances con TeachyTV: cada avance en TeachyTV equivale a 313 normales. */
function teachyTVConversion(advances, minimumAdvancesOut) {
  const ttvAdvances = Math.floor((advances - minimumAdvancesOut) / 313);
  return { ttvAdvances, regularAdvances: advances - ttvAdvances * 313 };
}

/** Duración "H:mm:ss.SSS" (las horas pueden pasar de 24). */
function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms));
  const hours = Math.floor(total / 3600000);
  const minutes = Math.floor(total / 60000) % 60;
  const seconds = Math.floor(total / 1000) % 60;
  const millis = total % 1000;
  const pad = (v, n = 2) => String(v).padStart(n, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}

/** "Mono | L=A | Botón de seed: A | Botón extra: Startup Select" a partir de la clave de ajustes FRLG. */
function describeSettings(settings) {
  if (!settings) return '';
  const [sound, buttonMode, activeButton, heldModifier, heldButton] = settings.split('_');
  const term = {
    stereo: 'Stereo',
    mono: 'Mono',
    start: 'Start',
    select: 'Select',
    a: 'A',
    l: 'L',
    r: 'R',
    startup: 'Startup',
    blackout: 'Blackout',
    al: 'A+L',
    none: t('none'),
  };
  const modes = { a: 'L=A', h: 'Help', r: 'LR' };
  const extra = [term[heldModifier], term[heldButton]].filter(Boolean).join(' ');
  return `${term[sound] ?? sound} | ${modes[buttonMode] ?? buttonMode} | ${t('tl.button')}: ${term[activeButton] ?? activeButton} | ${t('tl.heldButton')}: ${extra}`;
}

/**
 * Crea la pestaña en `root`. `onOpenCalibration(patch)` abre un resultado en Calibration.
 * Devuelve { setTarget(hex) } para abrir aquí una seed que viene del Searcher.
 */
export function createInitialSeed(root, { onOpenCalibration }) {
  const state = loadState();
  let rows = [];
  let searching = false;
  let searchId = 0;
  let snapshot = null;

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignorar
    }
  };

  const isFRLG = () => !state.game.endsWith('painting');
  const isSwitch = () => state.game.endsWith('nx');
  const gameConsole = () => fixGameConsole(state.game, state.gameConsole);
  const isTeachyTV = () => state.teachyTVMode && isFRLG() && !isSwitch();

  const set = (patch) => {
    Object.assign(state, patch);
    save();
    refresh();
  };

  // ─── Campos ───
  const targetField = numberField({
    label: t('is.target'),
    tooltip: t('is.target.tip'),
    min: 0,
    max: UINT_MAX,
    radix: () => 16,
    get: () => state.targetSeed,
    set: (v) => set({ targetSeed: v }),
  });
  targetField.input.classList.add('mono-input');
  const countField = numberField({ label: t('is.count'), min: 1, max: 5000, get: () => state.count, set: (v) => set({ count: v }) });
  const offsetField = numberField({ label: t('tl.offset'), min: 0, max: UINT_MAX, get: () => state.offset, set: (v) => set({ offset: v }) });
  const gameField = dynSelect({
    label: t('tl.game'),
    numeric: false,
    get: () => state.game,
    set: (v) => {
      rows = [];
      snapshot = null;
      renderResults();
      set({ game: v, gameConsole: fixGameConsole(v, state.gameConsole) });
    },
  });
  gameField.setOptions(GAME_OPTIONS);
  const consoleField = dynSelect({ label: t('tl.console'), numeric: false, get: gameConsole, set: (v) => set({ gameConsole: v }) });
  const teachyCheck = checkboxField({ label: t('tl.teachyTV'), get: () => isTeachyTV(), set: (v) => set({ teachyTVMode: v }) });
  const teachyOutField = numberField({
    label: t('is.ttvOut'),
    tooltip: t('is.ttvOut.tip'),
    min: 0,
    max: UINT_MAX,
    visible: isTeachyTV,
    get: () => state.teachyTVRegularOut,
    set: (v) => set({ teachyTVRegularOut: v }),
  });

  const errorBox = h('p', { class: 'tl-error' });
  const submitBtn = h('button', { type: 'submit', class: 'btn btn-primary btn-block tl-submit' }, t('tl.search'));
  const status = h('span', { class: 'tl-status' });
  const resultsHead = h('thead');
  const resultsBody = h('tbody');
  const resultsCount = h('span', { class: 'muted' });
  const resultsEmpty = h('p', { class: 'empty' }, t('tl.resultsIdle'));
  const resultsHint = h('p', { class: 'tl-hint', hidden: true, role: 'note' }, h('span', {}, t('is.hint')));
  const resultsCard = h(
    'section',
    { class: 'card tl-results' },
    h('div', { class: 'tl-results-head' }, h('h2', {}, t('tl.results')), resultsCount),
    resultsHint,
    h('div', { class: 'tl-table-wrap' }, h('table', { class: 'tl-table' }, resultsHead, resultsBody)),
    resultsEmpty,
  );

  const allFields = [targetField, countField, offsetField, gameField, consoleField, teachyCheck, teachyOutField];
  const form = h(
    'form',
    { class: 'card tl-form', novalidate: true },
    h('p', { class: 'hint tl-intro' }, t('is.intro')),
    section(t('tl.sec.target'), targetField.el, countField.el, offsetField.el),
    section(t('tl.sec.game'), gameField.el, consoleField.el, teachyCheck.el, teachyOutField.el),
    errorBox,
    submitBtn,
    status,
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search();
  });
  root.replaceChildren(form, resultsCard);

  function refresh() {
    allFields.forEach((f) => f.refresh(false));
    const consoles = consoleOptions(isSwitch());
    if (consoleField.input.options.length !== consoles.length || consoleField.input.options[0]?.value !== consoles[0][0]) {
      consoleField.setOptions(consoles);
    }
    consoleField.refresh();
    teachyCheck.el.hidden = !(isFRLG() && !isSwitch());
    submitBtn.disabled = searching;
    submitBtn.textContent = searching ? t('tl.searching') : t('tl.search');
    errorBox.hidden = !errorBox.textContent;
  }

  // ─── Búsqueda ───
  async function search() {
    if (searching) return;
    const id = ++searchId;
    snapshot = {
      isFRLG: isFRLG(),
      gameConsole: gameConsole(),
      isTeachyTV: isTeachyTV(),
      teachyTVRegularOut: state.teachyTVRegularOut,
      game: state.game,
    };
    rows = [];
    searching = true;
    errorBox.textContent = '';
    status.textContent = t('tl.loadingEngine');
    renderResults();
    refresh();
    const done = proxy((results) => {
      if (id !== searchId) return;
      rows = Array.from(results);
      searching = false;
      status.textContent = '';
      renderResults();
      refresh();
    });
    try {
      const engine = await getEngine();
      status.textContent = t('tl.searching');
      if (!snapshot.isFRLG) {
        await engine.ten_lines_painting(state.targetSeed >>> 0, state.count, state.offset, done);
      } else {
        const data = await fetchSeedData(state.game);
        await engine.ten_lines_frlg(
          state.targetSeed >>> 0,
          state.count,
          state.offset,
          state.game,
          snapshot.isTeachyTV ? state.teachyTVRegularOut : 0,
          data,
          done,
        );
      }
    } catch (err) {
      if (id !== searchId) return;
      searching = false;
      status.textContent = '';
      errorBox.textContent = t('tl.error', { e: err.message });
      refresh();
    }
  }

  function renderResults() {
    const s = snapshot;
    resultsEmpty.hidden = rows.length > 0 || searching;
    if (!s) {
      resultsCount.textContent = '';
      resultsBody.replaceChildren();
      resultsHead.replaceChildren();
      resultsEmpty.textContent = t('tl.resultsIdle');
      resultsHint.hidden = true;
      return;
    }
    if (!searching && rows.length === 0) resultsEmpty.textContent = t('tl.noResults');
    resultsCount.textContent = t('tl.resultsCount', { n: rows.length });
    const cols = [
      '',
      !s.isFRLG && t('is.seedDec'),
      t('is.seedHex'),
      t('col.advances'),
      s.isTeachyTV && t('col.aPress'),
      s.isTeachyTV && t('col.ttv'),
      t('is.totalFrames'),
      t('is.totalTime'),
      t('is.seedTime'),
      s.isFRLG && t('is.settings'),
    ].filter((c) => c !== false);
    resultsHead.replaceChildren(h('tr', {}, ...cols.map((c, i) => h('th', i === 0 ? { class: 'tl-use-cell' } : {}, c))));
    resultsBody.replaceChildren(
      ...rows.map((row) => {
        let visualFrame = row.advances;
        let ttvAdvances = 0;
        if (s.isTeachyTV) {
          const ttv = teachyTVConversion(row.advances, s.teachyTVRegularOut);
          ttvAdvances = ttv.ttvAdvances;
          visualFrame = ttv.ttvAdvances + ttv.regularAdvances;
        }
        const seedMS = frameToMS(row.seedTime / 16, s.gameConsole);
        return h(
          'tr',
          {},
          h(
            'td',
            { class: 'tl-use-cell' },
            h('button', { type: 'button', class: 'tl-use-btn', title: t('is.openCalibration'), onclick: () => openInCalibration(row, s) }, h('span', {}, t('tab.calibration'))),
          ),
          !s.isFRLG && h('td', {}, row.initialSeed),
          h('td', { class: 'mono' }, hexSeed(row.initialSeed, 16)),
          h('td', {}, copyable(row.advances)),
          s.isTeachyTV && h('td', {}, visualFrame),
          s.isTeachyTV && h('td', {}, ttvAdvances),
          h('td', {}, Math.round(row.seedTime / 16 + visualFrame)),
          h('td', { class: 'mono' }, formatDuration(frameToMS(row.seedTime / 16 + visualFrame, s.gameConsole))),
          h('td', {}, copyable(seedMS), ' ms'),
          s.isFRLG && h('td', {}, describeSettings(row.settings)),
        );
      }),
    );
    resultsHint.hidden = rows.length === 0;
  }

  /** Como "Open In Calibration" de Ten Lines: seed, avances ±1000 (±15 con TeachyTV) y ajustes FRLG. */
  function openInCalibration(row, s) {
    const patch = { game: s.game, gameConsole: s.gameConsole, targetInitialSeed: row.initialSeed };
    if (s.isTeachyTV) {
      const ttv = teachyTVConversion(row.advances, s.teachyTVRegularOut);
      Object.assign(patch, {
        teachyTVMode: true,
        advancesMin: Math.max(0, ttv.regularAdvances + ttv.ttvAdvances - 15),
        advancesMax: ttv.regularAdvances + ttv.ttvAdvances + 15,
        ttvAdvancesMin: Math.max(0, ttv.ttvAdvances - 15),
        ttvAdvancesMax: ttv.ttvAdvances + 15,
      });
    } else {
      Object.assign(patch, { advancesMin: Math.max(0, row.advances - 1000), advancesMax: row.advances + 1000 });
    }
    if (s.isFRLG && row.settings) {
      const [sound, buttonMode, activeButton, heldModifier, heldButton] = row.settings.split('_');
      Object.assign(patch, {
        sound,
        buttonMode,
        button: activeButton,
        heldButton: heldModifier + (heldButton ? `_${heldButton}` : ''),
      });
    }
    onOpenCalibration(patch);
  }

  refresh();
  renderResults();

  return {
    /** Abre aquí una seed objetivo (hex de 32 bits) que viene del Searcher. */
    setTarget(hex) {
      const value = parseInt(hex, 16);
      if (Number.isFinite(value)) set({ targetSeed: value >>> 0 });
    },
  };
}
