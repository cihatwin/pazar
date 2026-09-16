import { NextRequest, NextResponse } from "next/server";
import { verifySeller } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

function iso(value: any) {
  return value?.toDate?.()?.toISOString?.() || null;
}

/** GET — Satıcının finansal özetini hesapla */
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

    const products = productsSnap.docs.map((doc) => doc.data());
    const activeProducts = products.filter((p) => p.status === "approved");
    const totalStockValue = activeProducts.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.stock) || 0),
      0
    );
    const totalProducts = activeProducts.length;
    const totalStock = activeProducts.reduce(
      (sum, p) => sum + (Number(p.stock) || 0),
      0
    );
    const averagePrice =
      totalProducts > 0
        ? activeProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0) /
          totalProducts
        : 0;

    // 2) Sipariş verileri
    const ordersSnap = await db
      .collection("seller_orders")
      .where("sellerId", "==", seller.uid)
      .limit(500)
      .get();

    const orders = ordersSnap.docs.map((doc) => ({
      ...doc.data(),
      createdAt: iso(doc.data().createdAt),
    }));

    const totalRevenue = orders
      .filter((o: any) => !["cancelled", "refunded"].includes(o.status))
      .reduce((sum, o: any) => sum + (Number(o.total) || 0), 0);

    const pendingRevenue = orders
      .filter((o: any) => ["paid", "preparing", "shipped"].includes(o.status))
      .reduce((sum, o: any) => sum + (Number(o.total) || 0), 0);

    const completedRevenue = orders
      .filter((o: any) => o.status === "delivered")
      .reduce((sum, o: any) => sum + (Number(o.total) || 0), 0);

    const refundedAmount = orders
      .filter((o: any) => o.status === "refunded")
      .reduce((sum, o: any) => sum + (Number(o.total) || 0), 0);

    const commissionRate = 0.1; // %10 varsayılan komisyon
    const totalCommission = totalRevenue * commissionRate;
    const netEarnings = totalRevenue - totalCommission;

    // 3) Son 30 gün trendi
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(
      (o: any) => o.createdAt && new Date(o.createdAt) >= thirtyDaysAgo
    );
    const last30Revenue = recentOrders
      .filter((o: any) => !["cancelled", "refunded"].includes(o.status))
      .reduce((sum, o: any) => sum + (Number(o.total) || 0), 0);

    // 4) Aylık dağılım (son 6 ay)
    const monthlyData: Array<{
      month: string;
      revenue: number;
      orders: number;
    }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("tr-TR", {
        month: "short",
        year: "numeric",
      });
      const monthOrders = orders.filter(
        (o: any) =>
          o.createdAt?.startsWith(key) &&
          !["cancelled", "refunded"].includes(o.status)
      );
      monthlyData.push({
        month: label,
        revenue: monthOrders.reduce(
          (sum, o: any) => sum + (Number(o.total) || 0),
          0
        ),
        orders: monthOrders.length,
      });
    }

    return NextResponse.json({
      ok: true,
      finance: {
        totalRevenue,
        pendingRevenue,
        completedRevenue,
        refundedAmount,
        commissionRate,
        totalCommission,
        netEarnings,
        last30Revenue,
        totalStockValue,
        totalProducts,
        totalStock,
        averagePrice,
        totalOrders: orders.length,
        monthlyData,
      },
    });
  } catch (error) {
    console.error("[seller/finance] GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Finansal veriler yüklenemedi." },
      { status: 500 }
    );
  }
}
