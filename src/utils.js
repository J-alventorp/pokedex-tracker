export function getProgressColor(pct) {
  const hue = Math.min(pct, 100) * 1.2;
  return `hsl(${hue}, 78%, 46%)`;
}

export function getPepText(pct) {
  if (pct >= 100) return "Collection complete! 🎉";
  if (pct >= 75) return "Almost legendary!";
  if (pct >= 50) return "Halfway there!";
  if (pct >= 25) return "Nice start!";
  return "Let's catch 'em all!";
}

export function rarityBadge(rarity = "") {
  const r = rarity.toLowerCase();
  if (r.includes("secret") || r.includes("rainbow") || r.includes("hyper")) return "✦✦";
  if (r.includes("ultra") || r.includes("full art") || r.includes("vmax") || r.includes("gx")) return "✦";
  if (r.includes("holo") || r.includes("rare")) return "★";
  if (r.includes("uncommon")) return "◆";
  return "●";
}

export function isHoloRarity(rarity = "") {
  return /holo|rare|ultra|secret|gx|vmax|rainbow/i.test(rarity);
}

// Ordered rarest → most common, based on the rarity strings present in the bundled card data.
const RARITY_ORDER = [
  "Hyper Rare",
  "Special Illustration Rare",
  "Illustration Rare",
  "Rare Rainbow",
  "Rare Secret",
  "Shiny Ultra Rare",
  "Rare Shiny GX",
  "Rare Shiny",
  "Ultra Rare",
  "Rare Ultra",
  "Mega Hyper Rare",
  "Rare Holo VSTAR",
  "Holo Rare VSTAR",
  "Rare Holo VMAX",
  "Holo Rare VMAX",
  "Rare Holo V",
  "Holo Rare V",
  "Rare Holo GX",
  "Rare Holo EX",
  "Rare Holo ex",
  "Rare Holo LV.X",
  "Rare Holo Star",
  "Rare Prism Star",
  "Rare BREAK",
  "Rare Prime",
  "Rare ACE",
  "ACE SPEC Rare",
  "Radiant Rare",
  "Amazing Rare",
  "Double Rare",
  "Black White Rare",
  "Classic Collection",
  "LEGEND",
  "Trainer Gallery Rare Holo",
  "Pikachu Rare",
  "Futuristic Rare",
  "Rare Holo",
  "Rare Shining",
  "Rare",
  "Promo",
  "Uncommon",
  "Common",
];

export function rarityRank(rarity = "") {
  const idx = RARITY_ORDER.indexOf(rarity);
  if (idx === -1) return 0;
  return RARITY_ORDER.length - idx;
}

// Coarse buckets used to pick a card tile's gradient border. Kept separate from
// rarityRank so the visual tiers stay readable even when new rarity strings
// appear in freshly bundled sets.
export function rarityTier(rarity = "") {
  const r = rarity.toLowerCase();
  if (!r) return "common";
  if (/hyper|rainbow|secret|special illustration/.test(r)) return "secret";
  if (/ultra|full art|vmax|vstar|gx|\bex\b|illustration|double rare|shiny/.test(r)) return "ultra";
  if (/holo|legend|prime|break|amazing|radiant|prism|ace|pikachu rare|futuristic|shining|rare/.test(r)) return "rare";
  if (/uncommon/.test(r)) return "uncommon";
  return "common";
}
