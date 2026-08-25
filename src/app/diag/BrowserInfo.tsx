"use client";

import { useEffect, useState } from "react";

interface Info {
  ua: string;
  screen: string;
  flexSupport: string;
  gridSupport: string;
  varSupport: string;
}

// Client component so this actually runs via React's lifecycle instead of a
// raw injected <script> tag (dangerouslySetInnerHTML scripts don't reliably
// execute after hydration).
export function BrowserInfo() {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    const supports = (prop: string, value?: string) => {
      try {
        if (!window.CSS || !CSS.supports) return "CSS.supports não existe";
        return (value ? CSS.supports(prop, value) : CSS.supports(prop)) ? "SIM" : "NÃO";
      } catch {
        return "erro ao checar";
      }
    };

    // One-off read of browser globals (navigator/screen/CSS) that don't
    // exist during SSR — an effect-on-mount is the correct place for this,
    // not a cascading-render risk despite the lint rule's general advice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInfo({
      ua: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      flexSupport: supports("display", "flex"),
      gridSupport: supports("display", "grid"),
      varSupport: supports("(--x: 1)"),
    });
  }, []);

  if (!info) {
    return <p style={{ marginBottom: "24px" }}>Rodando JavaScript... (se isso nunca sumir, o motor não roda o React)</p>;
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{ marginBottom: "8px" }}>
        <b>User-Agent:</b> {info.ua}
      </p>
      <p style={{ marginBottom: "8px" }}>
        <b>Tela:</b> {info.screen}
      </p>
      <p style={{ marginBottom: "8px" }}>
        <b>CSS.supports(&quot;display&quot;,&quot;flex&quot;):</b> {info.flexSupport}
      </p>
      <p style={{ marginBottom: "8px" }}>
        <b>CSS.supports(&quot;display&quot;,&quot;grid&quot;):</b> {info.gridSupport}
      </p>
      <p>
        <b>CSS.supports(&quot;(--x: 1)&quot;) [custom properties]:</b> {info.varSupport}
      </p>
    </div>
  );
}
