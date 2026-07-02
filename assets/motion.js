/* Kostin Automation — ambient motion layer.
   Runs after the React app has rendered; every effect is additive and
   defensive: elements already animated inline (Framer Motion) are skipped,
   everything is disabled under prefers-reduced-motion, and any failure in
   one effect never blocks the others. */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(pointer: fine)").matches;

  function safe(fn) {
    try {
      fn();
    } catch (e) {
      /* one broken effect must not take down the rest */
    }
  }

  /* An element whose inline style already carries transform/opacity is
     owned by Framer Motion — leave it alone. */
  function framerOwned(el) {
    return !!(el.style.transform || el.style.opacity);
  }

  /* ── Header glass ─────────────────────────────────────────── */
  function headerGlass() {
    if (!document.querySelector("header")) return;
    /* React re-renders rewrite className on nodes it owns, silently
       dropping externally added classes — so re-query and re-assert on
       every scroll instead of toggling a cached node once. */
    function update() {
      var header = document.querySelector("header");
      if (!header) return;
      header.classList.add("mx-glass-ready");
      header.classList.toggle("mx-glass", window.scrollY > 24);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Scroll progress bar ──────────────────────────────────── */
  function progressBar() {
    var bar = document.createElement("div");
    bar.className = "mx-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var ticking = false;
    function paint() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(paint);
        }
      },
      { passive: true }
    );
    paint();
  }

  /* ── Staggered scroll reveals ─────────────────────────────── */
  function reveals() {
    var targets = [];
    document.querySelectorAll(".band").forEach(function (band) {
      band.querySelectorAll("h2").forEach(function (h2) {
        if (framerOwned(h2)) return;
        targets.push(h2);
        /* underline draw, only if ::after is free */
        if (getComputedStyle(h2, "::after").content === "none") {
          h2.classList.add("mx-h2line");
        }
      });
      band.querySelectorAll(".grid-cards").forEach(function (grid) {
        var i = 0;
        Array.prototype.forEach.call(grid.children, function (card) {
          if (framerOwned(card)) return;
          card.style.transitionDelay = (i % 6) * 80 + "ms";
          card.dataset.mxDelay = "1";
          targets.push(card);
          i++;
        });
      });
    });
    if (!targets.length) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);
          el.classList.add("mx-in");
          /* once settled, hand full styling control back to the app */
          setTimeout(function () {
            el.classList.remove("mx-reveal", "mx-in");
            if (el.dataset.mxDelay) {
              el.style.transitionDelay = "";
              delete el.dataset.mxDelay;
            }
          }, 1400);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(function (el) {
      el.classList.add("mx-reveal");
      io.observe(el);
    });
  }

  /* ── Card spotlight + tilt ────────────────────────────────── */
  function cardFX() {
    var cards = document.querySelectorAll(".grid-cards > *");
    cards.forEach(function (card) {
      if (card.querySelector(".mx-glow")) return;
      card.classList.add("mx-card");
      var glow = document.createElement("div");
      glow.className = "mx-glow";
      glow.setAttribute("aria-hidden", "true");
      card.appendChild(glow);
      if (!FINE) return;

      var tiltable = !framerOwned(card);
      var lastSet = "";
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        card.style.setProperty("--mx", x + "px");
        card.style.setProperty("--my", y + "px");
        if (!tiltable) return;
        /* someone else (Framer) wrote a transform since our last frame —
           back off permanently for this card */
        if (card.style.transform && card.style.transform !== lastSet) {
          tiltable = false;
          return;
        }
        card.classList.add("mx-tilt");
        var rx = ((y / r.height) - 0.5) * -4;
        var ry = ((x / r.width) - 0.5) * 4;
        lastSet =
          "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" +
          ry.toFixed(2) + "deg) translateZ(0)";
        card.style.transform = lastSet;
      });
      card.addEventListener("pointerleave", function () {
        if (card.style.transform === lastSet) card.style.transform = "";
        lastSet = "";
      });
    });
  }

  /* ── Cursor aurora ────────────────────────────────────────── */
  function aurora() {
    if (!FINE) return;
    var orb = document.createElement("div");
    orb.className = "mx-aurora";
    orb.setAttribute("aria-hidden", "true");
    document.body.appendChild(orb);
    var tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, shown = false;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        orb.style.opacity = "0.55";
      }
    });
    document.addEventListener("pointerleave", function () {
      shown = false;
      orb.style.opacity = "0";
    });
    (function loop() {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      orb.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ── Starfield: twinkling dust + occasional shooting star ─── */
  function starfield() {
    var canvas = document.createElement("canvas");
    canvas.className = "mx-stars";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stars = [], meteor = null, nextMeteor = 4000;

    function resize() {
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round((W * H) / (FINE ? 16000 : 26000));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.4 + Math.random() * 1.1,
          p: Math.random() * Math.PI * 2,
          s: 0.4 + Math.random() * 1.1,
          warm: Math.random() < 0.22,
          vx: 0.01 + Math.random() * 0.035
        });
      }
    }
    window.addEventListener("resize", resize);
    resize();

    var last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      var dt = Math.min(now - last, 50);
      last = now;
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.p += 0.001 * st.s * dt;
        st.x -= st.vx * (dt / 16.7);
        if (st.x < -2) st.x = W + 2;
        var a = 0.12 + 0.38 * (0.5 + 0.5 * Math.sin(st.p));
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 6.2832);
        ctx.fillStyle = st.warm
          ? "rgba(240,169,62," + a * 0.9 + ")"
          : "rgba(190,208,230," + a + ")";
        ctx.fill();
      }

      nextMeteor -= dt;
      if (!meteor && nextMeteor <= 0) {
        var fromLeft = Math.random() < 0.5;
        meteor = {
          x: fromLeft ? -60 : W * (0.3 + Math.random() * 0.6),
          y: H * (0.05 + Math.random() * 0.3),
          vx: 0.55 + Math.random() * 0.35,
          vy: 0.18 + Math.random() * 0.12,
          life: 0,
          max: 900 + Math.random() * 500
        };
        nextMeteor = 6000 + Math.random() * 9000;
      }
      if (meteor) {
        meteor.life += dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        var t = meteor.life / meteor.max;
        var fade = t < 0.15 ? t / 0.15 : t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1;
        var tail = 110;
        var g = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail
        );
        g.addColorStop(0, "rgba(255,224,160," + 0.85 * fade + ")");
        g.addColorStop(1, "rgba(255,224,160,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
        ctx.stroke();
        if (t >= 1 || meteor.x > W + 80 || meteor.y > H + 80) meteor = null;
      }
    }
    requestAnimationFrame(frame);
  }

  /* ── CTA shine sweep ──────────────────────────────────────── */
  function ctaShine() {
    var links = document.querySelectorAll("a[href='#contact'], a[href^='http']");
    var done = 0;
    links.forEach(function (a) {
      if (done >= 2) return;
      if (!/book a (free )?call/i.test(a.textContent)) return;
      if (a.querySelector(".mx-shine-bar")) return;
      a.classList.add("mx-shine");
      var bar = document.createElement("span");
      bar.className = "mx-shine-bar";
      bar.setAttribute("aria-hidden", "true");
      a.appendChild(bar);
      done++;
    });
  }

  /* ── Background grid parallax ─────────────────────────────── */
  function parallax() {
    var grid = document.querySelector(".space-grid");
    if (!grid || framerOwned(grid)) return;
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          grid.style.transform =
            "translate3d(0," + (-window.scrollY * 0.05).toFixed(1) + "px,0)";
        });
      },
      { passive: true }
    );
  }

  function start() {
    safe(headerGlass);
    if (REDUCED) return;
    safe(progressBar);
    safe(reveals);
    safe(cardFX);
    safe(aurora);
    safe(starfield);
    safe(ctaShine);
    safe(parallax);
  }

  /* Wait for the React app to have rendered the landing sections.
     No timeout: on a slow connection the bundle can land well after
     this script, and the observer costs nothing while waiting. */
  if (document.querySelector("#work .grid-cards")) {
    start();
  } else {
    var mo = new MutationObserver(function () {
      if (document.querySelector("#work .grid-cards")) {
        mo.disconnect();
        start();
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
