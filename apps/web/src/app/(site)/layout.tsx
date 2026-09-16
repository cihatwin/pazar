import AppHeader from "@/components/header/AppHeader";
import CategoryBarMega from "@/components/partials/CategoryBarMega";
import AppFooter from "@/components/partials/AppFooter";
import LocalizedChatWidget from "@/components/ChatWidget/LocalizedChatWidget";
import MaintenanceGate from "@/components/system/MaintenanceGate";
import FloatingButtons from "@/components/FloatingButtons";
import CartAbandonGuard from "@/components/CartAbandonGuard";
import PresenceTracker from "@/components/PresenceTracker";
import MobileAppCampaign from "@/components/mobile-app/MobileAppCampaign";
import MarketplaceFooter from "@/components/marketplace/MarketplaceFooter";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* GA4 / GTM root layout'ta zaten yükleniyor, burada tekrar yükleme */}

      <MaintenanceGate>

        <AppHeader />

        {!CATALOG_RESET_MODE ? <CategoryBarMega /> : null}

        {children}

        <LocalizedChatWidget />

        <FloatingButtons />

        <CartAbandonGuard />

        <PresenceTracker />

        {CATALOG_RESET_MODE ? <MarketplaceFooter /> : <AppFooter />}

        {!CATALOG_RESET_MODE ? <MobileAppCampaign /> : null}

      </MaintenanceGate>
    </>
  );
}
