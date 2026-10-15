// Match role or programme content, never employer name or incidental benefits.
export const focusRules = [
 ['AI·머신러닝', /\b(?:AI|ML|LLM|RAG|GPT|MLOps)\b|인공지능|생성형|머신러닝|딥러닝|기계학습/i],
 ['개발·소프트웨어', /\b(?:frontend|backend|full[ -]?stack|software|developer|python|javascript|typescript|react|node\.js|java|kotlin|ios|android|SW)\b|프론트엔드|백엔드|풀스택|소프트웨어|웹\s*개발|앱\s*개발|개발자|코딩|프로그래밍|해커톤|파이썬/i],
 ['데이터', /\b(?:data[ -]?(?:science|scientist|engineer|analysis|analyst)|SQL|big[ -]?data)\b|데이터\s*(?:분석|과학|엔지니어|사이언|수집|활용)|빅데이터/i],
 ['보안·인프라', /\b(?:security|cloud|devops|SRE|infrastructure|network|AWS|Azure)\b|정보보안|사이버보안|클라우드|인프라\s*(?:엔지니어|개발)|네트워크\s*엔지니어/i],
 ['IT 일반', /\b(?:IT|ICT)\b|전산|정보기술|정보통신\s*(?:기술|개발)|임베디드/i]
];
export function focusNotice(notice){
 if(notice.category==='청약')return {...notice,fields:['주거·청약']};
 if(!['채용','청년 지원','공모전'].includes(notice.category))return null;
 // Tags describe a notice, but are not evidence that its role is technical.
 // roleEvidence must be extracted from the original duties/programme content.
 const content=[notice.title,typeof notice.roleEvidence==='string'?notice.roleEvidence:''].join(' ');
 const generalRole=/인사|총무|회계|재무|법무|영업|마케팅|고객\s*(?:상담|응대|지원)|채용\s*담당|\b(?:HR|sales|marketing|accounting|recruiter)\b/i.test(notice.title);
 const technicalRole=focusRules.slice(1,4).some(([,rule])=>rule.test(content))||/(?:AI|ML|LLM|인공지능|머신러닝|딥러닝).{0,30}(?:연구|개발|엔지니어|모델링|학습|교육|강의|특강|활용\s*(?:과정|사례))|(?:연구|개발|엔지니어).{0,20}(?:AI|ML|LLM|인공지능)|\b(?:AI|ML|LLM)\s+(?:research|engineer|development|training|course|workshop)\b/i.test(content);
 // An AI/IT employer can hire nontechnical staff. Keep mixed technical roles
 // and AI training programmes when their duties provide explicit evidence.
 if(generalRole&&!technicalRole)return null;
 const fields=focusRules.filter(([,rule])=>rule.test(content)).map(([name])=>name);
 return fields.length?{...notice,fields}:null;
}
export function focusNotices(notices){return notices.map(focusNotice).filter(Boolean)}
