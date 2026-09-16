const BASE_URL = "https://api.pokemontcg.io/v2";
const API_KEY = import.meta.env.VITE_POKEMONTCG_API_KEY;

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: API_KEY ? { "X-Api-Key": API_KEY } : {},
  });
  if (!res.ok) throw new Error(`Pokémon TCG API error: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export function fetchSets() {
  return request(`/sets?orderBy=releaseDate`);
}

export function fetchCardsBySet(setId) {
  return request(`/cards?q=${encodeURIComponent(`set.id:${setId}`)}&orderBy=number&pageSize=250`);
}

export function fetchCardsByName(name) {
  const term = name.trim().replace(/"/g, "");
  if (!term) return Promise.resolve([]);
  return request(`/cards?q=${encodeURIComponent(`name:${term}*`)}&pageSize=60&orderBy=-set.releaseDate`);
}

export function fetchCardsByPokedexNumber(dex) {
  return request(`/cards?q=${encodeURIComponent(`nationalPokedexNumbers:${dex}`)}&pageSize=60`);
}
