import assert from "node:assert/strict";
import { test } from "node:test";
import { regionMatches } from "./region.ts";

test("행정구역 이름이 달라도 같은 지역으로 묶는다", () => {
  assert.ok(regionMatches("서울특별시 강남구", "서울"));
  assert.ok(regionMatches("서울 · 판교", "서울"));
  assert.ok(regionMatches("경상북도 포항시", "경북"));
  assert.ok(regionMatches("광주광역시 북구", "광주"));
  assert.ok(regionMatches("광주", "광주"));
  assert.ok(regionMatches("전국", "부산"));
  assert.ok(regionMatches("재택 근무", "온라인"));
});

test("다른 지역은 걸러 낸다", () => {
  assert.equal(regionMatches("경기 광주시", "광주"), false);
  assert.ok(regionMatches("경기 광주시", "경기"));
  assert.equal(regionMatches("부산", "서울"), false);
  assert.equal(regionMatches("원문 확인", "서울"), false);
});
