"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  BellRing,
  CalendarClock,
  Heart,
  LifeBuoy,
  LogOut,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  Store,
  TicketPercent,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import styles from "@/styles/account-sidebar.module.css";
import type { AccountTab } from "@/components/account/types";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

type Props = {
  loc: "tr" | "en";
  tab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  title: string;
  breadcrumbHome: string;
  onLogout: () => void;
  adminButton?: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
};

type TabItem = {
  key: AccountTab;
  label: string;
  desc: string;
  icon: LucideIcon;
};

export default function AccountSidebar({
  loc,
  tab,
  onTabChange,
  title,
  breadcrumbHome,
  onLogout,
  adminButton,
  isOpen = false,
  onClose,
}: Props) {
  const tabs: TabItem[] = [
    {
      key: "profile",
      label: loc === "en" ? "Profile" : "Profil",
      desc: loc === "en" ? "Personal information" : "Kişisel bilgiler",
      icon: UserRound,
    },
    {
      key: "addresses",
      label: loc === "en" ? "Addresses" : "Adresler",
      desc: loc === "en" ? "Delivery and billing" : "Teslimat ve fatura",
      icon: MapPin,
    },
    {
      key: "orders",
      label: loc === "en" ? "Orders" : "Siparişler",
      desc: loc === "en" ? "Order history" : "Sipariş geçmişi",
      icon: Package,
    },
    {
      key: "appointments",
      label: loc === "en" ? "My Appointments" : "Randevularım",
      desc: loc === "en" ? "Requests and results" : "Talepler ve sonuçlar",
      icon: CalendarClock,
    },
    {
      key: "refunds",
      label: loc === "en" ? "Refund Requests" : "İade Taleplerim",
      desc: loc === "en" ? "Refund process" : "İade süreci",
      icon: RotateCcw,
    },
    {
      key: "shipments",
      label: loc === "en" ? "Shipment Tracking" : "Kargo Takibi",
      desc: loc === "en" ? "Cargo and delivery" : "Kargo ve teslimat",
      icon: Truck,
    },
    {
      key: "coupons",
      label: loc === "en" ? "My Coupons" : "Kuponlarım",
      desc: loc === "en" ? "Discount rights" : "İndirim hakları",
      icon: TicketPercent,
    },
    {
      key: "favorites",
      label: loc === "en" ? "Favorites" : "Favorilerim",
      desc: loc === "en" ? "Saved products" : "Kaydettiğin ürünler",
      icon: Heart,
    },
{

  key: "notifications",

  label: loc === "en" ? "Notifications" : "Bildirim Merkezi",

  desc: loc === "en" ? "Order and support updates" : "Sipariş ve destek bildirimleri",

  icon: Bell,

},
    {
      key: "security",
      label: loc === "en" ? "Security" : "Güvenlik",
      desc: loc === "en" ? "Login and account" : "Giriş ve hesap",
      icon: ShieldCheck,
    },
    {
      key: "stock-alerts",
      label: loc === "en" ? "Stock Alerts" : "Stok Bildirimlerim",
      desc: loc === "en" ? "Product alerts" : "Ürün bildirimleri",
      icon: BellRing,
    },
  ];
  const visibleTabs = CATALOG_RESET_MODE
    ? tabs.filter((item) => ["profile", "addresses", "security"].includes(item.key))
    : tabs;

  function handleTabClick(nextTab: AccountTab) {
    onTabChange(nextTab);
    onClose?.();
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
        onClick={onClose}
        aria-label={loc === "en" ? "Close account menu" : "Hesap menüsünü kapat"}
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        aria-label={loc === "en" ? "Account menu" : "Hesap menüsü"}
      >
          <button

    type="button"

    className={styles.mobileClose}

    onClick={onClose}

    aria-label={loc === "en" ? "Close menu" : "Menüyü kapat"}

  >

    ✕

  </button>
        <div className={styles.card}>
          <div className={styles.top}>
           

            <div className={styles.brandRow}>
              <div className={styles.brandMark}>
                <span>P.</span>
              </div>

              <div className={styles.brandText}>
                <div className={styles.brandName}>PAZAR.</div>
                <div className={styles.brandSub}>
                  {loc === "en" ? "Private account experience" : "Özel hesap deneyimi"}
                </div>
              </div>
            </div>

            <div className={styles.hero}>
              <div className={styles.kicker}>
                <span className={styles.liveDot} />
                {loc === "en" ? "Account Center" : "Hesap Merkezi"}
              </div>

              <h1 className={styles.title}>{title}</h1>

              <div className={styles.breadcrumb}>
                <Link href="/">{breadcrumbHome}</Link>
                <span>›</span>
                <span>{title}</span>
              </div>
            </div>
          </div>

          <div className={styles.panelNote}>
            <strong>{loc === "en" ? "Secure area" : "Güvenli alan"}</strong>
            <span>
              {loc === "en"
                ? "Manage orders, returns and account details."
                : CATALOG_RESET_MODE
                  ? "Yeni PAZAR. hesabını ve güvenlik bilgilerini yönet."
                  : "Sipariş, iade ve hesap bilgilerini tek merkezden yönet."}
            </span>
          </div>

          <nav className={styles.nav}>
            {visibleTabs.map((item) => {
              const active = tab === item.key;
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                  onClick={() => handleTabClick(item.key)}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={styles.navIcon}><Icon size={18} strokeWidth={2.1} /></span>

                  <span className={styles.navText}>
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={styles.navDesc}>{item.desc}</span>
                  </span>

                  <span className={styles.navArrow}>›</span>
                </button>
              );
            })}

            {adminButton ? (
              <div className={styles.adminWrap}>
                <div className={styles.adminLabel}>
                  {loc === "en" ? "Management" : "Yönetim"}
                </div>
                {adminButton}
              </div>
            ) : null}
          </nav>

          <div className={styles.utilityLinks}>
            <Link href="/iletisim"><LifeBuoy size={16} /><span>{loc === "en" ? "Get support" : "Destek al"}</span></Link>
            <Link href="/satici"><Store size={16} /><span>{loc === "en" ? "Seller world" : "Satıcı dünyası"}</span></Link>
          </div>

          <div className={styles.footer}>
            <div className={styles.footerText}>
              <strong>{loc === "en" ? "Need help?" : "Yardım mı lazım?"}</strong>
              <span>
                {loc === "en"
                  ? "Our team is ready to support you."
                  : "Ekibimiz destek için hazır."}
              </span>
            </div>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={onLogout}
              aria-label={loc === "en" ? "Logout" : "Çıkış"}
              title={loc === "en" ? "Logout" : "Çıkış"}
            >
              <LogOut size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
