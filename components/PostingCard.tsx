import { daysUntil, ddayLabel, formatShort } from "@/lib/dates.ts";
import { CATEGORIES, type Posting } from "@/lib/types.ts";
import { Icon } from "./Icons.tsx";

export const BADGE: Record<Posting["category"], string> = {
  job: "b-job",
  housing: "b-house",
  policy: "b-policy",
  contest: "b-contest",
};

export function badgeFor(p: Posting): { cls: string; label: string } {
  if (p.category === "job") {
    return p.sector === "public"
      ? { cls: "b-job-pub", label: "공공기관 채용" }
      : { cls: "b-job", label: p.companyType ? `${p.companyType} 채용` : "채용" };
  }
  return { cls: BADGE[p.category], label: CATEGORIES[p.category] };
}

export function ddClass(p: Posting, today: string): string {
  if (p.deadline === null) return p.deadlineUnknown ? "" : "always";
  const n = daysUntil(p.deadline, today);
  if (n === 0) return "today";
  if (n > 0 && n <= 7) return "soon";
  return "";
}

type Props = {
  posting: Posting;
  today: string;
  pinned: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
};

export function PostingCard({ posting: p, today, pinned, onOpen, onTogglePin }: Props) {
  const badge = badgeFor(p);
  const summary = [...p.requirements.slice(0, 2), ...p.preferred.slice(0, 1)].join(" · ");
  return (
    <article
      className="card"
      tabIndex={0}
      aria-label={p.title}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="c-top">
        <span>
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
          {p.isSample && <span className="tag-sample">예시</span>}
          {p.source === "collector" && <span className="tag-collected">자동 수집</span>}
          {p.source === "agent" && <span className="tag-collected tag-agent">AI 정리</span>}
        </span>
        <button
          className="pinbtn"
          aria-pressed={pinned}
          aria-label={pinned ? "핀 해제" : "핀하기"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
        >
          <Icon id={pinned ? "i-pin-f" : "i-pin"} size={20} />
        </button>
      </div>
      <div className="c-org">{p.company}</div>
      <h3>{p.title}</h3>
      <div className="c-meta">
        <span>{p.region}</span>
        {p.role && <span>{p.role}</span>}
        {p.employment && <span>{p.employment}</span>}
      </div>
      {summary || p.summary ? (
        <div className="c-sum">{summary || p.summary}</div>
      ) : (
        p.source === "collector" && <div className="c-sum">목록에서 모은 공고예요. 마감일과 자격은 원문에서 확인하세요.</div>
      )}
      <div className="c-foot">
        <span className={`dd ${ddClass(p, today)}`}>
          <b>{ddayLabel(p.deadline, today, p.deadlineUnknown)}</b>
          {p.deadline ? `${formatShort(p.deadline)}까지` : p.deadlineUnknown ? "원문 확인" : "언제든 지원"}
        </span>
        <span className="more">
          자세히 보기
          <Icon id="i-arrow" size={13} />
        </span>
      </div>
    </article>
  );
}
