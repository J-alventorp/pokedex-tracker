const BASE_URL = "https://pokeapi.co/api/v2";

export function spriteUrl(dex) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dex}.png`;
}

function capitalize(name) {
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
