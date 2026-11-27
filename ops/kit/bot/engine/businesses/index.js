/* Bundled configs. For a client deployment keep only that client's file here
   (or set BUSINESS_ID in wrangler.toml); the example files are fake. */
import salon from "./salon-lila.json" with { type: "json" };
import cafe from "./cafe-olive.json" with { type: "json" };
import fitness from "./fitness-move.json" with { type: "json" };
import office from "./office-steuer.json" with { type: "json" };
import shop from "./shop-eck.json" with { type: "json" };
import clinic from "./clinic-zahn.json" with { type: "json" };

export const BUSINESSES = [salon, cafe, fitness, office, shop, clinic];

export function byId(id) { return BUSINESSES.find((b) => b.id === id) || null; }
export function byPhoneNumberId(pid) { return BUSINESSES.find((b) => b.whatsapp_phone_number_id === pid) || null; }
