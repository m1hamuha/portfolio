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
  function go() {
    arm();
    /* on home the hero picture tells its story first; the arc turns after it (one thing moves at a time) */
    var home = D.getElementById("home"), pic = D.querySelector(".hero .hchat");
    var ev = home && !home.hidden && pic && !pic.classList.contains("is-done") ? "fx:hero" : null;
    /* on a business page the advised card tells its story first (fx/glyphs.js), the arc turns after it */
    var top = /^#\/for\/[a-z]+$/.test(location.hash) && D.querySelector(".svc.nv:not([hidden]) .cc--top");
    if (!ev && top && !top.classList.contains("is-gain")) ev = "fx:biz";
    if (ev && !reduced()) {
      var t = 0, once = function () { if (t < 0) return; clearTimeout(t); t = -1; startSpin(); };
      W.addEventListener(ev, once);
      t = setTimeout(once, 9000);
    } else startSpin();
  }
  if (D.readyState === "complete") go(); else W.addEventListener("load", go);
})();
