// Helpers mínimos de DOM y campos de formulario.

const INT_MAX = 2 ** 31 - 1;
const INT_MIN = -(2 ** 31 - 1);

/** Crea un elemento: h('div', {class: 'x', onclick: fn}, hijo1, 'texto', ...) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (key === 'class') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key in el && typeof value !== 'string') {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function wrapField(label, control, tooltip) {
  return h(
    'label',
    { class: 'field', title: tooltip },
    h('span', { class: 'field-label' }, label),
    control,
  );
}

/**
 * Campo numérico. Actualiza en vivo mientras escribes si el valor es válido;
 * al salir del campo restaura/ajusta el valor mostrado.
 *
 * @param {Object} o
 * @param {string} o.label
 * @param {() => number|null} o.get
 * @param {(v: number|null) => void} o.set
 * @param {number} [o.min]
 * @param {number} [o.max]
 * @param {boolean} [o.float]
 * @param {() => number} [o.radix]   16 para hex
 * @param {boolean} [o.allowBlank]
 * @param {string} [o.placeholder]
 * @param {() => boolean} [o.visible]
 * @param {string} [o.tooltip]
 */
export function numberField(o) {
  const min = o.min ?? INT_MIN;
  const max = o.max ?? INT_MAX;
  const radix = () => (o.radix ? o.radix() : 10);

  const input = h('input', {
    type: 'text',
    inputmode: o.float ? 'decimal' : 'numeric',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: o.placeholder ?? '',
  });

  const format = (v) => {
    if (v === null || v === undefined) return '';
    if (radix() === 16) return Math.trunc(v).toString(16).toUpperCase();
    if (o.float) return String(Math.round(v * 1000) / 1000);
    return String(v);
  };

  const parse = (text) => {
    const t = text.trim();
    if (t === '') return o.allowBlank ? null : undefined;
    let v;
    if (radix() === 16) {
      if (!/^[0-9a-f]+$/i.test(t)) return undefined;
      v = parseInt(t, 16);
    } else if (o.float) {
      if (!/^-?\d*\.?\d*$/.test(t) || t === '-' || t === '.') return undefined;
      v = Number(t);
    } else {
      if (!/^-?\d+$/.test(t)) return undefined;
      v = parseInt(t, 10);
    }
    if (!Number.isFinite(v)) return undefined;
    return v;
  };

  input.addEventListener('input', () => {
    const v = parse(input.value);
    const invalid = v === undefined || (v !== null && (v < min || v > max));
    input.classList.toggle('invalid', invalid);
    if (!invalid) o.set(v);
  });

  input.addEventListener('blur', () => {
    let v = parse(input.value);
    if (v === undefined) v = o.get();
    else if (v !== null) v = Math.min(max, Math.max(min, v));
    if (v !== o.get()) o.set(v);
    input.classList.remove('invalid');
    input.value = format(o.get());
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });

  const el = wrapField(o.label, input, o.tooltip);

  return {
    el,
    input,
    refresh(disabled = false) {
      if (document.activeElement !== input) input.value = format(o.get());
      input.disabled = disabled;
      el.hidden = o.visible ? !o.visible() : false;
    },
  };
}

export function checkboxField({ label, get, set, tooltip }) {
  const input = h('input', { type: 'checkbox', onchange: () => set(input.checked) });
  const el = h(
    'label',
    { class: 'field field-check', title: tooltip },
    h('span', { class: 'field-label' }, label),
    h('span', { class: 'switch' }, input, h('span', { class: 'switch-track' })),
  );
  return {
    el,
    input,
    refresh(disabled = false) {
      input.checked = !!get();
      input.disabled = disabled;
    },
  };
}
