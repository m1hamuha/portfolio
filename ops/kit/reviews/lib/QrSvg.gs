/* QR code as SVG, using vendor/qrcode.js (Kazuhiko Arase, MIT). Plain script like Core.gs.
   ECC level "M" survives a little dirt on a printed card and keeps the code small. */
function qrMatrix(text, ecc) {
  var qr = qrcode(0, ecc || "M");
  qr.addData(String(text), "Byte");
  qr.make();
  var n = qr.getModuleCount(), rows = [];
  for (var r = 0; r < n; r++) { var row = []; for (var c = 0; c < n; c++) row.push(qr.isDark(r, c)); rows.push(row); }
  return rows;
}

function qrSvg(text, opts) {
  opts = opts || {};
  var m = qrMatrix(text, opts.ecc), n = m.length, q = opts.margin == null ? 4 : opts.margin, size = n + 2 * q, d = "";
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (m[r][c]) d += "M" + (c + q) + " " + (r + q) + "h1v1h-1z";
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + " " + size + '" shape-rendering="crispEdges"' +
    (opts.px ? ' width="' + opts.px + '" height="' + opts.px + '"' : "") + '><rect width="100%" height="100%" fill="#fff"/><path fill="' + (opts.color || "#000") + '" d="' + d + '"/></svg>';
}
