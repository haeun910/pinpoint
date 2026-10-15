export const updateGuide = {
 version:1,
 roles:['공고 확인 에이전트: 공개 웹 검색과 원문 열기로 모집 상태와 조건 확인, 출처 포함 구조화 자료 반환.','분류 에이전트: 확인 자료를 읽고 IT/AI 및 청약 규칙 적용, 역할 근거와 일정·대상 정리, 확인 실패 자료 보존.','추천 에이전트: 신입·인턴·입문 교육 중심으로 우선순위와 추천 근거·추가 확인 조건 정리. 나이·학력·희망지역은 미상.'],
 scope:'IT/AI 채용·청년 지원·공모전. 청약은 분야·지역 제한 없이 포함. 회사명만 IT/AI이거나 부수적인 AI 우대 문구만 있는 비관련 직무는 제외.',
 research:'공개 웹 검색과 원문 열기를 사용해 신규 공고와 기존 공고의 변경을 확인한다. 지원 기간, 지역, 대상, 원문 URL, 간단한 요약을 기록한다. 원문을 열 수 없으면 listing 또는 search 검증 수준을 기록하고 확인 못한 마감일은 null로 둔다. 공고 목록의 게시 종료일을 신청 마감일로 단정하지 않는다. 일부 출처 실패 시 기존 공고를 삭제하지 않는다. 해당 출처의 신규 공고를 못 찾았다고 전체 수집 성공으로 표시하지 않는다.',
 steps:['get_notices로 기존 목록과 revision을 읽는다.','기존 sources URL과 공개 검색을 이용해 실제 공고를 확인한다.','upsert_notices에 revision, items, checkedSources를 전달한다. 기존 공고는 같은 ID를 사용한다.','get_notices로 다시 읽어 수정한 ID·내용·revision이 저장됐는지 검증한다. 충돌(409)은 다시 읽고 병합한다.'],
 fields:{required:['id','source','category','org','title','region','target','end','url','summary','tags','checked','verification'],category:['채용','청약','청년 지원','공모전'],verification:['detail','listing','search'],checked:'YYYY-MM-DD, 실제 확인 날짜',end:'YYYY-MM-DD 또는 확인 불가 시 null',revision:'get_notices에서 받은 revision; 초기값 null'},
 recommendation:'추천 에이전트는 신입·인턴·입문 교육 기준의 recommendationNote와 recommendationChecks를 작성한다. 지원 가능 여부를 확정하지 않는다.',
 maintenance:'일상적인 갱신은 upsert_notices만 사용하며 소스 수정·재배포·GitHub 커밋이 필요 없다. 기능 변경 시 1015 브랜치와 구체적인 한글 커밋 메시지를 사용한다.'
};
