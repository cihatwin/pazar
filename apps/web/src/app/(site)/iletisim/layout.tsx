import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim ve Destek",
  description:
    "PAZAR. müşteri, satıcı ve iş ortaklığı destek merkezi.",
  keywords: [
    "PAZAR iletişim",
    "müşteri desteği",
    "satıcı desteği",
    "pazar destek merkezi",
  ],
  alternates: {
    canonical: "/iletisim",
  },
  openGraph: {
    title: "İletişim ve Destek | PAZAR.",
    description:
      "Müşteri, satıcı ve iş ortaklığı ekiplerine doğrudan ulaşın.",
    url: "/iletisim",
    type: "website",
  },
};

export default function IletisimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
