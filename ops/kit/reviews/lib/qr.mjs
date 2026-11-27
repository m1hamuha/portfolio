import vm from "node:vm";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const read = (p) => fs.readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
export const QR_SOURCE = read("../vendor/qrcode.js") + "\n" + read("./QrSvg.gs");
const ctx = vm.createContext({});
vm.runInContext(QR_SOURCE, ctx, { filename: "qr" });
export const { qrMatrix, qrSvg } = ctx;
