// Lista desplegable con buscador. Envuelve un <select> nativo, que sigue siendo la fuente de
// verdad (opciones, valor, disabled y evento 'change'), y muestra en su lugar un botón que abre
// un panel con un campo de búsqueda y las opciones filtradas.
//
// Tras cambiar las opciones o el valor del <select> por código, hay que llamar a sync().
import { h } from './dom.js';
import { t } from './i18n.js';

let nextId = 1;

/** Quita acentos y mayúsculas para comparar ("Tímida" coincide con "tim"). */
const normalize = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Avisa de que cambió el alto ocupado (el panel abierto), para ajustar el iframe. */
const notifyLayout = () => window.dispatchEvent(new Event('easylines:layout'));

/**
 * @param {HTMLSelectElement} select
 * @param {{ labelId?: string }} [options]
 * @returns {{ el: HTMLElement, sync: () => void, close: () => void }}
 */
export function searchSelect(select, { labelId } = {}) {
  const listId = `ss-list-${nextId++}`;
  let open = false;
  let items = []; // opciones visibles: { value, text, disabled }
  let active = -1; // índice resaltado en items

  select.classList.add('ss-native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const valueText = h('span', { class: 'ss-value' });
  const button = h(
    'button',
    {
      type: 'button',
      class: 'ss-button',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false',
      'aria-controls': listId,
      'aria-labelledby': labelId,
    },
    valueText,
    h('span', { class: 'ss-arrow', 'aria-hidden': 'true' }),
  );
  const search = h('input', {
    type: 'search',
    class: 'ss-search',
    placeholder: t('search.placeholder'),
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-controls': listId,
    'aria-autocomplete': 'list',
  });
  const list = h('ul', { class: 'ss-list', id: listId, role: 'listbox' });
  const empty = h('li', { class: 'ss-empty', role: 'presentation' }, t('search.none'));
  const panel = h('div', { class: 'ss-panel', hidden: true }, search, list);
  const el = h('div', { class: 'ss' }, select, button, panel);

  function sync() {
    const selected = select.options[select.selectedIndex];
    valueText.textContent = selected ? selected.textContent : '';
    button.disabled = select.disabled;
    if (open) renderList();
  }

  function renderList() {
    const query = normalize(search.value.trim());
    items = [...select.options]
      .map((o) => ({ value: o.value, text: o.textContent, disabled: o.disabled }))
      .filter((o) => !query || normalize(o.text).includes(query));
    if (active >= items.length) active = items.length - 1;
    list.replaceChildren(
      ...(items.length
        ? items.map((item, i) =>
            h(
              'li',
              {
                id: `${listId}-${i}`,
                class: `ss-option${i === active ? ' active' : ''}${item.value === select.value ? ' selected' : ''}`,
                role: 'option',
                'aria-selected': String(item.value === select.value),
                'aria-disabled': item.disabled ? 'true' : undefined,
                onpointerdown: (e) => e.preventDefault(), // no quitar el foco del buscador
                onclick: () => !item.disabled && choose(item.value),
                onpointermove: () => setActive(i, false),
              },
              item.text,
            ),
          )
        : [empty]),
    );
    search.setAttribute('aria-activedescendant', active >= 0 ? `${listId}-${active}` : '');
  }

  function setActive(index, scroll = true) {
    if (!items.length) return;
    active = Math.max(0, Math.min(items.length - 1, index));
    for (const [i, li] of [...list.children].entries()) li.classList.toggle('active', i === active);
    search.setAttribute('aria-activedescendant', `${listId}-${active}`);
    if (scroll) list.children[active]?.scrollIntoView({ block: 'nearest' });
  }

  function openPanel() {
    if (open || select.disabled) return;
    open = true;
    search.value = '';
    renderList();
    setActive(Math.max(0, items.findIndex((i) => i.value === select.value)));
    panel.hidden = false;
    el.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    search.focus();
    document.addEventListener('pointerdown', onOutside, true);
    notifyLayout();
  }

  function close(focusButton = false) {
    if (!open) return;
    open = false;
    panel.hidden = true;
    el.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    if (focusButton) button.focus();
    notifyLayout();
  }

  function choose(value) {
    close(true);
    if (value === select.value) return;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    sync();
  }

  function onOutside(e) {
    if (!el.contains(e.target)) close();
  }

  button.addEventListener('click', () => (open ? close() : openPanel()));
  button.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openPanel();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Escribir sobre el botón abre el buscador con esa letra
      e.preventDefault();
      openPanel();
      search.value = e.key;
      renderList();
      setActive(0);
    }
  });

  search.addEventListener('input', () => {
    renderList();
    setActive(0);
  });
  search.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive(active + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive(active - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(items.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (items[active] && !items[active].disabled) choose(items[active].value);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case 'Tab':
        close();
        break;
    }
  });

  sync();
  return { el, sync, close };
}
