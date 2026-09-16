import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifySeller } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

function text(value: unknown, max: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function number(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : min;
}

function iso(value: any) {
  return value?.toDate?.()?.toISOString?.() || null;
}

export async function GET(req: NextRequest) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;

  const snapshot = await adminDb().collection("seller_products")
    .where("ownerUid", "==", seller.uid).limit(300).get();
  const items = snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) };
  }).sort((a: any, b: any) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;

  try {
    const body = await req.json();
    const title = text(body.title, 140);
    const description = text(body.description, 4000);
    const category = text(body.category, 80);
    const brand = text(body.brand, 80);
    const sku = text(body.sku, 64).toUpperCase();
    const price = number(body.price, 0, 100_000_000);
    const compareAtPrice = body.compareAtPrice ? number(body.compareAtPrice, 0, 100_000_000) : null;
    const stock = Math.floor(number(body.stock, 0, 1_000_000));
    const images = Array.isArray(body.images)
      ? body.images.map((item: unknown) => text(item, 1200)).filter((item: string) => /^https?:\/\//.test(item)).slice(0, 8)
      : [];
    const submit = body.submit === true;

    if (title.length < 3 || description.length < 20 || !category || !sku || price <= 0) {
      return NextResponse.json({ ok: false, error: "Ürün adı, açıklama, kategori, SKU ve fiyat alanlarını kontrol et." }, { status: 400 });
    }

    const duplicate = await adminDb().collection("seller_products").where("ownerUid", "==", seller.uid).limit(300).get();
    if (duplicate.docs.some((doc) => String(doc.data().sku || "").toUpperCase() === sku && doc.data().status !== "archived")) {
      return NextResponse.json({ ok: false, error: "Bu SKU mağazandaki başka bir üründe kullanılıyor." }, { status: 409 });
    }

    const ref = adminDb().collection("seller_products").doc();
    const now = FieldValue.serverTimestamp();
    await ref.set({
      ownerUid: seller.uid,
      sellerEmail: seller.email,
      storeName: seller.storeName,
      title,
      description,
      category,
      brand,
      sku,
      price,
      compareAtPrice,
      stock,
      images,
      status: submit ? "pending_review" : "draft",
      moderationNote: "",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id: ref.id, status: submit ? "pending_review" : "draft" }, { status: 201 });
  } catch (error) {
    console.error("seller product create failed", error);
    return NextResponse.json({ ok: false, error: "Ürün kaydedilemedi." }, { status: 500 });
  }
}
