// Punto de entrada de Easy Lines.
// Abierto directamente usa un aspecto por defecto; dentro de HunterSpace (iframe) usa el que
// le envía la página contenedora.
import { translatePage } from './i18n.js';
import { embedded, send, onSettings, onViewport } from './host.js';
import { createCalibration } from './calibration.js';
import { createSearcher } from './searcher.js';
import { createInitialSeed } from './initialSeed.js';

const DEFAULT_APPEARANCE = {
  theme: 'system', // 'dark' | 'light' | 'system'
  accent: '#10b981',
  panelOpacity: 0.8,
  panelBlur: 0,
  radius: 28,
  sideBySide: true, // formulario a la izquierda y resultados a la derecha
};

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
let appearance = { ...DEFAULT_APPEARANCE };

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  return m ? m.slice(1).map((x) => parseInt(x, 16)) : [16, 185, 129];
}

function applyAppearance(patch = {}) {
  appearance = { ...appearance, ...patch };
  const root = document.documentElement;
  const theme =
    appearance.theme === 'system' ? (darkQuery.matches ? 'dark' : 'light') : appearance.theme === 'light' ? 'light' : 'dark';
  root.dataset.theme = theme;
  const [r, g, b] = hexToRgb(appearance.accent);
  root.style.setProperty('--accent', `rgb(${r}, ${g}, ${b})`);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  root.style.setProperty('--on-accent', luminance > 0.6 ? '#111' : '#fff');
  root.style.setProperty('--panel-alpha', String(appearance.panelOpacity));
  root.style.setProperty('--panel-blur', `${appearance.panelBlur}px`);
  root.style.setProperty('--radius', `${appearance.radius}px`);
  document.body.classList.toggle('tl-side-by-side', !!appearance.sideBySide);
}

darkQuery.addEventListener('change', () => applyAppearance());

document.body.classList.toggle('embedded', embedded);
applyAppearance();
translatePage();
// ─── Pestañas: Calibration, Searcher e Initial Seed ───
// Como en Ten Lines: un resultado del Searcher se abre en Initial Seed, y uno de Initial Seed en
// Calibration. Searcher e Initial Seed se crean la primera vez que se abren.
const TAB_KEY = 'easy-lines-tab';
const tabButtons = [...document.querySelectorAll('.tl-tabs .tab[data-tab]')];
const panels = Object.fromEntries([...document.querySelectorAll('.tl-panel')].map((p) => [p.dataset.panel, p]));
const tools = {};

function tool(name) {
  if (!tools[name]) {
    if (name === 'calibration') tools[name] = createCalibration(panels.calibration);
    if (name === 'searcher') {
      tools[name] = createSearcher(panels.searcher, {
        onOpenInitialSeed: (hex) => {
          showTab('initial-seed');
          tool('initial-seed').setTarget(hex);
        },
      });
    }
    if (name === 'initial-seed') {
      tools[name] = createInitialSeed(panels['initial-seed'], {
        onOpenCalibration: (patch) => {
          showTab('calibration');
          tool('calibration').open(patch);
        },
      });
    }
  }
  return tools[name];
}

function showTab(name) {
  if (!panels[name]) name = 'calibration';
  tool(name);
  for (const button of tabButtons) {
    const active = button.dataset.tab === name;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== name;
  try {
    localStorage.setItem(TAB_KEY, name);
  } catch {
    // ignorar
  }
  window.dispatchEvent(new Event('easylines:layout'));
}

for (const button of tabButtons) button.addEventListener('click', () => showTab(button.dataset.tab));
let initialTab = 'calibration';
try {
  initialTab = localStorage.getItem(TAB_KEY) ?? 'calibration';
} catch {
  // ignorar
}
showTab(initialTab);

// ─── Dentro de una página contenedora (iframe) ───
// Easy Lines no tiene scroll propio: avisa de su alto para que el iframe crezca y la página
// contenedora haga el scroll. Como position: sticky no funciona así, el panel de resultados
// (con formulario y resultados lado a lado) se mantiene a la vista moviéndolo a mano.
if (embedded) {
  const STICKY_TOP = 16;
  let viewport = { top: 0, height: screen.availHeight };
  // Hasta que la página contenedora envíe el alto real de su ventana, usar el de la pantalla
  // (100vh aquí sería el propio iframe, que crece con el contenido: crecería sin fin).
  document.documentElement.style.setProperty('--view-h', `${screen.availHeight}px`);

  const reportHeight = () => {
    let height = document.body.offsetHeight;
    const panel = document.querySelector('.ss.open .ss-panel');
    if (panel) height = Math.max(height, Math.ceil(panel.getBoundingClientRect().bottom + scrollY + 16));
    send('resize', { height });
  };
  new ResizeObserver(reportHeight).observe(document.body);
  window.addEventListener('easylines:layout', reportHeight);

  const keepResultsInView = () => {
    const card = document.querySelector('.tl-panel:not([hidden]) .tl-results');
    if (!card) return;
    card.style.transform = '';
    const sideBySide = document.body.classList.contains('tl-side-by-side') && innerWidth > 1100;
    if (!sideBySide) return;
    const cardTop = card.getBoundingClientRect().top + scrollY;
    const containerBottom = card.parentElement.getBoundingClientRect().bottom + scrollY;
    const maxShift = containerBottom - (cardTop + card.offsetHeight);
    const shift = Math.min(Math.max(STICKY_TOP - (viewport.top + cardTop), 0), Math.max(maxShift, 0));
    if (shift > 0) card.style.transform = `translateY(${shift}px)`;
  };

  // Botón Buscar siempre a la vista en pantallas estrechas (como position: sticky, que no funciona
  // aquí porque el scroll lo hace la página contenedora)
  const STICKY_BOTTOM = 12;
  const keepSubmitInView = () => {
    const button = document.querySelector('.tl-panel:not([hidden]) .tl-submit');
    if (!button) return;
    button.style.transform = '';
    button.classList.remove('floating');
    if (innerWidth > 600) return;
    const form = button.closest('form');
    const visibleBottom = -viewport.top + viewport.height - (viewport.bottom ?? 0) - STICKY_BOTTOM;
    const rect = button.getBoundingClientRect();
    const buttonBottom = rect.bottom + scrollY;
    const formTop = form.getBoundingClientRect().top + scrollY;
    if (buttonBottom <= visibleBottom || visibleBottom < formTop + rect.height * 2) return;
    button.style.transform = `translateY(${Math.round(visibleBottom - buttonBottom)}px)`;
    button.classList.add('floating');
  };
  window.addEventListener('easylines:layout', keepSubmitInView);

  onViewport((v) => {
    viewport = v;
    keepSubmitInView();
    // Alto de la ventana de la página contenedora (para las listas con scroll propio)
    document.documentElement.style.setProperty('--view-h', `${v.height}px`);
    keepResultsInView();
  });
  new ResizeObserver(keepResultsInView).observe(document.body);

  onSettings(applyAppearance);
  send('ready');
  reportHeight();
}
