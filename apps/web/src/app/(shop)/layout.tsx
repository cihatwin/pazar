"use client";

import type { ReactNode } from "react";
import AppHeader from "@/components/header/AppHeader";
import CategoryBarMega from "@/components/partials/CategoryBarMega";
import AppFooter from "@/components/partials/AppFooter";
import ChatWidget from "@/components/ChatWidget/ChatWidget";
import "@/components/admin/ui/toast.css";
import { useT } from "@/lib/useT";
import MaintenanceGate from "@/components/system/MaintenanceGate";
import MobileAppCampaign from "@/components/mobile-app/MobileAppCampaign";
import PresenceTracker from "@/components/PresenceTracker";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";
export default function ShopLayout({ children }: { children: ReactNode }) {
  const { loc } = useT();

  return (
    <>
    <MaintenanceGate>
      <AppHeader />
      {!CATALOG_RESET_MODE ? <CategoryBarMega /> : null}
      
      <main style={{ minHeight: "calc(100vh - 120px)" }}>{children}</main>

      {/* ✅ dil artık otomatik */}
      <ChatWidget loc={loc} />
      {!CATALOG_RESET_MODE ? <MobileAppCampaign /> : null}
      <PresenceTracker />

      {CATALOG_RESET_MODE ? <MarketplaceFooter /> : <AppFooter />}
      </MaintenanceGate>
    </>
  );
}
