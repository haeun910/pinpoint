/**
 * Claude가 공고 원문(상세 페이지)을 읽고 정리해 둔 데이터(data/postings.json)를 앱의 Posting으로 바꾼다.
 * 파일은 매일 예약 작업이 갱신한다(docs/collect-agent.md).
 * 항목 하나가 형식에 안 맞아도 나머지는 살리고, 마감이 지난 공고는 뺀다.
 */
import { z } from "zod";
import { idFor } from "./collect.ts";
import { ExtractedPosting, toPosting } from "./extract.ts";
import type { Posting } from "./types.ts";

export const AgentItem = ExtractedPosting.extend({
  sourceId: z.string().min(1).describe("수집한 곳 (contest, alio, naver, lh, youth 등)"),
  url: z.string().url().describe("원문 상세 페이지 주소. 상세 주소를 얻을 수 없으면 목록 페이지 주소"),
  summary: z.string().default("").describe("원문 기준 한두 문장 요약"),
});
export type AgentItem = z.infer<typeof AgentItem>;

export const AgentFile = z.object({
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(z.unknown()),
});

export type AgentLoad = { postings: Posting[]; invalid: number; expired: number; updatedAt: string | null; error?: string };

export function loadAgentPostings(raw: unknown, today: string): AgentLoad {
  const file = AgentFile.safeParse(raw);
  if (!file.success) return { postings: [], invalid: 0, expired: 0, updatedAt: null, error: "data/postings.json 형식이 맞지 않아요." };
  const postings = new Map<string, Posting>();
  let invalid = 0;
  let expired = 0;
  for (const entry of file.data.items) {
    const item = AgentItem.safeParse(entry);
    if (!item.success) {
      invalid++;
      continue;
    }
    const x = item.data;
    const p: Posting = {
      ...toPosting(x, { id: idFor(x.sourceId, x.url, x.title), url: x.url, today: file.data.updatedAt }),
      source: "agent",
      summary: x.summary || undefined,
      checkedAt: file.data.updatedAt,
    };
    if (p.deadline && p.deadline < today) {
      expired++;
      continue;
    }
    postings.set(p.id, p);
  }
  return { postings: [...postings.values()], invalid, expired, updatedAt: file.data.updatedAt };
}
