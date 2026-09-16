import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase.admin";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const snap = await adminDb().collection("seller_products").doc(params.id).get();
  if (!snap.exists || snap.data()?.status !== "approved") return { title: "Ürün bulunamadı" };
  const data = snap.data() as any;
  return {
    title: `${data.title} | ${data.storeName} | PAZAR.`,
    description: String(data.description || "").slice(0, 160),
    openGraph: {
      title: data.title,
      description: String(data.description || "").slice(0, 160),
      images: data.images?.[0] ? [{ url: data.images[0] }] : [],
    },
  };
}

export default async function MarketplaceProductPage({
  params,
}: {
  params: { id: string };
}) {
  const snap = await adminDb()
    .collection("seller_products")
    .doc(params.id)
    .get();

  if (!snap.exists || snap.data()?.status !== "approved") notFound();

  const data = snap.data() as any;
  const item = {
    id: snap.id,
    title: String(data.title || ""),
    description: String(data.description || ""),
    category: String(data.category || ""),
    brand: String(data.brand || ""),
    sku: String(data.sku || ""),
    price: Number(data.price || 0),
    compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
    stock: Number(data.stock || 0),
    images: Array.isArray(data.images) ? data.images : [],
    storeName: String(data.storeName || "Mağaza"),
    ownerUid: String(data.ownerUid || ""),
  };

  return <ProductDetailClient item={item} />;
}
