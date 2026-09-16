import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifySeller } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

function iso(value: any) {
  return value?.toDate?.()?.toISOString?.() || null;
}

/** GET — Satıcının kendi siparişlerini listele */
export async function GET(req: NextRequest) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;

  try {
    const db = adminDb();
    const snapshot = await db
      .collection("seller_orders")
      .where("sellerId", "==", seller.uid)
      .limit(200)
      .get();

    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: iso(data.createdAt),
          updatedAt: iso(data.updatedAt),
          shippedAt: iso(data.shippedAt),
          deliveredAt: iso(data.deliveredAt),
        };
      })
      .sort(
        (a: any, b: any) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
      );

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[seller/orders] GET failed:", error);
    return NextResponse.json(
      { ok: false, error: "Siparişler yüklenemedi." },
      { status: 500 }
    );
  }
}

/** PATCH — Sipariş durumunu güncelle (hazırlanıyor → kargoya verildi → teslim edildi) */
export async function PATCH(req: NextRequest) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;

  try {
    const body = await req.json();
    const orderId = String(body.orderId || "").trim();
    const action = String(body.action || "").trim();
    const trackingCode = String(body.trackingCode || "").trim().slice(0, 64);
    const trackingCompany = String(body.trackingCompany || "").trim().slice(0, 60);

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: "Sipariş kimliği gerekli." },
        { status: 400 }
      );
    }

    const db = adminDb();
    const ref = db.collection("seller_orders").doc(orderId);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data()?.sellerId !== seller.uid) {
      return NextResponse.json(
        { ok: false, error: "Sipariş bulunamadı." },
        { status: 404 }
      );
    }

    const current = String(snapshot.data()?.status || "");
    const now = FieldValue.serverTimestamp();
    const update: Record<string, unknown> = { updatedAt: now };

    if (action === "prepare" && current === "paid") {
      update.status = "preparing";
    } else if (action === "ship" && ["paid", "preparing"].includes(current)) {
      if (!trackingCode) {
        return NextResponse.json(
          { ok: false, error: "Kargo takip kodu gerekli." },
          { status: 400 }
        );
      }
      update.status = "shipped";
      update.trackingCode = trackingCode;
      update.trackingCompany = trackingCompany;
      update.shippedAt = now;
    } else if (action === "deliver" && current === "shipped") {
      update.status = "delivered";
      update.deliveredAt = now;
    } else {
      return NextResponse.json(
        { ok: false, error: "Bu durum geçişi yapılamaz." },
        { status: 400 }
      );
    }

    await ref.set(update, { merge: true });
    return NextResponse.json({ ok: true, status: update.status });
  } catch (error) {
    console.error("[seller/orders] PATCH failed:", error);
    return NextResponse.json(
      { ok: false, error: "Sipariş güncellenemedi." },
      { status: 500 }
    );
  }
}
