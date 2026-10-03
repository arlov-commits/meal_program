# Food as Medicine 良藥

Plate a meal from the foods on the DRBU menu — by the serving, or by weight
from a kitchen scale — and see at once what it adds up to: the carbohydrate
to count, its glycemic load and index, its quality per calorie, and how it
sits against a full day's limits. Built to be easy for someone managing
diabetes, who weighs food and checks what it will do to their blood sugar.

Open `index.html`. No build step, no dependencies, works straight off the
filesystem — and, served over the web, installs as an app on a phone or a
desktop.

## What is here

| File | What it is |
| --- | --- |
| `index.html` | The whole app: markup, CSS and vanilla ES5 in one file. Four views — **Plate**, **Totals**, **Look up**, **Settings** — each ending in the **Methodology**, then the footer. |
| `data.js` | The food list and the daily reference values, as `window.MEAL_DATA`. Edited by hand. A script tag rather than a fetched file, so the app works over `file://`. |
| `gi-data.js` | The glycemic-index reference — 150 foods in 11 categories, glucose = 100 — as `window.GI_TABLE`. Read by Look up. |
| `manifest.webmanifest` | Makes it installable: name, icons, standalone display. |
| `sw.js` | The service worker. Keeps a copy of the app so an installed one opens offline. |
| `fonts/` | Inter and Playfair Display as `woff2`, Latin and Latin Extended, about 255 KB, each with its SIL Open Font License. Loaded by `@font-face`, so they work off the disk too. |
| `icon.svg` | The icon: a white bowl with a gold leaf rising from it, on a jade-to-sage tile. The source every PNG is cut from. |
| `icon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Rasterised from `icon.svg`. Never edit a PNG; redraw the SVG and re-render them together. |
| `tests/calc.test.js` | Formula checks: `node tests/calc.test.js`. Runs the calculation layer out of `index.html` against `data.js`. |
| `breakfast_builder.jsx` | The first prototype, kept for history. Nothing loads it and its numbers are out of date. |

## Installing it

- **Android, and Chrome or Edge on a desktop**: Settings shows an **Install
  Food as Medicine** button whenever the browser offers one; the browser's
  own menu or address bar offers it too.
- **iPhone and iPad**: Safari's Share button, then **Add to Home Screen**.
  Settings says so when it sees an iOS browser.

Installed, it opens in its own window and works with no connection, fonts
included. The page is fetched fresh whenever there is a network, racing a
2.5-second timer so a slow connection cannot hang the launch. Opened straight
off the disk it registers no service worker and needs none.

## Weighing a meal

1. On **Plate**, set **Count by** to **Weight**.
2. Weigh each food **in the state its row names**: oats *dry, before
   cooking*; banana and orange *peeled*; apple *with skin, without the core*;
   drinks *as poured* (1 ml taken as 1 g). One serving is defined that way,
   so weighing cooked oatmeal — which holds several times its weight in
   water — would multiply the carbs.
3. Type the scale's reading into the food's card. The card answers at once
   with servings, carbs and glycemic load; the readout pinned under the header
   carries the plate's carbs, carb choices, GL, GI, calories and grade, and
   opens **Totals** when tapped.
4. **Totals** breaks it down food by food.
5. For anything not on the menu, **Look up** takes a label's serving size,
   carbohydrate and fiber, plus the weight on the scale, and gives the carbs,
   net carbs, carb choices and — with a GI from its list — the glycemic load.
   For a menu food, *Weigh it* fills the label figures in, and the result can
   be put straight on the plate.

Servings work the same way and take fractions: `0.5`, `1/2`, `1 1/2` and `½`
are all read.

The figures come from labels and typical serving weights. They are close, not
exact, and the app says so where it matters: it is not a dosing aid, and a
diabetic's own care team decides insulin.

## The rules it applies

All of these live in one block of `index.html`, between `@calc:start` and
`@calc:end`, and the footer's **Methodology** spells each one out.

- **Carbs to count** — total carbohydrate as on the label, or net carbs
  (total − fiber), as set. **Carb choices** divide it by 15 g (or 12 g or
  10 g). An optional **carb budget** per meal turns its bar gold past 85%
  and rust past 100%.
- **Glycemic load** — `GI × (carbs − fiber) ÷ 100` per food, times servings,
  summed. Net (available) carbohydrate, because published GI tests and GL
  tables use it. Bands: low ≤ 10, medium 10–20, high ≥ 20, judged on the
  value shown — one decimal everywhere, the readout included; they are set
  for one serving, so a full meal reads strictly.
- **Glycemic index** — the carb-weighted average of the foods that have one
  (the mixed-meal method). Foods with no meaningful carbohydrate are left out
  rather than dragging it down. Bands: low ≤ 55, medium 56–69, high ≥ 70.
- **Quality score** — starts at 60; penalties for added sugar, saturated fat
  and refined starch per 100 cal, for trans-fat risk and hydrogenated oil,
  and for a low whole-food share; bonuses for fiber and protein density, a
  high whole-food share and a clean label. Rounded, kept within 0–100, graded
  A–F. Per calorie, so doubling every serving leaves it unchanged. The best
  reachable score is 88. **Totals** lists every rule a plate triggered.
- **Against a full day** — each nutrient as a share of its daily reference:
  green to 50%, gold to 75%, rust above, and "Over …" past 100%.
- **Weighing** — servings = weight ÷ the food's serving weight; every
  nutrient scales with servings, up to each food's maximum of 9.

Every split is made per food and then summed, with each part clamped at zero,
so label rounding never produces negative grams, and every percentage is
rounded so its bar totals exactly 100.

## Editing the food list

`data.js` is plain JSON after its first line. Per serving each food carries
calories, fat, saturated and trans fat, carbs (fiber included), fiber,
sugars, added sugar, refined carbs, protein (g), sodium and caffeine (mg), and:

| Field | Meaning |
| --- | --- |
| `grams` | What one serving weighs, in the state `weigh` names. |
| `measure` | `"g"`, or `"ml"` for drinks. |
| `weigh` | How to weigh it: `"dry, before cooking"`, `"peeled"`, `"as served"`. |
| `gramsApprox` | `true` when the weight is a typical one, not read off this product's label. Shown as ≈ with a note to check the package. |
| `gi` | Glycemic index; `0` means not applicable. `giSource` and `giNote` say where it came from. |
| `processed`, `wholeFood`, `animalProtein` | Processing level 0–3, whole-food share 0–1, share of the protein from animal sources 0–1. |
| `hydrogenatedOil`, `transFatRisk`, `animal` | The warning flags. |
| `gl` | Kept for reference; the app recomputes it. |

`DAILY` holds the reference values. Added sugar and protein can be set per
reader in Settings; the rest are fixed there.

Every load runs data checks — sugars and fiber within total carbs, added
sugar within sugars, the fat split, fractions in range, calories that match
their macros, a serving weight on every food, the stored GL — and the footer
reports them, with any failure also in the browser console.

## Settings

Ordered by how often a setting is touched:

| Setting | Default |
| --- | --- |
| Carbs to count | Total carbs |
| Carb choices | 15 g |
| Carb budget for a meal | None |
| Count by | Servings |
| Your body weight (sets protein at 0.8 g/kg) | Empty — 64 g, an 80 kg adult |
| Added sugar limit | 36 g (AHA, men); 25 g (women) |

Everything is kept in this browser only, in `localStorage` under
`meal.settings` and `meal.plate`. A plate saved by the earlier version of the
page (`fam_v3`) is carried over once; foods no longer on the menu are dropped.

## The look

The **Ru-Yi Style System**, Mode A (editorial), as reverse-engineered from
ruyimeditation.org. It replaces the Bodhi Precepts styling of the earlier
version entirely: no paper, no ink washes, no seal.

- **Surfaces.** White `#ffffff` and a cool grey-blue cream `#f5f6f8`
  alternate band by band down every view, never two of a colour together.
  Each view has exactly one near-black band, `#14181f`, before the footer,
  which is the same near-black. A search on Plate hides bands, so the ones
  left showing are striped again.
- **Type.** Playfair Display for headings, numbers and the small uppercase
  labels (eyebrows, card tags, column heads, 12–13px with wide tracking);
  Inter for body text at 18px / 1.6. Every hero headline has a second line
  in italic, rust-deep on light and pale gold on dark. Each band opens
  eyebrow → heading → a 72 × 3px rust rule.
- **Rust for fills, deep rust for text.** `#b8431c` paints rails, rules,
  buttons and the high band; `#8c2f12` is rust set as text on a light
  ground.
- **One accent per card.** Cards in a grid cycle rust, teal, violet, green,
  pink and orange by position. A card's accent draws its left rail, the
  blob bleeding off its top-right corner, its tag, and — on a device with a
  pointer — the coloured shadow it lifts on. A food on the plate turns
  *live*: its border and rail take the accent.
- **The pieces.** The sticky frosted header with the current view underlined
  on its bottom edge; on a phone, a drawer rendered outside the header. The
  verse card under the Plate hero — the one warm strip — with one of the
  Five Contemplations before a meal, chosen by the day of the year. Mission
  grids (a heading that sticks while numbered cards pass it) for the carbs
  on Totals and for Settings. Entry cards for glycemic load and index and
  for the day's limits. List rows for the food table and the GI reference.
  Two invitation banners at most per view, jade or maroon, at 118° with a
  ghost character: 量 *measure* to Look up, 藥 *medicine* to Settings.
- **Bands for blood sugar.** Low, medium and high are green `#2f9e44`, gold
  `#e0a93f` and rust `#b8431c` as fills, each with a deeper ink for text, and
  a grade is a gradient disc in its band colour.
- **Bars.** The energy split gives carbohydrate greens and blues, with
  refined starch and added sugar picked out in orange and pink; fat gold and
  brown, trans fat rust; protein violet and lilac. Bars and legend swatches
  use the same classes, so they cannot disagree.
- **Motion.** Each section rises 24px into view over 0.8s the first time it
  is seen, staggered; a hero's rule draws outward from the centre. A
  section already seen is redrawn without replaying, so a running total
  never blinks, and with reduced motion asked for nothing moves.
- **Layout.** A band has 110px of padding above and below and a 56px
  gutter; 80px and 32px from 1024px down, 56px and 22px from 640px. Grids
  drop from three columns to two at 1024px and to one at 640px (the mission
  grids and warnings stack at 900px), and the header's links become a menu
  button at 720px. On a phone the readout keeps to one row by leaving
  calories off it (they stay in the dark band and Totals), and at 360px and
  under the grade too.

There is one theme. Ru-Yi is a light system, so the earlier dark mode is
gone.

Where the system's own colours fall short of WCAG AA, this copy departs
from them, and only there:

- An accent fill is set as text only through a deeper ink of its own —
  teal `#0b7285`, green `#24733a`, orange `#b8420b`, pink `#c2255c`, gold
  `#8a5716`, sage `#3f7565` — as rust has `#8c2f12`. At full strength teal,
  green, orange, sage and gold fall short of AA as text, and pink does on
  cream.
- Footer column heads are `#d66a48`, the system's rust for dark grounds,
  not `#b8431c`, which measures 3.3:1 on `#14181f`.
- Below 1024px an invitation's text runs across the light end of its
  gradient, so that end is held a little darker; its button reads at 19px.

Every line of text meets WCAG AA, measured against the pixels actually
behind it, gradients and tints included.

## The foot of every view

Each view ends with the **Methodology**: first **what these numbers use** —
each rule as it actually stands, settings included, a star on the ones
Settings can change — then one closed note per topic (what the numbers mean,
weighing, counting carbohydrate, glycemic index and load, sources, daily
references, core calculations, the quality score, the day's limits and
warnings, charts, data checks, limitations, references). A link to
`#m-glycemic`, or any `#m-` note, opens that note.

Then the footer, in four columns: the name and 正事良藥，為療形枯; the views;
this copy (foods, data checks, the GI reference, installing); and the
sources.

## Checking a change

```
node tests/calc.test.js
python3 -m http.server 8000      # then open http://localhost:8000
```

Serve the repo root. Check a phone and a desktop width (320px to 1440px),
with motion on and with reduced motion, and watch for page errors, not only
for a picture that looks right.

## Open data questions

Found while reviewing, left for the person who knows the products:

- **Country Crock** is flagged as containing hydrogenated oil, but its
  ingredient text does not mention any.
- **Coffee Mate**: the nutrition (20 cal, 1 g fat per 15 ml tbsp) is the
  liquid creamer's, while the ingredient text (corn syrup solids,
  hydrogenated oil) is the powder's. Current liquid Original lists 2 g of
  carbohydrate per tablespoon, not 3.
- **Instant Oatmeal (Regular)**: a House Recipe plain packet found online is
  34 g, 130 cal and 23 g carbs; the list has 110 cal and 19 g, which fits a
  28 g packet. Check the packets served.
- **PB Pretzel Squares**: Kirkland's filled pretzel nuggets are 8 pieces,
  28 g, 130 cal and 15 g carbs; the list has 11 pieces, 150 cal and 18 g.

## Sources

- Nutrition: product Nutrition Facts labels; USDA FoodData Central for fresh
  fruit and household measures.
- Glycemic index: `gi-data.js`, compiled from Australian GI research; each
  food names its match or marks an estimate.
- Atkinson, Foster-Powell & Brand-Miller, *International tables of glycemic
  index and glycemic load values: 2008*, Diabetes Care 31:2281–3.
- Wolever & Jenkins, *The use of the glycemic index in predicting the blood
  glucose response to mixed meals*, Am J Clin Nutr 1986;43:167–72.
- American Heart Association (added sugar, saturated fat); WHO (trans fat);
  FDA Daily Values and caffeine guidance.
- Type: Inter (The Inter Project Authors) and Playfair Display (The
  Playfair Display Project Authors), both under the SIL Open Font License
  1.1; the licences are in `fonts/`.
