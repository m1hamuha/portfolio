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

  /* Split an element's text into per-word inline-block spans so
     typography can animate word by word. Returns word count. */
  function splitWords(el, cls) {
    if (el.querySelector("." + cls)) return 0;
    var counter = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          if (parts.filter(function (p) { return p.trim(); }).length === 0) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              var w = document.createElement("span");
              w.className = cls;
              w.style.setProperty("--i", counter++);
              w.textContent = part;
              frag.appendChild(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains(cls)) {
          walk(child);
        }
      });
    }
    walk(el);
    return counter;
  }

  /* ── Hero headline: cascading word entrance ───────────────── */
  function heroWords() {
    var h1 = document.querySelector("#top h1");
    if (!h1 || framerOwned(h1)) return;
    splitWords(h1, "mx-w");
  }

  /* ── Staggered scroll reveals ─────────────────────────────── */
  function reveals() {
    var targets = [];
    var h2io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          h2io.unobserve(entry.target);
          entry.target.classList.add("mx-in");
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll(".band").forEach(function (band) {
      band.querySelectorAll("h2").forEach(function (h2) {
        if (framerOwned(h2)) return;
        /* word-by-word 3D rise instead of a block fade */
        if (splitWords(h2, "mx-w2") > 0) {
          h2.classList.add("mx-h2split");
          h2io.observe(h2);
        }
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

  /* ── Hover / in-view video previews inside the tool cards ── */
  function videoPreviews() {
    document.querySelectorAll("#work .grid-cards > *").forEach(function (card) {
      var link = card.querySelector("a[href]");
      if (!link) return;
      var m = (link.getAttribute("href") || "").match(
        /(marginpulse|invoice-autopilot|slotsaver)/
      );
      if (!m) return;
      var media = card.querySelector('div[class*="aspect-"]');
      if (!media || media.querySelector(".mx-vid")) return;

      var video = document.createElement("video");
      video.className = "mx-vid";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.setAttribute("aria-hidden", "true");
      video.setAttribute("tabindex", "-1");
      video.src = "./assets/previews/" + m[1] + ".webm";
      /* insert right after the poster img so the "Live" badge and other
         overlays in this container keep painting above the video */
      var img = media.querySelector("img");
      if (img) {
        img.insertAdjacentElement("afterend", video);
      } else {
        media.insertBefore(video, media.firstChild);
      }

      function show() {
        video.classList.add("mx-vid-on");
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      }
      function hide() {
        video.classList.remove("mx-vid-on");
        video.pause();
      }

      if (FINE) {
        card.addEventListener("pointerenter", show);
        card.addEventListener("pointerleave", hide);
      } else {
        /* touch: play while the card is mostly on screen */
        new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              en.isIntersecting ? show() : hide();
            });
          },
          { threshold: 0.55 }
        ).observe(card);
      }
    });
  }

  /* ── "How" section: line drawn through the three steps ───── */
  function howLine() {
    var grid = document.querySelector("#how .grid-cards");
    if (!grid) return;
    var svg = null;

    function build() {
      if (svg) {
        svg.remove();
        svg = null;
      }
      var cards = Array.prototype.filter.call(grid.children, function (c) {
        return !c.classList.contains("mx-howline");
      });
      if (cards.length < 2) return;
      var r0 = cards[0].getBoundingClientRect();
      var r1 = cards[1].getBoundingClientRect();
      /* only draw when the steps sit on one row (desktop layout) */
      if (Math.abs(r0.top - r1.top) > 8) return;

      if (getComputedStyle(grid).position === "static") {
        grid.style.position = "relative";
      }
      var gr = grid.getBoundingClientRect();
      var y = 52; /* through the numbered icon squares */
      var w = Math.round(gr.width);
      var NS = "http://www.w3.org/2000/svg";
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "mx-howline");
      svg.setAttribute("width", w);
      svg.setAttribute("height", "104");
      svg.setAttribute("aria-hidden", "true");
      svg.style.top = "0";
      svg.style.left = "0";
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", "M 0 " + y + " H " + w);
      svg.appendChild(path);
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", "3");
      dot.setAttribute("cy", y);
      dot.setAttribute("cx", "0");
      svg.appendChild(dot);
      grid.insertBefore(svg, grid.firstChild);
      svg.style.setProperty("--mx-len", w);

      new IntersectionObserver(
        function (entries, io) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            io.disconnect();
            svg.classList.add("mx-in");
          });
        },
        { threshold: 0.3 }
      ).observe(grid);

      /* pulse travelling along the line, only while visible */
      var visible = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          visible = en.isIntersecting;
        });
      }).observe(grid);
      var t = 0,
        lastTs = performance.now();
      (function travel(now) {
        if (!svg || !svg.isConnected) return;
        requestAnimationFrame(travel);
        if (!visible || document.hidden) {
          lastTs = now;
          return;
        }
        t = (t + (now - lastTs) / 9000) % 1;
        lastTs = now;
        var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        dot.setAttribute("cx", (ease * w).toFixed(1));
      })(performance.now());
    }

    build();
    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(build, 250);
    });
  }

  /* ── Custom cursor: instant dot + trailing ring ───────────── */
  function cursor() {
    if (!FINE) return;
    var dot = document.createElement("div");
    dot.className = "mx-cur-dot";
    dot.setAttribute("aria-hidden", "true");
    var ring = document.createElement("div");
    ring.className = "mx-cur-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var tx = -100, ty = -100, rx = -100, ry = -100, active = false;
    var INTERACTIVE =
      "a,button,[role='button'],input,textarea,select,summary,label,canvas";

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!active) {
        active = true;
        rx = tx;
        ry = ty;
        document.documentElement.classList.add("mx-cursor-on");
      }
      dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      var t = e.target;
      ring.classList.toggle(
        "mx-cur-hover",
        !!(t && t.closest && t.closest(INTERACTIVE))
      );
    });
    document.addEventListener("pointerdown", function () {
      ring.classList.add("mx-cur-down");
    });
    document.addEventListener("pointerup", function () {
      ring.classList.remove("mx-cur-down");
    });
    document.documentElement.addEventListener("pointerleave", function () {
      active = false;
      document.documentElement.classList.remove("mx-cursor-on");
    });
    (function loop() {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ── Magnetic nav links ───────────────────────────────────── */
  function magnetic() {
    if (!FINE) return;
    var links = document.querySelectorAll("header nav a, footer a[href^='mailto']");
    links.forEach(function (el) {
      if (framerOwned(el)) return;
      el.classList.add("mx-magnet");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.28;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ── Ambient drifting glow orbs ───────────────────────────── */
  function glowOrbs() {
    ["mx-orb mx-orb-a", "mx-orb mx-orb-b"].forEach(function (cls) {
      var orb = document.createElement("div");
      orb.className = cls;
      orb.setAttribute("aria-hidden", "true");
      document.body.appendChild(orb);
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

  /* ── Starfield: twinkling dust with mouse-depth parallax ──── */
  function starfield() {
    var canvas = document.createElement("canvas");
    canvas.className = "mx-stars";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stars = [], meteor = null, nextMeteor = 4000;
    var mx = 0, my = 0, pmx = 0, pmy = 0; /* mouse depth offset */

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
          z: 0.25 + Math.random() * 0.75,
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

    if (FINE) {
      document.addEventListener("pointermove", function (e) {
        mx = (e.clientX / W - 0.5) * 2;
        my = (e.clientY / H - 0.5) * 2;
      });
    }

    var last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      var dt = Math.min(now - last, 50);
      last = now;
      pmx += (mx - pmx) * 0.04;
      pmy += (my - pmy) * 0.04;
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        st.p += 0.001 * st.s * dt;
        st.x -= st.vx * (dt / 16.7);
        if (st.x < -2) st.x = W + 2;
        var a = 0.12 + 0.38 * (0.5 + 0.5 * Math.sin(st.p));
        var px = st.x - pmx * 16 * st.z;
        var py = st.y - pmy * 12 * st.z;
        ctx.beginPath();
        ctx.arc(px, py, st.r * (0.6 + st.z * 0.55), 0, 6.2832);
        ctx.fillStyle = st.warm
          ? "rgba(240,169,62," + a * 0.9 + ")"
          : "rgba(190,208,230," + a + ")";
        ctx.fill();
      }

      nextMeteor -= dt;
      if (!meteor && nextMeteor <= 0) {
        meteor = {
          x: Math.random() < 0.5 ? -60 : W * (0.3 + Math.random() * 0.6),
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

  /* ── Hero scroll choreography: content and globe part ways ── */
  function heroParallax() {
    var content = document.querySelector("#top .container-pad");
    var globe = document.querySelector("#top > div.pointer-events-none.relative");
    if (content && framerOwned(content)) content = null;
    if (globe && framerOwned(globe)) globe = null;
    if (!content && !globe) return;
    var ticking = false;
    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var y = window.scrollY;
          if (y > window.innerHeight * 1.4) return;
          if (content) {
            content.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
            content.style.opacity = Math.max(0.25, 1 - y / (window.innerHeight * 1.1));
          }
          if (globe) {
            globe.style.transform = "translate3d(0," + (y * 0.07).toFixed(1) + "px,0)";
          }
        });
      },
      { passive: true }
    );
  }

  /* ── Warm pedestal glow under the globe ───────────────────── */
  function pedestal() {
    var globe = document.querySelector("#top > div.pointer-events-none.relative");
    if (!globe || globe.querySelector(".mx-pedestal")) return;
    var el = document.createElement("div");
    el.className = "mx-pedestal";
    el.setAttribute("aria-hidden", "true");
    globe.appendChild(el);
  }

  /* ── Cinematic light beam ─────────────────────────────────── */
  function lightBeam() {
    var beam = document.createElement("div");
    beam.className = "mx-beam";
    beam.setAttribute("aria-hidden", "true");
    document.body.appendChild(beam);
  }

  /* ── Floating "book a call" pill after the hero ───────────── */
  function floatingCTA() {
    if (!document.querySelector("#contact")) return;
    var fab = document.createElement("div");
    fab.className = "mx-fab";
    var a = document.createElement("a");
    a.href = "#contact";
    a.textContent = "Book a free call";
    fab.appendChild(a);
    document.body.appendChild(fab);

    var nearContact = false;
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          nearContact = en.isIntersecting;
          update();
        });
      },
      { rootMargin: "0px 0px -20% 0px" }
    ).observe(document.querySelector("#contact"));

    function update() {
      var show = window.scrollY > window.innerHeight * 0.85 && !nearContact;
      fab.classList.toggle("mx-fab-on", show);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
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
    safe(heroWords);
    safe(reveals);
    safe(heroParallax);
    safe(pedestal);
    safe(lightBeam);
    safe(floatingCTA);
    safe(cardFX);
    safe(videoPreviews);
    safe(howLine);
    safe(cursor);
    safe(magnetic);
    safe(glowOrbs);
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
