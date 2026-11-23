/* fx/contact: the contact step.
   NOW: everything is shown at once. The bubble with the ready message and its check, the chips, no
   word-by-word fade, no check drawing, no stagger, no nudge. The "Next for your business" orbit is
   off (it showed a check on a task that was only chosen, not sent, and its ring turned for 40s).
   The "While you wait" chip appears at once after a tap on a messenger button.
   (Older notes below describe the parts that were cut.)
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
  function buildOrbit() { return null; } /* cut: see the header */
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
    /* shown at once, no slide */
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
  function prime() {} /* nothing starts hidden any more */
  function play() {
    if (played || !active) return;
    played = true; clearTimeout(safeT);
    finalFrame(); /* the final frame at once */
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
      if (d.order) { cur.order = d.order; cur.niche = d.orderNiche || null; } else if (!hasOrder()) cur.order = null;
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
