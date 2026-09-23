# Easy Lines

Calibration tool for **Gen 3 Pokémon RNG** (Ruby/Sapphire/Emerald painting seeds and
FireRed/LeafGreen initial seeds), in English, Spanish and Japanese.

It is the Easy Lines section of **HunterSpace**, published as a standalone program. It is powered by the
engine of [Ten Lines](https://github.com/Lincoln-LM/ten-lines) (Lincoln-LM), built on
[PokeFinder](https://github.com/Admiral-Fish/PokeFinder) (Admiral-Fish).

*Herramienta de calibración para RNG de Pokémon de 3.ª generación. Es la sección Easy Lines de
HunterSpace, publicada como programa independiente. Usa el motor de Ten Lines / PokeFinder.*

## Features / Funciones

- Every Ten Lines calibration option: 16 game versions (incl. Switch and mGBA), GBA / GBP / NDS / 3DS / Switch 1–2,
  target seed ± range, advances, offset, TeachyTV mode, TID/SID, static and wild encounters, shiny / nature / gender
  filters and IV calculator.
- Sort results by seed or by Continue-screen frames.
- Interface and Pokémon names in **English, Spanish and Japanese** (`?lang=en|es|ja`, otherwise the browser language).
- Settings are remembered in the browser.
- Inside HunterSpace, clicking a result sets up the timer automatically (see *Embedding* below).

## Running it / Cómo usarla

It is a static web page with no build step, but it must be **served over HTTP** because browsers block ES modules
and Web Workers from `file://`. Any static server works:

```sh
npx serve .          # or: python -m http.server 8000
```

Then open `http://localhost:3000/` (or the port shown). It also works on GitHub Pages or any static hosting.

*Es una página estática: sírvela con cualquier servidor HTTP (no funciona abriendo el archivo con doble clic).*

## Updating the seed lists / Actualizar las seeds

The FireRed/LeafGreen seed lists in `engine/data/` come from Ten Lines. To download the latest ones on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File engine/actualizar-seeds.ps1
```

## Embedding / Integración (postMessage)

Easy Lines can run inside an `<iframe>` and talk to the host page with `postMessage`
(see [`js/host.js`](js/host.js)):

| Direction | Message |
|---|---|
| Easy Lines → host | `{ source: 'easy-lines', type: 'ready' }` |
| Easy Lines → host | `{ source: 'easy-lines', type: 'set-timer', id, phases: [{ unit: 'ms' \| 'Advances', target }], console, target: { subtitle, fields: [{ key, label, value }] } }` |
| Easy Lines → host | `{ source: 'easy-lines', type: 'resize', height }` (content height; the host page scrolls) |
| Easy Lines → host | `{ source: 'easy-lines', type: 'navigate', view: 'timer' }` |
| host → Easy Lines | `{ source: 'hunterspace', type: 'settings', settings: { theme, accent, panelOpacity, panelBlur, radius, sideBySide } }` |
| host → Easy Lines | `{ source: 'hunterspace', type: 'result', id, ok, message? }` |
| host → Easy Lines | `{ source: 'hunterspace', type: 'viewport', top, height }` (iframe position, to keep results in view) |

When a result row is clicked, Easy Lines sends `set-timer` with two phases (**the seed time in ms** and
**the frames to wait on the Continue screen**) plus the full, already-translated record of that seed (`target`).

## License / Licencia

**GPL-3.0** — see [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md) (credits, engine source and an additional
term about the "HunterSpace" / "Easy Lines" names).
