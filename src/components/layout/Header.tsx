"use client";

import Link from "next/link";
import HeaderNav from "./HeaderNav";
import { useState } from "react";

export default function Header() {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100 overflow-x-hidden">
      <div className="page-container py-3 md:py-5 flex items-center justify-between gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-85 p-2 -m-2">
          <div className="rounded-xl overflow-hidden h-11 md:h-12 flex items-center">
            {logoError ? (
              <span className="font-malang-bold text-lg text-mimi-primary">미미살롱펫</span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/logo.png" alt="미미살롱펫" width={48} height={48} className="h-11 md:h-12 w-auto object-contain rounded-xl" onError={() => setLogoError(true)} />
            )}
          </div>
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
