/* Food as Medicine, offline.
   The whole app is a handful of static files, so the service worker keeps a
   copy of all of them and serves from it. A file added to the app must be
   added to SHELL too, or an installed copy will not have it offline. Bump
   CACHE only to force every client to throw its copy away; ordinary edits do
   not need it, because each response is refreshed as it is served. */
var CACHE = "meal-v3";
var SHELL = [
  "./",
  "index.html",
  "data.js",
  "gi-data.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-32.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
  "fonts/inter-latin.woff2",
  "fonts/inter-latin-ext.woff2",
  "fonts/playfair-display-latin.woff2",
  "fonts/playfair-display-latin-ext.woff2",
  "fonts/playfair-display-italic-latin.woff2",
  "fonts/playfair-display-italic-latin-ext.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      return k === CACHE ? null : caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

/* The page is fetched fresh when there is a network, so a fix is there the
   moment it is published rather than one launch late; the fetch races a
   short timer so a slow connection cannot hang the launch, and the copy on
   the device wins if the network is not back in time. */
var PAGE_WAIT = 2500;
function navigate(e, cache) {
  var req = e.request;
  var fresh = fetch(req).then(function (res) {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  var patience = new Promise(function (resolve) {
    setTimeout(function () { resolve(null); }, PAGE_WAIT);
  });
  return Promise.race([fresh["catch"](function () { return null; }), patience])
    .then(function (res) {
      if (res) return res;
      return cache.match(req).then(function (hit) {
        return hit || cache.match("index.html") || fresh;
      });
    });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    if (req.mode === "navigate") return navigate(e, cache);
    return cache.match(req).then(function (hit) {
      /* fetched alongside whatever is served, so an edit to data.js lands
         in the cache now and shows at the next launch */
      var fresh = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })["catch"](function () { return null; });
      if (hit) return hit;
      return fresh.then(function (res) {
        if (res) return res;
        return req.mode === "navigate" ? cache.match("index.html") : Response.error();
      });
    });
  }));
});
