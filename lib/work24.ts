/**
 * 고용24(구 워크넷) 채용정보 Open API 연결.
 *
 * 공공데이터포털 "채용정보" API(3038225)가 밝힌 출력 항목은 구인인증번호, 회사명, 채용제목, 임금형태, 급여,
 * 근무지역, 근무형태, 최소학력, 경력, 등록일자, 마감일자, 채용정보URL 등이다. 아래 태그 이름은 이 항목에 대응하는
 * 워크넷 Open API의 XML 태그(wantedAuthNo, company, title ...)다.
 * 실제 키로 받은 응답으로 아직 확인하지 못했다. 키가 생기면 `npm run check:work24`로 먼저 확인한다.
 *
 * 키(WORK24_API_KEY)가 없으면 아무것도 부르지 않고 조용히 빠진다. 앱의 다른 기능에는 영향이 없다.
 */
import type { Posting } from "./types.ts";

export const WORK24_URL = process.env.WORK24_API_URL || "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do";

export type Work24Query = { keyword: string; display?: number; startPage?: number };

/** 요청 주소. 키는 로그에 남지 않게 따로 다룬다. */
export function buildUrl(key: string, q: Work24Query): string {
  const u = new URL(WORK24_URL);
  u.searchParams.set("authKey", key);
  u.searchParams.set("callTp", "L");
  u.searchParams.set("returnType", "XML");
  u.searchParams.set("startPage", String(q.startPage ?? 1));
  u.searchParams.set("display", String(Math.min(q.display ?? 100, 100)));
  if (q.keyword) u.searchParams.set("keyword", q.keyword);
  return u.toString();
}

function tag(xml: string, name: string): string {
  const m = xml.match(new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${name}>`));
  return m ? decode(m[1].trim()) : "";
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** "26-11-30", "2026-11-30", "채용시까지 26-11-30" 같은 마감일을 ISO로. 상시·채용시 마감이면 rolling. */
export function parseCloseDate(raw: string): { deadline: string | null; rolling: boolean } {
  const m = raw.match(/(\d{2,4})[-.](\d{1,2})[-.](\d{1,2})/);
  const rolling = /채용시|상시/.test(raw);
  if (!m) return { deadline: null, rolling };
  const year = m[1].length === 2 ? `20${m[1]}` : m[1];
  return { deadline: `${year}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`, rolling };
}

export type Work24Result = { total: number; postings: Posting[]; error?: string };

/** XML 응답을 Posting으로 바꾼다. 오류 응답(<error>나 messageCd)이면 error를 채운다. */
export function parseWork24(xml: string, today: string): Work24Result {
  const err = tag(xml, "error") || tag(xml, "message");
  const total = Number(tag(xml, "total")) || 0;
  const postings: Posting[] = [];
  for (const block of xml.match(/<wanted>[\s\S]*?<\/wanted>/g) ?? []) {
    const id = tag(block, "wantedAuthNo");
    const title = tag(block, "title");
    if (!id || !title) continue;
    const { deadline, rolling } = parseCloseDate(tag(block, "closeDt"));
    const regionRaw = tag(block, "region");
    const salary = [tag(block, "salTpNm"), tag(block, "sal")].filter(Boolean).join(" ");
    postings.push({
      id: `work24-${id}`,
      category: "job",
      title,
      company: tag(block, "company") || "원문 확인",
      sector: "private",
      companyType: null,
      role: tag(block, "jobsNm") || "",
      region: regionRaw || "원문 확인",
      deadline,
      deadlineUnknown: deadline === null && !rolling,
      employment: [tag(block, "holidayTpNm"), tag(block, "career")].filter(Boolean).join(" · "),
      requirements: [tag(block, "career") && `경력: ${tag(block, "career")}`, tag(block, "minEdubg") && `학력: ${tag(block, "minEdubg")}`].filter(Boolean) as string[],
      preferred: [],
      documents: [],
      essayQuestions: [],
      url: tag(block, "wantedInfoUrl") || tag(block, "wantedMobileInfoUrl") || null,
      source: "collector",
      summary: [tag(block, "indTpNm"), salary].filter(Boolean).join(" · ") || undefined,
      addedAt: today,
    });
  }
  return { total, postings, error: postings.length === 0 && err ? err : undefined };
}

/** 키워드마다 최대 100건씩 받는다. 키가 없으면 null(=사용 안 함). */
export async function fetchWork24(keywords: string[], today: string): Promise<{ ok: boolean; count: number; message?: string; items: Posting[] } | null> {
  const key = process.env.WORK24_API_KEY;
  if (!key) return null;
  const items = new Map<string, Posting>();
  const errors: string[] = [];
  for (const keyword of keywords) {
    try {
      const r = await fetch(buildUrl(key, { keyword, display: 100 }), { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) {
        errors.push(`${keyword}: HTTP ${r.status}`);
        continue;
      }
      const parsed = parseWork24(await r.text(), today);
      if (parsed.error) errors.push(`${keyword}: ${parsed.error}`);
      for (const p of parsed.postings) if (!items.has(p.id)) items.set(p.id, p);
    } catch (e) {
      errors.push(`${keyword}: ${(e as Error).name === "TimeoutError" ? "응답 시간 초과" : "연결 실패"}`);
    }
  }
  const list = [...items.values()].filter((p) => !p.deadline || p.deadline >= today);
  return { ok: list.length > 0 || errors.length === 0, count: list.length, message: errors.join(" / ") || undefined, items: list };
}
