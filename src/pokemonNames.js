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
  // PokeAPI names these base dex slots after their *default* form/gender —
  // e.g. dex 386 is literally "deoxys-normal", not "deoxys" — so without an
  // override they'd render as "Deoxys Normal" and read as a different,
  // extra Pokémon instead of just Deoxys.
  "deoxys-normal": "Deoxys",
  "wormadam-plant": "Wormadam",
  "giratina-altered": "Giratina",
  "shaymin-land": "Shaymin",
  "basculin-red-striped": "Basculin",
  "darmanitan-standard": "Darmanitan",
  "frillish-male": "Frillish",
  "jellicent-male": "Jellicent",
  "tornadus-incarnate": "Tornadus",
  "thundurus-incarnate": "Thundurus",
  "landorus-incarnate": "Landorus",
  "keldeo-ordinary": "Keldeo",
  "meloetta-aria": "Meloetta",
  "pyroar-male": "Pyroar",
  "meowstic-male": "Meowstic",
  "aegislash-shield": "Aegislash",
  "pumpkaboo-average": "Pumpkaboo",
  "gourgeist-average": "Gourgeist",
  "zygarde-50": "Zygarde",
  "oricorio-baile": "Oricorio",
  "lycanroc-midday": "Lycanroc",
  "wishiwashi-solo": "Wishiwashi",
  "minior-red-meteor": "Minior",
  "mimikyu-disguised": "Mimikyu",
  "toxtricity-amped": "Toxtricity",
  "eiscue-ice": "Eiscue",
  "indeedee-male": "Indeedee",
  "morpeko-full-belly": "Morpeko",
  "urshifu-single-strike": "Urshifu",
  "basculegion-male": "Basculegion",
  "enamorus-incarnate": "Enamorus",
  "oinkologne-male": "Oinkologne",
  "maushold-family-of-four": "Maushold",
  "squawkabilly-green-plumage": "Squawkabilly",
  "palafin-zero": "Palafin",
  "tatsugiri-curly": "Tatsugiri",
  "dudunsparce-two-segment": "Dudunsparce",
};

export function formatPokemonName(rawName) {
  if (!rawName) return rawName;
  const key = rawName.toLowerCase();
  if (NAME_OVERRIDES[key]) return NAME_OVERRIDES[key];
  if (!key.includes("-")) return key.charAt(0).toUpperCase() + key.slice(1);
  return key.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
