import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular | 6'ncı Kuyumculuk",
  description:
    "6'ncı Kuyumculuk hakkında sıkça sorulan sorular. Sipariş, ödeme, kargo, iade, ürün bilgisi ve hesap işlemleri hakkında tüm cevaplar.",
  keywords: [
    "6ncı kuyumculuk sss",
    "altıncı kuyumculuk sorular",
    "online kuyumcu sıkça sorulan sorular",
    "altın iade koşulları",
    "kuyumcu kargo",
  ],
  alternates: {
    canonical: "https://6nci.com/sss",
  },
  openGraph: {
    title: "Sıkça Sorulan Sorular | 6'ncı Kuyumculuk",
    description:
      "Sipariş, ödeme, kargo, iade ve ürün bilgisi hakkında tüm cevaplar.",
    url: "https://6nci.com/sss",
    type: "website",
  },
};

/* ── FAQPage JSON-LD — Google Rich Results FAQ snippet'ı için ── */
const FAQ_ITEMS = [
  {
    q: "Hangi ödeme yöntemleriyle alışveriş yapabilirim?",
    a: "Kredi kartı / banka kartı (Visa, Mastercard, Troy) ile güvenli 3D Secure ödeme ve havale/EFT seçeneklerini sunuyoruz. PayTR güvencesiyle tüm ödemeler güvenle işlenir.",
  },
  {
    q: "Taksit seçeneği var mı?",
    a: "Evet, kredi kartıyla ödeme sırasında PayTR ödeme ekranında bankanızın sunduğu taksit seçenekleri otomatik olarak görüntülenir.",
  },
  {
    q: "Kargo ücreti ne kadar?",
    a: "Kargo ücretleri sipariş tutarına göre değişmektedir. Belirli bir tutarın üzerindeki siparişlerde ücretsiz kargo sunmaktayız.",
  },
  {
    q: "Siparişim ne zaman kargoya verilir?",
    a: "Ödemeniz onaylandıktan sonra siparişiniz genellikle 1-3 iş günü içinde kargoya teslim edilir.",
  },
  {
    q: "İade süreci nasıl işliyor?",
    a: "Ürünü teslim aldıktan sonra 14 gün içinde iade talebinde bulunabilirsiniz. Hesabım → İade Talepleri sekmesinden iade talebinizi oluşturabilirsiniz.",
  },
  {
    q: "Ürünleriniz sertifikalı mı?",
    a: "Evet, tüm altın ve pırlanta ürünlerimiz uluslararası standartlara uygun sertifikalarla birlikte gönderilmektedir.",
  },
  {
    q: "Fiyatlar neden değişiyor?",
    a: "Altın ürünlerinin fiyatları anlık altın kuru ile hesaplanmaktadır. Kur değişimleri fiyatlara yansımaktadır.",
  },
  {
    q: "Yüzük ölçümü nasıl yapılır?",
    a: "Ölçü Rehberi sayfamızda yüzük ölçüsü belirleme rehberimizi inceleyebilirsiniz.",
  },
  {
    q: "Kargo takibi nasıl yapılır?",
    a: "Siparişiniz kargoya verildikten sonra Hesabım → Kargo Takip sekmesinden MNG Kargo takip numaranızla gönderinizi anlık olarak izleyebilirsiniz.",
  },
  {
    q: "Hesap oluşturmak zorunlu mu?",
    a: "Sipariş verebilmek için üye olmanız gerekmektedir. Üyelik sayesinde siparişlerinizi takip edebilir, iade talebi oluşturabilir ve özel kampanyalardan yararlanabilirsiniz.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function SssLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="jsonld-faq"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
