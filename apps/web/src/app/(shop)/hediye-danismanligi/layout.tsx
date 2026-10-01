import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hediye Danışmanlığı | 6'ncı Kuyumculuk",
  description:
    "Sevdiklerinize en doğru hediyeyi seçmeniz için kişisel danışmanlık hizmeti. Altın takı, mücevher ve aksesuar önerileri.",
  keywords: [
    "hediye danışmanlığı",
    "altın hediye",
    "kuyumcu hediye önerisi",
    "mücevher hediye",
    "altın takı hediye",
  ],
  alternates: {
    canonical: "https://pazar-16c7b.web.app/hediye-danismanligi",
  },
  openGraph: {
    title: "Hediye Danışmanlığı | 6'ncı Kuyumculuk",
    description:
      "Sevdiklerinize en doğru hediyeyi seçmeniz için kişisel danışmanlık hizmeti.",
    url: "https://pazar-16c7b.web.app/hediye-danismanligi",
    type: "website",
  },
};

export default function HediyeDanismanligiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
