import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sertifika ve Güvence | 6'ncı Kuyumculuk",
  description:
    "6'ncı Kuyumculuk sertifika ve güvence politikası. Uluslararası standartlarda sertifikalı altın, kalite belgeli ürünler ve güvenli alışveriş garantisi.",
  keywords: [
    "sertifikalı altın",
    "altın sertifika",
    "kuyumcu güvence",
    "kalite belgeli altın",
    "güvenli altın alışveriş",
  ],
  alternates: {
    canonical: "https://6nci.com/sertifika-guvence",
  },
  openGraph: {
    title: "Sertifika ve Güvence | 6'ncı Kuyumculuk",
    description:
      "Sertifikalı altın, kalite belgeli ürünler ve güvenli alışveriş garantisi.",
    url: "https://6nci.com/sertifika-guvence",
    type: "website",
  },
};

export default function SertifikaGuvenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
