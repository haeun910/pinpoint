/**
 * 경험 보관함: 가진 경험을 한곳에 적어 두고, 공고마다 맞는 경험을 골라 쓴다.
 * 지금은 키워드로 고르고(API 키 없이 동작), 나중에 AI로 자소서 초안을 붙인다.
 */
import type { Posting } from "./types.ts";

export const EXPERIENCE_KINDS = ["프로젝트", "인턴·경력", "대외활동", "수상", "교육·자격", "기타"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

export type Experience = {
  id: string;
  kind: ExperienceKind;
  title: string;
  /** 예: 2025.03–2025.06 */
  period: string;
  /** 맡은 역할 */
  role: string;
  skills: string[];
  /** 상황·문제: 왜 시작했고 무엇이 어려웠나 */
  situation: string;
  /** 내가 한 일 */
  action: string;
  /** 결과: 숫자로 말할 수 있으면 숫자로 */
  result: string;
  links: string;
  updatedAt: string;
};

/** 경험을 끌어내는 질문. 빈칸 옆에 보여준다. */
export const PROMPTS: Record<"situation" | "action" | "result", string> = {
  situation: "왜 시작했나요? 어떤 문제가 있었고, 무엇이 어려웠나요?",
  action: "그중 내가 직접 한 일은 무엇인가요? 어떤 판단을 했고, 왜 그렇게 했나요?",
  result: "결과는 어땠나요? 사용자 수, 속도, 정확도, 수상처럼 숫자로 말할 수 있나요? 배운 점도 좋아요.",
};

/** 같은 뜻으로 쓰이는 말을 하나로 묶는다(소문자 기준). */
const SYNONYMS: Record<string, string> = {
  인공지능: "ai",
  머신러닝: "ml",
  "machine learning": "ml",
  딥러닝: "dl",
  "deep learning": "dl",
  "대규모 언어 모델": "llm",
  언어모델: "llm",
  "생성형 ai": "genai",
  생성형: "genai",
  파이썬: "python",
  자바스크립트: "javascript",
  js: "javascript",
  타입스크립트: "typescript",
  ts: "typescript",
  리액트: "react",
  "next.js": "nextjs",
  넥스트: "nextjs",
  노드: "node",
  "node.js": "node",
  자바: "java",
  스프링: "spring",
  데이터베이스: "db",
  database: "db",
  쿠버네티스: "kubernetes",
  k8s: "kubernetes",
  도커: "docker",
  클라우드: "cloud",
  aws: "cloud",
  gcp: "cloud",
  azure: "cloud",
  프론트엔드: "frontend",
  "front-end": "frontend",
  백엔드: "backend",
  "back-end": "backend",
  서버: "backend",
  기획: "planning",
  "서비스 기획": "planning",
  pm: "planning",
  qa: "qa",
  테스트: "qa",
  품질: "qa",
  추천: "recommendation",
  추천시스템: "recommendation",
  rag: "rag",
  검색증강: "rag",
  프롬프트: "prompt",
  데이터분석: "data",
  데이터: "data",
  분석: "data",
  sql: "sql",
  협업: "collab",
  커뮤니케이션: "collab",
  github: "git",
  깃: "git",
  git: "git",
};

/** 너무 흔해서 맞아도 의미 없는 말 */
const STOP = new Set(["및", "등", "또는", "관련", "경험", "있는", "우대", "가능", "이상", "능력", "분", "있으신", "업무", "개발", "활용", "이해", "the", "and", "or", "with", "of", "to", "in"]);

/** 글에서 비교할 단어를 뽑는다. 동의어는 하나로 묶는다. */
export function keywords(text: string): Set<string> {
  const lower = ` ${text.toLowerCase()} `;
  const out = new Set<string>();
  for (const [word, canon] of Object.entries(SYNONYMS)) {
    if (/^[a-z.\- ]+$/.test(word) ? new RegExp(`[^a-z]${word.replace(/[.\-]/g, "\\$&")}[^a-z]`).test(lower) : lower.includes(word)) out.add(canon);
  }
  for (const raw of lower.split(/[^0-9a-z가-힣+#.]+/)) {
    const w = raw.replace(/^\.+|\.+$/g, "");
    if (w.length < 2 || STOP.has(w)) continue;
    out.add(SYNONYMS[w] ?? w);
  }
  return out;
}

/** 묶은 말을 화면에 보일 이름으로 */
const LABELS: Record<string, string> = {
  ai: "AI", ml: "머신러닝", dl: "딥러닝", llm: "LLM", genai: "생성형 AI", python: "Python", javascript: "JavaScript",
  typescript: "TypeScript", react: "React", nextjs: "Next.js", node: "Node.js", java: "Java", spring: "Spring", db: "DB",
  kubernetes: "Kubernetes", docker: "Docker", cloud: "클라우드", frontend: "프론트엔드", backend: "백엔드", planning: "기획",
  qa: "QA·테스트", recommendation: "추천", rag: "RAG", prompt: "프롬프트", data: "데이터", sql: "SQL", collab: "협업", git: "Git",
};
export const label = (k: string) => LABELS[k] ?? k;

export type Match = { experience: Experience; score: number; matched: string[] };

/** 공고에 맞는 경험을 점수순으로 고른다. 기술 스택이 겹치면 가중치를 더 준다. */
export function matchExperiences(posting: Posting, experiences: Experience[], limit = 3): Match[] {
  const want = keywords([posting.title, posting.role, ...posting.requirements, ...posting.preferred].join(" "));
  if (want.size === 0) return [];
  const results: Match[] = [];
  for (const e of experiences) {
    const skills = keywords(e.skills.join(" "));
    const body = keywords([e.title, e.role, e.situation, e.action, e.result].join(" "));
    const matched = new Set<string>();
    let score = 0;
    for (const k of want) {
      if (skills.has(k)) {
        score += 3;
        matched.add(k);
      } else if (body.has(k)) {
        score += 1;
        matched.add(k);
      }
    }
    if (score > 0) results.push({ experience: e, score, matched: [...matched] });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** 내보내기·이력서용 한 덩어리 글 */
export function toText(e: Experience): string {
  return [
    `■ ${e.title} (${e.kind}${e.period ? `, ${e.period}` : ""})`,
    e.role && `역할: ${e.role}`,
    e.skills.length > 0 && `기술: ${e.skills.join(", ")}`,
    e.situation && `상황: ${e.situation}`,
    e.action && `한 일: ${e.action}`,
    e.result && `결과: ${e.result}`,
    e.links && `링크: ${e.links}`,
  ]
    .filter(Boolean)
    .join("\n");
}
