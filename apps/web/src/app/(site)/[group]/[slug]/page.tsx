import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase.admin";
import { getSeoSettings, resolveBaseUrl } from "@/lib/getSeoSettings";
import PagePublicClient from "@/components/pages/PagePublicClient";
import { notFound } from "next/navigation";
import { CATALOG_RESET_MODE } from "@/lib/catalogMode";

function pickText(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  return String(v?.tr || v?.en || "").trim();
}

function cleanSeg(x: string) {
  return String(x || "").trim().replace(/[^\w-]/g, "");
}

async function getPageDoc(group: string, slug: string) {
  if (CATALOG_RESET_MODE) return null;
  try {
    const db = adminDb();
    const id = `${cleanSeg(group)}-${cleanSeg(slug)}`;
    const snap = await db.collection("pages").doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as any;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { group: string; slug: string };
}): Promise<Metadata> {
  const group = decodeURIComponent(params.group);
  const slug = decodeURIComponent(params.slug);
  const raw = await getPageDoc(group, slug);

  // pageDoc wrapper olabilir
  const doc = raw?.pageDoc && typeof raw.pageDoc === "object" ? raw.pageDoc : raw;

  if (!doc || doc.isPublished === false) {
    return {
      title: "Sayfa Bulunamadı | 6'ncı Kuyumculuk",
      robots: { index: false, follow: false },
    };
  }

  const seo = await getSeoSettings();
  const baseUrl = resolveBaseUrl(seo);

  const title = pickText(doc.title) || slug;
  const description =
    pickText(doc.description) ||
    pickText(doc.excerpt) ||
    pickText(doc.contentHtml)?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    `${title} — 6'ncı Kuyumculuk`;

  const canonical = baseUrl
    ? `${baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(group)}/${encodeURIComponent(slug)}`
    : undefined;

  return {
    title: `${title} | 6'ncı Kuyumculuk`,
    description: description.slice(0, 160),
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | 6'ncı Kuyumculuk`,
      description: description.slice(0, 160),
      url: canonical,
      siteName: "Altıncı Kuyumculuk",
      type: "website",
      images: seo.meta.defaultOgImage
        ? [{ url: seo.meta.defaultOgImage, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | 6'ncı Kuyumculuk`,
      description: description.slice(0, 160),
      images: seo.meta.defaultOgImage ? [seo.meta.defaultOgImage] : undefined,
    },
  };
}

export default function Page({ params }: { params: { group: string; slug: string } }) {
  if (CATALOG_RESET_MODE) notFound();
  return <PagePublicClient params={params} />;
}
