// Fetches the full Pokémon TCG dataset from pokemontcg.io and writes it to
// public/data/ as static JSON so the app never has to hit the live API.
// Run with: npm run fetch-data
// Optional: set VITE_POKEMONTCG_API_KEY (or POKEMONTCG_API_KEY) for higher rate limits.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = "https://api.pokemontcg.io/v2";
const API_KEY = process.env.POKEMONTCG_API_KEY || process.env.VITE_POKEMONTCG_API_KEY;
const REQUEST_DELAY_MS = API_KEY ? 100 : 350;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const CARDS_DIR = path.join(DATA_DIR, "cards");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestJson(url, attempt = 1) {
  const res = await fetch(url, { headers: API_KEY ? { "X-Api-Key": API_KEY } : {} });
  if ((res.status === 429 || res.status >= 500) && attempt <= 12) {
    const backoff = Math.min(1000 * attempt, 10000);
    console.warn(`  ${res.status} error, retrying in ${backoff}ms… (attempt ${attempt})`);
    await sleep(backoff);
    return requestJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`Pokémon TCG API error ${res.status} for ${url}`);
  return res.json();
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// The API's paged card endpoint can return the same card on more than one page
// (its ordering is not stable across pages), which used to leak duplicate ids
// into the bundled data and render the same card twice in the app.
function dedupeById(items) {
  const byId = new Map();
  for (const item of items) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

function trimSet(set) {
  return {
    id: set.id,
    name: set.name,
    series: set.series,
    releaseDate: set.releaseDate,
    printedTotal: set.printedTotal,
    total: set.total,
  };
}

function trimCard(card, set) {
  return {
    id: card.id,
    name: card.name,
    number: card.number,
    rarity: card.rarity,
    nationalPokedexNumbers: card.nationalPokedexNumbers || [],
    images: { small: card.images?.small, large: card.images?.large },
    set: {
      id: set.id,
      name: set.name,
      series: set.series,
      releaseDate: set.releaseDate,
      printedTotal: set.printedTotal,
    },
  };
}

async function fetchAllSets() {
  const json = await requestJson(`${BASE_URL}/sets?orderBy=releaseDate&pageSize=250`);
  return dedupeById(json.data);
}

async function fetchAllCardsForSet(setId) {
  const PAGE_SIZE = 250;
  const byId = new Map();
  let page = 1;
  for (;;) {
    await sleep(REQUEST_DELAY_MS);
    const url = `${BASE_URL}/cards?q=${encodeURIComponent(`set.id:${setId}`)}&orderBy=number&pageSize=${PAGE_SIZE}&page=${page}`;
    const json = await requestJson(url);
    const batch = json.data || [];
    const before = byId.size;
    for (const card of batch) {
      if (!byId.has(card.id)) byId.set(card.id, card);
    }
    // Stop once the API says we have everything, or a page adds nothing new
    // (which is what overlapping pages look like).
    const totalCount = typeof json.totalCount === "number" ? json.totalCount : null;
    if (batch.length === 0) break;
    if (totalCount !== null && byId.size >= totalCount) break;
    if (byId.size === before) break;
    if (batch.length < PAGE_SIZE) break;
    page += 1;
  }
  return [...byId.values()];
}

async function main() {
  await mkdir(CARDS_DIR, { recursive: true });

  console.log("Fetching set list…");
  const rawSets = await fetchAllSets();
  const sets = rawSets.map(trimSet);
  await writeFile(path.join(DATA_DIR, "sets.json"), JSON.stringify(sets));
  console.log(`  ${sets.length} sets`);

  const allCards = [];
  for (const [i, set] of rawSets.entries()) {
    const setFile = path.join(CARDS_DIR, `${set.id}.json`);
    const existing = await readJsonIfExists(setFile);
    // set.total (not printedTotal) is the API's count of every card it knows
    // about for the set, secret rares included — an existing file with fewer
    // cards than that means the set grew (or was corrected) since we last
    // fetched it, and skipping it would keep re-bundling stale, incomplete data.
    if (existing && dedupeById(existing).length >= (set.total ?? 0)) {
      const deduped = dedupeById(existing);
      if (deduped.length !== existing.length) {
        await writeFile(setFile, JSON.stringify(deduped));
        console.log(`Repaired ${set.name} (${i + 1}/${rawSets.length}) — removed ${existing.length - deduped.length} duplicate cards, ${deduped.length} left`);
      } else {
        console.log(`Skipping ${set.name} (${i + 1}/${rawSets.length}) — already fetched, ${deduped.length} cards`);
      }
      allCards.push(...deduped);
      continue;
    }
    if (existing) {
      console.log(`Refetching ${set.name} (${i + 1}/${rawSets.length}) — had ${dedupeById(existing).length}/${set.total} cards`);
    }
    console.log(`Fetching cards for ${set.name} (${i + 1}/${rawSets.length})…`);
    const rawCards = await fetchAllCardsForSet(set.id);
    const cards = rawCards.map((c) => trimCard(c, set));
    await writeFile(setFile, JSON.stringify(cards));
    allCards.push(...cards);
    console.log(`  ${cards.length} cards`);
  }

  const uniqueCards = dedupeById(allCards);
  await writeFile(path.join(DATA_DIR, "all-cards.json"), JSON.stringify(uniqueCards));

  console.log(`\nDone. ${sets.length} sets, ${uniqueCards.length} cards total.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
