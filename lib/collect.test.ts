import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanHtml, collect, looksLikeTech, parseList, SOURCES } from "./collect.ts";

const naver = SOURCES[0];

test("URL을 정리하고 중복과 다른 도메인 링크를 버린다", () => {
  const rows = parseList(
    '<a href="/rcrt/view.do?annoId=10&amp;lang=ko"><b>새로운 신입 직원 채용</b></a>' +
      '<a href="/rcrt/view.do?annoId=10">새로운 신입 직원 채용</a>' +
      '<a href="https://evil.test/x?annoId=44">외부 공고 링크입니다</a>',
    naver,
    "2026-11-02",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "naver-10");
  assert.equal(rows[0].deadline, null);
  assert.equal(rows[0].deadlineUnknown, true);
  assert.equal(rows[0].url, "https://recruit.navercorp.com/rcrt/view.do?annoId=10");
});

test("막히거나 빈 페이지에서 공고를 지어내지 않는다", () => {
  assert.deepEqual(parseList("<html>Access denied</html>", naver, "2026-11-02"), []);
});

test("스크립트 태그를 지운다", () => {
  assert.equal(cleanHtml("<script>bad()</script><b>모집</b>&amp; 지원"), "모집 & 지원");
});

test("수집 실패는 실패로 보고한다", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response("nope", { status: 503 })) as typeof fetch;
  try {
    const r = await collect(naver, "2026-11-02");
    assert.equal(r.ok, false);
    assert.equal(r.items.length, 0);
    assert.match(r.message ?? "", /503/);
  } finally {
    globalThis.fetch = original;
  }
});

test("청약·청년지원·공모전 출처도 있다", () => {
  const cats = new Set(SOURCES.map((s) => s.category));
  for (const c of ["job", "housing", "policy", "contest"]) assert.ok(cats.has(c as never));
  SOURCES.forEach((s) => assert.ok(s.url.startsWith("https://")));
});

test("IT 직무 제목을 알아본다", () => {
  assert.ok(looksLikeTech("2026 하반기 전산직 신입 채용"));
  assert.ok(looksLikeTech("AI Engineer (LLM)"));
  assert.ok(!looksLikeTech("사무행정 체험형 인턴"));
});
