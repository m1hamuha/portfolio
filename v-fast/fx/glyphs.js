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
