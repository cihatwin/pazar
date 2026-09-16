import type { ReactNode } from "react";
import CatalogEmpty from "@/components/marketplace/CatalogEmpty";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  if (CATALOG_RESET_MODE) return <CatalogEmpty title="Yeni ödeme akışı hazırlanıyor" text="Eski sipariş ve ödeme verileri yeni PAZAR. altyapısından tamamen ayrı tutuluyor." />;
  return children;
}
