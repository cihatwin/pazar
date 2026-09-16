import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Altıncı Kuyumculuk Hakkında | 6'ncı Kuyumculuk",
  description:
    "6'ncı Kuyumculuk hakkında. Markamızın hikâyesi, vizyonumuz ve sertifikalı altın takı anlayışımız.",
  keywords: [
    "altıncı kuyumculuk hakkında",
    "6nci kuyumculuk",
    "altıncı hikaye",
    "kuyumcu fethiye",
  ],
  alternates: {
    canonical: "https://6nci.com/altinci-kuyumculuk",
  },
  openGraph: {
    title: "Altıncı Kuyumculuk Hakkında | 6'ncı Kuyumculuk",
    description:
      "Markamızın hikâyesi, vizyonumuz ve sertifikalı altın takı anlayışımız.",
    url: "https://6nci.com/altinci-kuyumculuk",
    type: "website",
  },
};

export default function AltinciKuyumculukLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
