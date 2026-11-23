/* fx/hero.js: the pain-then-result picture next to the home headline.
   One customer message with its time (salon reply bot, from content.js through i18n), under it a
   short loss tag in the loss colour ("No reply until midnight"). Then one lime sweep turns the loss
   tag into the reply, and the picture holds there. Plays once, after the fonts, only while visible.
   Reduced motion: the final frame (message and reply), still.
   The markup (.hchat) is in index.html with data-i18n, so a language switch needs nothing here.
   This file only places it ([picture] [headline + question]) and runs the one story. */
(function () {
  "use strict";
  if (window.__fxHero) return;
  window.__fxHero = true;

  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  function reduced() { return !!(mq && mq.matches); }

  var h1 = document.querySelector(".hero h1");
  var pic = document.querySelector(".hero .hchat");
  if (!h1 || !pic || !h1.parentNode) return;

  /* ---------- layout: [picture] [headline + question]; on a phone: headline, picture, question ---------- */
  var ask = document.querySelector(".hero__ask");
  var row = document.createElement("div");
  row.className = "fxh";
  var txt = document.createElement("div");
  txt.className = "fxh__t";
  h1.parentNode.insertBefore(row, h1);
  row.appendChild(pic);
  row.appendChild(txt);
  txt.appendChild(h1);
  if (ask && ask.parentNode === row.parentNode) txt.appendChild(ask);

  var wait = pic.querySelector(".hchat__wait"), out = pic.querySelector(".hchat__out"), sweep = pic.querySelector(".hchat__sweep");
  var gsap = window.gsap;
  var tl = null, started = false, done = false, seen = false, io = null;

  function finalFrame() {
    if (tl) { tl.kill(); tl = null; }
    done = true;
    if (gsap) gsap.killTweensOf([wait, out, sweep]);
    [wait, out, sweep].forEach(function (e) { e.removeAttribute("style"); });
    pic.classList.remove("is-start");
    pic.classList.add("is-done");
    try { window.dispatchEvent(new CustomEvent("fx:hero", { detail: { done: true } })); } catch (e) {}
  }

  function build() {
    /* after the page has faded in (0.8s): 0.3s the tag appears, 1.3s it waits, 0.6s one sweep, then it holds */
    var t = gsap.timeline({ paused: true, onComplete: finalFrame });
    t.fromTo(wait, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 0.8);
    t.set(sweep, { opacity: 1, left: "0%" }, 2.4);
    t.to(sweep, { left: "100%", duration: 0.6, ease: "power1.inOut" }, 2.4);
    t.fromTo(wait, { clipPath: "inset(0 0 0 0%)" }, { clipPath: "inset(0 0 0 100%)", duration: 0.6, ease: "power1.inOut" }, 2.4);
    t.fromTo(out, { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power1.inOut" }, 2.4);
    t.set(sweep, { opacity: 0 }, 3.0);
    return t;
  }

  function visible() { return !document.hidden && seen && !document.getElementById("home").hidden; }
  function sync() {
    if (!tl || done) return;
    if (visible()) tl.play(); else tl.pause();
  }
  function start() {
    if (started || done) return;
    started = true;
    if (reduced() || !gsap) { finalFrame(); return; }
    tl = build();
    sync();
  }

  if (reduced() || !gsap) { finalFrame(); return; }

  /* first frame: the message alone, nothing below it yet */
  pic.classList.add("is-start");

  function arm() {
    if (done) return;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          seen = e.isIntersecting && e.intersectionRatio >= 0.6;
          if (seen) start();
          sync();
        });
      }, { threshold: [0, 0.6, 1] });
      io.observe(pic);
    } else { seen = true; start(); }
  }
  var fr = document.fonts && document.fonts.ready;
  if (fr && fr.then) fr.then(arm, arm); else arm();

  document.addEventListener("visibilitychange", sync);
  if (mq) {
    var onMq = function () { if (reduced()) finalFrame(); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }
  /* leaving home ends the story: back home, the final frame waits */
  window.addEventListener("vf:route", function () {
    var home = document.getElementById("home");
    if (home && home.hidden && started && !done) finalFrame();
  });
})();
