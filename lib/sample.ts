import { addDays } from "./dates.ts";
import type { Posting } from "./types.ts";

/**
 * 화면을 채우기 위한 예시 공고. 실제 공고가 아니며 화면에 '예시'로 표시된다.
 * 마감일은 오늘 기준 상대 날짜로 만든다.
 */
export function samplePostings(today: string): Posting[] {
  const base = {
    requirements: [] as string[],
    preferred: [] as string[],
    documents: ["이력서", "포트폴리오"],
    essayQuestions: [] as string[],
    url: null,
    source: "sample" as const,
    isSample: true,
    addedAt: today,
  };
  const d = (n: number) => addDays(today, n);
  return [
    {
      ...base, id: "s-1", category: "job", title: "AI 서비스 개발자 (LLM 애플리케이션) 신입", company: "(예시) 루프랩",
      sector: "private", companyType: "스타트업", role: "AI 서비스 개발", region: "서울", deadline: d(5), employment: "정규직",
      requirements: ["Python 또는 TypeScript 개발 경험", "LLM API를 활용한 프로젝트 경험"],
      preferred: ["RAG·임베딩 검색 구현 경험", "프롬프트 평가 경험"],
      essayQuestions: ["지원 동기", "LLM으로 문제를 해결한 경험"],
    },
    {
      ...base, id: "s-2", category: "job", title: "2026 하반기 신입 공채 (AI/ML 엔지니어)", company: "(예시) 한빛그룹",
      sector: "private", companyType: "대기업", role: "AI/ML 엔지니어", region: "경기", deadline: d(9), employment: "정규직",
      requirements: ["학사 이상 (2027년 2월 졸업 예정 포함)", "머신러닝 기초 지식"], preferred: ["논문·대회 수상"],
      documents: ["이력서", "자기소개서", "성적증명서"],
      essayQuestions: ["입사 후 이루고 싶은 목표", "협업 중 갈등을 해결한 경험", "직무 관련 역량을 키운 경험"],
    },
    {
      ...base, id: "s-3", category: "job", title: "백엔드·AI 플랫폼 개발자 (신입~2년)", company: "(예시) 데이터웨이브",
      sector: "private", companyType: "중견기업", role: "백엔드 개발", region: "서울", deadline: d(14), employment: "정규직",
      requirements: ["Java, Python, Go 중 하나 이상"], preferred: ["클라우드 배포 경험"],
    },
    {
      ...base, id: "s-4", category: "job", title: "AI 서비스 기획·QA 인턴", company: "(예시) 스마트모먼트",
      sector: "private", companyType: "중소기업", role: "AI 서비스 기획·QA", region: "서울", deadline: d(2), employment: "인턴 (3개월)",
      requirements: ["AI 서비스에 대한 관심"], preferred: ["테스트 케이스 작성 경험"],
      essayQuestions: ["최근 써 본 AI 서비스와 개선점"],
    },
    {
      ...base, id: "s-5", category: "job", title: "체험형 청년인턴 (전산·데이터)", company: "(예시) 한국정보진흥원",
      sector: "public", companyType: "공공기관", role: "전산·데이터", region: "대전", deadline: d(4), employment: "체험형 인턴",
      requirements: ["만 34세 이하 미취업 청년"], documents: ["입사지원서", "직무기술서 확인"],
      essayQuestions: ["직무 관련 경험"],
    },
    {
      ...base, id: "s-6", category: "job", title: "Applied AI Engineer (신입 상시)", company: "(예시) Northstar Korea",
      sector: "private", companyType: "외국계", role: "AI 엔지니어", region: "서울", deadline: null, employment: "정규직",
      requirements: ["영어 커뮤니케이션"], preferred: ["오픈소스 기여"],
    },
    {
      ...base, id: "s-7", category: "housing", title: "행복주택 청년 계층 입주자 모집", company: "(예시) LH",
      sector: "public", companyType: null, role: "", region: "경기", deadline: d(6), employment: "", documents: [],
    },
    {
      ...base, id: "s-8", category: "policy", title: "청년 월세 지원 (월 최대 20만원)", company: "(예시) 국토교통부",
      sector: "public", companyType: null, role: "", region: "전국", deadline: d(20), employment: "", documents: [],
    },
    {
      ...base, id: "s-9", category: "contest", title: "생성형 AI 서비스 아이디어 해커톤", company: "(예시) 부산정보산업진흥원",
      sector: "public", companyType: null, role: "", region: "부산", deadline: d(11), employment: "", documents: [],
    },
  ];
}
