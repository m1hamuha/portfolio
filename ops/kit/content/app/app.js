/* Phone app: photos are made brighter on the phone (same curve as the laptop pipeline, ./enhance.js),
   one caption for the set comes from the Worker, saving goes through the phone's share sheet. */
import { computeParams, statsFromPixels, applyToPixels, coverBox, SIZES } from "./enhance.js";
import { T } from "./i18n.js";

const $ = (id) => document.getElementById(id);
const MAX_FILES = 10;
let token = null, me = null, t = T.ru, ready = [], videos = [];

/* The token stays in the URL on purpose: on iPhone the home-screen app has its own storage,
   separate from Safari, and starts from the URL the page had when "Add to Home Screen" was tapped.
   So the manifest has no start_url and the #t= part is not removed. If the token is still lost,
   the owner pastes the code from the WhatsApp install message (form "code"). */
export function tokenFrom(hash, stored) {
  const m = String(hash || "").match(/t=([\w-]{20,})/);
  return m ? m[1] : stored || null;
}

function readToken() {
  const t0 = tokenFrom(location.hash, localStorage.getItem("photoapp.token"));
  if (t0) localStorage.setItem("photoapp.token", t0);
  return t0;
}

function askCode() {
  $("pick").hidden = true;
  $("codeForm").hidden = false;
  $("codeLabel").textContent = t.code;
  $("codeGo").textContent = t.codeGo;
  $("codeGo").onclick = () => {
    const v = tokenFrom("t=" + $("codeIn").value.trim().replace(/^.*#t=/, ""), null);
    if (!v) return;
    localStorage.setItem("photoapp.token", v);
    location.hash = "t=" + v;
    location.reload();
  };
}

async function api(path, body) {
  const r = await fetch(path, { method: body ? "POST" : "GET", headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, data: await r.json().catch(() => ({})) };
}

function say(s) { $("msg").textContent = s || ""; }

function texts() {
  $("pickLabel").textContent = t.pick;
  $("note").placeholder = t.note;
  $("save").textContent = t.save;
  $("copy").textContent = t.copy;
  $("clip").textContent = t.clip;
  $("saveClip").textContent = t.saveClip;
  $("again").textContent = t.again;
}

const canvasToBlob = (c, type = "image/jpeg", q = 0.9) => new Promise((res) => c.toBlob(res, type, q));

/* one photo -> enhanced 4:5 JPEG File plus a small copy for the caption model */
export async function enhanceFile(file, niche) {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { w, h } = SIZES.feed;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const b = coverBox(bmp.width, bmp.height, w, h);
  ctx.drawImage(bmp, b.sx, b.sy, b.sw, b.sh, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const st = statsFromPixels(img.data, 4, 4);
  applyToPixels(img.data, computeParams(st.hist, st.means, niche));
  ctx.putImageData(img, 0, 0);
  const blob = await canvasToBlob(c);
  const small = document.createElement("canvas");
  small.width = 614; small.height = 768;
  small.getContext("2d").drawImage(c, 0, 0, 614, 768);
  const smallUrl = small.toDataURL("image/jpeg", 0.8);
  const name = `photo-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}.jpg`;
  return { file: new File([blob], name, { type: "image/jpeg" }), url: URL.createObjectURL(blob), small: smallUrl.split(",")[1], canvas: c, bmp };
}

async function onFiles(list) {
  let files = [...list];
  if (files.length > MAX_FILES) { files = files.slice(0, MAX_FILES); alert(t.max); }
  videos = files.filter((f) => f.type.startsWith("video/"));
  const photos = files.filter((f) => f.type.startsWith("image/"));
  $("pick").hidden = true;
  say(t.working);
  ready = [];
  for (const f of photos) {
    try { ready.push(await enhanceFile(f, me.niche)); } catch (e) { console.warn("skip", f.name, e); }
  }
  $("grid").innerHTML = "";
  for (const r of ready) { const im = new Image(); im.src = r.url; $("grid").append(im); }
  $("result").hidden = false;
  $("save").hidden = !ready.length;
  $("clip").hidden = !ready.length && !videos.length;
  $("caption").value = "";
  if (!ready.length) { say(""); return; }
  say(t.writing);
  const { status, data } = await api("/api/caption", { images: ready.slice(0, 3).map((r) => ({ media_type: "image/jpeg", data: r.small })), note: $("note").value });
  if (status === 429) say(t.limit);
  else if (status !== 200 || !data.caption) say(t.noText);
  else {
    $("caption").value = [data.caption, (data.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
    say(data.problems && data.problems.length ? t.check + " " + data.problems.join("; ") : "");
  }
}

async function share(files) {
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files }); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  for (const f of files) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f); a.download = f.name; a.click();
  }
}

/* short clip: photos crossfading (2.5 s each), or the first 15 s of a video with a light filter. Silent. */
async function makeClip() {
  $("clip").disabled = true;
  say(t.clipWorking);
  const W = 720, H = 1280, fps = 30;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
  if (!type) { say("MediaRecorder?"); $("clip").disabled = false; return; }
  const rec = new MediaRecorder(c.captureStream(fps), { mimeType: type, videoBitsPerSecond: 5_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((res) => (rec.onstop = res));
  const draw = (src, sw, sh, alpha = 1) => { const b = coverBox(sw, sh, W, H); ctx.globalAlpha = alpha; ctx.drawImage(src, b.sx, b.sy, b.sw, b.sh, 0, 0, W, H); ctx.globalAlpha = 1; };
  rec.start(200);
  if (ready.length) {
    const each = 2500, fade = 500, total = ready.length * each;
    const t0 = performance.now();
    await new Promise((res) => {
      const tick = () => {
        const el = performance.now() - t0;
        if (el >= total) return res();
        const i = Math.min(Math.floor(el / each), ready.length - 1), into = el - i * each;
        draw(ready[i].canvas, ready[i].canvas.width, ready[i].canvas.height);
        if (into > each - fade && ready[i + 1]) draw(ready[i + 1].canvas, ready[i + 1].canvas.width, ready[i + 1].canvas.height, (into - (each - fade)) / fade);
        requestAnimationFrame(tick);
      };
      tick();
    });
  } else {
    const v = document.createElement("video");
    v.src = URL.createObjectURL(videos[0]); v.muted = true; v.playsInline = true;
    await v.play();
    if ("filter" in ctx) ctx.filter = "brightness(1.08) contrast(1.05) saturate(1.05)";
    await new Promise((res) => {
      const tick = () => { if (v.ended || v.currentTime >= 15) return res(); draw(v, v.videoWidth, v.videoHeight); requestAnimationFrame(tick); };
      tick();
    });
    v.pause();
  }
  rec.stop();
  await done;
  const ext = type.includes("mp4") ? "mp4" : "webm";
  const file = new File([new Blob(chunks, { type: type.split(";")[0] })], `clip-${Date.now()}.${ext}`, { type: type.split(";")[0] });
  $("clipView").src = URL.createObjectURL(file);
  $("clipView").hidden = false;
  $("saveClip").hidden = false;
  $("saveClip").onclick = () => share([file]);
  $("clip").disabled = false;
  say("");
}

async function start() {
  token = readToken();
  const lang = (navigator.language || "ru").slice(0, 2);
  t = T[lang] || T.ru;
  texts();
  if (!token) { askCode(); return; }
  const { status, data } = await api("/api/me");
  if (status === 401) { localStorage.removeItem("photoapp.token"); say(t.bad); askCode(); return; }
  if (status !== 200) { say(t.bad); $("pick").hidden = true; return; }
  me = data;
  t = T[me.ui_language] || t;
  texts();
  $("title").textContent = me.name;
  $("files").onchange = (e) => onFiles(e.target.files);
  $("save").onclick = () => { say(t.saveHint); share(ready.map((r) => r.file)); };
  $("copy").onclick = async () => { await navigator.clipboard.writeText($("caption").value); say(t.copied); };
  $("clip").onclick = makeClip;
  $("again").onclick = () => { $("result").hidden = true; $("pick").hidden = false; $("files").value = ""; $("clipView").hidden = true; $("saveClip").hidden = true; say(""); };
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

if (typeof document !== "undefined") start();
