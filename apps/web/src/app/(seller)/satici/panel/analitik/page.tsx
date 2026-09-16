"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  ImageOff,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useSellerPanel } from "@/components/seller/SellerPanelShell";
import { sellerRequest } from "@/lib/sellerClient";
import styles from "./analytics.module.css";

type AnalyticsData = {
  totalProducts: number;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  stockHealth: { outOfStock: number; lowStock: number; healthyStock: number };
  noImage: Array<{ id: string; title: string }>;
  priceRange: { min: number; max: number; avg: number };
  recentProducts: number;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  topProducts: Array<{
    id: string;
    title: string;
    price: number;
    stock: number;
    value: number;
  }>;
  catalogScore: number;
};

const statusLabels: Record<string, string> = {
  draft: "Taslak",
  pending_review: "İncelemede",
  approved: "Yayında",
  rejected: "Düzeltme gerekli",
  archived: "Arşivlendi",
};

export default function SellerAnalyticsPage() {
  const { approved } = useSellerPanel();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(approved);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!approved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await sellerRequest<{ analytics: AnalyticsData }>(
        "/api/seller/analytics"
      );
      setData(result.analytics);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [approved]);

  useEffect(() => {
    void load();
  }, [load]);

  function currency(value: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (!approved) {
    return (
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span>İŞLETME ANALİTİĞİ • 07</span>
            <h1>Büyümeyi ölç.</h1>
            <p>
              İşletme onayı tamamlandığında ürün performansı, stok sağlığı ve
              satış trendleri burada raporlanacak.
            </p>
          </div>
        </header>
        <div className={styles.empty}>
          <Clock3 />
          <b>Analitik araçları onay sonrasında açılır.</b>
          <p>
            Süper Admin işletmeni doğruladığında veriler burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span>İŞLETME ANALİTİĞİ • 07</span>
            <h1>Büyümeyi ölç.</h1>
          </div>
        </header>
        <div className={styles.empty}>
          <Loader2 className={styles.spin} />
          <b>Analitik veriler hesaplanıyor</b>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span>İŞLETME ANALİTİĞİ • 07</span>
            <h1>Büyümeyi ölç.</h1>
          </div>
        </header>
        <div className={styles.empty}>
          <RefreshCw />
          <b>{error || "Veriler yüklenemedi."}</b>
        </div>
      </div>
    );
  }

  const maxCategory = Math.max(
    ...Object.values(data.categoryBreakdown),
    1
  );
  const maxStatus = Math.max(...Object.values(data.statusBreakdown), 1);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span>İŞLETME ANALİTİĞİ • 07</span>
          <h1>Büyümeyi ölç.</h1>
          <p>
            Ürün dağılımı, stok sağlığı, katalog kalitesi ve sipariş
            performansını tek merkezden izle.
          </p>
        </div>
        <div className={styles.scoreBox}>
          <small>KATALOG SKORU</small>
          <strong>{data.catalogScore}</strong>
          <span>/ 100 puan</span>
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <section className={styles.kpi}>
        <article>
          <span>
            <Boxes size={13} /> TOPLAM ÜRÜN
          </span>
          <strong>{data.totalProducts}</strong>
          <small>Tüm durumlar dahil</small>
        </article>
        <article>
          <span>
            <CheckCircle2 size={13} /> YAYINDA
          </span>
          <strong>{data.statusBreakdown.approved || 0}</strong>
          <small>Aktif satışta</small>
        </article>
        <article>
          <span>
            <Clock3 size={13} /> İNCELEMEDE
          </span>
          <strong>{data.statusBreakdown.pending_review || 0}</strong>
          <small>Süper Admin kuyruğunda</small>
        </article>
        <article>
          <span>
            <TrendingUp size={13} /> SON 7 GÜN
          </span>
          <strong>{data.recentProducts}</strong>
          <small>Yeni eklenen ürün</small>
        </article>
        <article>
          <span>
            <ShoppingCart size={13} /> SİPARİŞLER
          </span>
          <strong>{data.totalOrders}</strong>
          <small>
            {data.deliveredOrders} teslim · {data.cancelledOrders} iptal
          </small>
        </article>
        <article>
          <span>
            <BarChart3 size={13} /> FİYAT ARALIĞI
          </span>
          <strong>
            {currency(data.priceRange.min)} — {currency(data.priceRange.max)}
          </strong>
          <small>Ort. {currency(data.priceRange.avg)}</small>
        </article>
      </section>

      {/* ── Stock Health ── */}
      <div className={styles.sectionHead}>
        <span>STOK SAĞLIĞI</span>
        <h2>Yayındaki ürünlerin stok durumu</h2>
      </div>
      <section className={styles.stockGrid}>
        <div className={`${styles.stockCard} ${styles.stockRed}`}>
          <span>TÜKENMİŞ</span>
          <strong>{data.stockHealth.outOfStock}</strong>
          <small>Stok = 0</small>
        </div>
        <div className={`${styles.stockCard} ${styles.stockYellow}`}>
          <span>KRİTİK</span>
          <strong>{data.stockHealth.lowStock}</strong>
          <small>1–5 adet kalan</small>
        </div>
        <div className={`${styles.stockCard} ${styles.stockGreen}`}>
          <span>SAĞLIKLI</span>
          <strong>{data.stockHealth.healthyStock}</strong>
          <small>5+ adet stokta</small>
        </div>
      </section>

      {/* ── Distributions ── */}
      <div className={styles.sectionHead}>
        <span>DAĞILIM ANALİZİ</span>
        <h2>Kategori ve durum kırılımı</h2>
      </div>
      <section className={styles.distGrid}>
        <div className={styles.distCard}>
          <header>
            <Layers size={18} />
            <h3>Kategori dağılımı</h3>
          </header>
          <div className={styles.distList}>
            {Object.entries(data.categoryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className={styles.distRow}>
                  <span>{cat}</span>
                  <div className={styles.distBar}>
                    <div
                      className={styles.distBarFill}
                      style={{ width: `${(count / maxCategory) * 100}%` }}
                    />
                  </div>
                  <b>{count}</b>
                </div>
              ))}
            {Object.keys(data.categoryBreakdown).length === 0 && (
              <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,.35)" }}>
                Henüz ürün eklenmedi
              </span>
            )}
          </div>
        </div>

        <div className={styles.distCard}>
          <header>
            <Package size={18} />
            <h3>Durum dağılımı</h3>
          </header>
          <div className={styles.distList}>
            {Object.entries(data.statusBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <div key={status} className={styles.distRow}>
                  <span>{statusLabels[status] || status}</span>
                  <div className={styles.distBar}>
                    <div
                      className={styles.distBarFill}
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                  <b>{count}</b>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── Top Products ── */}
      {data.topProducts.length > 0 && (
        <>
          <div className={styles.sectionHead}>
            <span>EN DEĞERLİ ÜRÜNLER</span>
            <h2>Stok değerine göre ilk 5</h2>
          </div>
          <section className={styles.topList}>
            {data.topProducts.map((p, idx) => (
              <div key={p.id} className={styles.topItem}>
                <span>{String(idx + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{p.title}</h3>
                  <small>
                    {currency(p.price)} × {p.stock} adet
                  </small>
                </div>
                <strong>{currency(p.value)}</strong>
              </div>
            ))}
          </section>
        </>
      )}

      {/* ── Alerts ── */}
      {(data.noImage.length > 0 || data.stockHealth.outOfStock > 0) && (
        <>
          <div className={styles.sectionHead}>
            <span>DİKKAT GEREKTİRENLER</span>
            <h2>Katalog iyileştirme önerileri</h2>
          </div>
          <section className={styles.alerts}>
            {data.stockHealth.outOfStock > 0 && (
              <div className={styles.alert}>
                <AlertTriangle size={18} />
                <div>
                  <b>
                    {data.stockHealth.outOfStock} ürünün stoğu tükenmiş
                  </b>
                  <small>
                    Stoksuz ürünler müşteri tarafında satılamaz. Stok
                    güncellemesi yap.
                  </small>
                </div>
              </div>
            )}
            {data.noImage.length > 0 && (
              <div className={styles.alert}>
                <ImageOff size={18} />
                <div>
                  <b>{data.noImage.length} ürünün görseli eksik</b>
                  <small>
                    {data.noImage
                      .slice(0, 3)
                      .map((p) => p.title)
                      .join(", ")}
                    {data.noImage.length > 3
                      ? ` ve ${data.noImage.length - 3} ürün daha`
                      : ""}
                  </small>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
