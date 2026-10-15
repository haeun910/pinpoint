export const sources = [
{id:'naver',name:'NAVER Careers',category:'채용',url:'https://recruit.navercorp.com/rcrt/list.do',match:'annoId=',org:'NAVER 계열사'},
{id:'alio',name:'잡알리오',category:'채용',url:'https://job.alio.go.kr/recruit.do',match:'idx=',org:'공공기관'},
{id:'lh',name:'LH청약플러스',category:'청약',url:'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1026',match:'panId=',org:'LH'},
{id:'youth',name:'청년몽땅정보통',category:'청년 지원',url:'https://youth.seoul.go.kr/infoData/sprtInfo/list.do?key=2309130006',match:'sprtInfoId=',org:'서울시·청년센터'},
{id:'contest',name:'콘테스트코리아',category:'공모전',url:'https://www.contestkorea.com/sub/list.php?int_gbn=1',match:'str_no=',org:'주최기관 원문 확인'}
];
export const seed = [
{id:'naver-30005516',source:'naver',category:'채용',org:'SNOW',title:'남미(스페인어권) 콘텐츠 마케터 · 계약직',region:'경기',target:'경력 무관',end:'2026-10-21',url:'https://recruit.navercorp.com/rcrt/view.do?annoId=30005516&lang=ko',summary:'스페인어권 콘텐츠 마케팅과 영상·이미지 제작 업무. 약 6개월 계약직이며 스페인어 소통 역량이 필요합니다.',tags:['마케팅','계약직'],checked:'2026-10-15'},
{id:'alio-305759',source:'alio',category:'채용',org:'정보통신기획평가원',title:'직원 채용 · 위촉직 및 전문위원(변호사)',region:'대전',target:'신입·경력',end:'2026-10-21',url:'https://job.alio.go.kr/recruitview.do?idx=305759',summary:'사업관리·법률 분야 2명 모집. 직무별 어학 또는 변호사 자격 요건을 원문에서 확인하세요.',tags:['공공기관','신입·경력'],checked:'2026-10-15'},
{id:'alio-305539',source:'alio',category:'채용',org:'건강보험심사평가원',title:'2026년 하반기 체험형 청년인턴 채용',region:'원문 확인',target:'청년',end:'2026-10-15',url:'https://job.alio.go.kr/recruitview.do?idx=305539',summary:'체험형 청년인턴 233명 모집. 근무지역과 지원 자격, 접수 마감 시각은 원문에서 확인하세요.',tags:['청년인턴','공공기관'],checked:'2026-10-15'},
{id:'lh-seoul-20261001',source:'lh',category:'청약',org:'LH 서울지역본부',title:'26년 2차 비분양전환형 든든전세주택 입주자 모집',region:'서울',target:'원문 자격 확인',end:null,url:sources[2].url,summary:'LH 공고 목록에서 확인한 서울지역 모집 정보입니다. 목록 표시 종료일과 신청 접수일은 다를 수 있어, 공고명을 검색한 뒤 접수 일정·소득·자산 조건을 확인하세요.',tags:['전세주택','공고 목록 연결'],checked:'2026-10-15'},
{id:'lh-gyeonggi-20260910',source:'lh',category:'청약',org:'LH 경기남부지역본부',title:'2026년 일반 매입임대주택 입주자 모집',region:'경기',target:'원문 자격 확인',end:null,url:sources[2].url,summary:'관할 주거복지지사 현장 접수 공고입니다. 온라인 접수 불가 안내가 있으므로 공고 원문에서 방문 장소와 신청 기간을 확인하세요.',tags:['매입임대','현장 접수'],checked:'2026-10-15'},
{id:'youth-74291',source:'youth',category:'청년 지원',org:'양재종합사회복지관',title:'고립가구 전담기구 청년 커뮤니티 참여자 모집',region:'서울',target:'청년 · 세부 조건 확인',end:null,url:'https://youth.seoul.go.kr/infoData/sprtInfo/view.do?key=2309130006&sprtInfoId=74291',summary:'서울 서초구 청년 커뮤니티 프로그램. 향수 만들기, 미술활동 등 교류 활동으로 구성되며 접수 가능 여부는 원문을 확인하세요.',tags:['커뮤니티','생활 지원'],checked:'2026-10-15'},
{id:'contest-202605060087',source:'contest',category:'공모전',org:'주최기관 확인 필요',title:'2026년 기후환경교육 우수사례 공모전',region:'전국',target:'초·중·고 환경 동아리 등',end:null,url:'https://contestkorea.com/sub/view.php?Txt_bcode=030110001&Txt_gbn=1&str_no=202605060087',summary:'검색에서 확인한 공모전입니다. 환경일기 부문 10월 26일~11월 6일 제출 안내가 있으며, 현재 접수 상태와 부문별 대상은 주최기관 원문에서 다시 확인하세요.',tags:['환경','원문 재확인 필요'],checked:'2026-10-15'}
];
