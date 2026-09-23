// Textos de Easy Lines: español, inglés y japonés.
// El idioma se elige con ?lang=es|en|ja (lo pasa HunterSpace); si no, el del navegador.

export const LANGUAGES = { es: 'Español', en: 'English', ja: '日本語' };

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

const IDX = { es: 0, en: 1, ja: 2 };

// clave: [español, inglés, japonés]
const DICT = {
  'view.easyLines': [
    'Easy Lines',
    'Easy Lines',
    'Easy Lines',
  ],
  'search.placeholder': ['Buscar…', 'Search…', '検索…'],
  'search.none': ['Sin coincidencias', 'No matches', '一致するものがありません'],
  any: [
    'Cualquiera',
    'Any',
    '指定なし',
  ],
  none: [
    'Ninguno',
    'None',
    'なし',
  ],
  soon: [
    'Próximamente',
    'Coming soon',
    '近日公開',
  ],
  'tl.tools': [
    'Herramientas de Easy Lines',
    'Easy Lines tools',
    'Easy Lines ツール',
  ],
  'tl.credits': [
    'Motor y datos de <a href="https://github.com/Lincoln-LM/ten-lines" target="_blank" rel="noopener noreferrer">Ten Lines</a> de Lincoln-LM, basado en <a href="https://github.com/Admiral-Fish/PokeFinder" target="_blank" rel="noopener noreferrer">PokeFinder</a>. Easy Lines es software libre (GPL-3.0): <a href="https://github.com/Nopal-Dev/SpaceHunter" target="_blank" rel="noopener noreferrer">código fuente</a>.',
    'Engine and data from <a href="https://github.com/Lincoln-LM/ten-lines" target="_blank" rel="noopener noreferrer">Ten Lines</a> by Lincoln-LM, based on <a href="https://github.com/Admiral-Fish/PokeFinder" target="_blank" rel="noopener noreferrer">PokeFinder</a>. Easy Lines is free software (GPL-3.0): <a href="https://github.com/Nopal-Dev/SpaceHunter" target="_blank" rel="noopener noreferrer">source code</a>.',
    'エンジンとデータ：Lincoln-LM氏の <a href="https://github.com/Lincoln-LM/ten-lines" target="_blank" rel="noopener noreferrer">Ten Lines</a>（<a href="https://github.com/Admiral-Fish/PokeFinder" target="_blank" rel="noopener noreferrer">PokeFinder</a> ベース）。Easy Lines はフリーソフトウェアです（GPL-3.0）：<a href="https://github.com/Nopal-Dev/SpaceHunter" target="_blank" rel="noopener noreferrer">ソースコード</a>',
  ],
  'tl.sec.game': [
    'Juego',
    'Game',
    'ソフト',
  ],
  'tl.sec.target': [
    'Seed objetivo',
    'Target seed',
    '目標seed',
  ],
  'tl.sec.advances': [
    'Avances',
    'Advances',
    '消費数',
  ],
  'tl.sec.trainer': [
    'Entrenador',
    'Trainer',
    'トレーナー',
  ],
  'tl.sec.encounter': [
    'Encuentro',
    'Encounter',
    'エンカウント',
  ],
  'tl.sec.filters': [
    'Filtros',
    'Filters',
    'フィルター',
  ],
  'tl.game': [
    'Juego',
    'Game',
    'ソフト',
  ],
  'tl.console': [
    'Consola',
    'Console',
    '本体',
  ],
  'tl.sound': [
    'Sonido',
    'Sound',
    'サウンド',
  ],
  'tl.buttonMode': [
    'Modo de botones',
    'Button mode',
    'ボタンモード',
  ],
  'tl.button': [
    'Botón de seed',
    'Seed button',
    'seedボタン',
  ],
  'tl.heldButton': [
    'Botón extra',
    'Extra button',
    '追加ボタン',
  ],
  'tl.targetSeed': [
    'Seed objetivo',
    'Target seed',
    '目標seed',
  ],
  'tl.targetSeed.tip': [
    'Seed inicial que quieres conseguir (hex)',
    'Initial seed you want to hit (hex)',
    '狙う初期seed（16進数）',
  ],
  'tl.targetSeed.ph': [
    'p. ej. 70DE',
    'e.g. 70DE',
    '例：70DE',
  ],
  'tl.seedNotFound': [
    'Seed no encontrada en la lista de este juego/configuración',
    'Seed not found in the list for this game/settings',
    'このソフト/設定のリストにseedがありません',
  ],
  'tl.noSeeds': [
    'Sin seeds conocidas para este juego y configuración',
    'No known seeds for this game & settings',
    'このソフトと設定の既知seedはありません',
  ],
  'tl.pickSeed': [
    'Elige una seed de la lista',
    'Pick a seed from the list',
    'リストからseedを選んでください',
  ],
  'tl.seedInfo': [
    '{ms} ms · posición {i} de {n}',
    '{ms} ms · position {i} of {n}',
    '{ms} ms · {n}件中 {i}番目',
  ],
  'tl.leeway': [
    'Seed ±',
    'Seed ±',
    'seed ±',
  ],
  'tl.leeway.tip': [
    'Cuántas seeds antes y después del objetivo se revisan',
    'How many seeds before and after the target are checked',
    '目標の前後で調べるseedの数',
  ],
  'tl.showSeeds': [
    'Ver seeds del rango',
    'Show seeds in range',
    '範囲内のseedを表示',
  ],
  'tl.advMin': [
    'Avances mín.',
    'Min advances',
    '最小消費数',
  ],
  'tl.advMax': [
    'Avances máx.',
    'Max advances',
    '最大消費数',
  ],
  'tl.aPressMin': [
    'Frame del último A mín.',
    'Min final A press frame',
    '最後のA押しフレーム（最小）',
  ],
  'tl.aPressMax': [
    'Frame del último A máx.',
    'Max final A press frame',
    '最後のA押しフレーム（最大）',
  ],
  'tl.offset': [
    'Offset',
    'Offset',
    'オフセット',
  ],
  'tl.ttvMin': [
    'TeachyTV avances mín.',
    'Min TeachyTV advances',
    'おしえテレビ最小消費数',
  ],
  'tl.ttvMax': [
    'TeachyTV avances máx.',
    'Max TeachyTV advances',
    'おしえテレビ最大消費数',
  ],
  'tl.overworld': [
    'Frames de overworld requeridos',
    'Required overworld frames',
    '必要なフィールドフレーム数',
  ],
  'tl.teachyTV': [
    'Modo TeachyTV',
    'TeachyTV mode',
    'おしえテレビモード',
  ],
  'tl.tid': [
    'Trainer ID (TID)',
    'Trainer ID (TID)',
    '表ID (TID)',
  ],
  'tl.sid': [
    'Secret ID (SID)',
    'Secret ID (SID)',
    '裏ID (SID)',
  ],
  'tl.method': [
    'Método',
    'Method',
    'メソッド',
  ],
  'tl.category': [
    'Categoría',
    'Category',
    'カテゴリ',
  ],
  'tl.pokemon': [
    'Pokémon',
    'Pokémon',
    'ポケモン',
  ],
  'tl.location': [
    'Lugar',
    'Location',
    '場所',
  ],
  'tl.filterPokemon': [
    'Filtrar por este Pokémon',
    'Filter by this Pokémon',
    'このポケモンで絞り込む',
  ],
  'tl.lead': [
    'Lead',
    'Lead',
    '先頭',
  ],
  'tl.shiny': [
    'Shiny',
    'Shininess',
    '色違い',
  ],
  'tl.nature': [
    'Naturaleza',
    'Nature',
    '性格',
  ],
  'tl.nature.tip': [
    'Necesaria para calcular IVs',
    'Required for IV calculation',
    '個体値計算に必要',
  ],
  'tl.gender': [
    'Género',
    'Gender',
    '性別',
  ],
  'tl.ivCalc': [
    'Calculadora de IVs',
    'IV calculator',
    '個体値計算',
  ],
  'tl.ivCalc.ph': [
    'Nivel y stats, una línea por nivel:\n5 20 11 10 11 11 11',
    'Level and stats, one line per level:\n5 20 11 10 11 11 11',
    'レベルと能力値（1行に1レベル）：\n5 20 11 10 11 11 11',
  ],
  'tl.ivMin': [
    '{s} mín.',
    'Min {s}',
    '{s} 最小',
  ],
  'tl.ivMax': [
    '{s} máx.',
    'Max {s}',
    '{s} 最大',
  ],
  'tl.ivReset': [
    'Restablecer 0–31',
    'Reset 0–31',
    '0–31に戻す',
  ],
  'tl.ivDisabled': [
    'Cálculo de IVs desactivado: se buscan todas las naturalezas. Elige una naturaleza para activarlo.',
    'IV calculation disabled: searching all natures. Pick a nature to enable it.',
    '個体値計算は無効です（全性格を検索）。有効にするには性格を選んでください。',
  ],
  'tl.ivLineMissing': [
    'Línea {l}: falta {f}',
    'Line {l}: missing {f}',
    '{l}行目：{f}がありません',
  ],
  'tl.ivLineInvalid': [
    'Línea {l}: {f} no válido',
    'Line {l}: invalid {f}',
    '{l}行目：{f}が不正です',
  ],
  'tl.ivImpossible': [
    'No hay ningún IV de {s} posible',
    'No possible {s} IV',
    '{s}の個体値がありえません',
  ],
  'tl.level': [
    'Nivel',
    'Level',
    'レベル',
  ],
  'tl.search': [
    'Buscar',
    'Search',
    '検索',
  ],
  'tl.searching': [
    'Buscando…',
    'Searching…',
    '検索中…',
  ],
  'tl.results': [
    'Resultados',
    'Results',
    '結果',
  ],
  'tl.resultsCount': [
    '{n} resultados',
    '{n} results',
    '{n}件',
  ],
  'tl.resultsMany': [
    'más de {n} resultados',
    'more than {n} results',
    '{n}件以上',
  ],
  'tl.resultsIdle': [
    'Configura la búsqueda y pulsa Buscar.',
    'Set up the search and press Search.',
    '条件を設定して「検索」を押してください。',
  ],
  'tl.noResults': [
    'Sin resultados con estos filtros.',
    'No results with these filters.',
    'この条件では結果がありません。',
  ],
  'tl.clickRow': [
    'Haz clic en una fila para configurar el timer.',
    'Click a row to set up the timer.',
    '行をクリックするとタイマーを設定します。',
  ],
  'tl.clickRow.title': [
    'Clic para configurar el timer con esta seed',
    'Click to set up the timer with this seed',
    'クリックでこのseedをタイマーに設定',
  ],
  'tl.timerSet': [
    'Timer configurado (Custom): fase 1 = {ms} ms · fase 2 = {f} frames en Continue',
    'Timer set (Custom): phase 1 = {ms} ms · phase 2 = {f} frames on Continue',
    'タイマー設定完了（カスタム）：フェーズ1 = {ms} ms · フェーズ2 = 「つづきから」で {f} フレーム',
  ],
  'tl.goTimer': [
    'Ir al timer →',
    'Go to timer →',
    'タイマーへ →',
  ],
  'tl.sort': [
    'Ordenar',
    'Sort',
    '並び替え',
  ],
  'tl.sort.none': [
    'Orden original',
    'Original order',
    '元の順番',
  ],
  'tl.sort.seedAsc': [
    'Seed: menor a mayor',
    'Seed: low to high',
    'seed：小さい順',
  ],
  'tl.sort.seedDesc': [
    'Seed: mayor a menor',
    'Seed: high to low',
    'seed：大きい順',
  ],
  'tl.sort.framesAsc': [
    'Frames en Continue: menor a mayor',
    'Continue frames: low to high',
    '「つづきから」フレーム：小さい順',
  ],
  'tl.sort.framesDesc': [
    'Frames en Continue: mayor a menor',
    'Continue frames: high to low',
    '「つづきから」フレーム：大きい順',
  ],
  'tl.loadingEngine': [
    'Cargando motor de Ten Lines…',
    'Loading Ten Lines engine…',
    'Ten Lines エンジンを読み込み中…',
  ],
  'tl.loadingSeeds': [
    'Cargando seeds…',
    'Loading seeds…',
    'seedを読み込み中…',
  ],
  'tl.error': [
    'Error: {e}',
    'Error: {e}',
    'エラー：{e}',
  ],
  'tl.err.noSeeds': [
    'No hay seeds conocidas para este juego y configuración.',
    'There are no known seeds for this game & settings.',
    'このソフトと設定の既知seedはありません。',
  ],
  'tl.err.target': [
    'Elige una seed objetivo válida.',
    'Pick a valid target seed.',
    '有効な目標seedを選んでください。',
  ],
  'tl.err.adv': [
    'El mínimo de avances es mayor que el máximo.',
    'Minimum advances is greater than maximum.',
    '最小消費数が最大消費数より大きいです。',
  ],
  'tl.err.ttv': [
    'El mínimo de avances de TeachyTV es mayor que el máximo.',
    'Minimum TeachyTV advances is greater than maximum.',
    'おしえテレビの最小消費数が最大より大きいです。',
  ],
  'tl.err.ivRange': [
    'El rango de IVs de {s} es inválido.',
    'The {s} IV range is invalid.',
    '{s}の個体値の範囲が不正です。',
  ],
  'stat.hp': [
    'PS',
    'HP',
    'HP',
  ],
  'stat.atk': [
    'Ataque',
    'Attack',
    'こうげき',
  ],
  'stat.def': [
    'Defensa',
    'Defense',
    'ぼうぎょ',
  ],
  'stat.spa': [
    'Ataque Especial',
    'Special Attack',
    'とくこう',
  ],
  'stat.spd': [
    'Defensa Especial',
    'Special Defense',
    'とくぼう',
  ],
  'stat.spe': [
    'Velocidad',
    'Speed',
    'すばやさ',
  ],
  'col.seed': [
    'Seed',
    'Seed',
    'seed',
  ],
  'col.advances': [
    'Avances',
    'Advances',
    '消費数',
  ],
  'col.method': [
    'Método',
    'Method',
    'メソッド',
  ],
  'col.aPress': [
    'Frame del último A',
    'Final A press frame',
    '最後のA押しフレーム',
  ],
  'col.ttv': [
    'Avances TeachyTV',
    'TeachyTV advances',
    'おしえテレビ消費数',
  ],
  'col.continue': [
    'Frames en Continue',
    'Continue screen frames',
    '「つづきから」フレーム',
  ],
  'col.slot': [
    'Slot',
    'Slot',
    'スロット',
  ],
  'col.level': [
    'Nivel',
    'Level',
    'レベル',
  ],
  'col.pid': [
    'PID',
    'PID',
    'PID',
  ],
  'col.shiny': [
    'Shiny',
    'Shiny',
    '色違い',
  ],
  'col.nature': [
    'Naturaleza',
    'Nature',
    '性格',
  ],
  'col.ability': [
    'Habilidad',
    'Ability',
    '特性',
  ],
  'col.ivs': [
    'IVs',
    'IVs',
    '個体値',
  ],
  'col.hp': [
    'Poder oculto',
    'Hidden power',
    'めざパ',
  ],
  'col.power': [
    'Potencia',
    'Power',
    '威力',
  ],
  'col.gender': [
    'Género',
    'Gender',
    '性別',
  ],
  'shiny.no': [
    'No',
    'No',
    'なし',
  ],
  'shiny.star': [
    'Estrella',
    'Star',
    '星',
  ],
  'shiny.square': [
    'Cuadrado',
    'Square',
    'ひし形',
  ],
  'shiny.starSquare': [
    'Estrella/Cuadrado',
    'Star/Square',
    '星/ひし形',
  ],
  'method.allWild': [
    'Todos los métodos salvajes',
    'All Wild Methods',
    '野生の全メソッド',
  ],
  'cat.starters': [
    'Iniciales',
    'Starters',
    '御三家',
  ],
  'cat.fossils': [
    'Fósiles',
    'Fossils',
    '化石',
  ],
  'cat.gifts': [
    'Regalos',
    'Gifts',
    'もらえるポケモン',
  ],
  'cat.gameCorner': [
    'Casino',
    'Game Corner',
    'ゲームコーナー',
  ],
  'cat.stationary': [
    'Estáticos',
    'Stationary',
    '固定シンボル',
  ],
  'cat.legends': [
    'Legendarios',
    'Legends',
    '伝説',
  ],
  'cat.events': [
    'Eventos',
    'Events',
    'イベント',
  ],
  'cat.roamers': [
    'Errantes',
    'Roamers',
    '徘徊',
  ],
  'cat.blisy': [
    'Eventos e-Reader de Blisy',
    'Blisy\'s E-Reader Events',
    'Blisy氏のカードeイベント',
  ],
  'wild.grass': [
    'Hierba',
    'Grass',
    '草むら',
  ],
  'wild.rockSmash': [
    'Golpe Roca',
    'Rock Smash',
    'いわくだき',
  ],
  'wild.surfing': [
    'Surf',
    'Surfing',
    'なみのり',
  ],
  'wild.oldRod': [
    'Caña Vieja',
    'Old Rod',
    'ボロのつりざお',
  ],
  'wild.goodRod': [
    'Caña Buena',
    'Good Rod',
    'いいつりざお',
  ],
  'wild.superRod': [
    'Supercaña',
    'Super Rod',
    'すごいつりざお',
  ],
  'lead.cuteF': [
    'Gran Encanto (hembra)',
    'Female Cute Charm',
    'メロメロボディ（♀）',
  ],
  'lead.cuteM': [
    'Gran Encanto (macho)',
    'Male Cute Charm',
    'メロメロボディ（♂）',
  ],
  'lead.magnet': [
    'Imán',
    'Magnet Pull',
    'じりょく',
  ],
  'lead.static': [
    'Elec. Estática',
    'Static',
    'せいでんき',
  ],
  'lead.hustle': [
    'Entusiasmo/Presión/Espíritu Vital',
    'Hustle/Pressure/Vital Spirit',
    'はりきり/プレッシャー/やるき',
  ],
  'lead.sync': [
    'Sincronía ({n})',
    '{n} Synchronize',
    'シンクロ（{n}）',
  ],
  'lock.shiny': [
    ' (Shiny bloqueado)',
    ' (Shiny Locked)',
    '（色違い不可）',
  ],
  'lock.break': [
    ' (Rompe bloqueo)',
    ' (Lock Break)',
    '（ロック解除）',
  ],
  'game.ruby': [
    'Rubí',
    'Ruby',
    'ルビー',
  ],
  'game.sapphire': [
    'Zafiro',
    'Sapphire',
    'サファイア',
  ],
  'game.emerald': [
    'Esmeralda',
    'Emerald',
    'エメラルド',
  ],
  'game.fr': [
    'Rojo Fuego',
    'FireRed',
    'ファイアレッド',
  ],
  'game.lg': [
    'Verde Hoja',
    'LeafGreen',
    'リーフグリーン',
  ],
  'game.painting': [
    '{g} (seed de cuadro)',
    '{g} Painting Seed',
    '{g}（絵画seed）',
  ],
  'game.switch': [
    'Switch {g}',
    'Switch {g}',
    'Switch版 {g}',
  ],
  'tl.standalone': [
    'Abre Easy Lines dentro de HunterSpace para configurar el timer con un clic.',
    'Open Easy Lines inside HunterSpace to set up the timer with one click.',
    'HunterSpace 内で Easy Lines を開くと、クリックでタイマーを設定できます。',
  ],
  'tl.hostError': [
    'HunterSpace no respondió. Recarga la página e inténtalo de nuevo.',
    'HunterSpace did not respond. Reload the page and try again.',
    'HunterSpace から応答がありません。ページを再読み込みしてください。',
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
