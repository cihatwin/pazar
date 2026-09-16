import Link from "next/link";
import styles from "./seller.module.css";

const benefits = [
  ["01", "Kendi vitrinin", "Markanı, koleksiyonlarını ve hikâyeni sana ait güçlü bir mağazada sergile."],
  ["02", "Tek merkezden yönet", "Ürün, stok, fiyat, sipariş ve müşteri süreçlerini tek panelden kontrol et."],
  ["03", "Yeni müşterilere ulaş", "PAZAR.’ın keşif alanlarında doğru müşterilerle buluş ve işini büyüt."],
];

export default function SellerLandingPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>PAZAR. SELLER NETWORK / 01</span>
          <h1>Ürünün iyi.<br /><em>Vitrinin de öyle olsun.</em></h1>
          <p>Mağazanı kur, ürünlerini yönet ve yeni müşterilere ulaş. Satış yolculuğunun tamamı için tasarlanmış bağımsız satıcı alanı.</p>
          <div className={styles.heroActions}>
            <Link href="/satici/basvuru" className={styles.primaryCta}>Mağazanı kur <span>↗</span></Link>
            <a href="#surec" className={styles.secondaryCta}>Süreci incele <span>↓</span></a>
          </div>
          <div className={styles.heroTrust}><i /> Başvuru ücretsiz · Yayına alma öncesi kontrol</div>
        </div>
        <div className={styles.heroVisual} aria-label="Satıcı operasyon merkezi önizlemesi">
          <div className={styles.visualTop}><span>PAZAR. CONTROL</span><b>CANLI</b></div>
          <div className={styles.visualMetric}><small>MAĞAZA POTANSİYELİ</small><strong>Her yerden<br />yönet.</strong></div>
          <div className={styles.visualGrid}>
            <div><span>01</span><b>Ürünler</b><small>Katalog kontrolü</small></div>
            <div><span>02</span><b>Siparişler</b><small>Canlı operasyon</small></div>
            <div><span>03</span><b>Büyüme</b><small>Net içgörüler</small></div>
            <div className={styles.visualAccent}><span>04</span><b>Senin markan</b><small>Senin vitrinin</small></div>
          </div>
        </div>
      </section>

      <section className={styles.benefits} id="avantajlar">
        <div className={styles.sectionIntro}><span>SATICI ALTYAPISI</span><h2>İşi büyütmek için<br />gereken her şey.</h2></div>
        <div className={styles.benefitGrid}>{benefits.map(([no,title,text]) => <article key={no}><span>{no}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className={styles.process} id="surec">
        <div><span className={styles.eyebrow}>4 ADIMDA YAYINA HAZIR</span><h2>Başvurudan<br />ilk siparişe.</h2></div>
        <ol>
          <li><b>01</b><div><strong>Hesabını oluştur</strong><small>Güvenli satıcı hesabını birkaç dakikada aç.</small></div></li>
          <li><b>02</b><div><strong>İşletmeni tanıt</strong><small>Temel işletme ve iletişim bilgilerini tamamla.</small></div></li>
          <li><b>03</b><div><strong>Mağazanı tasarla</strong><small>Mağaza adını, kategorini ve hikâyeni belirle.</small></div></li>
          <li><b>04</b><div><strong>Kontrole gönder</strong><small>Ekibimiz incelesin, mağazan satışa hazırlansın.</small></div></li>
        </ol>
      </section>

      <section className={styles.finalCta}>
        <span>HAZIRSAN BAŞLAYALIM</span><h2>Sıradaki güçlü mağaza<br />seninki olabilir.</h2>
        <Link href="/satici/basvuru">Satıcı hesabı oluştur <b>↗</b></Link>
      </section>
    </>
  );
}
