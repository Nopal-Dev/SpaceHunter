// Comunicación con la página que contiene a Easy Lines (p. ej. HunterSpace) mediante postMessage.
//
// Protocolo (todos los mensajes llevan `source` para identificarse):
//
//   Easy Lines → página          { source: 'easy-lines', type: 'ready' }
//                                { source: 'easy-lines', type: 'set-timer', id, phases, console }
//                                   phases: [{ unit: 'ms' | 'Advances', target: number }]
//                                   console: consola del timer con el mismo framerate
//                                   target: { subtitle, fields: [{ key, label, value, mono?, wide?, highlight? }] }
//                                     registro completo de la seed (etiquetas ya traducidas), para
//                                     que la página contenedora lo muestre como "Seed objetivo"
//                                { source: 'easy-lines', type: 'notice', ok, text, action? }  (action: 'timer')
//                                { source: 'easy-lines', type: 'navigate', view: 'timer' }
//                                { source: 'easy-lines', type: 'scroll-to', top }
//                                   llevar la vista a esa altura del contenido (p. ej. a los resultados)
//                                { source: 'easy-lines', type: 'resize', height }
//                                   alto del contenido, para que el iframe crezca y la página
//                                   contenedora haga el scroll (Easy Lines no tiene scroll propio)
//
//   página → Easy Lines          { source: 'hunterspace', type: 'settings', settings: {...} }
//                                { source: 'hunterspace', type: 'result', id, ok, message }
//                                { source: 'hunterspace', type: 'viewport', top, height, bottom }
//                                   posición del iframe respecto a la ventana, alto de la ventana y lo
//                                   que tapa abajo la página (p. ej. su barra inferior en celular), para
//                                   mantener a la vista el panel de resultados y el botón Buscar
//
// Sin página contenedora (abierto directamente), Easy Lines funciona solo y no envía nada.

export const embedded = window.parent !== window;

const REQUEST_TIMEOUT = 3000;
const pending = new Map();
const settingsListeners = new Set();
const viewportListeners = new Set();
let nextId = 1;

window.addEventListener('message', (e) => {
  // Solo se aceptan mensajes de la página que contiene a Easy Lines
  if (!embedded || e.source !== window.parent) return;
  const msg = e.data;
  if (!msg || msg.source !== 'hunterspace') return;
  if (msg.type === 'settings') {
    settingsListeners.forEach((fn) => fn(msg.settings ?? {}));
  } else if (msg.type === 'viewport') {
    viewportListeners.forEach((fn) =>
      fn({ top: Number(msg.top) || 0, height: Number(msg.height) || innerHeight, bottom: Number(msg.bottom) || 0 }),
    );
  } else if (msg.type === 'result' && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

/** Envía un mensaje a la página contenedora. */
export function send(type, data = {}) {
  if (!embedded) return;
  window.parent.postMessage({ source: 'easy-lines', type, ...data }, '*');
}

/**
 * Envía un mensaje y espera la respuesta (type 'result' con el mismo id).
 * Si no hay respuesta a tiempo, resuelve con { ok: false, timeout: true }.
 */
export function request(type, data = {}) {
  if (!embedded) return Promise.resolve({ ok: false, standalone: true });
  const id = nextId++;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ ok: false, timeout: true });
    }, REQUEST_TIMEOUT);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    send(type, { id, ...data });
  });
}

/** fn(settings) se llama cada vez que la página contenedora envía sus ajustes de aspecto. */
export function onSettings(fn) {
  settingsListeners.add(fn);
}

/** fn({ top, height }) se llama cuando la página contenedora hace scroll o cambia de tamaño. */
export function onViewport(fn) {
  viewportListeners.add(fn);
}
