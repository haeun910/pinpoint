export const updateGuide={
 version:1,repository:'haeun910/pinpoint',branch:'1015',path:'data/notices.json',instructions:'docs/CODEX_UPDATES.md',
 roles:['공고 확인 에이전트: 공개 웹 검색과 원문에서 모집 상태·기간·대상·지역을 확인하고 URL과 함께 반환.','분류 에이전트: 원문을 읽고 IT/AI 관련성, 자격과 일정, 확인 수준을 정리. 청약은 분야 제한 없이 보존.','추천 에이전트: 신입·인턴·입문 교육 중심으로 추천 근거와 확인할 조건을 작성. 사용자 나이·학력·거주지는 미상.'],
 steps:['GitHub에서 1015 브랜치의 자료 파일과 현재 blob SHA를 읽는다.','공개 출처를 조사하고 세 역할의 결과를 기존 공고 ID에 병합한다. 확인 실패한 기존 공고를 삭제하지 않는다.','data/notices.json의 items·sources·sourceDefinitions·updatedAt을 갱신하고 검증한다.','GitHub update_file에 읽은 SHA를 전달해 1015 브랜치에 한글 커밋으로 저장한다. 충돌이면 다시 읽고 병합한다.','다시 파일을 읽어 변경한 ID와 내용이 저장됐는지 확인한다. 사이트는 저장 자료를 읽으며 재배포가 필요 없다.'],
 rules:'지원 자격·날짜를 지어내지 않는다. 목록 게시 종료일을 신청 마감으로 단정하지 않는다. verification은 detail/listing/search, 모르는 마감은 null. 새로운 출처는 sourceDefinitions에 실제 HTTPS URL과 분야를 등록한다. recommendationNote와 recommendationChecks로 추천 근거·자격 확인사항을 작성하되 지원 가능 여부를 확정하지 않는다. 공개 공고 정보만 저장하고 사용자 개인 정보는 넣지 않는다.'
};
