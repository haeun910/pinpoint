# Pinpoint

IT/AI 채용·청년 지원·공모전과 분야 제한 없는 청약 공고 탐색 서비스. Cloudflare Worker에서 공개 목록을 가져오고, 검색·지역 필터·마감일 정렬·관심 공고·월별 캘린더를 제공합니다.

## 실행

Node.js 24 이상. 외부 npm 의존성 없음.

```
npm run build
npm test
node scripts/dev.mjs
```

## Codex 자료 수집 및 추천

Codex가 공개 웹 검색·원문 읽기로 공고를 확인합니다. 공고 확인 → 분류·필터링 → 신입·인턴·입문 교육 중심 추천의 세 에이전트 역할을 사용합니다. `docs/CODEX_UPDATES.md`에 전체 절차를 기록했고 `/api/update-guide`에도 제공됩니다.

갱신 결과는 공개 GitHub 저장소의 `1015` 브랜치 `data/notices.json`에 남깁니다. Codex는 GitHub의 파일 읽기·쓰기 도구로 현재 blob SHA를 확인하고 한글 커밋으로 갱신한 뒤 읽어 검증합니다. 사이트는 지정된 GitHub raw JSON만 읽으므로 일상 자료 갱신에 재배포나 사이트 쓰기 자격이 필요 없습니다. 공고 ID를 보존해 병합하고, 출처 접근에 실패한 기존 자료는 삭제하지 않습니다. 개인정보나 인증값은 JSON에 넣지 않습니다.

`worker/snapshot.js`는 자료의 필수 필드·원문 URL·분야·날짜·확인 수준을 검증하고, 네트워크 오류 시 마지막 정상 자료 또는 초기 자료를 유지합니다. `worker/focus.js`는 제목과 원문 직무의 `roleEvidence`로 IT/AI를 분류합니다. 회사 이름·태그만으로 비관련 직무를 통과시키지 않습니다. 청약은 분야 제한 없이 유지합니다.

추천은 `worker/recommend.js`에서 관심 분야·경력 선호·지역을 기준으로 정렬합니다. 세 번째 에이전트가 작성한 추천 근거와 추가 자격 확인 사항도 제공합니다. 내부 점수를 적합도 백분율로 표시하지 않고, 나이·학력·소득·거주 조건을 모르면 지원 가능 여부를 단정하지 않습니다.

저장은 기기 내 localStorage를 사용합니다. 로그인·클라우드 동기화·메일 알림은 제공하지 않습니다. 일정이 확인된 공고만 캘린더와 마감 임박 필터에 포함합니다. 한국 시간 기준으로 마감 날짜를 계산하며 당일 마감 시각은 원문을 확인해야 합니다.

## 배포

`.openai/hosting.json`은 Sites 프로젝트를 지정합니다. `npm run build`가 UI를 내장한 Worker ES module을 `dist/server/index.js`에 생성합니다. `dist/.openai/hosting.json`과 함께 tar.gz로 패키징합니다. 배포 전 소스를 Git에 커밋하고 Sites 원격 저장소로 동기화해야 합니다. 인증 토큰은 파일이나 저장소에 기록하지 않습니다.
