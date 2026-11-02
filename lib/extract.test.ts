import { test } from "node:test";
import assert from "node:assert/strict";
import { ExtractedPosting, toPosting } from "./extract.ts";
import { isAllowedUrl } from "./fetch-page.ts";

const sample: ExtractedPosting = {
  title: "AI 서비스 개발자",
  company: "예시랩",
  category: "job",
  sector: "private",
  companyType: "스타트업",
  role: "AI 서비스 개발",
  region: "",
  deadline: "2026-11-20",
  rolling: false,
  employment: "정규직",
  requirements: ["Python"],
  preferred: [],
  documents: ["이력서"],
  essayQuestions: ["지원 동기 (500자)"],
};

test("스키마가 정상 값을 받아들인다", () => {
  assert.ok(ExtractedPosting.safeParse(sample).success);
});

test("빈 지역은 '원문 확인'으로 바꾼다", () => {
  const p = toPosting(sample, { id: "x", url: null, today: "2026-11-02" });
  assert.equal(p.region, "원문 확인");
  assert.equal(p.deadline, "2026-11-20");
  assert.equal(p.deadlineUnknown, false);
});

test("형식이 틀린 날짜는 버리고 '일정 확인'으로 표시한다", () => {
  const p = toPosting({ ...sample, deadline: "11월 20일" }, { id: "x", url: null, today: "2026-11-02" });
  assert.equal(p.deadline, null);
  assert.equal(p.deadlineUnknown, true);
});

test("상시 채용은 일정 미확인이 아니다", () => {
  const p = toPosting({ ...sample, deadline: null, rolling: true }, { id: "x", url: null, today: "2026-11-02" });
  assert.equal(p.deadlineUnknown, false);
});

test("채용이 아니면 기업 유형을 비운다", () => {
  const p = toPosting({ ...sample, category: "contest" }, { id: "x", url: null, today: "2026-11-02" });
  assert.equal(p.companyType, null);
});

test("내부망·IP 주소는 막는다", () => {
  assert.ok(isAllowedUrl("https://recruit.navercorp.com/rcrt/view.do?annoId=1"));
  assert.ok(!isAllowedUrl("http://localhost:3000"));
  assert.ok(!isAllowedUrl("http://169.254.169.254/latest"));
  assert.ok(!isAllowedUrl("http://[::1]/"));
  assert.ok(!isAllowedUrl("file:///etc/passwd"));
});
