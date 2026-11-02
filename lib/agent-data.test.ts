import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAgentPostings } from "./agent-data.ts";

const item = {
  sourceId: "contest",
  url: "https://www.contestkorea.com/sub/view.php?int_gbn=1&str_no=202611020012",
  title: "대국민 슬로건 공모전",
  company: "국립청주해양과학관",
  category: "contest",
  sector: "public",
  companyType: null,
  role: "아이디어·기획",
  region: "전국",
  deadline: "2026-11-15",
  rolling: false,
  employment: "누구나",
  requirements: ["대한민국 국민"],
  preferred: [],
  documents: ["응모 신청서"],
  essayQuestions: [],
  summary: "개관 기념 슬로건 공모",
};

test("Claude가 정리한 공고를 Posting으로 바꾸고 수집기와 같은 id를 쓴다", () => {
  const r = loadAgentPostings({ updatedAt: "2026-11-03", items: [item] }, "2026-11-03");
  assert.equal(r.postings.length, 1);
  const p = r.postings[0];
  assert.equal(p.id, "contest-202611020012");
  assert.equal(p.source, "agent");
  assert.equal(p.summary, "개관 기념 슬로건 공모");
  assert.equal(p.checkedAt, "2026-11-03");
  assert.equal(p.companyType, null);
});

test("형식이 틀린 항목과 마감 지난 공고는 빼고 나머지는 살린다", () => {
  const r = loadAgentPostings(
    { updatedAt: "2026-11-03", items: [item, { ...item, url: "not a url" }, { ...item, url: item.url + "9", deadline: "2026-11-01" }] },
    "2026-11-03",
  );
  assert.equal(r.postings.length, 1);
  assert.equal(r.invalid, 1);
  assert.equal(r.expired, 1);
});

test("파일 자체가 깨져 있으면 빈 목록과 오류를 돌려준다", () => {
  const r = loadAgentPostings({ nope: true }, "2026-11-03");
  assert.equal(r.postings.length, 0);
  assert.ok(r.error);
});
