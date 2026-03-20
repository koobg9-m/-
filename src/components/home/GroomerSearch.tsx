"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getGroomerProfiles } from "@/lib/groomer-storage";
import type { GroomerProfile } from "@/lib/groomer-types";

export default function GroomerSearch() {
  const [location, setLocation] = useState("");
  const [searched, setSearched] = useState(false);
  const [groomers, setGroomers] = useState<GroomerProfile[]>([]);

  useEffect(() => {
    getGroomerProfiles().then(setGroomers);
  }, []);

  const handleSearch = () => {
    if (location.trim()) setSearched(true);
  };

  const loc = location.trim();
  const getArea = (g: GroomerProfile) => g.address ?? g.area ?? "";
  const filteredGroomers = loc
    ? groomers.filter((g) => getArea(g).includes(loc) || loc.includes(getArea(g).split(" ")[0]))
    : groomers;

  const showGroomers = searched || groomers.length > 0;
  const hasSearchFilter = location.trim().length > 0;
  const groomersToShow = hasSearchFilter ? filteredGroomers : groomers;

  return (
    <section className="section-padding bg-white">
      <div className="page-container">
        <div className="text-center mb-14">
          <h2 className="section-title">내 지역 그루머 찾기</h2>
          <p className="section-subtitle">주소를 입력하면 가까운 전문 그루머를 찾아드려요</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 p-6 card">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mimi-slate text-xl">📍</span>
              <input
                type="text"
                placeholder="시·구·동 또는 우편번호 입력"
                value={location}
                onChange={(e) => { setLocation(e.target.value); setSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="input-field pl-12"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="btn-accent px-8 py-4 whitespace-nowrap"
            >
              그루머 찾기
            </button>
          </div>
          <p className="text-center text-mimi-slate text-sm mt-5">
            서울, 경기, 인천 및 주요 도시 서비스 가능
          </p>
        </div>

        {showGroomers && (
          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-mimi-charcoal mb-8">
              {location.trim() && filteredGroomers.length > 0 ? "검색 결과" : "등록된 디자이너"} ({groomersToShow.length}명)
            </h3>
            {groomersToShow.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-mimi-slate mb-4">등록된 디자이너가 없어요</p>
                <Link href="/groomer/register" className="text-mimi-primary hover:text-mimi-primaryDark font-medium inline-flex items-center gap-1">
                  디자이너 신청하기 →
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                {groomersToShow.map((g) => (
                  <div key={g.id} className="card card-hover p-6">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-mimi-primary/10 flex items-center justify-center text-2xl flex-shrink-0">👤</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-mimi-charcoal text-lg">{g.name}</h4>
                        <p className="text-sm text-mimi-slate mt-0.5">{g.address ?? g.area} · 반경 {g.radiusKm ?? 10}km</p>
                        {g.intro && <p className="text-sm text-mimi-slate mt-2 line-clamp-2">{g.intro}</p>}
                        <p className="text-sm text-mimi-primary font-medium mt-2">전체 미용 서비스</p>
                      </div>
                    </div>
                    <Link
                      href={`/booking?groomer=${g.id}`}
                      className="mt-5 block w-full py-3 text-center bg-mimi-primary/10 text-mimi-primary rounded-xl font-medium hover:bg-mimi-primary hover:text-white transition-colors text-sm"
                    >
                      예약하기
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
