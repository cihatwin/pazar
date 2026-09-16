import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kargo ve Teslimat | 6'ncı Kuyumculuk",
  description:
    "6'ncı Kuyumculuk kargo ve teslimat bilgileri. Sigortalı kargo, teslimat süreleri, ücretsiz kargo koşulları ve MNG Kargo ile güvenli gönderim.",
  keywords: [
    "6ncı kuyumculuk kargo",
    "altın takı kargo",
    "kuyumcu teslimat",
    "ücretsiz kargo",
    "sigortalı kargo",
  ],
  alternates: {
    canonical: "https://6nci.com/kargo-teslimat",
  },
  openGraph: {
    title: "Kargo ve Teslimat | 6'ncı Kuyumculuk",
    description:
      "Sigortalı kargo, teslimat süreleri ve ücretsiz kargo koşulları.",
    url: "https://6nci.com/kargo-teslimat",
    type: "website",
  },
};

export default function KargoTeslimatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
