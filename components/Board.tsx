"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildChecklist } from "@/lib/checklist.ts";
import { looksLikeTech } from "@/lib/collect.ts";
import { addDays, daysUntil, toISODate } from "@/lib/dates.ts";
import { REGION_OPTIONS, regionMatches } from "@/lib/region.ts";
import { samplePostings } from "@/lib/sample.ts";
import { useStoredState } from "@/lib/store.ts";
import { CATEGORIES, COMPANY_TYPES, type Category, type CompanyType, type Pin, type Posting, type Sector } from "@/lib/types.ts";
import { AddDialog } from "./AddDialog.tsx";
import { DetailPanel } from "./DetailPanel.tsx";
import { Icon, IconSprite, Logo } from "./Icons.tsx";
import { MapCanvas } from "./MapCanvas.tsx";
import { BADGE, PostingCard } from "./PostingCard.tsx";

type View = "all" | Category | "pins";
type SourceStatus = { source: string; ok: boolean; count: number; message?: string };

const SOURCE_NAMES: Record<string, string> = {
  naver: "NAVER Careers",
  alio: "잡알리오",
  lh: "LH청약플러스",
  youth: "청년몽땅정보통",
  contest: "콘테스트코리아",
};
const PRIVATE_TYPES = COMPANY_TYPES.filter((t) => t !== "공공기관");
const WD = "일월화수목금토";

export function Board() {
  const [today, setToday] = useState<string | null>(null);
  // 날짜는 브라우저에서 정한다. 탭을 밤새 열어 두거나 다음 날 다시 돌아와도 오늘 날짜를 다시 잡는다.
  useEffect(() => {
    const refresh = () => setToday(toISODate(new Date()));
    refresh();
    const timer = setInterval(refresh, 60_000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      removeEventListener("focus", refresh);
    };
  }, []);
  if (!today) return <IconSprite />;
  return <BoardInner today={today} />;
}

function BoardInner({ today }: { today: string }) {
  const [saved, setSaved] = useStoredState<Posting[]>("pinpoint.postings.v1", []);
  const [pins, setPins] = useStoredState<Pin[]>("pinpoint.pins.v1", []);
  const [showSamples, setShowSamples] = useStoredState<boolean>("pinpoint.showSamples", true);
  const [collected, setCollected] = useState<Posting[]>([]);
  const [statuses, setStatuses] = useState<SourceStatus[] | null>(null);

  const [view, setView] = useState<View>("all");
  const [sector, setSector] = useState<Sector | "all">("all");
  const [types, setTypes] = useState<CompanyType[]>([]);
  const [techOnly, setTechOnly] = useState(false);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [weekOnly, setWeekOnly] = useState(false);
  const [sort, setSort] = useState<"deadline" | "new">("deadline");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/collect")
      .then((r) => r.json())
      .then((d: { results: SourceStatus[]; items: Posting[] }) => {
        if (!alive) return;
        setStatuses(d.results);
        setCollected(d.items);
      })
      .catch(() => alive && setStatuses([]));
    return () => {
      alive = false;
    };
  }, []);

  const all = useMemo(() => {
    const map = new Map<string, Posting>();
    for (const p of [...saved, ...collected, ...(showSamples ? samplePostings(today) : [])]) if (!map.has(p.id)) map.set(p.id, p);
    // 핀한 공고는 목록에서 사라졌어도 남긴다
    return [...map.values()];
  }, [saved, collected, showSamples, today]);

  const pinMap = useMemo(() => new Map(pins.map((p) => [p.postingId, p])), [pins]);
  const isOpenDeadline = (p: Posting) => p.deadline === null || daysUntil(p.deadline, today) >= 0;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, job: 0, housing: 0, policy: 0, contest: 0 };
    for (const p of all) if (isOpenDeadline(p)) {
      c.all++;
      c[p.category]++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, today]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = all.filter((p) => {
      if (view === "pins" ? !pinMap.has(p.id) : !isOpenDeadline(p)) return false;
      if (view !== "all" && view !== "pins" && p.category !== view) return false;
      if (view === "job") {
        if (sector !== "all" && p.sector !== sector) return false;
        if (types.length && (!p.companyType || !types.includes(p.companyType))) return false;
        if (techOnly && !looksLikeTech(`${p.title} ${p.role}`)) return false;
      }
      if (!regionMatches(p.region, region)) return false;
      if (weekOnly && (p.deadline === null || daysUntil(p.deadline, today) > 7)) return false;
      if (needle && ![p.title, p.company, p.role, p.region, ...p.requirements, ...p.preferred].join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
    rows.sort(
      sort === "new"
        ? (a, b) => b.addedAt.localeCompare(a.addedAt)
        : (a, b) => (a.deadline ?? "9999") .localeCompare(b.deadline ?? "9999"),
    );
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, view, sector, types, techOnly, region, weekOnly, q, sort, pinMap, today]);

  const togglePin = useCallback(
    (p: Posting) =>
      setPins((prev) =>
        prev.some((x) => x.postingId === p.id)
          ? prev.filter((x) => x.postingId !== p.id)
          : [...prev, { postingId: p.id, stage: "관심", pinnedAt: today, checklist: p.category === "job" ? buildChecklist(p, today) : [] }],
      ),
    [setPins, today],
  );

  // 핀한 공고가 목록에서 사라지지 않도록 공고 내용도 저장해 둔다
  const keep = useCallback((p: Posting) => setSaved((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev])), [setSaved]);

  const open = openId ? all.find((p) => p.id === openId) : undefined;
  const weekDays = Array.from({ length: 8 }, (_, n) => addDays(today, n));
  const urgent = all.filter((p) => p.deadline && daysUntil(p.deadline, today) >= 0 && daysUntil(p.deadline, today) <= 7);
  const pinnedJobs = pins.filter((pin) => all.find((p) => p.id === pin.postingId)?.category === "job");
  const openTodos = pinnedJobs.reduce((n, pin) => n + pin.checklist.filter((i) => !i.done).length, 0);

  const navMain: [View, string, string, number | null][] = [
    ["all", "i-grid", "모든 공고", counts.all],
    ["pins", "i-pin", "핀한 공고", pins.length],
  ];
  const crumb = view === "all" ? "모든 공고" : view === "pins" ? "핀한 공고" : CATEGORIES[view];

  return (
    <>
      <IconSprite />
      {/* 상세 패널이나 공고 추가 창이 열려 있으면 뒤쪽 화면은 포커스도 클릭도 받지 않게 한다 */}
      <div className="app" inert={!!open || adding}>
        <aside className="side" aria-label="메뉴">
          <a className="logo" href="#" aria-label="핀포인트 홈" onClick={() => setView("all")}>
            <Logo />
            <b>pinpoint<i>.</i></b>
          </a>
          <button className="btn-add" onClick={() => setAdding(true)}>
            <Icon id="i-plus" size={16} /> 공고 추가
          </button>
          <div>
            <div className="nav-label">My</div>
            <nav className="nav">
              {navMain.map(([k, icon, label, n]) => (
                <button key={k} aria-current={view === k} onClick={() => setView(k)}>
                  <span className="ico"><Icon id={icon} /></span>
                  {label}
                  <span className="cnt">{n}</span>
                </button>
              ))}
            </nav>
          </div>
          <div>
            <div className="nav-label">Discover</div>
            <nav className="nav">
              {(Object.keys(CATEGORIES) as Category[]).map((c) => (
                <button key={c} aria-current={view === c} onClick={() => setView(c)}>
                  <span className="ico"><span className={`dot ${BADGE[c]}`} style={{ background: "currentColor" }} /></span>
                  {CATEGORIES[c]}
                  <span className="cnt">{counts[c]}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="side-card">
            <strong>핀하면<br />할 일이 생겨요.</strong>
            <p>채용 공고를 핀하면 마감일에 맞춰 서류·자소서·코테 준비 체크리스트를 만들어 드려요.</p>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <a className="logo m-logo" href="#" aria-label="핀포인트 홈" onClick={() => setView("all")}>
              <Logo size={22} />
              <b>pinpoint<i>.</i></b>
            </a>
            <div className="crumb">핀포인트 <span>/</span> <b>{crumb}</b></div>
            <div className="top-r">
              <label className="check" htmlFor="samples">
                <input type="checkbox" id="samples" checked={showSamples} onChange={(e) => setShowSamples(e.target.checked)} />
                예시 공고 보기
              </label>
              <button className="btn-add top-add" onClick={() => setAdding(true)}>
                <Icon id="i-plus" size={14} /> 추가
              </button>
            </div>
          </header>
          <nav className="m-nav" aria-label="보기 선택">
            {navMain.map(([k, , label, n]) => (
              <button key={k} className="chip" aria-current={view === k} onClick={() => setView(k)}>
                {label} <span className="cnt">{n}</span>
              </button>
            ))}
            {(Object.keys(CATEGORIES) as Category[]).map((c) => (
              <button key={c} className="chip" aria-current={view === c} onClick={() => setView(c)}>
                {CATEGORIES[c]} <span className="cnt">{counts[c]}</span>
              </button>
            ))}
          </nav>

          <div className="content">
            {view === "all" && (
              <section className="hero">
                <div className="hero-txt">
                  <div className="eyebrow">YOUR OPPORTUNITY MAP</div>
                  <h1>흩어진 기회,<br />핀 하나로 <em>콕</em> 집어두기.</h1>
                  <p>채용 공고를 모아 보고, 마음에 드는 공고를 핀하면 마감일에 맞춰 할 일을 챙겨 드려요. 청약·청년 지원·공모전도 함께 볼 수 있어요.</p>
                  <div className="flow"><span>찾거나 붙여넣고</span><i>→</i><span>핀하고</span><i>→</i><span>체크리스트대로 준비</span></div>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <MapCanvas />
                </div>
              </section>
            )}

            <section className="stats" aria-label="요약">
              <Stat icon="i-stack" tone="ink" label="볼 수 있는 공고" value={counts.all} />
              <Stat icon="i-clock" tone="pin" label="7일 안에 마감" value={urgent.length} />
              <Stat icon="i-pin" tone="house" label="핀한 공고" value={pins.length} />
              <Stat icon="i-check" tone="job" label="남은 할 일" value={openTodos} />
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 14 }} aria-labelledby="weekTitle">
              <div className="sec-head">
                <div><div className="eb">This week</div><h2 id="weekTitle">놓치면 아쉬운 <em>7일</em> 마감 일정</h2></div>
                <span className="note">핀한 공고의 할 일 기한도 함께 보여요.</span>
              </div>
              <div className="week">
                {weekDays.map((d, n) => {
                  const items = all.filter((p) => p.deadline === d);
                  const todos = pins.flatMap((pin) => pin.checklist.filter((i) => !i.done && i.due === d).map((i) => ({ pin, i })));
                  const date = new Date(`${d}T00:00:00`);
                  return (
                    <div key={d} className={`day ${n === 0 ? "today" : ""}`}>
                      <div className="day-h">
                        <b className="num">{date.getDate()}</b>
                        <span>{n === 0 ? "오늘" : n === 1 ? "내일" : `${WD[date.getDay()]}요일`}</span>
                      </div>
                      {items.length || todos.length ? (
                        <ul>
                          {items.map((p) => (
                            <li key={p.id}>
                              <button className={BADGE[p.category]} onClick={() => setOpenId(p.id)} title={p.title}>{p.title}</button>
                            </li>
                          ))}
                          {todos.map(({ pin, i }) => (
                            <li key={`${pin.postingId}-${i.id}`}>
                              <button style={{ background: "var(--pin-tint)", color: "var(--pin-deep)" }} onClick={() => setOpenId(pin.postingId)} title={i.label}>
                                ✓ {i.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="none">일정 없음</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-labelledby="listTitle">
              <div className="sec-head">
                <div>
                  <div className="eb">{view === "pins" ? "Pinned" : "Opportunities"}</div>
                  <h2 id="listTitle">{view === "pins" ? "핀해 둔 공고" : view === "all" ? "지금 지원할 수 있는 기회" : CATEGORIES[view]}</h2>
                </div>
              </div>
              <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input id="q" type="search" placeholder="회사, 직무, 기술로 검색 (예: LLM, 백엔드, 행복주택)" autoComplete="off" aria-label="검색어" value={q} onChange={(e) => setQ(e.target.value)} />
              </form>

              {view === "job" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="tabs" role="toolbar" aria-label="공공·민간">
                    {([["all", "전체"], ["private", "사기업"], ["public", "공공기관"]] as const).map(([k, l]) => (
                      <button key={k} className="tab" aria-pressed={sector === k} onClick={() => { setSector(k); setTypes([]); }}>{l}</button>
                    ))}
                  </div>
                  {sector !== "public" && (
                    <div className="chips" role="group" aria-label="기업 유형">
                      {PRIVATE_TYPES.map((t) => (
                        <button key={t} className="chip" aria-pressed={types.includes(t)} onClick={() => setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="filters">
                <label className="f" htmlFor="region">지역
                  <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">전국 · 모든 지역</option>
                    {REGION_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </label>
                <label className="check" htmlFor="weekOnly"><input type="checkbox" id="weekOnly" checked={weekOnly} onChange={(e) => setWeekOnly(e.target.checked)} />7일 이내 마감</label>
                {view === "job" && (
                  <label className="check" htmlFor="techOnly"><input type="checkbox" id="techOnly" checked={techOnly} onChange={(e) => setTechOnly(e.target.checked)} />IT·개발 직무만</label>
                )}
                <span className="spacer" />
                <select id="sort" aria-label="정렬" value={sort} onChange={(e) => setSort(e.target.value as "deadline" | "new")}>
                  <option value="deadline">마감 임박순</option>
                  <option value="new">최신 등록순</option>
                </select>
              </div>

              <div className="result-meta">
                <span><b>{list.length}</b>개의 공고</span>
                {statuses && (
                  <span className="src-status" aria-label="자동 수집 상태">
                    {statuses.map((s) => (
                      <span key={s.source} className={s.ok ? "ok" : "fail"} title={s.message}>
                        {SOURCE_NAMES[s.source] ?? s.source} {s.ok ? s.count : "실패"}
                      </span>
                    ))}
                  </span>
                )}
              </div>

              <div className="grid">
                {list.length ? (
                  list.map((p) => (
                    <PostingCard key={p.id} posting={p} today={today} pinned={pinMap.has(p.id)} onOpen={() => setOpenId(p.id)} onTogglePin={() => { keep(p); togglePin(p); }} />
                  ))
                ) : (
                  <div className="empty">
                    {view === "pins" ? (
                      <><b>아직 핀한 공고가 없어요</b>카드 오른쪽 위의 핀을 누르거나, 공고를 붙여넣어 추가해 보세요.</>
                    ) : (
                      <><b>조건에 맞는 공고가 없어요</b>필터를 바꾸거나, 찾는 공고를 직접 붙여넣어 추가해 보세요.</>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {open && (
        <DetailPanel
          posting={open}
          pin={pinMap.get(open.id)}
          today={today}
          onClose={() => setOpenId(null)}
          onTogglePin={() => { keep(open); togglePin(open); }}
          onToggleItem={(itemId) =>
            setPins((prev) => prev.map((x) => (x.postingId === open.id ? { ...x, checklist: x.checklist.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) } : x)))
          }
          onStage={(stage) => setPins((prev) => prev.map((x) => (x.postingId === open.id ? { ...x, stage } : x)))}
          onDelete={
            open.source === "paste"
              ? () => {
                  setSaved((prev) => prev.filter((x) => x.id !== open.id));
                  setPins((prev) => prev.filter((x) => x.postingId !== open.id));
                  setOpenId(null);
                }
              : undefined
          }
        />
      )}

      {adding && (
        <AddDialog
          onClose={() => setAdding(false)}
          onSave={(p, pin) => {
            setSaved((prev) => [p, ...prev]);
            if (pin) togglePin(p);
            setAdding(false);
            setOpenId(p.id);
          }}
        />
      )}
    </>
  );
}

const TONES: Record<string, [string, string]> = {
  ink: ["var(--sunken)", "var(--ink)"],
  pin: ["var(--pin-tint)", "var(--pin)"],
  house: ["var(--c-house-bg)", "var(--c-house)"],
  job: ["var(--c-job-bg)", "var(--c-job)"],
};

function Stat({ icon, tone, label, value }: { icon: string; tone: keyof typeof TONES; label: string; value: number }) {
  const [bg, fg] = TONES[tone];
  return (
    <div className="stat">
      <span className="si" style={{ background: bg, color: fg }}><Icon id={icon} size={20} /></span>
      <div><small>{label}</small><b>{value}<span>건</span></b></div>
    </div>
  );
}
