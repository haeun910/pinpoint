/** 화면 전체에서 쓰는 SVG 아이콘 묶음. 한 번 그려 두고 <use>로 가져다 쓴다. */
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-pin" viewBox="0 0 24 24">
        <path d="M12 2.5c-4.1 0-7.3 3.2-7.3 7.2 0 5.4 7.3 11.8 7.3 11.8s7.3-6.4 7.3-11.8c0-4-3.2-7.2-7.3-7.2z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="9.8" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </symbol>
      <symbol id="i-pin-f" viewBox="0 0 24 24">
        <path d="M12 2.5c-4.1 0-7.3 3.2-7.3 7.2 0 5.4 7.3 11.8 7.3 11.8s7.3-6.4 7.3-11.8c0-4-3.2-7.2-7.3-7.2z" fill="currentColor" />
        <circle cx="12" cy="9.8" r="2.6" fill="var(--surface)" />
      </symbol>
      <symbol id="i-grid" viewBox="0 0 24 24">
        <rect x="4" y="4" width="7" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="7" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </symbol>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </symbol>
      <symbol id="i-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </symbol>
      <symbol id="i-stack" viewBox="0 0 24 24">
        <path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z M3.5 12l8.5 4.5 8.5-4.5 M3.5 16l8.5 4.5 8.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8.5 12.2l2.4 2.4 4.6-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24">
        <path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </symbol>
      <symbol id="i-x" viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </symbol>
    </svg>
  );
}

export function Icon({ id, size = 18 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} aria-hidden="true">
      <use href={`#${id}`} />
    </svg>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 30) / 26} viewBox="0 0 26 30" aria-hidden="true">
      <path d="M13 1C6.4 1 1 6.2 1 12.6 1 21.4 13 29 13 29s12-7.6 12-16.4C25 6.2 19.6 1 13 1z" fill="var(--pin)" />
      <circle cx="13" cy="12.4" r="4.4" fill="var(--surface)" />
    </svg>
  );
}
