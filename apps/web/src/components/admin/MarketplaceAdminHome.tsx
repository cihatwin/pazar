"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Boxes, Building2, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase.client";
import styles from "./MarketplaceAdminHome.module.css";

type Summary = { sellers:number; pendingSellers:number; products:number; pendingProducts:number; liveProducts:number };
const empty: Summary = { sellers:0, pendingSellers:0, products:0, pendingProducts:0, liveProducts:0 };

export default function MarketplaceAdminHome() {
  const [summary, setSummary] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const user = getFirebaseAuth().currentUser;
        if (!user) throw new Error("Süper Admin oturumu gerekli.");
        const token = await user.getIdToken();
        const headers = { Authorization:`Bearer ${token}` };
        const [sellerResponse, productResponse] = await Promise.all([fetch("/api/admin/sellers",{headers}),fetch("/api/admin/seller-products",{headers})]);
        const [sellerData, productData] = await Promise.all([sellerResponse.json(), productResponse.json()]);
        if (!sellerResponse.ok || !productResponse.ok) throw new Error(sellerData?.error || productData?.error || "Marketplace verileri alınamadı.");
        const sellers = sellerData.items || []; const products = productData.items || [];
        if (alive) setSummary({ sellers:sellers.filter((x:any)=>x.status==="approved").length, pendingSellers:sellers.filter((x:any)=>x.status==="pending").length, products:products.length, pendingProducts:products.filter((x:any)=>x.status==="pending_review").length, liveProducts:products.filter((x:any)=>x.status==="approved").length });
      } catch (e) { if (alive) setError((e as Error).message); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const value = (number:number) => loading ? "—" : String(number);
  return <div className={styles.page}>
    <section className={styles.hero}><div><span>PAZAR. • YENİ MARKETPLACE ÇEKİRDEĞİ</span><h1>Sıfır veri.<br/><em>Temiz operasyon.</em></h1><p>Bu ekran yalnızca yeni satıcı ve marketplace ürün koleksiyonlarını kullanır. Eski katalog, sipariş ve kategori verileri izole edildi.</p></div><div className={styles.seal}><ShieldCheck/><b>LEGACY FREE</b><small>Eski veri bağlantısı kapalı</small></div></section>
    {error ? <div className={styles.error}>{error}</div> : null}
    <section className={styles.metrics}><article><Building2/><span>AKTİF SATICI</span><strong>{value(summary.sellers)}</strong></article><article><Clock3/><span>BEKLEYEN BAŞVURU</span><strong>{value(summary.pendingSellers)}</strong></article><article><Boxes/><span>YENİ ÜRÜN</span><strong>{value(summary.products)}</strong></article><article><CheckCircle2/><span>YAYINDA</span><strong>{value(summary.liveProducts)}</strong></article></section>
    <section className={styles.actions}><Link href="/admin/sellers"><span>01</span><div><b>Satıcı başvuruları</b><small>{value(summary.pendingSellers)} işletme karar bekliyor</small></div><ArrowUpRight/></Link><Link href="/admin/seller-products"><span>02</span><div><b>Ürün onay merkezi</b><small>{value(summary.pendingProducts)} ürün inceleme kuyruğunda</small></div><ArrowUpRight/></Link><Link href="/satici"><span>03</span><div><b>Satıcı deneyimi</b><small>Başvuru ve işletme panelini gör</small></div><ArrowUpRight/></Link></section>
  </div>;
}
