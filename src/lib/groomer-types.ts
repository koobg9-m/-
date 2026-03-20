/** 서비스 타입 (디자이너가 제공하는 것) */
export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number; // 분
};

/** 디자이너가 설정한 가능 시간 */
export type AvailableSlot = {
  date: string; // YYYY-MM-DD
  times: string[]; // ["09:00", "10:00", ...]
};

/** 디자이너 성별 (other는 하위호환용, UI에서는 남/여만 선택) */
export type GroomerGender = "male" | "female" | "other";

/** 디자이너 프로필 (디자이너가 직접 설정) */
export type GroomerProfile = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  intro?: string; // 소개글
  career?: string; // 경력 (예: 5년차, OO학원 수료)
  address: string; // 자기 주소지 (시/구/동)
  radiusKm: number; // 반경 km (이 거리 내 방문 가능)
  area?: string; // 하위 호환: address에서 추출한 지역
  /** 표준 미용 패키지 전체 (디자이너별 선택 없음, 저장 시 항상 전체로 맞춤) */
  services: ServiceItem[];
  availableSlots: AvailableSlot[];
  createdAt: string;
  /** 비밀번호 해시 (디자이너 대시보드 접근용) */
  passwordHash?: string;
  /** 비밀번호 평문 (관리자 표시용, 부여/변경 시에만 저장) */
  passwordPlain?: string;
  /** 나이 (생년월일에서 자동 계산) */
  age?: number;
  /** 생년월일 (YYYY-MM-DD, 나이 자동 계산용) */
  birthDate?: string;
  /** 성별 */
  gender?: GroomerGender;
  /** 예약정지 여부 (관리자 설정) */
  suspended?: boolean;
  /** 정산용: 은행명 */
  bankName?: string;
  /** 정산용: 계좌번호 */
  accountNumber?: string;
  /** 정산용: 예금주 */
  accountHolder?: string;
};

/** 체중 구분 */
export type WeightRange = "소형" | "중형" | "대형";

/** 반려동물 (나이는 birthYear/birthMonth로 계산) */
export type Pet = {
  id: string;
  name: string;
  species: "강아지";
  breed?: string; // 품종
  breedType?: "소형견" | "중형견" | "특수견"; // 요금표 견종 구분
  weightRange?: WeightRange; // 체중 구분 (소형/중형/대형) - 하위호환
  weightKg?: number; // 체중 kg (직접 입력)
  weightTier?: string; // 3kg미만, 5kg미만 등
  photoUrl?: string; // base64 또는 URL
  birthYear: number;
  birthMonth?: number; // 1-12, 선택
  healthConditions?: string; // 지병
  isAggressive?: boolean; // 사나움 여부
  preferredServiceId?: string; // 선호 서비스 (품종/체중 기반 추천)
  serviceNotes?: string; // 서비스별 추가요청
  notes?: string; // 기타 특이사항
  createdAt: string;
};

/** 나이 계산 (birthYear, birthMonth 기준, 시간 경과에 따라 자동 갱신) */
export function getPetAge(pet: Pet): string {
  const now = new Date();
  const years = now.getFullYear() - pet.birthYear;
  const months = (now.getMonth() + 1) - (pet.birthMonth ?? 1);
  const totalMonths = Math.max(0, years * 12 + months);
  if (totalMonths < 12) return `${totalMonths}개월`;
  return `${years}세`;
}

/** 고객 프로필 (이름, 연락처, 주소, 반려동물) */
export type CustomerProfile = {
  name: string;
  phone: string;
  address: string;
  detailAddress?: string;
  email?: string;
  pets: Pet[];
};

/** 예약 (고객이 생성) */
export type Booking = {
  id: string;
  groomerId: string;
  groomerName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  petName: string;
  petType: string;
  petId?: string;
  petHealthConditions?: string;
  petIsAggressive?: boolean;
  petNotes?: string;
  /** 다수 반려동물 예약 시 (하위 호환: petName, petType 유지) */
  pets?: Pet[];
  address: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  status: "pending" | "paid" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  /** 추가사항(추가요금) 선택 항목 */
  additionalFees?: { id: string; name: string; price: number }[];
  /** 결제 시 사용한 포인트 */
  pointsUsed?: number;
  /** 이 예약으로 적립된 포인트 */
  pointsEarned?: number;
  /** 서비스 총액 (포인트 할인 전) - 정산 시 수수료 계산 기준 */
  serviceTotal?: number;
  /** 예약확정 시각 (디자이너가 확인 후 확정) */
  confirmedAt?: string;
  /** 고객에게 확인/예약확정 통보 시각 */
  customerNotifiedAt?: string;
  /** 정산 상태: 미정산 | 정산완료 */
  settlementStatus?: "unsettled" | "settled";
  /** 미용 전후 사진 촬영 동의 여부 */
  photoConsentAgreed?: boolean;
  /** 미용 전 사진 (base64 또는 URL) */
  beforePhotos?: string[];
  /** 미용 후 사진 (base64 또는 URL) */
  afterPhotos?: string[];
  /** 이용후기 별점 (1~5) */
  reviewRating?: number;
  /** 이용후기 내용 */
  reviewText?: string;
  /** 이용후기 작성 시각 */
  reviewAt?: string;
  /** 디자이너가 정산 요청한 시각 */
  settlementRequestedAt?: string;
  /** 미용 추천 리마인더 발송 시각 (1주일 전 자동 발송) */
  groomingReminderSentAt?: string;
};
