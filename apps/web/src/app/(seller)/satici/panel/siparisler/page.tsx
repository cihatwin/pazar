"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
  Truck,
  XCircle,
} from "lucide-react";
import { useSellerPanel } from "@/components/seller/SellerPanelShell";
import { sellerRequest } from "@/lib/sellerClient";
import styles from "./orders.module.css";

type OrderStatus =
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type SellerOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerCity: string;
  sellerId: string;
  items: Array<{
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: OrderStatus;
  trackingCode?: string;
  trackingCompany?: string;
  createdAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
};

const statusLabel: Record<OrderStatus, string> = {
  paid: "ÖDEME ALINDI",
  preparing: "HAZIRLANIYOR",
  shipped: "KARGODA",
  delivered: "TESLİM EDİLDİ",
  cancelled: "İPTAL",
  refunded: "İADE",
};

const filterList: Array<{ key: "all" | OrderStatus; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "paid", label: "Yeni" },
  { key: "preparing", label: "Hazırlanan" },
  { key: "shipped", label: "Kargoda" },
  { key: "delivered", label: "Teslim" },
  { key: "cancelled", label: "İptal" },
];

export default function SellerOrdersPage() {
  const { approved } = useSellerPanel();
  const [items, setItems] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(approved);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [busy, setBusy] = useState("");
  const [trackingInputs, setTrackingInputs] = useState<
    Record<string, { code: string; company: string }>
  >({});

  const load = useCallback(async () => {
    if (!approved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await sellerRequest<{ items: SellerOrder[] }>(
        "/api/seller/orders"
      );
      setItems(data.items || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [approved]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (filter === "all" || item.status === filter) &&
          (!q ||
            `${item.orderNumber} ${item.customerName} ${item.items.map((i) => i.title).join(" ")}`
              .toLocaleLowerCase("tr")
              .includes(q.toLocaleLowerCase("tr")))
      ),
    [items, filter, q]
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      active: items.filter((i) =>
        ["paid", "preparing", "shipped"].includes(i.status)
      ).length,
      delivered: items.filter((i) => i.status === "delivered").length,
    }),
    [items]
  );

  async function action(
    orderId: string,
    actionType: "prepare" | "ship" | "deliver"
  ) {
    const tracking = trackingInputs[orderId];
    setBusy(orderId);
    setError("");
    try {
      const data = await sellerRequest<{ status: OrderStatus }>(
        "/api/seller/orders",
        {
          method: "PATCH",
          body: JSON.stringify({
            orderId,
            action: actionType,
            trackingCode: tracking?.code || "",
            trackingCompany: tracking?.company || "",
          }),
        }
      );
      setItems((list) =>
        list.map((x) =>
          x.id === orderId
            ? {
                ...x,
                status: data.status,
                trackingCode: tracking?.code || x.trackingCode,
                trackingCompany: tracking?.company || x.trackingCompany,
              }
            : x
        )
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(value);
  }

  function formatDate(value?: string | null) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span>SİPARİŞ OPERASYONU • 04</span>
          <h1>Sipariş Merkezi</h1>
          <p>
            Gelen siparişleri hazırla, kargo bilgilerini gir ve teslimat
            sürecini takip et.
          </p>
        </div>
        <div className={styles.heroStats}>
          <span>
            <small>TOPLAM</small>
            <b>{loading ? "—" : counts.total}</b>
          </span>
          <span>
            <small>AKTİF</small>
            <b>{loading ? "—" : counts.active}</b>
          </span>
          <span>
            <small>TESLİM</small>
            <b>{loading ? "—" : counts.delivered}</b>
          </span>
        </div>
      </header>

      {!approved ? (
        <div className={styles.empty}>
          <Clock3 />
          <b>Sipariş araçları onay sonrasında açılır.</b>
          <p>
            Süper Admin işletmeni doğruladığında siparişlerin burada
            listelenecek.
          </p>
        </div>
      ) : (
        <>
          {error ? <div className={styles.empty}><XCircle /><b>{error}</b></div> : null}

          <section className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sipariş no, müşteri veya ürün ara"
              />
            </div>
            <div className={styles.filters}>
              {filterList.map((x) => (
                <button
                  key={x.key}
                  className={filter === x.key ? styles.filterActive : ""}
                  onClick={() => setFilter(x.key)}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <button onClick={load} aria-label="Yenile">
              <RefreshCw size={16} />
            </button>
          </section>

          <section className={styles.list}>
            {loading ? (
              <div className={styles.empty}>
                <RefreshCw className={styles.spin} />
                <b>Siparişler yükleniyor</b>
              </div>
            ) : visible.length === 0 ? (
              <div className={styles.empty}>
                <Box />
                <b>
                  {items.length
                    ? "Bu filtrede sipariş yok"
                    : "Henüz sipariş gelmedi"}
                </b>
                <p>
                  İlk siparişin geldiğinde burada hazırlama, paketleme ve kargo
                  akışını yönetebileceksin.
                </p>
                <Link href="/satici/panel/urunler">
                  Ürünlerini kontrol et →
                </Link>
              </div>
            ) : (
              visible.map((order) => (
                <article key={order.id} className={styles.order}>
                  <div className={styles.orderMain}>
                    <div className={styles.orderHeader}>
                      <span
                        className={`${styles.status} ${styles[order.status]}`}
                      >
                        <i />
                        {statusLabel[order.status]}
                      </span>
                      <h2>#{order.orderNumber}</h2>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((item, idx) => (
                        <span key={idx}>
                          <b>
                            {item.quantity}× {item.title}
                          </b>{" "}
                          · {item.sku} ·{" "}
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      ))}
                    </div>

                    <div className={styles.orderMeta}>
                      <span>
                        <small>MÜŞTERİ</small>
                        <b>
                          {order.customerName || "Misafir"}
                        </b>
                      </span>
                      <span>
                        <small>KONUM</small>
                        <b>{order.customerCity || "—"}</b>
                      </span>
                      <span>
                        <small>TOPLAM</small>
                        <b>{formatCurrency(order.total)}</b>
                      </span>
                    </div>

                    {order.trackingCode ? (
                      <div className={styles.tracking}>
                        <Truck size={14} />
                        <b>{order.trackingCompany}</b> —{" "}
                        {order.trackingCode}
                        {order.shippedAt
                          ? ` · ${formatDate(order.shippedAt)}`
                          : ""}
                      </div>
                    ) : null}
                  </div>

                  <div className={styles.orderActions}>
                    {order.status === "paid" && (
                      <button
                        disabled={busy === order.id}
                        onClick={() => action(order.id, "prepare")}
                      >
                        <PackageCheck size={14} /> Hazırlanıyor
                      </button>
                    )}
                    {["paid", "preparing"].includes(order.status) && (
                      <>
                        <input
                          placeholder="Kargo firması"
                          value={
                            trackingInputs[order.id]?.company || ""
                          }
                          onChange={(e) =>
                            setTrackingInputs((v) => ({
                              ...v,
                              [order.id]: {
                                ...v[order.id],
                                company: e.target.value,
                              },
                            }))
                          }
                        />
                        <input
                          placeholder="Takip kodu"
                          value={
                            trackingInputs[order.id]?.code || ""
                          }
                          onChange={(e) =>
                            setTrackingInputs((v) => ({
                              ...v,
                              [order.id]: {
                                ...v[order.id],
                                code: e.target.value,
                              },
                            }))
                          }
                        />
                        <button
                          className={styles.ship}
                          disabled={busy === order.id}
                          onClick={() => action(order.id, "ship")}
                        >
                          <Send size={14} /> Kargoya ver
                        </button>
                      </>
                    )}
                    {order.status === "shipped" && (
                      <button
                        className={styles.deliver}
                        disabled={busy === order.id}
                        onClick={() => action(order.id, "deliver")}
                      >
                        <CheckCircle2 size={14} /> Teslim edildi
                      </button>
                    )}
                    {["delivered", "cancelled", "refunded"].includes(
                      order.status
                    ) && (
                      <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.35)" }}>
                        İşlem tamamlandı
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
