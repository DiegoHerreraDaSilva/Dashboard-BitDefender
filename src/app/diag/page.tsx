import { BrowserInfo } from "./BrowserInfo";

export const dynamic = "force-dynamic";

// Zero-CSS-dependency diagnostic page: every visual element here uses inline
// style attributes only, never a stylesheet or Tailwind class, so it renders
// identically regardless of whether the TV's browser can load/parse
// globals.css at all. The flex/grid/var test boxes below are plain
// server-rendered HTML — they need no JavaScript to be informative, so they
// still answer the question even if this browser's JS engine can't run
// React's client-side hydration at all. Point of this page: find out
// exactly what this browser is and what it supports, instead of guessing.
export default function DiagPage() {
  return (
    <div style={{ background: "#ffffff", color: "#000000", fontFamily: "sans-serif", padding: "16px", fontSize: "20px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "28px", marginBottom: "16px" }}>Diagnostico do navegador</h1>

      <BrowserInfo />

      <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Teste visual: flexbox</h2>
      <p style={{ marginBottom: "4px" }}>Se funcionar, os 3 quadrados abaixo ficam LADO A LADO:</p>
      <div style={{ display: "flex", flexDirection: "row", gap: "8px", marginBottom: "24px" }}>
        <div style={{ width: "80px", height: "80px", background: "#ff0000", color: "#fff", textAlign: "center", lineHeight: "80px" }}>1</div>
        <div style={{ width: "80px", height: "80px", background: "#00aa00", color: "#fff", textAlign: "center", lineHeight: "80px" }}>2</div>
        <div style={{ width: "80px", height: "80px", background: "#0000ff", color: "#fff", textAlign: "center", lineHeight: "80px" }}>3</div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Teste visual: CSS grid</h2>
      <p style={{ marginBottom: "4px" }}>Se funcionar, os 3 quadrados abaixo ficam em 3 COLUNAS:</p>
      <div style={{ display: "grid", gridTemplateColumns: "80px 80px 80px", gap: "8px", marginBottom: "24px" }}>
        <div style={{ height: "80px", background: "#ff8800", color: "#fff", textAlign: "center", lineHeight: "80px" }}>A</div>
        <div style={{ height: "80px", background: "#aa00aa", color: "#fff", textAlign: "center", lineHeight: "80px" }}>B</div>
        <div style={{ height: "80px", background: "#008888", color: "#fff", textAlign: "center", lineHeight: "80px" }}>C</div>
      </div>

      <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Teste visual: CSS custom property (var)</h2>
      <p style={{ marginBottom: "4px" }}>Se funcionar, o quadrado abaixo fica AMARELO (não cinza):</p>
      <div
        style={{
          height: "80px",
          width: "240px",
          // @ts-expect-error -- CSS custom property, not a typed React style key
          "--test-color": "#ffcc00",
          background: "var(--test-color, #888888)",
          marginBottom: "24px",
        }}
      />
    </div>
  );
}
