"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { BarChart3, Boxes, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, PackagePlus, ReceiptText, Settings2, Store, WalletCards, X } from "lucide-react";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase.client";
import styles from "./SellerPanelShell.module.css";

type SellerProfile = {
  status?: "pending" | "approved" | "rejected";
  storeName?: string;
  legalName?: string;
  category?: string;
  city?: string;
};

type SellerContextValue = { user: User; seller: SellerProfile; approved: boolean };
const SellerContext = createContext<SellerContextValue | null>(null);
export function useSellerPanel() {
  const value = useContext(SellerContext);
  if (!value) throw new Error("useSellerPanel must be used inside SellerPanelShell");
  return value;
}

const nav = [
  { href: "/satici/panel", label: "Genel Bakış", hint: "İşletme özeti", icon: LayoutDashboard },
  { href: "/satici/panel/urunler", label: "Ürünler", hint: "Katalog ve onaylar", icon: Boxes },
  { href: "/satici/panel/urunler/yeni", label: "Yeni Ürün", hint: "Ürün yükleme sihirbazı", icon: PackagePlus },
  { href: "/satici/panel/siparisler", label: "Siparişler", hint: "Hazırlama ve teslimat", icon: ReceiptText },
  { href: "/satici/panel/finans", label: "Finans", hint: "Bakiye ve ödemeler", icon: WalletCards },
  { href: "/satici/panel/magaza", label: "Mağaza", hint: "Vitrin ve işletme ayarları", icon: Store },
  { href: "/satici/panel/analitik", label: "Analitik", hint: "Performans görünümü", icon: BarChart3 },
];

export default function SellerPanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
    setUser(nextUser);
    if (!nextUser) { setSeller(null); setLoading(false); return; }
    try {
      const snapshot = await getDoc(doc(getFirebaseDb(), "users", nextUser.uid));
      setSeller((snapshot.data()?.sellerOnboarding || null) as SellerProfile | null);
    } catch { setSeller(null); }
    setLoading(false);
  }), []);

  useEffect(() => setOpen(false), [pathname]);

  if (loading) return <div className={styles.statePage}><i /><span>İşletme merkezi hazırlanıyor</span></div>;
  if (!user || !seller) return (
    <section className={styles.gatePage}>
      <div><span>PAZAR. BUSINESS ACCESS</span><h1>İşletme hesabınla devam et.</h1><p>Bu panel mağaza sahiplerine özeldir. Satıcı hesabınla giriş yapabilir veya yeni işletme başvurusu oluşturabilirsin.</p><div><Link href="/satici/giris">İşletme girişi</Link><Link href="/satici/basvuru">Mağaza oluştur</Link></div></div>
    </section>
  );

  const approved = seller.status === "approved";
  return (
    <SellerContext.Provider value={{ user, seller, approved }}>
      <div className={styles.shell}>
        <button className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`} onClick={() => setOpen(false)} aria-label="Menüyü kapat" />
        <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
          <div className={styles.brand}><span>P.</span><div><strong>PAZAR.</strong><small>İŞLETME ADMİN</small></div><button onClick={() => setOpen(false)} aria-label="Kapat"><X size={18} /></button></div>
          <div className={styles.storeCard}><small>AKTİF İŞLETME</small><strong>{seller.storeName || seller.legalName || "Yeni mağaza"}</strong><span className={approved ? styles.approved : seller.status === "rejected" ? styles.rejected : styles.pending}><i />{approved ? "Satışa açık" : seller.status === "rejected" ? "Düzeltme gerekli" : "Onay bekliyor"}</span></div>
          <nav>{nav.map(({ href, label, hint, icon: Icon }) => {
            const active = href === "/satici/panel" ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? styles.active : ""}><span><Icon size={18} /></span><div><b>{label}</b><small>{hint}</small></div><ChevronRight size={14} /></Link>;
          })}</nav>
          <div className={styles.sideFooter}><Link href="/iletisim"><CircleHelp size={17} /> İşletme desteği</Link><button onClick={async () => { await signOut(getFirebaseAuth()); router.push("/satici/giris"); }}><LogOut size={17} /> Güvenli çıkış</button></div>
        </aside>
        <div className={styles.contentArea}>
          <header className={styles.topbar}><div><button onClick={() => setOpen(true)} aria-label="Menüyü aç"><Menu size={20} /></button><div><small>PAZAR. BUSINESS OS</small><strong>{seller.storeName || "İşletme Merkezi"}</strong></div></div><div className={styles.topActions}><Link href="/satici/panel/urunler/yeni"><PackagePlus size={16} /> Ürün ekle</Link><Link href="/satici/panel/magaza"><Settings2 size={16} /></Link><span>{user.email?.slice(0, 1).toUpperCase()}</span></div></header>
          {!approved ? <div className={styles.approvalStrip}><i /><b>{seller.status === "rejected" ? "Başvuru güncellemesi gerekli" : "İşletmen Süper Admin onayında"}</b><span>Ürün ve satış işlemleri onay sonrasında açılır.</span></div> : null}
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </SellerContext.Provider>
  );
}
