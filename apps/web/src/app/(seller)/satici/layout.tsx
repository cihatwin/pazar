"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./seller.module.css";

export default function SellerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBusinessAdmin = pathname.startsWith("/satici/panel");

  return (
    <div className={`${styles.sellerWorld} ${isBusinessAdmin ? styles.businessAdminWorld : ""}`}>
      {!isBusinessAdmin ? (
      <header className={styles.sellerHeader}>
        <div className={styles.headerInner}>
          <Link href="/satici" className={styles.sellerBrand}>
            <span className={styles.brandMark}>P.</span>
            <span><b>PAZAR.</b><small>SATICI</small></span>
          </Link>
          <nav className={styles.sellerNav} aria-label="Satıcı alanı">
            <Link href="/satici#avantajlar">Neden PAZAR.</Link>
            <Link href="/satici#surec">Nasıl çalışır?</Link>
            <Link href="/iletisim">Destek</Link>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/satici/giris" className={styles.loginLink}>Satıcı girişi</Link>
            <Link href="/satici/basvuru" className={styles.joinLink}>Mağazanı aç <span>↗</span></Link>
          </div>
        </div>
      </header>
      ) : null}

      <main>{children}</main>

      {!isBusinessAdmin ? (
      <footer className={styles.sellerFooter}>
        <Link href="/satici" className={styles.footerBrand}>PAZAR<span>.</span> SATICI</Link>
        <p>Bağımsız markaların büyüme alanı.</p>
        <div><Link href="/">Alışverişe dön</Link><Link href="/iletisim">Satıcı desteği</Link></div>
      </footer>
      ) : null}
    </div>
  );
}
