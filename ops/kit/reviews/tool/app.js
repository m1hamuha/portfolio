/* UI of review-kit.html. Core.gs and the QR code are inlined before this file by build.mjs --app. */
(function () {
  function $(id) { return document.getElementById(id); }
  function bizFromForm() {
    var link = $("link").value.trim();
    var langs = Array.prototype.slice.call(document.querySelectorAll(".langs input:checked")).map(function (i) { return i.value; });
    var tone = {}; langs.forEach(function (l) { tone[l] = $("tone").value; });
    var biz = { name: $("name").value.trim() || "?", niche: $("niche").value, color: $("color").value, signature: $("sig").value.trim(), langs: langs.length ? langs : ["de"], tone: tone };
    if (/^https?:\/\//.test(link)) biz.review_url = link; else biz.place_id = link;
    biz.lang = biz.langs[0];
    return biz;
  }
  function card(biz, lang, url, svg) {
    var t = cardTexts(biz, lang);
    return '<div class="card" lang="' + lang + '"><div><h1>' + escapeHtml(t.title) + '</h1><div class="biz">' + escapeHtml(biz.name) + "</div></div>" +
      '<div class="stars">☆☆☆☆☆</div>' + svg + '<div class="scan">' + escapeHtml(t.scan) + '</div><div class="url">' + escapeHtml(t.or) + ": " + escapeHtml(url) + "</div></div>";
  }
  function printPage(biz, url, svg) {
    var cards = [0, 1, 2, 3].map(function (i) { return card(biz, biz.langs[i % biz.langs.length], url, svg); }).join("");
    var st = ""; for (var i = 0; i < 8; i++) { var l = biz.langs[i % biz.langs.length]; st += '<div class="sticker">' + svg + "<b>" + escapeHtml(cardTexts(biz, l).title) + "</b></div>"; }
    return "<!doctype html><html><head><meta charset=utf-8><title>" + escapeHtml(biz.name) + "</title><style>" + PRINT_CSS + "</style></head><body style=\"--c:" + escapeHtml(biz.color) + "\"><div class=sheet>" + cards + "</div><div class=stickers>" + st + "</div></body></html>";
  }
  function download(name, text, type) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; a.click();
  }
  $("go").onclick = function () {
    var biz = bizFromForm(), url;
    try { url = reviewUrl(biz); } catch (e) { $("result").innerHTML = '<p class="warn">Нужна ссылка на отзыв или Place ID.</p>'; return; }
    var svg = qrSvg(url);
    var texts = biz.langs.map(function (l) {
      var t = askText(biz, { lang: l }), p = lintAsk(t);
      return "<h3>" + l + "</h3><pre>" + escapeHtml(t) + "</pre>" +
        '<a href="https://wa.me/?text=' + encodeURIComponent(t) + '" target="_blank" rel="noopener">Открыть в WhatsApp</a>' +
        (p.length ? '<p class="warn">' + escapeHtml(p.map(function (x) { return x.why; }).join("; ")) + "</p>" : "");
    }).join("");
    $("result").innerHTML = '<fieldset class="out"><div class="qr">' + svg + '<button id="dl">QR .svg</button><button id="pr">Печать A4</button></div><div><p><b>Ссылка:</b> <a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">' + escapeHtml(url) + "</a></p>" + texts + "</div></fieldset>";
    $("dl").onclick = function () { download("qr-review.svg", qrSvg(url, { px: 1000 }), "image/svg+xml"); };
    $("pr").onclick = function () { var w = window.open(""); w.document.write(printPage(biz, url, svg)); w.document.close(); w.focus(); w.print(); };
  };
})();
