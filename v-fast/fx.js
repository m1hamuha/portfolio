/* v-fast motion modules, built from fx/*.js; edit those and rebuild */
/* ---- fx/hero.js ---- */
/* fx/hero.js: the "night phone" next to the home headline (spec 3.1 A, 3.2).
   Messages pile up at night (grey bubbles, unread badge, the clock runs), then one lime
   wave answers them (ticks, lime replies, the badge becomes a booked calendar).
   Plays twice, then keeps the final frame. Decorative: aria-hidden, no words.
   It draws no glyphs at all (the unread badge bumps once per message instead of showing a
   digit that would be under 13px on a phone), so it needs no dictionary and survives
   "vf:lang" untouched. */
(function () {
  "use strict";
  if (window.__fxHero) return;
  window.__fxHero = true;

  var NS = "http://www.w3.org/2000/svg";
  var LIME = "#D8FF00", GREY = "#5a5a5a", DARK = "#2a2a2a";
  var PLAYS = 2;
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }

  var h1 = document.querySelector(".hero h1");
  var hero = document.querySelector(".hero");
  if (!h1 || !hero || !h1.parentNode) return;

  /* ---------- CSS (once) ---------- */
  if (!document.getElementById("fx-hero")) {
    var st = document.createElement("style");
    st.id = "fx-hero";
    st.textContent = [
      ".fxh{display:flex;align-items:center;justify-content:center;gap:14px;margin:0 auto;max-width:100%}",
      ".fxh__ph{flex:none;width:84px;height:132px;display:block;overflow:visible}",
      ".fxh__t{min-width:0;flex:0 1 auto;text-align:left}",
      ".hero .fxh__t h1{margin:0;max-width:none}",
      ".fxh__t .hero__chip{margin-left:0.5rem;font-size:max(13px,0.72em)}",
      "@media (max-width:760px){",
      ".fxh{justify-content:flex-start;align-items:center;margin-top:0.6rem}",
      ".hero .fxh__t h1{font-size:clamp(1.2rem,5.4vw,1.45rem);line-height:1.12}",
      ".fxh__t .hero__ask{font-size:1.02rem;margin-top:0.55rem;margin-bottom:0}",
      ".fxh__t .hero__chip{display:table;margin:0.4rem 0 0}",
      "}",
      "@media (max-width:760px) and (max-height:760px){.fxh__ph{width:68px;height:106px}.fxh{gap:12px}}",
      "@media (max-width:340px){.fxh__ph{width:60px;height:94px}.fxh{gap:10px}.hero .fxh__t h1{font-size:1.12rem}.fxh__t .hero__ask{font-size:0.95rem}}",
      "@media (min-width:761px){.fxh{gap:clamp(14px,1.4rem,28px)}.fxh__ph{width:7.2rem;height:11.25rem}.fxh__t .hero__ask{margin-bottom:0}}",
      "@media (min-width:1100px) and (min-height:600px){.at-home .hero .fxh__t h1{font-size:min(3.4rem,3.2vw,calc((min(100vw - 5rem,1280px) - 9rem) / 21.5));line-height:1.08}.at-home .fxh__t .hero__ask{margin-top:0.9rem}}"
    ].join("");
    document.head.appendChild(st);
  }

  /* ---------- layout: [phone] [headline + question] ---------- */
  var ask = document.querySelector(".hero__ask");
  var row = document.createElement("div");
  row.className = "fxh";
  var txt = document.createElement("div");
  txt.className = "fxh__t";
  h1.parentNode.insertBefore(row, h1);
  row.appendChild(txt);
  txt.appendChild(h1);
  if (ask && ask.parentNode === row.parentNode) txt.appendChild(ask);

  /* ---------- SVG ---------- */
  function el(tag, at, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in at) if (at.hasOwnProperty(k)) e.setAttribute(k, at[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  var svg = el("svg", { "class": "fxh__ph", viewBox: "0 0 96 150", "aria-hidden": "true", focusable: "false" });
  row.insertBefore(svg, txt);
  var uid = "fxh" + Math.floor(Math.random() * 1e6);
  var defs = el("defs", {}, svg);
  var cp = el("clipPath", { id: uid }, defs);
  el("rect", { x: 2, y: 2, width: 92, height: 146, rx: 14 }, cp);
  el("rect", { x: 2, y: 2, width: 92, height: 146, rx: 14, fill: "#0b0b0b", stroke: GREY, "stroke-width": 1.5 }, svg);
  el("line", { x1: 40, y1: 8, x2: 56, y2: 8, stroke: DARK, "stroke-width": 2, "stroke-linecap": "round" }, svg);
  var clock = el("circle", { cx: 16, cy: 20, r: 7, fill: "none", stroke: GREY, "stroke-width": 1.5 }, svg);
  var hand = el("line", { x1: 16, y1: 20, x2: 16, y2: 15, stroke: GREY, "stroke-width": 1.5, "stroke-linecap": "round" }, svg);
  var cal = el("g", {}, svg);
  var calUse = el("use", { href: "#l-calendar-days", x: 71, y: 11, width: 17, height: 17, fill: LIME }, cal);
  calUse.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#l-calendar-days");
  var calDot = el("circle", { cx: 88, cy: 12, r: 2.6, fill: LIME, stroke: "#0b0b0b", "stroke-width": 1.2 }, cal);
  var badge = el("g", {}, svg);
  el("circle", { cx: 80, cy: 20, r: 8, fill: "var(--loss, #ff9b8a)" }, badge);
  var bub = [], rep = [], tick = [];
  var Y = [40, 76, 112];
  for (var i = 0; i < 3; i++) {
    bub.push(el("rect", { x: 9, y: Y[i], width: 46, height: 14, rx: 7, fill: DARK }, svg));
    tick.push(el("path", { d: "M60 " + (Y[i] + 7) + "l2.6 2.6 5.2-5.4", fill: "none", stroke: LIME, "stroke-width": 1.6, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": 12, "stroke-dashoffset": 12 }, svg));
    rep.push(el("rect", { x: 53, y: Y[i] + 18, width: 34, height: 12, rx: 6, fill: LIME }, svg));
  }
  var wg = el("g", { "clip-path": "url(#" + uid + ")" }, svg);
  var wave = el("rect", { x: 0, y: 9, width: 3, height: 132, fill: LIME, opacity: 0.9 }, wg);

  var gsap = window.gsap;
  var tl = null, plays = 0, started = false, done = false, seen = false, io = null;

  /* the frame that stays: answered, booked, clock moved by one minute */
  function finalFrame() {
    if (tl) { tl.kill(); tl = null; }
    done = true;
    var all = [svg].concat(bub, rep, tick, [badge, cal, calDot, wave, hand]);
    if (gsap) gsap.killTweensOf(all);
    function clear(e) { e.style.transform = ""; e.style.opacity = ""; e.removeAttribute("transform"); }
    all.forEach(clear);
    bub.forEach(function (b) { b.style.opacity = "0.6"; });
    rep.forEach(function (r) { r.style.opacity = "1"; });
    tick.forEach(function (t) { t.setAttribute("stroke-dashoffset", 0); t.style.strokeDashoffset = "0"; });
    badge.style.opacity = "0";
    cal.style.opacity = "1";
    wave.style.opacity = "0";
    clock.setAttribute("stroke", LIME);
    hand.setAttribute("stroke", LIME);
    hand.setAttribute("transform", "rotate(6 16 20)");
    try { window.dispatchEvent(new CustomEvent("fx:hero", { detail: { done: true } })); } catch (e) {}
  }

  function build() {
    var t = gsap.timeline({ paused: true, onComplete: function () {
      plays++;
      if (plays >= PLAYS) { finalFrame(); return; }
      /* a soft clear between the two plays instead of a jump cut */
      gsap.to(bub.concat(rep, tick, [cal]), { opacity: 0, duration: 0.3, ease: "power1.in", onComplete: function () { if (!done && tl === t) { t.restart(); sync(); } } });
    } });
    /* start of every play: an empty phone at night */
    t.set(bub, { opacity: 0, y: -12 }, 0)
      .set(rep, { scale: 0, opacity: 0, transformOrigin: "100% 50%" }, 0)
      .set(tick, { strokeDashoffset: 12, opacity: 1 }, 0)
      .set(badge, { scale: 0, opacity: 1, transformOrigin: "50% 50%" }, 0)
      .set(cal, { scale: 0, opacity: 1, transformOrigin: "50% 50%" }, 0)
      .set(calDot, { scale: 0, transformOrigin: "50% 50%" }, 0)
      .set(wave, { x: -4, opacity: 0.9 }, 0)
      .set([clock, hand], { attr: { stroke: GREY } }, 0)
      .set(hand, { rotation: 0, svgOrigin: "16 20" }, 0);
    /* messages arrive, nobody answers */
    for (var i = 0; i < 3; i++) {
      var at = i * 0.5;
      t.to(bub[i], { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, at);
      if (i === 0) t.to(badge, { scale: 1, duration: 0.35, ease: "back.out(2)" }, at);
      else {
        t.fromTo(badge, { scale: 1.35 }, { scale: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, at);
      }
    }
    t.to(hand, { rotation: 300, svgOrigin: "16 20", duration: 1.6, ease: "none" }, 0);
    t.to(bub, { opacity: 0.6, duration: 0.5, ease: "power1.in" }, 1.1);
    /* 2.0s: one lime wave answers every message */
    t.to(wave, { x: 96, duration: 0.45, ease: "power1.inOut" }, 2.0);
    t.to(tick, { strokeDashoffset: 0, duration: 0.2, ease: "power1.out", stagger: 0.12 }, 2.08);
    t.fromTo(rep, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: "back.out(1.6)", stagger: 0.12, immediateRender: false }, 2.12);
    /* 2.5s: unread is gone, the slot is booked, the clock barely moved */
    t.to(badge, { scale: 0, duration: 0.25, ease: "power2.in" }, 2.5);
    t.to(cal, { scale: 1, duration: 0.4, ease: "back.out(1.8)" }, 2.6);
    t.to(calDot, { scale: 1, duration: 0.25, ease: "back.out(2)" }, 2.9);
    t.set([clock, hand], { attr: { stroke: LIME } }, 2.5);
    t.to(hand, { rotation: 6, svgOrigin: "16 20", duration: 0.5, ease: "power2.out" }, 2.5);
    t.set({}, {}, 3.1 + 1.6); /* hold 1.6s */
    return t;
  }

  function visible() { return !document.hidden && seen && !document.getElementById("home").hidden; }
  function sync() {
    if (!tl || done) return;
    if (visible()) tl.play(); else tl.pause();
  }
  function start() {
    if (started || done) return;
    started = true;
    if (reduced() || !gsap) { finalFrame(); return; }
    tl = build();
    sync();
  }

  if (reduced() || !gsap) { finalFrame(); return; }

  /* initial (empty) frame so nothing flashes before the first play */
  gsap.set(bub.concat(rep, [badge, cal, calDot]), { opacity: 0 });
  gsap.set(wave, { x: -4, opacity: 0 });

  function arm() {
    if (done) return;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          seen = e.isIntersecting && e.intersectionRatio >= 0.5;
          if (seen) start();
          sync();
        });
      }, { threshold: [0, 0.5, 1] });
      io.observe(svg);
    } else { seen = true; start(); }
  }
  var fr = document.fonts && document.fonts.ready;
  if (fr && fr.then) fr.then(arm, arm); else arm();

  document.addEventListener("visibilitychange", sync);
  if (mq) {
    var onMq = function () { if (reduced()) finalFrame(); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }
  /* leaving home ends the show: back home, the final frame waits */
  window.addEventListener("vf:route", function () {
    var home = document.getElementById("home");
    if (home && home.hidden && started && !done) finalFrame();
  });
  /* a language switch only rewrites the headline text inside .fxh__t; the phone has no words */
  window.addEventListener("vf:lang", sync);
})();
;
/* ---- fx/cardsnap.js ---- */
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
;
/* ---- fx/glyphs.js ---- */
/* fx/glyphs.js: the "loss strip" on the task cards of a business page (spec 3.3).
   Each task card gets a small picture under its title row: first the owner's loss in grey
   ("before"), then one lime move fixes it ("after"). The pair is chosen by the mock-up type
   (VF.content(niche, task).v.type): chat, reminder, review, post, listing, list, doc.
   Cycle: before 1.2s, change 0.5s (power2.inOut), after 1.6s. At most 3 cycles, then the
   after frame stays. Only cards at least 60% on screen play, at most 2 at the same time.
   The advised card (.cc--top): its label slides in, its icon ring sends a lime pulse every 4s
   (at most 3), its filled arrow "breathes" once after 5s without any touch, scroll or key.
   Reduced motion: only the after frames, no pulse, no breath, no slide.
   Decorative only: aria-hidden, no words and no numbers, so the module needs no dictionary
   and survives "vf:lang" untouched (it only re-seats the strips if the card was repainted).
   Only strokes, outlines and motion: it adds no filled lime button. */
(function () {
  "use strict";
  var D = document, W = window;
  if (W.__fxGlyphs) return;
  W.__fxGlyphs = true;

  var NS = "http://www.w3.org/2000/svg";
  var LIME = "#D8FF00", GREY = "#5a5a5a", DARK = "#2a2a2a", SURF = "#1d1d1d", MID = "#3a3a3a";
  var LOSS = "var(--loss, #ff9b8a)";
  var T_BEFORE = 1.2, T_CHANGE = 0.5, T_AFTER = 1.6, CYCLES = 3, MAX_PHONE = 2, MAX_DESK = 2;
  var PULSE_EVERY = 4, PULSES = 3, IDLE_MS = 5000;
  /* if content.js is not there yet, the task id still tells the type */
  var BY_TASK = { bot: "chat", assistant: "chat", mail: "reminder", reviews: "review", social: "post", content: "post", site: "listing", reports: "list", leads: "list", docs: "doc", hiring: "doc" };

  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function gs() { return W.gsap || null; }
  function phone() { return W.innerWidth <= 760; }

  /* ---------- CSS (once) ---------- */
  if (!D.getElementById("fx-glyphs")) {
    var st = D.createElement("style");
    st.id = "fx-glyphs";
    st.textContent = [
      ".fxg{display:block;width:148px;height:36px;flex:none;overflow:visible;pointer-events:none;margin:0.35rem auto 0}",
      /* phone: icon | title over price | arrow, the strip is the third row under the title */
      "@media (max-width:760px){.nv .cc--s .fxg{grid-column:2/-1;grid-row:3;margin:0.3rem 0 0;justify-self:start}}",
      /* computer: centre card larger, side cards keep the strip instead of the grey text */
      "@media (min-width:1100px) and (min-height:600px){",
      ".at-niche .nv .cc--s .fxg{width:13rem;height:3.15rem;margin:-0.3rem auto;transition:transform .35s ease,opacity .35s ease;transform-origin:50% 50%}",
      ".at-niche .nv .cc--s.fxg-on:not(.mid) .fxg{transform:scale(.72);opacity:.8}",
      ".at-niche .nv .cc--s.fxg-on:not(.mid) .cc__what{display:none}",
      ".at-niche .nv .cc--s.fxg-on.mid .cc__what{display:block;flex:none;line-height:1.3;-webkit-line-clamp:unset;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}",
      "}",
      /* the advised card: label slides in, ring pulse, arrow breath (transform and opacity only) */
      "@keyframes fxgTop{from{translate:0 -6px;opacity:0}to{translate:0 0;opacity:1}}",
      ".fxg-top-in .cc__top{animation:fxgTop .2s ease-out both}",
      ".fxg-pulse{position:absolute;inset:0;border-radius:50%;border:2px solid " + LIME + ";opacity:0;pointer-events:none;transform:scale(1)}",
      ".nv .cc--top .cc__go{position:relative}",
      ".fxg-br{position:absolute;inset:-1.5px;border-radius:50%;border:2px solid " + LIME + ";opacity:0;pointer-events:none}",
      "@media (prefers-reduced-motion:reduce){.fxg-top-in .cc__top{animation:none}.fxg-pulse,.fxg-br{display:none}.at-niche .nv .cc--s .fxg{transition:none}}"
    ].join("");
    D.head.appendChild(st);
  }

  /* ---------- SVG helpers ---------- */
  var uid = 0;
  function el(tag, at, parent) {
    var e = D.createElementNS(NS, tag);
    for (var k in at) if (Object.prototype.hasOwnProperty.call(at, k)) {
      if (k === "style") e.style.cssText = at[k]; else e.setAttribute(k, at[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function use(id, x, y, s, color, parent) {
    var u = el("use", { href: "#" + id, x: x, y: y, width: s, height: s }, parent);
    u.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + id);
    u.style.color = color; u.style.fill = color;
    return u;
  }
  function star(cx, cy, r) {
    var p = [], i, a, rr;
    for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; rr = i % 2 ? r * 0.45 : r; p.push((cx + Math.cos(a) * rr).toFixed(2) + " " + (cy + Math.sin(a) * rr).toFixed(2)); }
    return "M" + p.join("L") + "Z";
  }
  function pin(x, y, s) { /* tip at (x, y), height about 1.4 s */
    return "M" + x + " " + y + "C" + (x - s * 0.15) + " " + (y - s * 0.45) + " " + (x - s * 0.6) + " " + (y - s * 0.7) + " " + (x - s * 0.6) + " " + (y - s * 1.05) +
      "A" + (s * 0.6) + " " + (s * 0.6) + " 0 1 1 " + (x + s * 0.6) + " " + (y - s * 1.05) +
      "C" + (x + s * 0.6) + " " + (y - s * 0.7) + " " + (x + s * 0.15) + " " + (y - s * 0.45) + " " + x + " " + y + "Z";
  }

  /* A part: { el, b: before props, a: after props, og: [x, y] origin, d, e, at }.
     Props: o (opacity), x, y, s (scale), r (rotate deg), dash (stroke-dashoffset). */
  var BUILD = {
    chat: function (g, P) {
      el("rect", { x: 6, y: 7, width: 66, height: 22, rx: 11, fill: DARK }, g);
      el("rect", { x: 15, y: 13.5, width: 34, height: 3, rx: 1.5, fill: GREY }, g);
      el("rect", { x: 15, y: 19.5, width: 22, height: 3, rx: 1.5, fill: GREY }, g);
      var ring = el("rect", { x: 6, y: 7, width: 66, height: 22, rx: 11, fill: "none", stroke: LIME, "stroke-width": 1.5 }, g);
      var tick = el("path", { d: "M54 18.5l3.6 3.6 7.4-7.6", fill: "none", stroke: LIME, "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": 16 }, g);
      var clock = el("g", {}, g);
      el("circle", { cx: 104, cy: 18, r: 10, fill: "none", stroke: GREY, "stroke-width": 1.5 }, clock);
      el("line", { x1: 104, y1: 18, x2: 108.5, y2: 18, stroke: GREY, "stroke-width": 1.5, "stroke-linecap": "round" }, clock);
      var hand = el("line", { x1: 104, y1: 18, x2: 104, y2: 11, stroke: GREY, "stroke-width": 1.5, "stroke-linecap": "round" }, clock);
      var dot = el("circle", { cx: 112, cy: 9.5, r: 2.8 }, clock); dot.style.fill = LOSS;
      var cal = use("l-calendar-days", 94, 8, 20, LIME, g);
      var cdot = el("circle", { cx: 116, cy: 9, r: 2.8, fill: LIME }, g);
      P.push({ el: ring, b: { o: 0 }, a: { o: 1 } });
      P.push({ el: tick, b: { dash: 16 }, a: { dash: 0 }, d: 0.3, at: 0.15, e: "power1.out" });
      P.push({ el: clock, b: { o: 1, s: 1 }, a: { o: 0, s: 0.7 }, og: [104, 18], d: 0.3 });
      P.push({ el: cal, b: { o: 0, s: 0 }, a: { o: 1, s: 1 }, og: [104, 18], d: 0.35, at: 0.15, e: "back.out(1.8)" });
      P.push({ el: cdot, b: { o: 0, s: 0 }, a: { o: 1, s: 1 }, og: [116, 9], d: 0.2, at: 0.3 });
      return { idle: function (tl, t) { tl.fromTo(hand, { rotation: 0, svgOrigin: "104 18" }, { rotation: 300, duration: T_BEFORE, ease: "power1.in" }, t); },
        reset: function (tl, t) { tl.set(hand, { rotation: 0, svgOrigin: "104 18" }, t); } };
    },
    reminder: function (g, P) {
      /* an empty time slot and an empty chair (dashed), then the bell rings and the chair is taken */
      el("rect", { x: 6, y: 8, width: 42, height: 20, rx: 4, fill: "none", stroke: GREY, "stroke-width": 1.5, "stroke-dasharray": "3 3" }, g);
      el("rect", { x: 13, y: 16.5, width: 20, height: 3, rx: 1.5, fill: DARK }, g);
      var slotOk = el("rect", { x: 6, y: 8, width: 42, height: 20, rx: 4, fill: "none", stroke: LIME, "stroke-width": 1.5 }, g);
      var bell = use("l-bell-ring", 58, 8, 20, LIME, g);
      var chairE = el("g", { fill: "none", stroke: GREY, "stroke-width": 1.5, "stroke-dasharray": "2.5 2.5" }, g);
      el("rect", { x: 112, y: 4, width: 7, height: 20, rx: 2 }, chairE);
      el("rect", { x: 96, y: 20, width: 26, height: 7, rx: 2 }, chairE);
      el("path", { d: "M99 27v5M119 27v5" }, chairE);
      /* taken: a solid lime outline with a faint lime tint, so it never reads as a second filled button */
      var chairF = el("g", { fill: "rgba(216,255,0,.22)", stroke: LIME, "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
      el("rect", { x: 112, y: 4, width: 7, height: 20, rx: 2 }, chairF);
      el("rect", { x: 96, y: 20, width: 26, height: 7, rx: 2 }, chairF);
      el("path", { d: "M99 27v5M119 27v5", fill: "none", "stroke-linecap": "round" }, chairF);
      P.push({ el: slotOk, b: { o: 0 }, a: { o: 1 } });
      P.push({ el: bell, b: { o: 0.35, r: 0 }, a: { o: 1, r: 0 }, og: [68, 9], d: 0.15 });
      P.push({ el: chairE, b: { o: 1 }, a: { o: 0 }, d: 0.3, at: 0.2 });
      P.push({ el: chairF, b: { o: 0, s: 0.8 }, a: { o: 1, s: 1 }, og: [109, 32], d: 0.3, at: 0.2, e: "back.out(1.6)" });
      return { change: function (tl, t) {
        /* the bell swings -12 / 12 twice in 0.5s */
        tl.to(bell, { keyframes: [{ rotation: -12, duration: 0.0625 }, { rotation: 12, duration: 0.125 }, { rotation: -12, duration: 0.125 }, { rotation: 12, duration: 0.125 }, { rotation: 0, duration: 0.0625 }], ease: "sine.inOut" }, t);
      } };
    },
    review: function (g, P) {
      /* a review card with one grey star of five; a reply rises and docks to it, a lime line links them.
         The stars never change. */
      el("rect", { x: 4, y: 4, width: 70, height: 28, rx: 6, fill: SURF, stroke: MID, "stroke-width": 1 }, g);
      for (var i = 0; i < 5; i++) {
        var s = el("path", { d: star(14 + i * 11, 13, 4.4), "stroke-linejoin": "round", "stroke-width": 1.2, stroke: GREY }, g);
        s.setAttribute("fill", i === 0 ? GREY : "none");
      }
      el("rect", { x: 10, y: 22, width: 44, height: 3, rx: 1.5, fill: DARK }, g);
      var link = el("path", { d: "M74 18C82 18 82 22 90 22", fill: "none", stroke: LIME, "stroke-width": 1.5, "stroke-linecap": "round", "stroke-dasharray": 20 }, g);
      var rep = el("g", {}, g);
      el("rect", { x: 90, y: 12, width: 52, height: 20, rx: 10, fill: SURF, stroke: LIME, "stroke-width": 1.5 }, rep);
      el("rect", { x: 99, y: 17.5, width: 30, height: 3, rx: 1.5, fill: "#8a8a8a" }, rep);
      el("rect", { x: 99, y: 23.5, width: 20, height: 3, rx: 1.5, fill: GREY }, rep);
      P.push({ el: rep, b: { o: 0, y: 8 }, a: { o: 1, y: 0 }, d: 0.4 });
      P.push({ el: link, b: { dash: 20 }, a: { dash: 0 }, d: 0.25, at: 0.25, e: "power1.out" });
      return {};
    },
    post: function (g, P, id) {
      /* a dark, hazy photo becomes a bright one in a lime frame with an outlined heart. No like counter. */
      var cp = el("clipPath", { id: id + "c" }, el("defs", {}, g));
      el("rect", { x: 20, y: 3, width: 30, height: 30, rx: 4 }, cp);
      var dark = el("g", {}, g);
      el("rect", { x: 20, y: 3, width: 30, height: 30, rx: 4, fill: SURF, stroke: MID, "stroke-width": 1 }, dark);
      var haze = el("g", { "clip-path": "url(#" + id + "c)", fill: DARK }, dark);
      el("ellipse", { cx: 30, cy: 24, rx: 16, ry: 8 }, haze);
      el("ellipse", { cx: 44, cy: 12, rx: 9, ry: 5, opacity: 0.7 }, haze);
      var lite = el("g", {}, g);
      el("rect", { x: 20, y: 3, width: 30, height: 30, rx: 4, fill: "#d9d9d9" }, lite);
      var hill = el("g", { "clip-path": "url(#" + id + "c)" }, lite);
      el("path", { d: "M18 33L29 20l7 8 5-5 11 10z", fill: "#9a9a9a" }, hill);
      el("circle", { cx: 42, cy: 11, r: 3.2, fill: "#f4f4f4" }, hill);
      el("rect", { x: 20, y: 3, width: 30, height: 30, rx: 4, fill: "none", stroke: LIME, "stroke-width": 1.5 }, lite);
      el("rect", { x: 58, y: 10, width: 36, height: 3, rx: 1.5, fill: DARK }, g);
      el("rect", { x: 58, y: 17, width: 24, height: 3, rx: 1.5, fill: DARK }, g);
      var heart = el("path", { d: "M106 27.5C98 22 96 18.5 96 15.2 96 12.3 98.2 10 101 10c2.1 0 3.8 1.2 5 3 1.2-1.8 2.9-3 5-3 2.8 0 5 2.3 5 5.2 0 3.3-2 6.8-10 12.3z", fill: "none", stroke: LIME, "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
      P.push({ el: lite, b: { o: 0, s: 0.6 }, a: { o: 1, s: 1 }, og: [35, 18], e: "back.out(1.4)" });
      P.push({ el: dark, b: { o: 1 }, a: { o: 0 }, d: 0.3 });
      P.push({ el: heart, b: { o: 0, s: 0.6 }, a: { o: 1, s: 1 }, og: [106, 18], d: 0.3, at: 0.2, e: "back.out(2)" });
      return {};
    },
    listing: function (g, P, id) {
      /* three grey pins and an empty dashed spot; a lime pin drops in and a dotted route is drawn */
      var cp = el("clipPath", { id: id + "r" }, el("defs", {}, g));
      var wipe = el("rect", { x: 0, y: 0, width: 148, height: 36 }, cp);
      el("path", { d: pin(16, 22, 8), fill: GREY }, g);
      el("path", { d: pin(38, 30, 8), fill: GREY }, g);
      el("path", { d: pin(60, 20, 8), fill: GREY }, g);
      el("circle", { cx: 112, cy: 26, r: 7, fill: "none", stroke: GREY, "stroke-width": 1.5, "stroke-dasharray": "2.5 2.5" }, g);
      var route = el("path", { d: "M70 31C84 33 92 31 104 28", fill: "none", stroke: LIME, "stroke-width": 1.5, "stroke-linecap": "round", "stroke-dasharray": "1 4", "clip-path": "url(#" + id + "r)" }, g);
      var lp = el("path", { d: pin(112, 26, 9), fill: "none", stroke: LIME, "stroke-width": 1.8, "stroke-linejoin": "round" }, g);
      var ld = el("circle", { cx: 112, cy: 16.5, r: 2.4, fill: LIME }, g);
      var pinG = el("g", {}, g); pinG.appendChild(lp); pinG.appendChild(ld);
      P.push({ el: pinG, b: { o: 0, y: -18 }, a: { o: 1, y: 0 }, d: 0.5, e: "bounce.out" });
      P.push({ el: wipe, b: { sx: 0 }, a: { sx: 1 }, og: [70, 0], d: 0.45, at: 0.05, e: "power1.inOut" });
      return {};
    },
    list: function (g, P) {
      /* four tilted grey sheets fall into four even rows with a lime left edge */
      var rots = [-12, 7, -5, 13], i;
      for (i = 0; i < 4; i++) {
        var sh = el("g", {}, g), x = 8 + i * 30;
        el("rect", { x: x, y: 6, width: 22, height: 26, rx: 3, fill: SURF, stroke: GREY, "stroke-width": 1.2 }, sh);
        el("rect", { x: x + 5, y: 13, width: 12, height: 2.5, rx: 1.25, fill: GREY }, sh);
        el("rect", { x: x + 5, y: 19, width: 9, height: 2.5, rx: 1.25, fill: GREY }, sh);
        P.push({ el: sh, b: { o: 1, r: rots[i], s: 1 }, a: { o: 0, r: 0, s: 0.7 }, og: [x + 11, 19], d: 0.3, at: i * 0.05 });
      }
      for (i = 0; i < 4; i++) {
        var row = el("g", {}, g), y = 3 + i * 8;
        el("rect", { x: 8, y: y, width: 118, height: 6, rx: 2, fill: SURF }, row);
        el("rect", { x: 8, y: y, width: 3, height: 6, rx: 1, fill: LIME }, row);
        el("rect", { x: 16, y: y + 2, width: 40 + (i % 2) * 18, height: 2, rx: 1, fill: GREY }, row);
        P.push({ el: row, b: { o: 0, x: -8 }, a: { o: 1, x: 0 }, d: 0.45, at: 0.05 + i * 0.05, e: "power2.out" });
      }
      return {};
    },
    doc: function (g, P) {
      /* three sheets in a fan become one straight sheet with a lime tick */
      var rs = [-16, 0, 16], i, top = null;
      for (i = 0; i < 3; i++) {
        var sh = el("g", {}, g);
        el("rect", { x: 30, y: 4, width: 22, height: 28, rx: 3, fill: SURF, stroke: i === 1 ? "#8a8a8a" : GREY, "stroke-width": 1.2 }, sh);
        el("rect", { x: 35, y: 11, width: 12, height: 2.5, rx: 1.25, fill: GREY }, sh);
        el("rect", { x: 35, y: 17, width: 12, height: 2.5, rx: 1.25, fill: GREY }, sh);
        el("rect", { x: 35, y: 23, width: 8, height: 2.5, rx: 1.25, fill: GREY }, sh);
        if (i === 1) top = sh;
        else P.push({ el: sh, b: { o: 1, r: rs[i] }, a: { o: 0, r: 0 }, og: [41, 34], d: 0.4 });
      }
      g.appendChild(top);
      var edge = el("rect", { x: 30, y: 4, width: 22, height: 28, rx: 3, fill: "none", stroke: LIME, "stroke-width": 1.5 }, g);
      var tick = el("path", { d: "M62 18.5l4.4 4.4 9.6-10", fill: "none", stroke: LIME, "stroke-width": 2.2, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": 22 }, g);
      P.push({ el: edge, b: { o: 0 }, a: { o: 1 }, d: 0.3, at: 0.2 });
      P.push({ el: tick, b: { dash: 22 }, a: { dash: 0 }, d: 0.3, at: 0.25, e: "power1.out" });
      return {};
    }
  };

  /* ---------- props to GSAP / to plain CSS ---------- */
  function gProps(p, og) {
    var o = {};
    if ("o" in p) o.opacity = p.o;
    if ("x" in p) o.x = p.x;
    if ("y" in p) o.y = p.y;
    if ("s" in p) o.scale = p.s;
    if ("sx" in p) o.scaleX = p.sx;
    if ("r" in p) o.rotation = p.r;
    if ("dash" in p) o.strokeDashoffset = p.dash;
    if (og && ("s" in p || "sx" in p || "r" in p)) o.svgOrigin = og[0] + " " + og[1];
    return o;
  }
  function put(part, p) {
    var G = gs();
    if (G) { G.set(part.el, gProps(p, part.og)); return; }
    var s = part.el.style, tr = "";
    if ("o" in p) s.opacity = p.o;
    if ("dash" in p) s.strokeDashoffset = p.dash;
    if (part.og) { s.transformBox = "view-box"; s.transformOrigin = part.og[0] + "px " + part.og[1] + "px"; }
    if ("x" in p || "y" in p) tr += "translate(" + (p.x || 0) + "px," + (p.y || 0) + "px) ";
    if ("r" in p) tr += "rotate(" + p.r + "deg) ";
    if ("s" in p) tr += "scale(" + p.s + ") ";
    if ("sx" in p) tr += "scaleX(" + p.sx + ") ";
    s.transform = tr;
  }

  /* ---------- one strip per card ---------- */
  function taskOf(card) { var m = (card.getAttribute("href") || "").match(/^#\/for\/([a-z]+)\/([a-z]+)$/); return m ? [m[1], m[2]] : null; }
  function typeOf(n, sid) {
    var c = null;
    try { c = W.VF && W.VF.content ? W.VF.content(n, sid) : null; } catch (e) { c = null; }
    var t = c && c.v && c.v.type;
    return BUILD[t] ? t : (BUILD[BY_TASK[sid]] ? BY_TASK[sid] : null);
  }
  function anchor(card) { /* the title row: the head wrapper if there is one, else the price, else the title */
    return card.querySelector(".cc__head") || card.querySelector(".cc__price") || card.querySelector("h3");
  }
  function seat(card, svg) {
    var a = anchor(card);
    if (!a || a.parentNode !== card) { if (svg.parentNode !== card) card.appendChild(svg); return; }
    if (a.nextSibling !== svg) card.insertBefore(svg, a.nextSibling);
  }
  function strip(card) {
    if (card.__fxg) { seat(card, card.__fxg.svg); return card.__fxg; }
    var tk = taskOf(card); if (!tk) return null;
    var type = typeOf(tk[0], tk[1]); if (!type) return null;
    var id = "fxg" + (++uid);
    var svg = el("svg", { "class": "fxg fxg--" + type, viewBox: "0 0 148 36", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "xMidYMid meet" });
    var g = el("g", {}, svg), P = [];
    var hooks = BUILD[type](g, P, id) || {};
    var S = { card: card, svg: svg, parts: P, hooks: hooks, type: type, key: tk.join("/"), tl: null, playing: false, done: false, vis: false };
    card.__fxg = S;
    card.classList.add("fxg-on");
    seat(card, svg);
    return S;
  }
  function before(S) { S.parts.forEach(function (p) { put(p, p.b); }); }
  function after(S) { S.parts.forEach(function (p) { put(p, p.a); }); }

  function timeline(S) {
    var G = gs(), tl = G.timeline({ paused: true, onComplete: function () { finish(S); } });
    var L = T_BEFORE + T_CHANGE + T_AFTER;
    for (var c = 0; c < CYCLES; c++) {
      var t = c * L;
      if (c > 0) { /* quietly back to the loss, inside the "before" time */
        S.parts.forEach(function (p) { var v = gProps(p.b, p.og); v.duration = 0.3; v.ease = "power1.out"; tl.to(p.el, v, t); });
        if (S.hooks.reset) S.hooks.reset(tl, t);
      }
      if (S.hooks.idle) S.hooks.idle(tl, t + (c > 0 ? 0.3 : 0));
      var tc = t + T_BEFORE;
      S.parts.forEach(function (p) {
        var v = gProps(p.a, p.og); v.duration = p.d || T_CHANGE; v.ease = p.e || "power2.inOut";
        tl.to(p.el, v, tc + (p.at || 0));
      });
      if (S.hooks.change) S.hooks.change(tl, tc);
      tl.to({}, { duration: 0.001 }, t + L - 0.001); /* hold the after frame for T_AFTER */
    }
    return tl;
  }

  /* ---------- the business page that is open ---------- */
  var mem = {};      /* "niche/task" -> finished, for this page load: after 3 cycles the after frame stays */
  var cur = null;    /* { sec, strips, io, top, timers, pulse, breath } */

  function slots() { return phone() ? MAX_PHONE : MAX_DESK; }
  function playingCount() { return cur ? cur.strips.filter(function (S) { return S.playing; }).length : 0; }
  function finish(S) { S.playing = false; S.done = true; mem[S.key] = 1; S.tl = null; schedule(); }
  function pauseS(S) { if (S.tl && S.playing) S.tl.pause(); S.playing = false; }
  function canRun() { return cur && !D.hidden && !reduced() && !!gs(); }

  function schedule() {
    if (!cur) return;
    cur.strips.forEach(function (S) { if (S.playing && (!S.vis || !canRun())) pauseS(S); });
    if (!canRun()) return;
    /* the advised card first, then the order of the page (ranked by pain) */
    var wait = cur.strips.filter(function (S) { return S.vis && !S.done && !S.playing; });
    wait.sort(function (a, b) { return (b.card.classList.contains("cc--top") ? 1 : 0) - (a.card.classList.contains("cc--top") ? 1 : 0); });
    var free = slots() - playingCount();
    wait.slice(0, Math.max(0, free)).forEach(function (S) {
      if (!S.tl) S.tl = timeline(S);
      S.playing = true; S.tl.play();
    });
  }

  function topCard(sec) { return sec.querySelector(".cc--top"); }

  /* the advised card: ring pulse every 4s, at most 3 times, only while it is on screen */
  function startPulse(card) {
    var G = gs(), art = card.querySelector(".cc__art");
    if (!G || !art || reduced()) return null;
    var ring = art.querySelector(".fxg-pulse");
    if (!ring) { ring = D.createElement("span"); ring.className = "fxg-pulse"; ring.setAttribute("aria-hidden", "true"); art.appendChild(ring); }
    var key = "p:" + (card.getAttribute("href") || "");
    if (mem[key]) return null;
    var tl = G.timeline({ paused: true, repeat: PULSES - 1, repeatDelay: PULSE_EVERY - 1, delay: 0.6, onComplete: function () { mem[key] = 1; } });
    tl.fromTo(ring, { scale: 1, opacity: 0.8 }, { scale: 1.35, opacity: 0, duration: 1, ease: "power1.out" });
    return { tl: tl, ring: ring };
  }
  /* the filled arrow of the advised card breathes once after 5s without any touch, scroll or key */
  function armBreath() {
    if (!cur || reduced() || cur.breathed) return;
    clearTimeout(cur.idle);
    cur.idle = setTimeout(breathe, IDLE_MS);
  }
  function breathe() {
    if (!cur || cur.breathed || D.hidden) return;
    var card = topCard(cur.sec), go = card && card.querySelector(".cc__go"), G = gs();
    if (!go || !G || !go.offsetWidth) return;
    var r = go.getBoundingClientRect();
    if (r.bottom < 0 || r.top > W.innerHeight) return; /* off screen: the next scroll or touch re-arms it */
    cur.breathed = true;
    var ring = go.querySelector(".fxg-br");
    if (!ring) { ring = D.createElement("span"); ring.className = "fxg-br"; ring.setAttribute("aria-hidden", "true"); go.appendChild(ring); }
    cur.breathTl = G.timeline({ onComplete: function () { G.set(go, { clearProps: "transform" }); } })
      .to(go, { scale: 1.06, duration: 0.4, ease: "sine.out" }, 0)
      .to(go, { scale: 1, duration: 0.5, ease: "sine.inOut" }, 0.4)
      .fromTo(ring, { scale: 1, opacity: 0.5 }, { scale: 1.5, opacity: 0, duration: 0.9, ease: "power1.out" }, 0);
  }
  function onActivity() { if (cur && !cur.breathed) armBreath(); }

  function stopAll() {
    if (!cur) return;
    var G = gs();
    if (cur.io) cur.io.disconnect();
    clearTimeout(cur.idle);
    cur.strips.forEach(function (S) {
      if (S.tl) { S.tl.kill(); S.tl = null; }
      S.playing = false;
      after(S); /* leave a clean frame: the after frame */
    });
    if (cur.pulse) { cur.pulse.tl.kill(); if (G) G.set(cur.pulse.ring, { opacity: 0 }); }
    if (cur.breathTl) { cur.breathTl.kill(); var go = cur.top && cur.top.querySelector(".cc__go"); if (go && G) G.set(go, { clearProps: "transform" }); var br = go && go.querySelector(".fxg-br"); if (br) br.style.opacity = 0; }
    if (cur.top) cur.top.classList.remove("fxg-top-in");
    cur = null;
  }

  function ordered() {
    var v = null;
    try { v = JSON.parse((W.localStorage && W.localStorage.getItem("vf.ordered")) || "[]"); } catch (e) { v = null; }
    return Object.prototype.toString.call(v) === "[object Array]" ? v : [];
  }
  function niche() { var m = location.hash.match(/^#\/for\/([a-z]+)$/); return m ? m[1] : null; }

  function setup() {
    stopAll();
    var n = niche(); if (!n) return;
    var sec = D.getElementById("n-" + n);
    if (!sec || sec.hidden) return;
    var cards = [].slice.call(sec.querySelectorAll(".cc[href]"));
    var strips = [];
    cards.forEach(function (card) { var S = strip(card); if (S) strips.push(S); });
    var top = topCard(sec);
    cur = { sec: sec, strips: strips, io: null, top: top, idle: 0, breathed: false, pulse: null, breathTl: null };
    var still = reduced() || !gs(), bought = ordered();
    strips.forEach(function (S) {
      /* a task the owner already ordered is fixed: it shows the after frame and does not replay the loss */
      S.done = still || !!mem[S.key] || bought.indexOf(S.key) > -1;
      if (S.done) after(S); else before(S);
      if (S.hooks.reset && !S.done && gs()) { var tl0 = gs().timeline(); S.hooks.reset(tl0, 0); }
    });
    if (still) return;
    /* the label slides in once per visit of the page */
    var lab = top && top.querySelector(".cc__top");
    if (top && lab && !lab.hasAttribute("data-fxrt-i18n")) { top.classList.remove("fxg-top-in"); void top.offsetWidth; top.classList.add("fxg-top-in"); }
    if (top) cur.pulse = startPulse(top);
    if ("IntersectionObserver" in W) {
      cur.io = new IntersectionObserver(function (es) {
        if (!cur) return;
        es.forEach(function (e) {
          var S = e.target.__fxg;
          if (S) S.vis = e.isIntersecting && e.intersectionRatio >= 0.6;
          if (cur.pulse && e.target === cur.top) {
            if (e.isIntersecting && e.intersectionRatio >= 0.6 && !D.hidden) cur.pulse.tl.resume(); else cur.pulse.tl.pause();
          }
        });
        schedule();
      }, { threshold: [0, 0.6, 1] });
      strips.forEach(function (S) { cur.io.observe(S.card); });
      if (top && !top.__fxg) cur.io.observe(top);
    } else {
      strips.forEach(function (S) { S.vis = true; });
      if (cur.pulse) cur.pulse.tl.resume();
      schedule();
    }
    armBreath();
  }

  var tm = 0;
  function later() { clearTimeout(tm); tm = setTimeout(setup, 60); } /* after the page has painted its cards */

  W.addEventListener("vf:route", function () { stopAll(); later(); });
  W.addEventListener("hashchange", function () { if (!niche()) stopAll(); });
  W.addEventListener("vf:lang", function () {
    /* the cards may have been repainted: put each strip back under its title row */
    if (cur) cur.strips.forEach(function (S) { seat(S.card, S.svg); });
  });
  W.addEventListener("content", function () { if (cur) cur.strips.forEach(function (S) { seat(S.card, S.svg); }); });
  D.addEventListener("visibilitychange", function () {
    if (!cur) return;
    if (D.hidden) { if (cur.pulse) cur.pulse.tl.pause(); clearTimeout(cur.idle); }
    else { if (cur.pulse && cur.top) { var r = cur.top.getBoundingClientRect(); if (r.top < W.innerHeight && r.bottom > 0) cur.pulse.tl.resume(); } if (!cur.breathed) armBreath(); }
    schedule();
  });
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) { W.addEventListener(ev, onActivity, { passive: true }); });
  W.addEventListener("scroll", onActivity, { passive: true });
  W.addEventListener("resize", function () { schedule(); });
  if (mq) {
    var onRm = function () { if (cur) setup(); };
    if (mq.addEventListener) mq.addEventListener("change", onRm); else if (mq.addListener) mq.addListener(onRm);
  }
  /* exposed for motion.js (window.FX.glyphs) and for tests: play the strip of one card */
  W.FXGlyphs = { setup: setup, kill: stopAll, card: function (card) { return strip(card); } };
  if (niche()) later();
})();
;
/* ---- fx/taskdemo.js ---- */
/* fx/taskdemo.js: the task page (spec 3.4 A, B and C breath).
   A) "Pain first" demo of the phone #ph, driven through window.PH: the "without me" side
      plays its loss (message, the clock runs to midnight, red status, loss line), the handle
      sweeps to "with me", that side answers (typing dots, the reply springs, a calendar chip
      flies into the status bar, the clock turns lime, the gain line shows), then the handle
      rests at 50% and the page's own idle ring takes over. Once per task per session
      (sessionStorage "demo:<niche>/<task>"), cancelled by any pointerdown on #ph, never under
      reduced motion. The "with me" part also plays whenever the handle is moved past 70%
      towards "with me" by hand.
   B) The three steps are joined by one lime line, drawn once when half of the list is seen.
   C) The big Order breathes once after 5 s without input while it is on screen (2 at most).
   Adds no words: every element it draws is aria-hidden decoration. Lime only as strokes,
   outlines and motion; no filled lime element. */
(function () {
  "use strict";
  if (window.__fxTaskDemo) return;
  window.__fxTaskDemo = true;

  var NS = "http://www.w3.org/2000/svg";
  var REST = 8;   /* after the demo the handle rests on "with me": a split at 50% cut both texts mid-word */
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function G() { return window.gsap || null; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; e.setAttribute("aria-hidden", "true"); return e; }
  function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function useIcon(id, cls) { var s = sv("svg", { "class": cls || "", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" }); var u = sv("use", { href: "#" + id }); u.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + id); s.appendChild(u); return s; }

  /* ---------- CSS, once ---------- */
  if (!document.getElementById("fx-taskdemo")) {
    var st = document.createElement("style");
    st.id = "fx-taskdemo";
    st.textContent = [
      /* the clock in the time chip: our own, so its hand can turn */
      "#scCap.td-hasclock > svg.ico:not(.td-clock){display:none}",
      "#scCap .td-clock{width:1.15em;height:1.15em;flex:none;overflow:visible;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:color .4s}",
      /* a neutral face; the loss colour only on its small dot (spec: red only on the dot of the clock) */
      "#scCap .td-clock{color:#a6a6a6}",
      "#scCap .td-clock .td-cdot{fill:var(--loss,#ff9b8a);stroke:none;transition:opacity .3s}",
      ".scene.td-grey #scCap .td-clock{color:#5a5a5a}",
      ".scene:has(.hand.is-after) #scCap .td-clock,.scene.td-won #scCap .td-clock{color:#D8FF00}",
      ".scene:has(.hand.is-after) #scCap .td-clock .td-cdot,.scene.td-won #scCap .td-clock .td-cdot{opacity:0}",
      /* the slim price row stays down while the demo plays (spec 3.4: hidden until the demo ends or the first touch) */
      "html.td-run{--bar:0px !important}",
      "html.td-run #l3bar.on{transform:translateY(110%) !important;visibility:hidden}",
      /* while the demo shows both halves, the 'with me' half is readable as it is uncovered */
      "#ph.hand.td-split .scr--a > *{opacity:1}",
      /* the gain line once the 'with me' side has played (the page keeps its place reserved) */
      "#ph.hand.td-gain .scr--a .scr__note.gain[hidden]:not(:empty){visibility:visible}",
      /* typing dots and the flying calendar chip live inside the mock-up */
      ".td-host{position:relative}",
      ".td-dots{position:absolute;right:0;display:inline-flex;align-items:center;padding:.55rem .8rem;border-radius:1.1rem 1.1rem .35rem 1.1rem;background:#1d1d1d;pointer-events:none}",
      ".td-dots svg{display:block;width:34px;height:10px}",
      ".td-chip{position:absolute;z-index:6;left:0;top:0;width:28px;height:14px;pointer-events:none}",
      ".td-chip svg{display:block;width:28px;height:14px;overflow:visible}",
      /* calendar in the 'with me' status bar; gets a lime dot when the booking lands */
      ".td-cal{position:relative;display:inline-grid;place-items:center;width:1.05rem;height:1.05rem;margin-left:auto;color:#8a8a85;flex:none}",
      ".td-cal + .scr__ex{margin-left:.45rem}",
      ".td-cal svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
      ".td-cal::after{content:'';position:absolute;right:-3px;top:-3px;width:6px;height:6px;border-radius:50%;background:#D8FF00;opacity:0;transform:scale(0);transition:opacity .25s,transform .3s cubic-bezier(.34,1.56,.64,1)}",
      ".td-cal.on{color:#D8FF00}",
      ".td-cal.on::after{opacity:1;transform:none}",
      /* ghost touch on the handle */
      ".td-ghost{position:absolute;left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:2px solid #D8FF00;opacity:0;pointer-events:none}",
      /* the steps line */
      "#l3steps.td-steps{position:relative}",
      ".td-line{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:1}",
      ".td-line path{fill:none;stroke:#D8FF00;stroke-width:1.5;stroke-linecap:round;opacity:.75}",
      "#l3steps.td-steps li > span{position:relative;z-index:2;background:#0e0e0e}",
      /* the breath of Order: an outline ring, never a fill */
      "#l3order.td-host-o{position:relative}",
      ".td-oring{position:absolute;inset:-2px;border-radius:inherit;border:2px solid #D8FF00;opacity:0;pointer-events:none}",
      "@media (prefers-reduced-motion: reduce){.td-dots,.td-chip,.td-ghost,.td-oring{display:none}.td-cal::after,#scCap .td-clock{transition:none}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ---------- state ---------- */
  var cur = null;          /* { n, sid, type } of the task page set up */
  var live = [];           /* tweens and timelines that belong to this page */
  var timers = [];         /* plain timeouts (fallbacks) */
  var demo = null;         /* { stage } while the auto demo runs */
  var paused = false, phSeen = 0, phIO = null, stepIO = null, stepRO = null, orderIO = null, mo = null;
  var lastPos = 86, armed = true, withBusy = null, rest50 = false;
  var stepsDone = false, breaths = 0, idleT = 0, orderOn = false;
  var clock = null, hand = { min: 240, hr: 290 }, calIco = null, ghost = null;

  function ph() { return document.getElementById("ph"); }
  function sceneEl() { return document.getElementById("scene"); }
  function onTask() { var l3 = document.getElementById("l3"); return !!(l3 && !l3.hidden && window.PH && window.PH.ctx && window.PH.ctx()); }
  function keep(x) { if (x) live.push(x); return x; }
  function later(fn, ms) { var g = G(); if (g) return keep(g.delayedCall(ms / 1000, fn)); var id = setTimeout(fn, ms); timers.push(id); return null; }
  function killLive() { live.forEach(function (x) { try { x.kill(); } catch (e) {} }); live = []; timers.forEach(clearTimeout); timers = []; }
  function pauseAll(on) { paused = on; live.forEach(function (x) { try { if (on) x.pause(); else x.resume(); } catch (e) {} }); }
  function key() { return cur ? "demo:" + cur.n + "/" + cur.sid : ""; }
  function seen() { try { return sessionStorage.getItem(key()) === "1"; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(key(), "1"); } catch (e) {} }
  /* how much of the phone is on screen now (the observer only reports crossings, and a redraw can move it) */
  function visRatio() {
    var h = ph(); if (!h) return 0;
    var r = h.getBoundingClientRect(); if (!r.height) return 0;
    return Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height;
  }
  function pos() { return window.PH && window.PH.pos ? window.PH.pos() : 86; }
  function setPos(v, smooth) { if (window.PH && window.PH.set) window.PH.set(v, smooth); }

  /* ---------- the clock in the time chip ---------- */
  function drawHands() {
    if (!clock) return;
    clock.mn.setAttribute("transform", "rotate(" + hand.min.toFixed(2) + " 12 12)");
    clock.hr.setAttribute("transform", "rotate(" + hand.hr.toFixed(2) + " 12 12)");
  }
  function addClock() {
    var cap = document.getElementById("scCap");
    if (!cap) return;
    var old = $(".td-clock", cap);
    if (old) { clock = old.__td; return; }
    var s = sv("svg", { "class": "ico td-clock", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    s.appendChild(sv("circle", { cx: 12, cy: 12, r: 9 }));
    var hr = sv("line", { x1: 12, y1: 12, x2: 12, y2: 8.2 });
    var mn = sv("line", { x1: 12, y1: 12, x2: 12, y2: 5.6 });
    s.appendChild(hr); s.appendChild(mn);
    s.appendChild(sv("circle", { "class": "td-cdot", cx: 19.4, cy: 4.6, r: 3.2 }));
    cap.insertBefore(s, cap.firstChild);
    cap.classList.add("td-hasclock");
    clock = { svg: s, mn: mn, hr: hr }; s.__td = clock;
    hand = { min: 240, hr: 290 };  /* 21:40, as in the chip */
    drawHands();
  }
  function removeClock() {
    var cap = document.getElementById("scCap");
    if (cap) { var c = $(".td-clock", cap); if (c) c.parentNode.removeChild(c); cap.classList.remove("td-hasclock"); }
    clock = null;
  }

  /* ---------- the calendar icon in the "with me" status bar (bookings only) ---------- */
  function addCal() {
    var head = $(".scr--a .scr__head", ph());
    if (!head) return;
    calIco = $(".td-cal", head);
    if (calIco) return;
    calIco = mk("span", "td-cal");
    calIco.appendChild(useIcon("l-calendar-days"));
    var ex = $(".scr__ex", head);
    head.insertBefore(calIco, ex || null);
  }
  function removeCal() { $$(".td-cal").forEach(function (c) { c.parentNode.removeChild(c); }); calIco = null; }

  /* ---------- elements of the mock-up, per kind ---------- */
  function mockB() { var b = document.getElementById("scBodyB"); return b && b.firstElementChild; }
  function mockA() { var a = document.getElementById("scBodyA"); return a && a.firstElementChild; }
  function kids(w) { return w ? [].slice.call(w.children) : []; }
  function booking() { return cur && (cur.type === "chat" || cur.type === "reminder"); }

  /* every element the demo touches, so a cancel can put them back exactly as the page drew them */
  function touched() {
    var out = [], b = mockB(), a = mockA();
    if (b) out = out.concat(kids(b), $$(".bad", b));
    if (a) out = out.concat(kids(a), $$(".good, .mk-tr, .mk-reply, .mk-img, .mk-btn, .mk-total, .mk-line", a));
    ["scLoss", "scGain", "scCapT"].forEach(function (id) { var e = document.getElementById(id); if (e) out.push(e); });
    $$("#l3steps li > span").forEach(function (e) { out.push(e); });
    var o = document.getElementById("l3order"); if (o) out.push(o);
    return out;
  }
  function clearAll() {
    var g = G();
    touched().forEach(function (e) {
      if (g) g.set(e, { clearProps: "opacity,transform,visibility" });
      else { e.style.opacity = ""; e.style.transform = ""; }
    });
    $$(".td-dots, .td-chip, .td-ghost, .td-oring").forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
    var o = document.getElementById("l3order"); if (o) { o.style.transition = ""; }
  }

  /* ---------- "without me": the loss ---------- */
  function painTl() {
    var g = G(), tl = g.timeline(), b = mockB(), sc = sceneEl();
    var bad = b ? $$(".bad", b) : [], lead = kids(b).filter(function (e) { return bad.indexOf(e) < 0 && !e.querySelector(".bad"); });
    var loss = document.getElementById("scLoss"), capT = document.getElementById("scCapT");
    if (lead.length) tl.fromTo(lead, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: "power2.out" }, 0);
    if (bad.length) tl.set(bad, { opacity: 0, scale: 0.9, transformOrigin: "0% 50%" }, 0);
    if (loss && !loss.hidden) tl.set(loss, { opacity: 0, y: 12 }, 0);
    /* the clock runs to midnight; the face greys, the time fades */
    if (clock) {
      var start = hand.min;
      tl.to(hand, { min: 1080, hr: 360, duration: 1.6, ease: "power1.in", onUpdate: drawHands, onStart: function () { hand.min = start; } }, 0.3);
    }
    tl.call(function () { if (sc) sc.classList.add("td-grey"); }, null, 0.3);
    if (capT) tl.to(capT, { opacity: 0.5, duration: 1.2, ease: "none" }, 0.5);
    if (bad.length) tl.to(bad, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.12, ease: "back.out(2)" }, 1.9);
    if (loss && !loss.hidden) tl.to(loss, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 2.2);
    tl.to({}, { duration: 1.0 }); /* hold the pain */
    return tl;
  }

  /* ---------- "with me": the fix (also on a manual drag past 70%) ---------- */
  function withTl() {
    var g = G(), tl = g.timeline(), a = mockA(), sc = sceneEl(), h = ph();
    var items = kids(a), capT = document.getElementById("scCapT"), gain = document.getElementById("scGain");
    tl.call(function () { if (sc) { sc.classList.remove("td-grey"); } }, null, 0);
    if (capT) tl.to(capT, { opacity: 1, duration: 0.3 }, 0);
    var t = 0, last = null;
    if (cur.type === "chat" && a) {
      var bubbles = items.filter(function (e) { return /sbub/.test(e.className); });
      var a1 = bubbles[0], a2 = $(".sbub--after", a), a3 = a2 && a2.nextElementSibling;
      if (a1) tl.fromTo(a1, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 0);
      if (a2) tl.set(a2, { opacity: 0 }, 0);
      if (a3) tl.set(a3, { opacity: 0 }, 0);
      if (a2) {
        a.classList.add("td-host");
        var dots = mk("div", "td-dots"), ds = sv("svg", { viewBox: "0 0 34 10" }), cs = [];
        for (var i = 0; i < 3; i++) { var c = sv("circle", { cx: 5 + i * 12, cy: 5, r: 3, fill: "#a6a6a6", opacity: "0.25" }); ds.appendChild(c); cs.push(c); }
        dots.appendChild(ds);
        tl.call(function () { dots.style.top = a2.offsetTop + "px"; a.appendChild(dots); }, null, 0.15);
        tl.fromTo(dots, { opacity: 0, scale: 0.85, transformOrigin: "100% 100%" }, { opacity: 1, scale: 1, duration: 0.15 }, 0.15);
        tl.to(cs, { attr: { opacity: 1 }, duration: 0.2, stagger: 0.15, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.2);
        tl.to(dots, { opacity: 0, duration: 0.12, onComplete: function () { if (dots.parentNode) dots.parentNode.removeChild(dots); } }, 0.75);
        tl.fromTo(a2, { opacity: 0, scale: 0.9, transformOrigin: "100% 100%" }, { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.6)" }, 0.8);
        t = 1.1; last = a2;
      }
      if (a3) { tl.fromTo(a3, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, 1.1); t = 1.25; last = a3; }
    } else if (a) {
      /* other kinds keep the same beat with their own parts */
      var key = $(".mk-reply, .mk-img, .mk-status.good, .mk-btn, .mk-total", a);
      var rows = $$(".mk-tr, .mk-line, .mk-row.good", a);
      var plain = items.filter(function (e) { return e !== key && rows.indexOf(e) < 0; });
      if (plain.length) tl.fromTo(plain, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.1, ease: "power2.out" }, 0);
      if (rows.length) {
        if (cur.type === "listing") tl.fromTo(rows, { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "bounce.out" }, 0.25);
        else tl.fromTo(rows, { x: -10, rotation: cur.type === "list" || cur.type === "doc" ? -3 : 0, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" }, 0.25);
      }
      if (key) {
        var kf = cur.type === "post" ? { scale: 0.6, opacity: 0.2 } : cur.type === "review" ? { y: 8, opacity: 0 } : { scale: 0.9, opacity: 0 };
        kf.transformOrigin = "50% 50%";
        tl.fromTo(key, kf, { scale: 1, y: 0, opacity: 1, duration: cur.type === "post" ? 0.5 : 0.3, ease: cur.type === "post" ? "power2.out" : "back.out(1.6)" }, 0.7);
        last = key; t = 1.05;
      } else t = 0.9;
      if (!last) last = items[items.length - 1] || null;
    }
    /* the booking lands in the status bar: a small outlined calendar chip flies along an arc */
    if (booking() && calIco && last) {
      var chip = mk("div", "td-chip"), cv = sv("svg", { viewBox: "0 0 28 14" });
      cv.appendChild(sv("rect", { x: 0.75, y: 0.75, width: 26.5, height: 12.5, rx: 4, fill: "#1d1d1d", stroke: "#D8FF00", "stroke-width": 1.5 }));
      var ic = sv("svg", { x: 9, y: 2, width: 10, height: 10, viewBox: "0 0 24 24", fill: "none", stroke: "#D8FF00", "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" });
      ic.appendChild(sv("use", { href: "#l-calendar-days" }));
      cv.appendChild(ic); chip.appendChild(cv);
      var scr = $(".scr--a", h), P = { x0: 0, y0: 0, x1: 0, y1: 0 };
      tl.call(function () {
        if (!scr || !last.isConnected) return;
        var r = scr.getBoundingClientRect(), l = last.getBoundingClientRect(), c = calIco.getBoundingClientRect();
        P.x0 = Math.min(l.right - r.left - 28, r.width - 32); P.y0 = Math.min(l.bottom - r.top + 3, r.height - 18);   /* leaves from just under the last item, not over its words */ P.x1 = c.left + c.width / 2 - r.left - 14; P.y1 = c.top + c.height / 2 - r.top - 7;
        scr.appendChild(chip);
        g.set(chip, { x: P.x0, y: P.y0, opacity: 0, scale: 0.6 });
      }, null, t);
      tl.to(chip, { opacity: 1, scale: 1, duration: 0.15 }, t + 0.01);
      tl.to(chip, { x: function () { return P.x1; }, duration: 0.6, ease: "power1.out" }, t + 0.12);
      tl.to(chip, { y: function () { return P.y1; }, duration: 0.6, ease: "power2.in" }, t + 0.12);
      tl.to(chip, { scale: 0.4, opacity: 0, duration: 0.14, onComplete: function () { if (chip.parentNode) chip.parentNode.removeChild(chip); } }, t + 0.7);
      tl.call(function () { calIco.classList.add("on"); }, null, t + 0.72);
      t += 0.75;
    }
    /* the clock turns lime and moves one tick; the gain line shows */
    tl.call(function () { if (sc) sc.classList.add("td-won"); if (h) h.classList.add("td-gain"); }, null, t);
    if (clock) tl.to(hand, { min: "+=6", duration: 0.25, ease: "back.out(2)", onUpdate: drawHands }, t);
    if (gain && gain.textContent) tl.fromTo(gain, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, t + 0.05);
    return tl;
  }
  /* the parts withTl() brings in, hidden before the sweep uncovers them (no flash of the final frame) */
  function preHideWith() {
    var g = G(), a = mockA();
    if (!g || !a || !cur) return;
    var hide = cur.type === "chat" ? kids(a).filter(function (e) { return /sbub/.test(e.className); })
      : kids(a).concat($$(".mk-reply, .mk-img, .mk-status.good, .mk-btn, .mk-total, .mk-tr, .mk-line, .mk-row.good", a));
    g.set(hide, { opacity: 0 });
    var gain = document.getElementById("scGain"); if (gain) g.set(gain, { opacity: 0 });
  }
  function playWith(done) {
    var g = G();
    if (!g || !cur || reduced()) { finalWith(); if (done) done(); return; }
    if (withBusy) { withBusy.kill(); withBusy = null; clearMock(); }
    withBusy = keep(withTl());
    withBusy.eventCallback("onComplete", function () { withBusy = null; if (done) done(); });
    if (paused) withBusy.pause();
  }
  function clearMock() {
    var g = G(), a = mockA();
    if (g && a) g.set(kids(a).concat($$(".good, .mk-tr, .mk-reply, .mk-img, .mk-btn, .mk-total, .mk-line", a)), { clearProps: "opacity,transform" });
    $$(".td-dots, .td-chip").forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
  }
  /* the end state of "with me", without movement */
  function finalWith() {
    var sc = sceneEl(), h = ph();
    if (sc) { sc.classList.remove("td-grey"); }
    if (h) h.classList.add("td-gain");
    if (calIco && booking()) calIco.classList.add("on");
  }

  /* ---------- watch the handle: the visitor's own drag past 70% replays "with me" ---------- */
  function onPos() {
    var p = pos(), h = ph(), sc = sceneEl();
    if (p <= 30 && lastPos > 30 && armed) { armed = false; if (!demo) playWith(); }
    if (p >= 55) armed = true;
    if (p > 45 && sc && !demo && !withBusy) sc.classList.remove("td-won");
    if (h && !demo && p > 80) h.classList.remove("td-split");
    lastPos = p;
  }

  /* ---------- A) the auto demo ---------- */
  function canDemo() { return !!(G() && cur && !reduced() && !seen() && ph() && !document.getElementById("scene").hidden); }
  function startDemo() {
    if (demo || !canDemo()) return;
    var g = G(), h = ph();
    markSeen();
    demo = { stage: "pain" };
    document.documentElement.classList.add("td-run");
    if (window.PH.stop) window.PH.stop();   /* the demo replaces the page's idle ring while it runs */
    setPos(86, false); lastPos = 86; armed = true;
    var tl = keep(painTl());
    tl.eventCallback("onComplete", function () {
      if (!demo) return;
      demo.stage = "sweep";
      preHideWith();   /* the "with me" parts wait unseen behind the handle until they play */
      h.classList.add("td-split");
      var o = { p: pos() };
      keep(g.to(o, { p: 8, duration: 0.9, ease: "power2.inOut", onUpdate: function () { setPos(o.p, false); } }));
      /* the "with me" side plays as the handle crosses 70% (onPos stays quiet while the demo runs) */
      later(function () {
        if (!demo) return;
        demo.stage = "with"; armed = false;
        playWith(function () {
          if (!demo) return;
          later(function () {
            if (!demo) return;
            demo.stage = "rest";
            var r = { p: pos() };
            keep(g.to(r, { p: REST, duration: 0.7, ease: "back.out(1.4)", onUpdate: function () { setPos(r.p, false); }, onComplete: ghostTap }));
          }, 800);
        });
      }, 500);
    });
    if (paused) tl.pause();
  }
  function ghostTap() {
    var g = G(), knob = document.getElementById("phKnob");
    if (!demo || !knob) { endDemo(); return; }
    demo.stage = "ghost";
    ghost = mk("span", "td-ghost"); knob.appendChild(ghost);
    var tl = keep(g.timeline({ onComplete: endDemo }));
    tl.fromTo(ghost, { scale: 1, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.8, ease: "power2.out" });
    tl.fromTo(ghost, { scale: 1, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.8, ease: "power2.out" }, 0.9);
  }
  function endDemo() {
    var h = ph();
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    demo = null; rest50 = true;
    if (clock) { hand.min = 240; hand.hr = 290; drawHands(); }   /* at rest the chip reads 21:40 again */
    document.documentElement.classList.remove("td-run");
    if (h) { h.classList.add("td-split"); h.classList.add("is-idle"); }   /* the page's own hint ring resumes */
    var sc = sceneEl(); if (sc) sc.classList.remove("td-won");
    lastPos = pos();
  }
  /* any touch on the phone: stop where it is, everything readable */
  function cancel() {
    if (!demo && !withBusy) return;
    var wasDemo = !!demo;
    demo = null; withBusy = null;
    document.documentElement.classList.remove("td-run");
    killLive(); clearAll();
    var sc = sceneEl(); if (sc) sc.classList.remove("td-grey");
    if (clock) { hand.min = 240; hand.hr = 290; drawHands(); }
    if (wasDemo) finalWith();
    breathe.arm();
    stepsArm();
  }

  /* ---------- B) the steps line ---------- */
  function stepPath(svgEl, list) {
    var spans = $$("li > span", list), r = list.getBoundingClientRect();
    if (spans.length < 2 || !r.width) return "";
    var pts = spans.map(function (s) { var q = s.getBoundingClientRect(); return { x: q.left + q.width / 2 - r.left, y: q.top + q.height / 2 - r.top, rr: q.width / 2 + 3 }; });
    svgEl.setAttribute("viewBox", "0 0 " + r.width.toFixed(1) + " " + r.height.toFixed(1));
    var d = "";
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
      if (L <= a.rr + b.rr + 4) continue;
      var ux = dx / L, uy = dy / L;
      d += "M" + (a.x + ux * a.rr).toFixed(1) + " " + (a.y + uy * a.rr).toFixed(1) + "L" + (b.x - ux * b.rr).toFixed(1) + " " + (b.y - uy * b.rr).toFixed(1);
    }
    return d;
  }
  var stepLine = null;
  function stepsSetup() {
    var list = document.getElementById("l3steps");
    if (!list || list.hidden) return;
    list.classList.add("td-steps");
    stepLine = $(".td-line", list);
    if (!stepLine) {
      stepLine = sv("svg", { "class": "td-line", "aria-hidden": "true", focusable: "false", preserveAspectRatio: "none" });
      stepLine.appendChild(sv("path", { d: "" }));
      list.appendChild(stepLine);
    }
    relayLine();
    if ("ResizeObserver" in window) { stepRO = new ResizeObserver(relayLine); stepRO.observe(list); }
    if (reduced() || !G() || !("IntersectionObserver" in window)) { drawLine(true); return; }
    hideLine();
    stepIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio >= 0.5 && !stepsDone) drawLine(false); }); }, { threshold: [0, 0.5] });
    stepIO.observe(list);
  }
  function relayLine() {
    if (!stepLine) return;
    var p = stepLine.firstChild, list = stepLine.parentNode, d = stepPath(stepLine, list);
    p.setAttribute("d", d);
    var L = d ? p.getTotalLength() : 0;
    p.style.strokeDasharray = L ? L.toFixed(1) + " " + (L + 2).toFixed(1) : "";
    if (stepsDone || !stepIO) p.style.strokeDashoffset = "0";
    else if (!stepLine.__drawing) p.style.strokeDashoffset = L.toFixed(1);
    stepLine.__len = L;
  }
  function hideLine() { var p = stepLine && stepLine.firstChild; if (p) p.style.strokeDashoffset = String(stepLine.__len || 0); }
  function stepsArm() { if (stepsDone || !stepLine) return; if (stepLine.__drawing) { stepLine.__drawing = false; drawLine(true); } }
  function drawLine(instant) {
    if (!stepLine) return;
    stepsDone = true;
    if (stepIO) { stepIO.disconnect(); }
    var p = stepLine.firstChild, g = G(), L = stepLine.__len || 0, spans = $$("#l3steps li > span");
    if (instant || !g || reduced() || !L) { p.style.strokeDashoffset = "0"; return; }
    stepLine.__drawing = true;
    var o = { v: L };
    var tl = keep(g.timeline({ onComplete: function () { stepLine && (stepLine.__drawing = false); } }));
    tl.to(o, { v: 0, duration: 0.9, ease: "power1.inOut", onUpdate: function () { p.style.strokeDashoffset = o.v.toFixed(1); } }, 0);
    spans.forEach(function (s, i) {
      var at = spans.length > 1 ? (i / (spans.length - 1)) * 0.9 : 0;
      tl.fromTo(s, { scale: 0.8 }, { scale: 1, duration: 0.2, ease: "back.out(2)", clearProps: "transform" }, Math.max(0, at - 0.05));
    });
    if (paused) tl.pause();
  }

  /* ---------- C) the big Order breathes once after 5 s idle ---------- */
  var breathe = {
    arm: function () {
      clearTimeout(idleT); idleT = 0;
      if (!orderOn || breaths >= 2 || demo || reduced() || !G() || document.hidden || !cur) return;
      idleT = setTimeout(breathe.go, 5000);
    },
    go: function () {
      idleT = 0;
      var o = document.getElementById("l3order"), g = G();
      if (!o || !orderOn || demo || breaths >= 2 || document.hidden) return;
      breaths++;
      o.classList.add("td-host-o");
      o.style.transition = "box-shadow .25s";   /* the button's own transform transition would lag the tween */
      var ring = mk("span", "td-oring"); o.appendChild(ring);
      var tl = keep(g.timeline({ onComplete: function () { if (ring.parentNode) ring.parentNode.removeChild(ring); o.style.transition = ""; g.set(o, { clearProps: "transform" }); } }));
      tl.to(o, { scale: 1.04, duration: 0.4, ease: "sine.out" }, 0);
      tl.to(o, { scale: 1, duration: 0.5, ease: "sine.inOut" }, 0.4);
      tl.fromTo(ring, { scale: 1, opacity: 0.6 }, { scale: 1.18, opacity: 0, duration: 0.9, ease: "power2.out" }, 0.1);
    }
  };
  function anyInput() { if (cur) breathe.arm(); }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (t) { window.addEventListener(t, anyInput, { passive: true, capture: true }); });
  window.addEventListener("scroll", anyInput, { passive: true });

  /* ---------- setup and cleanup per task page ---------- */
  function teardown() {
    var wasDemo = !!demo;
    demo = null; withBusy = null;
    document.documentElement.classList.remove("td-run");
    killLive(); clearAll();
    if (phIO) { phIO.disconnect(); phIO = null; }
    if (stepIO) { stepIO.disconnect(); stepIO = null; }
    if (stepRO) { stepRO.disconnect(); stepRO = null; }
    if (orderIO) { orderIO.disconnect(); orderIO = null; }
    if (mo) { mo.disconnect(); mo = null; }
    clearTimeout(idleT); idleT = 0;
    var h = ph(); if (h) { h.classList.remove("td-split", "td-gain"); if (wasDemo) h.classList.remove("is-idle"); }
    var sc = sceneEl(); if (sc) sc.classList.remove("td-grey", "td-won");
    var list = document.getElementById("l3steps");
    if (list) { list.classList.remove("td-steps"); var ln = $(".td-line", list); if (ln) ln.parentNode.removeChild(ln); }
    var o = document.getElementById("l3order"); if (o) o.classList.remove("td-host-o");
    $$(".td-host").forEach(function (e) { e.classList.remove("td-host"); });
    removeClock(); removeCal();
    stepLine = null; stepsDone = false; breaths = 0; orderOn = false; phSeen = 0; paused = false; rest50 = false;
    cur = null;
  }
  function setup() {
    var ctx = window.PH && window.PH.ctx && window.PH.ctx();
    if (!ctx || !onTask()) { if (cur) teardown(); return; }
    var type = window.PH.kind ? window.PH.kind() : null;
    /* same task drawn again: refresh, unless the phone was not there yet (content.js loads async) */
    if (cur && cur.n === ctx[0] && cur.sid === ctx[1] && cur.phone) { refresh(type); return; }
    if (cur) teardown();
    cur = { n: ctx[0], sid: ctx[1], type: type };
    var h = ph(), sc = sceneEl();
    if (!h || !sc || sc.hidden) { stepsSetup(); orderWatch(); return; }
    cur.phone = true;
    addClock();
    if (booking()) addCal();
    lastPos = pos(); armed = lastPos > 30;
    if ("MutationObserver" in window) { mo = new MutationObserver(onPos); mo.observe(h, { attributes: true, attributeFilter: ["style"] }); }
    stepsSetup();
    orderWatch();
    if (reduced() || !G()) {
      /* the final frame: handle at 50%, both halves still, loss and gain visible */
      if (!seen()) markSeen();   /* reduced motion: the page's own start ("without me" whole), the visitor drags */
      h.classList.add("td-split");
      finalWith();
      return;
    }
    if (seen()) return;   /* once per task per session; the page's idle ring stays as it is */
    /* the price row waits for the demo (or the first touch, or a scroll past the phone) */
    document.documentElement.classList.add("td-run");
    phIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        phSeen = e.intersectionRatio;
        if (!demo && !e.isIntersecting && e.boundingClientRect.top < 0) document.documentElement.classList.remove("td-run");
        if (!demo && phSeen >= 0.6 && !seen()) later(function () { if (visRatio() >= 0.6 && !document.hidden) startDemo(); }, 350);
        else if (demo) { pauseAll(document.hidden || phSeen < 0.2); document.documentElement.classList.toggle("td-run", phSeen >= 0.2); }
      });
    }, { threshold: [0, 0.2, 0.6] });
    phIO.observe(h);
  }
  /* the phone was drawn again for the same task (language switch or new content) */
  function refresh(type) {
    cur.type = type;
    var h = ph();
    var replay = !!demo && !reduced();
    if (demo || withBusy) { cancel(); if (h && pos() <= 80) h.classList.add("td-split"); else if (h) h.classList.remove("td-split", "td-gain"); }
    /* a language switch in the middle of the demo plays it again, in the new language */
    if (replay) { try { sessionStorage.removeItem(key()); } catch (e) {} later(function () { phSeen = visRatio(); if (cur && phSeen >= 0.6 && !document.hidden) startDemo(); }, 300); }
    addClock(); removeCal(); if (booking()) addCal();
    if (h && h.classList.contains("td-gain") && booking() && calIco) calIco.classList.add("on");
    /* the page put the handle back to its start for a visitor who had not touched it: keep our resting frame */
    if (rest50 && h) { if (window.PH.stop) window.PH.stop(); setPos(REST, false); lastPos = REST; h.classList.add("td-split"); if (!reduced()) h.classList.add("is-idle"); }
    if (stepLine) relayLine();
  }
  function orderWatch() {
    var o = document.getElementById("l3order");
    if (!o || !("IntersectionObserver" in window)) return;
    orderIO = new IntersectionObserver(function (es) { es.forEach(function (e) { orderOn = e.intersectionRatio >= 0.6; if (orderOn) breathe.arm(); else { clearTimeout(idleT); idleT = 0; } }); }, { threshold: [0, 0.6] });
    orderIO.observe(o);
  }

  /* pointerdown on the phone cancels the demo (the page's own handler stops its nudge) */
  function hookPh() {
    var h = ph();
    if (!h || h.__tdHooked) return;
    h.__tdHooked = true;
    /* the visitor took the phone: a demo that has not started yet never starts on this task */
    function took() { rest50 = false; document.documentElement.classList.remove("td-run"); if (cur && !demo) markSeen(); }
    h.addEventListener("pointerdown", function () { took(); if (demo || withBusy) cancel(); }, true);
    var k = document.getElementById("phKnob");
    if (k) k.addEventListener("keydown", function (e) { if (/^(Arrow|Home|End)/.test(e.key)) { took(); if (demo) cancel(); } }, true);
    $$(".ph__lbl").forEach(function (l) { l.addEventListener("click", function () { took(); if (demo) cancel(); }, true); });
  }

  document.addEventListener("visibilitychange", function () {
    if (demo || withBusy || live.length) pauseAll(document.hidden || (demo && phSeen < 0.2));
    if (document.hidden) { clearTimeout(idleT); idleT = 0; } else breathe.arm();
  });
  window.addEventListener("vf:scene", function () { hookPh(); setup(); });
  window.addEventListener("vf:route", function (e) {
    var d = (e && e.detail) || {};
    if (!d.task) { if (cur) teardown(); return; }
    if (!cur || cur.n !== d.niche || cur.sid !== d.task) setup();
  });
  window.addEventListener("vf:lang", function () { if (cur) refresh(window.PH && window.PH.kind ? window.PH.kind() : cur.type); });
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (cur) { teardown(); setup(); } });

  /* loaded with defer after app.js: the first task page may already be on screen */
  function boot() { hookPh(); if (onTask()) setup(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
;
/* ---- fx/retention.js ---- */
/* fx/retention: the return visitor (spec 3.7).
   Works only when localStorage already holds something ("vf.lastNiche", "vf.lastTask", "vf.ordered");
   a first visit looks exactly as before.
   Home: the carousel starts at the last business (event "car:show"). Over that card an outline chip
     with the task icon slides in (y -6 to 0, 0.3s) once the hero has made its point:
     "Again: {task}" leads straight to the last task page; if a task of this business was ordered,
     "Next for the salon: {task}" leads to the next task in pain order that is not ordered yet.
     The chip shows only while that business is the centre card.
   Business page: ordered tasks get a lime check over their icon (drawn in 0.25s, once per load).
     The loss label moves to the next task that is not ordered, reads "Next leak is here", and the
     only filled arrow moves with it (the page's own .cc--top rules); on a wide screen the carousel
     centres that card. The loss strip of fx/glyphs plays the .cc--top card first.
   No endless motion, no filled lime button (outline, stroke and motion only). Reduced motion: final
   frame at once. Cleans up on "vf:route", rewrites its words on "vf:lang". */
(function () {
  "use strict";
  var D = document, W = window, root = D.documentElement;
  if (W.__fxRetention) return;
  W.__fxRetention = true;

  var NS = "http://www.w3.org/2000/svg";
  var LIME = "#D8FF00";
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function gs() { return W.gsap || null; }
  function F() { return W.FUNNEL || { niches: {}, sv: {} }; }

  /* ---------- words (only these, spec 3.7) ---------- */
  var L = {
    ru: { again: "Снова: {task}", next: "Следующее для {n}: {task}", nextAny: "Следующее: {task}", label: "Дальше теряешь здесь",
          n: { salon: "салона", cafe: "кафе", shop: "магазина", trades: "мастерской", fitness: "фитнеса", clinic: "клиники", cleaning: "клининга", office: "офиса" } },
    uk: { again: "Знову: {task}", next: "Наступне для {n}: {task}", nextAny: "Наступне: {task}", label: "Далі втрачаєш тут",
          n: { salon: "салону", cafe: "кафе", shop: "магазину", trades: "майстерні", fitness: "фітнесу", clinic: "клініки", cleaning: "клінінгу", office: "офісу" } },
    de: { again: "Nochmal: {task}", next: "Als Nächstes: {task}", nextAny: "Als Nächstes: {task}", label: "Hier verlierst du als Nächstes", n: {} },
    en: { again: "Back to: {task}", next: "Next for your {n}: {task}", nextAny: "Next: {task}", label: "Next leak is here",
          n: { salon: "salon", cafe: "cafe", shop: "shop", trades: "workshop", fitness: "studio", clinic: "clinic", cleaning: "business", office: "office" } }
  };
  function lang() { var l = (root.lang || "en").slice(0, 2); return L[l] ? l : "en"; }
  function W8() { return L[lang()]; }
  function taskName(sid) {
    var v = W.VF && W.VF.t ? W.VF.t("sv." + sid + ".h") : null;
    return v || sid;
  }

  /* ---------- storage (written by app.js) ---------- */
  function raw(k) { try { return localStorage.getItem("vf." + k); } catch (e) { return null; } }
  function lastNiche() { var n = raw("lastNiche"); return n && F().niches[n] ? n : null; }
  function lastTask() { var v = raw("lastTask"); var p = v ? v.split("/") : []; return p.length === 2 ? { n: p[0], t: p[1] } : null; }
  function ordered() {
    var v = raw("ordered"), a = [];
    try { a = v ? JSON.parse(v) : []; } catch (e) { a = []; }
    return Object.prototype.toString.call(a) === "[object Array]" ? a : [];
  }
  function orderedIn(n) {
    var out = {};
    ordered().forEach(function (k) { var p = String(k).split("/"); if (p[0] === n && p[1]) out[p[1]] = 1; });
    return out;
  }
  function ranks(n) { return (F().niches[n] || []).map(function (r) { return r[0]; }); }
  /* the task the home chip leads to: { sid, kind: "again" | "next" } or null */
  function pick(n) {
    var o = orderedIn(n), rk = ranks(n), any = false, i;
    for (i = 0; i < rk.length; i++) if (o[rk[i]]) { any = true; break; }
    if (any) {
      for (i = 0; i < rk.length; i++) if (!o[rk[i]]) return { sid: rk[i], kind: "next" };
      return null; /* everything here is ordered: nothing to push */
    }
    var lt = lastTask();
    if (lt && lt.n === n && rk.indexOf(lt.t) > -1) return { sid: lt.t, kind: "again" };
    return null;
  }
  function narrow() { return W.innerWidth < 480; }
  function chipText(n, p) {
    var w = W8(), tn = taskName(p.sid);
    if (p.kind === "again") return w.again.replace("{task}", tn);
    var nn = narrow() ? null : w.n[n]; /* a phone gets the short form so the chip stays on one or two lines */
    return (nn ? w.next.replace("{n}", nn) : w.nextAny).replace("{task}", tn);
  }

  /* ---------- CSS (once) ---------- */
  if (!D.getElementById("fx-retention")) {
    var st = D.createElement("style");
    st.id = "fx-retention";
    st.textContent = [
      "#services.fxrt-host { position: relative; }",
      ".fxrt-row { position: absolute; left: 0; right: 0; top: 0; z-index: 6; display: flex; justify-content: center; padding-inline: 8px; pointer-events: none; }",
      ".fxrt-chip { pointer-events: auto; display: inline-flex; align-items: center; gap: 0.55rem; min-height: 44px; max-width: min(100%, 460px); box-sizing: border-box;",
      "  padding: 0.35rem 0.95rem 0.35rem 0.7rem; border: 1.5px solid " + LIME + "; border-radius: 999px; background: rgba(11, 11, 11, 0.94); color: #fff;",
      "  font-family: var(--f-body, sans-serif); font-size: 14px; font-weight: 600; line-height: 1.25; text-decoration: none; text-align: left;",
      "  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55); opacity: 0; transform: translateY(-6px); transition: opacity 0.3s ease, transform 0.3s ease; visibility: hidden; }",
      ".fxrt-chip.is-on { opacity: 1; transform: none; visibility: visible; }",
      ".fxrt-chip.is-off { opacity: 0 !important; visibility: hidden; transition: opacity 0.15s ease, visibility 0s 0.15s; pointer-events: none; }",
      ".fxrt-chip:hover, .fxrt-chip:focus-visible { border-color: #fff; outline: none; }",
      ".fxrt-chip:focus-visible { box-shadow: 0 0 0 3px rgba(216, 255, 0, 0.35), 0 6px 20px rgba(0, 0, 0, 0.55); }",
      ".fxrt-chip .fxrt-i { width: 20px; height: 20px; flex: none; color: " + LIME + "; }",
      ".fxrt-chip .fxrt-a { width: 16px; height: 16px; flex: none; color: " + LIME + "; transition: transform 0.25s ease; }",
      ".fxrt-chip:hover .fxrt-a { transform: translateX(3px); }",
      ".fxrt-t { min-width: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }",
      ".fxrt-t span { color: #bdbdbd; font-weight: 500; }",
      "@media (max-width: 360px) { .fxrt-chip { font-size: 13px; gap: 0.45rem; padding-inline: 0.6rem 0.8rem; } }",
      /* a phone has only a thin gap between the price chip and the card: a one line pill (32px seen, 44px to touch)
         that does not hide the business icon; if the words do not fit, the grey prefix gives way to the task name */
      "@media (max-width: 479px) {",
      "  .fxrt-chip { position: relative; min-height: 32px; max-width: 100%; gap: 0.45rem; padding: 0.15rem 0.75rem 0.15rem 0.6rem; font-size: 13px; line-height: 1.2; }",
      "  .fxrt-chip::before { content: \"\"; position: absolute; left: 0; right: 0; top: -6px; bottom: -6px; }",
      "  .fxrt-chip .fxrt-i { width: 18px; height: 18px; }",
      "  .fxrt-t { display: block; flex: 0 1 auto; white-space: nowrap; text-overflow: ellipsis; -webkit-line-clamp: none; }",
      "  .fxrt-chip.fxrt-short .fxrt-t span { display: none; }",
      "}",
      /* the check over an ordered task's icon */
      ".fxrt-ok { position: absolute; top: -3px; right: -3px; width: clamp(22px, 32%, 30px); height: clamp(22px, 32%, 30px); z-index: 3; pointer-events: none; overflow: visible; }",
      ".fxrt-ok path { transition: stroke-dashoffset 0.25s ease-out; }",
      "@media (prefers-reduced-motion: reduce) { .fxrt-chip, .fxrt-ok path { transition: none !important; } }"
    ].join("\n");
    (D.head || root).appendChild(st);
  }

  function svgEl(tag, attrs) {
    var e = D.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function icon(id, cls) {
    var s = svgEl("svg", { "class": cls, "aria-hidden": "true", focusable: "false" }), u = svgEl("use", { href: "#" + id });
    s.appendChild(u);
    return s;
  }

  /* =====================================================================
     HOME: start at the last business, chip over its card
     ===================================================================== */
  var home = null; /* { n, p, row, chip, mo, timers, raf } */
  var heroDone = false, chipShownOnce = false;
  W.addEventListener("fx:hero", function () { heroDone = true; if (home && home.waiting) revealSoon(0); });

  function homeEl() { return D.getElementById("home"); }
  function work() { return D.getElementById("work"); }
  function onHome() { var h = homeEl(); return !!h && !h.hidden; }
  function cardOf(n) {
    var w = work(); if (!w) return null;
    var cs = w.querySelectorAll(".car__track > .cc"), i;
    for (i = 0; i < cs.length; i++) if ((cs[i].getAttribute("href") || "").split("/").pop() === n) return cs[i];
    return null;
  }

  function killHome() {
    if (!home) return;
    home.timers.forEach(clearTimeout);
    if (home.raf) cancelAnimationFrame(home.raf);
    if (home.mo) home.mo.disconnect();
    if (home.ro) home.ro.disconnect();
    if (home.tw) home.tw.kill();
    if (home.row && home.row.parentNode) home.row.parentNode.removeChild(home.row);
    home = null;
  }

  /* move the carousel to the last business; app.js ignores it until the carousel is ready, so retry a few frames */
  function centre(n, tries) {
    var c = cardOf(n);
    if (!c || !onHome()) return;
    if (c.classList.contains("mid")) { place(); return; }
    W.dispatchEvent(new CustomEvent("car:show", { detail: n }));
    if (tries > 0) requestAnimationFrame(function () { centre(n, tries - 1); });
  }

  function buildChip(n, p) {
    var a = D.createElement("a");
    a.className = "fxrt-chip";
    a.href = "#/for/" + n + "/" + p.sid;
    var sv = F().sv[p.sid];
    a.appendChild(icon("l-" + (sv && sv.icon ? sv.icon : "sparkles"), "ico ph fxrt-i"));
    var t = D.createElement("span");
    t.className = "fxrt-t";
    a.appendChild(t);
    a.appendChild(icon("i-arrow", "ico fxrt-a"));
    fillChip(a, n, p);
    return a;
  }
  function fillChip(a, n, p) {
    var full = chipText(n, p), cut = full.indexOf(": "), t = a.querySelector(".fxrt-t");
    while (t.firstChild) t.removeChild(t.firstChild);
    if (cut > -1) {
      var s = D.createElement("span"); s.textContent = full.slice(0, cut + 1);
      t.appendChild(s);
      t.appendChild(D.createTextNode(" " + full.slice(cut + 2)));
    } else t.textContent = full;
    a.setAttribute("aria-label", full);
    a.title = full;
  }

  /* phone: one line; drop the grey prefix (still in aria-label) before the task name gets cut */
  function fit(a) {
    var t = a.querySelector(".fxrt-t");
    a.classList.remove("fxrt-short");
    if (!t || !narrow()) return;
    if (t.scrollWidth > t.clientWidth + 1) a.classList.add("fxrt-short");
  }

  /* the chip rides on the top edge of the business card, outside .car so the carousel's click logic leaves it alone */
  function place() {
    if (!home || !home.row) return;
    var c = cardOf(home.n), host = D.getElementById("services");
    if (!c || !host) return;
    var hr = host.getBoundingClientRect(), track = c.parentNode, tr = track.getBoundingClientRect();
    var top = (c.offsetParent === track ? tr.top + c.offsetTop : c.getBoundingClientRect().top) - hr.top;
    fit(home.chip);
    var h = home.chip.offsetHeight || 44, ask = D.querySelector(".hero__ask"), y = top - h / 2;
    /* never over the question and the price chip above */
    if (ask && ask.offsetWidth) y = Math.max(y, ask.getBoundingClientRect().bottom - hr.top + 4);
    home.row.style.top = Math.round(y) + "px";
    sync();
  }
  /* visible only while that card is in the centre and nobody is dragging */
  function sync() {
    if (!home || !home.chip) return;
    var c = cardOf(home.n), w = work(), tr = w && w.querySelector(".car__track");
    var off = !c || !c.classList.contains("mid") || (tr && tr.classList.contains("drag"));
    home.chip.classList.toggle("is-off", !!off);
    home.chip.tabIndex = off ? -1 : 0;
  }

  function reveal() {
    if (!home || home.shown) return;
    if (D.hidden) { home.waiting = true; return; }
    home.shown = true; home.waiting = false; chipShownOnce = true;
    place();
    var a = home.chip, G = gs();
    if (reduced() || !G) { a.classList.add("is-on"); return; } /* CSS transition does the slide without GSAP; none when reduced */
    a.style.transition = "none";
    a.classList.add("is-on");
    home.tw = G.fromTo(a, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out", onComplete: function () { G.set(a, { clearProps: "transform,opacity" }); a.style.transition = ""; } });
  }
  function revealSoon(ms) {
    if (!home || home.shown) return;
    home.timers.push(setTimeout(reveal, ms));
  }

  function setupHome() {
    killHome();
    if (!onHome()) return;
    var n = lastNiche();
    if (!n || !work()) return;
    home = { n: n, p: null, row: null, chip: null, timers: [], shown: false, waiting: false };
    centre(n, 30);
    var p = pick(n);
    if (!p) return;
    home.p = p;
    var host = D.getElementById("services");
    host.classList.add("fxrt-host");
    var row = D.createElement("div");
    row.className = "fxrt-row";
    var chip = buildChip(n, p);
    row.appendChild(chip);
    host.appendChild(row);
    home.row = row; home.chip = chip;
    place();
    /* follow the centre card */
    var tr = work().querySelector(".car__track");
    if (tr && "MutationObserver" in W) {
      home.mo = new MutationObserver(function () { if (home && !home.raf) home.raf = requestAnimationFrame(function () { if (home) { home.raf = 0; sync(); } }); });
      home.mo.observe(tr, { attributes: true, attributeFilter: ["class"], subtree: true });
    }
    if ("ResizeObserver" in W) { home.ro = new ResizeObserver(function () { place(); }); home.ro.observe(work()); }
    /* after the hero has fixed its night phone (its first lime wave lands near 2.6s); at once when reduced or seen before */
    if (reduced() || chipShownOnce || heroDone || !D.querySelector(".fxh, #fxHero, [data-fx-hero]")) revealSoon(reduced() ? 0 : (chipShownOnce || heroDone ? 250 : 1600));
    else revealSoon(3200);
  }

  /* =====================================================================
     BUSINESS PAGE: checks on ordered tasks, the loss label moves on
     ===================================================================== */
  var drawn = {};  /* "niche/task" -> the check was drawn once this load */
  var biz = null;  /* { sec, label, top0, top1, checks, tw } */

  function killBiz() {
    if (!biz) return;
    if (biz.tw) biz.tw.forEach(function (t) { t.kill(); });
    biz.checks.forEach(function (s) { if (s.parentNode) s.parentNode.removeChild(s); });
    var lb = biz.label;
    if (lb && biz.top0 && biz.top1 && biz.top1 !== biz.top0) {
      biz.top1.classList.remove("cc--top");
      biz.top0.classList.add("cc--top");
      biz.top0.insertBefore(lb, biz.top0.firstChild);
    }
    if (lb) {
      lb.hidden = false;
      if (lb.getAttribute("data-fxrt-i18n")) { lb.setAttribute("data-i18n", lb.getAttribute("data-fxrt-i18n")); lb.removeAttribute("data-fxrt-i18n"); }
      if (W.VF && W.VF.t) lb.textContent = W.VF.t(lb.getAttribute("data-i18n") || "nv.top");
    }
    biz = null;
  }

  function check(art, key) {
    var s = svgEl("svg", { "class": "fxrt-ok", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svgEl("circle", { cx: "12", cy: "12", r: "10.5", fill: "#0b0b0b", stroke: LIME, "stroke-width": "1.5" }));
    var p = svgEl("path", { d: "M7.2 12.4l3.2 3.2 6.4-6.6", fill: "none", stroke: LIME, "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "16", "stroke-dashoffset": drawn[key] || reduced() ? "0" : "16" });
    s.appendChild(p);
    art.appendChild(s);
    return { svg: s, path: p };
  }

  function nicheOfHash() { var m = location.hash.match(/^#\/for\/([a-z]+)$/); return m ? m[1] : null; }

  function setupBiz() {
    killBiz();
    var n = nicheOfHash(); if (!n) return;
    var sec = D.getElementById("n-" + n);
    if (!sec || sec.hidden) return;
    var o = orderedIn(n), keys = Object.keys(o);
    if (!keys.length) return; /* nothing ordered here: the page stays as it is */
    var cards = {}, list = sec.querySelectorAll(".cc[href]"), i;
    for (i = 0; i < list.length; i++) {
      var m = (list[i].getAttribute("href") || "").match(/^#\/for\/[a-z]+\/([a-z]+)$/);
      if (m) cards[m[1]] = list[i];
    }
    if (!sec.__fxrtTop) sec.__fxrtTop = sec.querySelector(".cc--top");
    var top0 = sec.__fxrtTop, label = top0 ? top0.querySelector(".cc__top") : sec.querySelector(".cc__top");
    biz = { sec: sec, label: label, top0: top0, top1: top0, checks: [], tw: [] };

    /* 1. a lime check over the icon of every ordered task */
    var G = gs(), toDraw = [];
    keys.forEach(function (sid) {
      var c = cards[sid], art = c && c.querySelector(".cc__art");
      if (!art) return;
      var k = n + "/" + sid, ch = check(art, k);
      biz.checks.push(ch.svg);
      if (!drawn[k] && !reduced()) toDraw.push(ch.path);
      drawn[k] = 1;
    });
    if (toDraw.length) {
      if (G) biz.tw.push(G.to(toDraw, { strokeDashoffset: 0, duration: 0.25, ease: "power1.out", delay: 0.35, stagger: 0.08 }));
      else requestAnimationFrame(function () { requestAnimationFrame(function () { toDraw.forEach(function (p) { p.setAttribute("stroke-dashoffset", "0"); }); }); });
    }

    /* 2. the loss label and the one filled arrow go to the next task that is not ordered */
    if (!top0 || !label) return;
    var rk = ranks(n), next = null;
    for (i = 0; i < rk.length; i++) if (!o[rk[i]] && cards[rk[i]]) { next = cards[rk[i]]; break; }
    if (!next) { label.hidden = true; return; } /* all ordered: no pain to point at */
    if (next === top0) return;                  /* the top task is still open: it keeps its label */
    top0.classList.remove("cc--top");
    next.classList.add("cc--top");
    next.insertBefore(label, next.firstChild);
    if (label.getAttribute("data-i18n")) { label.setAttribute("data-fxrt-i18n", label.getAttribute("data-i18n")); label.removeAttribute("data-i18n"); }
    label.textContent = W8().label;
    biz.top1 = next;
    if (G && !reduced()) biz.tw.push(G.fromTo(label, { y: -6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out", delay: 0.15, clearProps: "transform,opacity" }));
    /* glyphs may have set up before the move: let it pick the new top (its strip plays first) */
    if (top0.classList.contains("fxg-top-in") && W.FXGlyphs && W.FXGlyphs.setup) setTimeout(function () { if (biz && biz.top1 === next) W.FXGlyphs.setup(); }, 0);
    centreBiz(sec, next, 20);
  }

  /* wide screens: the carousel centres the card with the label (a click on its dot, the page's own control) */
  function centreBiz(sec, card, tries) {
    if (!biz || biz.top1 !== card) return;
    var track = card.parentNode, car = track && track.parentNode, dots = car && car.querySelector(".car__dots");
    if (!dots || getComputedStyle(track).flexDirection === "column") return;
    if (card.classList.contains("mid")) return;
    var k = Array.prototype.indexOf.call(track.querySelectorAll(":scope > .cc"), card);
    if (k > -1 && dots.children[k] && car.clientWidth) { dots.children[k].click(); return; }
    if (tries > 0) requestAnimationFrame(function () { centreBiz(sec, card, tries - 1); });
  }

  /* =====================================================================
     wiring
     ===================================================================== */
  function all() { setupHome(); setupBiz(); }
  W.addEventListener("vf:route", function () { killHome(); killBiz(); all(); });
  W.addEventListener("vf:lang", function () {
    if (home && home.chip && home.p) { fillChip(home.chip, home.n, home.p); requestAnimationFrame(place); }
    if (biz && biz.label && biz.top1 !== biz.top0) biz.label.textContent = W8().label;
  });
  var wasNarrow = narrow();
  W.addEventListener("resize", function () {
    if (!home) return;
    if (narrow() !== wasNarrow && home.chip && home.p) fillChip(home.chip, home.n, home.p);
    wasNarrow = narrow();
    place();
  });
  D.addEventListener("visibilitychange", function () { if (!D.hidden && home && home.waiting) revealSoon(200); });
  if (mq) {
    var onRm = function () { if (reduced() && home && home.chip && !home.shown) reveal(); };
    if (mq.addEventListener) mq.addEventListener("change", onRm); else if (mq.addListener) mq.addListener(onRm);
  }
  /* loaded with defer after app.js: the first route is already drawn */
  all();
  W.FXRetention = { setup: all, kill: function () { killHome(); killBiz(); } };
})();
;
/* ---- fx/contact.js ---- */
/* fx/contact: the contact step (spec 3.5).
   1) The ready message as a preview bubble (#1d1d1d, radii 18 18 4 18): niche icon and task icon on the
      left, the exact text the messenger link will carry. Words fade in one by one (40ms stagger, about
      0.5s), a lime check draws in the corner, the icon on the filled messenger button nudges 4px right
      and back once, then the two chips stagger in (80ms, y 6 to 0).
   2) "Next for your business" orbit below the chips (only after an order of a niche task): SVG 120px,
      the ordered task in a lime ring with a check in the centre, the other tasks of the niche (FUNNEL
      order) as grey 20px icons on one ring. The ring makes one turn in 40s and stops; it pauses off
      screen and in a hidden tab. The next task by rank that is not ordered yet has a lime outline, its
      price in lime next to the ring. The whole block links to #/for/<niche>/<next>.
   3) After a tap on a messenger button (click, or the page gets focus back) an outlined chip
      "While you wait:" with the next task slides up under the buttons.
   Messenger links are never delayed or intercepted: the click listener is passive and only schedules.
   Reduced motion: final frame at once (whole text, check drawn, ring still).
   No lime fills: only strokes, outlines and lime text. */
(function () {
  "use strict";
  var D = document, W = window, root = D.documentElement;
  if (W.__fxContact) return;
  var ct = D.getElementById("contact");
  if (!ct) return;
  W.__fxContact = true;

  var NS = "http://www.w3.org/2000/svg";
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function gs() { return W.gsap || null; }
  var NB = " ";

  /* ---------- words (4 languages) ---------- */
  var L = {
    ru: { next: "Дальше для {n}", any: "твоего бизнеса", from: "от", mo: "/мес", photo: "за фото", wait: "Пока ждёшь ответа:",
      n: { salon: "салона", cafe: "кафе", shop: "магазина", clinic: "клиники", office: "офиса" } },
    uk: { next: "Далі для {n}", any: "твого бізнесу", from: "від", mo: "/міс", photo: "за фото", wait: "Поки чекаєш відповіді:",
      n: { salon: "салону", cafe: "кафе", shop: "магазину", clinic: "клініки", office: "офісу" } },
    de: { next: "Als Nächstes für {n}", any: "dein Business", from: "ab", mo: "/Mon.", photo: "pro Foto", wait: "Während du wartest:",
      n: { salon: "den Salon", cafe: "das Café", shop: "den Laden", clinic: "die Praxis", office: "das Büro" } },
    en: { next: "Next for {n}", any: "your business", from: "from", mo: "/mo", photo: "per photo", wait: "While you wait:",
      n: { salon: "your salon", cafe: "your café", shop: "your shop", clinic: "your clinic", office: "your office" } }
  };
  function lang() { var l = (root.lang || "en").slice(0, 2).toLowerCase(); return L[l] ? l : "en"; }
  function w() { return L[lang()]; }
  function vt(k) { try { return W.VF && W.VF.t ? W.VF.t(k) : ""; } catch (e) { return ""; } }
  function F() { return W.FUNNEL || { niches: {}, sv: {}, icons: {} }; }
  function stored(k) {
    try { if (W.VF && W.VF.stored) return W.VF.stored(k); var v = localStorage.getItem("vf." + k); return v && v.charAt(0) === "[" ? JSON.parse(v) : v; } catch (e) { return null; }
  }

  /* ---------- CSS (once) ---------- */
  if (!D.getElementById("fx-contact")) {
    var st = D.createElement("style");
    st.id = "fx-contact";
    st.textContent = [
      ".fxct-bub { position: relative; display: flex; align-items: flex-start; gap: 0.7rem; margin-top: 1rem; max-width: 34rem; padding: 0.85rem 2.1rem 0.85rem 0.95rem; background: #1d1d1d; border-radius: 18px 18px 4px 18px; color: #f6f6f1; font-size: 1.02rem; line-height: 1.42; }",
      ".fxct-bub__ic { display: flex; gap: 0.3rem; flex: none; padding-top: 0.12rem; }",
      ".fxct-bub__ic .ico { width: 1.3rem; height: 1.3rem; }",
      ".fxct-bub__ic .fxct-n { color: #a6a6a6; }",
      ".fxct-bub__ic .fxct-s { color: var(--accent, #d8ff00); }",
      ".fxct-bub__t { flex: 1; min-width: 0; overflow-wrap: anywhere; }",
      ".fxct-w { display: inline-block; }",
      ".fxct-ok { position: absolute; right: 0.6rem; bottom: 0.5rem; width: 18px; height: 18px; overflow: visible; }",
      ".fxct-ok path { fill: none; stroke: var(--accent, #d8ff00); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }",
      ".fxct-wait { display: flex; align-items: center; flex-wrap: wrap; column-gap: 0.55rem; row-gap: 0.15rem; width: max-content; max-width: 100%; min-height: 44px; margin-top: 0.9rem; padding: 0.5rem 1rem; border: 1.5px solid var(--accent, #d8ff00); border-radius: 1.4rem; color: #f6f6f1; text-decoration: none; font-size: 0.98rem; line-height: 1.3; box-sizing: border-box; }",
      ".fxct-wait__l { color: #cfcfcf; }",
      ".fxct-wait b { display: inline-flex; align-items: center; gap: 0.4rem; min-width: 0; font-weight: 600; }",
      ".fxct-wait__t { min-width: 0; overflow-wrap: anywhere; }",
      ".fxct-wait .ico { flex: none; }",
      ".fxct-wait .ico { width: 1.2rem; height: 1.2rem; color: var(--accent, #d8ff00); }",
      ".fxct-wait .fxct-arr { width: 1.05rem; height: 1.05rem; color: #a6a6a6; }",
      "@media (hover: hover) { .fxct-wait:hover { background: rgba(216, 255, 0, 0.06); } }", ".fxct-wait:focus-visible { background: rgba(216, 255, 0, 0.06); }",
      ".fxct-orb { display: flex; align-items: center; gap: 0.9rem; max-width: 34rem; margin-top: 1rem; padding: 0.5rem 1rem 0.5rem 0.5rem; border: 1px solid #2a2a2a; border-radius: 1.2rem; color: #f6f6f1; text-decoration: none; box-sizing: border-box; }",
      ".fxct-orb:hover, .fxct-orb:focus-visible { border-color: var(--accent, #d8ff00); }",
      ".fxct-orb > svg { width: 120px; height: 120px; flex: none; overflow: visible; }",
      ".fxct-orb__x { display: grid; gap: 0.2rem; min-width: 0; }",
      ".fxct-orb__l { color: #cfcfcf; font-size: 0.95rem; line-height: 1.25; }",
      ".fxct-orb__t { font-weight: 600; font-size: 1.05rem; line-height: 1.25; overflow-wrap: anywhere; }",
      ".fxct-orb__p { font-family: var(--f-display, Georgia, serif); font-weight: 800; font-size: 1.15rem; color: var(--accent, #d8ff00); white-space: nowrap; }",
      ".fxct-orb .fxct-g { color: #5a5a5a; }",
      ".fxct-orb .fxct-gn { color: #e6e6e6; }",
      "@media (max-width: 360px) { .fxct-orb { gap: 0.6rem; padding-right: 0.7rem; } .fxct-bub { font-size: 0.98rem; } }",
      /* CSS fallback when GSAP is missing */
      ".fxct-css .fxct-w { opacity: 0; transition: opacity 0.14s ease; transition-delay: var(--d, 0s); }",
      ".fxct-css.fxct-go .fxct-w { opacity: 1; }",
      ".fxct-css .fxct-ok path { transition: stroke-dashoffset 0.2s ease; transition-delay: var(--d, 0s); }",
      ".fxct-cssfade { opacity: 0; transform: translateY(6px); transition: opacity 0.3s ease, transform 0.3s ease; transition-delay: var(--d, 0s); }",
      ".fxct-cssfade.fxct-in { opacity: 1; transform: none; }",
      "@media (prefers-reduced-motion: reduce) { .fxct-w, .fxct-cssfade { opacity: 1 !important; transform: none !important; transition: none !important; } }"
    ].join("\n");
    D.head.appendChild(st);
  }

  /* ---------- small builders ---------- */
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function sv(tag, attrs) { var e = D.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function icon(id, cls, filled) {
    var s = sv("svg", { "class": "ico" + (filled ? " ph" : "") + (cls ? " " + cls : ""), "aria-hidden": "true", focusable: "false" });
    var u = sv("use", { href: "#" + id }); s.appendChild(u); return s;
  }
  function symId(name) { return D.getElementById("l-" + name) ? "l-" + name : null; }

  /* order id -> task icon */
  function taskIcon(id) {
    var s = F().sv || {};
    if (!id) return null;
    if (s[id]) return s[id].icon;
    if (/^plan/.test(id)) return s.social ? s.social.icon : "calendar-days";
    if (id === "photo" || id === "video") return "image";
    if (/^firm/.test(id)) return "building-2";
    if (id === "custom") return "sparkles";
    return null;
  }
  function niched(n, sid) { var l = (F().niches || {})[n]; return !!l && l.some(function (r) { return r[0] === sid; }); }
  function price(sid) {
    var s = (F().sv || {})[sid], x = w(); if (!s) return "";
    if (sid === "content") return s.amt + NB + x.photo;
    return x.from + NB + s.amt + (s.per ? x.mo : "");
  }
  function nextTask(n, cur) {
    var l = (F().niches || {})[n]; if (!l) return null;
    var done = stored("ordered"); if (!Array.isArray(done)) done = [];
    for (var i = 0; i < l.length; i++) { var sid = l[i][0]; if (sid !== cur && done.indexOf(n + "/" + sid) < 0) return sid; }
    return null;
  }
  function taskName(sid) { return vt("sv." + sid + ".h") || sid; }

  /* the text the filled messenger link will carry */
  function msgLinks() { return Array.prototype.slice.call(ct.querySelectorAll(".msgs a")); }
  function mainLink() { var ls = msgLinks(); for (var i = 0; i < ls.length; i++) if (ls[i].classList.contains("btn--ink")) return ls[i]; return ls[0] || null; }
  function readText() {
    var ls = [mainLink()].concat(msgLinks());
    for (var i = 0; i < ls.length; i++) {
      var a = ls[i]; if (!a) continue;
      try { var t = new URL(a.href, location.href).searchParams.get("text"); if (t) return t; } catch (e) {}
    }
    return "";
  }
  function hasOrder() { var o = D.getElementById("order"), lab = D.getElementById("orderLabel"); return !!(o && !o.hidden && lab && lab.textContent.trim()); }

  /* ---------- state ---------- */
  var cur = { niche: null, order: null };
  var active = false, played = false, startT = 0, delayT = 0, safeT = 0, waitT = 0, refT = 0;
  var tl = null, ring = null, ringA = 0, ringRaf = 0, ringRun = false, ringDone = false;
  var bub = null, orb = null, wait = null, waitShown = false, tapped = false, io = null, orbIo = null, inView = false, orbIn = false;
  var chipsEls = [];

  function chips() { return Array.prototype.slice.call(ct.querySelectorAll(".ct-chips li")); }

  /* if no event told us the order id (module loaded late), guess it from vf.ordered and the label */
  function guessOrder() {
    if (cur.order || !hasOrder()) return;
    var lab = D.getElementById("orderLabel").textContent, done = stored("ordered");
    if (!Array.isArray(done)) return;
    for (var i = done.length - 1; i >= 0; i--) {
      var p = String(done[i]).split("/"), nm = taskName(p[1]);
      if (p.length === 2 && nm && lab.indexOf(nm) > -1) { cur.niche = p[0]; cur.order = p[1]; return; }
    }
  }

  /* ---------- 1) bubble ---------- */
  function buildBubble() {
    var text = readText(); if (!text) return null;
    var b = el("div", "fxct-bub"); b.setAttribute("aria-hidden", "true");
    var ic = el("span", "fxct-bub__ic"), withOrder = hasOrder() && cur.order;
    var nIco = withOrder && cur.niche && (F().icons || {})[cur.niche] ? symId(F().icons[cur.niche]) : null;
    var sIco = withOrder ? symId(taskIcon(cur.order)) : null;
    if (!nIco && !sIco) sIco = symId("message-square-more");
    if (nIco) ic.appendChild(icon(nIco, "fxct-n", true));
    if (sIco) ic.appendChild(icon(sIco, "fxct-s", true));
    b.appendChild(ic);
    var t = el("span", "fxct-bub__t"), words = text.split(/\s+/).filter(Boolean);
    words.forEach(function (wd, i) { if (i) t.appendChild(D.createTextNode(" ")); t.appendChild(el("span", "fxct-w", wd)); });
    b.appendChild(t);
    var ok = sv("svg", { "class": "fxct-ok", viewBox: "0 0 18 18", "aria-hidden": "true" });
    ok.appendChild(sv("path", { d: "M3.5 9.5l3.5 3.5 7.5-8", pathLength: "18" }));
    b.appendChild(ok);
    return b;
  }

  /* ---------- 2) orbit ---------- */
  function buildOrbit() {
    var n = cur.niche, o = cur.order;
    if (!hasOrder() || !n || !o) return null;
    var center = /^plan/.test(o) ? "social" : o;
    if (!niched(n, center)) return null;
    var nx = nextTask(n, center); if (!nx) return null;
    var list = ((F().niches || {})[n] || []).map(function (r) { return r[0]; }).filter(function (s) { return s !== center; });
    var x = w(), lbl = x.next.replace("{n}", x.n[n] || x.any), pr = price(nx), nm = taskName(nx);
    var a = el("a", "fxct-orb"); a.href = "#/for/" + n + "/" + nx;
    a.setAttribute("aria-label", lbl + ": " + nm + ", " + pr);
    var s = sv("svg", { viewBox: "0 0 120 120", "aria-hidden": "true", focusable: "false" });
    s.appendChild(sv("circle", { cx: 60, cy: 60, r: 44, fill: "none", stroke: "#2a2a2a", "stroke-width": "1" }));
    var g = sv("g", { "class": "fxct-ring" }), spins = [], k = list.indexOf(nx), N = list.length;
    list.forEach(function (sid, i) {
      var ang = ((i - k) / N) * Math.PI * 2, px = 60 + 44 * Math.cos(ang), py = 60 + 44 * Math.sin(ang);
      var slot = sv("g", { transform: "translate(" + px.toFixed(2) + " " + py.toFixed(2) + ")" }), sp = sv("g", {});
      var isN = sid === nx, id = symId(taskIcon(sid)) || symId("sparkles");
      sp.appendChild(sv("circle", { r: isN ? 14 : 12, fill: "#141414", stroke: isN ? "#d8ff00" : "none", "stroke-width": "1.5" }));
      var u = sv("use", { href: "#" + id, x: -10, y: -10, width: 20, height: 20, "class": isN ? "fxct-gn" : "fxct-g", fill: "currentColor" });
      sp.appendChild(u); slot.appendChild(sp); g.appendChild(slot); spins.push(sp);
    });
    s.appendChild(g);
    var c = sv("g", { "class": "fxct-c" });
    c.appendChild(sv("circle", { cx: 60, cy: 60, r: 21, fill: "#141414", stroke: "#d8ff00", "stroke-width": "1.5" }));
    c.appendChild(sv("use", { href: "#" + (symId(taskIcon(center)) || symId("sparkles")), x: 49, y: 49, width: 22, height: 22, fill: "#d8ff00" }));
    c.appendChild(sv("circle", { cx: 75, cy: 45, r: 7.5, fill: "#141414", stroke: "#d8ff00", "stroke-width": "1.5" }));
    c.appendChild(sv("path", { d: "M71.8 45.2l2.2 2.2 4.2-4.6", fill: "none", stroke: "#d8ff00", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: "10", "class": "fxct-cok" }));
    s.appendChild(c);
    a.appendChild(s);
    var tx = el("span", "fxct-orb__x");
    tx.appendChild(el("span", "fxct-orb__l", lbl));
    tx.appendChild(el("span", "fxct-orb__t", nm));
    tx.appendChild(el("span", "fxct-orb__p", pr));
    a.appendChild(tx);
    a._ring = g; a._spins = spins;
    return a;
  }
  function setRing(a) {
    ringA = a;
    if (!orb || !orb._ring) return;
    orb._ring.setAttribute("transform", "rotate(" + a.toFixed(2) + " 60 60)");
    orb._spins.forEach(function (sp) { sp.setAttribute("transform", "rotate(" + (-a).toFixed(2) + ")"); });
  }
  var ringTw = null, ringLast = 0;
  function ringCanRun() { return active && orbIn && !D.hidden && !reduced() && !ringDone && ringRun; }
  function ringSync() {
    var on = ringCanRun(), g = gs();
    if (g) {
      if (!ringTw && ringRun && !ringDone && !reduced() && orb) {
        var p = { a: ringA };
        ringTw = g.to(p, { a: 360, duration: 40 * (1 - ringA / 360), ease: "none", paused: true,
          onUpdate: function () { setRing(p.a); }, onComplete: function () { ringDone = true; setRing(0); ringTw = null; } });
      }
      if (ringTw) { if (on) ringTw.resume(); else ringTw.pause(); }
      return;
    }
    if (on && !ringRaf) { ringLast = 0; ringRaf = W.requestAnimationFrame(ringStep); }
    if (!on && ringRaf) { W.cancelAnimationFrame(ringRaf); ringRaf = 0; }
  }
  function ringStep(ts) {
    ringRaf = 0;
    if (!ringCanRun()) return;
    if (ringLast) { var a = ringA + ((ts - ringLast) / 40000) * 360; if (a >= 360) { ringDone = true; setRing(0); return; } setRing(a); }
    ringLast = ts; ringRaf = W.requestAnimationFrame(ringStep);
  }
  function ringStop() {
    if (ringTw) { ringTw.kill(); ringTw = null; }
    if (ringRaf) { W.cancelAnimationFrame(ringRaf); ringRaf = 0; }
    ringRun = false; ringDone = false; ringA = 0;
  }

  /* ---------- 3) "while you wait" ---------- */
  function buildWait() {
    var n = cur.niche && (F().niches || {})[cur.niche] ? cur.niche : stored("lastNiche");
    if (!n || !(F().niches || {})[n]) return null;
    var o = hasOrder() ? cur.order : null;
    var center = o && /^plan/.test(o) ? "social" : o;
    /* a company order (or any order that is not a task of this business) gets no small-business upsell */
    if (o && o !== "custom" && !niched(n, center)) return null;
    var nx = nextTask(n, center); if (!nx) return null;
    var a = el("a", "fxct-wait"); a.href = "#/for/" + n + "/" + nx;
    a.appendChild(el("span", "fxct-wait__l", w().wait));
    var b = el("b"); var id = symId(taskIcon(nx)); if (id) b.appendChild(icon(id, "", true));
    b.appendChild(el("span", "fxct-wait__t", taskName(nx)));
    /* the arrow lives inside the name group so it never wraps onto a line of its own */
    if (D.getElementById("i-arrow")) b.appendChild(icon("i-arrow", "fxct-arr", false));
    a.appendChild(b);
    return a;
  }
  function showWait(animate) {
    if (!active || wait) return;
    wait = buildWait(); if (!wait) return;
    waitShown = true;
    var msgs = ct.querySelector(".msgs"); if (!msgs) { wait = null; return; }
    msgs.parentNode.insertBefore(wait, msgs.nextSibling);
    dodgeSoon();
    var g = gs();
    if (!animate || reduced()) return;
    if (g) g.fromTo(wait, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power2.out", clearProps: "transform,opacity" });
    else { wait.classList.add("fxct-cssfade"); void wait.offsetWidth; wait.classList.add("fxct-in"); }
  }
  /* passive: never prevents or delays the link */
  ct.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest(".msgs a") : null;
    if (!a || !active) return;
    tapped = true;
    clearTimeout(waitT); waitT = setTimeout(function () { showWait(true); }, 250);
  }, { passive: true });
  W.addEventListener("focus", function () { if (tapped && active && !wait) showWait(true); });

  /* ---------- play ---------- */
  function finalFrame() {
    if (bub) {
      Array.prototype.forEach.call(bub.querySelectorAll(".fxct-w"), function (x) { x.style.opacity = ""; x.style.transform = ""; });
      var p = bub.querySelector(".fxct-ok path"); if (p) { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; }
      bub.classList.remove("fxct-css", "fxct-go");
    }
    chips().forEach(function (c) { c.style.opacity = ""; c.style.transform = ""; c.classList.remove("fxct-cssfade", "fxct-in"); c.style.removeProperty("--d"); });
    var ico = mainLink() && mainLink().querySelector(".ico"); if (ico) ico.style.transform = "";
    if (orb) { orb.style.opacity = ""; orb.style.transform = ""; orb.classList.remove("fxct-cssfade", "fxct-in"); var ck = orb.querySelector(".fxct-cok"); if (ck) { ck.style.strokeDasharray = ""; ck.style.strokeDashoffset = ""; } }
  }
  function prime() {
    /* hidden starting state, set only when an animation will follow */
    if (reduced()) return;
    if (bub) Array.prototype.forEach.call(bub.querySelectorAll(".fxct-w"), function (x) { x.style.opacity = "0"; });
    var p = bub && bub.querySelector(".fxct-ok path"); if (p) { p.style.strokeDasharray = "18"; p.style.strokeDashoffset = "18"; }
    chips().forEach(function (c) { c.style.opacity = "0"; c.style.transform = "translateY(6px)"; });
    if (orb) { orb.style.opacity = "0"; orb.style.transform = "translateY(8px)"; var ck = orb.querySelector(".fxct-cok"); if (ck) { ck.style.strokeDasharray = "10"; ck.style.strokeDashoffset = "10"; } }
  }
  function play() {
    if (played || !active) return;
    played = true; clearTimeout(safeT);
    if (reduced()) { finalFrame(); return; }
    var g = gs(), ws = bub ? Array.prototype.slice.call(bub.querySelectorAll(".fxct-w")) : [];
    var stg = ws.length > 1 ? Math.min(0.04, 0.4 / (ws.length - 1)) : 0, tW = ws.length ? stg * (ws.length - 1) + 0.12 : 0;
    var p = bub && bub.querySelector(".fxct-ok path"), ico = mainLink() && mainLink().querySelector(".ico"), cs = chips();
    var ck = orb && orb.querySelector(".fxct-cok");
    if (g) {
      tl = g.timeline({ onComplete: function () { tl = null; finalFrame(); } });
      if (ws.length) tl.fromTo(ws, { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: 0.12, stagger: stg, ease: "power1.out" }, 0);
      if (p) tl.fromTo(p, { strokeDashoffset: 18 }, { strokeDashoffset: 0, duration: 0.2, ease: "power1.out" }, tW);
      var t1 = tW + 0.2;
      if (ico) tl.to(ico, { x: 4, duration: 0.2, ease: "power1.out", yoyo: true, repeat: 1 }, t1);
      if (cs.length) tl.fromTo(cs, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, ease: "power2.out" }, t1);
      var t2 = t1 + 0.3 + 0.08 * Math.max(0, cs.length - 1);
      if (orb) {
        tl.fromTo(orb, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, t2);
        if (ck) tl.fromTo(ck, { strokeDashoffset: 10 }, { strokeDashoffset: 0, duration: 0.25, ease: "power1.out" }, t2 + 0.25);
        tl.call(function () { ringRun = true; ringSync(); }, null, t2 + 0.35);
      }
      if (!inView || D.hidden) tl.pause();
      return;
    }
    /* CSS fallback */
    if (bub) {
      bub.classList.add("fxct-css");
      ws.forEach(function (x, i) { x.style.opacity = ""; x.style.setProperty("--d", (i * stg).toFixed(3) + "s"); });
      if (p) { p.style.setProperty("--d", tW.toFixed(3) + "s"); }
      void bub.offsetWidth; bub.classList.add("fxct-go");
      if (p) p.style.strokeDashoffset = "0";
    }
    var t1c = tW + 0.2;
    cs.forEach(function (c, i) { c.style.opacity = ""; c.style.transform = ""; c.classList.add("fxct-cssfade"); c.style.setProperty("--d", (t1c + i * 0.08).toFixed(3) + "s"); });
    if (orb) { orb.style.opacity = ""; orb.style.transform = ""; orb.classList.add("fxct-cssfade"); orb.style.setProperty("--d", (t1c + 0.3 + 0.08 * cs.length).toFixed(3) + "s"); }
    void ct.offsetWidth;
    cs.forEach(function (c) { c.classList.add("fxct-in"); });
    if (orb) orb.classList.add("fxct-in");
    if (ck) { ck.style.transition = "stroke-dashoffset 0.25s ease " + (t1c + 0.6 + 0.08 * cs.length).toFixed(2) + "s"; ck.style.strokeDashoffset = "0"; }
    startT = setTimeout(function () { if (!active) return; if (ck) ck.style.transition = ""; finalFrame(); if (orb) { ringRun = true; ringSync(); } }, (t1c + 1.2 + 0.08 * cs.length) * 1000);
  }

  /* ---------- build and tear down ---------- */
  function observe() {
    if (io) io.disconnect(); if (orbIo) orbIo.disconnect(); io = orbIo = null;
    if (!("IntersectionObserver" in W)) { inView = orbIn = true; play(); ringSync(); return; }
    /* start when the bubble (or the orbit) is in view; pause only when the whole section is off screen */
    var seen = {};
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target === ct) inView = e.isIntersecting;
        else { seen[e.target === orb ? "o" : "b"] = e.isIntersecting && e.intersectionRatio >= 0.29; if (e.target === orb) { orbIn = e.isIntersecting; ringSync(); } }
      });
      clearTimeout(delayT);
      /* let the smooth scroll to #contact settle first */
      if ((seen.b || seen.o) && !played) delayT = setTimeout(function () { if (active && (seen.b || seen.o)) play(); }, 300);
      if (tl) { if (inView && !D.hidden) tl.resume(); else tl.pause(); }
    }, { threshold: [0, 0.3] });
    var tgt = bub || ct.querySelector(".msgs");
    io.observe(ct);
    if (tgt) io.observe(tgt);
    if (orb) io.observe(orb);
  }
  function removeNodes(keepWait) {
    if (bub && bub.parentNode) bub.parentNode.removeChild(bub);
    if (orb && orb.parentNode) orb.parentNode.removeChild(orb);
    bub = orb = null;
    if (!keepWait) { if (wait && wait.parentNode) wait.parentNode.removeChild(wait); wait = null; }
  }
  function killAll() {
    if (tl) { tl.kill(); tl = null; }
    clearTimeout(startT); clearTimeout(delayT); clearTimeout(safeT); clearTimeout(waitT);
    ringStop();
    var g = gs(), ico = mainLink() && mainLink().querySelector(".ico");
    if (g) { if (ico) g.killTweensOf(ico); g.killTweensOf(chips()); if (wait) g.killTweensOf(wait); }
    finalFrame();
    if (io) io.disconnect(); if (orbIo) orbIo.disconnect(); io = orbIo = null;
  }
  function build(animate) {
    killAll(); removeNodes(true);
    guessOrder();
    var hadWait = !!wait; if (wait && wait.parentNode) wait.parentNode.removeChild(wait); wait = null;
    bub = buildBubble();
    var msgs = ct.querySelector(".msgs");
    if (bub && msgs) msgs.parentNode.insertBefore(bub, msgs);
    orb = buildOrbit();
    var cl = ct.querySelector(".ct-chips");
    if (orb && cl) cl.parentNode.insertBefore(orb, cl.nextSibling); else orb = null;
    if (hadWait) showWait(false);
    setTimeout(dodgeSoon, 60); setTimeout(dodgeSoon, 450);
    played = !animate; ringDone = false; ringA = 0;
    if (animate && !reduced()) {
      prime();
      observe();
      /* failsafe: never leave the chips hidden */
      safeT = setTimeout(function () { if (!played && active) { played = true; finalFrame(); ringRun = !!orb; ringSync(); } }, 3500);
    } else {
      finalFrame();
      ringRun = !!orb && !reduced(); ringDone = reduced();
      observe();
    }
  }
  function enter(detail) {
    if (detail && detail.order != null) { cur.order = detail.order || null; cur.niche = detail.niche || null; }
    if (!hasOrder()) { cur.order = null; }
    active = true; tapped = false; waitShown = false;
    if (wait && wait.parentNode) wait.parentNode.removeChild(wait); wait = null;
    build(true);
  }
  function leave() {
    if (!active) return;
    active = false; killAll(); removeNodes(false); tapped = false;
  }
  /* repaint in place (language switch, order cleared): final frame, no replay */
  function refresh() {
    if (!active) return;
    if (!hasOrder()) cur.order = null;
    var rd = ringDone, ra = ringA, wasPlayed = played;
    build(false);
    if (orb) { ringDone = rd || reduced(); ringRun = !ringDone; setRing(ringDone ? 0 : ra); ringSync(); }
    if (!wasPlayed) played = true;
  }
  function soon() { clearTimeout(refT); refT = setTimeout(refresh, 40); }

  W.addEventListener("vf:order", function (e) { var d = e.detail || {}; cur.order = d.order || null; cur.niche = d.niche || null; });
  W.addEventListener("vf:route", function (e) {
    var d = e.detail || {};
    if (d.hash === "#contact") {
      if (d.order) { cur.order = d.order; cur.niche = d.niche || null; } else if (!hasOrder()) cur.order = null;
      enter(null);
    } else leave();
  });
  W.addEventListener("vf:lang", function () { soon(); });
  if ("MutationObserver" in W) {
    var mo = new MutationObserver(function () { if (active) soon(); });
    var ob = D.getElementById("order");
    if (ob) mo.observe(ob, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true, characterData: true });
    msgLinks().forEach(function (a) { mo.observe(a, { attributes: true, attributeFilter: ["href", "class"] }); });
  }
  D.addEventListener("visibilitychange", function () {
    if (tl) { if (D.hidden || !inView) tl.pause(); else tl.resume(); }
    ringSync();
    if (!D.hidden && tapped && active && !wait) showWait(true);
  });
  if (mq) {
    var onMq = function () { if (active) { killAll(); played = true; ringDone = reduced(); ringRun = !!orb && !reduced(); ringSync(); } };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  /* the assistant button dodges the page's own buttons; it should not sit on our text either.
     Runs after the page's own check in the same frame and only ever adds "off". */
  var fab = D.getElementById("botFab"), dodgeT = 0;
  function dodge() {
    dodgeT = 0;
    if (!active || !fab || !fab.offsetWidth) return;
    var box = D.getElementById("bot"); if (box && !box.hidden) return;
    var f = fab.getBoundingClientRect();
    var hit = [orb, wait, bub].some(function (e) {
      if (!e || !e.offsetWidth) return false;
      var q = e.getBoundingClientRect();
      return q.right > f.left - 8 && q.left < f.right + 8 && q.bottom > f.top - 8 && q.top < f.bottom + 8;
    });
    if (hit) fab.classList.add("off");
  }
  function dodgeSoon() { if (!dodgeT) dodgeT = W.requestAnimationFrame(dodge); }
  W.addEventListener("scroll", dodgeSoon, { passive: true });
  W.addEventListener("resize", dodgeSoon);
  W.addEventListener("hashchange", function () { setTimeout(dodgeSoon, 450); });

  /* loaded on #contact already */
  if (location.hash === "#contact") enter(null);
})();
;
/* ---- fx/fab.js ---- */
/* fx/fab: the assistant button #botFab and its panel (spec 3.6).
   1) Around the dark disc a dashed lime arc (2px) turns: 10s a turn, 3 turns, then it stops and stays.
      Once per session. It pauses in a hidden tab and while the button is off screen or stepped aside.
   2) Once per session, after 6s without a tap, key, wheel or scroll on home or on a business page:
      three lime dots "type" inside the button (opacity 0.3 to 1, stagger 0.15s, 0.9s a cycle, 3 cycles)
      and an outlined label slides out to the left (scale 0.8 to 1, 0.25s), holds 3s and fades.
      The label never covers text or a button: if it would, it tries above the button, and if that
      is taken too (small phones, home), only the dots play.
   3) The panel opens from the corner (scale 0.96 to 1, 200ms), the chips come in with a 60ms stagger.
   Reduced motion: the arc stands still, no label, no dots, the panel just appears.
   No lime fills: the arc is a stroke, the label is an outline on a dark surface.
   What the assistant answers is not touched. */
(function () {
  "use strict";
  var D = document, W = window, root = D.documentElement;
  if (W.__fxFab) return;
  var fab = D.getElementById("botFab");
  if (!fab) return;
  W.__fxFab = true;

  var NS = "http://www.w3.org/2000/svg";
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function gs() { return W.gsap || null; }
  var IDLE = 6000, SPIN = 10, TURNS = 3, HOLD = 3000;

  /* ---------- words ---------- */
  var L = {
    ru: "Где теряешь клиентов?",
    uk: "Де втрачаєш клієнтів?",
    de: "Wo verlierst du Kunden?",
    en: "Where do you lose customers?"
  };
  function lang() { var l = (root.lang || "en").slice(0, 2).toLowerCase(); return L[l] ? l : "en"; }

  /* ---------- session memory ---------- */
  function seen(k) { try { return W.sessionStorage.getItem("vf.fx." + k) === "1"; } catch (e) { return false; } }
  function mark(k) { try { W.sessionStorage.setItem("vf.fx." + k, "1"); } catch (e) {} }

  /* ---------- CSS (once) ---------- */
  if (!D.getElementById("fx-fab")) {
    var st = D.createElement("style");
    st.id = "fx-fab";
    st.textContent = [
      /* the disc stays dark; its edge is a quiet line, the lime energy is the dashed arc */
      ".bot-fab.fxfab { border-color: #2a2a2a; overflow: visible; }",
      ".fxfab-arc { position: absolute; inset: -1.5px; width: calc(100% + 3px); height: calc(100% + 3px); overflow: visible; pointer-events: none; transform-origin: 50% 50%; }",
      ".fxfab-arc circle { fill: none; stroke: var(--accent, #d8ff00); stroke-width: 2; stroke-linecap: round; vector-effect: non-scaling-stroke; }",
      ".fxfab-css .fxfab-arc { animation: fxfab-spin " + SPIN + "s linear " + TURNS + "; }",
      ".fxfab-css.fxfab-hold .fxfab-arc { animation-play-state: paused; }",
      "@keyframes fxfab-spin { to { transform: rotate(360deg); } }",
      /* three typing dots sit exactly on the dots of the message icon */
      ".fxfab-dots { position: absolute; left: 50%; top: 50%; width: 1.7rem; height: 1.7rem; margin: -0.85rem 0 0 -0.85rem; overflow: visible; pointer-events: none; opacity: 0; }",
      ".fxfab-dots circle { fill: var(--accent, #d8ff00); }",
      ".bot-fab.fxfab > .ico { transition: opacity 0.25s ease; }",
      ".bot-fab.fxfab-typing > .ico { opacity: 0.35; }",
      ".bot-fab.fxfab-typing .fxfab-dots { opacity: 1; }",
      ".fxfab-css.fxfab-typing .fxfab-dots circle { animation: fxfab-type 0.9s ease-in-out 3 both; }",
      ".fxfab-css.fxfab-typing .fxfab-dots circle:nth-child(2) { animation-delay: 0.15s; }",
      ".fxfab-css.fxfab-typing .fxfab-dots circle:nth-child(3) { animation-delay: 0.3s; }",
      "@keyframes fxfab-type { 0%, 100% { opacity: 0.3; } 45% { opacity: 1; } }",
      /* the outlined label next to the button */
      ".fxfab-cue { position: fixed; z-index: 49; display: flex; align-items: center; box-sizing: border-box; min-height: 44px; max-width: calc(100vw - 1.5rem); padding: 0.45rem 1rem; border: 1.5px solid var(--accent, #d8ff00); border-radius: 999px; background: #141414; color: #f6f6f1; font-family: var(--f-body, sans-serif); font-weight: 600; font-size: 15px; line-height: 1.25; white-space: nowrap; cursor: pointer; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); opacity: 0; transform-origin: 100% 50%; -webkit-tap-highlight-color: transparent; }",
      ".fxfab-cue[hidden] { display: none; }",
      ".fxfab-cue.fxfab-up { transform-origin: 100% 100%; }",
      ".fxfab-css.fxfab-cue { transform: scale(0.8); transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }",
      ".fxfab-css.fxfab-cue.on { opacity: 1; transform: none; }",
      ".fxfab-css.fxfab-cue.out { opacity: 0; transform: none; transition-duration: 0.3s; }",
      /* the panel grows out of the corner */
      ".bot.fxfab-open { transform-origin: 100% 100%; animation: fxfab-open 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) both; }",
      ".bot.fxfab-open .bot__chips .bot__go { animation: fxfab-chip 0.22s ease-out both; animation-delay: calc(var(--fxi, 0) * 60ms + 80ms); }",
      "@keyframes fxfab-open { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }",
      "@keyframes fxfab-chip { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }",
      /* task page: a 48px button, 12px above the price bar */
      ".lvl3 .bot-fab.fxfab { width: 48px; height: 48px; }",
      "@media (max-width: 760px) { .has-buy.lvl3 .bot-fab.fxfab { bottom: calc(var(--bar, 0px) + 12px); } }",
      "@media (prefers-reduced-motion: reduce) { .fxfab-arc, .fxfab-dots circle { animation: none !important; } .bot.fxfab-open, .bot.fxfab-open .bot__go { animation: none !important; } .fxfab-cue { display: none !important; } }"
    ].join("\n");
    D.head.appendChild(st);
  }

  function svg(tag, attrs) { var el = D.createElementNS(NS, tag); for (var k in attrs) el.setAttribute(k, attrs[k]); return el; }

  /* ---------- the arc ---------- */
  fab.classList.add("fxfab");
  var arc = svg("svg", { "class": "fxfab-arc", viewBox: "0 0 100 100", "aria-hidden": "true", focusable: "false" });
  /* 10 dashes over 70% of the ring, then an open 30%: a dashed arc, not a closed ring */
  var dash = [];
  for (var i = 0; i < 10; i++) dash.push(i < 9 ? "4 3" : "4 33");
  arc.appendChild(svg("circle", { cx: "50", cy: "50", r: "49", pathLength: "100", "stroke-dasharray": dash.join(" "), transform: "rotate(-90 50 50)" }));
  fab.appendChild(arc);

  /* ---------- the typing dots ---------- */
  var dots = svg("svg", { "class": "fxfab-dots", viewBox: "0 0 256 256", "aria-hidden": "true", focusable: "false" });
  [84, 128, 172].forEach(function (x) { dots.appendChild(svg("circle", { cx: String(x), cy: "128", r: "15" })); });
  fab.appendChild(dots);

  /* ---------- visibility: hidden tab, button off screen or stepped aside ---------- */
  var onScreen = true;
  function fabShown() { return !!fab.offsetWidth && !fab.classList.contains("off") && onScreen; }
  function canPlay() { return !D.hidden && fabShown(); }

  /* ---------- spin: 3 turns, then still ---------- */
  var spin = null, spinCss = false, spinDone = seen("fabSpun") || reduced();
  function startSpin() {
    if (spinDone) return;
    var g = gs();
    if (g) {
      spin = g.to(arc, { rotation: 360 * TURNS, duration: SPIN * TURNS, ease: "none", paused: !canPlay(), onComplete: endSpin });
    } else {
      spinCss = true;
      fab.classList.add("fxfab-css");
      arc.addEventListener("animationend", endSpin);
      syncPlay();
    }
  }
  function endSpin() {
    spinDone = true;
    mark("fabSpun");
    if (spin) { spin.kill(); spin = null; var g = gs(); if (g) g.set(arc, { rotation: 0 }); }
    if (spinCss) { fab.classList.remove("fxfab-css"); spinCss = false; }
  }
  function syncPlay() {
    var ok = canPlay();
    if (spin) { if (ok) spin.resume(); else spin.pause(); }
    if (spinCss) fab.classList.toggle("fxfab-hold", !ok);
    if (cueTl) { if (ok) cueTl.resume(); else cueTl.pause(); }
    if (!ok && cueOn && !cueTl) endCue();
  }

  if ("IntersectionObserver" in W) {
    new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; syncPlay(); }).observe(fab);
  }
  new MutationObserver(function () { syncPlay(); if (fab.classList.contains("off") && cueOn) endCue(); }).observe(fab, { attributes: true, attributeFilter: ["class"] });
  D.addEventListener("visibilitychange", function () { syncPlay(); if (!D.hidden) arm(); });

  /* ---------- the idle cue ---------- */
  var cue = D.createElement("div");
  cue.className = "fxfab-cue";
  cue.setAttribute("aria-hidden", "true");
  cue.hidden = true;
  cue.textContent = L[lang()];
  cue.addEventListener("click", function () { endCue(); if (box && box.hidden) fab.click(); });
  D.body.appendChild(cue);

  var box = D.getElementById("bot");
  var cueDone = seen("fabCue") || reduced(), cueOn = false, cueTl = null, idleT = 0, holdT = 0;

  function routeOk() {
    var h = location.hash || "";
    if (root.classList.contains("at-home")) return true;
    return /^#\/for\/[a-z]+\/?$/.test(h);
  }
  function arm() {
    clearTimeout(idleT); idleT = 0;
    if (cueDone || cueOn || reduced()) return;
    if (!routeOk() || (box && !box.hidden)) return;
    idleT = setTimeout(fire, IDLE);
  }
  function poke() { if (cueOn) return; if (idleT) arm(); }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) { W.addEventListener(ev, function (e) { if (cueOn && ev !== "wheel" && e.target !== cue && !fab.contains(e.target)) endCue(); poke(); }, { passive: true, capture: true }); });
  W.addEventListener("scroll", poke, { passive: true });

  function rect(el) { return el.getBoundingClientRect(); }
  function hits(a, b, m) { return a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m; }
  var TEXTY = "h1,h2,h3,h4,p,li,a,button,input,textarea,select,label,span,b,strong,em,small,mark,.btn,.cc__go,.car__btn,.car__dots";
  /* is any visible text or control under the box r? */
  function blocked(r) {
    if (r.left < 4 || r.top < 4 || r.right > innerWidth - 4 || r.bottom > innerHeight - 4) return true;
    var els = D.querySelectorAll(TEXTY);
    for (var j = 0; j < els.length; j++) {
      var el = els[j];
      if (el === cue || cue.contains(el) || fab.contains(el) || (box && box.contains(el))) continue;
      var q = el.getBoundingClientRect();
      if (!q.width || !q.height || !hits(r, q, 2)) continue;
      var tag = el.tagName, own = /^(A|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(tag) || el.classList.contains("btn") || el.classList.contains("car__dots");
      if (!own) { for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) { own = true; break; } }
      if (!own) continue;
      var cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || +cs.opacity < 0.05) continue;
      return true;
    }
    return false;
  }
  /* left of the button, else above it; null when both would cover something */
  function place() {
    var f = rect(fab), gap = 10;
    cue.style.left = "0px"; cue.style.top = "0px"; cue.style.maxWidth = Math.max(120, f.left - gap - 12) + "px";
    var w = cue.offsetWidth, h = cue.offsetHeight;
    var a = { left: f.left - gap - w, top: f.top + f.height / 2 - h / 2 };
    a.right = a.left + w; a.bottom = a.top + h;
    if (!blocked(a)) { cue.classList.remove("fxfab-up"); return a; }
    cue.style.maxWidth = "";
    w = cue.offsetWidth; h = cue.offsetHeight;
    var b = { left: f.right - w, top: f.top - gap - h };
    b.right = b.left + w; b.bottom = b.top + h;
    if (!blocked(b)) { cue.classList.add("fxfab-up"); return b; }
    return null;
  }

  function fire() {
    idleT = 0;
    if (cueDone || cueOn || reduced() || !routeOk() || (box && !box.hidden)) return;
    if (!canPlay()) { arm(); return; }
    cue.textContent = L[lang()];
    cue.hidden = false;
    var at = place();
    cueDone = true; cueOn = true; mark("fabCue");
    if (at) { cue.style.left = Math.round(at.left) + "px"; cue.style.top = Math.round(at.top) + "px"; }
    else cue.hidden = true;
    fab.classList.add("fxfab-typing");
    var g = gs(), c = dots.querySelectorAll("circle");
    if (g) {
      cue.classList.remove("fxfab-css");
      cueTl = g.timeline({ onComplete: endCue });
      cueTl.fromTo(c, { opacity: 0.3 }, { opacity: 1, duration: 0.45, ease: "sine.inOut", stagger: { each: 0.15, repeat: 5, yoyo: true } }, 0);
      if (at) {
        cueTl.fromTo(cue, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(1.6)" }, 0);
        cueTl.to(cue, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.25 + HOLD / 1000);
      } else {
        cueTl.to({}, { duration: 0.1 }, 2.8);
      }
      if (!canPlay()) cueTl.pause();
    } else {
      fab.classList.add("fxfab-css");
      cue.classList.add("fxfab-css");
      cue.classList.remove("on", "out");
      void cue.offsetWidth;
      cue.classList.add("on");
      holdT = setTimeout(function () {
        cue.classList.add("out");
        holdT = setTimeout(endCue, 320);
      }, 250 + HOLD);
    }
  }
  function endCue() {
    clearTimeout(holdT); holdT = 0;
    if (cueTl) { cueTl.kill(); cueTl = null; }
    var g = gs();
    if (g) g.set(dots.querySelectorAll("circle"), { clearProps: "opacity" });
    fab.classList.remove("fxfab-typing");
    if (!spinCss) fab.classList.remove("fxfab-css");
    cue.classList.remove("on", "out", "fxfab-css");
    cue.hidden = true;
    if (g) g.set(cue, { clearProps: "opacity,transform" });
    cueOn = false;
  }

  /* ---------- the panel opens from the corner ---------- */
  if (box) {
    var wasOpen = !box.hidden;
    new MutationObserver(function () {
      var open = !box.hidden;
      if (open === wasOpen) return;
      wasOpen = open;
      if (!open) { box.classList.remove("fxfab-open"); arm(); return; }
      clearTimeout(idleT); idleT = 0;
      if (cueOn) endCue();
      if (!cueDone) { cueDone = true; mark("fabCue"); }
      if (reduced()) return;
      var g = gs(), chips = box.querySelectorAll(".bot__chips .bot__go");
      if (g) {
        g.killTweensOf(box);
        g.fromTo(box, { opacity: 0, scale: 0.96, transformOrigin: "100% 100%" }, { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out", clearProps: "opacity,transform,transformOrigin" });
        if (chips.length) g.fromTo(chips, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out", stagger: 0.06, delay: 0.08, clearProps: "opacity,transform" });
      } else {
        for (var k = 0; k < chips.length; k++) chips[k].style.setProperty("--fxi", String(k));
        box.classList.remove("fxfab-open"); void box.offsetWidth; box.classList.add("fxfab-open");
      }
    }).observe(box, { attributes: true, attributeFilter: ["hidden"] });
  }

  /* ---------- route and language ---------- */
  W.addEventListener("vf:route", function () { if (cueOn) endCue(); arm(); });
  W.addEventListener("hashchange", function () { if (cueOn) endCue(); });
  W.addEventListener("vf:lang", function () {
    cue.textContent = L[lang()];
    if (cueOn && !cue.hidden) { var at = place(); if (at) { cue.style.left = Math.round(at.left) + "px"; cue.style.top = Math.round(at.top) + "px"; } else endCue(); }
  });
  /* phones fire resize when the address bar slides; only a width change ends the cue */
  var lastW = innerWidth;
  W.addEventListener("resize", function () { if (innerWidth === lastW) return; lastW = innerWidth; if (cueOn) endCue(); });
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (reduced()) { endSpin(); endCue(); clearTimeout(idleT); } });

  /* start: the arc turns once the page is up, the idle clock starts now */
  function go() { startSpin(); arm(); }
  if (D.readyState === "complete") go(); else W.addEventListener("load", go);
})();
;
