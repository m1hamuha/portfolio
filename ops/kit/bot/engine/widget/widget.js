/* Site chat widget. One line on the client's site:
   <script src="widget.js" data-endpoint="https://chat-engine.<account>.workers.dev/chat" data-biz="office-steuer"
           data-lang="de" data-privacy="/datenschutz" defer></script>
   No cookies, no trackers. A random session id lives in sessionStorage only. */
(function () {
  var me = document.currentScript;
  var END = me.getAttribute("data-endpoint");
  var BIZ = me.getAttribute("data-biz");
  var LANG = me.getAttribute("data-lang") || (navigator.language || "en").slice(0, 2);
  var PRIV = me.getAttribute("data-privacy") || "";
  var L = {
    de: { open: "Fragen? Termin?", ph: "Ihre Frage", send: "Senden", ai: "Automatischer Assistent. Antworten nur aus der Preisliste.", priv: "Datenschutz", name: "Ihr Name", phone: "Telefonnummer für den Rückruf", ok: "Termin buchen" },
    en: { open: "Questions? Book a call", ph: "Your question", send: "Send", ai: "Automatic assistant. Answers only from the price list.", priv: "Privacy", name: "Your name", phone: "Phone number for the call", ok: "Book" },
    ru: { open: "Вопрос? Запись", ph: "Ваш вопрос", send: "Отправить", ai: "Автоматический помощник. Отвечает только по прайсу.", priv: "Конфиденциальность", name: "Ваше имя", phone: "Телефон для звонка", ok: "Записаться" },
    uk: { open: "Питання? Запис", ph: "Ваше питання", send: "Надіслати", ai: "Автоматичний помічник. Відповідає лише за прайсом.", priv: "Конфіденційність", name: "Ваше ім'я", phone: "Телефон для дзвінка", ok: "Записатися" },
  };
  var T = L[LANG] || L.en;
  var sid = sessionStorage.getItem("chat-sid");
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("chat-sid", sid); }

  var css = ".cw-b{position:fixed;right:16px;bottom:16px;z-index:9999;border:0;border-radius:24px;padding:12px 18px;background:#1f2937;color:#fff;font:15px system-ui;cursor:pointer}" +
    ".cw-p{position:fixed;right:16px;bottom:72px;z-index:9999;width:min(360px,calc(100vw - 32px));max-height:70vh;display:none;flex-direction:column;background:#fff;color:#111;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.2);font:14px system-ui;overflow:hidden}" +
    ".cw-l{flex:1;overflow:auto;padding:12px}.cw-m{margin:6px 0;padding:8px 10px;border-radius:10px;white-space:pre-wrap;max-width:85%}" +
    ".cw-u{background:#e5e7eb;margin-left:auto}.cw-a{background:#f3f4f6}.cw-f{display:flex;border-top:1px solid #eee}.cw-f input{flex:1;border:0;padding:12px;font:inherit}" +
    ".cw-f button,.cw-s button{border:0;background:#1f2937;color:#fff;padding:8px 12px;margin:4px;border-radius:8px;cursor:pointer;font:inherit}.cw-n{font-size:12px;color:#555;padding:6px 12px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var btn = el("button", "cw-b", T.open);
  var panel = el("div", "cw-p");
  var note = el("div", "cw-n"); note.textContent = T.ai + " ";
  if (PRIV) { var a = document.createElement("a"); a.href = PRIV; a.textContent = T.priv; note.appendChild(a); }
  var log = el("div", "cw-l");
  var form = el("form", "cw-f"); var inp = document.createElement("input"); inp.placeholder = T.ph; inp.maxLength = 500;
  var sb = el("button", "", T.send); sb.type = "submit"; form.appendChild(inp); form.appendChild(sb);
  panel.appendChild(note); panel.appendChild(log); panel.appendChild(form);
  document.body.appendChild(btn); document.body.appendChild(panel);
  btn.onclick = function () { panel.style.display = panel.style.display === "flex" ? "none" : "flex"; inp.focus(); };
  form.onsubmit = function (e) { e.preventDefault(); var v = inp.value.trim(); if (!v) return; inp.value = ""; add(v, "cw-u"); send({ text: v }); };

  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt) x.textContent = txt; return x; }
  function add(text, cls) { var m = el("div", "cw-m " + cls); m.textContent = text; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }
  function send(extra) {
    var body = { biz: BIZ, session: sid, lang: LANG };
    for (var k in extra) body[k] = extra[k];
    return fetch(END, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) { (d.replies || []).forEach(function (t) { add(t, "cw-a"); }); if (d.slots && d.slots.length) slots(d.slots); })
      .catch(function () { add("...", "cw-a"); });
  }
  /* tap a time -> name and phone -> booking goes straight into the owner's calendar */
  function slots(list) {
    var box = el("div", "cw-s");
    list.forEach(function (s) {
      var b = el("button", "", s.label);
      b.onclick = function () {
        box.innerHTML = "";
        var f = el("form", "cw-f"); var n = document.createElement("input"); n.placeholder = T.name; n.required = true; n.maxLength = 80;
        var p = document.createElement("input"); p.placeholder = T.phone; p.required = true; p.type = "tel"; p.maxLength = 40;
        var ok = el("button", "", T.ok); ok.type = "submit"; f.appendChild(n); f.appendChild(p); f.appendChild(ok); box.appendChild(f); n.focus();
        f.onsubmit = function (e) { e.preventDefault(); box.remove(); add(s.label, "cw-u"); send({ action: "book", slot_index: s.index, name: n.value, phone: p.value, text: s.label }); };
      };
      box.appendChild(b);
    });
    log.appendChild(box); log.scrollTop = log.scrollHeight;
  }
})();
