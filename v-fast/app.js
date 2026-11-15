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
  var relocWall = function () {};

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
    relocWall();
    startChat();
    startTerm();
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
     The slider sweeps by itself and steps through the photo pairs until the
     visitor touches it; from then on it is theirs. */
  (function () {
    var cmp = $("#cmp"), range = $("input", cmp), before = $("#cmpBefore"), after = $("#cmpAfter");
    var PAIRS = ["can", "candle", "sneaker"];
    var touched = false, pair = 0, t0 = 0;
    function set(v) { cmp.style.setProperty("--pos", v + "%"); }
    function stop() { touched = true; clearTimeout(timers.cmp); }
    range.addEventListener("input", function () { stop(); set(range.value); });
    range.addEventListener("pointerdown", stop);
    range.addEventListener("keydown", stop);
    if (reduce) return;
    for (var i = 1; i < PAIRS.length; i++) { new Image().src = "./img/pair-" + PAIRS[i] + "-before.webp"; new Image().src = "./img/pair-" + PAIRS[i] + "-after.webp"; }

    function sweep(now) {
      if (touched) return;
      if (!t0) t0 = now;
      var p = Math.min((now - t0) / 3600, 1);
      /* 50 → 25 → 75 → 50: show more of the "after" side, then more of the "before" side. */
      var v = 50 - 25 * Math.sin(p * Math.PI * 2);
      range.value = v; set(v);
      if (p < 1) { requestAnimationFrame(sweep); return; }
      timers.cmp = setTimeout(next, 900);
    }
    function next() {
      if (touched) return;
      pair = (pair + 1) % PAIRS.length;
      before.src = "./img/pair-" + PAIRS[pair] + "-before.webp";
      after.src = "./img/pair-" + PAIRS[pair] + "-after.webp";
      t0 = 0;
      timers.cmp = setTimeout(function () { requestAnimationFrame(sweep); }, 700);
    }
    timers.cmp = setTimeout(function () { requestAnimationFrame(sweep); }, 1200);
  })();

  /* ---------- content calendar ---------- */
  (function () {
    var grid = $("#cal");
    var pics = ["t-01.webp", "t-02.webp", "t-03.webp", "t-04.webp", "t-05.webp", "t-09.webp", "t-12.webp", "t-08.webp"];
    var order = [0, 2, 4, 1, 7, 9, 3, 11, 5, 13, 6, 8, 10, 12];
    for (var d = 0; d < 14; d++) {
      var c = document.createElement("div");
      c.className = "cal__cell";
      c.innerHTML = '<img src="./img/' + pics[d % pics.length] + '" alt="" loading="lazy" width="150" height="200">';
      grid.appendChild(c);
    }
    var cells = $$(".cal__cell", grid), n = 0;
    if (reduce) { cells.forEach(function (c) { c.classList.add("on"); }); return; }
    function tick() {
      if (n >= 14) {
        timers.cal = setTimeout(function () {
          cells.forEach(function (c) { c.classList.remove("on"); });
          n = 0;
          timers.cal = setTimeout(tick, 700);
        }, 2600);
        return;
      }
      cells[order[n]].classList.add("on");
      n++;
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

  /* ---------- "terminal": a short job report typed out in the visitor's language ---------- */
  var termVisible = false;
  function startTerm() {
    var box = $("#term"), lines = t("term");
    clearTimeout(timers.term);
    function line(cls, text) { var d = document.createElement("div"); d.className = cls; d.textContent = text; box.appendChild(d); return d; }
    box.innerHTML = "";
    if (reduce || !termVisible) { lines.forEach(function (l) { line(l[0], l[1]); }); return; }
    var el = line("cmd cur", ""), cmd = lines[0][1], k = 0;
    (function type() {
      el.textContent = cmd.slice(0, ++k);
      if (k < cmd.length) { timers.term = setTimeout(type, 55); return; }
      el.classList.remove("cur");
      var i = 1;
      (function out() {
        if (i >= lines.length) { timers.term = setTimeout(startTerm, 3800); return; }
        line(lines[i][0], lines[i][1]); i++;
        timers.term = setTimeout(out, 520);
      })();
    })();
  }
  whenVisible($("#term"),
    function () { termVisible = true; startTerm(); },
    function () { termVisible = false; clearTimeout(timers.term); });

  /* ---------- work: endless strips of images moving in opposite directions ----------
     Pictures 7-12 carry a short caption, rendered once per language, so they follow the language switch. */
  (function () {
    var wall = $("#wall");
    var sets = [[1, 7, 5, 10], [8, 6, 2, 11], [3, 9, 4, 12]];
    function url(n) { return "./img/wall-" + (n < 10 ? "0" + n : n) + (n >= 7 ? "-" + lang : "") + ".webp"; }
    sets.forEach(function (set) {
      var col = document.createElement("div"), track = document.createElement("div"), html = "";
      col.className = "wall__col"; track.className = "wall__track";
      for (var r = 0; r < 2; r++) set.forEach(function (n) { html += '<img data-n="' + n + '" src="' + url(n) + '" alt="" loading="lazy" width="900" height="1200">'; });
      track.innerHTML = html; col.appendChild(track); wall.appendChild(col);
    });
    relocWall = function () {
      $$("#wall img").forEach(function (im) {
        var n = +im.dataset.n;
        if (n >= 7 && im.getAttribute("src") !== url(n)) im.src = url(n);
      });
    };
  })();

  /* ---------- reel: three short videos in a row, like stories ----------
     Plays only while on screen; a tap or click jumps to the next one. */
  (function () {
    var v = $("#reel"), bars = $$(".reel__bars span"), next = $(".reel__next"), N = bars.length, cur = 0, started = false;
    if (reduce) { v.controls = true; next.hidden = true; $(".reel__bars").hidden = true; return; }
    v.controls = false;
    function paint(p) { bars.forEach(function (b, k) { b.style.setProperty("--p", k < cur ? 1 : k === cur ? p : 0); }); }
    function play() { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    function show(i) {
      cur = i % N;
      v.poster = "./img/reel-" + (cur + 1) + "-poster.jpg";
      v.src = "./img/reel-" + (cur + 1) + ".mp4";
      v.load();
      paint(0);
      play();
    }
    v.addEventListener("timeupdate", function () { if (v.duration) paint(v.currentTime / v.duration); });
    v.addEventListener("ended", function () { show(cur + 1); });
    next.addEventListener("click", function () { show(cur + 1); });
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) { v.pause(); return; }
        if (started) play(); else { started = true; show(0); }
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
