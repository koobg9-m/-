"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const msg = error?.message || "알 수 없는 오류가 발생했습니다.";
  const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";

  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          background: "linear-gradient(to bottom, #fef3c7, #fed7aa)",
        }}>
          <div style={{ textAlign: "center", maxWidth: "32rem" }}>
            <span style={{ fontSize: "4rem" }}>😿</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "1rem", color: "#1f2937" }}>
              오류가 발생했습니다
            </h1>
            <p style={{ marginTop: "0.5rem", color: "#c2410c", fontSize: "0.9rem", fontWeight: 500 }}>
              {msg}
            </p>
            {isDev && error?.stack && (
              <pre style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#f3f4f6",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                overflow: "auto",
                textAlign: "left",
                maxHeight: "200px",
              }}>
                {error.stack}
              </pre>
            )}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#f97316",
                  color: "white",
                  border: "none",
                  borderRadius: "9999px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                다시 시도
              </button>
              <a
                href="/"
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "white",
                  color: "#f97316",
                  border: "2px solid #f97316",
                  borderRadius: "9999px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                홈으로
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
