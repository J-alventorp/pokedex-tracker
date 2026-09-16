import { useEffect, useState } from "react";

function replacer(_key, value) {
  if (value instanceof Set) return { __isSet: true, values: [...value] };
  return value;
}

function reviver(_key, value) {
  if (value && typeof value === "object" && value.__isSet) return new Set(value.values);
  return value;
}

export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return typeof initialValue === "function" ? initialValue() : initialValue;
      return JSON.parse(raw, reviver);
    } catch {
      return typeof initialValue === "function" ? initialValue() : initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state, replacer));
    } catch {
      // storage full or unavailable — collection state just won't persist this time
    }
  }, [key, state]);

  return [state, setState];
}
