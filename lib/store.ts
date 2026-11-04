"use client";

import { useCallback, useEffect, useState } from "react";

/** localStorage에 저장되는 상태. 저장이 막힌 브라우저에서도 화면은 동작한다. */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* 저장 공간을 못 쓰면 기본값으로 */
    }
    setLoaded(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* 무시 */
        }
        return v;
      });
    },
    [key],
  );

  return [value, update, loaded] as const;
}
