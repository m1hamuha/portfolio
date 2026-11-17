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
    import("./scene.min.js").then(function (m) {
      var scene = m.start(host, { reduce: reduce });
      if (!scene) return;
      document.documentElement.classList.add("has-gl");
      if (hasGsap) {
        window.ScrollTrigger.create({
          trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
          onUpdate: function (s) { scene.setProgress(s.progress); },
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
