"use client";

import { useState, useEffect } from "react";
import AddressSearchInput from "@/components/common/AddressSearchInput";
import type { CustomerProfile, Pet } from "@/lib/groomer-types";
import type { BreedType, WeightTier } from "@/lib/services";
import { getCustomerProfile } from "@/lib/customer-storage";
import { getPetAge } from "@/lib/groomer-types";
import { DOG_BREEDS, BREED_TYPES, WEIGHT_TIERS_SMALL, WEIGHT_TIERS_MEDIUM } from "@/lib/pet-options";
import { SERVICE_DEFS, getServicePrice, getServicesForBreed, weightToTier } from "@/lib/services";

type Props = {
  onComplete: (profile: CustomerProfile) => void;
  initialData?: Partial<CustomerProfile> | null;
  submitLabel?: string;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CustomerProfileForm({ onComplete, initialData, submitLabel = "저장하고 예약하기" }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [email, setEmail] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showPetForm, setShowPetForm] = useState(false);

  useEffect(() => {
    let loginData: { phone?: string; email?: string } = {};
    try {
      const login = typeof window !== "undefined" ? localStorage.getItem("mimi_demo_user") : null;
      loginData = login ? JSON.parse(login) : {};
    } catch {
      // ignore
    }
    getCustomerProfile(loginData.phone, loginData.email).then((saved) => {
      const src = initialData ?? saved;
      setName(src?.name ?? "");
      setPhone(src?.phone ?? loginData.phone ?? "");
      setAddress(src?.address ?? "");
      setDetailAddress(src?.detailAddress ?? "");
      setEmail(src?.email ?? loginData.email ?? "");
      setPets(src?.pets ?? []);
    });
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) return;
    if (pets.length === 0) return; // 반려동물 1마리 이상 필요
    onComplete({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      detailAddress: detailAddress.trim() || undefined,
      email: email.trim() || undefined,
      pets,
    });
  };

  const addPet = (pet: Omit<Pet, "id" | "createdAt">) => {
    const newPet: Pet = {
      ...pet,
      id: `P${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPets((prev) => [...prev, newPet]);
    setEditingPet(null);
    setShowPetForm(false);
  };

  const updatePet = (id: string, updates: Partial<Pet>) => {
    setPets((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setEditingPet(null);
  };

  const removePet = (id: string) => {
    setPets((prev) => prev.filter((p) => p.id !== id));
    setEditingPet(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 w-full max-w-full min-w-0">
      <p className="text-gray-600 text-sm sm:text-base leading-relaxed">고객 정보와 반려동물을 등록해 주세요 (수정 가능)</p>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-[var(--shadow-card)] p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div>
          <h3 className="font-bold text-gray-800 text-base sm:text-lg">고객 정보</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">예약·연락에 사용되며 이후에도 수정할 수 있어요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[44px] text-base rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
              required
              autoComplete="name"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">연락처 *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[44px] text-base rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
              required
              autoComplete="tel"
              inputMode="tel"
            />
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-4 min-w-0">
          <div className="border-b border-amber-200/60 pb-3">
            <p className="text-sm font-semibold text-gray-900">방문 주소 *</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              <span className="font-medium text-gray-700">① 기본 주소</span>는 검색으로 선택하거나 직접 입력하고,{" "}
              <span className="font-medium text-gray-700">② 상세 주소</span>에 동·호수를 적어 주세요.
            </p>
          </div>
          <div className="min-w-0 space-y-2">
            <label className="block text-sm font-medium text-gray-800">① 기본 주소 (도로명/지번)</label>
            <p className="text-xs text-gray-500 -mt-0.5">우편번호 찾기로 선택하면 자동으로 채워집니다.</p>
            <AddressSearchInput value={address} onChange={setAddress} placeholder="예: 서울시 강남구 테헤란로 …" />
          </div>
          <div className="min-w-0 space-y-2">
            <label className="block text-sm font-medium text-gray-800">② 상세 주소</label>
            <p className="text-xs text-gray-500 -mt-0.5">아파트 동·호, 빌라 호수, 건물명 등</p>
            <input
              type="text"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              placeholder="예: 101동 1202호"
              className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[44px] text-base rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none bg-white"
              autoComplete="address-line2"
            />
          </div>
        </div>

        <div className="min-w-0 pt-1 border-t border-stone-100">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일 (선택)</label>
          <p className="text-xs text-gray-500 mb-2">알림·안내 수신에 사용됩니다.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full min-w-0 px-3 sm:px-4 py-3 min-h-[44px] text-base rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
            autoComplete="email"
            inputMode="email"
          />
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-snug pr-1">
            반려동물 <span className="font-normal text-gray-600 text-sm">(여러 마리 등록 가능)</span>
          </h3>
          <button
            type="button"
            onClick={() => { setEditingPet(null); setShowPetForm(true); }}
            className="text-sm py-2.5 px-4 bg-mimi-orange/20 text-mimi-orange rounded-lg hover:bg-mimi-orange/30 w-full sm:w-auto text-center shrink-0"
          >
            + 반려동물 추가
          </button>
        </div>

        {pets.map((pet) => (
          <div key={pet.id} className="p-3 sm:p-4 bg-gray-50 rounded-xl min-w-0">
            {editingPet?.id === pet.id ? (
              <PetForm
                key={pet.id}
                pet={pet}
                onSave={(updates) => updatePet(pet.id, updates)}
                onCancel={() => setEditingPet(null)}
              />
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4">
                {pet.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pet.photoUrl} alt={pet.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 mx-auto sm:mx-0" />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-mimi-orange/20 flex items-center justify-center text-2xl shrink-0 mx-auto sm:mx-0">
                    🐕
                  </div>
                )}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="font-bold break-words">{pet.name}</p>
                  <p className="text-sm text-gray-600 break-words">
                    {pet.species}
                    {pet.breed && ` · ${pet.breed}`}
                    {(pet.breedType || pet.weightTier || pet.weightKg) && ` · ${pet.breedType ?? ""} ${pet.weightTier ?? (pet.weightKg ? `${pet.weightKg}kg` : "")}`.trim()}
                    {` · ${getPetAge(pet)}`}
                  </p>
                  {pet.healthConditions && <p className="text-xs text-amber-700">지병: {pet.healthConditions}</p>}
                  {pet.isAggressive && <p className="text-xs text-red-600">⚠️ 사나움 주의</p>}
                  {pet.notes && <p className="text-xs text-gray-500 break-words">{pet.notes}</p>}
                </div>
                <div className="flex gap-3 justify-center sm:justify-end sm:flex-col sm:gap-1 shrink-0 pt-1 sm:pt-0 border-t border-gray-200/80 sm:border-0 mt-1 sm:mt-0">
                  <button type="button" onClick={() => setEditingPet(pet)} className="text-sm text-mimi-orange hover:underline py-1">수정</button>
                  <button type="button" onClick={() => removePet(pet.id)} className="text-sm text-red-500 hover:underline py-1">삭제</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {(showPetForm || (pets.length === 0 && !editingPet)) && (
          <PetForm
            key="new"
            onSave={(p) => addPet(p)}
            onCancel={() => { setShowPetForm(false); }}
          />
        )}
      </div>

      <p className="text-sm text-amber-600">* 예약을 위해 반려동물 1마리 이상 등록이 필요합니다. 강아지 여러 마리를 등록할 수 있습니다.</p>
      <button
        type="submit"
        disabled={!name.trim() || !phone.trim() || !address.trim() || pets.length === 0}
        className="w-full py-3.5 min-h-[48px] text-base bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  );
}

type PetFormProps = {
  pet?: Pet;
  onSave: (pet: Pet | Omit<Pet, "id" | "createdAt">) => void;
  onCancel: () => void;
};

function PetForm({ pet, onSave, onCancel }: PetFormProps) {
  const [name, setName] = useState(pet?.name ?? "");
  const [species, setSpecies] = useState<"강아지">("강아지");
  const breedInList = pet?.breed && (DOG_BREEDS as readonly string[]).includes(pet.breed);
  const [breed, setBreed] = useState(breedInList ? pet!.breed! : (pet?.breed ? "기타" : ""));
  const [breedCustom, setBreedCustom] = useState(!breedInList && pet?.breed ? pet.breed : "");
  const [breedType, setBreedType] = useState<BreedType>(pet?.breedType ?? "소형견");
  const [weightTier, setWeightTier] = useState<WeightTier>(() => {
    if (pet?.weightTier) return pet.weightTier as WeightTier;
    if (pet?.weightKg != null) return weightToTier(pet.weightKg, pet?.breedType ?? "소형견");
    return "5kg미만";
  });
  const [weightKg, setWeightKg] = useState(pet?.weightKg?.toString() ?? "");
  const [birthYear, setBirthYear] = useState(pet?.birthYear ?? currentYear - 1);
  const [birthMonth, setBirthMonth] = useState(pet?.birthMonth ?? 1);
  const [healthConditions, setHealthConditions] = useState(pet?.healthConditions ?? "");
  const [isAggressive, setIsAggressive] = useState(pet?.isAggressive ?? false);
  const [preferredServiceId, setPreferredServiceId] = useState(pet?.preferredServiceId ?? "");
  const [serviceNotes, setServiceNotes] = useState(pet?.serviceNotes ?? "");
  const [notes, setNotes] = useState(pet?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState(pet?.photoUrl ?? "");

  const breedOptions = DOG_BREEDS;
  const selectedBreed = breed === "기타" ? breedCustom : breed;

  const weightTierOptions = breedType === "소형견" ? WEIGHT_TIERS_SMALL : WEIGHT_TIERS_MEDIUM;

  useEffect(() => {
    const matching = getServicesForBreed(breedType);
    const valid = matching.some((s) => s.id === preferredServiceId);
    if (!valid && matching.length > 0) {
      setPreferredServiceId(matching[0].id);
    }
  }, [breedType, preferredServiceId]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxSize = 200;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = (h * maxSize) / w;
            w = maxSize;
          } else {
            w = (w * maxSize) / h;
            h = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhotoUrl(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          setPhotoUrl(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const finalTier = weightKg ? weightToTier(parseFloat(weightKg), breedType) : weightTier;
    const data = {
      name: name.trim(),
      species,
      breed: selectedBreed.trim() || undefined,
      breedType,
      weightTier: finalTier,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      birthYear,
      birthMonth,
      healthConditions: healthConditions.trim() || undefined,
      isAggressive,
      preferredServiceId: preferredServiceId || undefined,
      serviceNotes: serviceNotes.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUrl: photoUrl || undefined,
    };
    if (pet) {
      onSave({ ...pet, ...data });
    } else {
      onSave(data);
    }
  };

  return (
    <div className="space-y-3 p-3 sm:p-4 bg-white rounded-xl border-2 border-mimi-orange/30 w-full max-w-full min-w-0">
      <h4 className="font-medium text-gray-800 text-base">{pet ? "반려동물 수정" : "반려동물 추가"}</h4>
      <div className="flex flex-col md:flex-row gap-4 min-w-0">
        <div className="shrink-0 flex flex-col items-center md:items-start">
          <label className="block text-xs text-gray-600 mb-1">사진</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm max-w-full" />
          {photoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={photoUrl} alt="" className="mt-1 w-16 h-16 rounded-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="min-w-0">
            <label className="block text-xs text-gray-600">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="min-w-0">
              <label className="block text-xs text-gray-600">종류</label>
              <span className="inline-block w-full sm:w-auto text-center px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-gray-50">강아지</span>
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-600">품종</label>
              <select value={breed} onChange={(e) => setBreed(e.target.value)} className="w-full min-w-0 max-w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base">
                <option value="">선택</option>
                {breedOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            {breed === "기타" && (
              <div className="min-w-0 sm:col-span-2">
                <label className="block text-xs text-gray-600">품종 직접입력</label>
                <input type="text" value={breedCustom} onChange={(e) => setBreedCustom(e.target.value)} placeholder="품종 입력" className="w-full min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base" />
              </div>
            )}
            <div className="min-w-0">
              <label className="block text-xs text-gray-600">견종 (요금표)</label>
              <select value={breedType} onChange={(e) => { const v = e.target.value as BreedType; setBreedType(v); if (v === "소형견" && ["11kg미만", "13kg미만"].includes(weightTier)) setWeightTier("9kg미만"); }} className="w-full min-w-0 max-w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base">
                {BREED_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-600">체중(kg)</label>
              <input type="number" step="0.1" min="0" max="20" value={weightKg} onChange={(e) => { const v = e.target.value; setWeightKg(v); if (v) setWeightTier(weightToTier(parseFloat(v), breedType)); }} placeholder="예: 4.2" className="w-full min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base" inputMode="decimal" />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <label className="block text-xs text-gray-600">체중 구간 (요금표)</label>
              <select value={weightTier} onChange={(e) => { setWeightTier(e.target.value as WeightTier); setWeightKg(""); }} className="w-full min-w-0 max-w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base">
                {weightTierOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-0.5">체중 입력 시 자동 적용 · 요금 산정 기준</p>
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs text-gray-600">선호 서비스</label>
            <select value={preferredServiceId} onChange={(e) => setPreferredServiceId(e.target.value)} className="w-full min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base mt-1">
              <option value="">선택 (해당 서비스로 예약 시 자동 이동)</option>
              {SERVICE_DEFS.filter((s) => (s.forBreed as readonly BreedType[]).includes(breedType)).map((s) => {
                const price = getServicePrice(s.id, breedType, weightTier);
                return (
                  <option key={s.id} value={s.id}>{s.name} - {breedType} {weightTier} {price > 0 ? `${price.toLocaleString()}원` : ""}</option>
                );
              })}
            </select>
            {preferredServiceId && (
              <p className="text-xs text-mimi-orange mt-1">예상 요금: {getServicePrice(preferredServiceId, breedType, weightTier).toLocaleString()}원 (견종·체중 기준)</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="block text-xs text-gray-600">출생년도</label>
              <select value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} className="w-full min-w-0 px-2 sm:px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base">
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className="block text-xs text-gray-600">출생월</label>
              <select value={birthMonth} onChange={(e) => setBirthMonth(Number(e.target.value))} className="w-full min-w-0 px-2 sm:px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base">
                {months.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-xs text-gray-600">지병 여부</label>
            <input
              type="text"
              value={healthConditions}
              onChange={(e) => setHealthConditions(e.target.value)}
              placeholder="없음 또는 기재"
              className="w-full min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base"
            />
          </div>
          <label className="flex items-center gap-2 text-base min-h-[44px]">
            <input type="checkbox" checked={isAggressive} onChange={(e) => setIsAggressive(e.target.checked)} className="h-5 w-5 shrink-0" />
            <span>사나움 주의</span>
          </label>
          <div className="min-w-0">
            <label className="block text-xs text-gray-600">서비스별 추가요청</label>
            <input
              type="text"
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="예: 털 많이 잘라주세요, 특정 스타일 원함"
              className="w-full min-w-0 px-3 py-2.5 min-h-[44px] rounded-lg border border-gray-200 text-base"
            />
          </div>
          <div className="min-w-0">
            <label className="block text-xs text-gray-600">기타 특이사항</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="알레르기, 약 복용 중 등"
              rows={2}
              className="w-full min-w-0 px-3 py-2.5 rounded-lg border border-gray-200 text-base resize-none"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
        <button type="button" onClick={onCancel} className="w-full sm:w-auto px-4 py-3 min-h-[44px] text-gray-600 rounded-lg text-base border border-gray-200">취소</button>
        <button type="button" onClick={handleSave} className="w-full sm:w-auto px-4 py-3 min-h-[44px] bg-mimi-orange text-white rounded-lg text-base font-medium">저장</button>
      </div>
    </div>
  );
}
