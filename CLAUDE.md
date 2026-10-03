# Working in this repo

## What the project is

A single-page meal builder for the DRBU menu, built for easy carb counting
and glycemic checks by someone managing diabetes. It is styled in the
**Ru-Yi Style System** (Mode A, editorial); README "The look" summarises it
and names the few places this copy departs from it, all for contrast.

- `index.html` is the whole app — markup, CSS and vanilla **ES5** in one file.
  No build step, no dependencies, and it must keep working over `file://`.
  Four views by hash — `#plate`, `#totals`, `#lookup`, `#settings` — each
  ending in the Methodology band ("What these numbers use" and the notes),
  then the footer. `#m-<id>` opens a Methodology note.
- `fonts/` holds Inter and Playfair Display as self-hosted `woff2`, loaded by
  `@font-face` with relative URLs, which works over `file://`. Never link a
  font CDN.
- `data.js` (`window.MEAL_DATA`) is the food list, **edited by hand**: plain
  JSON after its first line. `gi-data.js` (`window.GI_TABLE`) is the GI
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
  everywhere including the readout), so a number never sits in the wrong
  colour for its own rounding.
- **Splits are per food, then summed**, each part clamped at zero.
- **Warnings come from each food's flags**, never from searching its text.
- **Servings may be fractional**; a weight is stored as servings
  (`grams ÷ serving weight`), so switching between Servings and Weight
  never loses anything.

## Verify before committing

Visual changes get checked by measurement, not by eye. Chromium is
preinstalled; serve the **repo root** (`python3 -m http.server 8000`), check
a phone and a desktop viewport (320px to 1440px), with motion on and with
`reducedMotion: 'reduce'`, and watch for page errors and sideways scroll.
Contrast is measured against the real ground: photograph the page with the
glyphs made transparent and check each line of text against the pixels
behind it, so gradients, washes and blobs count. Every line meets WCAG AA
today.

## Conventions and traps

- **The document scrolls.** The header is `position:sticky`; the Plate
  readout sticks under it at `top: var(--hdr)`. `scroll-padding-top` on
  `html` keeps anchor targets clear of both.
- **The drawer lives outside the header.** The header's `backdrop-filter`
  would trap a `position:fixed` child; keep the drawer a sibling.
- **Band rhythm.** White and cream alternate, never two of a colour
  together; each view has exactly one `band-dark` before the footer, and at
  most two invitation banners (jade and maroon, far apart). A Plate search
  re-stripes the food bands it leaves showing — keep that if bands change.
- **Rust for fills, rust-deep for text.** `--rust` `#b8431c` paints rails,
  rules and buttons; `--rust-deep` `#8c2f12` is rust as text on light, and
  `--rust-on-dark` `#d66a48` on dark. An accent too light as text uses its
  `-ink` token (`--a2-ink`, `--low-ink` …), never an inline value. Colours
  come from the tokens at the top of the stylesheet.
- **`background-color`, not the `background` shorthand**, on anything that
  also carries a gradient in `background-image` (the invitations): the
  colour is the fallback and what a contrast check reads first.
- **Reveal motion.** Elements carry `data-rv="key"` (write it with `rv()`),
  and script that draws content calls `reveal()` on what it drew. A key
  already seen is drawn as `rv-done`, and an entrance settles to `rv-done`
  when it ends, so a running total never blinks and a view shown again does
  not replay. Keys must be stable for the same piece of content. The reveal
  is an animation, not a transition, so it never fights a card's hover lift.
- **Hover lifts only under `@media (hover:hover)`**, so a tap never leaves a
  card raised.
- **Nothing derived from the wall clock is read once**: the daily verse is
  rechecked every minute.
- **Amount fields are updated in place**, never by redrawing their card, or
  a number being typed loses focus.
