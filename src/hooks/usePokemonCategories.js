import { useEffect, useState } from "react";
import { capitalize, fetchAllPokemonNames, spriteUrl, spriteUrlSmall } from "../api/pokeApi";
import { formatPokemonName } from "../pokemonNames";

const MAX_BASE_DEX = 1025;

const FORM_CATEGORIES = [
  { label: "Mega", suffixes: ["-mega", "-mega-x", "-mega-y"] },
  { label: "Galarian", suffixes: ["-galar"] },
  { label: "Alolan", suffixes: ["-alola"] },
  { label: "Gigantamax", suffixes: ["-gmax"] },
];

function stripSuffix(name, suffixes) {
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) return name.slice(0, -suffix.length);
  }
  return null;
}

function buildCategories(all) {
  const idByName = new Map(all.map((e) => [e.name, e.id]));
  const categories = { "Whole Pokédex": [] };
  for (const cat of FORM_CATEGORIES) categories[cat.label] = [];

  for (const entry of all) {
    if (!entry.id) continue;
    // Check form-variant suffixes first. Only names that actually match one
    // (e.g. "charizard-mega-x") get treated as a variant — a plain species
    // name that merely happens to contain a hyphen (mr-mime, ho-oh,
    // porygon-z, tapu-koko, nidoran-m…) falls through to "Whole Pokédex"
    // below instead of being silently dropped from every category.
    let matchedForm = false;
    for (const cat of FORM_CATEGORIES) {
      const baseName = stripSuffix(entry.name, cat.suffixes);
      if (baseName === null) continue;
      const baseDex = idByName.get(baseName);
      if (!baseDex) continue;
      categories[cat.label].push({
        id: entry.name,
        dex: baseDex,
        name: capitalize(entry.name.replace(/-/g, " ")),
        sprite: spriteUrl(baseDex),
        spriteSmall: spriteUrlSmall(baseDex),
      });
      matchedForm = true;
      break;
    }
    if (matchedForm) continue;
    if (entry.id <= MAX_BASE_DEX) {
      categories["Whole Pokédex"].push({
        id: String(entry.id),
        dex: entry.id,
        name: formatPokemonName(entry.name),
        sprite: spriteUrl(entry.id),
        spriteSmall: spriteUrlSmall(entry.id),
      });
    }
  }

  return categories;
}

export function usePokemonCategories() {
  const [categories, setCategories] = useState({});
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetchAllPokemonNames()
      .then((all) => {
        if (!cancelled) {
          setCategories(buildCategories(all));
          setStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, status };
}
