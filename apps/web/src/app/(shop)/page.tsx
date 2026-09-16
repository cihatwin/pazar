export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getSeoSettings, resolveBaseUrl } from "@/lib/getSeoSettings";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

export async function generateMetadata(): Promise<Metadata> {
  if (CATALOG_RESET_MODE) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
    return {
      title: "PAZAR. | Yeni nesil alışveriş platformu",
      description: "Bağımsız satıcıları ve müşterileri tek pazarda buluşturan yeni nesil alışveriş platformu.",
      alternates:{ canonical:baseUrl || undefined },
      openGraph:{ title:"PAZAR. | Yeni nesil alışveriş platformu", description:"Yeni satıcılar, yeni ürünler, temiz bir pazar.", url:baseUrl || undefined, siteName:"PAZAR.", type:"website" },
      twitter:{ card:"summary", title:"PAZAR.", description:"Yeni nesil marketplace." },
    };
  }
  const seo = await getSeoSettings();
  const baseUrl = resolveBaseUrl(seo);

  return {
    title: "PAZAR. | Yeni nesil alışveriş platformu",
    description: "Bağımsız satıcıları, güçlü markaları ve müşterileri tek pazarda buluşturan yeni nesil alışveriş platformu.",
    keywords: ["online alışveriş", "pazaryeri", "satıcı mağazası", "güvenli alışveriş"],
    alternates: {
      canonical: baseUrl || undefined,
    },
    openGraph: {
      title: "PAZAR. | Yeni nesil alışveriş platformu",
      description: "Satıcıları ve müşterileri tek pazarda buluşturan modern alışveriş deneyimi.",
      url: baseUrl || undefined,
      siteName: "PAZAR.",
      type: "website",
      images: seo.meta.defaultOgImage
        ? [
            {
              url: seo.meta.defaultOgImage,
              alt: "PAZAR.",
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "PAZAR. | Yeni nesil alışveriş platformu",
      description: "Satıcıları ve müşterileri tek pazarda buluşturan modern alışveriş deneyimi.",
      images: seo.meta.defaultOgImage ? [seo.meta.defaultOgImage] : undefined,
    },
  };
}

export default function Page() {
  return <HomeClient />;
}
