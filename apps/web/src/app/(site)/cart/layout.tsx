import type { ReactNode } from "react";
import CatalogEmpty from "@/components/marketplace/CatalogEmpty";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

export default function CartLayout({ children }: { children: ReactNode }) {
  if (CATALOG_RESET_MODE) return <CatalogEmpty title="Yeni sepetin hazır" text="Eski siteye ait sepet verileri izole edildi. Yeni marketplace ürünleri satışa açıldığında sepetin buradan başlayacak." />;
  return children;
}
