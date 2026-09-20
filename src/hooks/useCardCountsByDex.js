import { useEffect, useState } from "react";
import { getCardCountsByDex } from "../api/pokemonTcg";

// Empty until the bundled data resolves — tiles just show no badge until then.
export function useCardCountsByDex() {
  const [counts, setCounts] = useState(new Map());

  useEffect(() => {
    let cancelled = false;
    getCardCountsByDex().then((c) => {
      if (!cancelled) setCounts(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
}
