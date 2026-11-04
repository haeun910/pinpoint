"use client";

import { useEffect, useRef } from "react";

/** Esc를 누르면 닫는다. 부모가 매번 새 콜백을 넘겨도 리스너를 다시 달지 않는다. */
export function useEscape(onClose: () => void) {
  const latest = useRef(onClose);
  latest.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
}
