import { focusRules } from './focus.js';

// Scores only order this list. They are neither eligibility nor a match percentage.
export function recommendNotices(items, profile = {}, today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })) {
  const interest = profile.interest || '전체';
  const experience = ['entry', 'experienced', 'unknown'].includes(profile.experience) ? profile.experience : 'entry';
  const region = String(profile.region || '').trim();
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value));
  return items.filter(item => !(validDate(item.end) && validDate(today) && item.end < today)).map((item, index) => {
    let score = 0;
    const reasons = [], checks = [];
    const summary = String(item.summary || '');
    const target = String(item.target || '');
    const fields = Array.isArray(item.fields) ? item.fields : [];
    const rule = focusRules.find(([name]) => name === interest)?.[1];
    const summaryMatches = rule ? rule.test(summary) : focusRules.some(([, pattern]) => pattern.test(summary));
    const matches = interest === '전체' ? fields.some(field => focusRules.some(([name]) => name === field)) || summaryMatches : fields.includes(interest) || summaryMatches;
    if (item.category !== '청약' && matches) {
      score += interest === '전체' ? 10 : 30;
      if (summaryMatches) reasons.push('공고 요약: ' + summary);
      else checks.push('관심 분야와 분류가 일치합니다. 세부 업무는 공고 원문에서 확인하세요.');
    }
    if (experience === 'unknown') checks.push('경력 정보를 입력하지 않아 관심 분야를 기준으로 탐색합니다. 지원 자격은 확인이 필요합니다.');
    if (!region) checks.push('희망 지역을 입력하지 않았습니다. 근무지·거주지 조건을 확인하세요.');
    else if (item.region === region || item.region === '전국') {
      score += 5;
      checks.push(item.region === '전국' ? '전국 공고로 분류되어 있습니다. 실제 참여·거주 조건을 확인하세요.' : '선택 지역과 공고 지역이 같습니다. 세부 지역 조건을 확인하세요.');
    } else checks.push('선택 지역과 공고 지역이 다르거나 공고 지역이 확인되지 않았습니다.');
    if (item.category === '청약') {
      checks.push('청약은 분야 필터 없이 제공합니다. 나이·소득·자산·무주택·거주 요건을 확인하지 않았으므로 신청 적합성을 확정할 수 없습니다.');
    } else if (item.category === '채용') {
      const open = /경력\s*무관|신입|인턴/.test(target);
      const experiencedOnly = !open && /경력(?:자|직|\s*\d|\s*필수|\s*채용)|\d+\s*년\s*이상/.test(target);
      if (experience === 'entry' && open) {score += 10;reasons.push('신입·인턴 또는 경력 무관으로 안내된 공고입니다.');}
      if (experience === 'experienced' && (experiencedOnly || /경력\s*무관/.test(target))) score += 10;
      if (experience === 'entry' && experiencedOnly) {
        score -= 20;
        checks.push('지원 대상에 경력 조건이 있습니다. 신입 지원 가능 여부를 원문에서 확인하세요.');
      } else if (experience !== 'unknown' && !open && !experiencedOnly) checks.push('공고의 세부 경력 조건이 확인되지 않았습니다.');
      else if (experience !== 'unknown') checks.push('지원 대상: ' + target + '. 세부 자격은 원문에서 확인하세요.');
    } else {if(experience==='entry'&&/기초|입문|부트캠프|교육/.test(item.title+' '+summary)){score+=5;reasons.push('입문 학습이나 교육 내용을 포함한 공고입니다.');}checks.push('나이·소속·참가 자격과 신청 조건을 원문에서 확인하세요.');}
    checks.push('나이·학력 등 개인 자격은 확인하지 않았습니다. 신청 가능 여부는 공고 원문에서 확인하세요.');
    if (!validDate(item.end)) checks.push('마감일을 확인하지 못했습니다. 현재 접수 여부를 원문에서 확인하세요.');
    else checks.push('표시된 마감일만으로 접수 가능 여부를 확정할 수 없습니다. 조기 마감·제출 마감·마감 시각을 원문에서 확인하세요.');
    if(experience==='entry'&&(matches||item.category==='청약')&&item.recommendationNote){reasons.unshift(item.recommendationNote);checks.unshift(...(item.recommendationChecks||[]));}
    return { ...item, recommendation: { score, reasons, checks }, _recommendIndex: index };
  }).sort((a, b) => b.recommendation.score - a.recommendation.score || a._recommendIndex - b._recommendIndex)
    .map(({ _recommendIndex, ...item }) => item);
}
