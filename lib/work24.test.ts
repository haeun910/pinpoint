import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUrl, parseCloseDate, parseWork24 } from "./work24.ts";

// 공공데이터포털 채용정보 API의 출력 항목을 워크넷 XML 태그로 옮긴 예시. 실제 응답으로 확인 전이다.
const sample = `<?xml version="1.0" encoding="UTF-8"?>
<wantedRoot>
  <total>2</total><startPage>1</startPage><display>100</display>
  <wanted>
    <wantedAuthNo>K151612511040001</wantedAuthNo>
    <company>(주)테스트에이아이</company>
    <indTpNm>응용 소프트웨어 개발 및 공급업</indTpNm>
    <title>AI 서비스 개발자 신입 채용 &amp; 인턴</title>
    <salTpNm>연봉</salTpNm><sal>3600만원 ~ 4200만원</sal>
    <region>서울 강남구</region>
    <holidayTpNm>주5일근무</holidayTpNm>
    <minEdubg>대졸(4년)</minEdubg>
    <career>신입</career>
    <regDt>26-11-04</regDt>
    <closeDt>26-11-30</closeDt>
    <wantedInfoUrl>https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?wantedAuthNo=K151612511040001</wantedInfoUrl>
  </wanted>
  <wanted>
    <wantedAuthNo>K2</wantedAuthNo>
    <company>상시회사</company>
    <title>백엔드 개발자</title>
    <region>경기 성남시</region>
    <career>경력무관</career>
    <closeDt>채용시까지 26-12-31</closeDt>
  </wanted>
</wantedRoot>`;

test("마감일 형식을 ISO로 바꾸고 채용시 마감을 구분한다", () => {
  assert.deepEqual(parseCloseDate("26-11-30"), { deadline: "2026-11-30", rolling: false });
  assert.deepEqual(parseCloseDate("2026.12.01"), { deadline: "2026-12-01", rolling: false });
  assert.deepEqual(parseCloseDate("채용시까지"), { deadline: null, rolling: true });
  assert.equal(parseCloseDate("채용시까지 26-12-31").rolling, true);
});

test("고용24 응답을 공고로 바꾼다", () => {
  const r = parseWork24(sample, "2026-11-04");
  assert.equal(r.total, 2);
  assert.equal(r.postings.length, 2);
  const [a, b] = r.postings;
  assert.equal(a.id, "work24-K151612511040001");
  assert.equal(a.title, "AI 서비스 개발자 신입 채용 & 인턴");
  assert.equal(a.company, "(주)테스트에이아이");
  assert.equal(a.deadline, "2026-11-30");
  assert.equal(a.region, "서울 강남구");
  assert.ok(a.requirements.includes("경력: 신입"));
  assert.match(a.summary ?? "", /연봉 3600만원/);
  assert.match(a.url ?? "", /wantedAuthNo=K151612511040001/);
  assert.equal(b.url, null);
  assert.equal(b.deadlineUnknown, false);
});

test("오류 응답이면 error를 돌려준다", () => {
  const r = parseWork24("<wantedRoot><error>인증키가 유효하지 않습니다</error></wantedRoot>", "2026-11-04");
  assert.equal(r.postings.length, 0);
  assert.match(r.error ?? "", /인증키/);
});

test("요청 주소에 필수 값을 넣고 한 번에 100건까지만 요청한다", () => {
  const u = new URL(buildUrl("KEY", { keyword: "인공지능", display: 500 }));
  assert.equal(u.searchParams.get("authKey"), "KEY");
  assert.equal(u.searchParams.get("callTp"), "L");
  assert.equal(u.searchParams.get("display"), "100");
  assert.equal(u.searchParams.get("keyword"), "인공지능");
});
