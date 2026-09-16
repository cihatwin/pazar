import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyUser } from "@/lib/apiAuth";
import { adminDb } from "@/lib/firebase.admin";

const BUSINESS_TYPES = new Set(["individual", "company"]);
const CATEGORIES = new Set(["Moda", "Teknoloji", "Ev & Yaşam", "Kozmetik", "Spor", "Anne & Çocuk", "Diğer"]);

function text(value: unknown, max: number) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

export async function POST(req: NextRequest) {
  const verified = await verifyUser(req);
  if (verified instanceof NextResponse) return verified;

  try {
    const body = await req.json();
    const businessType = text(body.businessType, 16);
    const legalName = text(body.legalName, 120);
    const taxId = text(body.taxId, 20).replace(/\D/g, "");
    const city = text(body.city, 60);
    const phone = text(body.phone, 24);
    const storeName = text(body.storeName, 80);
    const category = text(body.category, 40);
    const website = text(body.website, 240);
    const description = text(body.description, 800);

    if (!BUSINESS_TYPES.has(businessType) || !legalName || !city || phone.length < 10 || !storeName || !CATEGORIES.has(category) || description.length < 20) {
      return NextResponse.json({ ok: false, error: "Başvuru bilgileri eksik veya geçersiz." }, { status: 400 });
    }
    if (businessType === "company" && taxId.length < 8) {
      return NextResponse.json({ ok: false, error: "Şirket başvurusu için geçerli vergi numarası gerekli." }, { status: 400 });
    }

    const db = adminDb();
    const userRef = db.collection("users").doc(verified.uid);
    const existing = await userRef.get();
    const current = existing.data()?.sellerOnboarding;
    if (current?.status === "approved") {
      return NextResponse.json({ ok: false, error: "Bu hesap zaten aktif bir satıcı hesabı." }, { status: 409 });
    }

    const now = FieldValue.serverTimestamp();
    const application = {
      status: "pending",
      businessType,
      legalName,
      taxId,
      city,
      phone,
      storeName,
      category,
      website,
      description,
      submittedAt: current?.submittedAt || now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(userRef, { email: (verified.email || "").toLowerCase(), accountIntent: "seller", sellerOnboarding: application, updatedAt: now }, { merge: true });
    batch.set(db.collection("seller_applications").doc(verified.uid), { ...application, uid: verified.uid, email: (verified.email || "").toLowerCase() }, { merge: true });
    await batch.commit();

    return NextResponse.json({ ok: true, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("seller application error", error);
    return NextResponse.json({ ok: false, error: "Satıcı başvurusu kaydedilemedi." }, { status: 500 });
  }
}
