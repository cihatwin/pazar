import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifySeller } from "@/lib/apiAuth";
import { adminBucket } from "@/lib/firebase.admin";

export const runtime = "nodejs";
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const seller = await verifySeller(req);
  if (seller instanceof NextResponse) return seller;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !TYPES.has(file.type) || file.size <= 0 || file.size > MAX) {
      return NextResponse.json({ ok: false, error: "JPG, PNG veya WEBP görsel en fazla 8 MB olabilir." }, { status: 400 });
    }
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const token = randomUUID();
    const path = `seller-products/${seller.uid}/${Date.now()}-${randomUUID()}.${extension}`;
    const bucket = adminBucket();
    await bucket.file(path).save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      contentType: file.type,
      metadata: { cacheControl: "public,max-age=31536000,immutable", metadata: { firebaseStorageDownloadTokens: token, ownerUid: seller.uid } },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("seller image upload failed", error);
    return NextResponse.json({ ok: false, error: "Görsel güvenli depoya yüklenemedi." }, { status: 500 });
  }
}
