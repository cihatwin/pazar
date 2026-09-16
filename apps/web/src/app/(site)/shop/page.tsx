// apps/web/src/app/shop/page.tsx
import type { Metadata } from "next";
import ShopClient from "./ShopClient";
import { getSeoSettings, resolveBaseUrl } from "@/lib/getSeoSettings";
import MarketplaceCatalog from "@/components/marketplace/MarketplaceCatalog";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

export async function generateMetadata(): Promise<Metadata> {
  if (CATALOG_RESET_MODE) {
    return {
      title: "Mağaza | PAZAR.",
      description: "PAZAR.'daki onaylı işletmelerin seçili ürünlerini keşfet.",
      robots: { index: true, follow: true },
    };
  }

  const seo = await getSeoSettings();
  const baseUrl = resolveBaseUrl(seo);
  // Canonical her zaman /shop — ?cat= filtreli URL'lerin duplicate olmasını önler
  const canonical = baseUrl ? `${baseUrl.replace(/\/+$/, "")}/shop` : undefined;

  return {
    title: "Mağaza | 6'ncı Kuyumculuk",
    description:
      "Altın bileklik, kolye, küpe, yüzük, kelepçe ve daha fazlası. Sertifikalı ürünler, güncel kur fiyatları, güvenli ödeme ve hızlı kargo ile online alışveriş.",
    alternates: {
      canonical,
    },
    openGraph: {
      title: "Mağaza | 6'ncı Kuyumculuk",
      description:
        "Altın bileklik, kolye, küpe, yüzük ve daha fazlasını keşfet. Sertifikalı ürünler, güvenli ödeme.",
      url: canonical,
      siteName: "Altıncı Kuyumculuk",
      type: "website",
      images: seo.meta.defaultOgImage
        ? [{ url: seo.meta.defaultOgImage, alt: "6'ncı Kuyumculuk Mağaza" }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "Mağaza | 6'ncı Kuyumculuk",
      description:
        "Altın ve mücevher ürünlerini keşfet. Güvenli ödeme, hızlı kargo.",
      images: seo.meta.defaultOgImage ? [seo.meta.defaultOgImage] : undefined,
    },
  };
}

export default function ShopPage({
  searchParams,
}: {
  searchParams?: { cat?: string; q?: string; sort?: string };
}) {
  if (CATALOG_RESET_MODE) {
    return <MarketplaceCatalog />;
  }

  const cat = (searchParams?.cat || "").trim();
  const q = (searchParams?.q || "").trim();
  const sort = (searchParams?.sort || "new").trim();

  return <ShopClient initialCat={cat} initialQ={q} initialSort={sort} />;
}
