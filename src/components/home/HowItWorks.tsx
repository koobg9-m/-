import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "예약하기",
    description: "원하는 날짜와 서비스를 선택하고 예약해요",
    icon: "📅",
  },
  {
    number: "2",
    title: "그루머 방문",
    description: "전문 그루머가 예약 시간에 집으로 찾아와요",
    icon: "🚗",
  },
  {
    number: "3",
    title: "편안한 미용",
    description: "익숙한 공간에서 반려동물이 편하게 미용받아요",
    icon: "✨",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-mimi-cream">
      <div className="page-container">
        <div className="text-center mb-16">
          <h2 className="section-title">이용 방법</h2>
          <p className="section-subtitle">세 가지 단계로 간편하게 이용하세요</p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border border-stone-100 shadow-card flex items-center justify-center text-4xl group-hover:shadow-card-hover transition-shadow duration-300">
                {step.icon}
              </div>
              <span className="absolute -top-1 -right-1 w-8 h-8 bg-mimi-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-soft">
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-mimi-charcoal mb-3">{step.title}</h3>
              <p className="text-mimi-slate leading-relaxed">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[55%] w-[90%] h-px bg-stone-200" />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link href="/booking" prefetch={false} className="btn-primary inline-flex items-center gap-2 py-4 px-8">
            지금 예약하기
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
