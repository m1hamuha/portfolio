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
    refillL3();
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
  var order = null, typed = false;
  /* id -> [name key, "from" prefix?, amount] ; plans are named under social media */
  var ORD = {
    social: ["sv.social.h", 1, "€10"], bot: ["sv.bot.h", 1, "€79"], content: ["sv.content.h", 1, "€1"],
    reports: ["sv.reports.h", 1, "€19"], docs: ["sv.docs.h", 1, "€19"], reviews: ["sv.reviews.h", 1, "€15"],
    data: ["sv.data.h", 1, "€29"], site: ["sv.site.h", 1, "€29"], leads: ["sv.leads.h", 1, "€29"], mail: ["sv.mail.h", 1, "€19"],
    translate: ["sv.translate.h", 1, "€5"], assistant: ["sv.assistant.h", 1, "€49"], custom: ["sv.custom.h", 0, ""],
    photo: ["pm.photo", 0, "€1"], video: ["pm.video", 1, "€8"],
    plan1: ["pl.1", 0, "€10 " ], plan2: ["pl.2", 0, "€25 "], plan3: ["pl.3", 0, "€40 "]
  };
  function labelFor(id) {
    var o = ORD[id], name = t(o[0]);
    var pre = ctxNiche ? t("n." + ctxNiche) + ": " : "";
    if (id.indexOf("plan") === 0) return pre + t("sv.social.h") + ", " + name + ": " + o[2] + t("pr.mo");
    return pre + (o[2] ? name + ": " + (o[1] ? t("pr.from") + " " : "") + o[2] : name);
  }
  function paintOrder() {
    var box = $("#order"), lab = $("#orderLabel"), ta = $('#form [name="message"]');
    lab.textContent = order ? labelFor(order) : "";
    box.hidden = !order;
    if (!typed) ta.value = order ? t("wa.order") + lab.textContent : "";
    var text = order ? t("wa.order") + lab.textContent : t("wa.hero");
    $$("[data-wa]").forEach(function (a) { a.href = WA + "?text=" + encodeURIComponent(text); });
  }
  $$("[data-order]").forEach(function (el) { el.addEventListener("click", function () { order = el.dataset.order; paintOrder(); }); });
  $("#orderClear").addEventListener("click", function () { order = null; paintOrder(); });
  $('#form [name="message"]').addEventListener("input", function () { typed = true; });

  /* phone only: a bar with both messengers appears once the first button has scrolled away */
  (function () {
    var dock = $("#dock"), first = $(".hero__cta"), contact = $("#contact"), away = false, inContact = false;
    if (!dock || !first || !contact) return;
    function sync() { dock.classList.toggle("on", away && !inContact); }
    new IntersectionObserver(function (es) { away = !es[0].isIntersecting; sync(); }).observe(first);
    new IntersectionObserver(function (es) { inContact = es[0].isIntersecting; sync(); }, { threshold: 0.1 }).observe(contact);
  })();

  /* ---------- 3D carousels ----------
     Native scroll-snap does the moving; every frame each card is tilted and scaled by how far
     it sits from the centre. Mouse drag, arrow buttons and keyboard all work. */
  $$("[data-car]").forEach(function (car) {
    var track = $(".car__track", car), prev = $(".car__btn--prev", car), next = $(".car__btn--next", car), raf = 0;
    function cards() { return $$(".cc", track); }
    var dots = $(".car__dots", car);
    if (dots) dots.innerHTML = cards().map(function () { return "<i></i>"; }).join("");
    function listMode() { return getComputedStyle(track).flexDirection === "column"; }
    function paint() {
      raf = 0;
      var mid = track.getBoundingClientRect(), cx = mid.left + mid.width / 2, best = null, bd = 1e9;
      cards().forEach(function (c) {
        var r = c.getBoundingClientRect(), d = (r.left + r.width / 2 - cx) / r.width, a = Math.abs(d);
        if (!reduce && mid.width > 0 && !listMode()) {
          c.style.transform = "translateZ(" + (-Math.min(a, 2) * 70) + "px) rotateY(" + Math.max(-48, Math.min(48, -d * 30)) + "deg) scale(" + (1 - Math.min(a, 2) * 0.07) + ")";
          c.style.opacity = String(1 - Math.min(a, 2.5) * 0.16);
        }
        if (a < bd) { bd = a; best = c; }
      });
      cards().forEach(function (c, k) {
        c.classList.toggle("mid", c === best);
        if (dots && dots.children[k]) dots.children[k].classList.toggle("on", c === best);
      });
    }
    function queue() { if (!raf) raf = requestAnimationFrame(paint); }
    function step(dir) {
      var c = cards()[0]; if (!c) return;
      track.scrollBy({ left: dir * (c.getBoundingClientRect().width + 16), behavior: reduce ? "auto" : "smooth" });
    }
    track.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    track.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") { step(1); e.preventDefault(); } if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); } });
    /* mouse drag (touch already scrolls natively); a drag must not count as a click */
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; track.classList.add("drag"); }
      if (moved) track.scrollLeft = sl - dx;
    });
    window.addEventListener("pointerup", function () {
      if (!down) return; down = false; track.classList.remove("drag");
      if (moved) { var c = cards()[0], w = c ? c.getBoundingClientRect().width + 16 : 1; track.scrollTo({ left: Math.round(track.scrollLeft / w) * w, behavior: "smooth" }); }
    });
    track.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
      var c = e.target.closest(".cc");
      if (c && !listMode() && !c.classList.contains("mid")) {
        e.preventDefault(); e.stopPropagation();
        track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
      }
    }, true);
    /* centre the first card once visible, so the neighbours show on both sides */
    var inited = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !inited && track.clientWidth > 0) {
        inited = true;
        var cs = cards(), c = cs[window.innerWidth < 760 ? 0 : Math.min(1, cs.length - 1)];
        if (c) track.scrollLeft = c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2;
      }
      queue();
    }, { threshold: 0.1 }).observe(car);
    queue();
  });

  /* ---------- pages inside the page: one step at a time ----------
     home (pick a business) > #/for/<business> (pick a task) > #/for/<business>/<task> (example, price, order)
     > contact. Each level shows only what that step needs. #contact on its own is the contact page. */
  var home = $("#home"), views = $("#views"), current = null, homeY = 0;
  var F = window.FUNNEL || { niches: {}, sv: {}, icons: {} };
  var l3 = $("#l3"), l3demo = $("#l3demo"), l3ctx = null;
  var LEGACY = { "#creatives": "#/content" };
  function svg(name) { return '<svg class="ico"><use href="#l-' + name + '" /></svg>'; }
  /* demos live in the old service pages; lend them to the level-3 page while it shows */
  function demoFor(sid) {
    if (sid === "social") return $("#v-social .pgroup");
    var d = $("#v-" + sid + " .svc__demo > *");
    return d || null;
  }
  var lent = null, lentFrom = null;
  function giveBack() { if (lent && lentFrom) lentFrom.appendChild(lent); lent = lentFrom = null; }
  function fillL3() {
    if (!l3ctx) return;
    var n = l3ctx[0], sid = l3ctx[1], row = (F.niches[n] || []).filter(function (x) { return x[0] === sid; })[0], sv = F.sv[sid];
    if (!row || !sv) return;
    $("#l3nb").textContent = t("n." + n);
    $("#l3back").setAttribute("href", "#/for/" + n);
    $("#l3ico").innerHTML = svg(sv.icon);
    $("#l3h").textContent = t("sv." + sid + ".h");
    $("#l3line").textContent = t(row[1]);
    $("#l3price").innerHTML = sid === "social" ? "" : '<span>' + t("pr.from") + '</span> <b>' + sv.amt + '</b> <span>' + (sv.per ? t("pr.mo") : t("pr.once")) + "</span>";
    $("#l3order").dataset.order = sid;
    $(".l3__buy").hidden = sid === "social"; /* social media has its own three plans, each with Order */
  }
  refillL3 = fillL3;
  function show(sec, key) {
    if (current === null) homeY = window.pageYOffset;
    $$(".svc").forEach(function (v) { v.hidden = v !== sec; });
    home.hidden = true; views.hidden = false;
    current = key;
    window.scrollTo({ top: 0, behavior: "instant" });
    $$(".rv", sec).forEach(function (el) { el.classList.add("in"); });
    var hd = $(".svc__h", sec); if (hd) hd.focus({ preventScroll: true });
  }
  function route() {
    var h = LEGACY[location.hash] || location.hash;
    if (h !== location.hash) { history.replaceState(null, "", h); }
    var root = document.documentElement;
    var m3 = h.match(/^#\/for\/([a-z]+)\/([a-z]+)$/), m2 = h.match(/^#\/for\/([a-z]+)$/), m1 = h.match(/^#\/([a-z]+)$/);
    root.classList.remove("lvl3", "ctpage");
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
  window.addEventListener("hashchange", route);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  setLang(pickLang(), false);
  route();
})();
