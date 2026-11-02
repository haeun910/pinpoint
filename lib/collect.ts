/**
 * 공개 채용 목록 페이지에서 공고 링크를 모으는 수집기.
 * 기존 Cloudflare Worker 버전(worker/collect.js)을 옮겨 왔다.
 * 목록에는 마감일·자격이 없으므로 지어내지 않고 deadlineUnknown으로 표시한다.
 */
import type { Category, CompanyType, Posting, Sector } from "./types.ts";

export type Source = {
  id: string;
  name: string;
  url: string;
  /** 상세 링크를 알아보는 쿼리 파라미터 (예: "annoId=") */
  match: string;
  company: string;
  category: Category;
  sector: Sector;
  companyType: CompanyType | null;
};

export const SOURCES: Source[] = [
  {
    id: "naver",
    name: "NAVER Careers",
    url: "https://recruit.navercorp.com/rcrt/list.do",
    match: "annoId=",
    company: "NAVER 계열사",
    category: "job",
    sector: "private",
    companyType: "대기업",
  },
  {
    id: "alio",
    name: "잡알리오",
    url: "https://job.alio.go.kr/recruit.do",
    match: "idx=",
    company: "공공기관",
    category: "job",
    sector: "public",
    companyType: "공공기관",
  },
  {
    id: "lh",
    name: "LH청약플러스",
    url: "https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026",
    match: "panId=",
    company: "LH",
    category: "housing",
    sector: "public",
    companyType: null,
  },
  {
    id: "youth",
    name: "청년몽땅정보통",
    url: "https://youth.seoul.go.kr/infoData/sprtInfo/list.do?key=2309130006",
    match: "sprtInfoId=",
    company: "서울시·청년센터",
    category: "policy",
    sector: "public",
    companyType: null,
  },
  {
    id: "contest",
    name: "콘테스트코리아",
    url: "https://www.contestkorea.com/sub/list.php?int_gbn=1",
    match: "str_no=",
    company: "주최기관 원문 확인",
    category: "contest",
    sector: "private",
    companyType: null,
  },
];

const REGIONS = ["서울", "경기", "부산", "대전", "대구", "인천", "광주", "울산", "세종", "제주", "강원", "충북", "충남", "전북", "전남", "경북", "경남"];

export function cleanHtml(s = ""): string {
  return s
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseList(html: string, source: Source, today: string): Posting[] {
  const results = new Map<string, Posting>();
  const origin = new URL(source.url).origin;
  const param = source.match.slice(0, -1);
  for (const a of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)) {
    const href = a[1].match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1];
    if (!href || !href.includes(source.match)) continue;
    let url: URL;
    try {
      url = new URL(href.replace(/&amp;/g, "&"), source.url);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    const key = url.searchParams.get(param);
    if (!key) continue;
    const text = cleanHtml(a[2]);
    if (text.length < 8 || text.length > 600 || /개인정보|이용약관/.test(text)) continue;
    const title = text.slice(0, 180);
    results.set(key, {
      id: `${source.id}-${key}`,
      category: source.category,
      title,
      company: source.company,
      sector: source.sector,
      companyType: source.companyType,
      role: "원문 확인",
      region: REGIONS.find((r) => title.includes(r)) ?? "원문 확인",
      deadline: null,
      deadlineUnknown: true,
      employment: "원문 확인",
      requirements: [],
      preferred: [],
      documents: [],
      essayQuestions: [],
      url: url.href,
      source: "collector",
      addedAt: today,
    });
  }
  return [...results.values()].slice(0, 40);
}

export type CollectResult = {
  source: string;
  ok: boolean;
  count: number;
  message?: string;
  items: Posting[];
};

export async function collect(source: Source, today: string): Promise<CollectResult> {
  try {
    const r = await fetch(source.url, {
      headers: { "User-Agent": "Pinpoint/0.1 (+personal job board)" },
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const items = parseList(await r.text(), source, today);
    if (!items.length) throw new Error("공고 구조 확인 필요");
    return { source: source.id, ok: true, count: items.length, items };
  } catch (e) {
    return { source: source.id, ok: false, count: 0, message: String((e as Error).message).slice(0, 100), items: [] };
  }
}

const IT_KEYWORDS = ["전산", "IT", "정보", "데이터", "AI", "인공지능", "개발", "SW", "소프트웨어", "보안", "시스템", "엔지니어", "Engineer", "Developer", "ML"];

/** IT·개발 관련 공고로 보이는지 제목으로 대략 판단한다. */
export function looksLikeTech(title: string): boolean {
  const t = title.toLowerCase();
  return IT_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}
