"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import styles from "./product.module.css";

type ProductItem = {
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
  storeName: string;
  ownerUid: string;
};

export default function ProductDetailClient({ item }: { item: ProductItem }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const discount =
    item.compareAtPrice && item.compareAtPrice > item.price
      ? Math.round(
          ((item.compareAtPrice - item.price) / item.compareAtPrice) * 100
        )
      : 0;

  async function addToCart() {
    if (item.stock <= 0 || busy) return;
    setBusy(true);
    try {
      // Cart'a marketplace ürünü ekle
      const cartEvent = new CustomEvent("marketplace:add-to-cart", {
        detail: {
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity,
          image: item.images?.[0] || "",
          sku: item.sku,
          sellerId: item.ownerUid,
          storeName: item.storeName,
          source: "marketplace",
        },
      });
      window.dispatchEvent(cartEvent);

      // LocalStorage'a da kaydet (basit cart mekanizması)
      const cartKey = "pazar_marketplace_cart";
      const existing = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const idx = existing.findIndex(
        (x: any) => x.productId === item.id
      );
      if (idx >= 0) {
        existing[idx].quantity = Math.min(
          existing[idx].quantity + quantity,
          item.stock
        );
      } else {
        existing.push({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity,
          image: item.images?.[0] || "",
          sku: item.sku,
          sellerId: item.ownerUid,
          storeName: item.storeName,
          source: "marketplace",
          addedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem(cartKey, JSON.stringify(existing));

      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/shop">
        <ArrowLeft size={16} /> Mağazaya dön
      </Link>

      <section className={styles.product}>
        {/* ── Gallery ── */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {item.images?.[selectedImage] ? (
              <img
                src={item.images[selectedImage]}
                alt={item.title}
                key={selectedImage}
              />
            ) : (
              <PackageCheck />
            )}
            <span>
              <ShieldCheck /> SÜPER ADMİN ONAYLI
            </span>
          </div>
          {item.images?.length > 1 ? (
            <div className={styles.thumbs}>
              {item.images.map((url: string, idx: number) => (
                <button
                  key={url}
                  className={`${styles.thumb} ${idx === selectedImage ? styles.thumbActive : ""}`}
                  onClick={() => setSelectedImage(idx)}
                  aria-label={`Görsel ${idx + 1}`}
                  type="button"
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Info ── */}
        <div className={styles.info}>
          <Link
            href={`/magaza/${item.ownerUid}`}
            className={styles.store}
          >
            <Store />
            <span>
              <small>ONAYLI MAĞAZA</small>
              <b>{item.storeName}</b>
            </span>
          </Link>

          <p className={styles.category}>
            {item.category} · {item.brand || "Bağımsız marka"}
          </p>
          <h1>{item.title}</h1>
          <p className={styles.description}>{item.description}</p>

          <div className={styles.price}>
            <strong>
              {Number(item.price).toLocaleString("tr-TR", {
                style: "currency",
                currency: "TRY",
              })}
            </strong>
            {item.compareAtPrice ? (
              <del>
                {Number(item.compareAtPrice).toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </del>
            ) : null}
            {discount > 0 ? (
              <span className={styles.discount}>%{discount} indirim</span>
            ) : null}
          </div>

          <div
            className={`${styles.stock} ${item.stock > 0 ? styles.inStock : styles.outStock}`}
          >
            <i />
            {item.stock > 0
              ? `${item.stock} adet stokta`
              : "Stokta yok"}
          </div>

          {/* ── Add to Cart ── */}
          <div className={styles.cartSection}>
            <div className={styles.quantityRow}>
              <span>Adet:</span>
              <div className={styles.quantityControl}>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(item.stock, q + 1)
                    )
                  }
                  disabled={quantity >= item.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              className={styles.addToCart}
              onClick={addToCart}
              disabled={item.stock <= 0 || busy}
            >
              <ShoppingCart />
              {item.stock <= 0
                ? "Stokta yok"
                : busy
                  ? "Ekleniyor..."
                  : "Sepete ekle"}
            </button>

            {added && (
              <div className={styles.cartSuccess}>
                <CheckCircle2 /> Ürün sepete eklendi
              </div>
            )}

            <Link href="/iletisim" className={styles.contactSeller}>
              <MessageCircle size={16} /> Satıcıya ürün hakkında sor
            </Link>
          </div>

          {/* ── Trust badges ── */}
          <div className={styles.trust}>
            <span>
              <Truck />
              <b>Takipli teslimat</b>
              <small>Mağaza tarafından hazırlanır</small>
            </span>
            <span>
              <RotateCcw />
              <b>Kolay iade</b>
              <small>PAZAR. güvencesi</small>
            </span>
            <span>
              <ShieldCheck />
              <b>Onaylı ürün</b>
              <small>Kalite kontrolünden geçti</small>
            </span>
          </div>

          <p className={styles.sku}>SKU {item.sku}</p>
        </div>
      </section>
    </main>
  );
}
