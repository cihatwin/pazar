"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Boxes, CircleCheck, Clock3, PackagePlus, ReceiptText, Store, TrendingUp, WalletCards } from "lucide-react";
import { useSellerPanel } from "@/components/seller/SellerPanelShell";
import { sellerRequest } from "@/lib/sellerClient";
import type { SellerProduct } from "@/lib/sellerTypes";
import styles from "./businessAdmin.module.css";

export default function BusinessDashboardPage() {
  const { seller, approved } = useSellerPanel();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(approved);

  useEffect(() => {
    if (!approved) { setLoading(false); return; }
    sellerRequest<{ items: SellerProduct[] }>("/api/seller/products")
      .then((data) => setProducts(data.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [approved]);

  const counts = useMemo(() => ({
    active: products.filter((item) => item.status === "approved").length,
    pending: products.filter((item) => item.status === "pending_review").length,
    drafts: products.filter((item) => item.status === "draft" || item.status === "rejected").length,
    stock: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
  }), [products]);

  return <div className={styles.page}>
    <section className={styles.hero}>
      <div><span>İŞLETME KONTROL MERKEZİ • 01</span><h1>Mağazanı büyüt.<br/><em>Kontrol sende.</em></h1><p>{approved ? "Ürünlerini, siparişlerini ve mağaza performansını tek merkezden yönet." : "Panelin hazır. Süper Admin onayı tamamlandığında ürün ve satış araçların otomatik açılacak."}</p><div className={styles.heroActions}><Link href="/satici/panel/urunler/yeni"><PackagePlus size={17}/> Yeni ürün oluştur</Link><Link href="/satici/panel/urunler">Kataloğu yönet <ArrowUpRight size={16}/></Link></div></div>
      <div className={styles.heroPulse}><div><span>MAĞAZA HAZIRLIĞI</span><strong>{approved ? "%100" : "%72"}</strong><small>{approved ? "Satışa açık" : "Onay akışı sürüyor"}</small></div><i /></div>
    </section>
    <section className={styles.metrics}>
      <article><span><CircleCheck size={16}/> YAYINDA</span><strong>{loading ? "—" : counts.active}</strong><small>Aktif ürün</small></article>
      <article><span><Clock3 size={16}/> İNCELEME</span><strong>{loading ? "—" : counts.pending}</strong><small>Onay bekleyen</small></article>
      <article><span><Boxes size={16}/> TASLAKLAR</span><strong>{loading ? "—" : counts.drafts}</strong><small>Üzerinde çalışılan</small></article>
      <article><span><TrendingUp size={16}/> TOPLAM STOK</span><strong>{loading ? "—" : counts.stock}</strong><small>Satılabilir adet</small></article>
    </section>
    <section className={styles.actionGrid}>
      <Link href="/satici/panel/urunler/yeni"><PackagePlus/><span>01</span><div><h2>Ürün yükle</h2><p>Görsel, fiyat, varyant ve stok bilgilerini sihirbazla tamamla.</p></div><ArrowUpRight/></Link>
      <Link href="/satici/panel/siparisler"><ReceiptText/><span>02</span><div><h2>Sipariş merkezi</h2><p>Hazırlama, paketleme ve kargo akışını tek ekrandan yönet.</p></div><ArrowUpRight/></Link>
      <Link href="/satici/panel/finans"><WalletCards/><span>03</span><div><h2>Finans görünümü</h2><p>Net satışlarını, kesintileri ve yaklaşan ödemeleri takip et.</p></div><ArrowUpRight/></Link>
      <Link href="/satici/panel/magaza"><Store/><span>04</span><div><h2>Mağaza vitrini</h2><p>Logo, kapak görseli ve müşteri karşılamanı özelleştir.</p></div><ArrowUpRight/></Link>
    </section>
    <section className={styles.bottomGrid}>
      <article className={styles.activity}><header><div><span>SON AKIŞ</span><h2>Mağaza hareketleri</h2></div><Link href="/satici/panel/urunler">Tümünü gör</Link></header>{products.length ? products.slice(0,4).map((item) => <div key={item.id}><i/><span><b>{item.title}</b><small>{item.status === "approved" ? "Yayında" : item.status === "pending_review" ? "Süper Admin incelemesinde" : "Taslak ürün"}</small></span><time>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("tr-TR") : "Şimdi"}</time></div>) : <div className={styles.empty}><Boxes/><b>Henüz ürün hareketi yok.</b><small>İlk ürününü eklediğinde burada görünecek.</small></div>}</article>
      <article className={styles.readiness}><span>MAĞAZA SAĞLIĞI</span><h2>{seller.storeName || "İşletmen"}</h2><ul><li className={styles.done}>İşletme bilgileri <b>Tamam</b></li><li className={approved ? styles.done : ""}>Kimlik doğrulama <b>{approved ? "Tamam" : "İncelemede"}</b></li><li className={counts.active > 0 ? styles.done : ""}>İlk ürün yayını <b>{counts.active > 0 ? "Tamam" : "Bekliyor"}</b></li><li>İlk sipariş <b>Bekliyor</b></li></ul><Link href="/satici/panel/magaza">Mağaza ayarlarını tamamla →</Link></article>
    </section>
  </div>;
}
