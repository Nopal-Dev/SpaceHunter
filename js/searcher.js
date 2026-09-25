// Pestaña "Searcher" de Ten Lines, reescrita para Easy Lines: busca las seeds (del RNG, 32 bits) que
// generan un Pokémon con los filtros elegidos (shiny, naturaleza, género, poder oculto, IVs).
// Cada resultado se puede abrir en la pestaña Initial Seed para saber cómo llegar a esa seed.
// Portado de Ten Lines de Lincoln-LM (GPL-3.0) — https://github.com/Lincoln-LM/ten-lines
import { proxy } from './vendor/comlink.mjs';
import { h, numberField } from './dom.js';
import { t } from './i18n.js';
import { dynSelect, section, revealResults, GAME_OPTIONS, STATIC_CATEGORIES, WILD_CATEGORIES, MAX_ROWS, IV_NAMES } from './shared.js';
import {
  getEngine,
  getResources,
  hexSeed,
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

const STORAGE_KEY = 'easy-lines-searcher';
const IV_NAMES_LONG = ['stat.hp', 'stat.atk', 'stat.def', 'stat.spa', 'stat.spd', 'stat.spe'].map((k) => t(k));

const DEFAULTS = {
  game: 'r_painting',
  trainerID: 0,
  secretID: 0,
  method: 1,
  staticCategory: 0,
  staticPokemon: 0,
  wildCategory: 0,
  wildLocation: 0,
  wildPokemon: -1, // -1 = cualquiera
  wildLead: 255,
  shininess: 255,
  nature: -1,
  gender: 255,
  hiddenPower: -1,
  ivRanges: [
    [0, 31],
    [0, 31],
    [0, 31],
    [0, 31],
    [0, 31],
    [0, 31],
  ],
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { ...structuredClone(DEFAULTS), ...saved };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

/**
 * Crea la pestaña en `root`. `onOpenInitialSeed(seedHex32)` abre una seed en la pestaña Initial Seed.
 */
export function createSearcher(root, { onOpenInitialSeed }) {
  const state = loadState();
  let res = null;
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

  const isStatic = () => state.method <= STATIC_4;
  const isFRLG = () => state.game.startsWith('fr') || state.game.startsWith('lg');
  const isFRLGE = () => isFRLG() || state.game.startsWith('e_');
  const gameFlag = () => SEED_IDENTIFIER_TO_GAME[state.game];

  const set = (patch, after) => {
    Object.assign(state, patch);
    save();
    after?.();
    refresh();
  };

  // ─── Campos ───
  const gameField = dynSelect({
    label: t('tl.game'),
    numeric: false,
    get: () => state.game,
    set: (v) =>
      set({ game: v }, () => {
        fixStaticCategory();
        loadStaticTemplates();
        loadWildLocations();
      }),
  });
  gameField.setOptions(GAME_OPTIONS);

  const tidField = numberField({ label: t('tl.tid'), min: 0, max: 65535, get: () => state.trainerID, set: (v) => set({ trainerID: v }) });
  const sidField = numberField({ label: t('tl.sid'), min: 0, max: 65535, get: () => state.secretID, set: (v) => set({ secretID: v }) });

  const methodField = dynSelect({ label: t('tl.method'), get: () => state.method, set: (v) => set({ method: v }) });
  methodField.setOptions(Object.entries(METHODS).filter(([value]) => Number(value) !== STATIC_2));

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
    set: (v) => set({ staticPokemon: v }),
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
    set: (v) => set({ wildPokemon: v }),
  });
  const wildLeadField = dynSelect({
    label: t('tl.lead'),
    visible: () => !isStatic() && (gameFlag() & Game.Emerald) === Game.Emerald,
    get: () => state.wildLead,
    set: (v) => set({ wildLead: v }),
  });

  const shininessField = dynSelect({ label: t('tl.shiny'), get: () => state.shininess, set: (v) => set({ shininess: v }) });
  shininessField.setOptions([
    [255, t('any')],
    [1, t('shiny.star')],
    [2, t('shiny.square')],
    [3, t('shiny.starSquare')],
  ]);
  const natureField = dynSelect({ label: t('tl.nature'), get: () => state.nature, set: (v) => set({ nature: v }) });
  const genderField = dynSelect({ label: t('tl.gender'), get: () => state.gender, set: (v) => set({ gender: v }) });
  genderField.setOptions([
    [255, t('any')],
    [0, GENDERS[0]],
    [1, GENDERS[1]],
  ]);
  const hiddenPowerField = dynSelect({ label: t('col.hp'), get: () => state.hiddenPower, set: (v) => set({ hiddenPower: v }) });

  const ivRangeFields = IV_NAMES.map((name, i) => {
    const min = numberField({
      label: t('tl.ivMin', { s: name }),
      min: 0,
      max: 31,
      get: () => state.ivRanges[i][0],
      set: (v) => {
        state.ivRanges[i][0] = v;
        save();
        refresh();
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
        refresh();
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
    return { el: h('div', { class: 'tl-iv-row' }, min.el, max.el, reset), min, max };
  });
  const ivBlock = h('div', { class: 'tl-ivs field-wide' }, ...ivRangeFields.map((f) => f.el), h('p', { class: 'hint' }, t('sr.ivHint')));

  // ─── Buscar y resultados ───
  const errorBox = h('p', { class: 'tl-error' });
  const submitBtn = h('button', { type: 'submit', class: 'btn btn-primary btn-block tl-submit' }, t('tl.search'));
  const status = h('span', { class: 'tl-status' });
  const resultsHead = h('thead');
  const resultsBody = h('tbody');
  const resultsCount = h('span', { class: 'muted' });
  const resultsEmpty = h('p', { class: 'empty' }, t('tl.resultsIdle'));
  const resultsHint = h('p', { class: 'tl-hint', hidden: true, role: 'note' }, h('span', {}, t('sr.hint')));
  const resultsCard = h(
    'section',
    { class: 'card tl-results' },
    h('div', { class: 'tl-results-head' }, h('h2', {}, t('tl.results')), resultsCount),
    resultsHint,
    h('div', { class: 'tl-table-wrap' }, h('table', { class: 'tl-table' }, resultsHead, resultsBody)),
    resultsEmpty,
  );

  const allFields = [
    gameField,
    tidField,
    sidField,
    methodField,
    staticCategoryField,
    staticPokemonField,
    wildCategoryField,
    wildLocationField,
    wildPokemonField,
    wildLeadField,
    shininessField,
    natureField,
    genderField,
    hiddenPowerField,
    ...ivRangeFields.flatMap((f) => [f.min, f.max]),
  ];

  const form = h(
    'form',
    { class: 'card tl-form', novalidate: true },
    h('p', { class: 'hint tl-intro' }, t('sr.intro')),
    section(t('tl.sec.game'), gameField.el),
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
    ),
    section(t('tl.sec.filters'), shininessField.el, natureField.el, genderField.el, hiddenPowerField.el, ivBlock),
    errorBox,
    submitBtn,
    status,
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search();
  });
  root.replaceChildren(form, resultsCard);

  function validationError() {
    if (!res) return '';
    const bad = state.ivRanges.findIndex(([a, b]) => a > b);
    if (bad !== -1) return t('tl.err.ivRange', { s: IV_NAMES_LONG[bad] });
    return '';
  }

  function refresh() {
    allFields.forEach((f) => f.refresh(false));
    staticCategoryField.setOptions(
      STATIC_CATEGORIES.filter(([v]) => (v !== 3 || isFRLG()) && (v !== 6 || isFRLGE()) && (v !== 8 || !isFRLG())),
    );
    staticCategoryField.refresh();
    const err = validationError();
    errorBox.textContent = err;
    errorBox.hidden = !err;
    submitBtn.disabled = !res || searching || !!err;
    submitBtn.textContent = searching ? t('tl.searching') : t('tl.search');
  }

  // ─── Datos del motor ───
  function fixStaticCategory() {
    if ((state.staticCategory === 3 && !isFRLG()) || (state.staticCategory === 6 && !isFRLGE()) || (state.staticCategory === 8 && isFRLG())) {
      state.staticCategory = 0;
    }
  }

  async function loadStaticTemplates() {
    if (!res) return;
    const engine = await getEngine();
    const game = gameFlag();
    const templates = (await engine.get_static_template_info(state.staticCategory)).filter((tpl) => tpl.version & game);
    staticPokemonField.setOptions(
      templates.map((tpl) => [
        tpl.index,
        `${res.getName(tpl.species, tpl.form)}${tpl.shiny == 1 ? t('lock.shiny') : tpl.species == 251 ? t('lock.break') : ''} - ${gameName(tpl.version)}`,
      ]),
    );
    if (!templates.some((tpl) => tpl.index === state.staticPokemon)) {
      state.staticPokemon = templates.length > 0 ? templates[0].index : 0;
      save();
    }
    refresh();
  }

  async function loadWildLocations() {
    if (!res) return;
    const engine = await getEngine();
    const game = gameFlag();
    const locations = Array.from(await engine.get_wild_locations(game, state.wildCategory));
    wildLocationField.setOptions(locations.map((loc, i) => [i, res.getLocation(game, loc) || `#${loc}`]));
    if (state.wildLocation >= locations.length) {
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
    const species = Array.from(await engine.get_area_species(gameFlag(), state.wildCategory, state.wildLocation));
    // Como en Ten Lines, en el Searcher también se puede buscar cualquier Pokémon del lugar
    wildPokemonField.setOptions([[-1, t('any')], ...species.map((sf) => [sf, res.getName(sf & 0x7ff, sf >> 11)])]);
    if (state.wildPokemon !== -1 && !species.includes(state.wildPokemon)) {
      state.wildPokemon = -1;
      save();
    }
    refresh();
  }

  // ─── Búsqueda ───
  async function search() {
    if (!res || searching || validationError()) return;
    const id = ++searchId;
    snapshot = { isStatic: isStatic(), isMultiMethod: state.method === COMBINED_WILD_METHOD };
    rows = [];
    renderResults();
    searching = true;
    status.textContent = t('sr.searching');
    refresh();
    revealResults(resultsCard);

    const engine = await getEngine();
    const onResults = proxy((results) => {
      if (id !== searchId || rows.length > MAX_ROWS || results.length === 0) return;
      rows.push(...results);
      scheduleRender();
    });
    const onSearching = proxy((value) => {
      if (id !== searchId) return;
      searching = value;
      if (!value) {
        status.textContent = '';
        scheduleRender();
      }
      refresh();
    });
    const ivRanges = state.ivRanges.map((r) => [...r]);

    if (snapshot.isStatic) {
      await engine.search_seeds_static(
        gameFlag(),
        state.trainerID,
        state.secretID,
        state.staticCategory,
        state.staticPokemon,
        state.method,
        state.shininess,
        state.nature,
        state.gender,
        state.hiddenPower,
        ivRanges,
        onResults,
        onSearching,
      );
    } else {
      await engine.search_seeds_wild(
        gameFlag(),
        state.trainerID,
        state.secretID,
        state.wildCategory,
        state.wildLocation,
        state.wildPokemon,
        state.method,
        state.wildLead,
        state.shininess,
        state.nature,
        state.gender,
        state.hiddenPower,
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
      '',
      t('col.seed'),
      s.isMultiMethod && t('col.method'),
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
    ].filter((c) => c !== false);
    resultsHead.replaceChildren(h('tr', {}, ...cols.map((c, i) => h('th', i === 0 ? { class: 'tl-use-cell' } : {}, c))));
    const body = rows.slice(0, MAX_ROWS).map((row) =>
      h(
        'tr',
        {},
        h(
          'td',
          { class: 'tl-use-cell' },
          h(
            'button',
            {
              type: 'button',
              class: 'tl-use-btn',
              title: t('sr.openInitial'),
              onclick: () => onOpenInitialSeed(hexSeed(row.seed, 32)),
            },
            h('span', {}, t('tab.initialSeed')),
          ),
        ),
        h('td', { class: 'mono' }, hexSeed(row.seed, 32)),
        s.isMultiMethod && h('td', {}, METHODS[row.method]),
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
      ),
    );
    if (rows.length > MAX_ROWS) body.push(h('tr', {}, h('td', { colspan: cols.length, class: 'muted' }, '…')));
    resultsBody.replaceChildren(...body);
    resultsHint.hidden = rows.length === 0;
  }

  // ─── Inicio ───
  async function init() {
    status.textContent = t('tl.loadingEngine');
    try {
      [res] = await Promise.all([getResources(), getEngine()]);
    } catch (err) {
      status.textContent = t('tl.error', { e: err.message });
      return;
    }
    natureField.setOptions([[-1, t('any')], ...res.NATURES.map((n, i) => [i, n])]);
    hiddenPowerField.setOptions([[-1, t('any')], ...res.TYPES.map((type, i) => [i, type])]);
    fixStaticCategory();
    status.textContent = '';
    await Promise.all([loadStaticTemplates(), loadWildLocations()]);
    refresh();
  }

  refresh();
  init();
}
