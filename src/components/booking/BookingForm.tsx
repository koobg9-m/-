"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getGroomerProfiles, getGroomerById, saveBooking, getBookingsByCustomer } from "@/lib/groomer-storage";
import { getCustomerProfile, saveCustomerProfile, canProceedToBooking } from "@/lib/customer-storage";
import { matchGroomers, matchGroomersWithGeocode, getAvailableSlots, getAvailableSlotsWithGeocode } from "@/lib/groomer-match";
import type { GroomerProfile, Booking, CustomerProfile, Pet } from "@/lib/groomer-types";
import { getPetAge } from "@/lib/groomer-types";
import { SERVICE_DEFS, getServicePrice, getServicesForBreed, weightRangeToBreedAndTier, getAdditionalFees, getAdditionalFeePrice, DEFAULT_ADDITIONAL_FEES, hydrateServicesFromRemote } from "@/lib/services";
import { addPoints, getCustomerPoints, getPointSettings, getMaxUsablePoints, deductPoints, calcDiscountFromPoints, calcEarnPoints, hydratePointsFromRemote } from "@/lib/point-storage";
import type { BreedType, WeightTier } from "@/lib/services";
import CustomerProfileForm from "./CustomerProfileForm";

type Step = "profile" | "region" | "datetime" | "service" | "match" | "pet" | "terms" | "confirm" | "payment";

function getNextDays(count: number) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(d: Date) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
}

/** 반려동물별 가격 (breedType·weightTier 우선, 없으면 weightRange/weightKg으로 근사) */
function getPriceForPet(serviceId: string, pet: Pet): number {
  const breedType: BreedType = (pet.breedType as BreedType) ?? "소형견";
  const fallback = weightRangeToBreedAndTier(pet.weightRange, pet.weightKg);
  const weightTier: WeightTier = (pet.weightTier as WeightTier) ?? fallback.weightTier;
  return getServicePrice(serviceId, breedType, weightTier);
}

export default function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [groomers, setGroomers] = useState<GroomerProfile[]>([]);
  const [groomer, setGroomer] = useState<GroomerProfile | null>(null);
  const [matchedGroomers, setMatchedGroomers] = useState<{ groomer: GroomerProfile; service: { id: string; name: string; price: number } }[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [selectedAdditionalFees, setSelectedAdditionalFees] = useState<string[]>([]);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [photoConsentAgreed, setPhotoConsentAgreed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ date: string; times: string[] }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [serviceSelectError, setServiceSelectError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const DEFAULT_REGION_CHECK_SERVICE = "bathFace";

  useEffect(() => {
    if (customer?.phone || customer?.email) {
      getBookingsByCustomer(customer.phone, customer.email).then((list) =>
        setCompletedCount(list.filter((b) => b.status === "completed").length)
      );
    } else {
      setCompletedCount(0);
    }
  }, [customer?.phone, customer?.email]);

  useEffect(() => {
    (async () => {
      await Promise.all([hydrateServicesFromRemote(), hydratePointsFromRemote()]);
      const [gList, prof] = await Promise.all([getGroomerProfiles(), getCustomerProfile()]);
      setGroomers(gList);
      setCustomer(prof);
      const serviceParam = searchParams.get("service");
      if (canProceedToBooking(prof)) {
        setStep("region");
        if (serviceParam && SERVICE_DEFS.some((s) => s.id === serviceParam)) {
          setServiceId(serviceParam);
        } else if (prof?.pets?.length) {
          const preferred = prof.pets.find((p) => p.preferredServiceId)?.preferredServiceId;
          if (preferred && SERVICE_DEFS.some((s) => s.id === preferred)) {
            setServiceId(preferred);
          }
        }
      } else if (serviceParam && SERVICE_DEFS.some((s) => s.id === serviceParam)) {
        setServiceId(serviceParam);
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    if (step !== "terms" && step !== "confirm") {
      setPhotoConsentAgreed(false);
    }
    if (step !== "terms" && step !== "confirm") {
      setTermsAgreed(false);
    }
  }, [step]);

  useEffect(() => {
    const gid = searchParams.get("groomer");
    if (gid) {
      getGroomerById(gid).then((g) => { if (g) setGroomer(g); });
    }
  }, [searchParams]);

  const customerAddress = customer ? `${customer.address} ${customer.detailAddress ?? ""}`.trim() : "";

  useEffect(() => {
    if (!customerAddress && !groomer) {
      setAvailableSlots([]);
      return;
    }
    if (groomer) {
      setAvailableSlots(groomer.availableSlots.map((s) => ({ date: s.date, times: s.times })));
      return;
    }
    const svcForSlots = serviceId || DEFAULT_REGION_CHECK_SERVICE;
    let cancelled = false;
    setSlotsLoading(true);
    getAvailableSlotsWithGeocode(groomers, svcForSlots, customerAddress, 30)
      .then((slots) => { if (!cancelled) setAvailableSlots(slots); })
      .catch(() => { if (!cancelled) setAvailableSlots(getAvailableSlots(groomers, svcForSlots, customerAddress, 30)); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [serviceId, customerAddress, groomer, groomers]);

  const days = getNextDays(30);

  const service = groomer
    ? groomer.services.find((s) => s.id === serviceId)
    : matchedGroomers[0]?.service ?? SERVICE_DEFS.find((s) => s.id === serviceId);

  const handleProfileComplete = async (profile: CustomerProfile) => {
    setProfileError(null);
    const ok = await saveCustomerProfile(profile);
    if (!ok) {
      setProfileError("저장에 실패했습니다. 반려동물 사진이 많거나 크면 줄여 주세요.");
      return;
    }
    setCustomer(profile);
    const preferred = profile.pets?.find((p) => p.preferredServiceId)?.preferredServiceId;
    if (preferred && SERVICE_DEFS.some((s) => s.id === preferred)) {
      setServiceId(preferred);
    }
    setStep("region");
  };

  const handleRegionConfirm = () => {
    setStep("datetime");
  };

  const handleServiceSelect = async (id: string) => {
    setServiceId(id);
    setServiceSelectError(null);
    if (!date || !time || !customerAddress) return;
    setMatchLoading(true);
    const dateStr = date.toISOString().slice(0, 10);
    try {
      const matches = await matchGroomersWithGeocode(groomers, id, dateStr, time, customerAddress);
      setMatchedGroomers(matches.map((m) => ({ groomer: m.groomer, service: m.service })));
      if (matches.length === 0) {
        setServiceSelectError("선택하신 일시에 이 서비스를 제공하는 디자이너가 없습니다. 다른 서비스나 시간을 선택해 주세요.");
      } else if (matches.length === 1 && customer?.pets?.length === 1) {
        setGroomer(matches[0].groomer);
        setSelectedPets(customer.pets);
        setStep("pet");
      } else {
        setStep("match");
      }
    } catch {
      const matches = matchGroomers(groomers, id, dateStr, time, customerAddress);
      setMatchedGroomers(matches.map((m) => ({ groomer: m.groomer, service: m.service })));
      if (matches.length === 0) {
        setServiceSelectError("선택하신 일시에 이 서비스를 제공하는 디자이너가 없습니다. 다른 서비스나 시간을 선택해 주세요.");
      } else if (matches.length === 1 && customer?.pets?.length === 1) {
        setGroomer(matches[0].groomer);
        setSelectedPets(customer.pets);
        setStep("pet");
      } else {
        setStep("match");
      }
    } finally {
      setMatchLoading(false);
    }
  };

  const handleDateTimeSelect = (d: Date, t: string) => {
    setDate(d);
    setTime(t);
    setServiceSelectError(null);
    if (groomer) {
      if (customer?.pets?.length === 1) {
        setSelectedPets(customer.pets);
      } else {
        setSelectedPets([]);
      }
      setStep("pet");
      return;
    }
    setSelectedPets([]);
    setStep("service");
  };

  const handleGroomerSelect = (g: GroomerProfile) => {
    setGroomer(g);
    const svc = matchedGroomers.find((m) => m.groomer.id === g.id)?.service;
    if (svc) setServiceId(svc.id);
    if (customer?.pets?.length === 1) {
      setSelectedPets(customer.pets);
    } else {
      setSelectedPets([]);
    }
    setStep("pet");
  };

  const basePrice = selectedPets.reduce((sum, p) => sum + getPriceForPet(serviceId || "", p), 0);
  let additionalFeesList = DEFAULT_ADDITIONAL_FEES;
  try {
    if (typeof window !== "undefined") {
      const fees = getAdditionalFees();
      additionalFeesList = Array.isArray(fees) ? fees : DEFAULT_ADDITIONAL_FEES;
    }
  } catch {
    additionalFeesList = DEFAULT_ADDITIONAL_FEES;
  }
  const selectedAdditionalItems = additionalFeesList.filter((f) => selectedAdditionalFees.includes(f.id));
  const primaryBreed: BreedType = selectedPets[0] ? ((selectedPets[0].breedType as BreedType) ?? "소형견") : "소형견";
  const additionalFeesTotal = selectedAdditionalItems.reduce((s, f) => s + getAdditionalFeePrice(f, primaryBreed), 0);
  const totalPrice = basePrice + additionalFeesTotal;

  const pointSettings = getPointSettings();
  const canUsePoints = completedCount >= pointSettings.minVisitToUse - 1;
  const ownedPoints = customer ? getCustomerPoints(customer.phone, customer.email) : 0;
  const maxUsable = canUsePoints ? getMaxUsablePoints(totalPrice, ownedPoints) : 0;
  const pointDiscount = calcDiscountFromPoints(Math.min(pointsToUse, maxUsable));
  const finalPrice = Math.max(0, totalPrice - pointDiscount);

  const handlePayment = async () => {
    const firstPet = selectedPets[0]!;
    const actualPointsUsed = Math.min(pointsToUse, maxUsable);
    if (actualPointsUsed > 0) {
      deductPoints(customer!.phone, customer!.email, actualPointsUsed, "예약 결제 사용", undefined);
    }
    const pointsEarned = calcEarnPoints(finalPrice);
    addPoints(customer!.phone, customer!.email, pointsEarned, "예약 결제 적립", undefined);
    const booking: Booking = {
      id: `B${Date.now()}`,
      groomerId: groomer!.id,
      groomerName: groomer!.name,
      serviceId: serviceId!,
      serviceName: service?.name ?? SERVICE_DEFS.find((s) => s.id === serviceId)?.name ?? "",
      price: finalPrice,
      serviceTotal: totalPrice,
      pointsUsed: actualPointsUsed > 0 ? actualPointsUsed : undefined,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      additionalFees: selectedAdditionalItems.length > 0 ? selectedAdditionalItems.map((f) => ({ id: f.id, name: f.name, price: getAdditionalFeePrice(f, primaryBreed) })) : undefined,
      date: date!.toISOString().slice(0, 10),
      time,
      petName: selectedPets.map((p) => p.name).join(", "),
      petType: selectedPets.map((p) => p.species).join(", "),
      petId: firstPet.id,
      petHealthConditions: firstPet.healthConditions,
      petIsAggressive: firstPet.isAggressive,
      petNotes: selectedPets.map((p) => [p.serviceNotes, p.notes].filter(Boolean).join(": ")).filter(Boolean).join(" / ") || undefined,
      pets: selectedPets,
      address: customerAddress,
      customerName: customer!.name,
      customerPhone: customer!.phone,
      customerEmail: customer!.email,
      status: "paid",
      createdAt: new Date().toISOString(),
      photoConsentAgreed: photoConsentAgreed || undefined,
    };
    await saveBooking(booking);
    setSuccess(true);
  };

  if (success) {
    const earned = customer ? calcEarnPoints(finalPrice) : 0;
    return (
      <div className="card p-8 md:p-10 text-center">
        <span className="text-6xl">✅</span>
        <h1 className="section-title mt-4">결제 및 예약이 완료되었어요!</h1>
        <p className="text-gray-600 mt-2">{groomer?.name} · {service?.name} · {selectedPets.map((p) => p.name).join(", ")} · {date && formatDate(date)} {time}</p>
        <p className="text-gray-600">{customerAddress}</p>
        {earned > 0 && <p className="text-amber-600 font-medium mt-2">+{earned}P 적립되었습니다</p>}
        <button
          onClick={() => router.replace("/")}
          className="btn-primary inline-block mt-8"
        >
          홈으로
        </button>
      </div>
    );
  }

  const steps: Step[] = ["profile", "region", "datetime", "service", "match", "pet", "terms", "confirm", "payment"];

  return (
    <div className="w-full max-w-full min-w-0">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-mimi-orange transition-colors mb-4 sm:mb-6">← 홈으로</Link>
      <div className="mb-6 sm:mb-8">
        <div className="flex gap-1 mb-3 sm:mb-4 overflow-x-auto pb-2 -mx-1 px-1">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 min-w-[30px] rounded-full transition-colors ${step === s ? "bg-mimi-orange" : steps.indexOf(step) > i ? "bg-mimi-orange/50" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-mimi-charcoal tracking-tight">미용 예약</h1>
      </div>

      {step === "region" && (
        <div className="space-y-4">
          <p className="text-gray-600">등록된 주소 기준으로 서비스 가능 여부를 확인합니다</p>
          {slotsLoading ? (
            <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-600">
              <p>서비스 가능 지역을 확인 중입니다...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-10 bg-mimi-yellow/10 rounded-2xl border-2 border-mimi-yellow/30 text-center">
              <p className="text-xl font-bold text-gray-800 mb-2">서비스 불가 지역입니다</p>
              <p className="text-gray-600 mb-4">현재 해당 지역에 방문 가능한 디자이너가 등록되어 있지 않아요.</p>
              <p className="text-xs text-gray-500 mb-4">디자이너는 서비스 등록 및 가능 시간 설정 후 노출됩니다.</p>
              <button onClick={() => setStep("profile")} className="px-6 py-2 text-mimi-orange hover:underline font-medium">주소 변경</button>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <span className="text-4xl">✓</span>
              <p className="text-lg font-bold text-gray-800 mt-2">서비스 가능 지역입니다</p>
              <p className="text-sm text-gray-600 mt-1">해당 지역에 방문 가능한 디자이너가 있습니다</p>
              <button onClick={handleRegionConfirm} className="mt-6 w-full py-3 bg-mimi-orange text-white rounded-xl font-bold">
                시간 선택하기
              </button>
            </div>
          )}
          <button onClick={() => setStep("profile")} className="text-gray-500 text-sm">← 이전</button>
        </div>
      )}

      {step === "profile" && (
        <div className="space-y-4 w-full max-w-full min-w-0">
          <div className="p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-200/60 flex items-start gap-3">
            <span className="text-xl shrink-0">💡</span>
            <div>
              <p className="text-sm text-amber-800 font-medium">잠깐! 예약전 안내를 확인해 주세요.</p>
              <Link href="/reservation-guide" className="text-sm text-mimi-primary hover:underline font-medium mt-1 inline-block">
                예약전 안내 보기 →
              </Link>
            </div>
          </div>
          {profileError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm">
              {profileError}
            </div>
          )}
          <CustomerProfileForm onComplete={handleProfileComplete} initialData={customer} />
        </div>
      )}

      {step === "service" && (() => {
        const firstPet = customer?.pets?.[0];
        const serviceBreedType: BreedType = (firstPet?.breedType as BreedType) ?? "소형견";
        const serviceFallback = weightRangeToBreedAndTier(firstPet?.weightRange, firstPet?.weightKg);
        const serviceWeightTier: WeightTier = (firstPet?.weightTier as WeightTier) ?? serviceFallback.weightTier;
        return (
        <div className="space-y-4">
          <p className="text-gray-600">서비스 종류·상세·가격을 확인하고 선택하세요</p>
          <p className="text-sm text-gray-500">선택 일시: {date && formatDate(date)} {time}</p>
          {serviceSelectError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {serviceSelectError}
            </div>
          )}
          <div className="space-y-3">
            {getServicesForBreed(serviceBreedType).map((def) => {
              const s = def;
              const name = def.name;
              const desc = def.description ?? "";
              const price = getServicePrice(s.id, serviceBreedType, serviceWeightTier) || 50000;
              return (
                <button
                  key={s.id}
                  onClick={() => handleServiceSelect(s.id)}
                  disabled={matchLoading}
                  className={`w-full p-4 rounded-xl border-2 text-left ${serviceId === s.id ? "border-mimi-orange bg-mimi-orange/5" : "border-gray-200 hover:border-mimi-orange/50"}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="font-bold text-gray-800">{name}</span>
                      {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-mimi-orange">{price.toLocaleString()}원~</p>
                      <p className="text-xs text-gray-500">{serviceBreedType} {serviceWeightTier} 기준</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-mimi-slate"><Link href="/pricing" className="text-mimi-orange hover:underline">상세 요금표</Link></p>
          <button onClick={() => { setServiceSelectError(null); setStep("datetime"); }} className="text-gray-500 text-sm">← 이전</button>
        </div>
        );
      })()}

      {step === "datetime" && (
        <div className="space-y-4">
          <p className="text-gray-600">희망 날짜와 시간을 선택하세요 (지도 기반 거리 기준)</p>
          {slotsLoading ? (
            <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-600">
              <p>주소 기반으로 가까운 디자이너를 검색 중입니다...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="p-10 bg-mimi-yellow/10 rounded-2xl border-2 border-mimi-yellow/30 text-center">
              <p className="text-xl font-bold text-gray-800 mb-2">서비스 불가 지역입니다</p>
              <p className="text-gray-600 mb-4">현재 해당 지역에 방문 가능한 디자이너가 등록되어 있지 않아요.</p>
              <p className="text-xs text-gray-500 mb-4">디자이너는 서비스 등록 및 가능 시간 설정 후 노출됩니다.</p>
              <p className="text-mimi-orange font-medium mb-6">빠르게 준비하도록 하겠습니다. 조금만 기다려 주세요! 🐾</p>
              <button onClick={() => setStep("region")} className="px-6 py-2 text-mimi-orange hover:underline font-medium">다시 확인</button>
              <span className="mx-2 text-gray-400">|</span>
              <button onClick={() => setStep("profile")} className="px-6 py-2 text-mimi-orange hover:underline font-medium">주소 변경</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map(({ date: dateStr, times }) => {
                  const d = days.find((x) => x.toISOString().slice(0, 10) === dateStr);
                  if (!d) return null;
                  return (
                    <div key={dateStr} className="p-3 rounded-xl border-2 border-gray-200">
                      <p className="font-medium text-sm mb-2">{formatDate(d)}</p>
                      <div className="flex flex-wrap gap-1">
                        {times.map((t) => (
                          <button
                            key={t}
                            onClick={() => handleDateTimeSelect(d, t)}
                            className="px-2 py-1 bg-mimi-orange/20 text-mimi-orange rounded text-xs hover:bg-mimi-orange/30"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setStep("region")} className="text-gray-500 text-sm">← 이전</button>
            </>
          )}
        </div>
      )}

      {step === "match" && (
        <div className="space-y-4">
          <p className="text-gray-600">일정에 맞는 가까운 디자이너입니다</p>
          {matchLoading ? (
            <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-600">
              <p>가까운 디자이너를 검색 중입니다...</p>
            </div>
          ) : matchedGroomers.length === 0 ? (
            <div className="p-10 bg-mimi-yellow/10 rounded-2xl border-2 border-mimi-yellow/30 text-center">
              <p className="text-xl font-bold text-gray-800 mb-2">서비스 불가 지역입니다</p>
              <p className="text-gray-600 mb-4">선택하신 일시에 방문 가능한 디자이너가 없어요.</p>
              <p className="text-mimi-orange font-medium mb-6">빠르게 준비하도록 하겠습니다. 조금만 기다려 주세요! 🐾</p>
              <button onClick={() => setStep("datetime")} className="px-6 py-2 text-mimi-orange hover:underline font-medium">다른 일시 선택</button>
            </div>
          ) : (
            <div className="space-y-3">
              {matchedGroomers.map(({ groomer: g, service: svc }) => (
                <button
                  key={g.id}
                  onClick={() => handleGroomerSelect(g)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-mimi-orange text-left"
                >
                  <h3 className="font-bold text-gray-800">{g.name}</h3>
                  <p className="text-sm text-gray-600">{g.address ?? g.area} · 반경 {g.radiusKm ?? 10}km</p>
                  <p className="text-sm text-mimi-orange mt-1">{svc.name} · {svc.price.toLocaleString()}원</p>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep("datetime")} className="text-gray-500 text-sm">← 이전</button>
        </div>
      )}

      {step === "pet" && (
        <div className="space-y-4">
          <p className="text-gray-600">예약할 반려동물을 선택하세요 (여러 마리 함께 선택 가능)</p>
          <div className="space-y-3">
            {customer?.pets?.map((pet) => {
              const isSelected = selectedPets.some((p) => p.id === pet.id);
              return (
                <button
                  key={pet.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPets((prev) => prev.filter((p) => p.id !== pet.id));
                    } else {
                      setSelectedPets((prev) => [...prev, pet]);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 ${isSelected ? "border-mimi-orange bg-mimi-orange/5" : "border-gray-200 hover:border-mimi-orange/50"}`}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center">
                    {isSelected && <span className="text-mimi-orange text-lg">✓</span>}
                  </div>
                  {pet.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={pet.photoUrl} alt={pet.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-mimi-orange/20 flex items-center justify-center text-2xl">
                      🐕
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-bold">{pet.name}</p>
                    <p className="text-sm text-gray-600">{pet.species} · {getPetAge(pet)}</p>
                    {pet.healthConditions && <p className="text-xs text-amber-700">지병: {pet.healthConditions}</p>}
                    {pet.isAggressive && <p className="text-xs text-red-600">⚠️ 사나움 주의</p>}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-gray-500">반려동물 정보 수정은 <Link href="/mypage" className="text-mimi-orange hover:underline">내 정보</Link>에서</p>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("terms")}
              disabled={selectedPets.length === 0}
              className="flex-1 py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택 완료 ({selectedPets.length}마리)
            </button>
            <button onClick={() => setStep(groomer ? "datetime" : "match")} className="text-gray-500 text-sm py-3">← 이전</button>
          </div>
        </div>
      )}

      {step === "terms" && (
        <div className="space-y-4">
          <p className="text-gray-600">고객약관을 확인해 주세요</p>
          <div className="card p-5 max-h-[320px] overflow-y-auto bg-white border-2 border-stone-200">
            <h3 className="font-bold text-mimi-charcoal mb-4">미미살롱펫 고객약관</h3>
            <div className="space-y-4 text-sm text-mimi-charcoal">
              <section>
                <h4 className="font-bold mb-2">미용전 안내사항</h4>
                <p>요금은 출장비 포함이며 별도의 시간추가에 대한 비용은 없습니다.</p>
              </section>
              <section>
                <h4 className="font-bold mb-2">예약전 안내</h4>
                <p className="mb-2">미미살롱펫은 반려견의 만족스런 미용을 위해 최선을 다합니다. 아이와 디자이너의 안전을 염두에 두시고 원활한 서비스를 위해 함께 협조를 기대합니다.</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>고객 준비사항: 샴푸, 가정용드라이어기, 미용할 장소(욕실 등 물기 제거)</li>
                  <li>사나움·털엉킴·체중초과 시 추가요금 발생할 수 있음</li>
                  <li>지병/노령견/피부병 등은 미용 진행 불가할 수 있음 (사전 협의)</li>
                  <li>미용 중 상태에 따라 중단 시 환불하지 않을 수 있음</li>
                </ul>
              </section>
              <section>
                <h4 className="font-bold mb-2">환불기준</h4>
                <ul className="text-xs space-y-1">
                  <li>24시간 이내 취소: 90% 환불</li>
                  <li>전혀 손도 못 대고 나올 경우: 70% 환불</li>
                  <li>미용 중 서비스 중단: 최대 50% 환불</li>
                </ul>
              </section>
              <section>
                <h4 className="font-bold mb-2">지병·노령견 미용 동의</h4>
                <p className="text-xs">노령견·지병 있는 아이의 경우, 미용 후 발생할 수 있는 상황에 대해 견주가 미미살롱펫에 책임을 묻지 않을 것에 동의 후 미용을 진행합니다.</p>
              </section>
              <section>
                <h4 className="font-bold mb-2">미용 전후 사진 촬영</h4>
                <p className="text-xs">디자이너가 서비스 전후 아이의 사진을 찍게 됩니다. 아이 사진에 대한 초상권·저작권 등 권리는 고객님의 허락으로 미미살롱펫에 있음을 확인합니다. 아이의 미용 및 건강관리를 위한 것이니 협조 부탁드립니다.</p>
              </section>
            </div>
          </div>
          <Link href="/terms" target="_blank" className="inline-block text-sm text-mimi-primary hover:underline font-medium">
            전체 고객약관 보기 (새 창) →
          </Link>
          <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-stone-200 hover:border-mimi-primary/30 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-stone-300 text-mimi-primary focus:ring-mimi-primary"
            />
            <span className="text-sm text-mimi-charcoal">
              위 고객약관(미용전 안내, 유의사항, 환불기준, 지병·노령견 미용 동의, 미용 전후 사진 촬영 포함)을 확인하였으며 동의합니다.
            </span>
          </label>
          <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-stone-200 hover:border-mimi-primary/30 cursor-pointer">
            <input
              type="checkbox"
              checked={photoConsentAgreed}
              onChange={(e) => setPhotoConsentAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-stone-300 text-mimi-primary focus:ring-mimi-primary"
            />
            <span className="text-sm text-mimi-charcoal">
              서비스 전후 아이의 사진 촬영 및 미미살롱펫 활용(홍보·만족도 등)에 동의합니다. (선택)
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("confirm")}
              disabled={!termsAgreed}
              className="flex-1 py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              확인하고 다음
            </button>
            <button onClick={() => setStep("pet")} className="text-gray-500 text-sm py-3">← 이전</button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="space-y-4">
          <p className="text-gray-600">예약 정보를 확인해 주세요</p>
          <div className="card p-5 space-y-2 bg-gray-50/50">
            <p><span className="text-gray-500">고객</span> {customer?.name} · {customer?.phone}</p>
            <p><span className="text-gray-500">디자이너</span> {groomer?.name}</p>
            <p><span className="text-gray-500">서비스</span> {SERVICE_DEFS.find((s) => s.id === serviceId)?.name ?? service?.name} · {selectedPets.length}마리 = {basePrice.toLocaleString()}원</p>
            <p><span className="text-gray-500">일시</span> {date && formatDate(date)} {time}</p>
            <p><span className="text-gray-500">반려동물</span> {selectedPets.map((p) => `${p.name} (${p.species})`).join(", ")}</p>
            <p><span className="text-gray-500">방문 주소</span> {customerAddress}</p>
          </div>
          <div className="card p-5 bg-amber-50/80 border-amber-200/60">
            <h4 className="font-medium text-amber-900 mb-2">추가사항 (선택)</h4>
            <p className="text-xs text-amber-700 mb-3">해당되는 항목이 있으면 선택해 주세요. 미용 시 확인 후 추가금이 발생할 수 있습니다.</p>
            <div className="space-y-2">
              {additionalFeesList.map((f) => {
                const checked = selectedAdditionalFees.includes(f.id);
                return (
                  <label key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-100/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAdditionalFees((prev) => [...prev, f.id]);
                        } else {
                          setSelectedAdditionalFees((prev) => prev.filter((id) => id !== f.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-amber-300 text-mimi-orange focus:ring-mimi-orange"
                    />
                    <span className="flex-1 text-sm text-gray-800">{f.name}</span>
                    {f.description && <span className="text-xs text-amber-700">{f.description}</span>}
                    <span className="font-medium text-amber-800">{getAdditionalFeePrice(f, primaryBreed).toLocaleString()}원</span>
                  </label>
                );
              })}
            </div>
            {additionalFeesTotal > 0 && (
              <p className="mt-2 text-sm font-medium text-amber-900">추가요금 합계: {additionalFeesTotal.toLocaleString()}원</p>
            )}
          </div>
          <div className="p-4 bg-mimi-primary/5 rounded-xl border border-mimi-primary/20">
            <h4 className="flex items-center gap-2 font-medium text-mimi-charcoal mb-2">
              <span className="w-6 h-6 rounded-full bg-mimi-primary/20 text-mimi-primary flex items-center justify-center text-xs">!</span>
              알아두세요!
            </h4>
            <p className="text-sm text-mimi-slate leading-relaxed">
              서비스를 진행할 장소를 미리 결정하고, 서비스 전에 물기를 모두 제거해 주세요. (욕실, 베란다 등) 미미살롱펫은 디자이너가 찾아가는 서비스입니다. 때문에 앞뒤 예약과 이동시간 등의 변수가 발생해서 예약 시간을 조정해야 할 수도 있습니다. 이 경우 디자이너가 사전에 미리 연락을 드립니다.
            </p>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-bold text-gray-800">총 결제금액</span>
            <span className="text-xl font-bold text-mimi-orange">{totalPrice.toLocaleString()}원</span>
          </div>
          {canUsePoints && ownedPoints > 0 && (
            <p className="text-xs text-blue-600">2회차 이상 고객: 결제 단계에서 보유 포인트({ownedPoints}P) 사용 가능</p>
          )}
          <p className="text-xs text-green-600 flex items-center gap-2">
            <span>✓</span> 고객약관 확인 및 동의 완료
          </p>
          {photoConsentAgreed && (
            <p className="text-xs text-green-600 flex items-center gap-2">
              <span>✓</span> 미용 전후 사진 촬영 동의
            </p>
          )}
          <button
            onClick={() => setStep("payment")}
            className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold"
          >
            결제하기
          </button>
          <button onClick={() => setStep("terms")} className="text-gray-500 text-sm">← 이전</button>
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-6">
          <div className="card p-5 space-y-2 bg-gray-50/50">
            <p><span className="text-gray-500">디자이너</span> {groomer?.name}</p>
            <p><span className="text-gray-500">서비스</span> {SERVICE_DEFS.find((s) => s.id === serviceId)?.name ?? service?.name} · {selectedPets.length}마리 = {basePrice.toLocaleString()}원</p>
            {selectedAdditionalItems.length > 0 && (
              <p><span className="text-gray-500">추가사항</span> {selectedAdditionalItems.map((f) => `${f.name} ${getAdditionalFeePrice(f, primaryBreed).toLocaleString()}원`).join(", ")} = {additionalFeesTotal.toLocaleString()}원</p>
            )}
            <p><span className="text-gray-500">일시</span> {date && formatDate(date)} {time}</p>
            <p><span className="text-gray-500">반려동물</span> {selectedPets.map((p) => `${p.name} (${p.species})`).join(", ")}</p>
            <p><span className="text-gray-500">주소</span> {customerAddress}</p>
          </div>
          {canUsePoints && ownedPoints > 0 && maxUsable > 0 && (
            <div className="card p-5 bg-blue-50/80 border-blue-200/60">
              <h4 className="font-medium text-blue-900 mb-2">포인트 사용</h4>
              <p className="text-sm text-blue-700 mb-2">보유: {ownedPoints}P · 최대 사용: {maxUsable}P (결제금액의 {pointSettings.maxUsePercent}%까지)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxUsable}
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Math.min(maxUsable, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  className="w-24 px-3 py-2 rounded-lg border border-blue-200 text-sm"
                />
                <span className="text-sm text-blue-800">P = {pointDiscount.toLocaleString()}원 할인</span>
                <button
                  type="button"
                  onClick={() => setPointsToUse(maxUsable)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  전액 사용
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-t">
            <span className="font-bold text-gray-800">총 결제금액</span>
            <span className="text-xl font-bold text-mimi-orange">
              {finalPrice.toLocaleString()}원
              {pointDiscount > 0 && <span className="text-sm font-normal text-green-600 ml-1">(포인트 {pointDiscount.toLocaleString()}원 할인)</span>}
            </span>
          </div>
          <p className="text-sm text-gray-500">* 데모: 결제 버튼 클릭 시 예약 확정 · 결제 후 포인트 적립</p>
          <button
            onClick={handlePayment}
            className="w-full py-4 bg-mimi-orange text-white rounded-xl font-bold text-lg hover:bg-mimi-orange/90"
          >
            {finalPrice.toLocaleString()}원 결제하기
          </button>
          <button onClick={() => setStep("confirm")} className="text-gray-500 text-sm">← 이전</button>
        </div>
      )}

    </div>
  );
}
