import { useCallback, useEffect, useState } from "react";
import { fetchPokedexPage } from "../api/pokeApi";

const PAGE_SIZE = 151;
const MAX_DEX = 1025;

export function usePokedexEntities() {
  const [entities, setEntities] = useState([]);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState("loading");

  const loadPage = useCallback((nextOffset) => {
    setStatus("loading");
    fetchPokedexPage(PAGE_SIZE, nextOffset)
      .then((page) => {
        setEntities((prev) => [...prev, ...page]);
        setOffset(nextOffset + page.length);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    entities,
    status,
    hasMore: offset < MAX_DEX,
    loadMore: () => loadPage(offset),
  };
}
