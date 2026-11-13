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
    startChat();
  }

  $$(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.dataset.lang, true); });
  });

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

  /* ---------- hero: before / after ----------
     The slider sweeps by itself and steps through the four pairs until the
     visitor touches it; from then on it is theirs. */
  (function () {
    var cmp = $("#cmp"), range = $("input", cmp), before = $("#cmpBefore"), after = $("#cmpAfter");
    var touched = false, pair = 1, t0 = 0;
    function set(v) { cmp.style.setProperty("--pos", v + "%"); }
    function stop() { touched = true; clearTimeout(timers.cmp); }
    range.addEventListener("input", function () { stop(); set(range.value); });
    range.addEventListener("pointerdown", stop);
    range.addEventListener("keydown", stop);
    if (reduce) return;
    for (var i = 2; i <= 4; i++) { new Image().src = "./img/before-" + i + ".webp"; new Image().src = "./img/after-" + i + ".webp"; }

    function sweep(now) {
      if (touched) return;
      if (!t0) t0 = now;
      var p = Math.min((now - t0) / 3600, 1);
      /* 50 → 12 → 88 → 50: show the "after" side, then the "before" side. */
      var v = 50 - 38 * Math.sin(p * Math.PI * 2);
      range.value = v; set(v);
      if (p < 1) { requestAnimationFrame(sweep); return; }
      timers.cmp = setTimeout(next, 900);
    }
    function next() {
      if (touched) return;
      pair = pair % 4 + 1;
      cmp.classList.add("swap");
      timers.cmp = setTimeout(function () {
        before.src = "./img/before-" + pair + ".webp";
        after.src = "./img/after-" + pair + ".webp";
        cmp.classList.remove("swap");
        t0 = 0;
        timers.cmp = setTimeout(function () { requestAnimationFrame(sweep); }, 500);
      }, 450);
    }
    timers.cmp = setTimeout(function () { requestAnimationFrame(sweep); }, 1200);
  })();

  /* ---------- content calendar ---------- */
  (function () {
    var grid = $("#cal"), count = $("#calCount");
    var pics = ["serum.webp", "after-1.webp", "coffee.webp", "after-3.webp", "perfume.webp", "after-4.webp", "cream.webp", "after-2.webp"];
    var order = [0, 2, 4, 1, 7, 9, 3, 11, 5, 13, 6, 8, 10, 12];
    for (var d = 0; d < 14; d++) {
      var c = document.createElement("div");
      c.className = "cal__cell";
      c.innerHTML = '<img src="./img/' + pics[d % pics.length] + '" alt="" loading="lazy" width="80" height="106">';
      grid.appendChild(c);
    }
    var cells = $$(".cal__cell", grid), n = 0;
    function paint() { count.textContent = n + " / 14"; }
    if (reduce) { cells.forEach(function (c) { c.classList.add("on"); }); n = 14; paint(); return; }
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
      ["dim", "done in 3.2s"],
    ];
    function line(cls, text) { var d = document.createElement("div"); d.className = cls; d.textContent = text; box.appendChild(d); return d; }
    if (reduce) { lines.forEach(function (l) { line(l[0], l[1]); }); return; }
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

  /* ---------- work: endless strips of images moving in opposite directions ---------- */
  (function () {
    var wall = $("#wall");
    var sets = [["coffee", "after-2", "perfume", "after-4"], ["after-3", "cream", "after-1", "serum"], ["perfume", "after-4", "coffee", "after-2"]];
    sets.forEach(function (set) {
      var col = document.createElement("div"), track = document.createElement("div"), html = "";
      col.className = "wall__col"; track.className = "wall__track";
      for (var r = 0; r < 2; r++) set.forEach(function (n) { html += '<img src="./img/' + n + '.webp" alt="" loading="lazy" width="300" height="400">'; });
      track.innerHTML = html; col.appendChild(track); wall.appendChild(col);
    });
  })();

  /* ---------- reel: play only while visible ---------- */
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
