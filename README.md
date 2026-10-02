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
| `index.html` | The whole app: markup, CSS and vanilla ES5 in one file. Four views — **Plate**, **Totals**, **Look up**, **Settings** — and a footer with the Methodology. |
| `data.js` | The food list and the daily reference values, as `window.MEAL_DATA`. Edited by hand. A script tag rather than a fetched file, so the app works over `file://`. |
| `gi-data.js` | The glycemic-index reference — 150 foods in 11 categories, glucose = 100 — as `window.GI_TABLE`. Read by Look up. |
| `manifest.webmanifest` | Makes it installable: name, icons, standalone display. |
| `sw.js` | The service worker. Keeps a copy of the app so an installed one opens offline. |
| `icon.svg` | The icon: a cinnabar seal carrying a bowl with a leaf rising from it. The source every PNG is cut from. |
| `icon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Rasterised from `icon.svg`. Never edit a PNG; redraw the SVG and re-render them together. |
| `tests/calc.test.js` | Formula checks: `node tests/calc.test.js`. Runs the calculation layer out of `index.html` against `data.js`. |
| `breakfast_builder.jsx` | The first prototype, kept for history. Nothing loads it and its numbers are out of date. |

## Installing it

- **Android, and Chrome or Edge on a desktop**: Settings shows an **Install
  Food as Medicine** button whenever the browser offers one; the browser's
  own menu or address bar offers it too.
- **iPhone and iPad**: Safari's Share button, then **Add to Home Screen**.
  Settings says so when it sees an iOS browser.

Installed, it opens in its own window and works with no connection. The page
is fetched fresh whenever there is a network, racing a 2.5-second timer so a
slow connection cannot hang the launch. Opened straight off the disk it
registers no service worker and needs none.

## Weighing a meal

1. On **Plate**, set **Count by** to **Weight**.
2. Weigh each food **in the state its row names**: oats *dry, before
   cooking*; banana and orange *peeled*; apple *with skin, without the core*;
   drinks *as poured* (1 ml taken as 1 g). One serving is defined that way,
   so weighing cooked oatmeal — which holds several times its weight in
   water — would multiply the carbs.
3. Type the scale's reading into the row. The row answers at once with
   servings, carbs and glycemic load; the readout pinned to the top of the
   view carries the plate's carbs, carb choices, GL, GI, calories and grade.
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
  10 g). An optional **carb budget** per meal turns amber past 85% and
  cinnabar past 100%.
- **Glycemic load** — `GI × (carbs − fiber) ÷ 100` per food, times servings,
  summed. Net (available) carbohydrate, because published GI tests and GL
  tables use it. Bands: low ≤ 10, medium 10–20, high ≥ 20, judged on the
  value shown; they are set for one serving, so a full meal reads strictly.
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
  green to 50%, amber to 75%, cinnabar above, and "Over …" past 100%.
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

The theme sits in the masthead and cycles **auto**, light and dark. Auto
follows the **device clock** — light from 6am to 6pm — and is rechecked
while the page is left open.

Everything is kept in this browser only, in `localStorage` under
`meal.settings` and `meal.plate`. A plate saved by the earlier version of the
page (`fam_v3`) is carried over once; foods no longer on the menu are dropped.

## The look

The house style of Bodhi Precepts. Sumi: ink on warm paper, hairline rules, a
lot of empty space, and **cinnabar for what matters** — here a high glycemic
load, added sugar, trans fat, a limit passed. Cinnabar means the same thing
everywhere it appears, which is what lets it be read at a glance.

Dark is evening ink: diluted 墨 is a blue-grey, so the ground is slate rather
than soot, the strokes are warm paper and the cinnabar dries to clay.

The masthead sets 正事良藥 over *Food as Medicine*. It is the fourth of the
Five Contemplations before a meal — 正事良藥，為療形枯, take this food as good
medicine, to treat the body's weakness.

The three macro families take muted earths — slate for carbohydrate, ochre
for fat, sage for protein — so they sit beside the cinnabar instead of
competing with it. Within a family the sub-type is a texture drawn in the
panel colour, as if the paper showed through: dots for fiber, rules for
natural sugar, a hatch for refined starch and saturated fat. Added sugar and
trans fat leave the family colour for cinnabar. Bars and legend swatches use
the same classes, so they cannot disagree. The ochre is deepened when it is
set as text, where the fill colour fell short of contrast.

A grade is pressed as a seal stamp in the colour of its band. Low, medium and
high bands are a moss green, an ochre and the cinnabar.

On Plate the readout is pinned to the top of the scroll, so the numbers being
counted never leave the screen. Food rows carry their carbs per serving and
GI as square tags; a food on the plate takes a cinnabar wash and a leading
rule.

The tabs are drawn twice from one list: a bar across the foot of a phone,
and from 820px a narrow rail down the left. The bar is **in ordinary flow**
at the foot of a column one viewport tall, never `position:fixed` — a fixed
bar hangs below the glass on Android Chrome and nothing from script can
correct it. So `#scroll`, not the document, is what scrolls.

Every text colour meets WCAG AA in both themes, measured against the real
composited ground. Fonts are the system's, so nothing has to download.

## The footer

It opens with **what these numbers use** — each rule as it actually stands,
settings included, a star on the ones Settings can change — then the data
checks, then the **Methodology**: one closed note per topic (weighing,
counting carbohydrate, glycemic index and load, sources, daily references,
core calculations, the quality score, warnings, charts, data checks,
limitations, references).

## Checking a change

```
node tests/calc.test.js
python3 -m http.server 8000      # then open http://localhost:8000
```

Serve the repo root. Check both themes and both a phone and a desktop width,
and watch for page errors, not only for a picture that looks right.

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
