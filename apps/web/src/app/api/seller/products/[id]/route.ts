import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifySeller } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

function text(value: unknown, max: number) { return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max); }
function number(value: unknown, min: number, max: number) { const parsed=Number(value); return Number.isFinite(parsed)?Math.min(max,Math.max(min,parsed)):min; }
function iso(value:any){return value?.toDate?.()?.toISOString?.()||null;}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;
  const snapshot = await adminDb().collection("seller_products").doc(String(params.id||"").trim()).get();
  if (!snapshot.exists || snapshot.data()?.ownerUid !== seller.uid) return NextResponse.json({ok:false,error:"Ürün bulunamadı."},{status:404});
  const data=snapshot.data()||{};
  return NextResponse.json({ok:true,item:{id:snapshot.id,...data,createdAt:iso(data.createdAt),updatedAt:iso(data.updatedAt)}});
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;

  const ref = adminDb().collection("seller_products").doc(String(params.id || "").trim());
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.ownerUid !== seller.uid) {
    return NextResponse.json({ ok: false, error: "Ürün bulunamadı." }, { status: 404 });
  }

  const body = await req.json();
  const action = String(body.action || "");
  const current = String(snapshot.data()?.status || "draft");
  if (action === "update") {
    if (!["draft", "rejected"].includes(current)) return NextResponse.json({ ok:false, error:"İncelemedeki veya yayındaki ürün düzenlenemez." }, { status:409 });
    const title=text(body.title,140), description=text(body.description,4000), category=text(body.category,80), brand=text(body.brand,80), sku=text(body.sku,64).toUpperCase();
    const price=number(body.price,0,100_000_000), stock=Math.floor(number(body.stock,0,1_000_000));
    const compareAtPrice=body.compareAtPrice?number(body.compareAtPrice,0,100_000_000):null;
    const images=Array.isArray(body.images)?body.images.map((x:unknown)=>text(x,1200)).filter((x:string)=>/^https?:\/\//.test(x)).slice(0,8):[];
    if(title.length<3||description.length<20||!category||!sku||price<=0)return NextResponse.json({ok:false,error:"Ürün bilgileri eksik veya geçersiz."},{status:400});
    const all=await adminDb().collection("seller_products").where("ownerUid","==",seller.uid).limit(300).get();
    if(all.docs.some(doc=>doc.id!==snapshot.id&&String(doc.data().sku||"").toUpperCase()===sku&&doc.data().status!=="archived"))return NextResponse.json({ok:false,error:"Bu SKU başka bir üründe kullanılıyor."},{status:409});
    await ref.set({title,description,category,brand,sku,price,compareAtPrice,stock,images,moderationNote:"",updatedAt:FieldValue.serverTimestamp()},{merge:true});
    return NextResponse.json({ok:true,status:current});
  }
  let status = current;
  if (action === "submit" && ["draft", "rejected"].includes(current)) status = "pending_review";
  else if (action === "archive") status = "archived";
  else if (action === "restore" && current === "archived") status = "draft";
  else return NextResponse.json({ ok: false, error: "Bu durum geçişi kullanılamıyor." }, { status: 400 });

  await ref.set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return NextResponse.json({ ok: true, status });
}
