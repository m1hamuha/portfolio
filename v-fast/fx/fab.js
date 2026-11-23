/* fx/fab: the assistant button #botFab and its panel.
   The button is still: a dark disc with a solid lime outline. No spinning arc, no typing dots.
   Once ever (localStorage), on home only, after the hero story has played and 7s without a tap, key,
   wheel or scroll: an outlined pill "Where do you lose customers?" fades in next to the button,
   holds 3s and fades out. It never covers text or a button: if it would, it tries above the button,
   and if that is taken too it does not show (and is not spent).
   The panel opens from the corner (scale 0.96 to 1, 200ms).
   Reduced motion: no pill, the panel just appears. What the assistant answers is not touched. */
(function () {
  "use strict";
  var D = document, W = window, root = D.documentElement;
  if (W.__fxFab) return;
  var fab = D.getElementById("botFab");
  if (!fab) return;
  W.__fxFab = true;

  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  var IDLE = 7000, HOLD = 3000;

  /* ---------- words ---------- */
  var L = {
    ru: "Где теряешь клиентов?",
    uk: "Де втрачаєш клієнтів?",
    de: "Wo verlierst du Kunden?",
    en: "Where do you lose customers?"
  };
  function lang() { var l = (root.lang || "en").slice(0, 2).toLowerCase(); return L[l] ? l : "en"; }

  /* ---------- memory: the pill shows once, ever ---------- */
  function seen(k) { try { return W.localStorage.getItem("vf.fx." + k) === "1"; } catch (e) { return false; } }
  function mark(k) { try { W.localStorage.setItem("vf.fx." + k, "1"); } catch (e) {} }

  /* ---------- CSS (once) ---------- */
  if (!D.getElementById("fx-fab")) {
    var st = D.createElement("style");
    st.id = "fx-fab";
    st.textContent = [
      ".bot-fab.fxfab { overflow: visible; }",
      ".fxfab-cue { position: fixed; z-index: 49; display: flex; align-items: center; box-sizing: border-box; min-height: 44px; max-width: calc(100vw - 1.5rem); padding: 0.45rem 1rem; border: 1.5px solid var(--accent, #d8ff00); border-radius: 999px; background: #141414; color: #f6f6f1; font-family: var(--f-body, sans-serif); font-weight: 600; font-size: 15px; line-height: 1.25; white-space: nowrap; cursor: pointer; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); opacity: 0; transition: opacity 0.3s ease; -webkit-tap-highlight-color: transparent; }",
      ".fxfab-cue[hidden] { display: none; }",
      ".fxfab-cue.on { opacity: 1; }",
      ".bot.fxfab-open { transform-origin: 100% 100%; animation: fxfab-open 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) both; }",
      "@keyframes fxfab-open { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }",
      ".lvl3 .bot-fab.fxfab { width: 48px; height: 48px; }",
      "@media (max-width: 760px) { .has-buy.lvl3 .bot-fab.fxfab { bottom: calc(var(--bar, 0px) + 12px); } }",
      "@media (prefers-reduced-motion: reduce) { .bot.fxfab-open { animation: none !important; } .fxfab-cue { display: none !important; } }"
    ].join("\n");
    D.head.appendChild(st);
  }
  fab.classList.add("fxfab");

  /* ---------- visibility ---------- */
  var onScreen = true;
  function canPlay() { return !D.hidden && !!fab.offsetWidth && !fab.classList.contains("off") && onScreen; }
  if ("IntersectionObserver" in W) new IntersectionObserver(function (es) { onScreen = es[es.length - 1].isIntersecting; if (!onScreen && cueOn) endCue(); }).observe(fab);
  new MutationObserver(function () { if (fab.classList.contains("off") && cueOn) endCue(); }).observe(fab, { attributes: true, attributeFilter: ["class"] });
  D.addEventListener("visibilitychange", function () { if (D.hidden) { if (cueOn) endCue(); clearTimeout(idleT); idleT = 0; } else arm(); });

  /* ---------- the pill ---------- */
  var cue = D.createElement("div");
  cue.className = "fxfab-cue";
  cue.setAttribute("aria-hidden", "true");
  cue.hidden = true;
  cue.textContent = L[lang()];
  cue.addEventListener("click", function () { endCue(); if (box && box.hidden) fab.click(); });
  D.body.appendChild(cue);

  var box = D.getElementById("bot");
  var cueDone = seen("fabCue") || reduced(), cueOn = false, idleT = 0, holdT = 0, heroDone = false;

  function heroOk() {
    if (heroDone) return true;
    var pic = D.querySelector(".hero .hchat");
    if (!pic || pic.classList.contains("is-done") || reduced()) heroDone = true;
    return heroDone;
  }
  W.addEventListener("fx:hero", function () { heroDone = true; arm(); });
  function routeOk() { return root.classList.contains("at-home"); }
  function arm() {
    clearTimeout(idleT); idleT = 0;
    if (cueDone || cueOn || reduced()) return;
    if (!routeOk() || !heroOk() || (box && !box.hidden)) return;
    idleT = setTimeout(fire, IDLE);
  }
  function poke() { if (cueOn || cueDone) return; arm(); }
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (ev) {
    W.addEventListener(ev, function (e) { if (cueOn && e.target !== cue && !fab.contains(e.target)) endCue(); poke(); }, { passive: true, capture: true });
  });
  W.addEventListener("scroll", function () { if (cueOn) endCue(); poke(); }, { passive: true });

  function hits(a, b, m) { return a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m; }
  var TEXTY = "h1,h2,h3,h4,p,li,a,button,input,textarea,select,label,span,b,strong,em,small,mark,.btn,.cc__go,.car__btn,.car__dots";
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
  function place() {
    var f = fab.getBoundingClientRect(), gap = 10;
    cue.style.left = "0px"; cue.style.top = "0px"; cue.style.maxWidth = Math.max(120, f.left - gap - 12) + "px";
    var w = cue.offsetWidth, h = cue.offsetHeight;
    var a = { left: f.left - gap - w, top: f.top + f.height / 2 - h / 2 };
    a.right = a.left + w; a.bottom = a.top + h;
    if (cue.scrollWidth <= w + 1 && !blocked(a)) return a;
    cue.style.maxWidth = "";
    w = cue.offsetWidth; h = cue.offsetHeight;
    var b = { left: f.right - w, top: f.top - gap - h };
    b.right = b.left + w; b.bottom = b.top + h;
    if (!blocked(b)) return b;
    return null;
  }

  function fire() {
    idleT = 0;
    if (cueDone || cueOn || reduced() || !routeOk() || (box && !box.hidden)) return;
    if (!canPlay()) { arm(); return; }
    cue.textContent = L[lang()];
    cue.hidden = false;
    var at = place();
    if (!at) { cue.hidden = true; return; } /* nowhere free: stay quiet; the next idle stretch tries again */
    cueDone = true; cueOn = true; mark("fabCue");
    cue.style.left = Math.round(at.left) + "px"; cue.style.top = Math.round(at.top) + "px";
    void cue.offsetWidth;
    cue.classList.add("on");
    holdT = setTimeout(function () { cue.classList.remove("on"); holdT = setTimeout(endCue, 320); }, 300 + HOLD);
  }
  function endCue() {
    clearTimeout(holdT); holdT = 0;
    cue.classList.remove("on");
    cue.hidden = true;
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
      box.classList.remove("fxfab-open"); void box.offsetWidth; box.classList.add("fxfab-open");
    }).observe(box, { attributes: true, attributeFilter: ["hidden"] });
  }

  /* ---------- route and language ---------- */
  W.addEventListener("vf:route", function () { if (cueOn) endCue(); arm(); });
  W.addEventListener("hashchange", function () { if (cueOn) endCue(); });
  W.addEventListener("vf:lang", function () { cue.textContent = L[lang()]; if (cueOn) { var at = place(); if (at) { cue.style.left = Math.round(at.left) + "px"; cue.style.top = Math.round(at.top) + "px"; } else endCue(); } });
  var lastW = innerWidth;
  W.addEventListener("resize", function () { if (innerWidth === lastW) return; lastW = innerWidth; if (cueOn) endCue(); });
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (reduced()) { endCue(); clearTimeout(idleT); } });

  if (D.readyState === "complete") arm(); else W.addEventListener("load", arm);
})();
