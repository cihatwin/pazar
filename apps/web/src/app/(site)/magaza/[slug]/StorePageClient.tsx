"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  Tag,
} from "lucide-react";
import styles from "./store.module.css";

type StoreProduct = {
  id: string;
  title: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
};

type StoreData = {
  uid: string;
  storeName: string;
  description: string;
  category: string;
  city: string;
  logoUrl: string;
  bannerUrl: string;
};

export default function StorePageClient({
  store,
  products,
}: {
  store: StoreData;
  products: StoreProduct[];
}) {
  const [q, setQ] = useState("");

  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          !q ||
          `${p.title} ${p.brand} ${p.category}`
            .toLocaleLowerCase("tr")
            .includes(q.toLocaleLowerCase("tr"))
      ),
    [products, q]
  );

  return (
    <div className={styles.page}>
      {/* ── Store Header ── */}
      <div className={styles.storeHeader}>
        <div
          className={styles.banner}
          style={
            store.bannerUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(6,10,6,.35),rgba(6,10,6,.7)),url(${store.bannerUrl})`,
                }
              : undefined
          }
        />
        <div className={styles.storeInfo}>
          <div className={styles.logo}>
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.storeName} />
            ) : (
              <Store />
            )}
          </div>
          <div className={styles.storeMeta}>
            <h1>{store.storeName}</h1>
            <p>
              {store.category} · Bağımsız satıcı mağazası
            </p>
          </div>
          <div className={styles.badges}>
            <span className={styles.badge}>
              <ShieldCheck /> ONAYLI MAĞAZA
            </span>
            {store.category && (
              <span className={`${styles.badge} ${styles.badgeCategory}`}>
                <Tag /> {store.category}
              </span>
            )}
            {store.city && (
              <span className={`${styles.badge} ${styles.badgeCity}`}>
                <MapPin /> {store.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      {store.description && (
        <p className={styles.description}>{store.description}</p>
      )}

      {/* ── Stats ── */}
      <div className={styles.stats}>
        <span>
          <small>ÜRÜN</small>
          <b>{products.length}</b>
        </span>
        <span>
          <small>KATEGORİ</small>
          <b>
            {new Set(products.map((p) => p.category)).size}
          </b>
        </span>
        <span>
          <small>STOKTA</small>
          <b>{products.filter((p) => p.stock > 0).length}</b>
        </span>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bu mağazada ara"
          />
        </div>
      </div>

      {/* ── Products ── */}
      <section className={styles.grid}>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <Boxes />
            <b>
              {products.length
                ? "Aramanıza uygun ürün bulunamadı"
                : "Bu mağazada henüz ürün yok"}
            </b>
            <p>
              Mağaza sahibi ürünlerini eklediğinde burada görünecek.
            </p>
            <Link href="/shop">Tüm ürünlere dön →</Link>
          </div>
        ) : (
          visible.map((item) => (
            <article key={item.id} className={styles.card}>
              <Link
                href={`/urun/${item.id}`}
                className={styles.cardImage}
              >
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} />
                ) : (
                  <Boxes />
                )}
              </Link>
              <div className={styles.cardBody}>
                <h2>
                  <Link href={`/urun/${item.id}`}>{item.title}</Link>
                </h2>
                <p>
                  {item.category} ·{" "}
                  {item.brand || "Bağımsız marka"}
                </p>
              </div>
              <div className={styles.cardFooter}>
                <strong>
                  {item.price.toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  })}
                </strong>
                <Link
                  href={`/urun/${item.id}`}
                  aria-label={`${item.title} detay`}
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
