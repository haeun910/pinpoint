"use client";

import { useEffect, useRef } from "react";
import { daysUntil, ddayLabel, formatShort } from "@/lib/dates.ts";
import { STAGES, type Pin, type Posting, type Stage } from "@/lib/types.ts";
import { Icon } from "./Icons.tsx";
import { badgeFor } from "./PostingCard.tsx";
import { useEscape } from "./useEscape.ts";

type Props = {
  posting: Posting;
  pin: Pin | undefined;
  today: string;
  onClose: () => void;
  onTogglePin: () => void;
  onToggleItem: (itemId: string) => void;
  onStage: (stage: Stage) => void;
  onDelete?: () => void;
};

export function DetailPanel({ posting: p, pin, today, onClose, onTogglePin, onToggleItem, onStage, onDelete }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // 처음 열릴 때만 포커스를 옮긴다. 체크박스를 누를 때마다 다시 그려져도 포커스가 튀지 않게.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  useEscape(onClose);

  const badge = badgeFor(p);
  const done = pin?.checklist.filter((i) => i.done).length ?? 0;
  const total = pin?.checklist.length ?? 0;
  const isJob = p.category === "job";

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby="pTitle">
        <div className="p-head">
          <div className="p-bar">
            <span className={`badge ${badge.cls}`}>{badge.label}</span>
            <button className="x" ref={closeRef} onClick={onClose} aria-label="닫기">
              <Icon id="i-x" size={16} />
            </button>
          </div>
          <h2 id="pTitle">{p.title}</h2>
          <div className="org">{p.company}{p.isSample ? " · 예시 공고" : ""}</div>
          <div className="p-dd">
            <b>{ddayLabel(p.deadline, today, p.deadlineUnknown)}</b>
            {p.deadline ? `${formatShort(p.deadline)} 마감` : p.deadlineUnknown ? "마감일은 원문에서 확인하세요" : "상시 모집"}
          </div>
        </div>

        <div className="p-body">
          <div className="p-actions">
            <button className="btn primary" aria-pressed={!!pin} onClick={onTogglePin}>
              <Icon id={pin ? "i-pin-f" : "i-pin"} size={17} />
              {pin ? "핀 해제" : isJob ? "핀하고 체크리스트 만들기" : "핀하기"}
            </button>
            {p.url ? (
              <a className="btn" href={p.url} target="_blank" rel="noreferrer">
                원문 보기 <Icon id="i-arrow" size={13} />
              </a>
            ) : (
              <button className="btn" disabled title="원문 링크가 없는 공고예요">원문 없음</button>
            )}
          </div>

          {pin && isJob && (
            <>
              <section className="p-section" aria-label="지원 단계">
                <h3>지원 단계</h3>
                <div className="stage">
                  {STAGES.map((s) => (
                    <button key={s} className="chip" aria-pressed={pin.stage === s} onClick={() => onStage(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </section>
              <section className="p-section" aria-label="체크리스트">
                <h3>
                  체크리스트 <small>{done}/{total}</small>
                </h3>
                <div className="progress" aria-hidden="true">
                  <i style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                </div>
                <ul className="checklist">
                  {pin.checklist.map((item) => {
                    const late = !item.done && item.due !== null && daysUntil(item.due, today) < 0;
                    return (
                      <li key={item.id} className={item.done ? "done" : ""}>
                        <label>
                          <input type="checkbox" checked={item.done} onChange={() => onToggleItem(item.id)} />
                          <span className="lbl">{item.label}</span>
                          {item.due && <span className={`due ${late ? "late" : ""}`}>{formatShort(item.due)}</span>}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}

          <dl>
            {p.role && (<><dt>직무</dt><dd>{p.role}</dd></>)}
            <dt>지역</dt><dd>{p.region}</dd>
            {p.employment && (<><dt>고용 형태</dt><dd>{p.employment}</dd></>)}
            {p.documents.length > 0 && (<><dt>제출 서류</dt><dd>{p.documents.join(", ")}</dd></>)}
          </dl>

          {p.requirements.length > 0 && (
            <section className="p-section">
              <h3>자격요건</h3>
              <ul className="p-list">{p.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}
          {p.preferred.length > 0 && (
            <section className="p-section">
              <h3>우대사항</h3>
              <ul className="p-list">{p.preferred.map((r) => <li key={r}>{r}</li>)}</ul>
            </section>
          )}
          {p.essayQuestions.length > 0 && (
            <section className="p-section">
              <h3>자기소개서 문항</h3>
              <ol className="p-list">{p.essayQuestions.map((r) => <li key={r}>{r}</li>)}</ol>
            </section>
          )}

          <div className="p-src">
            {p.source === "sample" && "화면을 보여주기 위한 예시 공고예요."}
            {p.source === "collector" && "공개 공고 목록에서 자동으로 모은 공고예요. 마감일과 지원 자격은 원문에서 확인하세요."}
            {p.source === "paste" && "붙여넣은 공고를 AI가 정리했어요. 중요한 내용은 원문과 한 번 더 확인하세요."}
            {onDelete && (
              <>
                {" "}
                <button className="reset" onClick={onDelete}>이 공고 삭제</button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
