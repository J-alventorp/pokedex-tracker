import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPokedexPage } from "../api/pokeApi";

const PAGE_SIZE = 151;
const MAX_DEX = 1025;

export function usePokedexEntities() {
  const [entities, setEntities] = useState([]);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("loading");
  const loadedRef = useRef(false);

  const loadPage = useCallback((nextOffset) => {
    // PokeAPI's /pokemon list runs past dex 1025 (it also enumerates alt-form
    // resources with their own sequential ids) — capping the request itself
    // keeps the last page from pulling in extra entries that would otherwise
    // get mislabeled with fake, positionally-assigned dex numbers past 1025.
    const limit = Math.min(PAGE_SIZE, MAX_DEX - nextOffset);
    if (limit <= 0) return Promise.resolve(0);
    setStatus("loading");
    return fetchPokedexPage(limit, nextOffset)
      .then((page) => {
        setEntities((prev) => [...prev, ...page]);
        setOffset(nextOffset + page.length);
        setStatus("done");
        return page.length;
      })
      .catch(() => {
        setStatus("error");
        return 0;
      });
  }, []);

  useEffect(() => {
    // loadedRef (not a cleanup-driven cancel flag) is what guards this against
    // running twice — StrictMode's dev-only mount→cleanup→mount would
    // otherwise cancel the still-wanted loop right after it starts, since refs
    // (unlike a local `cancelled` closure var) survive that simulated remount.
    if (loadedRef.current) return;
    loadedRef.current = true;
    // Auto-advance through every page on mount so the full Pokédex (up to
    // dex 1025) is available without the user having to click "Load more"
    // repeatedly — Pokémon past dex 151 were otherwise invisible until they did.
    (async () => {
      let next = 0;
      while (next < MAX_DEX) {
        const gained = await loadPage(next);
        if (!gained) break; // stop on error; "Load more" still lets them retry
        next += gained;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    entities,
    status,
    hasMore: offset < MAX_DEX,
    loadMore: () => loadPage(offset),
  };
}
