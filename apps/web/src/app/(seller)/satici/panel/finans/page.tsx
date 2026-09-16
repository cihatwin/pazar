"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Box,
  CircleDollarSign,
  Clock3,
  Loader2,
  Percent,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useSellerPanel } from "@/components/seller/SellerPanelShell";
import { sellerRequest } from "@/lib/sellerClient";
import styles from "./finance.module.css";

type FinanceData = {
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  refundedAmount: number;
  commissionRate: number;
  totalCommission: number;
  netEarnings: number;
  last30Revenue: number;
  totalStockValue: number;
  totalProducts: number;
  totalStock: number;
  averagePrice: number;
  totalOrders: number;
  monthlyData: Array<{ month: string; revenue: number; orders: number }>;
};

export default function SellerFinancePage() {
  const { approved } = useSellerPanel();
  const [data, setData] = useState<FinanceData | null>(null);
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
      const result = await sellerRequest<{ finance: FinanceData }>(
        "/api/seller/finance"
      );
      setData(result.finance);
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
            <span>FİNANS MERKEZİ • 05</span>
            <h1>Kazancın net görünsün.</h1>
            <p>
              İşletme onayı tamamlandığında brüt satış, komisyon, bakiye ve
              hakediş ödemelerini buradan takip edeceksin.
            </p>
          </div>
        </header>
        <div className={styles.empty}>
          <Clock3 />
          <b>Finans araçları onay sonrasında açılır.</b>
          <p>
            Süper Admin işletmeni doğruladığında finansal veriler burada
            raporlanacak.
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
            <span>FİNANS MERKEZİ • 05</span>
            <h1>Kazancın net görünsün.</h1>
          </div>
        </header>
        <div className={styles.empty}>
          <Loader2 className={styles.spin} />
          <b>Finansal veriler hesaplanıyor</b>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <header className={styles.hero}>
          <div>
            <span>FİNANS MERKEZİ • 05</span>
            <h1>Kazancın net görünsün.</h1>
          </div>
        </header>
        <div className={styles.empty}>
          <RefreshCw />
          <b>{error || "Veriler yüklenemedi."}</b>
          <p>
            <button onClick={load} style={{ color: "#c9a855", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Tekrar dene
            </button>
          </p>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.monthlyData.map((m) => m.revenue), 1);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span>FİNANS MERKEZİ • 05</span>
          <h1>Kazancın net görünsün.</h1>
          <p>
            Brüt satış, komisyon kesintileri, hakediş ve stok değerini tek
            merkezden takip et.
          </p>
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <section className={styles.kpi}>
        <article className={styles.kpiAccent}>
          <span>
            <Wallet size={14} /> NET KAZANÇ
          </span>
          <strong>{currency(data.netEarnings)}</strong>
          <small>Komisyon sonrası toplam hakediş</small>
        </article>
        <article>
          <span>
            <TrendingUp size={14} /> BRÜT SATIŞ
          </span>
          <strong>{currency(data.totalRevenue)}</strong>
          <small>{data.totalOrders} sipariş</small>
        </article>
        <article>
          <span>
            <Percent size={14} /> KOMİSYON
          </span>
          <strong>{currency(data.totalCommission)}</strong>
          <small>%{(data.commissionRate * 100).toFixed(0)} platform payı</small>
        </article>
        <article>
          <span>
            <Clock3 size={14} /> BEKLEYENLer
          </span>
          <strong>{currency(data.pendingRevenue)}</strong>
          <small>Hazırlık ve kargodaki siparişler</small>
        </article>
        <article className={styles.kpiGreen}>
          <span>
            <CircleDollarSign size={14} /> TAMAMLANAN
          </span>
          <strong>{currency(data.completedRevenue)}</strong>
          <small>Teslim edilen siparişler</small>
        </article>
        <article>
          <span>
            <ArrowDownRight size={14} /> İADELER
          </span>
          <strong>{currency(data.refundedAmount)}</strong>
          <small>İade edilen tutar</small>
        </article>
      </section>

      {/* ── Monthly chart ── */}
      <div className={styles.sectionHead}>
        <span>GELİR TRENDİ</span>
        <h2>Aylık satış performansı</h2>
      </div>
      <div className={styles.chart}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span>SON 6 AY</span>
            <b>Son 30 gün: {currency(data.last30Revenue)}</b>
          </div>
          <div className={styles.bars}>
            {data.monthlyData.map((m) => (
              <div key={m.month} className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    height: `${Math.max((m.revenue / maxRevenue) * 100, 3)}%`,
                  }}
                />
                <b>
                  {m.revenue > 0
                    ? `₺${Math.round(m.revenue / 1000)}K`
                    : "—"}
                </b>
                <small>{m.month}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stock & Catalog info ── */}
      <div className={styles.sectionHead}>
        <span>ENVANTER DEĞERİ</span>
        <h2>Stok ve katalog görünümü</h2>
      </div>
      <div className={styles.infoGrid}>
        <div className={styles.infoBox}>
          <span>STOK DEĞERİ</span>
          <h3>{currency(data.totalStockValue)}</h3>
          <p>
            Yayındaki {data.totalProducts} ürünün toplam {data.totalStock} adet
            stok değeri.
          </p>
        </div>
        <div className={styles.infoBox}>
          <span>FİYAT ORTALAMASI</span>
          <h3>{currency(data.averagePrice)}</h3>
          <p>
            Aktif ürünlerinin ortalama birim fiyatı. Fiyatlandırma stratejini bu
            değere göre optimize edebilirsin.
          </p>
        </div>
        <div className={styles.infoBox}>
          <span>KOMİSYON TABLOSU</span>
          <h3>%{(data.commissionRate * 100).toFixed(0)} Platform Payı</h3>
          <ul>
            <li>
              <span>Brüt satış</span> <b>{currency(data.totalRevenue)}</b>
            </li>
            <li>
              <span>Platform komisyonu</span>{" "}
              <b>−{currency(data.totalCommission)}</b>
            </li>
            <li>
              <span>İadeler</span> <b>−{currency(data.refundedAmount)}</b>
            </li>
            <li>
              <span>Net hakediş</span>{" "}
              <b style={{ color: "#4ade80" }}>
                {currency(data.netEarnings - data.refundedAmount)}
              </b>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
