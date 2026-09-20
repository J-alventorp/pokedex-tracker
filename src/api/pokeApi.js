const BASE_URL = "https://pokeapi.co/api/v2";

export function spriteUrl(dex) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
}

export function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export async function fetchPokedexPage(limit, offset) {
  const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
  const json = await res.json();
  return json.results.map((entry, i) => {
    const dex = offset + i + 1;
    return { dex, name: capitalize(entry.name), sprite: spriteUrl(dex) };
  });
}

let allNamesPromise;

// One-time fetch of every Pokémon/form entry PokeAPI knows about, used to build
// bulk-selection categories (Mega, Galarian, etc.) for list creation.
export function fetchAllPokemonNames() {
  if (!allNamesPromise) {
    allNamesPromise = fetch(`${BASE_URL}/pokemon?limit=2000`)
      .then((res) => {
        if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
        return res.json();
      })
      .then((json) => json.results.map((entry) => {
        const match = entry.url.match(/\/pokemon\/(\d+)\//);
        return { name: entry.name, id: match ? Number(match[1]) : null };
      }));
  }
  return allNamesPromise;
}
