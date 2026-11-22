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
