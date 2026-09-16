"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, PackageOpen, ShieldCheck, Store, Truck } from "lucide-react";
import styles from "./HomeClient.module.css";

const steps = [
  { no: "01", title: "Mağazanı oluştur", text: "Başvurunu tamamla, kendi vitrininle satışa hazırlan." },
  { no: "02", title: "Ürünlerini ekle", text: "Ürün, stok ve fiyatlarını tek panelden kolayca yönet." },
  { no: "03", title: "Siparişleri büyüt", text: "Yeni müşterilere ulaş, operasyonunu tek yerden takip et." },
];

export default function HomeClient() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.glowOne} /><div className={styles.glowTwo} />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.badge}><span /> Yeni bir pazar kuruluyor</div>
            <h1>Aradığın her şey.<br /><em>Tek pazarda.</em></h1>
            <p>Bağımsız satıcıları ve güçlü markaları müşterilerle buluşturan yeni nesil alışveriş deneyimi. Katalog şu anda sıfırdan hazırlanıyor.</p>
            <div className={styles.actions}>
              <Link href="/shop" className={styles.primary}>Mağazayı keşfet <ArrowRight size={18} /></Link>
              <Link href="/satici" className={styles.secondary}>Satıcı olarak katıl</Link>
            </div>
          </div>
          <div className={styles.heroPanel} aria-label="Pazaryeri hazırlık durumu">
            <div className={styles.panelTop}><span>PAZAR / 01</span><BadgeCheck size={24} /></div>
            <div className={styles.panelIcon}><PackageOpen size={54} strokeWidth={1.6} /></div>
            <div><strong>Temiz katalog</strong><p>Eski ürünler kaldırıldı. Yeni koleksiyon ve satıcılar için hazır.</p></div>
            <div className={styles.progress}><span /></div>
            <small>ALTYAPI HAZIR • KATALOG HAZIRLANIYOR</small>
          </div>
        </div>
      </section>

      <section className={styles.promise}>
        <div><ShieldCheck /><span><b>Güvenli ödeme</b><small>Korunan alışveriş</small></span></div>
        <div><Store /><span><b>Seçili satıcılar</b><small>Kontrollü mağazalar</small></span></div>
        <div><Truck /><span><b>Kolay teslimat</b><small>Takip edilebilir kargo</small></span></div>
      </section>

      <section className={styles.sellerSection}>
        <div className={styles.sectionLead}>
          <span>Satıcılar için</span><h2>İyi ürünün varsa,<br />burada yerin var.</h2>
          <p>Mağazanı kur, ürünlerini yönet ve yeni müşterilere ulaş.</p>
          <Link href="/satici">Satıcı dünyasına gir <ArrowRight size={17} /></Link>
        </div>
        <div className={styles.steps}>
          {steps.map((step) => <article key={step.no}><span>{step.no}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
        </div>
      </section>
    </main>
  );
}
