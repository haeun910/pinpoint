import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadAgentPostings } from "@/lib/agent-data.ts";
import { collect, SOURCES, type CollectResult } from "@/lib/collect.ts";
import { toISODate } from "@/lib/dates.ts";
import type { Posting } from "@/lib/types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Status = Omit<CollectResult, "items">;
let cache: { time: number; results: Status[]; items: Posting[] } | null = null;
const TTL = 5 * 60 * 1000;

/** Claude가 원문을 읽고 정리해 둔 공고(data/postings.json). 파일이 없거나 깨져도 앱은 계속 동작한다. */
async function agentPostings(today: string): Promise<{ status: Status; items: Posting[] }> {
  try {
    const raw = JSON.parse(await readFile(path.join(process.cwd(), "data", "postings.json"), "utf8"));
    const r = loadAgentPostings(raw, today);
    const note = r.updatedAt ? `${r.updatedAt} 정리` : undefined;
    return { status: { source: "agent", ok: !r.error, count: r.postings.length, message: r.error ?? note }, items: r.postings };
  } catch {
    return { status: { source: "agent", ok: false, count: 0, message: "정리된 공고 파일이 없어요." }, items: [] };
  }
}

/**
 * 공고를 모은다.
 * 1) Claude가 상세 페이지까지 읽고 정리한 공고 2) 공개 목록 페이지에서 링크만 모은 공고.
 * 같은 공고(같은 id)면 1)을 쓴다. 목록 수집 결과는 성공했을 때만 서버 메모리에 5분 캐시한다.
 */
export async function GET() {
  const today = toISODate(new Date());
  const agent = await agentPostings(today);
  if (!cache || Date.now() - cache.time >= TTL) {
    const results = await Promise.all(SOURCES.map((s) => collect(s, today)));
    const fresh = { time: Date.now(), results: results.map(({ items: _items, ...rest }) => rest), items: results.flatMap((r) => r.items) };
    if (results.some((r) => r.ok)) cache = fresh;
    else return Response.json(merge(agent, fresh));
  }
  return Response.json(merge(agent, cache));
}

function merge(agent: { status: Status; items: Posting[] }, listed: { results: Status[]; items: Posting[] }) {
  const items = new Map<string, Posting>();
  for (const p of [...agent.items, ...listed.items]) if (!items.has(p.id)) items.set(p.id, p);
  return { results: [agent.status, ...listed.results], items: [...items.values()] };
}
