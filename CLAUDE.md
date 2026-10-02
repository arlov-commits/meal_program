# Working in this repo

## What the project is

A single-page meal builder for the DRBU menu, built for easy carb counting
and glycemic checks by someone managing diabetes. It follows the house style
of `arlov-commits/bodhi_precepts`.

- `index.html` is the whole app — markup, CSS and vanilla **ES5** in one file.
  No build step, no dependencies, no webfonts, and it must keep working over
  `file://`. Four views: Plate, Totals, Look up, Settings; the footer carries
  "What these numbers use" and the Methodology notes.
- `data.js` (`window.MEAL_DATA`) is the food list, **edited by hand**: plain
  JSON after its first line. `gi-data.js` (`window.GI_TABLE`) is the GI
  reference. Both load by script tag, which is what keeps `file://` working —
  never switch them to `fetch`.
- `README.md` documents the rules, the settings and the look. Keep it in step
  with the code in the same commit, and the Methodology notes in the footer
  too: every formula on screen is described there.
- It is an installable PWA. A file added to the app must also be added to
  `SHELL` in `sw.js`. The manifest carries no `theme_color`; the head shim
  sets the meta from `--paper` before the body exists.
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
- **Bands are judged on the value shown** (GI whole number, GL one decimal),
  so a number never sits in the wrong colour for its own rounding.
- **Splits are per food, then summed**, each part clamped at zero.
- **Warnings come from each food's flags**, never from searching its text.
- **Servings may be fractional**; a weight is stored as servings
  (`grams ÷ serving weight`), so switching between Servings and Weight
  never loses anything.

## Verify before committing

Visual changes get checked by measurement, not by eye. Chromium is
preinstalled; serve the **repo root** (`python3 -m http.server 8000`), check
both themes and both a phone and a desktop viewport, and watch for page
errors. Contrast is measured against the real ground, compositing any
semi-transparent wash onto what is under it; every text colour meets WCAG AA
in both themes today.

## Traps this codebase shares with bodhi_precepts

- **No `position:fixed` in the chrome.** The layout is a `100dvh` flex column
  whose last child is the tab bar, in flow. `min-height:0` on `.frame` is
  load-bearing.
- **The document does not scroll; `#scroll` does.** Use `scroller()`.
- **`background-color`, not the `background` shorthand**, on anything that
  also carries a texture in `background-image`.
- **Colours come from the tokens** at the top of the stylesheet, restated
  once per theme. A fill colour that is too light as text gets its own text
  token (`--fat-ink`), not an inline value.
- **Nothing derived from the wall clock is read once**: the auto theme is
  rechecked on a timer.
- **Amount fields are updated in place**, never by redrawing their row, or
  a number being typed loses focus.
