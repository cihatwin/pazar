import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdmin } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (admin.role !== "admin") return NextResponse.json({ ok: false, error: "Bu alan yalnızca Süper Admin içindir." }, { status: 403 });
  const snap = await adminDb().collection("seller_applications").orderBy("updatedAt", "desc").limit(200).get();
  return NextResponse.json({ ok: true, items: snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString?.() || null, updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString?.() || null })) });
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (admin instanceof NextResponse) return admin;
  if (admin.role !== "admin") return NextResponse.json({ ok: false, error: "Bu karar yalnızca Süper Admin tarafından verilebilir." }, { status: 403 });
  const body = await req.json();
  const uid = String(body?.uid || "").trim();
  const status = String(body?.status || "").trim();
  if (!uid || !["approved", "rejected", "pending"].includes(status)) return NextResponse.json({ ok: false, error: "Geçersiz karar." }, { status: 400 });

  const db = adminDb();
  const now = FieldValue.serverTimestamp();
  const batch = db.batch();
  batch.set(db.collection("seller_applications").doc(uid), { status, reviewedAt: now, reviewedBy: admin.uid, updatedAt: now }, { merge: true });
  batch.set(db.collection("users").doc(uid), { role: status === "approved" ? "seller" : "member", "sellerOnboarding.status": status, "sellerOnboarding.reviewedAt": now, updatedAt: now }, { merge: true });
  await batch.commit();
  return NextResponse.json({ ok: true, status });
}
