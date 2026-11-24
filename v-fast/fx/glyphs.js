/* fx/glyphs.js: the task icons of a business page (#/for/<business>) tell what the task does.
   Each task card (a.cc.cc--s) gets its own line icon in its ring (stroke 2, round caps, lime and greys
   on black) and one short story of about 1.0 to 1.2s:
     bot        a chat bubble pops in, then becomes a calendar with a lime check (booked by himself)
     mail       a bell swings twice, moves aside, a calendar day gets a lime check (the client comes)
     reviews    five outline stars fill lime one after another
     social     a blank square fills with a picture (mountain, sun), a small heart pops
     content    a dark photo becomes bright (light sweeps across, the sun appears)
     site       a map, a pin drops onto it with a small bounce
     leads      three dots from different sides fly into one list
     hiring     a person outline appears, a lime check pops at its shoulder
     reports    three bars grow from zero
     docs       lines write themselves on a sheet, then a lime euro sign appears
     assistant  a question mark turns into a lime check
   Before its story the icon shows its starting frame (it already reads as the task).
   A story plays once per card per visit, when the card is at least 60% on screen; cards play one
   after another (queue, 0.15s gap), never two at once. After it, the final frame stays. A card seen
   before shows its final frame at once. Reduced motion: final frames only.
   The advised card (.cc--top) plays first; its label slides in when its story starts.
   The name stays "glyphs" (build order, window.FXGlyphs used by fx/retention). */
(function () {
  "use strict";
  var D = document, W = window;
  if (W.__fxGlyphs) return;
  W.__fxGlyphs = true;

  var NS = "http://www.w3.org/2000/svg";
  var LIME = "#D8FF00", INK = "#ececec", DIM = "#5c5c5c", GHOST = "#2c2c2c", BG = "#0b0b0b";
  var GAP = 0.15;
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function gs() { return W.gsap || null; }

  if (!D.getElementById("fx-glyphs")) {
    var st = D.createElement("style");
    st.id = "fx-glyphs";
    st.textContent = [
      ".cc__art .ico.fxs{fill:none;stroke:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;overflow:visible;filter:none}",
      ".cc__art .ico.fxs + .ico.ph, .cc__art .fxg-old{display:none}",
      "@keyframes fxgTop{from{translate:0 -6px;opacity:0}to{translate:0 0;opacity:1}}",
      ".fxg-top-in .cc__top{animation:fxgTop .2s ease-out both}",
      "@media (prefers-reduced-motion:reduce){.fxg-top-in .cc__top{animation:none}}"
    ].join("");
    D.head.appendChild(st);
  }

  /* ---------- drawing ---------- */
  function ln(d, c, w, x) { return '<path d="' + d + '" stroke="' + (c || INK) + '" stroke-width="' + (w || 2) + '"' + (x || "") + "/>"; }
  var DRAW = ' pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"';
  function star(cx, cy) {
    var p = [], i, a, r;
    for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 1.65 : 3.8; p.push((cx + r * Math.cos(a)).toFixed(2) + " " + (cy + r * Math.sin(a)).toFixed(2)); }
    return "M" + p.join("L") + "Z";
  }
  var uid = 0;

  /* each story: markup of its starting frame, and tl(G, q, tl) that adds the story to a paused timeline */
  var S = {
    bot: {
      svg: function () {
        return '<g class="b">' + ln("M5 5.5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-8l-4 3.5v-3.5H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2z") +
          '<circle class="d" cx="8.5" cy="11.25" r="1.15" fill="' + INK + '" opacity="0"/><circle class="d" cx="12" cy="11.25" r="1.15" fill="' + INK + '" opacity="0"/><circle class="d" cx="15.5" cy="11.25" r="1.15" fill="' + INK + '" opacity="0"/></g>' +
          '<g class="c" opacity="0">' + ln("M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 9.5h16M8.5 3v4M15.5 3v4") +
          ln("M8.5 15l2.5 2.5 4.5-4.5", LIME, 2.2, ' class="k"' + DRAW) + "</g>";
      },
      tl: function (G, q, t) {
        /* the empty bubble (starting frame) gets a message typed in, then turns into the booked day */
        G.set(q(".b"), { transformOrigin: "50% 50%" });
        t.to(q(".b"), { keyframes: [{ scale: 1.12, duration: 0.12, ease: "power2.out" }, { scale: 1, duration: 0.14, ease: "power2.in" }] }, 0)
          .to(q(".d", 1), { opacity: 1, duration: 0.08, stagger: 0.1 }, 0.12)
          .to(q(".b"), { scale: 0.7, opacity: 0, duration: 0.2, ease: "power2.in" }, 0.6)
          .fromTo(q(".c"), { scale: 0.7, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(1.6)" }, 0.68)
          .to(q(".k"), { attr: { "stroke-dashoffset": 0 }, duration: 0.28, ease: "power2.out" }, 0.9);
      }
    },
    mail: {
      svg: function () {
        return '<g class="c" opacity="0">' + ln("M4.5 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM2.5 12.2h13M6.5 6.3v3.4M11.5 6.3v3.4") +
          ln("M5.8 16.6l2.2 2.2 3.6-3.6", LIME, 2.2, ' class="k"' + DRAW) + "</g>" +
          '<g class="bm"><g class="bh" opacity="0" stroke="' + BG + '" stroke-width="4.5"><path d="M6.5 16v-4.5a5.5 5.5 0 0 1 11 0V16l1.5 2H5z"/><path d="M10.2 20.6a2 2 0 0 0 3.6 0M12 4v2"/></g><g class="bs" stroke-width="2">' +
          '<path d="M6.5 16v-4.5a5.5 5.5 0 0 1 11 0V16l1.5 2H5z" stroke="' + INK + '"/><path d="M10.2 20.6a2 2 0 0 0 3.6 0M12 4v2" stroke="' + INK + '"/></g></g>';
      },
      tl: function (G, q, t) {
        G.set(q(".bs"), { transformOrigin: "50% 0%" });
        t.to(q(".bs"), { keyframes: [
          { rotation: 16, duration: 0.12, ease: "sine.out" }, { rotation: -14, duration: 0.16, ease: "sine.inOut" },
          { rotation: 11, duration: 0.14, ease: "sine.inOut" }, { rotation: -6, duration: 0.11, ease: "sine.inOut" },
          { rotation: 0, duration: 0.08, ease: "sine.in" }] }, 0)
          .fromTo(q(".bm"), { x: 0, y: 0, scale: 1, transformOrigin: "50% 50%" }, { x: 7.6, y: -6.4, scale: 0.5, duration: 0.3, ease: "power2.inOut",
            onUpdate: function () { var k = G.getProperty(q(".bm"), "scaleX") || 1; q(".bs").setAttribute("stroke-width", (1.9 / k).toFixed(2)); q(".bh").setAttribute("stroke-width", (4.6 / k).toFixed(2)); } }, 0.62)
          .to(q(".bh"), { opacity: 1, duration: 0.15 }, 0.62)
          .fromTo(q(".c"), { opacity: 0, y: 2 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.72)
          .to(q(".k"), { attr: { "stroke-dashoffset": 0 }, duration: 0.25, ease: "power2.out" }, 0.95);
      }
    },
    reviews: {
      svg: function () {
        var c = [[3, 8.6], [12, 8.6], [21, 8.6], [7.5, 16.6], [16.5, 16.6]], s = "";
        c.forEach(function (p) { s += '<path class="s" d="' + star(p[0], p[1]) + '" stroke="' + INK + '" stroke-width="1.35" fill="rgba(216,255,0,0)"/>'; });
        return s;
      },
      tl: function (G, q, t) {
        var s = q(".s", 1);
        G.set(s, { transformOrigin: "50% 50%" });
        s.forEach(function (el, i) {
          var at = 0.1 + i * 0.17;
          t.to(el, { fill: LIME, stroke: LIME, duration: 0.12 }, at)
            .to(el, { keyframes: [{ scale: 1.35, duration: 0.1, ease: "power2.out" }, { scale: 1, duration: 0.16, ease: "power2.in" }] }, at);
        });
      }
    },
    social: {
      svg: function () {
        var id = "fxgc" + (++uid);
        return '<defs><clipPath id="' + id + '"><rect x="4.5" y="4.5" width="15" height="15" rx="2"/></clipPath></defs>' +
          ln("M6.5 3.5h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3z") +
          ln("M12 9.5v5M9.5 12h5", DIM, 2, ' class="p"') +
          '<g clip-path="url(#' + id + ')"><g class="m" opacity="0">' + ln("M3.5 18l4.8-5.6 3.4 3.8 2.4-2.4 6.4 5.7") + "</g>" +
          '<circle class="u" cx="15.6" cy="8.6" r="1.7" fill="' + LIME + '" opacity="0"/></g>' +
          '<path class="h" opacity="0" d="M19.2 22.6s-3.9-2.3-3.9-5a2.1 2.1 0 0 1 3.9-1.2 2.1 2.1 0 0 1 3.9 1.2c0 2.7-3.9 5-3.9 5z" fill="' + LIME + '" stroke="' + BG + '" stroke-width="1.6" paint-order="stroke"/>';
      },
      tl: function (G, q, t) {
        t.to(q(".p"), { opacity: 0, scale: 0.5, transformOrigin: "50% 50%", duration: 0.15 }, 0)
          .fromTo(q(".m"), { opacity: 1, y: 9 }, { y: 0, duration: 0.4, ease: "power2.out" }, 0.08)
          .fromTo(q(".u"), { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.4)" }, 0.45)
          .fromTo(q(".h"), { opacity: 0, scale: 0, transformOrigin: "50% 70%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)" }, 0.78);
      }
    },
    content: {
      svg: function () {
        var id = "fxgc" + (++uid);
        return '<defs><clipPath id="' + id + '"><rect x="3" y="5" width="18" height="14" rx="2.5"/></clipPath></defs>' +
          '<path class="f" d="M5.5 5h13a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9A2.5 2.5 0 0 1 5.5 5z" stroke="' + DIM + '" stroke-width="2"/>' +
          '<g clip-path="url(#' + id + ')"><path class="m" d="M3 17.5l5.5-5.5 3.5 3.5 2.5-2.5 6.5 6.2" stroke="' + DIM + '" stroke-width="2"/>' +
          '<circle class="u" cx="16.3" cy="9.4" r="1.7" fill="' + LIME + '" opacity="0"/>' +
          '<path class="w" d="M-2 3h5l-5 18h-5z" fill="#ffffff" opacity="0"/></g>' +
          '<path class="x" opacity="0" d="M20.5 1.2l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="' + LIME + '" stroke="' + BG + '" stroke-width="1.2" paint-order="stroke"/>';
      },
      tl: function (G, q, t) {
        t.fromTo(q(".w"), { x: 0, opacity: 0.55 }, { x: 30, duration: 0.65, ease: "power1.inOut" }, 0)
          .to(q(".f"), { stroke: INK, duration: 0.3 }, 0.12)
          .to(q(".m"), { stroke: INK, duration: 0.3 }, 0.25)
          .fromTo(q(".u"), { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, 0.5)
          .fromTo(q(".x"), { opacity: 0, scale: 0, rotation: -45, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2)" }, 0.75);
      }
    },
    site: {
      svg: function () {
        return ln("M3 7l5.5-2 7 2 5.5-2v12.5l-5.5 2-7-2-5.5 2z") + ln("M8.5 5v12.5M15.5 7v12.5", DIM, 1.6) +
          '<ellipse class="o" cx="12" cy="16.2" rx="2.2" ry="0.8" fill="' + LIME + '" opacity="0"/>' +
          '<g class="pn" opacity="0"><path d="M12 16s-4.3-4-4.3-7.3a4.3 4.3 0 0 1 8.6 0C16.3 12 12 16 12 16z" fill="' + BG + '" stroke="' + LIME + '" stroke-width="2"/>' +
          '<circle cx="12" cy="8.7" r="1.4" fill="' + LIME + '"/></g>';
      },
      tl: function (G, q, t) {
        t.fromTo(q(".pn"), { opacity: 0, y: -11 }, { opacity: 1, duration: 0.12 }, 0.12)
          .to(q(".pn"), { y: 0, duration: 0.38, ease: "power2.in" }, 0.12)
          .to(q(".pn"), { y: -2.4, duration: 0.15, ease: "power2.out" }, 0.5)
          .to(q(".pn"), { y: 0, duration: 0.15, ease: "power2.in" }, 0.65)
          .to(q(".pn"), { y: -0.8, duration: 0.1, ease: "power2.out" }, 0.8)
          .to(q(".pn"), { y: 0, duration: 0.12, ease: "power2.in" }, 0.9)
          .fromTo(q(".o"), { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 0.6, scale: 1, duration: 0.3, ease: "power2.out" }, 0.45);
      }
    },
    leads: {
      svg: function () {
        return ln("M10 7h10M10 12h10M10 17h10", DIM, 2, ' class="l"') +
          '<circle cx="5.5" cy="7" r="1.6" stroke="' + DIM + '" stroke-width="1.2"/><circle cx="5.5" cy="12" r="1.6" stroke="' + DIM + '" stroke-width="1.2"/><circle cx="5.5" cy="17" r="1.6" stroke="' + DIM + '" stroke-width="1.2"/>' +
          '<circle class="d" cx="5.5" cy="7" r="2" fill="' + LIME + '" opacity="0"/><circle class="d" cx="5.5" cy="12" r="2" fill="' + LIME + '" opacity="0"/><circle class="d" cx="5.5" cy="17" r="2" fill="' + LIME + '" opacity="0"/>';
      },
      tl: function (G, q, t) {
        var d = q(".d", 1), from = [[9, -12], [-12, 0], [10, 11]];
        d.forEach(function (el, i) {
          t.fromTo(el, { opacity: 0, x: from[i][0], y: from[i][1] }, { opacity: 1, x: 0, y: 0, duration: 0.5, ease: "power3.out" }, 0.05 + i * 0.17);
        });
        t.to(q(".l"), { stroke: INK, duration: 0.3 }, 0.75);
      }
    },
    hiring: {
      svg: function () {
        return '<g class="pp"><circle cx="10.5" cy="7.5" r="3.8" stroke="' + DIM + '" stroke-width="2"/>' +
          ln("M3.5 20.5a7 7 0 0 1 14 0", DIM) + "</g>" +
          '<g class="k" opacity="0"><circle cx="18.4" cy="15.6" r="5.6" fill="' + BG + '"/>' + ln("M15.8 15.7l1.9 1.9 3.5-3.6", LIME, 2.4, ' class="kp"' + DRAW) + "</g>";
      },
      tl: function (G, q, t) {
        /* the grey candidate (starting frame) steps forward in white, then the lime check: the right one */
        var pp = q(".pp"), ps = [].slice.call(pp.children);
        G.set(pp, { transformOrigin: "50% 100%" });
        t.to(ps, { stroke: INK, duration: 0.3 }, 0.05)
          .to(pp, { keyframes: [{ scale: 1.1, duration: 0.18, ease: "power2.out" }, { scale: 1, duration: 0.2, ease: "power2.in" }] }, 0.05)
          .fromTo(q(".k"), { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1.2, duration: 0.25, ease: "back.out(2.6)" }, 0.65)
          .to(q(".kp"), { attr: { "stroke-dashoffset": 0 }, duration: 0.3, ease: "power2.out" }, 0.74);
      }
    },
    reports: {
      svg: function () {
        var b = [[6.5, 13], [11.25, 9], [16, 5]], s = "";
        b.forEach(function (r) { s += '<rect x="' + r[0] + '" y="' + r[1] + '" width="3.2" height="' + (19 - r[1]) + '" rx="0.6" fill="' + GHOST + '"/>'; });
        b.forEach(function (r) { s += '<rect class="r" x="' + r[0] + '" y="' + r[1] + '" width="3.2" height="' + (19 - r[1]) + '" rx="0.6" fill="' + LIME + '" opacity="0"/>'; });
        return s + ln("M3.5 3.5v16.5h17");
      },
      tl: function (G, q, t) {
        t.fromTo(q(".r", 1), { opacity: 1, scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.55, ease: "power2.out", stagger: 0.22 }, 0.05);
      }
    },
    docs: {
      svg: function () {
        return ln("M5 3h8l4.5 4.5V21H5z") + ln("M13 3v4.5h4.5", INK, 1.6) +
          ln("M7.6 11h6.4", INK, 1.8, ' class="t"' + DRAW) + ln("M7.6 14.2h6.4", INK, 1.8, ' class="t"' + DRAW) + ln("M7.6 17.4h3.6", INK, 1.8, ' class="t"' + DRAW) +
          '<g class="e" opacity="0"><path d="M21.3 15.2A3.6 3.6 0 1 0 21.3 19.8M14.2 16.8h5M14.2 18.6h5" stroke="' + BG + '" stroke-width="4.6"/>' +
          '<path d="M21.3 15.2A3.6 3.6 0 1 0 21.3 19.8M14.2 16.8h5M14.2 18.6h5" stroke="' + LIME + '" stroke-width="1.8"/></g>';
      },
      tl: function (G, q, t) {
        t.to(q(".t", 1), { attr: { "stroke-dashoffset": 0 }, duration: 0.22, ease: "none", stagger: 0.24 }, 0)
          .fromTo(q(".e"), { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.4)" }, 0.78);
      }
    },
    assistant: {
      svg: function () {
        return ln("M12 3.5a8.5 8 0 1 1-4.2 15l-4.3 1.3 1.3-3.9A8.5 8 0 0 1 12 3.5z") +
          '<g class="q"><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.6-2.4 1.9-2.4 3.2" stroke="' + INK + '" stroke-width="2"/><circle cx="12" cy="16.2" r="1.1" fill="' + INK + '"/></g>' +
          ln("M8.4 12l2.4 2.4 4.8-4.8", LIME, 2.4, ' class="k"' + DRAW);
      },
      tl: function (G, q, t) {
        G.set(q(".q"), { transformOrigin: "50% 60%" });
        t.to(q(".q"), { keyframes: [{ rotation: -12, duration: 0.12 }, { rotation: 10, duration: 0.14 }, { rotation: 0, duration: 0.1 }] }, 0)
          .to(q(".q"), { opacity: 0, scale: 0.4, duration: 0.2, ease: "power2.in" }, 0.4)
          .to(q(".k"), { attr: { "stroke-dashoffset": 0 }, duration: 0.4, ease: "power2.out" }, 0.62);
      }
    }
  };
  var ALIAS = { data: "reports", translate: "assistant" };
  function story(task) { return S[task] || S[ALIAS[task]] || S.assistant; }

  function keyOf(card) { var m = (card.getAttribute("href") || "").match(/^#\/for\/([a-z]+)\/([a-z]+)$/); return m ? [m[1], m[2]] : null; }

  /* put the story icon in a card's ring, in its starting frame (once) */
  function dress(card) {
    if (card.__fxg) return card.__fxg;
    var k = keyOf(card), art = card.querySelector(".cc__art");
    if (!k || !art) return null;
    var old = art.querySelector("svg.ico.ph");
    var s = D.createElementNS(NS, "svg");
    s.setAttribute("class", "ico fxs");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    var def = story(k[1]);
    s.innerHTML = def.svg();
    if (old) { old.classList.add("fxg-old"); art.insertBefore(s, old); } else art.insertBefore(s, art.firstChild);
    card.__fxg = { card: card, key: k[0] + "/" + k[1], svg: s, def: def, tl: null, done: false };
    return card.__fxg;
  }

  function build(g) {
    var G = gs(); if (!G || g.tl) return g.tl;
    var s = g.svg;
    var q = function (sel, all) { return all ? [].slice.call(s.querySelectorAll(sel)) : s.querySelector(sel); };
    g.tl = G.timeline({ paused: true });
    g.def.tl(G, q, g.tl);
    return g.tl;
  }
  function finalFrame(g) {
    var tl = build(g);
    if (tl) tl.progress(1).pause();
    g.done = true;
  }

  /* ---------- the queue ---------- */
  var seen = {};          /* "niche/task" -> played in this visit */
  var st8 = null;         /* { sec, io, ratio: Map, queue: [], cur, timer } */

  function label(card) {
    if (!card.classList.contains("cc--top")) return;
    var lab = card.querySelector(".cc__top");
    if (!lab) return;
    /* fx/retention slides its own label; a label already shown (the 3s fallback) stays */
    if (lab.hasAttribute("data-fxrt-i18n") || getComputedStyle(lab).opacity === "1") card.classList.add("fxg-still");
    else { card.classList.remove("fxg-top-in"); void card.offsetWidth; card.classList.add("fxg-top-in"); }
  }

  function visible(card) {
    if (!st8 || D.hidden) return false;
    var r = st8.ratio.get(card);
    if (r == null || r < 0.6) return false;
    /* the 3D carousel: a far side card (shown under 70%) waits until it turns closer */
    var w = card.offsetWidth;
    return !w || card.getBoundingClientRect().width / w >= 0.7;
  }

  function enqueue(card, hold) {
    var g = card.__fxg;
    if (!st8 || !g || g.done || st8.cur === g || st8.queue.indexOf(card) > -1) return;
    st8.queue.push(card);
    /* the advised card first, then page order */
    var all = [].slice.call(st8.sec.querySelectorAll(".cc.cc--s"));
    st8.queue.sort(function (a, b) {
      var ta = a.classList.contains("cc--top") ? 0 : 1, tb = b.classList.contains("cc--top") ? 0 : 1;
      return ta - tb || all.indexOf(a) - all.indexOf(b);
    });
    if (!hold) pump();
  }

  function pump() {
    if (!st8 || !st8.ready || st8.cur || st8.timer) return;
    while (st8.queue.length) {
      var card = st8.queue.shift(), g = card.__fxg;
      if (!g || g.done) continue;
      if (!visible(card)) continue; /* scrolled away while waiting: it comes back when seen again */
      play(g);
      return;
    }
  }

  function play(g) {
    var tl = build(g);
    label(g.card);
    if (!tl) { finalFrame(g); seen[g.key] = 1; return; }
    st8.cur = g;
    var s = st8;
    tl.eventCallback("onComplete", function () {
      g.done = true; seen[g.key] = 1;
      if (s !== st8) return;
      s.cur = null;
      if (g.card.classList.contains("cc--top")) W.dispatchEvent(new Event("fx:biz"));
      s.timer = setTimeout(function () { s.timer = 0; pump(); }, GAP * 1000);
    });
    tl.play(0);
  }

  function niche() { var m = location.hash.match(/^#\/for\/([a-z]+)$/); return m ? m[1] : null; }

  function stop() {
    if (!st8) return;
    var s = st8; st8 = null;
    if (s.io) s.io.disconnect();
    if (s.mo) s.mo.disconnect();
    clearTimeout(s.timer);
    if (s.cur) { s.cur.tl.eventCallback("onComplete", null); s.cur.tl.progress(1).pause(); s.cur.done = true; seen[s.cur.key] = 1; }
    if (s.sec) [].forEach.call(s.sec.querySelectorAll(".cc"), function (c) { c.classList.remove("fxg-top-in"); });
  }

  function setup() {
    stop();
    var n = niche(); if (!n) return;
    var sec = D.getElementById("n-" + n);
    if (!sec || sec.hidden) return;
    var cards = [].slice.call(sec.querySelectorAll("a.cc.cc--s"));
    st8 = { sec: sec, io: null, ratio: new Map(), queue: [], cur: null, timer: 0, ready: false };
    var still = reduced() || !gs() || !("IntersectionObserver" in W);
    var wait = [];
    cards.forEach(function (c) {
      var g = dress(c); if (!g) return;
      if (still || seen[g.key] || g.done) { finalFrame(g); seen[g.key] = 1; if (c.classList.contains("cc--top")) c.classList.add("fxg-still"); }
      else wait.push(c);
    });
    if (!wait.length) return;
    var s = st8;
    s.io = new IntersectionObserver(function (es) {
      if (s !== st8) return;
      es.forEach(function (e) {
        s.ratio.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
        if (visible(e.target)) enqueue(e.target, true);
      });
      pump();
    }, { threshold: [0, 0.3, 0.6, 0.8, 1] });
    wait.forEach(function (c) { s.io.observe(c); });
    /* the 3D carousel turns by script (app.js moves .mid): once a turn settles, cards now in front queue */
    if ("MutationObserver" in W) {
      var rt = 0;
      s.mo = new MutationObserver(function () {
        clearTimeout(rt);
        rt = setTimeout(function () { if (s !== st8) return; wait.forEach(function (c) { if (visible(c)) enqueue(c, true); }); pump(); }, 450);
      });
      cards.forEach(function (c) { s.mo.observe(c, { attributes: true, attributeFilter: ["class"] }); });
    }
    /* the page and its carousel settle first, so the advised card is in the queue before anything plays */
    s.timer = setTimeout(function () { s.timer = 0; s.ready = true; pump(); }, 250);
  }

  var tm = 0;
  function later() { clearTimeout(tm); tm = setTimeout(setup, 60); } /* after the page has painted its cards */

  /* every business page gets its icons in their starting frame at once (no swap after paint) */
  function dressAll() { [].forEach.call(D.querySelectorAll(".nv a.cc.cc--s"), dress); }
  dressAll();

  W.addEventListener("vf:route", function () { stop(); later(); });
  W.addEventListener("hashchange", function () { if (!niche()) stop(); });
  /* a hidden tab: nothing starts; back on screen, the cards in view queue again */
  D.addEventListener("visibilitychange", function () {
    if (D.hidden || !st8) return;
    [].forEach.call(st8.sec.querySelectorAll("a.cc.cc--s"), function (c) { if (visible(c)) enqueue(c); });
  });
  if (mq) {
    var onRm = function () { if (niche()) setup(); };
    if (mq.addEventListener) mq.addEventListener("change", onRm); else if (mq.addListener) mq.addListener(onRm);
  }
  /* test hook: the story of one task on a given svg-holding card (frame strips) */
  W.FXGlyphs = { setup: setup, kill: stop, _story: function (card) {
    var g = card.__fxg; if (g) { if (g.tl) g.tl.kill(); g.svg.parentNode.removeChild(g.svg); card.__fxg = null; }
    g = dress(card); return g ? function () { return build(g); } : null;
  } };
  if (niche()) later();
})();
