/* Motion layer: the Three.js hero scene (loaded after the page, never blocks it) and
   GSAP ScrollTrigger for scroll-driven, film-like moves. Without WebGL or GSAP the page
   simply stays static. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var host = document.getElementById("gl");
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    document.documentElement.classList.add("has-gsap");
  }

  /* 3D hero: load after first paint */
  function loadScene() {
    if (!host) return;
    /* fixed full-screen background */
    import("./scene.min.js").then(function (m) {
      var scene = m.start(host, { reduce: reduce });
      if (!scene) return;
      document.documentElement.classList.add("has-gl");
      /* the scene sits behind the whole site: bright on the first screen, dim behind content,
         and on a business page the camera flies to that business's node */
      var NICHES = ["salon", "cleaning", "cafe", "shop", "clinic", "trades", "fitness", "office", "other"];
      var bg = document.getElementById("gl");
      function dim(v) { bg.style.setProperty("--gl", String(v)); }
      function sync() {
        var h = location.hash, nm = h.match(/^#\/for\/([a-z]+)$/), sv = /^#\/[a-z]+$/.test(h);
        if (nm) { scene.focus(NICHES.indexOf(nm[1])); dim(0.75); }
        else if (sv) { scene.focus(-1); dim(0.35); }
        else { scene.focus(-1); dim(1); }
      }
      window.addEventListener("hashchange", sync);
      sync();
      if (hasGsap) {
        window.ScrollTrigger.create({
          trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
          onUpdate: function (s) { scene.setProgress(s.progress); if (!/^#\//.test(location.hash)) dim(1 - s.progress * 0.65); },
        });
      }
    }).catch(function () {});
  }
  if ("requestIdleCallback" in window) window.requestIdleCallback(loadScene, { timeout: 1200 });
  else setTimeout(loadScene, 300);

  if (!hasGsap || reduce) return;
  var gsap = window.gsap;

  /* the hero text drifts up and fades as the camera flies into the core */
  gsap.to(".hero > .wrap:first-of-type", {
    yPercent: -35, opacity: 0.15, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  /* the road between the three steps is drawn by the scroll itself */
  var road = document.querySelector(".road__p");
  if (road) {
    gsap.fromTo(road, { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, ease: "none",
      scrollTrigger: { trigger: ".roadmap", start: "top 85%", end: "bottom 40%", scrub: true },
    });
  }

  /* the turnkey block slides in like a title card */
  gsap.from(".custom-sec .custom", {
    scale: 0.92, opacity: 0, duration: 1, ease: "expo.out",
    scrollTrigger: { trigger: ".custom-sec", start: "top 85%" },
  });

  /* service and niche pages appear with a short camera-like move */
  window.addEventListener("hashchange", function () {
    var sec = document.querySelector(".svc:not([hidden])");
    if (!sec) { window.ScrollTrigger.refresh(); return; }
    gsap.fromTo(sec.querySelectorAll(".svc__head, .lead, .example"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "expo.out" });
    gsap.fromTo(sec.querySelectorAll(".car__track"), { x: 120, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "expo.out", delay: 0.1 });
  });
})();
