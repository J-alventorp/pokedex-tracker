// Card data is bundled locally in public/data/ (see scripts/fetch-tcg-data.mjs)
// instead of being fetched live, so the app works fully offline and never
// hits the pokemontcg.io API's rate limits.
const DATA_URL = `${import.meta.env.BASE_URL}data`;

let setsPromise;
let allCardsPromise;
const cardsBySetPromiseCache = new Map();

async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load bundled data: ${path} (${res.status})`);
  return res.json();
}

export function fetchSets() {
  if (!setsPromise) setsPromise = getJson(`${DATA_URL}/sets.json`);
  return setsPromise;
}

export function fetchCardsBySet(setId) {
  if (!cardsBySetPromiseCache.has(setId)) {
    cardsBySetPromiseCache.set(setId, getJson(`${DATA_URL}/cards/${setId}.json`));
  }
  return cardsBySetPromiseCache.get(setId);
}

function getAllCards() {
  if (!allCardsPromise) allCardsPromise = getJson(`${DATA_URL}/all-cards.json`);
  return allCardsPromise;
}

export async function fetchCardsByName(name) {
  const term = name.trim().toLowerCase();
  if (!term) return [];
  const cards = await getAllCards();
  return cards
    .filter((c) => c.name.toLowerCase().startsWith(term))
    .sort((a, b) => (a.set?.releaseDate < b.set?.releaseDate ? 1 : -1))
    .slice(0, 60);
}

export async function fetchCardsByPokedexNumber(dex) {
  const cards = await getAllCards();
  return cards.filter((c) => c.nationalPokedexNumbers?.includes(dex)).slice(0, 60);
}
