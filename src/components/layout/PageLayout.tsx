import Link from "next/link";

type PageLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  maxWidth?: "page" | "content" | "full";
};

export default function PageLayout({
  children,
  title,
  subtitle,
  backHref = "/",
  backLabel = "홈으로",
  maxWidth = "content",
}: PageLayoutProps) {
  const containerClass = maxWidth === "page" ? "page-container" : maxWidth === "content" ? "content-container" : "w-full";
  return (
    <div className={`${containerClass} py-8 md:py-12`}>
      {(backHref || title) && (
        <div className="mb-8">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-mimi-slate hover:text-mimi-primary transition-colors mb-4"
            >
              <span>←</span>
              <span>{backLabel}</span>
            </Link>
          )}
          {title && (
            <h1 className="section-title">{title}</h1>
          )}
          {subtitle && (
            <p className="section-subtitle">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
