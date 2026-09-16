import type { ReactNode } from "react";
import SellerPanelShell from "@/components/seller/SellerPanelShell";

export default function BusinessAdminLayout({ children }: { children: ReactNode }) {
  return <SellerPanelShell>{children}</SellerPanelShell>;
}
