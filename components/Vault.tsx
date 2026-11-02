"use client";

import { useState } from "react";
import { EXPERIENCE_KINDS, type Experience, type ExperienceKind, PROMPTS, toText } from "@/lib/experience.ts";
import { Icon } from "./Icons.tsx";

type Props = {
  experiences: Experience[];
  today: string;
  onSave: (e: Experience) => void;
  onDelete: (id: string) => void;
};

const STARTERS = [
  "수업·캡스톤에서 만든 프로젝트",
  "혼자 만들어 본 서비스나 자동화 스크립트",
  "공모전·해커톤",
  "인턴·아르바이트에서 맡았던 일",
  "동아리·학회에서 맡은 역할",
  "자격증·교육 과정",
];

const empty = (today: string): Experience => ({
  id: `xp-${crypto.randomUUID()}`,
  kind: "프로젝트",
  title: "",
  period: "",
  role: "",
  skills: [],
  situation: "",
  action: "",
  result: "",
  links: "",
  updatedAt: today,
});

/** 가진 경험을 STAR(상황·한 일·결과)로 적어 두는 곳. 공고 상세에서 여기 경험을 골라 추천한다. */
export function Vault({ experiences, today, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Experience | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="vault" aria-labelledby="vaultTitle">
      <div className="sec-head">
        <div>
          <div className="eb">Experience vault</div>
          <h2 id="vaultTitle">경험 보관함</h2>
        </div>
        <div className="row-end">
          {experiences.length > 0 && (
            <button className="btn" style={{ flex: "none" }} onClick={() => copy("all", experiences.map(toText).join("\n\n"))}>
              {copied === "all" ? "복사했어요" : "전체 복사"}
            </button>
          )}
          <button className="btn primary" style={{ flex: "none" }} onClick={() => setEditing(empty(today))}>
            <Icon id="i-plus" size={14} /> 경험 추가
          </button>
        </div>
      </div>
      <p className="hint">
        가진 경험을 먼저 전부 꺼내 적어 두세요. 공고를 열면 자격요건·우대사항과 겹치는 경험을 골라 보여 드려요. 이 브라우저에만 저장돼요.
      </p>

      {editing && (
        <Editor
          key={editing.id}
          initial={editing}
          isNew={!experiences.some((x) => x.id === editing.id)}
          onCancel={() => setEditing(null)}
          onSave={(e) => {
            onSave({ ...e, updatedAt: today });
            setEditing(null);
          }}
          onDelete={() => {
            onDelete(editing.id);
            setEditing(null);
          }}
        />
      )}

      {experiences.length === 0 && !editing ? (
        <div className="empty xp-empty">
          <b>아직 적어 둔 경험이 없어요</b>
          이런 것부터 하나씩 꺼내 보세요.
          <div className="chips" style={{ justifyContent: "center", marginTop: 12 }}>
            {STARTERS.map((s) => (
              <button key={s} className="chip" onClick={() => setEditing({ ...empty(today), kind: s.includes("인턴") ? "인턴·경력" : s.includes("동아리") ? "대외활동" : s.includes("자격") ? "교육·자격" : s.includes("공모전") ? "수상" : "프로젝트" })}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="xp-list">
          {experiences.map((e) => {
            const missing = [!e.situation && "상황", !e.action && "한 일", !e.result && "결과"].filter(Boolean);
            return (
              <article key={e.id} className="xp-card">
                <div className="xp-top">
                  <span className="badge b-contest">{e.kind}</span>
                  {e.period && <span className="xp-period">{e.period}</span>}
                </div>
                <h3>{e.title || "제목 없음"}</h3>
                {e.role && <div className="xp-role">{e.role}</div>}
                {e.skills.length > 0 && (
                  <div className="chips">
                    {e.skills.map((s) => <span key={s} className="chip chip-static">{s}</span>)}
                  </div>
                )}
                {e.result && <p className="xp-result">{e.result}</p>}
                {missing.length > 0 && <p className="xp-missing">아직 비어 있어요: {missing.join(", ")}</p>}
                <div className="row-end">
                  <button className="btn" style={{ flex: "none" }} onClick={() => copy(e.id, toText(e))}>{copied === e.id ? "복사했어요" : "복사"}</button>
                  <button className="btn" style={{ flex: "none" }} onClick={() => setEditing(e)}>고치기</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Editor({ initial, isNew, onCancel, onSave, onDelete }: { initial: Experience; isNew: boolean; onCancel: () => void; onSave: (e: Experience) => void; onDelete: () => void }) {
  const [e, setE] = useState(initial);
  const [skills, setSkills] = useState(initial.skills.join(", "));
  const set = <K extends keyof Experience>(k: K, v: Experience[K]) => setE((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="xp-editor"
      onSubmit={(ev) => {
        ev.preventDefault();
        onSave({ ...e, title: e.title.trim(), skills: skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean) });
      }}
    >
      <div className="xp-grid">
        <label className="field">
          종류
          <select value={e.kind} onChange={(x) => set("kind", x.target.value as ExperienceKind)}>
            {EXPERIENCE_KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label className="field">
          기간
          <input placeholder="2025.03–2025.06" value={e.period} onChange={(x) => set("period", x.target.value)} />
        </label>
      </div>
      <label className="field">
        이름
        <input required autoFocus placeholder="예: 학과 공지 요약 챗봇" value={e.title} onChange={(x) => set("title", x.target.value)} />
      </label>
      <label className="field">
        맡은 역할
        <input placeholder="예: 4인 팀에서 백엔드와 프롬프트 설계 담당" value={e.role} onChange={(x) => set("role", x.target.value)} />
      </label>
      <label className="field">
        쓴 기술 (쉼표로 구분)
        <input placeholder="Python, FastAPI, LLM, RAG" value={skills} onChange={(x) => setSkills(x.target.value)} />
      </label>
      {(["situation", "action", "result"] as const).map((k) => (
        <label key={k} className="field">
          {k === "situation" ? "상황·문제" : k === "action" ? "내가 한 일" : "결과"}
          <span className="field-hint">{PROMPTS[k]}</span>
          <textarea rows={3} value={e[k]} onChange={(x) => set(k, x.target.value)} />
        </label>
      ))}
      <label className="field">
        링크 (GitHub, 발표 자료 등)
        <input placeholder="https://github.com/..." value={e.links} onChange={(x) => set("links", x.target.value)} />
      </label>
      <div className="row-end">
        {!isNew && (
          <button type="button" className="btn" style={{ flex: "none", marginRight: "auto" }} onClick={onDelete}>
            삭제
          </button>
        )}
        <button type="button" className="btn" style={{ flex: "none" }} onClick={onCancel}>취소</button>
        <button type="submit" className="btn primary" style={{ flex: "none" }}>저장</button>
      </div>
    </form>
  );
}
