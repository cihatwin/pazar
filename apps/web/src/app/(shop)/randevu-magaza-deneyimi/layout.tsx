import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Randevu & Mağaza Deneyimi | 6'ncı Kuyumculuk",
  description:
    "6'ncı Kuyumculuk mağaza ziyaret randevusu. Fethiye mağazamızda kişiye özel danışmanlık ve mücevher deneyimi için randevu alın.",
  keywords: [
    "kuyumcu randevu",
    "mağaza ziyareti",
    "altın mağaza deneyimi",
    "kuyumcu fethiye",
    "mücevher deneyimi",
  ],
  alternates: {
    canonical: "https://6nci.com/randevu-magaza-deneyimi",
  },
  openGraph: {
    title: "Randevu & Mağaza Deneyimi | 6'ncı Kuyumculuk",
    description:
      "Fethiye mağazamızda kişiye özel danışmanlık ve mücevher deneyimi için randevu alın.",
    url: "https://6nci.com/randevu-magaza-deneyimi",
    type: "website",
  },
};

export default function RandevuMagazaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
