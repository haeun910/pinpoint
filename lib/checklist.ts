import { addDays } from "./dates.ts";
import type { ChecklistItem, Posting } from "./types.ts";

type Step = { key: string; label: string; offset: number | null };

/**
 * 핀한 공고의 체크리스트를 만든다.
 * offset은 마감일 기준 며칠 전/후인지(음수 = 전). null이면 기한 없음.
 * 상시 채용이면 핀한 날부터 2주 안에 지원한다고 보고 기준일을 잡는다.
 * 마감이 가까워 계산한 기한이 핀한 날보다 앞서면 핀한 날로 당긴다(핀하자마자 '지연'이 뜨지 않게).
 */
export function buildChecklist(posting: Posting, pinnedOn: string): ChecklistItem[] {
  const anchor = posting.deadline ?? addDays(pinnedOn, 14);
  const steps: Step[] = [
    { key: "qualify", label: "자격요건·우대사항이 나와 맞는지 확인", offset: null },
    { key: "docs", label: `제출 서류 확인${posting.documents.length ? `: ${posting.documents.join(", ")}` : ""}`, offset: null },
  ];

  if (posting.sector === "public") {
    steps.push({ key: "jd", label: "직무기술서 읽고 내 경험과 맞춰 보기", offset: -7 });
  }

  steps.push(
    { key: "resume", label: "이 공고용 이력서 버전 만들기 (우대사항에 맞는 프로젝트를 앞으로)", offset: -7 },
    { key: "portfolio", label: "포트폴리오·GitHub README 최신화", offset: -5 },
  );

  posting.essayQuestions.forEach((q, i) => {
    steps.push({ key: `essay-${i}`, label: `자소서 ${i + 1}번 초안: ${q}`, offset: -3 });
  });

  if (posting.sector === "public") {
    steps.push({ key: "blind", label: "블라인드 위반 표현(학교명·가족 정보) 지우기", offset: -1 });
  }

  steps.push(
    { key: "final-check", label: "제출 전 점검: 파일 형식, 링크 작동, 글자 수", offset: -1 },
    { key: "submit", label: "제출하고 접수 확인 화면 저장", offset: 0 },
    { key: "coding-test", label: "코딩테스트 플랫폼·언어 확인하고 기출 유형 풀어 보기", offset: 3 },
    { key: "tech-interview", label: "내 프로젝트 기술 질문 예상 답변 정리", offset: 7 },
  );

  return steps.map((s) => ({
    id: s.key,
    label: s.label,
    due: s.offset === null ? null : laterOf(addDays(anchor, s.offset), pinnedOn),
    done: false,
  }));
}

/** ISO 날짜(YYYY-MM-DD)는 문자열 비교로 순서를 알 수 있다. */
function laterOf(a: string, b: string): string {
  return a > b ? a : b;
}
