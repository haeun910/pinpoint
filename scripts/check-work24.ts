/**
 * 고용24 키를 받은 뒤 처음 한 번 돌려서 응답 형식이 코드와 맞는지 확인한다.
 *   npm run check:work24 -- 인공지능
 * .env.local의 WORK24_API_KEY를 쓴다. 키는 화면에 찍지 않는다.
 */
import { buildUrl, parseWork24 } from "../lib/work24.ts";

const key = process.env.WORK24_API_KEY;
if (!key) {
  console.error(".env.local에 WORK24_API_KEY가 없어요.");
  process.exit(1);
}
const keyword = process.argv[2] ?? "인공지능";
const url = buildUrl(key, { keyword, display: 5 });
const r = await fetch(url);
const xml = await r.text();
console.log(`HTTP ${r.status}, 응답 앞부분:\n${xml.slice(0, 1500).replaceAll(key, "<KEY>")}\n`);
const today = new Date().toISOString().slice(0, 10);
const parsed = parseWork24(xml, today);
console.log(`총 ${parsed.total}건 중 ${parsed.postings.length}건을 읽었어요.${parsed.error ? ` 오류: ${parsed.error}` : ""}`);
for (const p of parsed.postings.slice(0, 3)) console.log(`- ${p.company} | ${p.title} | ${p.region} | 마감 ${p.deadline ?? "없음"} | ${p.url}`);
if (parsed.postings.length === 0) {
  console.log("공고를 하나도 읽지 못했어요. 위 응답의 태그 이름을 lib/work24.ts와 맞춰야 해요.");
  process.exit(1);
}
