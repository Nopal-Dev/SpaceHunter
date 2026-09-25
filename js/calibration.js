// Pestaña "Calibration" de Ten Lines, reescrita para HunterSpace.
// Portado de Ten Lines de Lincoln-LM (GPL-3.0) — https://github.com/Lincoln-LM/ten-lines
import { proxy } from './vendor/comlink.mjs';
import { h, numberField, checkboxField } from './dom.js';
import { t } from './i18n.js';
import { embedded, request, send } from './host.js';
import {
  dynSelect,
  copyable,
  timerIcon,
  pointerIcon,
  section,
  GAME_OPTIONS,
  STATIC_CATEGORIES,
  WILD_CATEGORIES,
  consoleOptions,
  SOUND_OPTIONS,
  BUTTON_MODE_OPTIONS,
  BUTTON_OPTIONS,
  HELD_BUTTON_OPTIONS,
  MAX_ROWS,
  UINT_MAX,
  IV_NAMES,
} from './shared.js';
import { searchSelect } from './searchSelect.js';

import {
  getEngine,
  getResources,
  fetchSeedData,
  frameToMS,
  hexSeed,
  fixGameConsole,
  Game,
  SEED_IDENTIFIER_TO_GAME,
  METHODS,
  GENDERS,
  SHININESS,
  gameName,
  STATIC_2,
  STATIC_4,
  COMBINED_WILD_METHOD,
} from './engine.js';

const STORAGE_KEY = 'easy-lines-calibration';
const OLD_STORAGE_KEY = 'hunterspace-tenlines-calibration'; // nombre usado antes de separar Easy Lines

// GBA/GBP/Switch corren a 59.7275 fps (GBA); NDS/3DS a 59.6555 fps (NDS Slot 2 en el timer)
const TIMER_CONSOLE = { GBA: 'GBA', GBP: 'GBA', NX: 'GBA', NX2: 'GBA', NDS: 'NDS - Slot 2', '3DS': 'NDS - Slot 2' };

/** Frames a esperar en la pantalla Continue para una fila de resultados. */
function continueFrames(row, snap) {
  if (snap.isSwitch) return row.advances - snap.overworldFrames * 2;
  if (snap.isTeachyTV) return row.advances - row.ttvAdvances * 313 + row.ttvAdvances;
  return row.advances;
}

const SORTERS = {
  none: null,
  'seed-asc': (a, b) => a.seedTime - b.seedTime || a.advances - b.advances,
  'seed-desc': (a, b) => b.seedTime - a.seedTime || a.advances - b.advances,
  'frames-asc': (a, b, snap) => continueFrames(a, snap) - continueFrames(b, snap) || a.seedTime - b.seedTime,
  'frames-desc': (a, b, snap) => continueFrames(b, snap) - continueFrames(a, snap) || a.seedTime - b.seedTime,
};
const IV_NAMES_LONG = ['stat.hp', 'stat.atk', 'stat.def', 'stat.spa', 'stat.spd', 'stat.spe'].map((k) => t(k));

const DEFAULTS = {
  game: 'r_painting',
  sound: 'mono',
  buttonMode: 'a',
  button: 'a',
  heldButton: 'none',
  gameConsole: 'GBA',
  targetInitialSeed: 0xdead,
  seedLeeway: 20,
  advancesMin: 0,
  advancesMax: 100,
  ttvAdvancesMin: 0,
  ttvAdvancesMax: 100,
  offset: 0,
  overworldFrames: 600,
  trainerID: 0,
  secretID: 0,
  teachyTVMode: false,
  method: 1,
  staticCategory: 0,
  staticPokemon: 0,
  wildCategory: 0,
  wildLocation: 0,
  wildPokemon: 0,
  wildLead: 255,
  shouldFilterPokemon: false,
  shininess: 255,
  nature: -1,
  gender: 255,
  ivRanges: [
    [0, 31],
    [0, 31],
    [0, 31],
    [0, 31],
    [0, 31],
    [0, 31],
  ],
  ivCalculatorText: '',
  sort: 'none',
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY) ?? '{}');
    return { ...structuredClone(DEFAULTS), ...saved };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function createCalibration(root) {
  const state = loadState();
  let res = null; // textos (especies, naturalezas…)
  let seedList = [];
  let staticTemplates = [];
  let wildLocations = [];
  let areaSpecies = [];
  let rows = [];
  let searching = false;
  let searchId = 0;
  let snapshot = null; // parámetros de la última búsqueda, para pintar la tabla
  let ivCalcError = '';

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignorar
    }
  };

  // ─── Derivados ───
  const isStatic = () => state.method <= STATIC_4;
  const isFRLG = () => state.game.startsWith('fr') || state.game.startsWith('lg');
  const isFRLGE = () => isFRLG() || state.game.startsWith('e_');
  const isSwitch = () => state.game.endsWith('nx');
  const gameFlag = () => SEED_IDENTIFIER_TO_GAME[state.game];
  const gameConsole = () => fixGameConsole(state.game, state.gameConsole);
  const isTeachyTV = () => state.teachyTVMode && isFRLG() && !gameConsole().startsWith('NX');
  const overworldFrames = () => (gameConsole().startsWith('NX') ? state.overworldFrames : 0);
  const targetIndex = () => seedList.findIndex((s) => s.initialSeed === state.targetInitialSeed);
  const effectiveIvRanges = () =>
    state.nature === -1 ? DEFAULTS.ivRanges.map((r) => [...r]) : state.ivRanges.map((r) => [...r]);

  const set = (patch, after) => {
    Object.assign(state, patch);
    save();
    after?.();
    refresh();
  };

  // ─── Campos: juego ───
  const gameField = dynSelect({
    label: t('tl.game'),
    numeric: false,
    get: () => state.game,
    set: (v) => {
      set({ game: v, gameConsole: fixGameConsole(v, state.gameConsole) }, () => {
        fixStaticCategory();
        loadSeedList();
        loadStaticTemplates();
        loadWildLocations();
      });
    },
  });
  gameField.setOptions(GAME_OPTIONS);

  const frlgOnly = () => isFRLG();
  const soundField = dynSelect({
    label: t('tl.sound'),
    numeric: false,
    visible: frlgOnly,
    get: () => state.sound,
    set: (v) => set({ sound: v }, loadSeedList),
  });
  soundField.setOptions(SOUND_OPTIONS);

  const buttonModeField = dynSelect({
    label: t('tl.buttonMode'),
    numeric: false,
    visible: frlgOnly,
    get: () => state.buttonMode,
    set: (v) => set({ buttonMode: v }, loadSeedList),
  });
  buttonModeField.setOptions(BUTTON_MODE_OPTIONS);

  const buttonField = dynSelect({
    label: t('tl.button'),
    numeric: false,
    visible: frlgOnly,
    get: () => state.button,
    set: (v) => set({ button: v }, loadSeedList),
  });
  buttonField.setOptions(BUTTON_OPTIONS);

  const heldButtonField = dynSelect({
    label: t('tl.heldButton'),
    numeric: false,
    visible: frlgOnly,
    get: () => state.heldButton,
    set: (v) => set({ heldButton: v }, loadSeedList),
  });
  heldButtonField.setOptions(HELD_BUTTON_OPTIONS);

  const consoleField = dynSelect({
    label: t('tl.console'),
    numeric: false,
    get: gameConsole,
    set: (v) => set({ gameConsole: v }),
  });

  // ─── Campos: seed objetivo ───
  const seedDatalist = h('datalist', { id: 'tl-seed-list' });
  const seedInput = h('input', {
    type: 'text',
    list: 'tl-seed-list',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: t('tl.targetSeed.ph'),
    class: 'mono-input',
  });
  const seedHelp = h('span', { class: 'field-help' });
  seedInput.addEventListener('input', () => {
    const text = seedInput.value.trim().split(/\s/)[0];
    const value = /^[0-9a-f]{1,4}$/i.test(text) ? parseInt(text, 16) : NaN;
    if (!Number.isNaN(value) && seedList.some((s) => s.initialSeed === value)) {
      set({ targetInitialSeed: value });
    } else {
      seedInput.classList.add('invalid');
      seedHelp.textContent = t('tl.seedNotFound');
      seedHelp.classList.add('error');
    }
  });
  seedInput.addEventListener('blur', () => refresh());
  const seedField = h(
    'label',
    { class: 'field field-wide', title: t('tl.targetSeed.tip') },
    h('span', { class: 'field-label' }, t('tl.targetSeed')),
    seedInput,
    seedDatalist,
    seedHelp,
  );

  const leewayField = numberField({
    label: t('tl.leeway'),
    tooltip: t('tl.leeway.tip'),
    min: 0,
    max: 10000,
    get: () => state.seedLeeway,
    set: (v) => set({ seedLeeway: v }),
  });

  const seedsInRange = h('div', { class: 'tl-seed-range' });
  const seedsDetails = h(
    'details',
    { class: 'tl-seed-details field-wide' },
    h('summary', {}, t('tl.showSeeds')),
    seedsInRange,
  );

  // ─── Campos: avances ───
  const advMin = numberField({
    label: t('tl.advMin'),
    min: 0,
    max: UINT_MAX,
    get: () => state.advancesMin,
    set: (v) => set({ advancesMin: v }),
  });
  const advMax = numberField({
    label: t('tl.advMax'),
    min: 0,
    max: UINT_MAX,
    get: () => state.advancesMax,
    set: (v) => set({ advancesMax: v }),
  });
  const offsetField = numberField({
    label: t('tl.offset'),
    min: 0,
    max: UINT_MAX,
    get: () => state.offset,
    set: (v) => set({ offset: v }),
  });
  const ttvMin = numberField({
    label: t('tl.ttvMin'),
    min: 0,
    max: UINT_MAX,
    visible: isTeachyTV,
    get: () => state.ttvAdvancesMin,
    set: (v) => set({ ttvAdvancesMin: v }),
  });
  const ttvMax = numberField({
    label: t('tl.ttvMax'),
    min: 0,
    max: UINT_MAX,
    visible: isTeachyTV,
    get: () => state.ttvAdvancesMax,
    set: (v) => set({ ttvAdvancesMax: v }),
  });
  const overworldField = numberField({
    label: t('tl.overworld'),
    min: 0,
    max: UINT_MAX,
    visible: isSwitch,
    get: () => state.overworldFrames,
    set: (v) => set({ overworldFrames: v }),
  });
  const teachyCheck = checkboxField({
    label: t('tl.teachyTV'),
    get: () => isTeachyTV(),
    set: (v) => set({ teachyTVMode: v }),
  });

  // ─── Campos: entrenador ───
  const tidField = numberField({
    label: t('tl.tid'),
    min: 0,
    max: 65535,
    get: () => state.trainerID,
    set: (v) => set({ trainerID: v }),
  });
  const sidField = numberField({
    label: t('tl.sid'),
    min: 0,
    max: 65535,
    get: () => state.secretID,
    set: (v) => set({ secretID: v }),
  });

  // ─── Campos: encuentro ───
  const methodField = dynSelect({
    label: t('tl.method'),
    get: () => state.method,
    set: (v) => set({ method: v }),
  });
  methodField.setOptions(
    Object.entries(METHODS)
      .filter(([value]) => Number(value) !== STATIC_2)
      .map(([value, name]) => [value, name]),
  );

  const staticCategoryField = dynSelect({
    label: t('tl.category'),
    visible: isStatic,
    get: () => state.staticCategory,
    set: (v) => set({ staticCategory: v }, loadStaticTemplates),
  });
  const staticPokemonField = dynSelect({
    label: t('tl.pokemon'),
    visible: isStatic,
    get: () => state.staticPokemon,
    set: (v) => set({ staticPokemon: v }, runIvCalculator),
  });

  const wildCategoryField = dynSelect({
    label: t('tl.category'),
    visible: () => !isStatic(),
    get: () => state.wildCategory,
    set: (v) => set({ wildCategory: v }, loadWildLocations),
  });
  wildCategoryField.setOptions(WILD_CATEGORIES);
  const wildLocationField = dynSelect({
    label: t('tl.location'),
    visible: () => !isStatic(),
    get: () => state.wildLocation,
    set: (v) => set({ wildLocation: v }, loadAreaSpecies),
  });
  const wildPokemonField = dynSelect({
    label: t('tl.pokemon'),
    visible: () => !isStatic(),
    get: () => state.wildPokemon,
    set: (v) => set({ wildPokemon: v }, runIvCalculator),
  });
  const filterPokemonCheck = checkboxField({
    label: t('tl.filterPokemon'),
    get: () => state.shouldFilterPokemon,
    set: (v) => set({ shouldFilterPokemon: v }),
  });
  const wildLeadField = dynSelect({
    label: t('tl.lead'),
    visible: () => !isStatic() && (gameFlag() & Game.Emerald) === Game.Emerald,
    get: () => state.wildLead,
    set: (v) => set({ wildLead: v }),
  });

  // ─── Campos: filtros ───
  const shininessField = dynSelect({
    label: t('tl.shiny'),
    get: () => state.shininess,
    set: (v) => set({ shininess: v }),
  });
  shininessField.setOptions([
    [255, t('any')],
    [1, t('shiny.star')],
    [2, t('shiny.square')],
    [3, t('shiny.starSquare')],
  ]);
  const natureField = dynSelect({
    label: t('tl.nature'),
    tooltip: t('tl.nature.tip'),
    get: () => state.nature,
    set: (v) => set({ nature: v }, runIvCalculator),
  });
  const genderField = dynSelect({
    label: t('tl.gender'),
    get: () => state.gender,
    set: (v) => set({ gender: v }),
  });
  genderField.setOptions([
    [255, t('any')],
    [0, GENDERS[0]],
    [1, GENDERS[1]],
  ]);

  // Calculadora de IVs: una línea por nivel → "nivel HP Atk Def SpA SpD Spe"
  const ivCalcInput = h('textarea', {
    rows: 3,
    spellcheck: 'false',
    placeholder: t('tl.ivCalc.ph'),
    class: 'mono-input',
  });
  const ivCalcHelp = h('span', { class: 'field-help' });
  const ivCalcField = h(
    'label',
    { class: 'field field-wide' },
    h('span', { class: 'field-label' }, t('tl.ivCalc')),
    ivCalcInput,
    ivCalcHelp,
  );
  ivCalcInput.addEventListener('input', () => {
    state.ivCalculatorText = ivCalcInput.value;
    save();
    runIvCalculator();
  });

  const ivRangeFields = IV_NAMES.map((name, i) => {
    const min = numberField({
      label: t('tl.ivMin', { s: name }),
      min: 0,
      max: 31,
      get: () => state.ivRanges[i][0],
      set: (v) => {
        state.ivRanges[i][0] = v;
        save();
      },
    });
    const max = numberField({
      label: t('tl.ivMax', { s: name }),
      min: 0,
      max: 31,
      get: () => state.ivRanges[i][1],
      set: (v) => {
        state.ivRanges[i][1] = v;
        save();
      },
    });
    const reset = h(
      'button',
      {
        type: 'button',
        class: 'btn btn-icon btn-ghost',
        title: t('tl.ivReset'),
        onclick: () => {
          state.ivRanges[i] = [0, 31];
          save();
          refresh();
        },
      },
      '↻',
    );
    const el = h('div', { class: 'tl-iv-row' }, min.el, max.el, reset);
    return { el, min, max };
  });
  const ivBlock = h('div', { class: 'tl-ivs field-wide' }, ivCalcField, ...ivRangeFields.map((f) => f.el));
  const ivDisabledMsg = h(
    'p',
    { class: 'hint field-wide' },
    t('tl.ivDisabled'),
  );

  // ─── Buscar y resultados ───
  const errorBox = h('p', { class: 'tl-error' });
  const submitBtn = h('button', { type: 'submit', class: 'btn btn-primary btn-block tl-submit' }, 'Buscar');
  const status = h('span', { class: 'tl-status' });

  const resultsHead = h('thead');
  const resultsBody = h('tbody');
  const resultsCount = h('span', { class: 'muted' });
  const resultsEmpty = h('p', { class: 'empty' }, t('tl.resultsIdle'));
  // Aviso destacado: dentro de HunterSpace, que cada fila se puede usar para configurar el timer
  const resultsHint = h(
    'p',
    { class: `tl-hint${embedded ? ' tl-hint-action' : ''}`, hidden: true, role: 'note' },
    pointerIcon(),
    h('span', {}, embedded ? t('tl.clickRow') : t('tl.standalone')),
  );
  let selectedRow = null;
  const sortSelect = h(
    'select',
    {
      class: 'scope',
      'aria-label': t('tl.sort'),
      onchange: () => {
        state.sort = sortSelect.value;
        save();
        renderResults();
      },
    },
    ...[
      ['none', 'tl.sort.none'],
      ['seed-asc', 'tl.sort.seedAsc'],
      ['seed-desc', 'tl.sort.seedDesc'],
      ['frames-asc', 'tl.sort.framesAsc'],
      ['frames-desc', 'tl.sort.framesDesc'],
    ].map(([value, key]) => h('option', { value }, t(key))),
  );
  sortSelect.value = state.sort in SORTERS ? state.sort : 'none';
  const sortPicker = searchSelect(sortSelect, { labelId: 'tl-sort-label' });
  const sortField = h('div', { class: 'tl-sort' }, h('span', { id: 'tl-sort-label' }, t('tl.sort')), sortPicker.el);
  const resultsCard = h(
    'section',
    { class: 'card tl-results' },
    h(
      'div',
      { class: 'tl-results-head' },
      h('h2', {}, t('tl.results')),
      sortField,
      resultsCount,
    ),
    resultsHint,
    h('div', { class: 'tl-table-wrap' }, h('table', { class: 'tl-table' }, resultsHead, resultsBody)),
    resultsEmpty,
  );

  const allFields = [
    gameField,
    soundField,
    buttonModeField,
    buttonField,
    heldButtonField,
    consoleField,
    leewayField,
    advMin,
    advMax,
    offsetField,
    ttvMin,
    ttvMax,
    overworldField,
    teachyCheck,
    tidField,
    sidField,
    methodField,
    staticCategoryField,
    staticPokemonField,
    wildCategoryField,
    wildLocationField,
    wildPokemonField,
    filterPokemonCheck,
    wildLeadField,
    shininessField,
    natureField,
    genderField,
    ...ivRangeFields.flatMap((f) => [f.min, f.max]),
  ];

  const form = h(
    'form',
    { class: 'card tl-form', novalidate: true },
    section(
      t('tl.sec.game'),
      gameField.el,
      consoleField.el,
      soundField.el,
      buttonModeField.el,
      buttonField.el,
      heldButtonField.el,
    ),
    section(t('tl.sec.target'), seedField, leewayField.el, seedsDetails),
    section(
      t('tl.sec.advances'),
      advMin.el,
      advMax.el,
      offsetField.el,
      overworldField.el,
      ttvMin.el,
      ttvMax.el,
      teachyCheck.el,
    ),
    section(t('tl.sec.trainer'), tidField.el, sidField.el),
    section(
      t('tl.sec.encounter'),
      methodField.el,
      staticCategoryField.el,
      staticPokemonField.el,
      wildCategoryField.el,
      wildLocationField.el,
      wildPokemonField.el,
      wildLeadField.el,
      filterPokemonCheck.el,
    ),
    section(t('tl.sec.filters'), shininessField.el, natureField.el, genderField.el, ivBlock, ivDisabledMsg),
    errorBox,
    submitBtn,
    status,
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search();
  });

  root.replaceChildren(form, resultsCard);

  // ─── Validación ───
  function validationError() {
    if (seedList.length === 0) return t('tl.err.noSeeds');
    if (targetIndex() === -1) return t('tl.err.target');
    if (state.advancesMin > state.advancesMax) return t('tl.err.adv');
    if (isTeachyTV() && state.ttvAdvancesMin > state.ttvAdvancesMax)
      return t('tl.err.ttv');
    if (state.nature !== -1) {
      if (ivCalcError) return ivCalcError;
      const bad = state.ivRanges.findIndex(([a, b]) => a > b);
      if (bad !== -1) return t('tl.err.ivRange', { s: IV_NAMES_LONG[bad] });
    }
    return '';
  }

  // ─── Pintar ───
  function refresh() {
    allFields.forEach((f) => f.refresh(false));

    // Consolas según el juego
    const consoles = consoleOptions(isSwitch());
    if (consoleField.input.options.length !== consoles.length || consoleField.input.options[0]?.value !== consoles[0][0]) {
      consoleField.setOptions(consoles);
    }
    consoleField.refresh();

    // Categorías estáticas disponibles según el juego
    staticCategoryField.setOptions(
      STATIC_CATEGORIES.filter(([v]) => (v !== 3 || isFRLG()) && (v !== 6 || isFRLGE()) && (v !== 8 || !isFRLG())),
    );
    staticCategoryField.refresh();

    teachyCheck.el.hidden = !(isFRLG() && !isSwitch());
    filterPokemonCheck.el.hidden = isStatic();
    advMin.el.querySelector('.field-label').textContent = isTeachyTV() ? t('tl.aPressMin') : t('tl.advMin');
    advMax.el.querySelector('.field-label').textContent = isTeachyTV() ? t('tl.aPressMax') : t('tl.advMax');

    // Seed objetivo
    const idx = targetIndex();
    if (document.activeElement !== seedInput) seedInput.value = idx === -1 ? '' : hexSeed(state.targetInitialSeed, 16);
    seedInput.classList.toggle('invalid', idx === -1 && seedList.length > 0);
    seedHelp.classList.toggle('error', seedList.length === 0 || idx === -1);
    if (seedList.length === 0) seedHelp.textContent = t('tl.noSeeds');
    else if (idx === -1) seedHelp.textContent = t('tl.pickSeed');
    else
      seedHelp.textContent = t('tl.seedInfo', {
        ms: frameToMS(seedList[idx].seedTime / 16, gameConsole()),
        i: idx + 1,
        n: seedList.length,
      });

    if (seedsDetails.open) renderSeedsInRange();

    // IVs
    const ivOn = state.nature !== -1;
    ivBlock.hidden = !ivOn;
    ivDisabledMsg.hidden = ivOn;
    if (document.activeElement !== ivCalcInput) ivCalcInput.value = state.ivCalculatorText;
    ivCalcHelp.textContent = ivCalcError;
    ivCalcHelp.classList.toggle('error', !!ivCalcError);
    ivCalcInput.classList.toggle('invalid', !!ivCalcError);

    const err = validationError();
    errorBox.textContent = err;
    errorBox.hidden = !err;
    submitBtn.disabled = searching || !!err;
    submitBtn.textContent = searching ? t('tl.searching') : t('tl.search');
  }

  function renderSeedsInRange() {
    const idx = targetIndex();
    if (idx === -1) {
      seedsInRange.replaceChildren();
      return;
    }
    const from = Math.max(0, idx - state.seedLeeway);
    const to = Math.min(seedList.length, idx + state.seedLeeway + 1);
    seedsInRange.replaceChildren(
      ...seedList.slice(from, to).map((s) =>
        h(
          'span',
          { class: s.initialSeed === state.targetInitialSeed ? 'target' : '' },
          hexSeed(s.initialSeed, 16),
        ),
      ),
    );
  }
  seedsDetails.addEventListener('toggle', renderSeedsInRange);

  // ─── Carga de datos del motor ───
  let seedLoadId = 0;
  async function loadSeedList() {
    if (!res) return;
    const id = ++seedLoadId;
    let list;
    if (!isFRLG()) {
      list = Array.from({ length: 0x10000 }, (_, seed) => ({ initialSeed: seed, seedTime: seed * 16 }));
    } else {
      status.textContent = t('tl.loadingSeeds');
      const [data, engine] = await Promise.all([fetchSeedData(state.game), getEngine()]);
      list = await engine.get_contiguous_seed_list(
        data,
        `${state.sound}_${state.buttonMode}_${state.button}`,
        state.game,
        state.heldButton,
      );
      status.textContent = '';
    }
    if (id !== seedLoadId) return; // llegó una carga más reciente
    seedList = list;
    // Opciones del buscador (en painting son 65536: solo se valida el hex)
    seedDatalist.replaceChildren(
      ...(isFRLG()
        ? seedList.map((s) =>
            h('option', { value: hexSeed(s.initialSeed, 16) }, `${frameToMS(s.seedTime / 16, gameConsole())} ms`),
          )
        : []),
    );
    if (targetIndex() === -1) {
      state.targetInitialSeed = seedList.length > 0 ? seedList[Math.min(51, seedList.length - 1)].initialSeed : 0xdead;
      save();
    }
    refresh();
  }

  function fixStaticCategory() {
    if ((state.staticCategory === 3 && !isFRLG()) || (state.staticCategory === 6 && !isFRLGE()) || (state.staticCategory === 8 && isFRLG())) {
      state.staticCategory = 0;
    }
  }

  async function loadStaticTemplates() {
    if (!res) return;
    const engine = await getEngine();
    const game = gameFlag();
    const templates = (await engine.get_static_template_info(state.staticCategory)).filter((t) => t.version & game);
    staticTemplates = templates;
    staticPokemonField.setOptions(
      templates.map((tpl) => [
        tpl.index,
        `${res.getName(tpl.species, tpl.form)}${tpl.shiny == 1 ? t('lock.shiny') : tpl.species == 251 ? t('lock.break') : ''} - ${gameName(tpl.version)}`,
      ]),
    );
    if (!templates.some((t) => t.index === state.staticPokemon)) {
      state.staticPokemon = templates.length > 0 ? templates[0].index : 0;
      save();
    }
    refresh();
  }

  async function loadWildLocations() {
    if (!res) return;
    const engine = await getEngine();
    const game = gameFlag();
    wildLocations = Array.from(await engine.get_wild_locations(game, state.wildCategory));
    wildLocationField.setOptions(wildLocations.map((loc, i) => [i, res.getLocation(game, loc) || `#${loc}`]));
    if (state.wildLocation >= wildLocations.length) {
      state.wildLocation = 0;
      save();
    }
    wildLeadField.setOptions([
      [255, t('none')],
      [25, t('lead.cuteF')],
      [26, t('lead.cuteM')],
      [27, t('lead.magnet')],
      [28, t('lead.static')],
      [32, t('lead.hustle')],
      ...res.NATURES.map((n, i) => [i, t('lead.sync', { n })]),
    ]);
    await loadAreaSpecies();
  }

  async function loadAreaSpecies() {
    if (!res) return;
    const engine = await getEngine();
    areaSpecies = Array.from(await engine.get_area_species(gameFlag(), state.wildCategory, state.wildLocation));
    wildPokemonField.setOptions(areaSpecies.map((sf) => [sf, res.getName(sf & 0x7ff, sf >> 11)]));
    if (!areaSpecies.includes(state.wildPokemon)) {
      state.wildPokemon = areaSpecies.length > 0 ? areaSpecies[0] : 0;
      save();
    }
    refresh();
  }

  // ─── Calculadora de IVs ───
  function parseIvLines(text) {
    const limits = [
      [t('tl.level'), 1, 100],
      [IV_NAMES_LONG[0], 1, 651],
      [IV_NAMES_LONG[1], 1, 437],
      [IV_NAMES_LONG[2], 1, 545],
      [IV_NAMES_LONG[3], 1, 435],
      [IV_NAMES_LONG[4], 1, 545],
      [IV_NAMES_LONG[5], 1, 479],
    ];
    const lines = text.split('\n');
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      const entries = lines[i].split(' ').filter((s) => s !== '');
      for (let j = 0; j < limits.length; j++) {
        const [name, min, max] = limits[j];
        if (entries.length <= j) return { error: t('tl.ivLineMissing', { l: i + 1, f: name }) };
        const v = parseInt(entries[j], 10);
        if (!(v >= min && v <= max)) return { error: t('tl.ivLineInvalid', { l: i + 1, f: name }) };
      }
      parsed.push(entries.map((e) => parseInt(e, 10)));
    }
    return { parsed };
  }

  let ivCalcId = 0;
  async function runIvCalculator() {
    if (!res) return;
    const id = ++ivCalcId;
    const text = state.ivCalculatorText;
    if (text.trim() === '') {
      ivCalcError = '';
      refresh();
      return;
    }
    const { error, parsed } = parseIvLines(text);
    if (error) {
      ivCalcError = error;
      refresh();
      return;
    }
    const engine = await getEngine();
    const ranges = isStatic()
      ? await engine.calc_ivs_static(state.staticCategory, state.staticPokemon, parsed, state.nature)
      : await engine.calc_ivs_generic(state.wildPokemon & 0x7ff, state.wildPokemon >> 11, parsed, state.nature);
    if (id !== ivCalcId) return;
    const impossible = ranges.findIndex((r) => r.min === 32);
    if (impossible !== -1) {
      ivCalcError = t('tl.ivImpossible', { s: IV_NAMES_LONG[impossible] });
    } else {
      ivCalcError = '';
      state.ivRanges = ranges.map((r) => [r.min, r.max]);
      save();
    }
    refresh();
  }

  // ─── Búsqueda ───
  async function search() {
    if (searching || validationError()) return;
    const idx = targetIndex();
    const searchSeeds = seedList.slice(Math.max(0, idx - state.seedLeeway), Math.min(seedList.length, idx + state.seedLeeway + 1));
    const advancesRange = [state.advancesMin, state.advancesMax];
    const ttvRange = isTeachyTV() ? [state.ttvAdvancesMin, state.ttvAdvancesMax] : [0, 0];
    const ivRanges = effectiveIvRanges();
    const id = ++searchId;

    snapshot = {
      target: seedList[idx],
      gameConsole: gameConsole(),
      isStatic: isStatic(),
      isMultiMethod: state.method === COMBINED_WILD_METHOD,
      isTeachyTV: isTeachyTV(),
      isSwitch: isSwitch(),
      overworldFrames: overworldFrames(),
      gameLabel: GAME_OPTIONS.find(([id]) => id === state.game)?.[1] ?? state.game,
      consoleLabel: consoleField.input.selectedOptions[0]?.textContent ?? gameConsole(),
      methodLabel: METHODS[state.method],
      staticPokemonLabel: isStatic() ? staticPokemonField.input.selectedOptions[0]?.textContent ?? '' : '',
    };
    rows = [];
    selectedRow = null;
    renderResults();
    searching = true;
    refresh();

    const engine = await getEngine();
    const onResults = proxy((results) => {
      if (id !== searchId || rows.length > MAX_ROWS || results.length === 0) return;
      rows.push(...results);
      scheduleRender();
    });
    const onSearching = proxy((value) => {
      if (id !== searchId) return;
      searching = value;
      if (!value) scheduleRender();
      refresh();
    });

    if (snapshot.isStatic) {
      await engine.check_seeds_static(
        searchSeeds,
        advancesRange,
        ttvRange,
        state.offset,
        gameFlag(),
        state.trainerID,
        state.secretID,
        state.staticCategory,
        state.staticPokemon,
        state.method,
        state.shininess,
        state.nature,
        state.gender,
        ivRanges,
        onResults,
        onSearching,
      );
    } else {
      await engine.check_seeds_wild(
        searchSeeds,
        advancesRange,
        ttvRange,
        state.offset,
        gameFlag(),
        state.trainerID,
        state.secretID,
        state.wildCategory,
        state.wildLocation,
        state.shouldFilterPokemon ? state.wildPokemon : -1,
        state.method,
        state.wildLead,
        state.shininess,
        state.nature,
        state.gender,
        ivRanges,
        onResults,
        onSearching,
      );
    }
  }

  let renderPending = false;
  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    // setTimeout y no requestAnimationFrame: este se pausa con la pestaña en segundo plano
    setTimeout(() => {
      renderPending = false;
      renderResults();
    }, 50);
  }

  function renderResults() {
    const s = snapshot;
    resultsEmpty.hidden = rows.length > 0 || searching;
    if (!s) {
      resultsCount.textContent = '';
      return;
    }
    if (!searching && rows.length === 0) {
      resultsEmpty.hidden = false;
      resultsEmpty.textContent = t('tl.noResults');
    }
    resultsCount.textContent = rows.length > MAX_ROWS ? t('tl.resultsMany', { n: MAX_ROWS }) : t('tl.resultsCount', { n: rows.length });

    const cols = [
      t('col.seed'),
      t('col.advances'),
      s.isMultiMethod && t('col.method'),
      s.isTeachyTV && t('col.aPress'),
      s.isTeachyTV && t('col.ttv'),
      s.isSwitch && t('col.continue'),
      !s.isStatic && t('col.slot'),
      !s.isStatic && t('col.level'),
      t('col.pid'),
      t('col.shiny'),
      t('col.nature'),
      t('col.ability'),
      t('col.ivs'),
      t('col.hp'),
      t('col.power'),
      t('col.gender'),
    ].filter(Boolean);
    resultsHead.replaceChildren(
      h(
        'tr',
        {},
        // Columna del botón "Timer" (solo dentro de HunterSpace)
        embedded ? h('th', { class: 'tl-use-cell', 'aria-label': t('tl.clickRow.title') }) : null,
        ...cols.map((c) => h('th', {}, c)),
      ),
    );

    const targetMS = frameToMS(s.target.seedTime / 16, s.gameConsole);
    const sorter = SORTERS[state.sort];
    const visible = rows.slice(0, MAX_ROWS);
    if (sorter) visible.sort((a, b) => sorter(a, b, s));
    const body = visible.map((row) => {
      const seedMS = frameToMS(row.seedTime / 16, s.gameConsole);
      const diff = seedMS - targetMS;
      const cells = [
        h(
          'td',
          { class: row.initialSeed === s.target.initialSeed ? 'tl-target' : '' },
          h('span', { class: 'mono' }, `${hexSeed(row.initialSeed, 16)} | `),
          copyable(seedMS),
          ' ms ',
          h('span', { class: 'muted' }, `(${diff >= 0 ? '+' : ''}${diff} ms)`),
        ),
        h('td', {}, row.advances),
        s.isMultiMethod && h('td', {}, METHODS[row.method]),
        s.isTeachyTV && h('td', {}, row.advances - row.ttvAdvances * 313 + row.ttvAdvances),
        s.isTeachyTV && h('td', {}, row.ttvAdvances),
        s.isSwitch && h('td', {}, copyable(continueFrames(row, s))),
        !s.isStatic && h('td', {}, `${row.encounterSlot}: ${res.getName(row.species, row.form)}`),
        !s.isStatic && h('td', {}, row.level),
        h('td', { class: 'mono' }, hexSeed(row.pid, 32)),
        h('td', { class: row.shiny ? 'tl-shiny' : '' }, SHININESS[row.shiny]),
        h('td', {}, res.NATURES[row.nature]),
        h('td', {}, `${row.ability}: ${res.ABILITIES[row.abilityIndex - 1]}`),
        h('td', { class: 'mono' }, row.ivs.join('/')),
        h('td', {}, res.TYPES[row.hiddenPower]),
        h('td', {}, row.hiddenPowerStrength),
        h('td', {}, GENDERS[row.gender]),
      ].filter(Boolean);
      const tr = h('tr', { class: row === selectedRow ? 'tl-selected' : '' }, ...cells);
      if (embedded) {
        tr.prepend(
          h(
            'td',
            { class: 'tl-use-cell' },
            h(
              'button',
              {
                type: 'button',
                class: 'tl-use-btn',
                title: t('tl.clickRow.title'),
                'aria-label': `${t('tl.clickRow.title')}: ${hexSeed(row.initialSeed, 16)}`,
                onclick: () => sendToTimer(row, seedMS, tr),
              },
              timerIcon(),
              h('span', {}, t('tl.useBtn')),
            ),
          ),
        );
      }
      return tr;
    });
    if (rows.length > MAX_ROWS) {
      body.push(h('tr', {}, h('td', { colspan: cols.length + (embedded ? 1 : 0), class: 'muted' }, '…')));
    }
    resultsBody.replaceChildren(...body);
    resultsHint.hidden = rows.length === 0;
  }

  /** Configura el timer Custom: fase 1 = ms de la seed, fase 2 = frames en la pantalla Continue. */
  /** Registro completo de una fila, con etiquetas ya traducidas, para la tarjeta "Seed objetivo". */
  function describeRow(row, seedMS, s) {
    const targetMS = frameToMS(s.target.seedTime / 16, s.gameConsole);
    const diff = seedMS - targetMS;
    const field = (key, label, value, extra = {}) => ({ key, label, value: String(value), ...extra });
    return {
      subtitle: [s.gameLabel, s.consoleLabel, s.isStatic ? s.staticPokemonLabel : null].filter(Boolean).join(' · '),
      fields: [
        field('seed', t('col.seed'), `${hexSeed(row.initialSeed, 16)} | ${seedMS} ms (${diff >= 0 ? '+' : ''}${diff} ms)`, { mono: true, wide: true }),
        field('advances', t('col.advances'), row.advances),
        field('continue', t('col.continue'), continueFrames(row, s)),
        field('method', t('col.method'), s.isMultiMethod ? METHODS[row.method] : s.methodLabel),
        s.isTeachyTV && field('aPress', t('col.aPress'), row.advances - row.ttvAdvances * 313 + row.ttvAdvances),
        s.isTeachyTV && field('ttv', t('col.ttv'), row.ttvAdvances),
        !s.isStatic && field('slot', t('col.slot'), `${row.encounterSlot}: ${res.getName(row.species, row.form)}`),
        !s.isStatic && field('level', t('col.level'), row.level),
        field('pid', t('col.pid'), hexSeed(row.pid, 32), { mono: true }),
        field('shiny', t('col.shiny'), SHININESS[row.shiny], { highlight: row.shiny > 0 }),
        field('nature', t('col.nature'), res.NATURES[row.nature]),
        field('ability', t('col.ability'), `${row.ability}: ${res.ABILITIES[row.abilityIndex - 1]}`),
        field('ivs', t('col.ivs'), row.ivs.join('/'), { mono: true }),
        field('hiddenPower', t('col.hp'), `${res.TYPES[row.hiddenPower]} ${row.hiddenPowerStrength}`),
        field('gender', t('col.gender'), GENDERS[row.gender]),
      ].filter(Boolean),
    };
  }

  async function sendToTimer(row, seedMS, tr) {
    const s = snapshot;
    const frames = continueFrames(row, s);
    const detail = {
      phases: [
        { unit: 'ms', target: Math.max(0, seedMS) },
        { unit: 'Advances', target: Math.max(0, frames) },
      ],
      console: TIMER_CONSOLE[s.gameConsole] ?? 'GBA',
      target: describeRow(row, seedMS, s),
    };
    const result = await request('set-timer', detail);

    // El aviso lo muestra la página contenedora, con el mismo estilo que el resto de sus avisos
    // (con el botón "Ir al timer" si se configuró)
    if (!result.ok) {
      send('notice', { ok: false, text: result.message || t('tl.hostError') });
      return;
    }
    selectedRow = row;
    resultsBody.querySelector('.tl-selected')?.classList.remove('tl-selected');
    tr.classList.add('tl-selected');
    send('notice', { ok: true, text: t('tl.timerSet', { ms: detail.phases[0].target, f: detail.phases[1].target }), action: 'timer' });
  }

  // ─── Inicio ───
  async function init() {
    status.textContent = t('tl.loadingEngine');
    submitBtn.disabled = true;
    try {
      [res] = await Promise.all([getResources(), getEngine()]);
    } catch (err) {
      status.textContent = t('tl.error', { e: err.message });
      return;
    }
    natureField.setOptions([[-1, t('any')], ...res.NATURES.map((n, i) => [i, n])]);
    fixStaticCategory();
    status.textContent = '';
    await Promise.all([loadSeedList(), loadStaticTemplates(), loadWildLocations()]);
    if (state.ivCalculatorText) runIvCalculator();
    refresh();
  }

  refresh();
  init();

  return {
    /**
     * Abre una seed que viene de la pestaña Initial Seed: seed objetivo, rango de avances y, en FRLG,
     * los ajustes de sonido y botones con los que se consigue (como "Open In Calibration" de Ten Lines).
     */
    open(patch) {
      set(patch, () => {
        fixStaticCategory();
        loadSeedList();
        loadStaticTemplates();
        loadWildLocations();
      });
    },
  };
}
