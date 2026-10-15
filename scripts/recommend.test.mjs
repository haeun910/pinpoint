import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendNotices } from '../worker/recommend.js';

const notice = (id, extra = {}) => ({ id, category: '채용', fields: ['AI·머신러닝'], summary: 'AI 모델 연구 업무를 수행합니다.', target: '원문 확인', region: '서울', end: '2026-10-30', ...extra });
const today = '2026-10-15';

test('expired notices excluded, today and unknown deadlines retained', () => {
  const result = recommendNotices([notice('old', { end: '2026-10-14' }), notice('today', { end: today }), notice('unknown', { end: null })], {}, today);
  assert.deepEqual(result.map(n => n.id), ['today', 'unknown']);
  assert.ok(result[1].recommendation.checks.some(t => t.includes('마감일')));
});

test('entry profile prioritizes matching entry roles and region without declaring eligibility', () => {
  const items = [notice('senior', { target: '경력 3년 이상' }), notice('entry', { target: '신입', region: '서울' }), notice('other', { fields: ['데이터'], summary: 'SQL 분석 업무입니다.', target: '신입', region: '부산' })];
  const result = recommendNotices(items, { interest: 'AI·머신러닝', experience: 'entry', region: '서울' }, today);
  assert.equal(result[0].id, 'entry');
  assert.ok(result.find(n => n.id === 'senior').recommendation.checks.some(t => t.includes('경력 조건')));
  assert.ok(result[0].recommendation.reasons.includes('공고 요약: AI 모델 연구 업무를 수행합니다.'));assert.ok(result[0].recommendation.reasons.some(r=>r.includes('신입')));
  assert.ok(!('recommendation' in items[0]));
});

test('unknown profile discloses missing qualifications', () => {
  const result = recommendNotices([notice('one')], { experience: 'unknown' }, today)[0];
  assert.ok(result.recommendation.checks.some(t => t.includes('경력 정보를 입력하지')));
  assert.ok(result.recommendation.checks.some(t => t.includes('희망 지역')));
});

test('housing remains regardless of interest with explicit qualification checks', () => {
  const result = recommendNotices([notice('home', { category: '청약', fields: ['주거·청약'], summary: '임대주택 입주자를 모집합니다.' })], { interest: 'AI·머신러닝', experience: 'entry' }, today);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].recommendation.reasons, []);
  assert.ok(result[0].recommendation.checks.some(t => t.includes('나이·소득·자산') && t.includes('확정할 수 없습니다')));
});

test('classification alone cannot manufacture summary-based recommendation reasons', () => {
  const result = recommendNotices([notice('unknown', { summary: '지원 일정은 원문에서 확인하세요.' })], { interest: 'AI·머신러닝' }, today)[0];
  assert.deepEqual(result.recommendation.reasons, []);
});

test('experienced profile uses explicit career target and stable ordering', () => {
  const result = recommendNotices([notice('entry', { target: '신입' }), notice('senior', { target: '경력 3년 이상' }), notice('open', { target: '경력무관' })], { experience: 'experienced' }, today);
  assert.deepEqual(result.map(n => n.id), ['senior', 'open', 'entry']);
});

test('default prioritizes entry but never assumes personal qualifications or open applications', () => {
  const result = recommendNotices([notice('senior', { target: '경력 3년 이상' }), notice('entry', { target: '신입' })], {}, today);
  assert.equal(result[0].id, 'entry');
  assert.ok(result[0].recommendation.checks.some(t => t.includes('나이·학력')));
  assert.ok(result[0].recommendation.checks.some(t => t.includes('제출 마감')));
});
