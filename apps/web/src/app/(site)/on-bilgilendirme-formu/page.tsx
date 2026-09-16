import type { Metadata } from "next";
import LegalPageTemplate from "@/components/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu | 6'ncı Kuyumculuk",
  description:
    "Sipariş öncesi ön bilgilendirme formu. Ürün, ödeme, teslimat ve iade süreçlerine ilişkin özet bilgilendirme.",
  alternates: {
    canonical: "https://6nci.com/on-bilgilendirme-formu",
  },
};

export default function PreInformationFormPage() {
  return (
    <LegalPageTemplate
      eyebrow="Bilgilendirme"
      title="Ön Bilgilendirme Formu"
      updatedAt="19.04.2026"
      description="Bu form, sipariş verilmeden önce kullanıcıların ürün, ödeme, teslimat, iade ve destek süreçleri hakkında temel şekilde bilgilendirilmesi amacıyla hazırlanmıştır."
      sections={[
        {
          title: "Satıcı Bilgisi",
          body: "Satıcı unvanı: BİZİM 6 KUYUMCULUK İNŞAAT EMLAK SANAYİ TİCARET LİMİTED ŞİRKETİ. Adres: Cumhuriyet, Belediye Cd. No:9, 48303 Fethiye/Muğla. E-posta: info@6nci.com.",
        },
        {
          title: "Ürün ve Fiyat",
          body: "Siparişe konu ürünün temel nitelikleri, fiyatı, varsa ek ücretleri ve teslimat kapsamı ilgili ürün ve sipariş ekranlarında kullanıcıya gösterilir.",
        },
        {
          title: "Ödeme Süreci",
          body: "Ödemeler güvenli altyapılar üzerinden alınır. Siparişin kesinleşmesi ödeme onayına ve gerekli kontrollerin tamamlanmasına bağlıdır.",
        },
        {
          title: "Teslimat",
          body: "Teslimat süresi ürün hazırlık ve lojistik koşullarına göre değişebilir. Kullanıcı, teslimat bilgilerinin doğru ve eksiksiz olmasından sorumludur.",
        },
        {
          title: "İade ve Destek",
          body: "İade, iptal ve destek süreçleri için platform içi destek alanı veya info@6nci.com adresi üzerinden iletişim kurulabilir.",
        },
      ]}
    />
  );
}