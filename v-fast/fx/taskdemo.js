/* fx/taskdemo.js: the task page's one story, played once.
   The phone #ph, driven through window.PH: the "without me" side stands still and whole for 3 s
   (the message, its time, the red tag, the loss line), the handle sweeps once to "with me", that side
   answers (typing dots for half a second, the lime reply, the lime gain line) and the phone holds there
   for good (REST). Once per task per session (sessionStorage "demo:<niche>/<task>"); a task already seen
   and reduced motion show that final frame at once, still. Any touch on the phone stops the story where
   it is, everything readable. The "with me" answer also plays when the visitor drags the handle there.
   Nothing else on the task page moves: the three steps are still (a thin grey connector in CSS), Order
   does not breathe. Adds no words: every element it draws is aria-hidden decoration. */
(function () {
  "use strict";
  if (window.__fxTaskDemo) return;
  window.__fxTaskDemo = true;

  var NS = "http://www.w3.org/2000/svg";
  var REST = 8;   /* the story ends resting on "with me"; a split at 50% would cut both texts mid-word */
  var HOLD = 3;   /* seconds the whole "without me" side stands before the sweep */
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }
  function G() { return window.gsap || null; }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; e.setAttribute("aria-hidden", "true"); return e; }
  function sv(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  /* ---------- CSS, once ---------- */
  if (!document.getElementById("fx-taskdemo")) {
    var st = document.createElement("style");
    st.id = "fx-taskdemo";
    st.textContent = [
      /* the slim price row stays down while the story plays */
      "html.td-run{--bar:0px !important}",
      "html.td-run #l3bar.on{transform:translateY(110%) !important;visibility:hidden}",
      /* while the story shows both halves, the 'with me' half is readable as it is uncovered */
      "#ph.hand.td-split .scr--a > *{opacity:1}",
      /* typing dots live inside the mock-up */
      ".td-host{position:relative}",
      ".td-dots{position:absolute;right:0;display:inline-flex;align-items:center;padding:.55rem .8rem;border-radius:1.1rem 1.1rem .35rem 1.1rem;background:#1d1d1d;pointer-events:none}",
      ".td-dots svg{display:block;width:34px;height:10px}",
      "@media (prefers-reduced-motion: reduce){.td-dots{display:none}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ---------- state ---------- */
  var cur = null;          /* { n, sid, type, phone } of the task page set up */
  var live = [];           /* tweens and timelines that belong to this page */
  var demo = null;         /* { stage } while the story runs */
  var paused = false, phSeen = 0, phIO = null, mo = null, waitT = 0;
  var lastPos = 86, armed = true, withBusy = null, rest = false;

  function ph() { return document.getElementById("ph"); }
  function sceneEl() { return document.getElementById("scene"); }
  function onTask() { var l3 = document.getElementById("l3"); return !!(l3 && !l3.hidden && window.PH && window.PH.ctx && window.PH.ctx()); }
  function keep(x) { if (x) live.push(x); return x; }
  function killLive() { live.forEach(function (x) { try { x.kill(); } catch (e) {} }); live = []; clearTimeout(waitT); waitT = 0; }
  function pauseAll(on) { paused = on; live.forEach(function (x) { try { if (on) x.pause(); else x.resume(); } catch (e) {} }); }
  function key() { return cur ? "demo:" + cur.n + "/" + cur.sid : ""; }
  function seen() { try { return sessionStorage.getItem(key()) === "1"; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(key(), "1"); } catch (e) {} }
  /* how much of the phone is on screen now, and whether the whole loss line is */
  function visRatio() {
    var h = ph(); if (!h) return 0;
    var r = h.getBoundingClientRect(); if (!r.height) return 0;
    return Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height;
  }
  function lossOn() {
    var l = document.getElementById("scLoss");
    if (!l || l.hidden) return visRatio() >= 0.9;
    var r = l.getBoundingClientRect();
    /* readable: its top on screen and at least four fifths of it above the bottom edge */
    return r.top >= 0 && r.height > 0 && (innerHeight - r.top) >= r.height * 0.8;
  }
  function pos() { return window.PH && window.PH.pos ? window.PH.pos() : 86; }
  function setPos(v, smooth) { if (window.PH && window.PH.set) window.PH.set(v, smooth); }

  /* ---------- elements of the mock-up ---------- */
  function mockA() { var a = document.getElementById("scBodyA"); return a && a.firstElementChild; }
  function kids(w) { return w ? [].slice.call(w.children) : []; }
  var PARTS = ".mk-reply, .mk-img, .mk-status.good, .mk-btn, .mk-total, .mk-tr, .mk-line, .mk-row.good";
  function clearAll() {
    var g = G(), a = mockA(), list = kids(a).concat(a ? $$(PARTS + ", .sbub", a) : []);
    ["scGain", "scBodyA"].forEach(function (id) { var e = document.getElementById(id); if (e) list.push(e); });
    list.forEach(function (e) { if (g) g.set(e, { clearProps: "opacity,transform,visibility" }); else { e.style.opacity = ""; e.style.transform = ""; } });
    $$(".td-dots").forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
  }

  /* ---------- "with me": the answer (also after a drag of the visitor's own) ---------- */
  function withTl() {
    var g = G(), tl = g.timeline(), a = mockA(), items = kids(a), gain = document.getElementById("scGain"), t = 0.6;
    if (cur.type === "chat" && a) {
      /* the customer's message is there at once; dots for half a second; the lime reply; the customer's yes */
      var a2 = $(".sbub--after", a), a3 = a2 && a2.nextElementSibling;
      if (a2) {
        tl.set(a2, { opacity: 0 }, 0);
        if (a3) tl.set(a3, { opacity: 0 }, 0);
        a.classList.add("td-host");
        var dots = mk("div", "td-dots"), ds = sv("svg", { viewBox: "0 0 34 10" }), cs = [];
        for (var i = 0; i < 3; i++) { var c = sv("circle", { cx: 5 + i * 12, cy: 5, r: 3, fill: "#a6a6a6", opacity: "0.35" }); ds.appendChild(c); cs.push(c); }
        dots.appendChild(ds);
        tl.call(function () { dots.style.top = a2.offsetTop + "px"; a.appendChild(dots); }, null, 0.05);
        tl.fromTo(dots, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.05);
        tl.to(cs, { attr: { opacity: 1 }, duration: 0.12, stagger: 0.12, ease: "sine.inOut" }, 0.1);
        tl.to(dots, { opacity: 0, duration: 0.08, onComplete: function () { if (dots.parentNode) dots.parentNode.removeChild(dots); } }, 0.55);
        tl.fromTo(a2, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.6);
        t = 0.9;
        if (a3) { tl.to(a3, { opacity: 1, duration: 0.25, ease: "power2.out" }, 0.95); t = 1.25; }
      }
    } else if (a) {
      /* other kinds: the result appears in one beat (rows together), then the gain */
      var parts = $$(PARTS, a);
      if (!parts.length) parts = items.slice(-1);
      tl.fromTo(parts, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.1);
      t = 0.55;
    }
    if (gain && gain.textContent) tl.fromTo(gain, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, t + 0.1);
    return tl;
  }
  /* the parts withTl() brings in wait unseen behind the handle until they play (no flash of the final frame) */
  function preHideWith() {
    var g = G(), a = mockA();
    if (!g || !a || !cur) return;
    var hide = cur.type === "chat" ? $$(".sbub--after", a).concat($$(".sbub--after ~ .sbub", a)) : $$(PARTS, a);
    if (cur.type !== "chat" && !hide.length) hide = kids(a).slice(-1);
    g.set(hide, { opacity: 0 });
    var gain = document.getElementById("scGain"); if (gain) g.set(gain, { opacity: 0 });
  }
  function playWith(done) {
    var g = G();
    if (!g || !cur || reduced()) { if (done) done(); return; }
    if (withBusy) { withBusy.kill(); withBusy = null; clearAll(); }
    withBusy = keep(withTl());
    withBusy.eventCallback("onComplete", function () { withBusy = null; if (done) done(); });
    if (paused) withBusy.pause();
  }

  /* ---------- the visitor's own drag to "with me" plays the answer ---------- */
  function onPos() {
    var p = pos(), h = ph();
    if (p <= 30 && lastPos > 30 && armed) { armed = false; if (!demo) playWith(); }
    if (p >= 55) armed = true;
    if (h && !demo && p > 80) h.classList.remove("td-split");
    lastPos = p;
  }

  /* ---------- the final frame, still ---------- */
  function restFrame() {
    var h = ph();
    if (!h) return;
    rest = true;
    if (window.PH.stop) window.PH.stop();
    h.classList.add("td-split");
    setPos(REST, false); lastPos = REST; armed = false;
    /* the slim price row and the round assistant button look again: neither may lie on the gain line */
    try { h.dispatchEvent(new Event("transitionend")); } catch (e) {}
  }

  /* ---------- the story ---------- */
  function canDemo() { return !!(G() && cur && cur.phone && !reduced() && !seen() && ph() && !sceneEl().hidden); }
  function startDemo() {
    if (demo || !canDemo()) return;
    var g = G(), h = ph();
    markSeen();
    demo = { stage: "hold" };
    document.documentElement.classList.add("td-run");
    if (window.PH.stop) window.PH.stop();
    setPos(86, false); lastPos = 86; armed = true;
    /* 1) the whole "without me" side, still, for 3 s */
    var tl = keep(g.timeline());
    tl.to({}, { duration: HOLD });
    /* 2) one sweep to "with me"; the answer plays as the handle passes the middle */
    tl.call(function () { if (!demo) return; demo.stage = "sweep"; preHideWith(); h.classList.add("td-split"); });
    var o = { p: 86 };
    tl.call(function () { if (demo) h.classList.add("td-sweep"); });
    tl.to(o, { p: REST, duration: 0.9, ease: "power2.inOut", onUpdate: function () { if (demo) setPos(o.p, false); }, onComplete: unSweep });
    tl.call(function () { if (!demo) return; demo.stage = "with"; armed = false; playWith(endDemo); }, null, HOLD + 0.45);
    if (paused) tl.pause();
  }
  /* 3) it holds on "with me" for good */
  function endDemo() {
    if (!demo) return;
    demo = null;
    document.documentElement.classList.remove("td-run");
    restFrame();
  }
  /* any touch on the phone: stop where it is, everything readable */
  function unSweep() { var h = ph(); if (h && h.classList.contains("td-sweep")) { h.classList.remove("td-sweep"); setPos(pos(), false); } }
  function cancel() {
    unSweep();
    if (!demo && !withBusy) return;
    demo = null; withBusy = null;
    document.documentElement.classList.remove("td-run");
    killLive(); clearAll();
  }

  /* ---------- setup and cleanup per task page ---------- */
  function teardown() {
    unSweep();
    demo = null; withBusy = null;
    document.documentElement.classList.remove("td-run");
    killLive(); clearAll();
    if (phIO) { phIO.disconnect(); phIO = null; }
    if (mo) { mo.disconnect(); mo = null; }
    removeEventListener("scroll", onScroll);
    var h = ph(); if (h) h.classList.remove("td-split");
    $$(".td-host").forEach(function (e) { e.classList.remove("td-host"); });
    phSeen = 0; paused = false; rest = false;
    cur = null;
  }
  function tryStart() {
    clearTimeout(waitT);
    waitT = setTimeout(function () { waitT = 0; if (cur && !demo && !seen() && !document.hidden && visRatio() >= 0.6 && lossOn()) startDemo(); }, 350);
  }
  function onScroll() { if (cur && !demo && !seen()) tryStart(); }
  function setup() {
    var ctx = window.PH && window.PH.ctx && window.PH.ctx();
    if (!ctx || !onTask()) { if (cur) teardown(); return; }
    var type = window.PH.kind ? window.PH.kind() : null;
    /* same task drawn again: refresh, unless the phone was not there yet (content.js loads async) */
    if (cur && cur.n === ctx[0] && cur.sid === ctx[1] && cur.phone) { refresh(type); return; }
    if (cur) teardown();
    cur = { n: ctx[0], sid: ctx[1], type: type };
    var h = ph(), sc = sceneEl();
    if (!h || !sc || sc.hidden) return;
    cur.phone = true;
    lastPos = pos(); armed = lastPos > 30;
    if ("MutationObserver" in window) { mo = new MutationObserver(onPos); mo.observe(h, { attributes: true, attributeFilter: ["style"] }); }
    /* reduced motion, no GSAP, or the story already seen in this session: its final frame, still */
    if (reduced() || !G() || seen()) { markSeen(); restFrame(); return; }
    /* the price row waits for the story (or the first touch, or a scroll past the phone) */
    document.documentElement.classList.add("td-run");
    phIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        phSeen = e.intersectionRatio;
        if (!demo && !e.isIntersecting && e.boundingClientRect.top < 0) document.documentElement.classList.remove("td-run");
        if (!demo && !seen()) tryStart();
        else if (demo) { pauseAll(document.hidden || phSeen < 0.2); document.documentElement.classList.toggle("td-run", phSeen >= 0.2); }
      });
    }, { threshold: [0, 0.2, 0.6, 0.9, 1] });
    phIO.observe(h);
    addEventListener("scroll", onScroll, { passive: true });
  }
  /* the phone was drawn again for the same task (language switch or new content) */
  function refresh(type) {
    cur.type = type;
    var replay = !!demo && !reduced();
    if (demo || withBusy) cancel();
    /* a language switch in the middle of the story plays it again, in the new language */
    if (replay) { try { sessionStorage.removeItem(key()); } catch (e) {} setPos(86, false); var h = ph(); if (h) h.classList.remove("td-split"); tryStart(); return; }
    if (rest) restFrame();
  }

  /* the visitor took the phone: a story that has not started yet never starts on this task */
  function hookPh() {
    var h = ph();
    if (!h || h.__tdHooked) return;
    h.__tdHooked = true;
    function took() { rest = false; document.documentElement.classList.remove("td-run"); if (cur) markSeen(); clearTimeout(waitT); waitT = 0; }
    h.addEventListener("pointerdown", function () { took(); cancel(); }, true);
    var k = document.getElementById("phKnob");
    if (k) k.addEventListener("keydown", function (e) { if (/^(Arrow|Home|End)/.test(e.key)) { took(); cancel(); } }, true);
    $$(".ph__lbl").forEach(function (l) { l.addEventListener("click", function () { took(); cancel(); }, true); });
  }

  document.addEventListener("visibilitychange", function () {
    if (demo || withBusy || live.length) pauseAll(document.hidden || (demo && phSeen < 0.2));
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
