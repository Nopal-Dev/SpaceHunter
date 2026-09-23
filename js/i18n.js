// Textos de Easy Lines: español e inglés.
// El idioma se elige con ?lang=es|en (lo pasa HunterSpace); si no, el del navegador.

export const LANGUAGES = { es: 'Español', en: 'English' };

function detectLanguage() {
  const param = new URLSearchParams(location.search).get('lang');
  if (param in LANGUAGES) return param;
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const short = String(candidate).slice(0, 2).toLowerCase();
    if (short in LANGUAGES) return short;
  }
  return 'en';
}

export const lang = detectLanguage();

const IDX = { es: 0, en: 1 };

// clave: [español, inglés]
const DICT = {
  'view.easyLines': ['Easy Lines', 'Easy Lines'],
  'search.placeholder': ['Buscar…', 'Search…'],
  'search.none': ['Sin coincidencias', 'No matches'],
  any: ['Cualquiera', 'Any'],
  none: ['Ninguno', 'None'],
  soon: ['Próximamente', 'Coming soon'],
  'tl.tools': ['Herramientas de Easy Lines', 'Easy Lines tools'],
  'tl.credits': [
    'Motor y datos de <a href="https://github.com/Lincoln-LM/ten-lines" target="_blank" rel="noopener noreferrer">Ten Lines</a> de Lincoln-LM, basado en <a href="https://github.com/Admiral-Fish/PokeFinder" target="_blank" rel="noopener noreferrer">PokeFinder</a>. Easy Lines es software libre (GPL-3.0): <a href="https://github.com/Nopal-Dev/SpaceHunter" target="_blank" rel="noopener noreferrer">código fuente</a>.',
    'Engine and data from <a href="https://github.com/Lincoln-LM/ten-lines" target="_blank" rel="noopener noreferrer">Ten Lines</a> by Lincoln-LM, based on <a href="https://github.com/Admiral-Fish/PokeFinder" target="_blank" rel="noopener noreferrer">PokeFinder</a>. Easy Lines is free software (GPL-3.0): <a href="https://github.com/Nopal-Dev/SpaceHunter" target="_blank" rel="noopener noreferrer">source code</a>.',
  ],
  'tl.sec.game': ['Juego', 'Game'],
  'tl.sec.target': ['Seed objetivo', 'Target seed'],
  'tl.sec.advances': ['Avances', 'Advances'],
  'tl.sec.trainer': ['Entrenador', 'Trainer'],
  'tl.sec.encounter': ['Encuentro', 'Encounter'],
  'tl.sec.filters': ['Filtros', 'Filters'],
  'tl.game': ['Juego', 'Game'],
  'tl.console': ['Consola', 'Console'],
  'tl.sound': ['Sonido', 'Sound'],
  'tl.buttonMode': ['Modo de botones', 'Button mode'],
  'tl.button': ['Botón de seed', 'Seed button'],
  'tl.heldButton': ['Botón extra', 'Extra button'],
  'tl.targetSeed': ['Seed objetivo', 'Target seed'],
  'tl.targetSeed.tip': ['Seed inicial que quieres conseguir (hex)', 'Initial seed you want to hit (hex)'],
  'tl.targetSeed.ph': ['p. ej. 70DE', 'e.g. 70DE'],
  'tl.seedNotFound': [
    'Seed no encontrada en la lista de este juego/configuración',
    'Seed not found in the list for this game/settings',
  ],
  'tl.noSeeds': [
    'Sin seeds conocidas para este juego y configuración',
    'No known seeds for this game & settings',
  ],
  'tl.pickSeed': ['Elige una seed de la lista', 'Pick a seed from the list'],
  'tl.seedInfo': ['{ms} ms · posición {i} de {n}', '{ms} ms · position {i} of {n}'],
  'tl.leeway': ['Seed ±', 'Seed ±'],
  'tl.leeway.tip': [
    'Cuántas seeds antes y después del objetivo se revisan',
    'How many seeds before and after the target are checked',
  ],
  'tl.showSeeds': ['Ver seeds del rango', 'Show seeds in range'],
  'tl.advMin': ['Avances mín.', 'Min advances'],
  'tl.advMax': ['Avances máx.', 'Max advances'],
  'tl.aPressMin': ['Frame del último A mín.', 'Min final A press frame'],
  'tl.aPressMax': ['Frame del último A máx.', 'Max final A press frame'],
  'tl.offset': ['Offset', 'Offset'],
  'tl.ttvMin': ['TeachyTV avances mín.', 'Min TeachyTV advances'],
  'tl.ttvMax': ['TeachyTV avances máx.', 'Max TeachyTV advances'],
  'tl.overworld': ['Frames de overworld requeridos', 'Required overworld frames'],
  'tl.teachyTV': ['Modo TeachyTV', 'TeachyTV mode'],
  'tl.tid': ['Trainer ID (TID)', 'Trainer ID (TID)'],
  'tl.sid': ['Secret ID (SID)', 'Secret ID (SID)'],
  'tl.method': ['Método', 'Method'],
  'tl.category': ['Categoría', 'Category'],
  'tl.pokemon': ['Pokémon', 'Pokémon'],
  'tl.location': ['Lugar', 'Location'],
  'tl.filterPokemon': ['Filtrar por este Pokémon', 'Filter by this Pokémon'],
  'tl.lead': ['Lead', 'Lead'],
  'tl.shiny': ['Shiny', 'Shininess'],
  'tl.nature': ['Naturaleza', 'Nature'],
  'tl.nature.tip': ['Necesaria para calcular IVs', 'Required for IV calculation'],
  'tl.gender': ['Género', 'Gender'],
  'tl.ivCalc': ['Calculadora de IVs', 'IV calculator'],
  'tl.ivCalc.ph': [
    'Nivel y stats, una línea por nivel:\n5 20 11 10 11 11 11',
    'Level and stats, one line per level:\n5 20 11 10 11 11 11',
  ],
  'tl.ivMin': ['{s} mín.', 'Min {s}'],
  'tl.ivMax': ['{s} máx.', 'Max {s}'],
  'tl.ivReset': ['Restablecer 0–31', 'Reset 0–31'],
  'tl.ivDisabled': [
    'Cálculo de IVs desactivado: se buscan todas las naturalezas. Elige una naturaleza para activarlo.',
    'IV calculation disabled: searching all natures. Pick a nature to enable it.',
  ],
  'tl.ivLineMissing': ['Línea {l}: falta {f}', 'Line {l}: missing {f}'],
  'tl.ivLineInvalid': ['Línea {l}: {f} no válido', 'Line {l}: invalid {f}'],
  'tl.ivImpossible': ['No hay ningún IV de {s} posible', 'No possible {s} IV'],
  'tl.level': ['Nivel', 'Level'],
  'tl.search': ['Buscar', 'Search'],
  'tl.searching': ['Buscando…', 'Searching…'],
  'tl.results': ['Resultados', 'Results'],
  'tl.resultsCount': ['{n} resultados', '{n} results'],
  'tl.resultsMany': ['más de {n} resultados', 'more than {n} results'],
  'tl.resultsIdle': ['Configura la búsqueda y pulsa Buscar.', 'Set up the search and press Search.'],
  'tl.noResults': ['Sin resultados con estos filtros.', 'No results with these filters.'],
  'tl.clickRow': [
    'Pulsa el botón Timer de una fila para configurar el timer con esa seed.',
    'Press the Timer button on a row to set up the timer with that seed.',
  ],
  'tl.useBtn': ['Timer', 'Timer'],
  'tl.copy': ['Clic para copiar', 'Click to copy'],
  'tl.copied': ['¡Copiado!', 'Copied!'],
  'tl.clickRow.title': [
    'Configurar el timer con esta seed',
    'Set up the timer with this seed',
  ],
  'tl.timerSet': [
    'Timer configurado (Custom): fase 1 = {ms} ms · fase 2 = {f} frames en Continue',
    'Timer set (Custom): phase 1 = {ms} ms · phase 2 = {f} frames on Continue',
  ],
  'tl.goTimer': ['Ir al timer →', 'Go to timer →'],
  'tl.sort': ['Ordenar', 'Sort'],
  'tl.sort.none': ['Orden original', 'Original order'],
  'tl.sort.seedAsc': ['Seed: menor a mayor', 'Seed: low to high'],
  'tl.sort.seedDesc': ['Seed: mayor a menor', 'Seed: high to low'],
  'tl.sort.framesAsc': ['Frames en Continue: menor a mayor', 'Continue frames: low to high'],
  'tl.sort.framesDesc': ['Frames en Continue: mayor a menor', 'Continue frames: high to low'],
  'tl.loadingEngine': ['Cargando motor de Ten Lines…', 'Loading Ten Lines engine…'],
  'tl.loadingSeeds': ['Cargando seeds…', 'Loading seeds…'],
  'tl.error': ['Error: {e}', 'Error: {e}'],
  'tl.err.noSeeds': [
    'No hay seeds conocidas para este juego y configuración.',
    'There are no known seeds for this game & settings.',
  ],
  'tl.err.target': ['Elige una seed objetivo válida.', 'Pick a valid target seed.'],
  'tl.err.adv': ['El mínimo de avances es mayor que el máximo.', 'Minimum advances is greater than maximum.'],
  'tl.err.ttv': [
    'El mínimo de avances de TeachyTV es mayor que el máximo.',
    'Minimum TeachyTV advances is greater than maximum.',
  ],
  'tl.err.ivRange': ['El rango de IVs de {s} es inválido.', 'The {s} IV range is invalid.'],
  'stat.hp': ['PS', 'HP'],
  'stat.atk': ['Ataque', 'Attack'],
  'stat.def': ['Defensa', 'Defense'],
  'stat.spa': ['Ataque Especial', 'Special Attack'],
  'stat.spd': ['Defensa Especial', 'Special Defense'],
  'stat.spe': ['Velocidad', 'Speed'],
  'col.seed': ['Seed', 'Seed'],
  'col.advances': ['Avances', 'Advances'],
  'col.method': ['Método', 'Method'],
  'col.aPress': ['Frame del último A', 'Final A press frame'],
  'col.ttv': ['Avances TeachyTV', 'TeachyTV advances'],
  'col.continue': ['Frames en Continue', 'Continue screen frames'],
  'col.slot': ['Slot', 'Slot'],
  'col.level': ['Nivel', 'Level'],
  'col.pid': ['PID', 'PID'],
  'col.shiny': ['Shiny', 'Shiny'],
  'col.nature': ['Naturaleza', 'Nature'],
  'col.ability': ['Habilidad', 'Ability'],
  'col.ivs': ['IVs', 'IVs'],
  'col.hp': ['Poder oculto', 'Hidden power'],
  'col.power': ['Potencia', 'Power'],
  'col.gender': ['Género', 'Gender'],
  'shiny.no': ['No', 'No'],
  'shiny.star': ['Estrella', 'Star'],
  'shiny.square': ['Cuadrado', 'Square'],
  'shiny.starSquare': ['Estrella/Cuadrado', 'Star/Square'],
  'method.allWild': ['Todos los métodos salvajes', 'All Wild Methods'],
  'cat.starters': ['Iniciales', 'Starters'],
  'cat.fossils': ['Fósiles', 'Fossils'],
  'cat.gifts': ['Regalos', 'Gifts'],
  'cat.gameCorner': ['Casino', 'Game Corner'],
  'cat.stationary': ['Estáticos', 'Stationary'],
  'cat.legends': ['Legendarios', 'Legends'],
  'cat.events': ['Eventos', 'Events'],
  'cat.roamers': ['Errantes', 'Roamers'],
  'cat.blisy': ['Eventos e-Reader de Blisy', 'Blisy\'s E-Reader Events'],
  'wild.grass': ['Hierba', 'Grass'],
  'wild.rockSmash': ['Golpe Roca', 'Rock Smash'],
  'wild.surfing': ['Surf', 'Surfing'],
  'wild.oldRod': ['Caña Vieja', 'Old Rod'],
  'wild.goodRod': ['Caña Buena', 'Good Rod'],
  'wild.superRod': ['Supercaña', 'Super Rod'],
  'lead.cuteF': ['Gran Encanto (hembra)', 'Female Cute Charm'],
  'lead.cuteM': ['Gran Encanto (macho)', 'Male Cute Charm'],
  'lead.magnet': ['Imán', 'Magnet Pull'],
  'lead.static': ['Elec. Estática', 'Static'],
  'lead.hustle': ['Entusiasmo/Presión/Espíritu Vital', 'Hustle/Pressure/Vital Spirit'],
  'lead.sync': ['Sincronía ({n})', '{n} Synchronize'],
  'lock.shiny': [' (Shiny bloqueado)', ' (Shiny Locked)'],
  'lock.break': [' (Rompe bloqueo)', ' (Lock Break)'],
  'game.ruby': ['Rubí', 'Ruby'],
  'game.sapphire': ['Zafiro', 'Sapphire'],
  'game.emerald': ['Esmeralda', 'Emerald'],
  'game.fr': ['Rojo Fuego', 'FireRed'],
  'game.lg': ['Verde Hoja', 'LeafGreen'],
  'game.painting': ['{g} (seed de cuadro)', '{g} Painting Seed'],
  'game.switch': ['Switch {g}', 'Switch {g}'],
  'tl.standalone': [
    'Abre Easy Lines dentro de HunterSpace para configurar el timer con un clic.',
    'Open Easy Lines inside HunterSpace to set up the timer with one click.',
  ],
  'tl.hostError': [
    'HunterSpace no respondió. Recarga la página e inténtalo de nuevo.',
    'HunterSpace did not respond. Reload the page and try again.',
  ],
};

/** Traduce una clave; {var} se sustituye con los valores de vars. */
export function t(key, vars) {
  const entry = DICT[key];
  let text = entry ? (entry[IDX[lang]] ?? entry[0]) : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** Traduce el HTML estático: data-i18n, data-i18n-html, data-i18n-title y data-i18n-aria. */
export function translatePage(root = document) {
  document.documentElement.lang = lang;
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of root.querySelectorAll('[data-i18n-html]')) node.innerHTML = t(node.dataset.i18nHtml);
  for (const node of root.querySelectorAll('[data-i18n-title]')) node.title = t(node.dataset.i18nTitle);
  for (const node of root.querySelectorAll('[data-i18n-aria]')) node.setAttribute('aria-label', t(node.dataset.i18nAria));
}
