import { collect, SOURCES, type CollectResult } from "@/lib/collect.ts";
import { toISODate } from "@/lib/dates.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cache: { time: number; data: { results: Omit<CollectResult, "items">[]; items: CollectResult["items"] } } | null = null;
const TTL = 5 * 60 * 1000;

/** 공개 목록 페이지에서 공고를 모은다. 성공한 결과는 서버 메모리에 5분 캐시한다. */
export async function GET() {
  if (cache && Date.now() - cache.time < TTL) return Response.json(cache.data);
  const today = toISODate(new Date());
  const results = await Promise.all(SOURCES.map((s) => collect(s, today)));
  const items = new Map<string, CollectResult["items"][number]>();
  for (const r of results) for (const p of r.items) if (!items.has(p.id)) items.set(p.id, p);
  const data = { results: results.map(({ items: _items, ...rest }) => rest), items: [...items.values()] };
  if (results.some((r) => r.ok)) cache = { time: Date.now(), data };
  return Response.json(data);
}
