import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Güncel Altın Kuru | 6'ncı Kuyumculuk",
  description:
    "Anlık altın kuru ve gram altın fiyatları. 14 ayar, 18 ayar, 22 ayar altın alış-satış fiyatlarını takip edin.",
  keywords: [
    "altın kuru",
    "gram altın fiyatı",
    "güncel altın fiyatı",
    "14 ayar altın fiyatı",
    "22 ayar altın fiyatı",
    "altın alış satış",
  ],
  alternates: {
    canonical: "https://6nci.com/rates",
  },
  openGraph: {
    title: "Güncel Altın Kuru | 6'ncı Kuyumculuk",
    description:
      "Anlık altın kuru ve gram altın fiyatları. 14, 18, 22 ayar altın alış-satış fiyatları.",
    url: "https://6nci.com/rates",
    type: "website",
  },
};

export default function RatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
