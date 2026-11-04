/** 지역 필터에서 고를 수 있는 값 */
export const REGION_OPTIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "온라인"] as const;

/** AI가 정리한 근무지는 "서울특별시 강남구", "경기 성남시" 처럼 제각각이라 같은 지역으로 묶어 준다. */
const ALIASES: Record<string, string[]> = {
  서울: ["서울"],
  경기: ["경기"],
  인천: ["인천"],
  부산: ["부산"],
  대구: ["대구"],
  대전: ["대전"],
  광주: ["광주광역시", "광주 "],
  울산: ["울산"],
  세종: ["세종"],
  강원: ["강원"],
  충북: ["충북", "충청북도"],
  충남: ["충남", "충청남도"],
  전북: ["전북", "전라북도"],
  전남: ["전남", "전라남도"],
  경북: ["경북", "경상북도"],
  경남: ["경남", "경상남도"],
  제주: ["제주"],
  온라인: ["온라인", "비대면", "재택", "원격"],
};

/** 공고 근무지가 고른 지역에 해당하는지. "전국"은 어느 지역에나 보여 준다. */
export function regionMatches(location: string, selected: string): boolean {
  if (!selected) return true;
  const loc = `${location.trim()} `;
  if (loc.startsWith("전국")) return true;
  // "경기 광주시"는 경기로 본다
  if (selected === "광주") return loc === "광주 " || (!loc.includes("경기") && (ALIASES.광주.some((a) => loc.includes(a))));
  return (ALIASES[selected] ?? [selected]).some((a) => loc.includes(a));
}
