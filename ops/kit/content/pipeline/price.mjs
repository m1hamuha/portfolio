/* What the owner pays for one batch, by the rule told before the work starts (README, section 8):
   one photo = €1, a clip up to 15 seconds without subtitles = €1, a clip with subtitles = €3 (it counts as 3 photos).
   A slideshow built from photos already paid for costs nothing extra. Prices can be changed per client: content.prices. */
export const DEFAULT_PRICES = { photo: 1, clip: 1, clip_subtitled: 3, slideshow: 0 };

export function bill(items, prices = {}) {
  const p = { ...DEFAULT_PRICES, ...prices };
  const n = { photos: 0, clips: 0, subtitled: 0, slideshows: 0 };
  for (const it of items) {
    if (it.file === "(slideshow)") n.slideshows++;
    else if (!it.video) n.photos++;
    else if (it.subtitles) n.subtitled++;
    else n.clips++;
  }
  const total = n.photos * p.photo + n.clips * p.clip + n.subtitled * p.clip_subtitled + n.slideshows * p.slideshow;
  return { ...n, prices: p, total: Math.round(total * 100) / 100 };
}
