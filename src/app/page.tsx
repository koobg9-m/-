"use client";

import dynamic from "next/dynamic";
import QuickLinks from "@/components/home/QuickLinks";
import HowItWorks from "@/components/home/HowItWorks";
import ServiceMenu from "@/components/home/ServiceMenu";

const Hero = dynamic(() => import("@/components/home/Hero"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-amber-50/20">
      <div className="animate-pulse text-4xl">🐾</div>
    </div>
  ),
});

const Header = dynamic(() => import("@/components/layout/Header"), {
  ssr: false,
  loading: () => <div className="h-16 bg-white border-b" />,
});
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const HomeGallery = dynamic(() => import("@/components/home/HomeGallery"), {
  ssr: false,
  loading: () => (
    <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5">
      <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />
    </section>
  ),
});
const HomeProductLinks = dynamic(() => import("@/components/home/HomeProductLinks"), {
  ssr: false,
  loading: () => (
    <section className="py-6 md:py-8 bg-mimi-cream rounded-2xl border border-stone-100 p-5">
      <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />
    </section>
  ),
});

const HomeNotices = dynamic(() => import("@/components/home/HomeNotices"), {
  ssr: false,
  loading: () => (
    <section className="py-6 md:py-8 bg-mimi-cream rounded-2xl border border-stone-100 p-5">
      <div className="h-24 rounded-xl bg-stone-100 animate-pulse" />
    </section>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full">
      <Header />
      <main className="flex-1">
        <Hero />
        <div className="page-container py-8 md:py-10">
          <div className="mb-4">
            <HomeNotices />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            <HomeGallery />
            <HomeProductLinks />
          </div>
          <div className="mt-6">
            <QuickLinks />
          </div>
        </div>
        <HowItWorks />
        <ServiceMenu />
      </main>
      <Footer />
    </div>
  );
}
