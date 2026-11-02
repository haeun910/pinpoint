import { cleanHtml } from "./collect.ts";

/** 공고 링크로 본문을 가져온다. 내부망 주소는 막고, 길이는 잘라서 돌려준다. */
export function isAllowedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) return false; // IP 주소 직접 입력 금지
  return true;
}

export const MAX_TEXT = 30_000;

export async function fetchPageText(raw: string): Promise<string> {
  if (!isAllowedUrl(raw)) throw new Error("이 주소는 열 수 없어요.");
  const r = await fetch(raw, {
    headers: { "User-Agent": "Pinpoint/0.1 (+personal job board)" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`페이지를 열지 못했어요 (HTTP ${r.status}).`);
  if (r.url && !isAllowedUrl(r.url)) throw new Error("이 주소는 열 수 없어요.");
  const text = cleanHtml(await r.text());
  if (text.length < 50) throw new Error("페이지에서 공고 내용을 찾지 못했어요. 본문을 직접 붙여넣어 주세요.");
  return text.slice(0, MAX_TEXT);
}
