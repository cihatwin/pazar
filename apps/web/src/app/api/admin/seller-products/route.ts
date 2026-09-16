import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

function iso(value: any) { return value?.toDate?.()?.toISOString?.() || null; }

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (admin.role !== "admin") return NextResponse.json({ ok: false, error: "Bu alan yalnızca Süper Admin içindir." }, { status: 403 });
  const snapshot = await adminDb().collection("seller_products").limit(500).get();
  const items = snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) };
  }).sort((a: any, b: any) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return NextResponse.json({ ok: true, items });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (admin.role !== "admin") return NextResponse.json({ ok: false, error: "Bu karar yalnızca Süper Admin tarafından verilebilir." }, { status: 403 });
  const body = await req.json();
  const id = String(body.id || "").trim();
  const action = String(body.action || "moderate").trim();
  if (action === "inventory") {
    const stock = Math.floor(Number(body.stock));
    if (!id || !Number.isFinite(stock) || stock < 0 || stock > 1_000_000) {
      return NextResponse.json({ ok: false, error: "Geçersiz stok değeri." }, { status: 400 });
    }
    const ref = adminDb().collection("seller_products").doc(id);
    const product = await ref.get();
    if (!product.exists) return NextResponse.json({ ok: false, error: "Ürün bulunamadı." }, { status: 404 });
    const eventRef = adminDb().collection("seller_product_events").doc();
    const batch = adminDb().batch();
    batch.set(ref, { stock, updatedAt: FieldValue.serverTimestamp(), inventoryUpdatedBy: admin.uid }, { merge: true });
    batch.set(eventRef, { productId:id, ownerUid:String(product.data()?.ownerUid || ""), type:"inventory_updated", previousStock:Number(product.data()?.stock || 0), stock, actorUid:admin.uid, actorEmail:admin.email, createdAt:FieldValue.serverTimestamp() });
    await batch.commit();
    return NextResponse.json({ ok: true, stock });
  }
  const status = String(body.status || "").trim();
  const moderationNote = String(body.moderationNote || "").trim().slice(0, 800);
  if (!id || !["approved", "rejected", "pending_review"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Geçersiz ürün kararı." }, { status: 400 });
  }
  if (status === "rejected" && moderationNote.length < 5) {
    return NextResponse.json({ ok: false, error: "Düzeltme isteği için satıcıya açıklayıcı bir not yazın." }, { status: 400 });
  }
  const ref = adminDb().collection("seller_products").doc(id);
  const product = await ref.get();
  if (!product.exists) return NextResponse.json({ ok: false, error: "Ürün bulunamadı." }, { status: 404 });
  const eventRef = adminDb().collection("seller_product_events").doc();
  const batch = adminDb().batch();
  batch.set(ref, { status, moderationNote, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: admin.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.set(eventRef, { productId:id, ownerUid:String(product.data()?.ownerUid || ""), fromStatus:String(product.data()?.status || ""), toStatus:status, moderationNote, actorUid:admin.uid, actorEmail:admin.email, createdAt:FieldValue.serverTimestamp() });
  await batch.commit();
  return NextResponse.json({ ok: true, status });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (admin.role !== "admin") return NextResponse.json({ ok:false, error:"Bu işlem yalnızca Süper Admin içindir." }, { status:403 });
  const body = await req.json();
  const ownerUid = String(body.ownerUid || "").trim();
  const requestedStoreName = String(body.storeName || "").trim().slice(0, 120);
  const rows = Array.isArray(body.items) ? body.items.slice(0, 200) : [];
  if (!ownerUid || !rows.length) return NextResponse.json({ ok:false, error:"Onaylı mağaza ve en az bir ürün gerekli." }, { status:400 });
  const db = adminDb();
  const seller = await db.collection("seller_applications").doc(ownerUid).get();
  if (!seller.exists || seller.data()?.status !== "approved") return NextResponse.json({ ok:false, error:"Ürünler yalnızca onaylı bir mağazaya aktarılabilir." }, { status:400 });
  const storeName = String(seller.data()?.storeName || seller.data()?.businessName || requestedStoreName || "Mağaza").trim().slice(0,120);
  const existing = await db.collection("seller_products").where("ownerUid", "==", ownerUid).limit(500).get();
  const usedSkus = new Set(existing.docs.filter(d=>d.data()?.status !== "archived").map(d=>String(d.data()?.sku || "").toUpperCase()));
  const accepted: Array<Record<string, unknown>> = [];
  const errors: Array<{ row:number; error:string }> = [];
  rows.forEach((raw:any, index:number) => {
    const title = String(raw?.title || "").trim().replace(/\s+/g," ").slice(0,140);
    const description = String(raw?.description || "").trim().slice(0,4000);
    const category = String(raw?.category || "").trim().slice(0,80);
    const brand = String(raw?.brand || "").trim().slice(0,80);
    const sku = String(raw?.sku || "").trim().toUpperCase().slice(0,64);
    const price = Number(raw?.price);
    const stock = Math.max(0, Math.min(1_000_000, Math.floor(Number(raw?.stock) || 0)));
    const images = Array.isArray(raw?.images) ? raw.images.map((v:unknown)=>String(v).trim()).filter((v:string)=>/^https?:\/\//.test(v)).slice(0,8) : [];
    if (title.length < 3 || description.length < 20 || !category || !sku || !Number.isFinite(price) || price <= 0) { errors.push({ row:index + 2, error:"Ad, en az 20 karakter açıklama, kategori, SKU ve pozitif fiyat gerekli." }); return; }
    if (usedSkus.has(sku)) { errors.push({ row:index + 2, error:`${sku} SKU zaten kullanılıyor.` }); return; }
    usedSkus.add(sku);
    accepted.push({ ownerUid, sellerEmail:String(seller.data()?.email || ""), storeName, title, description, category, brand, sku, price:Math.min(price,100_000_000), compareAtPrice:null, stock, images, status:"pending_review", source:"admin_import", moderationNote:"", createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp() });
  });
  if (!accepted.length) return NextResponse.json({ ok:false, error:"Aktarılabilecek geçerli ürün bulunamadı.", errors }, { status:400 });
  const batch = db.batch();
  accepted.forEach(item=>batch.set(db.collection("seller_products").doc(), item));
  await batch.commit();
  return NextResponse.json({ ok:true, imported:accepted.length, rejected:errors.length, errors }, { status:201 });
}
