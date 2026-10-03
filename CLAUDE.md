# Working in this repo

## What the project is

A single-page meal builder for the DRBU menu, built for easy carb counting
and glycemic checks by someone managing diabetes. Plate works like a
build-a-bowl counter: food tiles you tap, a bar of food groups, and a running
plate that stays in view. It keeps the **Ru-Yi Style System**'s tokens, type
and card anatomy, laid out as a tool; README "The look" summarises it and
names the few places this copy departs from it, all for contrast. The owner
asked for a practical builder, not a landing page: no hero sections and no
entrance animation.

- `index.html` is the whole app — markup, CSS and vanilla **ES5** in one file.
  No build step, no dependencies, and it must keep working over `file://`.
  Four views by hash — `#plate` (the builder), `#totals`, `#lookup`,
  `#settings` — each ending in the Methodology ("What these numbers use" and
  the notes), then the footer. `#m-<id>` opens a Methodology note.
- `fonts/` holds Inter and Playfair Display as self-hosted `woff2`, loaded by
  `@font-face` with relative URLs, which works over `file://`. Never link a
  font CDN.
- `data.js` (`window.MEAL_DATA`) is the food list, **edited by hand**: plain
  JSON after its first line; each food's `emoji` is the picture on its tile.
  `gi-data.js` (`window.GI_TABLE`) is the GI
  reference. Both load by script tag, which is what keeps `file://` working —
  never switch them to `fetch`.
- `README.md` documents the rules, the settings and the look. Keep it in step
  with the code in the same commit, and the Methodology notes too: every
  formula on screen is described there.
- It is an installable PWA. A file added to the app — a font included — must
  also be added to `SHELL` in `sw.js`. There is one theme, so the manifest's
  `theme_color` and the `theme-color` meta are both `#ffffff`.
- `icon.svg` is the icon source; the PNGs are rasterised from it. Redraw the
  SVG and re-render them together, never edit a PNG.

## The calculation layer

Everything numeric lives between `/* @calc:start` and `/* @calc:end` in
`index.html`: pure functions, no DOM. `tests/calc.test.js` runs that block
on its own against `data.js` — `node tests/calc.test.js` — so keep it free of
DOM and settings reads; settings reach it as arguments (`refs`, `opts`).
Anything new that produces a number shown on screen belongs there and gets a
check in the test.

Rules worth knowing before changing one:

- **Glycemic load uses net (available) carbs**, `carbs − fiber`, not total.
- **GI 0 in the data means "not applicable"**; such foods are left out of the
  meal GI, never averaged in as zero.
- **Bands are judged on the value shown** (GI whole number, GL one decimal,
  everywhere including the plate bar), so a number never sits in the wrong
  colour for its own rounding.
- **Splits are per food, then summed**, each part clamped at zero.
- **Warnings come from each food's flags**, never from searching its text.
- **Servings may be fractional**; a weight is stored as servings
  (`grams ÷ serving weight`), so switching between Servings and Weight
  never loses anything.

## Verify before committing

Visual changes get checked by measurement, not by eye. Chromium is
preinstalled; serve the **repo root** (`python3 -m http.server 8000`), check
a phone and a desktop viewport (320px to 1440px), with food on the plate and
with none, with the phone's plate open and a food's sheet open, and watch for
page errors, sideways scroll and grid items overlapping. Contrast is measured
in the live page against the real ground: scroll through, photograph each
screen with the glyphs made transparent, and check every line that is on
screen — not under the header, the food-group bar, the plate or the sheet,
and not clipped inside a scrolling box — against the pixels behind it. Every
line meets WCAG AA today.

## Conventions and traps

- **The document scrolls.** The header is `position:sticky`, and on Plate the
  food-group bar sticks under it at `top: var(--hdr)`. Sections and tiles
  carry `scroll-margin-top` for both.
- **The plate panel is sticky, never fixed.** On a wide screen it sits in
  the builder's second column, stuck under the bars; at 860px and below it
  is the builder's last child, stuck to the bottom (`bottom:0`), so it rides
  at the end of the food list and never hangs off the glass. It casts no
  shadow upward: one dimmed the text scrolling under its edge.
- **A sticky element switched to `relative` at a breakpoint resets `top`**
  too, or its offset pushes it onto its neighbour. It happened to the Look
  up calculator.
- **A tile's Add button covers the tile.** Its `::after` is stretched over
  the whole card, so a tap anywhere adds the food. Anything else clickable on
  a tile (the i button) needs `position:relative` and a `z-index` above it.
- **Amount fields are updated in place**, never by redrawing their tile, or
  a number being typed loses focus. While its field has focus a tile stays
  open even at 0; it folds back to Add when the field is left.
- **No entrance motion.** Nothing waits to appear; transitions are short
  state changes (a colour, a tile lifting under the pointer), all off under
  `prefers-reduced-motion`.
- **Near-black is for the number that matters**: the plate's running count,
  the quality panel, and the footer. The working areas are cream with white
  cards; the heads and the Methodology are white.
- **Rust for fills, rust-deep for text.** `--rust` `#b8431c` paints rails,
  rules and buttons; `--rust-deep` `#8c2f12` is rust as text on light, and
  `--rust-on-dark` `#d66a48` on dark; the bands have `-od` tones for text on
  near-black. An accent too light as text uses its `-ink` token (`--a2-ink`,
  `--low-ink` …), never an inline value. Colours come from the tokens at the
  top of the stylesheet.
- **`background-color`, not the `background` shorthand**, on anything that
  also carries an image in `background-image` (the search field's icon, the
  tile's check): the colour is what a contrast check reads first.
- **Hover lifts only under `@media (hover:hover)`**, so a tap never leaves a
  tile raised.
