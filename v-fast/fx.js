/* v-fast motion modules, built from fx/*.js; edit those and rebuild */
/* ---- fx/hero.js ---- */
/* fx/hero.js: the pain-then-result picture next to the home headline.
   One customer message with its time (salon reply bot, from content.js through i18n), under it a
   short loss tag in the loss colour ("No reply until midnight"). Then one lime sweep turns the loss
   tag into the reply, and the picture holds there. Plays once, after the fonts, only while visible.
   Reduced motion: the final frame (message and reply), still.
   The markup (.hchat) is in index.html with data-i18n, so a language switch needs nothing here.
   This file only places it ([picture] [headline + question]) and runs the one story. */
(function () {
  "use strict";
  if (window.__fxHero) return;
  window.__fxHero = true;

  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }

  var h1 = document.querySelector(".hero h1");
  var pic = document.querySelector(".hero .hchat");
  if (!h1 || !pic || !h1.parentNode) return;

  /* ---------- layout: [picture] [headline + question]; on a phone: headline, picture, question ---------- */
  var ask = document.querySelector(".hero__ask");
  var row = document.createElement("div");
  row.className = "fxh";
  var txt = document.createElement("div");
  txt.className = "fxh__t";
  h1.parentNode.insertBefore(row, h1);
  row.appendChild(pic);
  row.appendChild(txt);
  txt.appendChild(h1);
  if (ask && ask.parentNode === row.parentNode) txt.appendChild(ask);

  var wait = pic.querySelector(".hchat__wait"), out = pic.querySelector(".hchat__out"), sweep = pic.querySelector(".hchat__sweep");
  var gsap = window.gsap;
  var tl = null, started = false, done = false, seen = false, io = null;

  function finalFrame() {
    if (tl) { tl.kill(); tl = null; }
    done = true;
    if (gsap) gsap.killTweensOf([wait, out, sweep]);
    [wait, out, sweep].forEach(function (e) { e.removeAttribute("style"); });
    pic.classList.remove("is-start");
    pic.classList.add("is-done");
    try { window.dispatchEvent(new CustomEvent("fx:hero", { detail: { done: true } })); } catch (e) {}
  }

  function build() {
    /* after the page has faded in (0.8s): 0.3s the tag appears, 1.3s it waits, 0.6s one sweep, then it holds */
    var t = gsap.timeline({ paused: true, onComplete: finalFrame });
    t.fromTo(wait, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0.8);
    t.set(sweep, { opacity: 1, left: "0%" }, 2.4);
    t.to(sweep, { left: "100%", duration: 0.6, ease: "power1.inOut" }, 2.4);
    t.fromTo(wait, { clipPath: "inset(0 0 0 0%)" }, { clipPath: "inset(0 0 0 100%)", duration: 0.6, ease: "power1.inOut" }, 2.4);
    t.fromTo(out, { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power1.inOut" }, 2.4);
    t.set(sweep, { opacity: 0 }, 3.0);
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

  /* first frame: the message alone, nothing below it yet */
  pic.classList.add("is-start");

  function arm() {
    if (done) return;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          seen = e.isIntersecting && e.intersectionRatio >= 0.6;
          if (seen) start();
          sync();
        });
      }, { threshold: [0, 0.6, 1] });
      io.observe(pic);
    } else { seen = true; start(); }
  }
  var fr = document.fonts && document.fonts.ready;
  if (fr && fr.then) fr.then(arm, arm); else arm();

  document.addEventListener("visibilitychange", sync);
  if (mq) {
    var onMq = function () { if (reduced()) finalFrame(); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }
  /* leaving home ends the story: back home, the final frame waits */
  window.addEventListener("vf:route", function () {
    var home = document.getElementById("home");
    if (home && home.hidden && started && !done) finalFrame();
  });
})();
;
/* ---- fx/glyphs.js ---- */
/* fx/glyphs.js: the advised card of a business page (#/for/<business>), the page's only motion.
   Every task card shows one short, still loss line (app.js paints it: .cc__ll with a loss span and
   a gain span). On the advised card (.cc--top) one story plays once:
     1. its label ("you lose most here") slides in (0.2s), alone;
     2. the loss line stays 1.5s;
     3. it crossfades (0.3s) into that task's gain line in lime, which stays.
   It plays when the card is at least 60% on screen. Seen once in this visit: the gain shows at once.
   Reduced motion: no slide, no crossfade, the loss line only (it is the reason to tap).
   The name stays "glyphs" (build order, window.FXGlyphs used by fx/retention). */
(function () {
  "use strict";
  var D = document, W = window;
  if (W.__fxGlyphs) return;
  W.__fxGlyphs = true;

  var LABEL_MS = 250, HOLD_MS = 1500;
  var mq = W.matchMedia ? W.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }

  if (!D.getElementById("fx-glyphs")) {
    var st = D.createElement("style");
    st.id = "fx-glyphs";
    st.textContent = [
      "@keyframes fxgTop{from{translate:0 -6px;opacity:0}to{translate:0 0;opacity:1}}",
      ".fxg-top-in .cc__top{animation:fxgTop .2s ease-out both}",
      /* until its story starts, the label of the advised card waits (no flash before the slide) */

      "@media (prefers-reduced-motion:reduce){.fxg-top-in .cc__top{animation:none}}"
    ].join("");
    D.head.appendChild(st);
  }

  var seen = {};  /* "niche/task" -> the story played in this visit */
  var cur = null; /* { card, key, io, t1, t2 } */

  function niche() { var m = location.hash.match(/^#\/for\/([a-z]+)$/); return m ? m[1] : null; }
  function keyOf(card) { var m = (card.getAttribute("href") || "").match(/^#\/for\/([a-z]+\/[a-z]+)$/); return m ? m[1] : null; }

  function stop() {
    if (!cur) return;
    if (cur.io) cur.io.disconnect();
    clearTimeout(cur.t1); clearTimeout(cur.t2);
    cur.card.classList.remove("fxg-top-in", "fxg-still");
    if (!seen[cur.key]) cur.card.classList.remove("is-gain");
    cur = null;
  }

  function play() {
    if (!cur || cur.started) return;
    cur.started = true;
    if (cur.io) cur.io.disconnect();
    var c = cur, card = c.card;
    var lab = card.querySelector(".cc__top");
    if (lab && lab.hasAttribute("data-fxrt-i18n")) card.classList.add("fxg-still"); /* fx/retention slides its own label */
    else { card.classList.remove("fxg-top-in"); void card.offsetWidth; card.classList.add("fxg-top-in"); }
    /* the label first, then the loss holds, then the change */
    c.t1 = setTimeout(function () {
      c.t2 = setTimeout(function () {
        if (cur !== c) return;
        card.classList.add("is-gain");
        seen[c.key] = 1;
        /* the story is over: the next motion (the assistant's arc, fx/fab.js) may start after the crossfade */
        setTimeout(function () { W.dispatchEvent(new Event("fx:biz")); }, 350);
      }, HOLD_MS);
    }, LABEL_MS);
  }

  function setup() {
    stop();
    var n = niche(); if (!n) return;
    var sec = D.getElementById("n-" + n);
    if (!sec || sec.hidden) return;
    /* a card that lost the label (fx/retention moved it) shows its loss again */
    [].forEach.call(sec.querySelectorAll(".cc.is-gain:not(.cc--top)"), function (c) { c.classList.remove("is-gain"); });
    var card = sec.querySelector(".cc--top"), key = card && keyOf(card);
    if (!card) return;
    var g = card.querySelector(".cc__ll-g");
    if (!key || !g || !g.textContent) { card.classList.add("fxg-still"); return; } /* nothing to change: the label just stays */
    if (reduced()) { card.classList.remove("is-gain"); return; }
    if (seen[key]) { card.classList.add("is-gain"); return; }
    card.classList.remove("is-gain");
    cur = { card: card, key: key, io: null, t1: 0, t2: 0, started: false };
    if ("IntersectionObserver" in W) {
      cur.io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio >= 0.6 && !D.hidden) play(); });
      }, { threshold: [0, 0.6, 1] });
      cur.io.observe(card);
    } else play();
  }

  var tm = 0;
  function later() { clearTimeout(tm); tm = setTimeout(setup, 60); } /* after the page has painted its cards */

  W.addEventListener("vf:route", function () { stop(); later(); });
  W.addEventListener("hashchange", function () { if (!niche()) stop(); });
  /* a hidden tab: start again when it is visible, so nobody misses the change */
  D.addEventListener("visibilitychange", function () {
    if (D.hidden && cur && cur.started && !seen[cur.key]) { setup(); return; }
    if (!D.hidden && cur && !cur.started) {
      var r = cur.card.getBoundingClientRect();
      if (r.height && r.top >= -r.height * 0.4 && r.bottom <= W.innerHeight + r.height * 0.4) play();
    }
  });
  if (mq) {
    var onRm = function () { if (niche()) setup(); };
    if (mq.addEventListener) mq.addEventListener("change", onRm); else if (mq.addListener) mq.addListener(onRm);
  }
  W.FXGlyphs = { setup: setup, kill: stop };
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
;
