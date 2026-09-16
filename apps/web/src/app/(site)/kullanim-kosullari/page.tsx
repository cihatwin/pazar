import type { Metadata } from "next";
import LegalPageTemplate from "@/components/legal/LegalPageTemplate";

export const metadata: Metadata = {
  title: "Kullanım Koşulları | PAZAR.",
  description:
    "PAZAR. çok satıcılı alışveriş platformunun müşteri ve satıcı kullanım koşulları.",
};

export default function TermsPage() {
  return (
    <LegalPageTemplate
      eyebrow="Yasal Metin"
      title="Kullanım Koşulları"
      updatedAt="19.04.2026"
      description="Bu koşullar, BİZİM 6 KUYUMCULUK İNŞAAT EMLAK SANAYİ TİCARET LİMİTED ŞİRKETİ tarafından PAZAR. markasıyla sunulan çok satıcılı platformu kullanan ziyaretçi, müşteri ve satıcılar için geçerlidir."
      sections={[
        {
          title: "Hizmet Kapsamı",
          body: "PAZAR.; bağımsız satıcıların mağaza açabildiği, ürün sunduğu ve müşterilerin bu ürünleri inceleyip satın alabildiği elektronik pazaryeri altyapısı sağlar. Siparişe konu ürünün satıcısı ürün sayfasında ve sipariş belgelerinde belirtilir.",
        },
        {
          title: "Satıcıların Sorumluluğu",
          body: "Satıcı; ürün bilgilerinin, fiyatların, stokların, faturaların, teslimatın, satış sonrası desteğin ve mevzuata uygunluğun doğruluğundan sorumludur. PAZAR. gerekli gördüğü mağaza ve ürünleri inceleyebilir, askıya alabilir veya ek doğrulama isteyebilir.",
        },
        {
          title: "Müşteri ve Satıcı Hesapları",
          body: "Müşteri ve satıcı hesap alanları birbirinden ayrıdır. Satıcı hesabı açılması satış yetkisinin otomatik verildiği anlamına gelmez; mağaza, işletme ve kimlik doğrulaması tamamlandıktan sonra yetkilendirilir.",
        },
        {
          title: "Kullanıcı Sorumluluğu",
          body: "Kullanıcı, platforma girdiği bilgilerin doğru ve güncel olduğunu kabul eder. Hesap güvenliği, şifre gizliliği ve hesap üzerinden yapılan işlemlerden kullanıcı sorumludur.",
        },
        {
          title: "İçerik ve Fikri Haklar",
          body: "Platformda yer alan marka unsurları, ürün görselleri, metinler, açıklamalar ve tasarımlar ilgili fikri mülkiyet hakları kapsamında korunur. İzinsiz kullanılamaz, çoğaltılamaz ve kopyalanamaz.",
        },
        {
          title: "Hizmette Değişiklik",
          body: "Şirket, platformun bazı bölümlerini güncelleme, geçici olarak durdurma veya tamamen sonlandırma hakkını saklı tutar.",
        },
        {
          title: "İletişim ve Uyuşmazlık",
          body: "Kullanıma ilişkin talepler ve bildirimler için info@6nci.com üzerinden veya iletişim kanalları üzerinden bize ulaşılabilir. Tüketici işlemlerinde yürürlükteki mevzuat esas alınır.",
        },
      ]}
    />
  );
}
