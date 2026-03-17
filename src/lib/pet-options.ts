/** 품종/체중 옵션 - 반려동물 등록 및 서비스 매칭용 */
import type { WeightRange } from "./groomer-types";

/** 요금표 견종 구분 */
export const BREED_TYPES = [
  { value: "소형견", label: "소형견", desc: "토이푸들, 포메, 말티즈, 시츄, 요크셔, 치와와, 닥스훈트 등" },
  { value: "중형견", label: "중형견", desc: "미니어처푸들, 스피츠, 코카스파니엘, 슈나우져, 비글, 프렌치블독 등" },
  { value: "특수견", label: "특수견", desc: "비숑, 꼬똥드툴레아, 웰시코기, 테리어종류 등" },
] as const;

/** 체중 구간 (요금표) */
export const WEIGHT_TIERS_SMALL = ["3kg미만", "5kg미만", "7kg미만", "9kg미만"] as const;
export const WEIGHT_TIERS_MEDIUM = ["3kg미만", "5kg미만", "7kg미만", "9kg미만", "11kg미만", "13kg미만"] as const;

export const DOG_BREEDS = [
  "말티즈", "푸들", "비숑", "치와와", "포메라니안", "시츄", "요크셔테리어",
  "웰시코기", "비글", "리트리버", "골든리트리버", "허스키", "진돗개",
  "불독", "닥스훈트", "기타",
] as const;

export const CAT_BREEDS = [
  "코리안숏헤어", "페르시안", "아메리칸숏헤어", "러시안블루", "먼치킨",
  "스코티시폴드", "브리티시숏헤어", "기타",
] as const;

export const WEIGHT_OPTIONS: { value: WeightRange; label: string; desc: string }[] = [
  { value: "소형", label: "소형 (5kg 이하)", desc: "5kg 이하" },
  { value: "중형", label: "중형 (5~10kg)", desc: "5kg ~ 10kg" },
  { value: "대형", label: "대형 (10kg 초과)", desc: "10kg 초과" },
];
