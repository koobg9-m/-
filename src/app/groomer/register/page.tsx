"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

const MY_GROOMER_KEY = "mimi_my_groomer_id";

const GroomerSetupForm = dynamic(() => import("@/components/groomer/GroomerSetupForm"), { ssr: false });

/** 디자이너 신청 전용 페이지 - 별도 URL로 등록 폼 직접 표시 */
export default function GroomerRegisterPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(MY_GROOMER_KEY);
    sessionStorage.removeItem("mimi_groomer_authenticated");
  }, []);

  return <GroomerSetupForm />;
}
