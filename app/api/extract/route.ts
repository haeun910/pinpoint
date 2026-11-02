import Anthropic from "@anthropic-ai/sdk";
import { toISODate } from "@/lib/dates.ts";
import { ExtractError, extractPosting, toPosting } from "@/lib/extract.ts";
import { fetchPageText, MAX_TEXT } from "@/lib/fetch-page.ts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { text?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 잘못됐어요." }, { status: 400 });
  }
  const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : null;
  let text = typeof body.text === "string" ? body.text.trim() : "";

  if (!text && !url) return Response.json({ error: "공고 본문이나 링크를 넣어 주세요." }, { status: 400 });

  try {
    if (!text && url) text = await fetchPageText(url);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 422 });
  }

  const today = toISODate(new Date());
  try {
    const extracted = await extractPosting(text.slice(0, MAX_TEXT), today);
    const posting = toPosting(extracted, { id: `paste-${crypto.randomUUID()}`, url, today });
    return Response.json({ posting });
  } catch (e) {
    if (e instanceof ExtractError) return Response.json({ error: e.message }, { status: 422 });
    if (e instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "Claude API 키가 설정되지 않았거나 잘못됐어요. .env.local의 ANTHROPIC_API_KEY를 확인해 주세요." }, { status: 500 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "요청이 많아요. 잠시 뒤 다시 시도해 주세요." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      return Response.json({ error: `AI 호출에 실패했어요 (${e.status ?? "연결 오류"}).` }, { status: 502 });
    }
    return Response.json({ error: "공고를 정리하는 중에 문제가 생겼어요." }, { status: 500 });
  }
}
