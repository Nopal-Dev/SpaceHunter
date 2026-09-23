// Punto de entrada de Easy Lines.
// Abierto directamente usa un aspecto por defecto; dentro de HunterSpace (iframe) usa el que
// le envía la página contenedora.
import { translatePage } from './i18n.js';
import { embedded, send, onSettings, onViewport } from './host.js';
import { createCalibration } from './calibration.js';

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
createCalibration(document.getElementById('tl-calibration'));

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

  const reportHeight = () => send('resize', { height: document.body.offsetHeight });
  new ResizeObserver(reportHeight).observe(document.body);

  const keepResultsInView = () => {
    const card = document.querySelector('.tl-results');
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

  onViewport((v) => {
    viewport = v;
    // Alto de la ventana de la página contenedora (para las listas con scroll propio)
    document.documentElement.style.setProperty('--view-h', `${v.height}px`);
    keepResultsInView();
  });
  new ResizeObserver(keepResultsInView).observe(document.body);

  onSettings(applyAppearance);
  send('ready');
  reportHeight();
}
