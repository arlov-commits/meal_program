/* Formula checks for Food as Medicine.
   Runs the calculation layer — the block between @calc:start and @calc:end
   in index.html — against data.js, with expectations worked out by hand.
   No dependencies:  node tests/calc.test.js  */
"use strict";
var fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert");
var root = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var block = html.slice(html.indexOf("/* @calc:start"), html.indexOf("/* @calc:end"));
var sandbox = { window: {}, Intl: Intl };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), sandbox);
vm.runInContext(block + "\n;this.api = { computeMeal: computeMeal, itemGlycemic: itemGlycemic, portionGlycemic: portionGlycemic," +
  " giBand: giBand, glBand: glBand, roundPercents: roundPercents, sanitizePlate: sanitizePlate, parseAmount: parseAmount," +
  " runDataChecks: runDataChecks, fmtNum: fmtNum, gramStep: gramStep, SCORE_MAX_REACHABLE: SCORE_MAX_REACHABLE };", sandbox);
var A = sandbox.api, DATA = sandbox.window.MEAL_DATA;
var plain = function (v) { return JSON.parse(JSON.stringify(v)); };   /* values from the sandbox carry its prototypes */
var index = {};
DATA.CATEGORIES.forEach(function (c, ci) { c.items.forEach(function (item) { index[item.id] = { item: item, category: { name: c.name, index: ci } }; }); });
var REFS = DATA.DAILY;
function meal(q, opts) {
  return A.computeMeal(Object.keys(q).map(function (id) { return { item: index[id].item, qty: q[id], category: index[id].category }; }), REFS,
    opts || { count: "total", choice: 15, budget: 0 });
}
function near(a, b, tol, what) { assert.ok(Math.abs(a - b) <= (tol || 1e-9), (what || "") + " expected " + b + ", got " + a); }
var passed = 0;
function t(name, fn) { fn(); passed++; console.log("  ✓ " + name); }

t("GL uses net (available) carbs: oats 55 × (27 − 4) ÷ 100 = 12.65", function () {
  var g = A.itemGlycemic(index.quaker_oats.item); near(g.avail, 23); near(g.gl, 12.65);
});
t("GI and GL bands follow the published cut-offs on the value shown", function () {
  assert.strictEqual(A.giBand(55).key, "low"); assert.strictEqual(A.giBand(55.4).key, "low");
  assert.strictEqual(A.giBand(55.5).key, "medium"); assert.strictEqual(A.giBand(69).key, "medium"); assert.strictEqual(A.giBand(70).key, "high");
  assert.strictEqual(A.glBand(10).key, "low"); assert.strictEqual(A.glBand(10.04).key, "low"); assert.strictEqual(A.glBand(10.05).key, "medium");
  assert.strictEqual(A.glBand(19.94).key, "medium"); assert.strictEqual(A.glBand(19.95).key, "high");
});
t("Foods with no GI do not dilute the meal GI", function () {
  var g = meal({ bagel: 1, string_cheese: 2 }).glycemic; near(g.gi, 72); near(g.gl, 18.72); near(g.unratedCarbs, 2);
});
t("Mixed meal: 574 cal, score 47 (D), GL 39.0, GI 52, 87 g carbs = 5.8 choices", function () {
  var m = meal({ quaker_oats: 2, banana: 1, skippy: 1, country_crock: 1, coffeemate: 1, nescafe: 1 });
  near(m.kcal, 574); near(m.parts.fiber, 12.1, 1e-9); near(m.parts.satFat, 4.6, 1e-9);
  assert.strictEqual(m.score.value, 47); assert.strictEqual(m.score.grade, "D");
  assert.deepStrictEqual(plain(m.score.applied.map(function (r) { return [r.id, r.delta]; })), [["trans", -12], ["hyd", -6], ["fiber", 5]]);
  near(m.glycemic.gl, 25.3 + 11.472 + 0.28 + 1.95, 1e-9); assert.strictEqual(Math.round(m.glycemic.gi), 52);
  near(m.carbs.total, 87); near(m.carbs.net, 74.9, 1e-9); near(m.carbs.choices, 87 / 15);
});
t("Carb count follows the setting: net carbs, 10 g choices, a 60 g budget", function () {
  var c = meal({ quaker_oats: 2, banana: 1 }, { count: "net", choice: 10, budget: 60 }).carbs;
  near(c.counted, 46 + 23.9, 1e-9); near(c.choices, 6.99, 1e-9); near(c.budgetPct, 69.9 / 60 * 100, 1e-9);
  var off = meal({ apple: 1 }, { count: "total", choice: 0, budget: 0 }).carbs;
  assert.strictEqual(off.choices, null); assert.strictEqual(off.budget, null);
});
t("Fractional servings scale every figure: 150 g of a 182 g apple", function () {
  var q = 150 / 182, m = meal({ apple: q });
  near(m.carbs.total, 25 * q, 1e-9); near(m.glycemic.gl, 36 * 20.6 / 100 * q, 1e-9); near(m.rows[0].grams, 150, 1e-9);
});
t("A label portion: 62 g of a 40 g serving with 27 g carbs, 4 g fiber, GI 55", function () {
  var f = 62 / 40, p = A.portionGlycemic(27 * f, 4 * f, 55);
  near(p.avail, 23 * f, 1e-9); near(p.gl, 55 * 23 * f / 100, 1e-9);
  assert.strictEqual(A.portionGlycemic(10, 2, 0).gl, null);
});
t("Amounts typed as 1.5, 1,5, 1/2, 1 1/2 and ½ all read; nonsense does not", function () {
  assert.strictEqual(A.parseAmount("1.5"), 1.5); assert.strictEqual(A.parseAmount("1,5"), 1.5);
  assert.strictEqual(A.parseAmount("1/2"), 0.5); assert.strictEqual(A.parseAmount("1 1/2"), 1.5);
  assert.strictEqual(A.parseAmount("½"), 0.5); assert.strictEqual(A.parseAmount("1½"), 1.5);
  assert.strictEqual(A.parseAmount(".5"), 0.5); assert.strictEqual(A.parseAmount(""), 0);
  assert.strictEqual(A.parseAmount("abc"), null); assert.strictEqual(A.parseAmount("1/0"), null);
});
t("Every warning lists every flagged food (Country Crock under hydrogenated oils)", function () {
  var f = meal({ skippy: 1, country_crock: 1, coffeemate: 1 }).flags.list;
  var hyd = f.filter(function (x) { return x.key === "hyd"; })[0];
  assert.deepStrictEqual(plain(hyd.items.map(function (i) { return i.id; })), ["skippy", "country_crock", "coffeemate"]);
});
t("Carbs by food group come from each food's section", function () {
  var c = meal({ steel_oats: 1, apple: 1 }).carbCharts.filter(function (x) { return x.id === "source"; })[0];
  assert.deepStrictEqual(plain(c.segments.map(function (s) { return [s.label, s.value]; })), [["Base", 27], ["Fruit", 25]]);
});
t("Percentages always total 100", function () {
  var m = meal({ quaker_oats: 2, banana: 1, skippy: 1, jam: 3, mm: 1 });
  m.carbCharts.forEach(function (c) { assert.strictEqual(c.segments.reduce(function (a, s) { return a + s.pct; }, 0), 100); });
  for (var i = 0; i < 200; i++) {
    var v = [0, 1, 2, 3, 4, 5, 6].map(function () { return Math.random() * 50; });
    assert.strictEqual(A.roundPercents(v).reduce(function (a, b) { return a + b; }, 0), 100);
  }
});
t("Past a limit the line says so and the bar stays inside its track", function () {
  var as = meal({ sugar: 9, jam: 3 }).limits.filter(function (x) { return x.key === "addedSugar"; })[0];
  near(as.value, 60); assert.ok(as.over); assert.strictEqual(as.context, "Over daily limit"); assert.strictEqual(as.fills[0].width, 100);
});
t("Protein is one bar, plant and animal, never wider than its track", function () {
  var p = meal({ string_cheese: 9, babybel: 9, tillamook: 9, mixed_nuts: 4 }).targets.filter(function (x) { return x.key === "protein"; })[0];
  near(p.value, 164); assert.ok(p.fills.reduce(function (a, f) { return a + f.width; }, 0) <= 100 + 1e-9);
});
t("A zero-calorie plate is not graded", function () { assert.strictEqual(meal({ stevia: 2 }).score, null); });
t("Saved plates drop unknown foods and keep servings within (0, max]", function () {
  assert.deepStrictEqual(plain(A.sanitizePlate({ trailmix: 2, apple: 15, banana: 0, orange: 1.25, tea: -1 }, index)), { apple: 9, orange: 1.25 });
});
t("Weight steps suit the serving: 1 g for sugar, 5 g for oats, 10 g for an apple", function () {
  assert.strictEqual(A.gramStep(index.sugar.item), 1); assert.strictEqual(A.gramStep(index.steel_oats.item), 5); assert.strictEqual(A.gramStep(index.apple.item), 10);
});
t("The best possible plate reaches the documented maximum of 88", function () {
  var best = A.computeMeal([{ item: { id: "x", name: "x", cal: 100, carbs: 10, fiber: 3, protein: 5, wholeFood: 1 }, qty: 1, category: { name: "c", index: 0 } }], REFS);
  assert.strictEqual(best.score.value, 88); assert.strictEqual(A.SCORE_MAX_REACHABLE, 88);
});
t("Numbers are grouped, keep one decimal for grams, and never show -0", function () {
  assert.strictEqual(A.fmtNum(2300, "mg"), "2,300 mg"); assert.strictEqual(A.fmtNum(12.06, "g"), "12.1 g"); assert.strictEqual(A.fmtNum(-0.01, "g"), "0.0 g");
});
t("data.js passes every data check", function () {
  var r = A.runDataChecks(DATA);
  assert.strictEqual(r.failed, 0, JSON.stringify(plain(r.results.filter(function (x) { return x.failures.length; }))));
  assert.strictEqual(r.foods, 33);
});
console.log("\n" + passed + " checks passed");
