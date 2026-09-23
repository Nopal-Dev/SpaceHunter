# Easy Lines — Notices / Avisos

Easy Lines is free software: you can redistribute it and/or modify it under the terms of the
**GNU General Public License version 3** (see [`LICENSE`](LICENSE)).
This program is distributed WITHOUT ANY WARRANTY.

## Credits / Créditos

| Part | Author | License |
|---|---|---|
| User interface (`index.html`, `css/`, `js/`) | Easy Lines / HunterSpace (Nopal-Dev), adapted from Ten Lines' Calibration tab | GPL-3.0 |
| Engine (`engine/engine.js`, WebAssembly) | [Ten Lines](https://github.com/Lincoln-LM/ten-lines) by Lincoln-LM, using [PokeFinderCore](https://github.com/Admiral-Fish/PokeFinder) by Admiral-Fish | GPL-3.0 |
| FRLG seed lists (`engine/data/*.bin`) | Ten Lines — seeds farmed by blisy, po, HunarPG, 10Ben, Real96, ColdStoneSys, Papa Jefé and トノ | GPL-3.0 (as distributed by Ten Lines) |
| Name lists (`engine/i18n/*.txt`) | PokeFinder | GPL-3.0 |
| `js/vendor/comlink.mjs` | [Comlink](https://github.com/GoogleChromeLabs/comlink) by Google | Apache-2.0 (see `js/vendor/LICENSE-comlink`) |

## Corresponding source of the engine / Código fuente del motor

`engine/engine.js` is the compiled (Emscripten/WebAssembly) worker published by Ten Lines at
<https://lincoln-lm.github.io/ten-lines/>. Its complete corresponding source code is available at:

- Ten Lines: <https://github.com/Lincoln-LM/ten-lines> — commit `fbd089b55e9a2a894cfa31d7da39f39febeb196a`
- PokeFinder (submodule `src/wasm/lib/PokeFinder`): <https://github.com/Admiral-Fish/PokeFinder> — commit `fddaee74e6e3a2cfebc59c7624ffca2f6d1c6b4b`

Build instructions are in the Ten Lines README.

## Additional term (GPL-3.0 section 7(e)) / Término adicional

The names **"HunterSpace"** and **"Easy Lines"**, and their logos, are not licensed under the GPL.
Modified versions of this program must not use these names or logos to identify themselves,
nor imply endorsement by their authors, without prior written permission. This does not restrict
keeping these notices and the credits above, which must be preserved.

Los nombres **"HunterSpace"** y **"Easy Lines"** y sus logos no se licencian bajo la GPL. Las
versiones modificadas no pueden usarlos para identificarse ni dar a entender el respaldo de sus
autores sin permiso previo por escrito. Esto no impide conservar estos avisos y los créditos,
que deben mantenerse.
