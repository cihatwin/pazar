import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase.admin";
import StorePageClient from "./StorePageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const db = adminDb();
  const appSnap = await db.collection("seller_applications").doc(params.slug).get();
  if (!appSnap.exists || appSnap.data()?.status !== "approved") return { title: "Mağaza bulunamadı" };
  const data = appSnap.data() as any;
  return {
    title: `${data.storeName || "Mağaza"} | PAZAR.`,
    description: String(data.description || "Onaylı satıcı mağazası").slice(0, 160),
  };
}

export default async function PublicStorePage({
  params,
}: {
  params: { slug: string };
}) {
  const db = adminDb();

  // 1) Satıcı bilgilerini al
  const appSnap = await db
    .collection("seller_applications")
    .doc(params.slug)
    .get();

  if (!appSnap.exists || appSnap.data()?.status !== "approved") notFound();

  const appData = appSnap.data() as any;

  // User dokümanından ek bilgileri al (logo, banner)
  const userSnap = await db.collection("users").doc(params.slug).get();
  const userData = userSnap.data()?.sellerOnboarding || {};

  const store = {
    uid: params.slug,
    storeName: String(appData.storeName || "Mağaza"),
    description: String(userData.description || appData.description || ""),
    category: String(appData.category || ""),
    city: String(appData.city || ""),
    logoUrl: String(userData.logoUrl || ""),
    bannerUrl: String(userData.bannerUrl || ""),
  };

  // 2) Bu mağazanın onaylı ürünlerini çek
  const productsSnap = await db
    .collection("seller_products")
    .where("ownerUid", "==", params.slug)
    .where("status", "==", "approved")
    .limit(120)
    .get();

  const products = productsSnap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: String(d.title || ""),
        description: String(d.description || ""),
        category: String(d.category || ""),
        brand: String(d.brand || ""),
        sku: String(d.sku || ""),
        price: Number(d.price || 0),
        compareAtPrice: d.compareAtPrice ? Number(d.compareAtPrice) : null,
        stock: Number(d.stock || 0),
        images: Array.isArray(d.images) ? d.images : [],
      };
    })
    .sort((a, b) => b.price - a.price);

  return <StorePageClient store={store} products={products} />;
}
