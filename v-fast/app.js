(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LANGS = ["en", "de", "uk", "ru"];
  var D = window.I18N;
  var lang = "en";
  var timers = {};
  var resay = function () {};

  /* ---------- i18n ---------- */
  var originals = {};
  $$("[data-i18n]").forEach(function (el) { originals[el.dataset.i18n] = el.textContent; });
  $$("[data-i18n-html]").forEach(function (el) { originals[el.dataset.i18nHtml] = el.innerHTML; });
  $$("[data-i18n-aria]").forEach(function (el) { originals[el.dataset.i18nAria] = el.getAttribute("aria-label"); });

  function t(key) {
    var v = D[lang] && D[lang][key];
    if (v == null) v = D.en[key];
    if (v == null) v = originals[key];
    return v;
  }

  function pickLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (LANGS.indexOf(q) > -1) return q;
    try {
      var s = localStorage.getItem("lang");
      if (LANGS.indexOf(s) > -1) return s;
    } catch (e) {}
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.indexOf(n) > -1 ? n : "en";
  }

  function setLang(next, persist) {
    lang = next;
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    var md = $('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.desc"));
    var canon = $('link[rel="canonical"]');
    if (canon) canon.href = "https://m1hamuha.github.io/portfolio/v-fast/" + (lang === "en" ? "" : "?lang=" + lang);
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    if (persist) {
      try { localStorage.setItem("lang", lang); } catch (e) {}
      var u = new URL(location.href);
      if (lang === "en") u.searchParams.delete("lang"); else u.searchParams.set("lang", lang);
      history.replaceState(null, "", u);
    }
    resay();
    buildMarquee();
    buildFlow(flowIdx);
    startChat();
  }

  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang, true); });
  });

  /* ---------- nav ---------- */
  var nav = $("#nav"), burger = $(".burger");
  function closeMenu() { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$("#menu a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("pointerdown", function (e) { if (!nav.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  $$(".rv").forEach(function (el) { io.observe(el); });

  /* Run a looping demo only while it is on screen. */
  function whenVisible(el, start, stop) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.2 }).observe(el);
  }

  /* ---------- hero: phone stories + parallax ---------- */
  (function () {
    var imgs = $$("#slides img"), bars = $$("#slides .phone__bars span"), i = 0;
    function show(n) {
      i = n % imgs.length;
      imgs.forEach(function (im, k) { im.classList.toggle("on", k === i); });
      bars.forEach(function (b, k) {
        b.classList.remove("on", "done");
        if (k < i) b.classList.add("done");
      });
      void bars[i].offsetWidth;
      bars[i].classList.add("on");
    }
    if (reduce) { bars[0].classList.add("done"); return; }
    show(0);
    whenVisible($("#stage"),
      function () { clearInterval(timers.slides); timers.slides = setInterval(function () { show(i + 1); }, 3200); },
      function () { clearInterval(timers.slides); });

    var stage = $("#stage");
    if (window.matchMedia("(hover: hover)").matches) {
      window.addEventListener("pointermove", function (e) {
        stage.style.setProperty("--mx", (e.clientX / innerWidth - 0.5).toFixed(3));
        stage.style.setProperty("--my", (e.clientY / innerHeight - 0.5).toFixed(3));
      }, { passive: true });
    }
  })();

  /* ---------- marquee ---------- */
  function buildMarquee() {
    var items = t("marquee"), html = "";
    for (var r = 0; r < 4; r++) items.forEach(function (s) { html += "<span>" + s + "</span>"; });
    $("#marquee").innerHTML = html;
  }

  /* ---------- content calendar ---------- */
  (function () {
    var grid = $("#cal"), count = $("#calCount");
    var pics = ["serum.webp", "after-1.webp", "coffee.webp", "after-3.webp", "perfume.webp", "after-4.webp", "cream.webp", "after-2.webp"];
    var order = [0, 2, 4, 1, 7, 9, 3, 11, 5, 13, 6, 8, 10, 12];
    for (var d = 0; d < 14; d++) {
      var c = document.createElement("div");
      c.className = "cal__cell";
      c.dataset.d = d + 1;
      c.innerHTML = '<img src="./img/' + pics[d % pics.length] + '" alt="" loading="lazy" width="80" height="106">';
      grid.appendChild(c);
    }
    var cells = $$(".cal__cell", grid), n = 0;
    function paint() { count.textContent = n + " / 14"; }
    function fillAll() { cells.forEach(function (c) { c.classList.add("on"); }); n = 14; paint(); }
    if (reduce) { fillAll(); return; }
    function tick() {
      if (n >= 14) {
        timers.cal = setTimeout(function () {
          cells.forEach(function (c) { c.classList.remove("on"); });
          n = 0; paint();
          timers.cal = setTimeout(tick, 700);
        }, 2600);
        return;
      }
      cells[order[n]].classList.add("on");
      n++; paint();
      timers.cal = setTimeout(tick, 380);
    }
    whenVisible(grid, function () { clearTimeout(timers.cal); tick(); }, function () { clearTimeout(timers.cal); });
  })();

  /* ---------- chat ---------- */
  var chatVisible = false;
  function bubble(kind, text) {
    var b = document.createElement("div");
    b.className = "bub bub--" + kind;
    b.textContent = text;
    return b;
  }
  function startChat() {
    var box = $("#chat"), script = t("chat");
    clearTimeout(timers.chat);
    box.innerHTML = "";
    box.style.minHeight = "";
    script.forEach(function (m) { box.appendChild(bubble(m[0], m[1])); });
    if (reduce || !chatVisible) return;
    /* Reserve the height of the full conversation so the loop never moves the page. */
    box.style.minHeight = box.offsetHeight + "px";
    box.innerHTML = "";
    var i = 0;
    (function next() {
      if (i >= script.length) { timers.chat = setTimeout(startChat, 3600); return; }
      var m = script[i++];
      if (m[0] === "b") {
        var typing = document.createElement("div");
        typing.className = "bub bub--b bub--t";
        typing.innerHTML = "<i></i><i></i><i></i>";
        box.appendChild(typing);
        timers.chat = setTimeout(function () {
          box.replaceChild(bubble("b", m[1]), typing);
          timers.chat = setTimeout(next, 1100);
        }, 1000);
      } else {
        box.appendChild(bubble("u", m[1]));
        timers.chat = setTimeout(next, 800);
      }
    })();
  }
  whenVisible($("#chat"),
    function () { chatVisible = true; startChat(); },
    function () { chatVisible = false; clearTimeout(timers.chat); });

  /* ---------- terminal ---------- */
  (function () {
    var box = $("#term");
    var lines = [
      ["cmd", "$ run weekly-report"],
      ["ok", "✓ 1 284 orders loaded"],
      ["ok", "✓ 37 margin leaks flagged"],
      ["ok", "✓ report.pdf → Telegram"],
      ["dim", "done in 3.2s · next run: Mon 08:00"],
    ];
    function line(cls, text) { var d = document.createElement("div"); d.className = cls; d.textContent = text; box.appendChild(d); return d; }
    function all() { box.innerHTML = ""; lines.forEach(function (l) { line(l[0], l[1]); }); }
    if (reduce) { all(); return; }
    function run() {
      box.innerHTML = "";
      var el = line("cmd cur", ""), cmd = lines[0][1], k = 0;
      (function type() {
        el.textContent = cmd.slice(0, ++k);
        if (k < cmd.length) { timers.term = setTimeout(type, 55); return; }
        el.classList.remove("cur");
        var i = 1;
        (function out() {
          if (i >= lines.length) { timers.term = setTimeout(run, 3800); return; }
          line(lines[i][0], lines[i][1]); i++;
          timers.term = setTimeout(out, 520);
        })();
      })();
    }
    whenVisible(box, function () { clearTimeout(timers.term); run(); }, function () { clearTimeout(timers.term); });
  })();

  /* ---------- before / after ---------- */
  (function () {
    var cmp = $("#cmp"), range = $("input", cmp), before = $("#cmpBefore"), after = $("#cmpAfter");
    function set(v) { cmp.style.setProperty("--pos", v + "%"); }
    range.addEventListener("input", function () { set(range.value); });
    $$("#thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("#thumbs button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        before.src = "./img/before-" + b.dataset.n + ".webp";
        after.src = "./img/after-" + b.dataset.n + ".webp";
        range.value = 50; set(50);
      });
    });
    /* One gentle nudge the first time it scrolls into view, so it reads as draggable. */
    if (reduce) return;
    var nudged = false;
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting || nudged) return;
      nudged = true; o.disconnect();
      var t0 = performance.now();
      (function frame(now) {
        var p = Math.min((now - t0) / 1600, 1);
        var v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p * 0.3);
        if (document.activeElement !== range) { range.value = v; set(v); }
        if (p < 1) requestAnimationFrame(frame); else { range.value = 50; set(50); }
      })(t0);
    }, { threshold: 0.5 }).observe(cmp);
  })();

  /* ---------- reel video: load + play only when visible ---------- */
  (function () {
    var v = $("#reel");
    v.controls = reduce;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else { v.pause(); }
      });
    }, { threshold: 0.25 }).observe(v);
  })();

  /* ---------- flow picker ---------- */
  var flowIdx = 0;
  var FLOW_ICONS = [
    ["i-msg", "i-bot", "i-cal"],
    ["i-img", "i-spark", "i-send"],
    ["i-file", "i-bot", "i-check"],
    ["i-chart", "i-code", "i-send"],
    ["i-x", "i-spark", "i-user"],
    ["i-img", "i-spark", "i-card"],
  ];
  function ico(id) { return '<svg class="ico"><use href="#' + id + '"/></svg>'; }
  function buildFlow(idx) {
    flowIdx = idx;
    var flows = t("flows"), labels = t("flowLabels"), chips = $("#chips"), flow = $("#flow");
    /* Build the chips once and only relabel afterwards, so the pressed chip keeps keyboard focus. */
    if (chips.children.length !== flows.length) {
      chips.innerHTML = "";
      flows.forEach(function (f, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.innerHTML = ico(FLOW_ICONS[i][0]) + "<span></span>";
        b.addEventListener("click", function () { buildFlow(i); });
        chips.appendChild(b);
      });
    }
    $$("button", chips).forEach(function (b, i) {
      b.setAttribute("aria-pressed", String(i === idx));
      b.lastChild.textContent = flows[i].chip;
    });
    var html = "";
    flows[idx].steps.forEach(function (s, i) {
      if (i) html += '<div class="wire" aria-hidden="true"></div>';
      html += '<div class="node node--' + i + '"><span class="node__ico">' + ico(FLOW_ICONS[idx][i]) + "</span><div><small>" + labels[i] + "</small><b>" + s + "</b></div></div>";
    });
    flow.innerHTML = html;
  }

  /* ---------- contact form ---------- */
  (function () {
    var form = $("#form"), msg = $("#formMsg"), btn = $("button[type=submit]", form), busy = false;
    var ENDPOINT = "https://formsubmit.co/ajax/kostinmihail40@gmail.com";
    var last = null;
    resay = function () { if (last) say(last[0], last[1], last[2]); };
    function say(kind, key, withMail) {
      last = [kind, key, withMail];
      msg.hidden = false;
      msg.className = "form__msg " + kind;
      msg.textContent = t(key);
      if (withMail) {
        var a = document.createElement("a");
        a.href = "mailto:kostinmihail40@gmail.com";
        a.textContent = "kostinmihail40@gmail.com";
        msg.appendChild(document.createTextNode(" "));
        msg.appendChild(a);
      }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var f = new FormData(form);
      var name = String(f.get("name") || "").trim(), email = String(f.get("email") || "").trim(), message = String(f.get("message") || "").trim();
      if (String(f.get("_honey") || "").trim()) { say("ok", "fm.ok"); form.reset(); return; }
      var bad = !name ? "name" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "email" : !message ? "message" : "";
      if (bad) { say("err", "fm.invalid"); $('[name="' + bad + '"]', form).focus(); return; }
      busy = true; btn.disabled = true; say("ok", "fm.sending");
      var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 15000);
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: ctl.signal,
        body: JSON.stringify({
          name: name, email: email, message: message, _replyto: email,
          _subject: "New portfolio request — Kostin Automation", _template: "table",
          source: "portfolio-contact", language: lang, page: location.origin + location.pathname,
        }),
      })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (j) {
          if (j && String(j.success) === "false") throw new Error("rejected");
          say("ok", "fm.ok"); form.reset();
        })
        .catch(function () { say("err", "fm.err", true); })
        .then(function () { clearTimeout(to); busy = false; btn.disabled = false; });
    });
  })();

  setLang(pickLang(), false);
})();
