import type { Metadata } from "next";
import { dashboardRefreshSeconds } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schwaben — Status de Segurança",
  description: "Painel de status de segurança GravityZone para exibição em TV.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Full-page reload cycle, not client JS polling — this is what lets the
            dashboard self-heal on an unattended TV browser for weeks at a time. */}
        <meta httpEquiv="refresh" content={String(dashboardRefreshSeconds)} />
      </head>
      <body>{children}</body>
    </html>
  );
}
