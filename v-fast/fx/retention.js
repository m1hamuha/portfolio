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

  /* came back from a page (detail.from): app.js has already centred the card of that page, leave it there */
  function setupHome(from) {
    killHome();
    if (!onHome()) return;
    var n = lastNiche();
    if (!n || !work()) return;
    home = { n: n, p: null, row: null, chip: null, timers: [], shown: false, waiting: false };
    if (!from) centre(n, 30);
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
  function all(from) { setupHome(from); setupBiz(); }
  W.addEventListener("vf:route", function (e) { killHome(); killBiz(); all(e && e.detail ? e.detail.from : null); });
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
