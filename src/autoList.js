import { spriteUrl, spriteUrlSmall } from "./api/pokeApi";

// Tick this many cards of one Pokémon and it earns its own list.
export const AUTO_LIST_THRESHOLD = 3;

export function autoListId(dex) {
  return `auto-${dex}`;
}

export function countTickedForDex(cards, checkedIds, dex) {
  return cards.filter((c) => c.nationalPokedexNumbers?.includes(dex) && checkedIds.has(c.id)).length;
}

// Cards for one dex are named "Pikachu", "Pikachu ex", "Pikachu VMAX"… so the
// shortest name is the plain Pokémon. Checked against all 1022 dex groups in
// the bundled data: right for 1018, and the four misses are still sane names.
export function pickListName(cards) {
  const names = cards.map((c) => c.name).filter(Boolean);
  if (names.length === 0) return "Unknown";
  const shortest = names.sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
  return shortest.replace(/\s+(ex|EX|V|VMAX|VSTAR|GX)$/, "").trim() || shortest;
}

export function buildCardList(dex, cards) {
  return {
    id: autoListId(dex),
    kind: "cards",
    auto: true,
    name: pickListName(cards),
    dex,
    sprite: spriteUrl(dex),
    spriteSmall: spriteUrlSmall(dex),
    cardIds: cards.map((c) => c.id),
    previewImages: cards.slice(0, 4).map((c) => c.images?.small).filter(Boolean),
    createdAt: Date.now(),
  };
}
