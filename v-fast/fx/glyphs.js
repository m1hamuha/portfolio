/* fx/glyphs.js: the advised card of a business page (#/for/<business>), the page's only motion.
   Every task card shows one short, still loss line (app.js paints it: .cc__ll with a loss span and
   a gain span). On the advised card (.cc--top) one story plays once:
     1. its label ("you lose most here") slides in (0.2s), alone;
     2. the loss line stays 1.5s;
     3. it crossfades (0.3s) into that task's gain line in lime, which stays.
   It plays when the card is at least 60% on screen. Seen once in this visit: the gain shows at once.
   Reduced motion: no slide, no crossfade, the loss line only (it is the reason to tap).
   The name stays "glyphs" (build order, window.FXGlyphs used by fx/retention). */
(function () {
  "use strict";
  var D = document, W = window;
  if (W.__fxGlyphs) return;
  W.__fxGlyphs = true;

  var LABEL_MS = 250, HOLD_MS = 1500;
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }

  if (!D.getElementById("fx-glyphs")) {
    var st = D.createElement("style");
    st.id = "fx-glyphs";
    st.textContent = [
      "@keyframes fxgTop{from{translate:0 -6px;opacity:0}to{translate:0 0;opacity:1}}",
      ".fxg-top-in .cc__top{animation:fxgTop .2s ease-out both}",
      /* until its story starts, the label of the advised card waits (no flash before the slide) */

      "@media (prefers-reduced-motion:reduce){.fxg-top-in .cc__top{animation:none}}"
    ].join("");
    D.head.appendChild(st);
  }

  var seen = {};  /* "niche/task" -> the story played in this visit */
  var cur = null; /* { card, key, io, t1, t2 } */

  function niche() { var m = location.hash.match(/^#\/for\/([a-z]+)$/); return m ? m[1] : null; }
  function keyOf(card) { var m = (card.getAttribute("href") || "").match(/^#\/for\/([a-z]+\/[a-z]+)$/); return m ? m[1] : null; }

  function stop() {
    if (!cur) return;
    if (cur.io) cur.io.disconnect();
    clearTimeout(cur.t1); clearTimeout(cur.t2);
    cur.card.classList.remove("fxg-top-in", "fxg-still");
    if (!seen[cur.key]) cur.card.classList.remove("is-gain");
    cur = null;
  }

  function play() {
    if (!cur || cur.started) return;
    cur.started = true;
    if (cur.io) cur.io.disconnect();
    var c = cur, card = c.card;
    var lab = card.querySelector(".cc__top");
    if (lab && lab.hasAttribute("data-fxrt-i18n")) card.classList.add("fxg-still"); /* fx/retention slides its own label */
    else { card.classList.remove("fxg-top-in"); void card.offsetWidth; card.classList.add("fxg-top-in"); }
    /* the label first, then the loss holds, then the change */
    c.t1 = setTimeout(function () {
      c.t2 = setTimeout(function () {
        if (cur !== c) return;
        card.classList.add("is-gain");
        seen[c.key] = 1;
        /* the story is over: the next motion (the assistant's arc, fx/fab.js) may start after the crossfade */
        setTimeout(function () { W.dispatchEvent(new Event("fx:biz")); }, 350);
      }, HOLD_MS);
    }, LABEL_MS);
  }

  function setup() {
    stop();
    var n = niche(); if (!n) return;
    var sec = D.getElementById("n-" + n);
    if (!sec || sec.hidden) return;
    /* a card that lost the label (fx/retention moved it) shows its loss again */
    [].forEach.call(sec.querySelectorAll(".cc.is-gain:not(.cc--top)"), function (c) { c.classList.remove("is-gain"); });
    var card = sec.querySelector(".cc--top"), key = card && keyOf(card);
    if (!card) return;
    var g = card.querySelector(".cc__ll-g");
    if (!key || !g || !g.textContent) { card.classList.add("fxg-still"); return; } /* nothing to change: the label just stays */
    if (reduced()) { card.classList.remove("is-gain"); return; }
    if (seen[key]) { card.classList.add("is-gain"); return; }
    card.classList.remove("is-gain");
    cur = { card: card, key: key, io: null, t1: 0, t2: 0, started: false };
    if ("IntersectionObserver" in W) {
      cur.io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio >= 0.6 && !D.hidden) play(); });
      }, { threshold: [0, 0.6, 1] });
      cur.io.observe(card);
    } else play();
  }

  var tm = 0;
  function later() { clearTimeout(tm); tm = setTimeout(setup, 60); } /* after the page has painted its cards */

  W.addEventListener("vf:route", function () { stop(); later(); });
  W.addEventListener("hashchange", function () { if (!niche()) stop(); });
  /* a hidden tab: start again when it is visible, so nobody misses the change */
  D.addEventListener("visibilitychange", function () {
    if (D.hidden && cur && cur.started && !seen[cur.key]) { setup(); return; }
    if (!D.hidden && cur && !cur.started) {
      var r = cur.card.getBoundingClientRect();
      if (r.height && r.top >= -r.height * 0.4 && r.bottom <= W.innerHeight + r.height * 0.4) play();
    }
  });
  if (mq) {
    var onRm = function () { if (niche()) setup(); };
    if (mq.addEventListener) mq.addEventListener("change", onRm); else if (mq.addListener) mq.addListener(onRm);
  }
  W.FXGlyphs = { setup: setup, kill: stop };
  if (niche()) later();
})();
