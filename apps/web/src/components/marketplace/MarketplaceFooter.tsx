import Link from "next/link";
import styles from "./MarketplaceFooter.module.css";

const footerGroups = [
  {
    title: "Keşfet",
    links: [
      { label: "Mağaza", href: "/shop" },
      { label: "Ürün ara", href: "/search" },
      { label: "Hesabım", href: "/hesabim" },
      { label: "Yeni mağazalar", href: "/shop" },
    ],
  },
  {
    title: "PAZAR.’da Sat",
    links: [
      { label: "Satıcı dünyası", href: "/satici" },
      { label: "Satıcı girişi", href: "/satici/giris" },
      { label: "Mağazanı büyüt", href: "/satici#avantajlar" },
      { label: "Satıcı desteği", href: "/iletisim" },
    ],
  },
  {
    title: "Destek",
    links: [
      { label: "İletişim", href: "/iletisim" },
      { label: "Hesabım", href: "/hesabim" },
      { label: "Güvenli alışveriş", href: "/kullanim-kosullari" },
      { label: "Gizlilik merkezi", href: "/gizlilik-politikasi" },
    ],
  },
];

export default function MarketplaceFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <section className={styles.sellerCallout}>
          <div>
            <span className={styles.eyebrow}>SATICILAR İÇİN PAZAR.</span>
            <h2>İyi ürünün varsa,<br />burada yerin var.</h2>
          </div>
          <div className={styles.calloutAction}>
            <p>Mağazanı aç, ürünlerini yönet ve yeni müşterilerle buluş.</p>
            <Link href="/satici">
              Satıcı olarak katıl <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        <div className={styles.mainGrid}>
          <section className={styles.brandBlock}>
            <Link href="/" className={styles.brand} aria-label="PAZAR. ana sayfa">
              PAZAR<span>.</span>
            </Link>
            <p className={styles.manifesto}>
              Güçlü markaları, bağımsız satıcıları ve iyi ürünleri tek bir seçkin pazarda buluşturuyoruz.
            </p>
            <div className={styles.status}>
              <i aria-hidden="true" /> Yeni nesil pazar aktif
            </div>
          </section>

          <nav className={styles.navGrid} aria-label="Footer navigasyonu">
            {footerGroups.map((group) => (
              <div className={styles.linkGroup} key={group.title}>
                <h3>{group.title}</h3>
                {group.links.map((link) => (
                  <Link href={link.href} key={`${group.title}-${link.label}`}>
                    {link.label} <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <section className={styles.trustBar} aria-label="PAZAR. hizmet güvenceleri">
          <div><span>01</span><strong>Güvenli ödeme</strong><small>Korunan alışveriş</small></div>
          <div><span>02</span><strong>Seçili satıcılar</strong><small>Kontrollü mağazalar</small></div>
          <div><span>03</span><strong>Kolay teslimat</strong><small>Takip edilebilir kargo</small></div>
          <div><span>04</span><strong>Canlı destek</strong><small>Yanında olan ekip</small></div>
        </section>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} PAZAR. Tüm hakları saklıdır.</span>
          <div className={styles.legalLinks}>
            <Link href="/gizlilik-politikasi">Gizlilik</Link>
            <Link href="/kullanim-kosullari">Kullanım Koşulları</Link>
            <Link href="/cerez-politikasi">Çerezler</Link>
          </div>
          <span className={styles.signature}>İstanbul’dan, herkes için.</span>
        </div>
      </div>
    </footer>
  );
}
