/**
 * data/postings.json 검사. 예약 작업이 파일을 고친 뒤 커밋 전에 꼭 돌린다.
 *   npm run check:data
 * 형식이 틀린 항목이 하나라도 있으면 어떤 항목이 왜 틀렸는지 보여주고 실패한다.
 */
import { readFileSync } from "node:fs";
import { AgentFile, AgentItem, loadAgentPostings } from "../lib/agent-data.ts";

const file = new URL("../data/postings.json", import.meta.url);
let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`data/postings.json을 읽지 못했어요: ${(e as Error).message}`);
  process.exit(1);
}
const parsed = AgentFile.safeParse(raw);
if (!parsed.success) {
  console.error("파일 형식 오류:", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  process.exit(1);
}
let bad = 0;
const seen = new Set<string>();
parsed.data.items.forEach((entry, i) => {
  const r = AgentItem.safeParse(entry);
  if (!r.success) {
    bad++;
    console.error(`items[${i}]: ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
    return;
  }
  const key = `${r.data.url}|${r.data.title}`;
  if (seen.has(key)) {
    bad++;
    console.error(`items[${i}]: 같은 공고가 두 번 있어요 (${r.data.title})`);
  }
  seen.add(key);
  if (r.data.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(r.data.deadline)) {
    bad++;
    console.error(`items[${i}]: deadline은 YYYY-MM-DD여야 해요 (${r.data.deadline})`);
  }
});
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
const r = loadAgentPostings(raw, today);
console.log(`항목 ${parsed.data.items.length}개 · 앱에 보일 공고 ${r.postings.length}개 · 마감 지남 ${r.expired}개 · 형식 오류 ${bad}개`);
process.exit(bad ? 1 : 0);
