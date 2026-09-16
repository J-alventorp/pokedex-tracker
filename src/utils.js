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
