import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { COMPANY_TYPES, type Posting } from "./types.ts";

/** 공고 본문에서 뽑아낼 항목. 모르는 값은 지어내지 말고 null/빈 배열로 둔다. */
export const ExtractedPosting = z.object({
  title: z.string().describe("공고 제목"),
  company: z.string().describe("회사·기관 이름"),
  category: z.enum(["job", "housing", "policy", "contest"]).describe("채용=job, 청약·주거=housing, 청년 지원 정책=policy, 공모전·대외활동=contest"),
  sector: z.enum(["private", "public"]).describe("공공기관·공기업·정부면 public, 그 외 private"),
  companyType: z.enum(COMPANY_TYPES).nullable().describe("채용 공고일 때만. 본문으로 판단이 안 되면 null"),
  role: z.string().describe("직무. 없으면 빈 문자열"),
  region: z.string().describe("근무지·지역. 없으면 '원문 확인'"),
  deadline: z.string().nullable().describe("마감일 YYYY-MM-DD. 상시 채용이거나 본문에 없으면 null"),
  rolling: z.boolean().describe("상시 채용·채용 시 마감이면 true"),
  employment: z.string().describe("고용 형태(정규직, 인턴 등). 없으면 빈 문자열"),
  requirements: z.array(z.string()).describe("자격요건, 한 항목씩 짧게"),
  preferred: z.array(z.string()).describe("우대사항, 한 항목씩 짧게"),
  documents: z.array(z.string()).describe("제출 서류"),
  essayQuestions: z.array(z.string()).describe("자기소개서 문항. 글자 수 제한이 있으면 문항 끝에 괄호로"),
});
export type ExtractedPosting = z.infer<typeof ExtractedPosting>;

const SYSTEM = `너는 한국 채용·청약·청년정책·공모전 공고를 정리하는 도우미다.
사용자가 붙여넣은 공고 본문에서 정해진 항목을 뽑는다.
본문에 없는 내용은 추측하지 말고 null, 빈 문자열, 빈 배열로 둔다.
연도가 빠진 날짜는 오늘 날짜를 기준으로 가장 가까운 미래 날짜로 해석한다.`;

export class ExtractError extends Error {}

export async function extractPosting(text: string, today: string, client = new Anthropic()): Promise<ExtractedPosting> {
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: zodOutputFormat(ExtractedPosting) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `오늘 날짜: ${today}\n\n<공고>\n${text}\n</공고>`,
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new ExtractError("AI가 이 공고를 처리하지 않았어요.");
  if (response.stop_reason === "max_tokens") throw new ExtractError("공고가 너무 길어 끝까지 읽지 못했어요.");
  if (!response.parsed_output) throw new ExtractError("공고 내용을 정리하지 못했어요.");
  return response.parsed_output;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** AI가 뽑은 값을 앱의 Posting으로 바꾼다. 형식이 이상한 날짜는 버린다. */
export function toPosting(x: ExtractedPosting, opts: { id: string; url: string | null; today: string }): Posting {
  const deadline = x.deadline && ISO.test(x.deadline) ? x.deadline : null;
  return {
    id: opts.id,
    category: x.category,
    title: x.title,
    company: x.company,
    sector: x.sector,
    companyType: x.category === "job" ? x.companyType : null,
    role: x.role,
    region: x.region || "원문 확인",
    deadline,
    deadlineUnknown: deadline === null && !x.rolling,
    employment: x.employment,
    requirements: x.requirements,
    preferred: x.preferred,
    documents: x.documents,
    essayQuestions: x.essayQuestions,
    url: opts.url,
    source: "paste",
    addedAt: opts.today,
  };
}
