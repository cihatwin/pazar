import { NextRequest, NextResponse } from "next/server";
import { verifySeller } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

function iso(value: any) {
  return value?.toDate?.()?.toISOString?.() || null;
}

/** GET — Satıcının analitik verilerini hesapla */
export async function GET(req: NextRequest) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;

  try {
    const db = adminDb();

    // 1) Ürün verileri
    const productsSnap = await db
      .collection("seller_products")
      .where("ownerUid", "==", seller.uid)
      .limit(500)
      .get();

    const products = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        category: data.category,
        brand: data.brand,
        price: Number(data.price || 0),
        stock: Number(data.stock || 0),
        status: data.status,
        images: data.images || [],
        createdAt: iso(data.createdAt),
        updatedAt: iso(data.updatedAt),
      };
    });

    // 2) Durum dağılımı
    const statusBreakdown: Record<string, number> = {};
    products.forEach((p) => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    });

    // 3) Kategori dağılımı
    const categoryBreakdown: Record<string, number> = {};
    products
      .filter((p) => p.status !== "archived")
      .forEach((p) => {
        categoryBreakdown[p.category] =
          (categoryBreakdown[p.category] || 0) + 1;
      });

    // 4) Stok sağlığı
    const activeProducts = products.filter((p) => p.status === "approved");
    const outOfStock = activeProducts.filter((p) => p.stock === 0).length;
    const lowStock = activeProducts.filter(
      (p) => p.stock > 0 && p.stock <= 5
    ).length;
    const healthyStock = activeProducts.filter((p) => p.stock > 5).length;

    // 5) Görsel kalitesi — görselsiz ürünler
    const noImage = products
      .filter(
        (p) => p.status !== "archived" && (!p.images || p.images.length === 0)
      )
      .map((p) => ({ id: p.id, title: p.title }));

    // 6) Fiyat aralığı
    const prices = activeProducts.map((p) => p.price).filter((p) => p > 0);
    const priceRange =
      prices.length > 0
        ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: prices.reduce((a, b) => a + b, 0) / prices.length,
          }
        : { min: 0, max: 0, avg: 0 };

    // 7) Son 7 günde eklenen ürünler
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentProducts = products.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= sevenDaysAgo
    ).length;

    // 8) Sipariş verileri
    const ordersSnap = await db
      .collection("seller_orders")
      .where("sellerId", "==", seller.uid)
      .limit(500)
      .get();

    const orders = ordersSnap.docs.map((doc) => ({
      ...doc.data(),
      createdAt: iso(doc.data().createdAt),
    }));

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(
      (o: any) => o.status === "delivered"
    ).length;
    const cancelledOrders = orders.filter(
      (o: any) => o.status === "cancelled"
    ).length;
    const refundedOrders = orders.filter(
      (o: any) => o.status === "refunded"
    ).length;

    // 9) En pahalı 5 ürün
    const topProducts = [...activeProducts]
      .sort((a, b) => b.price * b.stock - a.price * a.stock)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        stock: p.stock,
        value: p.price * p.stock,
      }));

    // 10) Katalog tamamlığı skoru
    const activeCount = products.filter(
      (p) => p.status !== "archived"
    ).length;
    const withImages = products.filter(
      (p) =>
        p.status !== "archived" && p.images && p.images.length > 0
    ).length;
    const withDescription = products.filter(
      (p) => p.status !== "archived"
    ).length; // description always required
    const catalogScore =
      activeCount > 0
        ? Math.round(
            ((withImages / activeCount) * 50 +
              (activeProducts.length / Math.max(activeCount, 1)) * 30 +
              (healthyStock / Math.max(activeProducts.length, 1)) * 20)
          )
        : 0;

    return NextResponse.json({
      ok: true,
      analytics: {
        totalProducts: products.length,
        statusBreakdown,
        categoryBreakdown,
        stockHealth: { outOfStock, lowStock, healthyStock },
        noImage,
        priceRange,
        recentProducts,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        refundedOrders,
        topProducts,
        catalogScore,
      },
    });
  } catch (error) {
    console.error("[seller/analytics] GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Analitik veriler yüklenemedi." },
      { status: 500 }
    );
  }
}
