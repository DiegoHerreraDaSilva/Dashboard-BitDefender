"use client";

import { useEffect, useState } from "react";

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface LiveClockProps {
  initial: Date;
  className?: string;
}

// The only client-side JS on this whole dashboard — isolated to just the
// clock digits. If this ever throws or the tick stops, it degrades to the
// last rendered time rather than affecting anything else on the page; the
// next full page reload (meta-refresh) resets it regardless.
export function LiveClock({ initial, className }: LiveClockProps) {
  const [now, setNow] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return <div className={className}>{TIME_FORMATTER.format(now)}</div>;
}
