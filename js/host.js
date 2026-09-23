// Comunicación con la página que contiene a Easy Lines (p. ej. HunterSpace) mediante postMessage.
//
// Protocolo (todos los mensajes llevan `source` para identificarse):
//
//   Easy Lines → página          { source: 'easy-lines', type: 'ready' }
//                                { source: 'easy-lines', type: 'set-timer', id, phases, console }
//                                   phases: [{ unit: 'ms' | 'Advances', target: number }]
//                                   console: consola del timer con el mismo framerate
//                                { source: 'easy-lines', type: 'navigate', view: 'timer' }
//
//   página → Easy Lines          { source: 'hunterspace', type: 'settings', settings: {...} }
//                                { source: 'hunterspace', type: 'result', id, ok, message }
//
// Sin página contenedora (abierto directamente), Easy Lines funciona solo y no envía nada.

export const embedded = window.parent !== window;

const REQUEST_TIMEOUT = 3000;
const pending = new Map();
const settingsListeners = new Set();
let nextId = 1;

window.addEventListener('message', (e) => {
  // Solo se aceptan mensajes de la página que contiene a Easy Lines
  if (!embedded || e.source !== window.parent) return;
  const msg = e.data;
  if (!msg || msg.source !== 'hunterspace') return;
  if (msg.type === 'settings') {
    settingsListeners.forEach((fn) => fn(msg.settings ?? {}));
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
