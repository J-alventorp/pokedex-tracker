// PokeAPI names are lowercase, hyphen-joined slugs. Title-casing each segment
// gets most Pokémon right, but a handful use punctuation PokeAPI can't encode
// in a slug (periods, apostrophes, colons, gender symbols) — those need an
// explicit override rather than a hyphen-to-space swap.
const NAME_OVERRIDES = {
  "mr-mime": "Mr. Mime",
  "mr-rime": "Mr. Rime",
  "mime-jr": "Mime Jr.",
  "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z",
  "type-null": "Type: Null",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "nidoran-m": "Nidoran♂",
  "nidoran-f": "Nidoran♀",
  "tapu-koko": "Tapu Koko",
  "tapu-lele": "Tapu Lele",
  "tapu-bulu": "Tapu Bulu",
  "tapu-fini": "Tapu Fini",
  "flabebe": "Flabébé",
  "farfetchd": "Farfetch'd",
  "sirfetchd": "Sirfetch'd",
};

export function formatPokemonName(rawName) {
  if (!rawName) return rawName;
  const key = rawName.toLowerCase();
  if (NAME_OVERRIDES[key]) return NAME_OVERRIDES[key];
  if (!key.includes("-")) return key.charAt(0).toUpperCase() + key.slice(1);
  return key.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
