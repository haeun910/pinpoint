export type Sector = "private" | "public";

export const CATEGORIES = {
  job: "채용",
  housing: "청약·주거",
  policy: "청년 지원",
  contest: "공모전",
} as const;
export type Category = keyof typeof CATEGORIES;

export const COMPANY_TYPES = [
  "대기업",
  "중견기업",
  "중소기업",
  "스타트업",
  "외국계",
  "공공기관",
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const STAGES = [
  "관심",
  "서류 준비",
  "서류 제출",
  "코딩테스트·과제",
  "면접",
  "최종 결과",
] as const;
export type Stage = (typeof STAGES)[number];

export type Posting = {
  id: string;
  category: Category;
  title: string;
  company: string;
  /** 채용 공고에만 의미가 있다 */
  sector: Sector;
  companyType: CompanyType | null;
  role: string;
  region: string;
  /** ISO 날짜(YYYY-MM-DD). null이면 상시 채용이거나 아직 확인하지 못한 것 */
  deadline: string | null;
  /** true면 마감일을 모름(목록 수집처럼 원문 확인이 필요한 경우) */
  deadlineUnknown?: boolean;
  employment: string;
  requirements: string[];
  preferred: string[];
  documents: string[];
  essayQuestions: string[];
  url: string | null;
  source: "sample" | "paste" | "collector";
  /** 예시 데이터 표시용 */
  isSample?: boolean;
  addedAt: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  /** ISO 날짜. 이 날까지 하면 됨 */
  due: string | null;
  done: boolean;
};

export type Pin = {
  postingId: string;
  stage: Stage;
  pinnedAt: string;
  checklist: ChecklistItem[];
};
