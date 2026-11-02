import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChecklist } from "./checklist.ts";
import type { Posting } from "./types.ts";

const base: Posting = {
  id: "p1",
  category: "job",
  title: "AI 서비스 개발자 신입",
  company: "예시랩",
  sector: "private",
  companyType: "스타트업",
  role: "AI 서비스 개발",
  region: "서울",
  deadline: "2026-11-20",
  employment: "정규직",
  requirements: [],
  preferred: [],
  documents: ["이력서", "포트폴리오"],
  essayQuestions: ["지원 동기", "가장 어려웠던 프로젝트"],
  url: null,
  source: "paste",
  addedAt: "2026-11-02",
};

test("마감일 기준으로 기한을 거꾸로 계산한다", () => {
  const list = buildChecklist(base, "2026-11-02");
  const byId = Object.fromEntries(list.map((i) => [i.id, i]));
  assert.equal(byId["resume"].due, "2026-11-13");
  assert.equal(byId["final-check"].due, "2026-11-19");
  assert.equal(byId["submit"].due, "2026-11-20");
  assert.equal(byId["qualify"].due, null);
});

test("자소서 문항마다 항목이 하나씩 생긴다", () => {
  const list = buildChecklist(base, "2026-11-02");
  assert.equal(list.filter((i) => i.id.startsWith("essay-")).length, 2);
});

test("공공기관 공고에는 직무기술서·블라인드 항목이 붙는다", () => {
  const list = buildChecklist({ ...base, sector: "public", companyType: "공공기관" }, "2026-11-02");
  assert.ok(list.some((i) => i.id === "jd"));
  assert.ok(list.some((i) => i.id === "blind"));
});

test("상시 채용은 핀한 날부터 14일을 마감으로 본다", () => {
  const list = buildChecklist({ ...base, deadline: null }, "2026-11-02");
  assert.equal(list.find((i) => i.id === "submit")?.due, "2026-11-16");
});

test("월말을 넘어가도 날짜가 맞다", () => {
  const list = buildChecklist({ ...base, deadline: "2026-12-02" }, "2026-11-02");
  assert.equal(list.find((i) => i.id === "resume")?.due, "2026-11-25");
});

test("마감이 임박한 공고는 지난 기한 대신 핀한 날을 기한으로 잡는다", () => {
  const posting = { ...base, deadline: "2026-11-04", essayQuestions: ["지원 동기"] };
  const list = buildChecklist(posting, "2026-11-02");
  const byId = Object.fromEntries(list.map((i) => [i.id, i]));
  assert.equal(byId["resume"].due, "2026-11-02");
  assert.equal(byId["essay-0"].due, "2026-11-02");
  assert.equal(byId["final-check"].due, "2026-11-03");
  assert.equal(byId["submit"].due, "2026-11-04");
});
