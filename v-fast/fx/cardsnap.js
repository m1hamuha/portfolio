/* fx/cardsnap: the centre card on the home carousel (spec 3.1 B and C).
   B) When the carousel settles on a card, its task icons light up one by one (grey to lime, one hop
      each) and the business icon makes its own small gesture. At most 2 times per card per visit.
      Side cards stay still.
   C) If nobody touches or scrolls for 5s after load, the lime arrow of the centre card "breathes"
      once (scale plus a fading ring). At most 2 times; any pointerdown, wheel, key or scroll cancels.
   Adds no text. Motion uses transform and opacity only (the icon colour is a short CSS transition).
   Reduced motion: nothing moves, the centre card shows its final frame (lime icons). */
(function () {
  "use strict";
  var D = document, W = window, root = D.documentElement;
  if (!D.getElementById("work") || W.__fxCardsnap) return;
  W.__fxCardsnap = true;

  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function gs() { return W.gsap || null; }

  var MAX_SNAP = 2, MAX_BREATH = 2, IDLE_MS = 5000, SETTLE_MS = 90, STAGGER = 0.08, KEY = "fx.cardsnap";
  var GREY = "#5a5a5a";

  /* ---------- CSS (once) ---------- */
  if (!D.getElementById("fx-cardsnap")) {
    var st = D.createElement("style");
    st.id = "fx-cardsnap";
    st.textContent = [
      /* the old endless hop is replaced by one hop per snap */
      ".fxcs #work .cc__mini .ico { animation: none !important; transition: color 0.25s ease; }",
      ".fxcs #work .cc.mid:not(.fxcs-lit) .cc__mini .ico:not(.fxcs-on) { color: " + GREY + "; }",
      ".fxcs #work .cc.mid .cc__mini .ico.fxcs-on { color: var(--accent, #d8ff00); }",
      /* side cards stay still: their rings do not turn */
      ".fxcs #work .cc:not(.mid) .cc__art::before, .fxcs #work .cc:not(.mid) .cc__art::after { animation-play-state: paused; }",
      ".fxcs #work .cc:not(.mid) .cc__art::before { opacity: 0.5; }",
      ".fxcs-g { transform-box: fill-box; transform-origin: 50% 50%; }",
      ".fxcs #work .cc__go { position: relative; }",
      ".fxcs-ring { position: absolute; inset: -1.5px; border-radius: 50%; border: 2px solid var(--accent, #d8ff00); opacity: 0; pointer-events: none; transform: scale(1); }",
      /* CSS fallback when GSAP is missing */
      "@keyframes fxcsHop { 0%, 100% { transform: none; } 50% { transform: translateY(-5px); } }",
      "@keyframes fxcsTilt { 0%, 100% { transform: none; } 50% { transform: rotate(var(--fxcs-r, 0deg)) translateY(var(--fxcs-y, 0px)) scale(var(--fxcs-s, 1)); } }",
      "@keyframes fxcsBreath { 0%, 100% { transform: none; } 45% { transform: scale(1.06); } }",
      "@keyframes fxcsRing { 0% { opacity: 0.5; transform: scale(1); } 100% { opacity: 0; transform: scale(var(--fxcs-k, 1.5)); } }",
      ".fxcs-css .fxcs-hop { animation: fxcsHop 0.9s ease-in-out 1 both; animation-delay: var(--fxcs-d, 0s); }",
      ".fxcs-css .fxcs-tilt { animation: fxcsTilt 0.6s ease-in-out 1 both; animation-delay: 0.15s; }",
      ".fxcs-css .fxcs-br { animation: fxcsBreath 0.9s ease-in-out 1 both; }",
      ".fxcs-css .fxcs-br .fxcs-ring { animation: fxcsRing 0.9s ease-out 1 both; }",
      ".fxcs-pause .fxcs-hop, .fxcs-pause .fxcs-tilt, .fxcs-pause .fxcs-br, .fxcs-pause .fxcs-br .fxcs-ring { animation-play-state: paused; }",
      "@media (prefers-reduced-motion: reduce) {",
      "  .fxcs #work .cc.mid .cc__mini .ico { color: var(--accent, #d8ff00) !important; }",
      "  .fxcs-ring { display: none; }",
      "}"
    ].join("\n");
    D.head.appendChild(st);
  }
  root.classList.add("fxcs");

  /* ---------- state ---------- */
  var work = D.getElementById("work"), track = work.querySelector(".car__track"), home = D.getElementById("home");
  var counts = {};
  try { counts = JSON.parse(sessionStorage.getItem(KEY) || "{}") || {}; } catch (e) { counts = {}; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(counts)); } catch (e) {} }
  function keyOf(card) { return "c:" + ((card.getAttribute("href") || "").split("/").pop() || "x"); }

  var active = false, inView = true, mo = null, settleT = 0, lastX = 0, lastCard = null, pending = null;
  var snapTl = null, snapCard = null, snapCssT = 0;
  var breathN = 0, breathOff = false, idleT = 0, breathTl = null, breathEl = null, breathCssT = 0, y0 = 0;

  function cards() { return Array.prototype.slice.call(track ? track.querySelectorAll(".cc") : []); }
  function midCard() { return track ? track.querySelector(".cc.mid") : null; }
  function homeShown() { return !!home && !home.hidden && work.offsetParent !== null; }
  function canPlay() { return active && inView && !D.hidden && !reduced(); }
  function listMode() { return track && getComputedStyle(track).flexDirection === "column"; }

  /* ---------- B: snap of the centre card ---------- */
  function minis(card) { return Array.prototype.slice.call(card.querySelectorAll(".cc__mini .ico")); }
  function artG(card) {
    var svg = card.querySelector(".cc__art svg"); if (!svg) return null;
    var g = svg.querySelector("g.fxcs-g"); if (g) return g;
    var use = svg.querySelector("use"); if (!use) return null;
    g = D.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "fxcs-g");
    svg.insertBefore(g, use); g.appendChild(use);
    return g;
  }
  function gesture(card) {
    var g = artG(card); if (!g) return null;
    var u = g.querySelector("use"), id = u ? (u.getAttribute("href") || u.getAttribute("xlink:href") || "") : "";
    if (/scissors/.test(id)) return { g: g, rotation: -14 };
    if (/coffee|cup/.test(id)) return { g: g, y: -3 };
    if (/wrench|hammer/.test(id)) return { g: g, rotation: 20 };
    if (/dumbbell/.test(id)) return { g: g, y: -4 };
    return { g: g, scale: 1.08 };
  }
  function finalFrame(card) {
    if (!card) return;
    card.classList.add("fxcs-lit");
    minis(card).forEach(function (m) { m.classList.add("fxcs-on"); m.classList.remove("fxcs-hop"); m.style.removeProperty("--fxcs-d"); m.style.transitionDelay = ""; });
    var g = card.querySelector("g.fxcs-g");
    if (g) { g.classList.remove("fxcs-tilt"); if (gs()) gs().set(g, { clearProps: "transform" }); }
    if (gs()) gs().set(minis(card), { clearProps: "transform" });
  }
  function killSnap() {
    if (snapTl) { snapTl.kill(); snapTl = null; }
    clearTimeout(snapCssT);
    if (snapCard) { finalFrame(snapCard); snapCard = null; }
  }
  function snap(card) {
    killSnap();
    var k = keyOf(card);
    if (reduced() || (counts[k] || 0) >= MAX_SNAP) { finalFrame(card); return; }
    if (!canPlay()) { pending = card; return; }
    pending = null;
    counts[k] = (counts[k] || 0) + 1; save();
    var ms = minis(card), gx = gesture(card), G = gs();
    card.classList.remove("fxcs-lit");
    /* start from grey at once: no lime to grey fade before the first icon lights (that read as a flicker) */
    ms.forEach(function (m) { m.style.transition = "none"; m.style.transitionDelay = ""; m.classList.remove("fxcs-on", "fxcs-hop"); });
    if (ms.length) void ms[0].getBoundingClientRect();
    ms.forEach(function (m) { m.style.transition = ""; });
    snapCard = card;
    if (G) {
      var tl = G.timeline({ onComplete: function () { if (snapTl === tl) { snapTl = null; finalFrame(card); snapCard = null; } } });
      ms.forEach(function (m, i) {
        var t = i * STAGGER;
        tl.call(function () { m.classList.add("fxcs-on"); }, null, t);
        tl.to(m, { y: -5, duration: 0.24, ease: "power2.out" }, t);
        tl.to(m, { y: 0, duration: 0.36, ease: "power2.in" }, t + 0.24);
      });
      if (gx) {
        var to = { duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 1, transformOrigin: "50% 50%" };
        if (gx.rotation) to.rotation = gx.rotation;
        if (gx.y) to.y = gx.y;
        if (gx.scale) to.scale = gx.scale;
        tl.to(gx.g, to, 0.15);
      }
      snapTl = tl;
      if (!canPlay()) tl.pause();
    } else {
      root.classList.add("fxcs-css");
      ms.forEach(function (m, i) {
        m.style.setProperty("--fxcs-d", (i * STAGGER).toFixed(2) + "s");
        m.style.transitionDelay = (i * STAGGER).toFixed(2) + "s";
        m.classList.add("fxcs-hop", "fxcs-on");
      });
      if (gx) {
        gx.g.style.setProperty("--fxcs-r", (gx.rotation || 0) + "deg");
        gx.g.style.setProperty("--fxcs-y", (gx.y || 0) + "px");
        gx.g.style.setProperty("--fxcs-s", String(gx.scale || 1));
        gx.g.classList.remove("fxcs-tilt"); void gx.g.getBoundingClientRect(); gx.g.classList.add("fxcs-tilt");
      }
      snapCssT = setTimeout(function () { ms.forEach(function (m) { m.style.transitionDelay = ""; }); finalFrame(card); snapCard = null; }, (ms.length * STAGGER + 1) * 1000);
    }
  }

  /* settle: the track stopped moving and nobody is dragging */
  function onMutate() {
    if (!active) return;
    /* a card past its limit shows its final frame the moment it reaches the centre (no grey flash) */
    var m = midCard();
    if (m && (reduced() || (counts[keyOf(m)] || 0) >= MAX_SNAP) && !m.classList.contains("fxcs-lit")) finalFrame(m);
    if (!settleT) { lastX = tx(); settleT = setTimeout(settled, SETTLE_MS); }
  }
  /* the glide eases out slowly; "settled" means it moves less than 6px in one check */
  function tx() { var m = /translate3d\(\s*(-?[\d.]+)px/.exec(track ? track.style.transform : ""); return m ? parseFloat(m[1]) : 0; }
  function settled() {
    settleT = 0;
    if (!active || !track || listMode()) return;
    var x = tx(), moving = Math.abs(x - lastX) >= 6;
    lastX = x;
    if (moving || track.classList.contains("drag")) { settleT = setTimeout(settled, SETTLE_MS); return; }
    var m = midCard();
    if (!m || m === lastCard) return;
    if (snapCard && snapCard !== m) killSnap();
    lastCard = m;
    snap(m);
  }

  /* ---------- C: the arrow breathes ---------- */
  function goOf() { var m = midCard(); return m ? m.querySelector(".cc__go") : null; }
  function ringOf(go) {
    var r = go.querySelector(".fxcs-ring");
    if (!r) { r = D.createElement("span"); r.className = "fxcs-ring"; r.setAttribute("aria-hidden", "true"); go.appendChild(r); }
    return r;
  }
  function killBreath() {
    if (breathTl) { breathTl.kill(); breathTl = null; }
    clearTimeout(breathCssT);
    if (breathEl) {
      breathEl.classList.remove("fxcs-br");
      var r = breathEl.querySelector(".fxcs-ring");
      if (gs()) { gs().set(breathEl, { clearProps: "transform" }); if (r) gs().set(r, { clearProps: "transform,opacity" }); }
      breathEl = null;
    }
  }
  function armIdle() {
    clearTimeout(idleT);
    if (breathOff || breathN >= MAX_BREATH || reduced() || !active) return;
    idleT = setTimeout(breathe, IDLE_MS);
  }
  function breathe() {
    if (breathOff || breathN >= MAX_BREATH || reduced() || !active) return;
    if (!canPlay() || (track && track.classList.contains("drag"))) { idleT = 0; return; } /* re-armed when visible again */
    var go = goOf(); if (!go) return;
    breathN++;
    killBreath();
    breathEl = go;
    var ring = ringOf(go), w = go.offsetWidth || 54, k = (w + 28) / w, G = gs(), done = function () { killBreath(); armIdle(); };
    if (G) {
      var tl = G.timeline({ onComplete: function () { if (breathTl === tl) { breathTl = null; done(); } } });
      tl.to(go, { scale: 1.06, duration: 0.4, ease: "sine.out" }, 0)
        .to(go, { scale: 1, duration: 0.5, ease: "sine.inOut" }, 0.4)
        .fromTo(ring, { opacity: 0.5, scale: 1 }, { opacity: 0, scale: k, duration: 0.9, ease: "power2.out" }, 0);
      breathTl = tl;
    } else {
      root.classList.add("fxcs-css");
      go.style.setProperty("--fxcs-k", k.toFixed(3));
      go.classList.add("fxcs-br");
      breathCssT = setTimeout(done, 950);
    }
  }
  function cancelBreath() {
    if (breathOff) return;
    breathOff = true; clearTimeout(idleT); killBreath();
  }
  function onUser() { cancelBreath(); }
  function onScroll() { if (Math.abs((W.pageYOffset || 0) - y0) > 4) cancelBreath(); }

  /* ---------- pause and resume ---------- */
  function syncPlay() {
    var ok = canPlay();
    root.classList.toggle("fxcs-pause", !ok);
    if (snapTl) { if (ok) snapTl.resume(); else snapTl.pause(); }
    if (breathTl) { if (ok) breathTl.resume(); else breathTl.pause(); }
    if (ok && pending && pending === midCard()) snap(pending);
    if (ok && !idleT && !breathTl && !breathEl) armIdle();
  }
  D.addEventListener("visibilitychange", syncPlay);
  if ("IntersectionObserver" in W) {
    new IntersectionObserver(function (es) { inView = es[es.length - 1].intersectionRatio > 0.25; syncPlay(); }, { threshold: [0, 0.25, 0.5] }).observe(work);
  }
  if (mq) {
    var onMq = function () { if (reduced()) { killSnap(); cancelBreath(); cards().forEach(function (c) { if (c.classList.contains("mid")) finalFrame(c); }); } };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---------- lifecycle ---------- */
  function start() {
    if (active || !homeShown()) return;
    active = true;
    lastCard = null;
    if (!mo && "MutationObserver" in W && track) {
      mo = new MutationObserver(onMutate);
      mo.observe(track, { attributes: true, attributeFilter: ["style", "class"] });
      cards().forEach(function (c) { mo.observe(c, { attributes: true, attributeFilter: ["class"] }); });
    }
    onMutate();
    syncPlay();
  }
  function stop() {
    active = false; pending = null; lastCard = null;
    clearTimeout(settleT); settleT = 0; clearTimeout(idleT); idleT = 0;
    if (mo) { mo.disconnect(); mo = null; }
    killSnap(); killBreath();
    root.classList.remove("fxcs-pause");
  }

  /* the visitor's first touch, key, wheel or scroll ends the breathing cue for this visit */
  W.addEventListener("pointerdown", onUser, { capture: true, passive: true });
  W.addEventListener("touchstart", onUser, { capture: true, passive: true });
  W.addEventListener("wheel", onUser, { capture: true, passive: true });
  W.addEventListener("keydown", onUser, true);
  W.addEventListener("scroll", onScroll, { passive: true });

  W.addEventListener("vf:route", function () {
    stop();
    /* leaving home also ends the "after load" breathing window */
    if (!homeShown()) { cancelBreath(); return; }
    start();
  });
  W.addEventListener("vf:lang", function () {
    /* only names change; keep the current frame and let the carousel re-centre */
    if (!active) return;
    var m = midCard(); if (m && m !== snapCard && m.classList.contains("fxcs-lit")) finalFrame(m);
    onMutate();
  });

  function boot() {
    y0 = W.pageYOffset || 0;
    if (!homeShown()) { breathOff = true; return; }
    start();
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot); else boot();

  W.fxCardsnap = { stop: stop, start: start };
})();
