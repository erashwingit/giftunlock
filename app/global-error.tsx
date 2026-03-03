"use client";

/**
 * Global error boundary — must include its own <html>/<body>
 * because it replaces the root layout on catastrophic errors.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0A0A0B",
          color: "#F0F0F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#4A4A58", marginBottom: "1.5rem" }}>
            Please try refreshing the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#FFB800",
              color: "#0A0A0B",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
