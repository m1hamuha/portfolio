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
  var refillL3 = function () {};
  var repaintCards = function () {};
  var relocWall = function () {};
  var PAIRS = ["can", "candle", "sneaker"];

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
    if (window.firmLadRepaint) window.firmLadRepaint();
    if (window.firmExRepaint) window.firmExRepaint();
    $$("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-aria]").forEach(function (el) { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.dataset.i18nPh)); });
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === lang)); });
    if (persist) {
      try { localStorage.setItem("lang", lang); } catch (e) {}
      var u = new URL(location.href);
      if (lang === "en") u.searchParams.delete("lang"); else u.searchParams.set("lang", lang);
      history.replaceState(null, "", u);
    }
    resay();
    refillL3();
    repaintCards();
    relocWall();
    paintOrder();
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

  /* ---------- photo page: before / after ----------
     The slider sweeps by itself and steps through the photo pairs until the
     visitor touches it; from then on it is theirs. It starts when it comes into view. */
  (function () {
    var cmp = $("#cmp"), range = $("input", cmp), before = $("#cmpBefore"), after = $("#cmpAfter");
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
    var started = false;
    whenVisible(cmp, function () {
      if (started) return;
      started = true;
      timers.cmp = setTimeout(function () { requestAnimationFrame(sweep); }, 900);
    }, function () {});
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
      if (kind !== "ok" && msg.scrollIntoView) setTimeout(function () { msg.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 50);
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
          _subject: "New portfolio request: Kostin Automation", _template: "table",
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

  /* ---------- messengers and the chosen offer ----------
     Tapping "Order" on a page or a price card remembers what was chosen, shows it
     next to the messenger buttons and prefills the WhatsApp text and the form. */
  var WA = "https://wa.me/491709094298";
  var ctxNiche = null;
  var order = null, lastAuto = "", TG = "https://t.me/onomamichail";
  /* id -> [name key, "from" prefix?, amount] ; plans are named under social media */
  var ORD = {
    social: ["sv.social.h", 1, "€10"], bot: ["sv.bot.h", 1, "€79"], content: ["sv.content.h", 1, "€1"],
    reports: ["sv.reports.h", 1, "€19"], docs: ["sv.docs.h", 1, "€19"], reviews: ["sv.reviews.h", 1, "€15"],
    data: ["sv.data.h", 1, "€29"], site: ["sv.site.h", 1, "€29"], leads: ["sv.leads.h", 1, "€29"], mail: ["sv.mail.h", 1, "€19"],
    translate: ["sv.translate.h", 1, "€5"], assistant: ["sv.assistant.h", 1, "€49"], hiring: ["sv.hiring.h", 1, "€15"], custom: ["sv.custom.h", 0, ""], firm: ["firm.order", 1, "€300"], firmtry: ["firm.lad.1", 1, "€49"], firmsetup: ["firm.setup", 1, "€300"], firmcare: ["firm.lad.3", 1, "€99"],
    photo: ["pm.photo", 0, "€1"], video: ["pm.video", 1, "€8"],
    plan1: ["pl.1", 0, "€10 " ], plan2: ["pl.2", 0, "€25 "], plan3: ["pl.3", 0, "€40 "]
  };
  function labelFor(id) {
    var o = ORD[id], name = t(o[0]);
    var isFirm = id.indexOf("firm") === 0, pre = ctxNiche && !isFirm ? t("n." + ctxNiche) + ": " : "";
    var nb = function (x) { return x.replace(/ /g, " "); };
    /* company offers never take a business prefix; a picked price step is named after the offer */
    if (isFirm) return id === "firm" ? name : t("firm.order") + ": " + name;
    if (id.indexOf("plan") === 0) return pre + t("sv.social.h") + ", " + name + ": " + nb(o[2] + t("pr.mo"));
    return pre + (o[2] ? name + ": " + nb((o[1] ? t("pr.from") + " " : "") + o[2]) : name);
  }
  function fitTa(ta) { if (!ta || !ta.offsetParent) return; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 4, 260) + "px"; }
  function paintOrder() {
    var box = $("#order"), lab = $("#orderLabel"), ta = $('#form [name="message"]');
    lab.textContent = order ? labelFor(order) : "";
    box.hidden = !order;
    var auto = order ? (order.indexOf("firm") === 0 ? t("firm.talk") : t("wa.order")) + lab.textContent : "";
    if (ta.value.indexOf(lastAuto) === 0) ta.value = auto + ta.value.slice(lastAuto.length);
    lastAuto = auto;
    var text = order ? auto : t("wa.hero");
    $$("[data-wa]").forEach(function (a) { a.href = WA + "?text=" + encodeURIComponent(text); });
    $$('a[href^="' + TG + '"]').forEach(function (a) { a.href = TG + (order ? "?text=" + encodeURIComponent(auto) : ""); });
    fitTa(ta);
  }
  $('#form [name="message"]').addEventListener("input", function () { fitTa(this); });
  var orderAt = null; /* the page the order was made on: coming back to it keeps the choice */
  $$("[data-order]").forEach(function (el) { el.addEventListener("click", function () { order = el.dataset.order; orderAt = location.hash; paintOrder(); }); });
  $("#orderClear").addEventListener("click", function () { order = null; paintOrder(); });

  /* ---------- company page: six pictures, the whole list opens under "Full list" ---------- */
  /* company page: price steps. Pick one, the ball hops onto it and the button below names it. */
  (function () {
    var lad = $("#firmLad"), go = $("#firmLadGo");
    if (!lad || !go) return;
    var steps = $$(".firm-lad__s", lad), ball = $(".firm-lad__ball", lad), name = $("#firmLadName"), cur = steps[0];
    function place() {
      if (!lad.offsetParent) { ball.classList.remove("is-on"); return; }
    var phone = window.matchMedia("(max-width: 760px)").matches;
      ball.style.left = (phone ? cur.offsetLeft + cur.offsetWidth - 6 : cur.offsetLeft + cur.offsetWidth / 2) + "px";
      ball.style.top = cur.offsetTop + "px";
      ball.classList.add("is-on");
    }
    function pick(b) {
      cur = b;
      steps.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      go.dataset.order = b.dataset.pick;
      name.textContent = $(".firm-lad__n", b).textContent + ", " + $(".firm-lad__p", b).textContent.replace(/\s+/g, "\u00a0").trim();
      place();
    }
    steps.forEach(function (b) { b.addEventListener("click", function () { pick(b); }); });
    window.addEventListener("resize", place);
    window.addEventListener("hashchange", function () { setTimeout(place, 60); });
    /* the page can open on another route and show later: place the ball once it has a real size */
    if ("ResizeObserver" in window) new ResizeObserver(place).observe(lad);
    pick(cur);
    window.firmLadRepaint = function () { pick(cur); };
  })();

  /* company page: several examples in one window. The bar under the card names the next one and flips to it. */
  (function () {
    var ex = $("#firmEx");
    if (!ex) return;
    var panels = $$(".firm-ex__view > .firm-log", ex), cur = 0, timers = [], seen = {};
    var nName = $("#firmExNextName");
    function light(p) {
      timers.forEach(clearTimeout); timers = [];
      if (!p.classList.contains("firm-log--ex")) return;
      var rows = $$(".firm-log__list li", p);
      if (seen[p.id] || reduce) { rows.forEach(function (r) { r.classList.add("is-on"); }); return; }
      seen[p.id] = 1;
      rows.forEach(function (r, i) { timers.push(setTimeout(function () { r.classList.add("is-on"); }, 250 + i * 160)); });
    }
    function bar() {
      var nx = (cur + 1) % panels.length, p = panels[nx];
      nName.textContent = $(".firm-log__head b", p).textContent;
    }
    function go(n) {
      n = (n + panels.length) % panels.length;
      ex.classList.add("is-used");
      if (n === cur) return;
      var down = n === (cur + 1) % panels.length;
      panels.forEach(function (p, i) {
        p.classList.toggle("is-cur", i === n); p.inert = i !== n;
        /* the card that leaves goes the way the visitor pushed it; the others wait on the side they will come from */
        p.dataset.pos = i === n ? "" : i === cur ? (down ? "above" : "below") : (down ? "below" : "above");
      });
      cur = n; light(panels[n]); bar();
    }
    panels.forEach(function (p, i) { if (p.classList.contains("firm-log--ex")) p.classList.add("is-live"); p.inert = i !== 0; });
    $("#firmExNext").addEventListener("click", function () { go(cur + 1); });
    $("#firmExPrev").addEventListener("click", function () { go(cur - 1); });
    $$(".firm-log__n", ex).forEach(function (b) { b.addEventListener("click", function () {
        go(cur + 1);
        /* keep the keyboard on the same control of the new card; if it cannot take focus yet, use the bar */
        var nb = $(".firm-log__n", panels[cur]);
        requestAnimationFrame(function () { nb.focus({ preventScroll: true }); if (document.activeElement !== nb) $("#firmExNext").focus({ preventScroll: true }); });
      }); });
    bar();
    window.firmExRepaint = bar;
  })();

  /* company page: the night is a slider. Drag the sun and the morning numbers grow. */
  (function () {
    var sky = $(".firm-log__sky"), inp = $("#firmNight");
    if (!sky || !inp) return;
    var fig = sky.closest(".firm-log"), knob = $(".firm-night__knob", sky), clip = $("#firmNightClip rect"), clock = $("#firmClock");
    var rows = $$(".firm-log__list li[data-n]", fig), done = $(".firm-log__done", fig), raf = 0, touched = false, wait = 0, val = 100;
    function bx(u) { var m = 1 - u; return 24 * m * m * m + 300 * u * m * m + 900 * u * u * m + 376 * u * u * u; }
    function by(u) { var m = 1 - u; return 78 * m * m * m - 18 * u * m * m - 18 * u * u * m + 78 * u * u * u; }
    function paint(v) {
      v = Math.max(0, Math.min(100, v));
      var x = 24 + 3.52 * v, lo = 0, hi = 1, u = 0.5;
      for (var i = 0; i < 20; i++) { u = (lo + hi) / 2; if (bx(u) < x) lo = u; else hi = u; }
      knob.setAttribute("transform", "translate(" + x.toFixed(1) + " " + by(u).toFixed(1) + ")");
      clip.setAttribute("width", x.toFixed(1));
      var min = (18 * 60 + Math.round(v * 0.84) * 10) % 1440, txt = ("0" + Math.floor(min / 60)).slice(-2) + ":" + ("0" + (min % 60)).slice(-2);
      clock.textContent = txt; inp.setAttribute("aria-valuetext", txt);
      rows.forEach(function (li) {
        var n = +li.dataset.n, on = v >= +li.dataset.at;
        /* only the big number counts up; "1 report" must never read as half a report */
        if (n > 9) { n = Math.round(n * Math.min(1, v / +li.dataset.at)); on = n > 0; }
        $("b", li).textContent = n; li.classList.toggle("is-on", on);
      });
      done.classList.toggle("is-on", v >= 99);
    }
    function set(v) { val = Math.max(0, Math.min(100, v)); inp.value = val; paint(val); }
    function stop() { cancelAnimationFrame(raf); raf = 0; clearTimeout(wait); if (!touched) { touched = true; fig.classList.add("is-touched"); } }
    /* the night keeps going: from wherever the sun is, on to the morning */
    function play(from) {
      var t0 = 0, span = (100 - from) * 42;
      cancelAnimationFrame(raf);
      if (reduce || span <= 0) return;
      raf = requestAnimationFrame(function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / span);
        set(from + (100 - from) * p);
        raf = p < 1 ? requestAnimationFrame(step) : 0;
      });
    }
    function resume() { clearTimeout(wait); wait = setTimeout(function () { play(val); }, 900); }
    function at(e) { var r = sky.getBoundingClientRect(); return ((e.clientX - r.left) / r.width * 400 - 24) / 3.52; }
    sky.addEventListener("pointerdown", function (e) { stop(); sky.classList.add("is-drag"); try { sky.setPointerCapture(e.pointerId); } catch (x) {} set(at(e)); });
    sky.addEventListener("pointermove", function (e) { if (sky.classList.contains("is-drag")) set(at(e)); });
    ["pointerup", "pointercancel"].forEach(function (k) { sky.addEventListener(k, function () { if (sky.classList.contains("is-drag")) { sky.classList.remove("is-drag"); resume(); } }); });
    inp.addEventListener("input", function () { stop(); val = +inp.value; paint(val); });
    inp.addEventListener("focus", function () { if (inp.matches(":focus-visible")) sky.classList.add("is-focus"); });
    inp.addEventListener("blur", function () { sky.classList.remove("is-focus"); if (touched) resume(); });
    fig.classList.add("is-live");
    if (reduce || !("IntersectionObserver" in window)) { paint(100); return; }
    set(0);
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      if (!touched) play(0);
    }, { threshold: 0.5 });
    io.observe(sky);
  })();

  (function () {
    var more = $("#firmMore"), full = $("#firmFull");
    if (!more || !full) return;
    var hitT = 0;
    /* the picked category glows, then lets go slowly once the visitor has had time to find it */
    function hit(el) {
      $$(".firm-fc.is-hit").forEach(function (x) { x.classList.remove("is-hit"); });
      el.classList.add("is-hit"); clearTimeout(hitT);
      hitT = setTimeout(function () { el.classList.remove("is-hit"); }, 5200);
    }
    function open(on, to) {
      full.hidden = !on; more.setAttribute("aria-expanded", String(on));
      var el = on && to ? $("#fc-" + to) : null;
      if (el) { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); el.focus({ preventScroll: true }); hit(el); }
    }
    more.addEventListener("click", function () { open(full.hidden); });
    $("#firmLess").addEventListener("click", function () { open(false); more.focus({ preventScroll: true }); more.scrollIntoView({ behavior: "auto", block: "center" }); });
    $$(".firm-cat").forEach(function (b) { b.addEventListener("click", function () { open(true, b.dataset.cat); }); });
  })();

  /* phone only: a bar with both messengers appears once the first button has scrolled away */
  (function () {
    var dock = $("#dock"), first = $(".hero__cta"), contact = $("#contact"), away = false, inContact = false;
    if (!dock || !first || !contact) return;
    function sync() { dock.classList.toggle("on", away && !inContact); }
    new IntersectionObserver(function (es) { away = !es[0].isIntersecting; sync(); }).observe(first);
    new IntersectionObserver(function (es) { inContact = es[0].isIntersecting; sync(); }, { threshold: 0.1 }).observe(contact);
  })();

  /* ---------- 3D carousels ----------
     The carousel keeps its own position (an index and a pixel offset) and moves the track with a
     transform. It does not use the browser's scrolling at all, so it behaves the same in every
     browser. Arrows, dots, keyboard, wheel, mouse drag and touch swipe all change the same index. */
  $$("[data-car]").forEach(function (car) {
    var track = $(".car__track", car), prev = $(".car__btn--prev", car), next = $(".car__btn--next", car), dots = $(".car__dots", car);
    var cs = $$(".cc", track), idx = 0, x = 0, raf = 0, ready = false, dragging = false, tilt = null;
    if (!cs.length) return;
    if (dots) dots.innerHTML = cs.map(function () { return "<i></i>"; }).join("");
    function listMode() { return getComputedStyle(track).flexDirection === "column"; }
    function centre(k) { return cs[k].offsetLeft + cs[k].offsetWidth / 2; }
    function target(k) { return car.clientWidth / 2 - centre(k); }
    function nearest() { var mid = car.clientWidth / 2 - x, bi = 0, bd = 1e9; cs.forEach(function (c, k) { var d = Math.abs(centre(k) - mid); if (d < bd) { bd = d; bi = k; } }); return bi; }
    function paint() {
      if (listMode()) { track.style.transform = ""; cs.forEach(function (c) { c.style.transform = ""; c.style.opacity = ""; c.classList.remove("mid"); }); return; }
      var cw = car.clientWidth, w = cs[0].offsetWidth || 1, m = nearest();
      track.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
      cs.forEach(function (c, k) {
        var d = (centre(k) + x - cw / 2) / w, a = Math.abs(d), tr;
        if (reduce) tr = "";
        else {
          tr = "perspective(1100px) translateZ(" + (-Math.min(a, 2) * 70).toFixed(1) + "px) rotateY(" + Math.max(-48, Math.min(48, -d * 30)).toFixed(2) + "deg) scale(" + (1 - Math.min(a, 2) * 0.07).toFixed(3) + ")";
          if (k === m && tilt && !dragging) tr += " rotateX(" + (-tilt[1] * 7).toFixed(2) + "deg) rotateY(" + (tilt[0] * 9).toFixed(2) + "deg)";
        }
        c.style.transform = tr;
        c.style.opacity = String(1 - Math.min(a, 2.5) * 0.16);
        c.classList.toggle("mid", k === m);
        if (dots && dots.children[k]) dots.children[k].classList.toggle("on", k === m);
      });
    }
    var lastT = 0;
    function tick(now) {
      raf = 0;
      if (dragging) { paint(); return; }
      var tx = target(idx), d = tx - x, dt = Math.min((now - (lastT || now)) / 1000, 0.1); lastT = now;
      if (Math.abs(d) < 0.4 || reduce) { x = tx; lastT = 0; paint(); return; }
      x += d * (1 - Math.exp(-dt * 11)); paint(); /* time based, so slow devices arrive just as fast */
      raf = requestAnimationFrame(tick);
    }
    function run() { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } }
    function ends() { if (prev) prev.disabled = idx <= 0; if (next) next.disabled = idx >= cs.length - 1; }
    function go(k) { idx = Math.max(0, Math.min(cs.length - 1, k)); ends(); run(); }
    if (car.id === "work") window.addEventListener("car:show", function (e) {
      var k = cs.findIndex(function (c) { return (c.getAttribute("href") || "").split("/").pop() === e.detail; });
      if (k > -1 && ready) { idx = k; ends(); x = target(idx); paint(); }
    });
    function init() {
      if (ready || !car.clientWidth || listMode()) { paint(); return; }
      ready = true;
      /* in a business, the card that costs the owner most is the one in the centre when the page opens */
      var top = cs.findIndex(function (c) { return c.classList.contains("cc--top"); });
      if (top === 0 && cs.length > 2 && window.innerWidth >= 760) { track.insertBefore(cs[1], cs[0]); cs = $$(".cc", track); top = 1; if (dots) dots.innerHTML = cs.map(function () { return "<i></i>"; }).join(""); }
      idx = top > -1 ? top : (window.innerWidth < 760 ? 0 : Math.min(car.id === "work" ? 2 : 1, cs.length - 1)); /* home: two cards on each side */ x = target(idx); ends(); paint();
    }
    if (prev) prev.addEventListener("click", function () { go(idx - 1); });
    if (next) next.addEventListener("click", function () { go(idx + 1); });
    if (dots) dots.addEventListener("click", function (e) { var k = Array.prototype.indexOf.call(dots.children, e.target); if (k > -1) go(k); });
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { go(idx + 1); e.preventDefault(); } if (e.key === "ArrowLeft") { go(idx - 1); e.preventDefault(); } });
    /* wheel: a sideways gesture (trackpad, shift+wheel) moves one card at a time; vertical wheel scrolls the page */
    var acc = 0, cool = 0;
    car.addEventListener("wheel", function (e) {
      if (listMode()) return;
      var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
      if (!dx) return;
      e.preventDefault();
      var now = Date.now(); if (now < cool) return;
      acc += dx;
      if (Math.abs(acc) > 40) { go(idx + (acc > 0 ? 1 : -1)); acc = 0; cool = now + 320; }
    }, { passive: false });
    /* drag with mouse, swipe with a finger: same code, pointer events */
    var down = false, sx = 0, sy = 0, x0 = 0, moved = false, pid = null;
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });
    track.addEventListener("pointerdown", function (e) {
      if (listMode() || (e.pointerType === "mouse" && e.button !== 0)) return;
      down = true; moved = false; sx = e.clientX; sy = e.clientY; x0 = x; pid = e.pointerId;
    });
    window.addEventListener("pointermove", function (e) {
      if (!down || e.pointerId !== pid) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true; moved = true; track.classList.add("drag");
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
      x = Math.max(target(cs.length - 1) - 90, Math.min(target(0) + 90, x0 + dx));
      paint();
    });
    function release(e) {
      if (!down || (e && e.pointerId !== pid)) return;
      down = false;
      if (!dragging) return;
      dragging = false; track.classList.remove("drag");
      var dx = e ? e.clientX - sx : 0, k = nearest();
      if (k === idx && Math.abs(dx) > 40) k = idx + (dx < 0 ? 1 : -1); /* a short flick still moves one card */
      go(k);
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    /* Clicks are resolved by position, not by what the browser says was hit: with 3D transforms
       some browsers (Firefox) report the wrong element, and the card could not be opened. */
    var passing = false;
    car.addEventListener("click", function (e) {
      if (passing || listMode()) return;
      if (e.target.closest && e.target.closest(".car__btn, .car__dots")) return;
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
      var r = car.getBoundingClientRect(), tr = track.getBoundingClientRect(), lx = e.clientX - r.left, w = cs[0].offsetWidth, k = -1;
      if (e.clientY < tr.top || e.clientY > tr.bottom) return;
      cs.forEach(function (c, n) { if (Math.abs(centre(n) + x - lx) <= w / 2) k = n; });
      if (k < 0) return;
      e.preventDefault(); e.stopPropagation();
      if (k !== nearest()) { go(k); return; }
      /* centre card: an inner control (Order, Details) keeps its own action, otherwise open the card */
      var inner = e.target.closest && e.target.closest("a, button"), card = cs[k];
      var el = inner && card.contains(inner) ? inner : (card.matches("a") ? card : $("a", card));
      if (el) { passing = true; el.click(); passing = false; }
    }, true);
    /* the centre card leans toward the cursor */
    car.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || reduce || listMode()) return;
      var c = cs[nearest()], r = c.getBoundingClientRect();
      var inside = e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom;
      tilt = inside ? [(e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5] : null;
      if (!raf && !dragging) paint();
    });
    car.addEventListener("pointerleave", function () { tilt = null; if (!raf) paint(); });
    window.addEventListener("resize", function () { if (ready && !listMode()) { x = target(idx); } paint(); });
    new IntersectionObserver(function () { init(); }, { threshold: 0.05 }).observe(car);
    init();
  });

  /* ---------- pages inside the page: one step at a time ----------
     home (pick a business) > #/for/<business> (pick a task) > #/for/<business>/<task> (example, price, order)
     > contact. Each level shows only what that step needs. #contact on its own is the contact page. */
  var home = $("#home"), views = $("#views"), current = null, homeY = 0;
  var F = window.FUNNEL || { niches: {}, sv: {}, icons: {} };
  var l3 = $("#l3"), l3demo = $("#l3demo"), l3ctx = null;
  var LEGACY = { "#creatives": "#/content" };
  function svg(name) { return '<svg class="ico ph"><use href="#l-' + name + '" /></svg>'; }
  /* demos live in the old service pages; lend them to the level-3 page while it shows */
  function demoFor(sid) { return sid === "social" ? $("#v-social .pgroup") : null; }
  /* plain-language page text: per language, business and service; falls back to English, then to nothing */
  function content(n, sid) {
    var C = window.CONTENT || {};
    return (C[lang] && C[lang][n] && C[lang][n][sid]) || (C.en && C.en[n] && C.en[n][sid]) || (C[lang] && C[lang].other && C[lang].other[sid]) || null;
  }
  function paintCards() {
    $$("[data-c]").forEach(function (el) { var p = el.dataset.c.split("."), c = content(p[0], p[1]); el.textContent = c ? c.promise : ""; el.hidden = !c; });
  }
  repaintCards = paintCards;
  var lent = null, lentFrom = null;
  function giveBack() { if (lent && lentFrom) lentFrom.appendChild(lent); lent = lentFrom = null; }
  function fillL3(keep) {
    if (!l3ctx) return;
    var n = l3ctx[0], sid = l3ctx[1], row = (F.niches[n] || []).filter(function (x) { return x[0] === sid; })[0], sv = F.sv[sid];
    if (!row || !sv) return;
    $("#l3nb").textContent = t("n." + n);
    $("#l3back").setAttribute("href", "#/for/" + n);
    $("#l3ico").innerHTML = svg(sv.icon);
    $("#l3h").textContent = t("sv." + sid + ".h");
    var c = content(n, sid);
    $("#l3line").textContent = c ? c.promise : t(row[1]);
    $("#scene").hidden = !c; $("#l3steps").hidden = !c;
    if (c) {
      $("#stGive").textContent = c.give; $("#stMake").textContent = c.make; $("#stGet").textContent = c.get;
      scene = {
        before: { label: c.beforeLabel || c.exInLabel, text: c.before || c.exIn, note: c.loss || "" },
        after: { label: c.afterLabel || c.exOutLabel, text: c.after || c.exOut, note: c.gain || "" },
        v: c.v || null
      };
      playScene(keep);
    }
    $("#l3price").innerHTML = sid === "social" ? "" : '<span>' + t("pr.from") + '</span> <b>' + sv.amt + '</b> <span>' + (sv.per ? t("pr.mo") : t("pr.once")) + "</span>";
    $("#l3order").dataset.order = sid;
    var pb = $("#l3price b");
    if (pb && !reduce) {
      var num = parseInt(sv.amt.replace(/\D/g, ""), 10) || 0, t0 = performance.now();
      (function up(now) { var p = Math.min((now - t0) / 700, 1), e = 1 - Math.pow(1 - p, 3); pb.textContent = "€" + Math.round(num * e); if (p < 1 && l3ctx && l3ctx[1] === sid) requestAnimationFrame(up); else pb.textContent = sv.amt; })(t0);
    }
    $(".l3__buy").hidden = sid === "social"; /* social media has its own three plans, each with Order */
  }
  refillL3 = function () { fillL3(true); };

  /* ---------- "without me / with me": a phone the visitor handles ----------
     Two screens of the same moment sit on top of each other. Dragging the handle (mouse, finger
     or arrow keys) uncovers the "with me" screen; on it a Send button really sends: the message
     gets a tick and the gain appears. Nothing plays by itself except one small nudge of the handle. */
  var scene = null, pos = 86, sent = false, nudge = [];
  function stopNudge() { nudge.forEach(clearTimeout); nudge = []; }
  var ph = $("#ph"), knob = $("#phKnob");
  function setPos(v, smooth) {
    pos = Math.max(0, Math.min(100, v));
    ph.classList.toggle("smooth", !!smooth);
    ph.style.setProperty("--pos", pos + "%");
    knob.setAttribute("aria-valuenow", String(Math.round(100 - pos)));
    ph.classList.toggle("is-after", pos < 45);
    capNow();
  }
  /* Each kind of service has its own mock-up inside the phone: a review card, a post, a map
     listing, a booking slot, a table, a document, a chat. Text is always set with textContent. */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function add(p) { for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]); return p; }
  function cells(line) { return String(line || "").split(/\s+·\s+/); }
  var DRAW = {
    chat: function (v, after) {
      var w = el("div", "mk-chat");
      add(w, el("small", "mk-from", v.who), el("div", "sbub sbub--before", after ? v.a1 : v.b1));
      if (!after) add(w, el("div", "mk-status bad", v.b2));
      else { add(w, el("div", "sbub sbub--after", v.a2)); if (v.a3) add(w, el("div", "sbub sbub--before", v.a3)); }
      return w;
    },
    reminder: function (v, after) {
      var w = el("div", "mk-rem"), slot = add(el("div", "mk-slot"), el("b", "", v.who));
      if (!after) { add(slot, el("span", "mk-status bad", v.b1)); add(w, slot, v.b2 ? el("p", "mk-muted", v.b2) : null); }
      else { add(w, el("div", "mk-note", v.a1), v.a2 ? el("div", "sbub sbub--before", v.a2) : null); add(slot, el("span", "mk-status good", v.a3)); add(w, slot); }
      return w;
    },
    review: function (v, after) {
      var w = el("div", "mk-card"), n = Math.max(1, Math.min(5, Math.round(v.stars || 2)));
      add(w, add(el("div", "mk-rhead"), el("i", "mk-ava", (v.who || "?").charAt(0)), el("b", "", v.who), el("span", "mk-stars", "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n))), el("p", "", after ? v.a1 : v.b1));
      if (!after) add(w, el("div", "mk-status bad", v.b2));
      else add(w, add(el("div", "mk-reply"), el("small", "", t("sc.owner")), el("p", "", v.a2)));
      return w;
    },
    post: function (v, after) {
      var w = el("div", "mk-card mk-post");
      add(w, add(el("div", "mk-rhead"), el("i", "mk-ava", (v.who || "?").charAt(0)), el("b", "", v.who)));
      if (!after) add(w, el("div", "mk-img old", v.b1), el("p", "mk-muted", v.b2));
      else add(w, el("div", "mk-img", v.a1), el("p", "", v.a2), el("small", "mk-when", v.a3));
      return w;
    },
    listing: function (v, after) {
      var w = el("div", "mk-card mk-listing");
      add(w, el("b", "mk-title", v.who));
      if (!after) [v.b1, v.b2, v.b3].forEach(function (x) { if (x) add(w, el("p", "mk-row bad", x)); });
      else add(w, el("p", "mk-row good", v.a1), el("p", "mk-row good", v.a2), v.a3 ? el("span", "mk-btn", v.a3) : null);
      return w;
    },
    list: function (v, after) {
      var w = el("div", after ? "mk-table" : "mk-mess");
      if (!after) [v.b1, v.b2, v.b3].forEach(function (x, k) { if (x) add(w, el("div", "mk-scrap s" + k, x)); });
      else { add(w, el("b", "mk-title", v.who)); [v.a1, v.a2, v.a3].forEach(function (x) { if (!x) return; var r = el("div", "mk-tr"); cells(x).forEach(function (c) { add(r, el("span", "", c)); }); add(w, r); }); }
      return w;
    },
    doc: function (v, after) {
      var w = el("div", after ? "mk-sheet" : "mk-rem");
      if (!after) add(w, el("div", "mk-scrap s1", v.b1), el("div", "mk-status bad", v.b2));
      else { add(w, el("b", "mk-title", v.who)); [v.a1, v.a2].forEach(function (x) { if (!x) return; var c = cells(x), r = el("div", "mk-line"); add(r, el("span", "", c[0]), el("span", "", c.slice(1).join(" · "))); add(w, r); }); add(w, el("div", "mk-total", v.a3)); }
      return w;
    }
  };
  function capNow() { var v = scene && scene.v, cap = $("#scCap"); if (!cap) return; cap.textContent = v ? (pos < 45 ? v.capA : v.capB) : ""; cap.hidden = !v; }
  function playScene(keep) {
    if (!scene) return;
    var kp = keep === true ? { pos: pos, sent: sent } : null;
    sent = false;
    var v = scene.v, B = $("#scBodyB"), A = $("#scBodyA"), type = v && DRAW[v.type] ? v.type : null;
    B.innerHTML = ""; A.innerHTML = "";
    if (type) {
      var sid = l3ctx ? l3ctx[1] : "", hd = t("sc.t.s." + sid) || t("sc.t." + type);
      $("#scLabelB").textContent = hd; $("#scLabelA").textContent = hd;
      B.appendChild(DRAW[type](v, false)); A.appendChild(DRAW[type](v, true));
      $("#scLoss").textContent = v.loss || scene.before.note; $("#scGain").textContent = v.gain || scene.after.note;
      $("#scSend span").textContent = t("sc.b.s." + sid) || t("sc.b." + type);
    } else {
      $("#scLabelB").textContent = scene.before.label || ""; $("#scLabelA").textContent = scene.after.label || "";
      B.appendChild(el("div", "sbub sbub--before", scene.before.text || "")); A.appendChild(el("div", "sbub sbub--after", scene.after.text || ""));
      $("#scLoss").textContent = scene.before.note; $("#scGain").textContent = scene.after.note;
      $("#scSend span").textContent = t("sc.send");
    }
    $("#scLoss").hidden = !$("#scLoss").textContent; $("#scGain").hidden = true;
    $("#ph").classList.remove("is-sent"); $("#scSend").classList.remove("done"); $("#scSend").disabled = false; $("#scSend").style.minHeight = "";
    stopNudge();
    if (kp) { setPos(kp.pos, false); if (kp.sent) $("#scSend").click(); return; }
    setPos(86, false);
    if (!reduce) nudge.push(setTimeout(function () { setPos(70, true); nudge.push(setTimeout(function () { setPos(86, true); }, 450)); }, 900)); /* "this moves" */
  }
  /* after a tap the whole phone is on screen: between the menu and the round assistant button */
  function showDemo() { requestAnimationFrame(function () { var nav = $("#nav"), fab = $("#botFab"), top = (nav && getComputedStyle(nav).position === "fixed" ? nav.getBoundingClientRect().bottom : 0) + 8; var r = ph.getBoundingClientRect(), lim = (fab && fab.offsetWidth ? fab.offsetTop : innerHeight) - 12; var d = Math.min(r.bottom - lim, r.top - top); if (d > 4) scrollBy({ top: d, behavior: reduce ? "auto" : "smooth" }); }); }
  function fromX(x) { var r = ph.getBoundingClientRect(); return ((x - r.left) / r.width) * 100; }
  var dragging = false;
  ph.addEventListener("pointerdown", function (e) {
    if (e.target.closest("#scSend, .ph__lbl")) return;
    stopNudge(); ph.classList.add("drag");
    dragging = true; ph.setPointerCapture(e.pointerId); setPos(fromX(e.clientX), false);
  });
  ph.addEventListener("pointermove", function (e) { if (dragging) setPos(fromX(e.clientX), false); });
  function end() { ph.classList.remove("drag"); if (!dragging) return; dragging = false; setPos(pos < 50 ? 0 : 100, true); document.documentElement.classList.add("sc-used"); if (pos < 50) showDemo(); }
  ph.addEventListener("pointerup", end); ph.addEventListener("pointercancel", end);
  knob.addEventListener("keydown", function (e) {
    stopNudge();
    if (e.key === "ArrowLeft") { setPos(pos - 10, true); e.preventDefault(); }
    if (e.key === "ArrowRight") { setPos(pos + 10, true); e.preventDefault(); }
    if (e.key === "Home") { setPos(0, true); e.preventDefault(); }
    if (e.key === "End") { setPos(100, true); e.preventDefault(); }
  });
  $$(".ph__lbl").forEach(function (l) { l.addEventListener("click", function (e) { e.stopPropagation(); stopNudge(); var a = l.classList.contains("ph__lbl--a"); setPos(a ? 0 : 100, true); if (a) showDemo(); }); });
  $("#scSend").addEventListener("click", function () {
    if (sent) return; sent = true;
    var b = $("#scSend"); b.style.minHeight = b.offsetHeight + "px"; b.classList.add("done"); b.disabled = true; $("span", b).textContent = t("sc.done");
    ph.classList.add("is-sent");
    var g = $("#scGain"); g.hidden = !g.textContent; g.classList.remove("in"); void g.offsetWidth; g.classList.add("in");
    showDemo();
  });
  var ys = {}, lastHash = location.hash;
  function depth(h) { return h === "#contact" ? 3 : /^#\/for\/[a-z]+\/[a-z]+$/.test(h) || /^#\/[a-z]+$/.test(h) ? 2 : /^#\/for\//.test(h) ? 1 : 0; }
  function show(sec, key) {
    if (current === null) homeY = window.pageYOffset;
    $$(".svc").forEach(function (v) { v.hidden = v !== sec; });
    home.hidden = true; views.hidden = false;
    current = key;
    var back = depth(key) < depth(lastHash) && ys[key];
    window.scrollTo({ top: back || 0, behavior: "instant" });
    $$(".rv", sec).forEach(function (el) { el.classList.add("in"); });
    var hd = $(".svc__h", sec); if (hd) hd.focus({ preventScroll: true });
  }
  function route() {
    var h = LEGACY[location.hash] || location.hash;
    if (h !== location.hash) { history.replaceState(null, "", h); }
    var root = document.documentElement;
    var m3 = h.match(/^#\/for\/([a-z]+)\/([a-z]+)$/), m2 = h.match(/^#\/for\/([a-z]+)$/), m1 = h.match(/^#\/([a-z]+)$/);
    root.classList.remove("lvl3", "ctpage");
    if (h !== "#contact" && order && h !== orderAt) { order = null; paintOrder(); }
    if (h !== "#contact") orderAt = null;
    if (m3 && F.niches[m3[1]]) {
      giveBack();
      ctxNiche = m3[1]; l3ctx = [m3[1], m3[2]]; fillL3();
      var d = demoFor(m3[2]); if (d) { lentFrom = d.parentNode; lent = d; l3demo.appendChild(d); }
      root.classList.add("lvl3");
      show(l3, h); return;
    }
    if (m2 && $("#n-" + m2[1])) { giveBack(); ctxNiche = m2[1]; show($("#n-" + m2[1]), h); return; }
    if (m1 && $("#v-" + m1[1])) { giveBack(); show($("#v-" + m1[1]), h); root.classList.add("lvl3"); return; }
    if (h === "#contact") {
      root.classList.add(current !== null ? "lvl3" : "ctpage");
      if (current === null) { home.hidden = true; views.hidden = true; }
      var ct = $("#contact"); requestAnimationFrame(function () { ct.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); });
      return;
    }
    giveBack();
    var wasView = current !== null;
    current = null; ctxNiche = null; l3ctx = null;
    $$(".svc").forEach(function (v) { v.hidden = true; });
    views.hidden = true; home.hidden = false;
    var target = h.length > 1 && document.getElementById(h.slice(1));
    if (target) target.scrollIntoView();
    else if (wasView) window.scrollTo({ top: homeY, behavior: "instant" });
  }
  window.addEventListener("scroll", function () { if (location.hash === lastHash) ys[lastHash] = window.pageYOffset; }, { passive: true });
  function routeAll() {
    var from = lastHash.match(/^#\/for\/([a-z]+)$/);
    route();
    lastHash = location.hash;
    /* back to the list of businesses: the one the visitor came from is in the centre */
    if (from && !home.hidden) window.dispatchEvent(new CustomEvent("car:show", { detail: from[1] }));
    var r = document.documentElement, was = r.classList.contains("at-home"), now = !home.hidden;
    var nv = document.querySelector(".svc.nv:not([hidden])"), wasN = r.classList.contains("at-niche"), nowN = !now && !!nv && location.hash !== "#contact";
    r.classList.toggle("at-home", now);
    r.classList.toggle("at-niche", nowN);
    if (nowN) window.scrollTo(0, 0);
    if (was !== now || wasN !== nowN) window.dispatchEvent(new Event("resize"));
    if (wasN && !nowN && location.hash === "#contact") {
      var ct = $("#contact"), ST = window.ScrollTrigger;
      var again = function () { if (ST) ST.removeEventListener("refresh", again); if (location.hash === "#contact") ct.scrollIntoView(); };
      ct.scrollIntoView();
      if (ST) ST.addEventListener("refresh", again);
    }
    if (location.hash === "#contact") requestAnimationFrame(function () { fitTa($('#form [name="message"]')); }); /* sizes changed: carousels re-centre */
  }
  window.addEventListener("hashchange", routeAll);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ---------- "find your service": a small assistant, text or voice, in the visitor's language ----------
     No server and no key: it understands the words locally (keywords in all four languages) and
     sends the visitor to the right business and task. Voice uses the browser's own speech recognition. */
  (function () {
    var fab = $("#botFab"), box = $("#bot"), log = $("#botLog"), form = $("#botForm"), inp = $("#botIn"), mic = $("#botMic");
    if (!fab) return;
    var DODGE = '#scSend, #phKnob, #l3order, #orderClear, .plan__go, .nv .cc__go, #contact .msgs .btn, #form input, #form textarea, #form button[type="submit"]', tick = 0;
    function dodge() { tick = 0; var l = fab.offsetLeft, tp = fab.offsetTop, r = l + fab.offsetWidth, b = tp + fab.offsetHeight; var hit = box.hidden && [].some.call(document.querySelectorAll(DODGE), function (el) { if (!el.offsetWidth) return false; var q = el.getBoundingClientRect(); return q.right > l + 4 && q.left < r - 4 && q.bottom > tp + 4 && q.top < b - 4; }); fab.classList.toggle("off", hit); }
    function later() { if (!tick) tick = requestAnimationFrame(dodge); }
    addEventListener("scroll", later, { passive: true }); addEventListener("resize", later); addEventListener("hashchange", function () { setTimeout(dodge, 400); }); $("#ph").addEventListener("transitionend", later); setTimeout(dodge, 300);
    var NK = {
      salon: "салон красот парикмахер стрижк барбер маникюр ногт педикюр бров ресниц косметолог массаж спа beauty hair barber nail brow lash massage spa friseur kosmetik nagel перукар манікюр нігт масаж краса",
      cafe: "кафе ресторан кофейн бар пекарн пицц суши еда столик меню cafe restaurant coffee bakery pizza food menu table café speisekarte bäckerei кав'ярн піц їжа",
      shop: "магазин цвет ларёк ларек киоск flower stall kiosk blumen квіт товар маркетплейс одежд обув склад shop store ecommerce marketplace clothes products laden onlineshop kleidung ware одяг",
      trades: "ремонт мастер сантехник электрик строител отделк мебел автосервис шиномонтаж repair handyman plumber electrician builder trades carpenter handwerk reparatur klempner elektriker майстер сантехнік електрик будівель",
      fitness: "фитнес спорт тренер тренировк зал йог бассейн танц fitness gym trainer yoga studio pool dance fitnessstudio training фітнес зал йога",
      clinic: "клиник врач стоматолог зубн медицин пациент доктор психолог clinic doctor dentist medical patient practice therapist praxis arzt zahnarzt клінік лікар пацієнт",
      cleaning: "клининг уборк убор чистк мойк химчистк cleaning cleaner janitor window reinigung putz fenster прибиранн клінінг",
      office: "офис бухгалтер юрист компани фирма агентств консалт бизнес office accountant lawyer company agency consulting firm büro buchhalter anwalt firma agentur офіс компані фірм"
    };
    var SK = {
      social: "соцсет инстаграм instagram пост рилс reels контент тикток tiktok подписчик публикац social followers posts facebook соцмереж інстаграм публікац підписник",
      bot: "бот чатбот запис записыва бронь брониров whatsapp telegram мессенджер booking appointment chatbot reservation termin buchung бронюв",
      content: "фото видео картинк реклам баннер описани карточк photo video image banner copy description foto bild werbung beschreibung відео опис",
      reports: "отчёт отчет таблиц excel эксель учёт учет касс продаж аналитик report spreadsheet sheet accounting sales analytics bericht tabelle buchhaltung umsatz звіт облік",
      docs: "письм почт документ договор счёт счет накладн предложени email mail letter contract invoice offer brief dokument vertrag rechnung angebot лист договір рахунок",
      reviews: "отзыв рейтинг репутац google review rating reputation stars bewertung rezension відгук",
      data: "парсинг парсер мониторинг цен конкурент данные собрать скрап scrape monitoring price competitor data crawl preis konkurrent daten моніторинг ціни дані",
      site: "сайт лендинг визитк seo веб страниц website landing homepage webseite лендінг сторінк",
      leads: "лид crm клиенты контакт обращени lead leads inquiry anfrage kontakte заявк клієнт",
      mail: "напомин неявк забыва приходят пропуска no-show forget vergess забува пропуска рассылк уведомлен вернуть reminder newsletter mailing notification remind erinnerung benachrichtigung нагад розсилк сповіщ",
      translate: "перевод перевест язык немецк английск translate translation language übersetz sprache переклад мов",
      hiring: "сотрудник персонал ваканси найм нанять работник кандидат уборщиц официант staff hiring hire vacancy job candidate employee personal mitarbeiter stelle stellenanzeige bewerber працівник вакансі найняти кандидат",
      assistant: "помощник ассистент ии нейросет команд assistant helper gpt assistent ki mitarbeiter помічник асистент штучн"
    };
    function toks(x) { return x.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, " ").split(" ").filter(function (w) { return w.length >= 3; }); }
    function prep(o) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = toks(o[k]); }); return r; }
    var NKT = prep(NK), SKT = prep(SK);
    var FKT = toks("фирма фирмы фирму компания компании команда команды сотрудников отдел firma unternehmen betrieb team mitarbeiter abteilung company companies business team employees staff department фірма фірми компанія команда працівників відділ");
    function score(ts, kws) {
      var n = 0;
      kws.forEach(function (k) { ts.forEach(function (w) { if (w === k || (k.length >= 4 && w.length >= 4 && w.slice(0, 5) === k.slice(0, 5))) n++; }); });
      return n;
    }
    function best(ts, table) {
      var id = null, top = 0;
      Object.keys(table).forEach(function (k) { var s = score(ts, table[k]); if (s > top) { top = s; id = k; } });
      return id;
    }
    function say(kind, text) { var b = document.createElement("div"); b.className = "bub bub--" + kind; b.textContent = text; log.appendChild(b); log.scrollTop = log.scrollHeight; return b; }
    function link(href, label, order) {
      var a = document.createElement("a"); a.className = "bot__go"; a.href = href;
      a.innerHTML = "<span></span>" + '<svg class="ico"><use href="#i-arrow" /></svg>';
      a.firstChild.textContent = label;
      if (order) a.dataset.order = order;
      a.addEventListener("click", function () { if (order) { /* contact order chip is set by the shared handler */ } close(); });
      log.appendChild(a); log.scrollTop = log.scrollHeight;
    }
    /* what the visitor said, in the visitor's words, wrapped as a ready message to the owner */
    function draftFor(q) { return t("bot.tpl").replace("{q}", q); }
    function showDraft(text) {
      var wrap = document.createElement("div"); wrap.className = "bot__draft";
      var ta = document.createElement("textarea"); ta.value = text; ta.rows = 4; ta.maxLength = 800; ta.setAttribute("aria-label", t("bot.draft"));
      var row = document.createElement("div"); row.className = "bot__send3";
      var tg = document.createElement("button"); tg.type = "button"; tg.className = "bot__ch"; tg.textContent = "Telegram";
      var wa = document.createElement("a"); wa.className = "bot__ch"; wa.target = "_blank"; wa.rel = "noopener"; wa.textContent = "WhatsApp";
      var ml = document.createElement("a"); ml.className = "bot__ch"; ml.textContent = "Email";
      function sync() {
        var v = ta.value.trim();
        wa.href = "https://wa.me/491709094298?text=" + encodeURIComponent(v);
        ml.href = "mailto:kostinmihail40@gmail.com?subject=" + encodeURIComponent(t("bot.subject")) + "&body=" + encodeURIComponent(v);
      }
      ta.addEventListener("input", function () { sync(); fitTa(ta); }); sync(); setTimeout(function () { fitTa(ta); log.scrollTop = log.scrollHeight; }, 0);
      tg.addEventListener("click", function () {
        /* a Telegram link cannot carry text, so the text goes to the clipboard first */
        function go() { say("b", t("bot.copied")); window.open("https://t.me/onomamichail", "_blank", "noopener"); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value.trim()).then(go, go); else { ta.select(); try { document.execCommand("copy"); } catch (e) {} go(); }
      });
      row.appendChild(tg); row.appendChild(wa); row.appendChild(ml);
      wrap.appendChild(ta); wrap.appendChild(row);
      log.appendChild(wrap); log.scrollTop = log.scrollHeight;
    }
    function local(text) {
      var ts = toks(text), n = best(ts, NKT), sid = best(ts, SKT), F = window.FUNNEL || { niches: {} };
      /* a team or a company without a named task: the company page */
      if (!sid && (!n || n === "office") && score(ts, FKT) > 0) { say("b", t("bot.found")); link("#/firm", t("firm.nav")); return; }
      if (n && sid) {
        var has = (F.niches[n] || []).some(function (r) { return r[0] === sid; });
        say("b", t("bot.found"));
        link(has ? "#/for/" + n + "/" + sid : "#/for/" + n, t("sv." + sid + ".h") + ", " + t("n." + n));
      } else if (n) {
        say("b", t("bot.niche")); link("#/for/" + n, t("n." + n));
      } else if (sid) {
        say("b", t("bot.found")); link("#/" + sid, t("sv." + sid + ".h"));
      } else {
        say("b", t("bot.draft")); showDraft(draftFor(text));
      }
    }
    /* with an AI address set, the model understands any wording; if it is down, the local matcher answers */
    var meta = $('meta[name="chat-api"]'), API = meta ? meta.getAttribute("content") : "", hist = [];
    function ask(text) {
      hist.push({ role: "user", content: text });
      var wait = say("b", t("bot.think")); wait.classList.add("bub--t"); wait.innerHTML = "<i></i><i></i><i></i>";
      var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 12000);
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal, body: JSON.stringify({ lang: lang, messages: hist.slice(-6) }) })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (j) {
          clearTimeout(to); wait.remove();
          if (!j || typeof j.reply !== "string") throw new Error("bad");
          say("b", j.reply); hist.push({ role: "assistant", content: j.reply });
          var F = window.FUNNEL || { niches: {} };
          if (j.service && (j.niche || F.sv && F.sv[j.service])) {
            var has = j.niche && (F.niches[j.niche] || []).some(function (r) { return r[0] === j.service; });
            link(has ? "#/for/" + j.niche + "/" + j.service : "#/" + j.service, t("sv." + j.service + ".h") + (j.niche ? ", " + t("n." + j.niche) : ""));
          } else if (j.niche) {
            link("#/for/" + j.niche, t("n." + j.niche));
          } else if (j.draft) {
            showDraft(j.draft);
          }
        })
        .catch(function () { clearTimeout(to); wait.remove(); local(text); });
    }
    function answer(text) { if (API) ask(text); else local(text); }
    function open() { box.hidden = false; fab.setAttribute("aria-expanded", "true"); fab.classList.add("on"); setTimeout(function () { inp.focus(); }, 50); }
    function close() { box.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.classList.remove("on"); stopMic(); }
    fab.addEventListener("click", function () { box.hidden ? open() : close(); });
    $("#botClose").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = inp.value.trim(); if (!v) return;
      say("u", v); inp.value = ""; answer(v);
    });
    /* voice */
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, hot = false;
    var CODES = { en: "en-US", de: "de-DE", uk: "uk-UA", ru: "ru-RU" };
    function stopMic() { hot = false; mic.classList.remove("on"); if (rec) { try { rec.stop(); } catch (e) {} } }
    mic.addEventListener("click", function () {
      if (!SR) { say("b", t("bot.nomic")); return; }
      if (hot) { stopMic(); return; }
      rec = new SR(); rec.lang = CODES[lang] || "en-US"; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
      var finalText = "";
      rec.onresult = function (e) {
        var s = ""; for (var i = e.resultIndex; i < e.results.length; i++) { s += e.results[i][0].transcript; if (e.results[i].isFinal) finalText = s; }
        inp.value = s;
      };
      rec.onend = function () { var v = (finalText || inp.value).trim(); hot = false; mic.classList.remove("on"); inp.placeholder = t("bot.ph"); if (v) { say("u", v); inp.value = ""; answer(v); } };
      rec.onerror = function () { hot = false; mic.classList.remove("on"); inp.placeholder = t("bot.ph"); };
      hot = true; mic.classList.add("on"); inp.placeholder = t("bot.listen");
      try { rec.start(); } catch (e) { hot = false; mic.classList.remove("on"); }
    });
  })();

  /* spotlight border: the card edge brightens where the cursor is */
  document.addEventListener("pointermove", function (e) {
    var c = e.target.closest && e.target.closest(".cc");
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, { passive: true });

  setLang(pickLang(), false);
  routeAll();
})();
