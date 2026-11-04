"use client";

import { useEffect, useRef, useState } from "react";
import { formatShort } from "@/lib/dates.ts";
import { CATEGORIES, type Posting } from "@/lib/types.ts";
import { badgeFor } from "./PostingCard.tsx";
import { useEscape } from "./useEscape.ts";

type Props = {
  onClose: () => void;
  onSave: (posting: Posting, pin: boolean) => void;
};

/** 공고 링크나 본문을 붙여넣으면 AI가 정리하고, 확인한 뒤 저장한다. */
export function AddDialog({ onClose, onSave }: Props) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Posting | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  // 처음 열릴 때만 포커스를 옮긴다. 체크박스를 누를 때마다 다시 그려져도 포커스가 튀지 않게.
  // 뒤쪽 화면은 Board에서 inert로 막는다.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    firstRef.current?.focus();
    return () => before?.focus?.(); // 닫으면 열기 전에 있던 자리로 포커스를 돌려준다
  }, []);
  useEscape(onClose);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, text }),
      });
      const data = (await r.json()) as { posting?: Posting; error?: string };
      if (!r.ok || !data.posting) throw new Error(data.error ?? "공고를 정리하지 못했어요.");
      setDraft(data.posting);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="addTitle" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="dialog-box">
          <h2 id="addTitle">공고 추가</h2>
          {!draft ? (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p className="hint">사람인, 잡코리아, 회사 채용 페이지 어디든 괜찮아요. 링크만 넣어도 되지만, 페이지가 열리지 않는 곳이 많아서 본문을 복사해 붙여넣는 게 가장 정확해요.</p>
              <label className="field" htmlFor="add-url">
                공고 링크
                <input id="add-url" ref={firstRef} type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
              </label>
              <label className="field" htmlFor="add-text">
                공고 본문
                <textarea id="add-text" placeholder="공고 페이지의 내용을 통째로 복사해 붙여넣어 주세요." value={text} onChange={(e) => setText(e.target.value)} />
              </label>
              {error && <div className="err" role="alert">{error}</div>}
              <div className="row-end">
                <button type="button" className="btn" onClick={onClose} style={{ flex: "none" }}>취소</button>
                <button type="submit" className="btn primary" disabled={busy || (!url.trim() && !text.trim())} style={{ flex: "none" }}>
                  {busy ? "AI가 정리하는 중…" : "AI로 정리하기"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="hint">AI가 정리한 내용이에요. 맞는지 확인하고 저장하세요.</p>
              <div className="preview">
                <span className={`badge ${badgeFor(draft).cls}`} style={{ alignSelf: "flex-start" }}>{badgeFor(draft).label}</span>
                <b style={{ fontSize: 16 }}>{draft.title}</b>
                <dl>
                  <dt>회사·기관</dt><dd>{draft.company}</dd>
                  <dt>분류</dt><dd>{CATEGORIES[draft.category]}{draft.companyType ? ` · ${draft.companyType}` : ""}</dd>
                  <dt>마감</dt><dd>{draft.deadline ? formatShort(draft.deadline) : draft.deadlineUnknown ? "본문에서 찾지 못함" : "상시"}</dd>
                  {draft.role && (<><dt>직무</dt><dd>{draft.role}</dd></>)}
                  {draft.documents.length > 0 && (<><dt>제출 서류</dt><dd>{draft.documents.join(", ")}</dd></>)}
                  {draft.essayQuestions.length > 0 && (<><dt>자소서 문항</dt><dd>{draft.essayQuestions.length}개</dd></>)}
                </dl>
              </div>
              <div className="row-end">
                <button className="btn" onClick={() => setDraft(null)} style={{ flex: "none" }}>다시 하기</button>
                <button className="btn" onClick={() => onSave(draft, false)} style={{ flex: "none" }}>저장만</button>
                <button className="btn primary" onClick={() => onSave(draft, true)} style={{ flex: "none" }}>저장하고 핀하기</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
