// Punto de entrada de Easy Lines.
// Abierto directamente usa un aspecto por defecto; dentro de HunterSpace (iframe) usa el que
// le envía la página contenedora.
import { translatePage } from './i18n.js';
import { embedded, send, onSettings } from './host.js';
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

// Dentro de HunterSpace: recibir su aspecto y avisar de que Easy Lines está listo
onSettings(applyAppearance);
send('ready');
