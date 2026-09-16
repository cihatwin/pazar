import type { ReactNode } from "react";
import CatalogEmpty from "@/components/marketplace/CatalogEmpty";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

export default function LegacyAccountOrderLayout({ children }: { children: ReactNode }) {
  if (CATALOG_RESET_MODE) return <CatalogEmpty title="Yeni sipariş geçmişin temiz" text="Eski mağazaya ait sipariş detayları PAZAR. hesabına aktarılmadı." />;
  return children;
}
