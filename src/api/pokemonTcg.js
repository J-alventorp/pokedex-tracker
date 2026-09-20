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

// The upstream API has handed us overlapping pages before, so the same card id
// could appear twice in a set. Guard here too: a duplicate id would otherwise
// render the same card twice and break React's keys.
function dedupeById(cards) {
  const byId = new Map();
  for (const card of cards) {
    if (!byId.has(card.id)) byId.set(card.id, card);
  }
  return [...byId.values()];
}

export function fetchSets() {
  if (!setsPromise) setsPromise = getJson(`${DATA_URL}/sets.json`);
  return setsPromise;
}

export function fetchCardsBySet(setId) {
  if (!cardsBySetPromiseCache.has(setId)) {
    cardsBySetPromiseCache.set(setId, getJson(`${DATA_URL}/cards/${setId}.json`).then(dedupeById));
  }
  return cardsBySetPromiseCache.get(setId);
}

function getAllCards() {
  if (!allCardsPromise) allCardsPromise = getJson(`${DATA_URL}/all-cards.json`).then(dedupeById);
  return allCardsPromise;
}

export async function fetchCardsByName(name) {
  const term = name.trim().toLowerCase();
  if (!term) return [];
  const cards = await getAllCards();
  return cards
    .filter((c) => c.name.toLowerCase().startsWith(term))
    .sort((a, b) => (a.set?.releaseDate < b.set?.releaseDate ? 1 : -1))
    .slice(0, 120);
}

export async function fetchCardsByPokedexNumber(dex) {
  const cards = await getAllCards();
  return cards.filter((c) => c.nationalPokedexNumbers?.includes(dex)).slice(0, 60);
}

// Same filter as fetchCardsByPokedexNumber but without the 60-card cap — an
// auto-list has to hold every printing (Pikachu alone has 211).
export async function fetchAllCardsByPokedexNumber(dex) {
  const cards = await getAllCards();
  return cards.filter((c) => c.nationalPokedexNumbers?.includes(dex));
}

let cardsByIdPromise;

function getCardsById() {
  if (!cardsByIdPromise) {
    cardsByIdPromise = getAllCards().then((cards) => new Map(cards.map((c) => [c.id, c])));
  }
  return cardsByIdPromise;
}

// Resolves a saved list's card ids back into card objects, dropping any id the
// bundled data no longer knows about.
export async function fetchCardsByIds(ids) {
  const byId = await getCardsById();
  return ids.map((id) => byId.get(id)).filter(Boolean);
}
