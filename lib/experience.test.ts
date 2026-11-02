import assert from "node:assert/strict";
import { test } from "node:test";
import { type Experience, keywords, matchExperiences, toText } from "./experience.ts";
import type { Posting } from "./types.ts";

const exp = (over: Partial<Experience>): Experience => ({
  id: "e", kind: "프로젝트", title: "", period: "", role: "", skills: [], situation: "", action: "", result: "", links: "", updatedAt: "2026-11-03", ...over,
});

const posting: Posting = {
  id: "p", category: "job", title: "AI 서비스 개발자 (LLM)", company: "A", sector: "private", companyType: "스타트업",
  role: "AI 서비스 개발", region: "서울", deadline: null, employment: "정규직",
  requirements: ["Python 기반 백엔드 개발 경험", "대규모 언어 모델 활용 서비스 경험"], preferred: ["RAG 구축 경험", "React"],
  documents: [], essayQuestions: [], url: null, source: "paste", addedAt: "2026-11-03",
};

test("동의어를 하나로 묶는다", () => {
  const k = keywords("파이썬과 대규모 언어 모델, 리액트");
  assert.ok(k.has("python") && k.has("llm") && k.has("react"));
});

test("기술 스택이 겹치는 경험을 먼저 추천한다", () => {
  const rag = exp({ id: "rag", title: "사내 문서 검색 챗봇", skills: ["Python", "LLM", "RAG"], action: "검색증강 파이프라인 구현" });
  const web = exp({ id: "web", title: "동아리 홈페이지", skills: ["React"], action: "프론트엔드 구현" });
  const none = exp({ id: "none", title: "봉사활동", action: "아이들 공부 지도" });
  const r = matchExperiences(posting, [web, none, rag]);
  assert.deepEqual(r.map((m) => m.experience.id), ["rag", "web"]);
  assert.ok(r[0].matched.includes("rag"));
});

test("경험을 이력서용 글로 바꾼다", () => {
  const t = toText(exp({ title: "챗봇", period: "2025.03–06", skills: ["Python"], result: "응답 시간 40% 단축" }));
  assert.match(t, /■ 챗봇 \(프로젝트, 2025.03–06\)/);
  assert.match(t, /결과: 응답 시간 40% 단축/);
});
