import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "6'ncı Kuyumculuk — Mücevherat",
    short_name: "6'ncı",
    description:
      "Sertifikalı altın takı, mücevher ve aksesuar. Güvenli online alışveriş.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#1a1a2e",
    orientation: "portrait-primary",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/brand-favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/brand-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
      },
      {
        src: "/brand-icon-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
