"use client";

import Link from "next/link";
import { ArrowUpRight, Grid2X2, MessageCircle, ShieldCheck, Sparkles, Store, UserRound, X } from "lucide-react";
import styles from "./styles/mobileMenuPanel.module.css";

type Locale = "tr" | "en";
type LocaleText = { tr: string; en: string };
type NavItem = { label: LocaleText; url: string };
type MenuCategoryNode = { id: string; slug: string; name: any; children: MenuCategoryNode[] };
type Props = {
  open: boolean; loc: Locale; brandLink: string; brandLogoUrl: string; brandMark: string;
  brandTitle: string; nav: NavItem[]; menuCats: MenuCategoryNode[]; openCatIds: string[];
  isRealUser: boolean; onToggleCat: (id: string) => void; onClose: () => void;
};

function openLiveChat(onClose: () => void) {
  onClose();
  const launcher = document.querySelector('[data-chat-launcher], [data-chat-toggle], .chat-launcher, .chat-widget-button, .chat-toggle');
  if (launcher instanceof HTMLElement) launcher.click();
  else window.dispatchEvent(new CustomEvent("chat:open"));
}

function pickText(v: any, loc: Locale, fallback = "") {
  if (typeof v === "string") return v.trim() || fallback;
  return loc === "en" ? String(v?.en || v?.tr || fallback) : String(v?.tr || v?.en || fallback);
}

export default function MobileMenuPanel({
  open, loc, brandTitle, nav, menuCats, openCatIds, isRealUser, onToggleCat, onClose,
}: Props) {
  if (!open) return null;

  return (
    <>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label={loc === "en" ? "Close menu overlay" : "Menü katmanını kapat"} />
      <aside className={`${styles.panel} ${styles.open}`} aria-label={loc === "en" ? "Main menu" : "Ana menü"}>
        <div className={styles.noise} aria-hidden="true" />
        <header className={styles.head}>
          <Link href="/" onClick={onClose} className={styles.brand}>
            <span className={styles.brandMark}>P.</span>
            <span className={styles.brandCopy}><b>{brandTitle}</b><small>CURATED MARKETPLACE</small></span>
          </Link>
          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label={loc === "en" ? "Close menu" : "Menüyü kapat"}><X size={20} /></button>
        </header>

        <div className={styles.body}>
          <section className={styles.intro}>
            <div className={styles.introMeta}><span><Sparkles size={13} /> PRIVATE ACCESS</span><i>01 / 03</i></div>
            <h2>{loc === "en" ? "A better way to discover." : "Keşfetmenin daha seçkin yolu."}</h2>
            <p>{loc === "en" ? "Selected stores, trusted products and a refined shopping experience." : "Seçili mağazalar, güvenilir ürünler ve rafine bir alışveriş deneyimi."}</p>
            <Link className={styles.accountLink} href={isRealUser ? "/hesabim" : "/login"} onClick={onClose}>
              <UserRound size={17} /><span>{isRealUser ? (loc === "en" ? "My account" : "Hesabım") : (loc === "en" ? "Member access" : "Üye girişi")}</span><ArrowUpRight size={16} />
            </Link>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span><Grid2X2 size={15} /> {loc === "en" ? "Categories" : "Kategoriler"}</span><i>{String(menuCats.length).padStart(2, "0")}</i></div>
            {menuCats.length ? (
              <div className={styles.categoryList}>
                {menuCats.map((cat, index) => {
                  const isOpen = openCatIds.includes(cat.id);
                  const hasChildren = cat.children?.length > 0;
                  const label = pickText(cat.name, loc, cat.slug);
                  return (
                    <div key={cat.id} className={styles.catItem}>
                      {hasChildren ? (
                        <>
                          <button className={`${styles.navCard} ${isOpen ? styles.navCardOpen : ""}`} onClick={() => onToggleCat(cat.id)} type="button">
                            <small>{String(index + 1).padStart(2, "0")}</small><b>{label}</b><span>↗</span>
                          </button>
                          <div className={`${styles.subWrap} ${isOpen ? styles.subWrapOpen : ""}`}><div className={styles.subList}>
                            <Link href={`/shop?cat=${encodeURIComponent(cat.slug)}`} onClick={onClose}>Tümünü gör</Link>
                            {cat.children.map((sub) => <Link key={sub.id} href={`/shop?cat=${encodeURIComponent(sub.slug)}`} onClick={onClose}>{pickText(sub.name, loc, sub.slug)}</Link>)}
                          </div></div>
                        </>
                      ) : (
                        <Link className={styles.navCard} href={`/shop?cat=${encodeURIComponent(cat.slug)}`} onClick={onClose}><small>{String(index + 1).padStart(2, "0")}</small><b>{label}</b><span>↗</span></Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyCategories}>
                <span><Store size={22} /></span>
                <div><b>Yeni vitrin hazırlanıyor</b><small>Kategoriler, ilk koleksiyonlarla birlikte burada görünecek.</small></div>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}><span>{loc === "en" ? "Navigation" : "Kısa yollar"}</span><i>{String(nav.length).padStart(2, "0")}</i></div>
            <nav className={styles.navList}>
              {nav.map((it, index) => (
                <Link key={`${it.url}-${index}`} href={it.url} className={styles.navCard} onClick={onClose}>
                  <small>{String(index + 1).padStart(2, "0")}</small><b>{loc === "en" ? it.label.en : it.label.tr}</b><span>↗</span>
                </Link>
              ))}
            </nav>
          </section>

          <section className={styles.concierge}>
            <div className={styles.conciergeIcon}><ShieldCheck size={24} /></div>
            <div className={styles.conciergeCopy}><small>PAZAR CONCIERGE</small><h3>{loc === "en" ? "We are here when you need us." : "İhtiyacın olduğunda buradayız."}</h3></div>
            <button type="button" onClick={() => openLiveChat(onClose)}><MessageCircle size={17} /> {loc === "en" ? "Start chat" : "Sohbet başlat"}</button>
          </section>
        </div>
        <footer className={styles.foot}><span>© 2026 PAZAR.</span><span>ISTANBUL • TR</span></footer>
      </aside>
    </>
  );
}
