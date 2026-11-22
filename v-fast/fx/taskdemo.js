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
  var REST = 50;   /* where the handle rests after the demo and under reduced motion (spec 3.4: 50%) */
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
      if (!seen()) { setPos(REST, false); lastPos = REST; markSeen(); }
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
