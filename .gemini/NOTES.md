# 🗂️ Proje Notları — Altıncı Kuyumculuk Web

> Bu dosya, yapılan tüm işlerin kaydını tutar. Her oturumda güncellenir.
> Böylece tekrar tekrar araştırmaya gerek kalmaz.

---

## 📌 Proje Yapısı

| Dosya/Dizin | Açıklama |
|---|---|
| `apps/web/` | Next.js 14 frontend (App Router) |
| `apps/web/src/app/(site)/` | Müşteri tarafı sayfalar |
| `apps/web/src/app/admin/(admin)/` | Admin paneli route'ları (component'ten re-export) |
| `apps/web/src/components/admin/` | Admin bileşenleri (asıl kod burada) |
| `functions/` | Firebase Cloud Functions (mail gönderimi vb.) |
| `firebase.json` | Firebase Hosting + Functions config |
| `.github/workflows/deploy.yml` | CI/CD workflow |

## 📌 Teknik Bilgiler

- **Node:** 22
- **Next.js:** 14.2.35
- **Firebase Proje:** `altincinew`
- **Port:** dev server `9002`
- **Admin route pattern:** `app/admin/(admin)/xxx/page.tsx` → `export { default } from "@/components/admin/app/(admin)/xxx/page"`
- **Firestore:** products, orders, categories, rates, stock_alerts, support_threads, reviews, site_options
- **Build:** `cd apps/web && npx next build`
- **deepClean():** `app/admin/(admin)/products/[id]/page.tsx` → boş string'leri siler, dikkat!

## 📌 Push Protokolü

```
1. Kod değişikliği yap
2. Build al: cd apps/web && npx next build
3. ✅ Başarılı → Kullanıcıya bildir, onay bekle
4. ❌ Başarısız → Düzelt, tekrar build al
5. Kullanıcı "pushla" derse → git add -A && git commit && git push
6. ASLA habersiz push yapma!
```

---

## 📋 Yapılan İşler Geçmişi

### 2026-05-30 — Oturum 1

#### ✅ Sipariş Mail Bildirimleri
- `functions/src/orderMail.ts` güncellendi
- Kargoya verildi, teslim edildi, iade, iptal aşamalarında mail gönderimi eklendi
- Deploy: `firebase deploy --only functions`

#### ✅ Sipariş Detay (Client + Admin)
- Client ve admin sipariş detay sayfaları denetlendi
- Admin orders listesine pagination eklendi (limit 100 + "Daha fazla yükle")
- `preparing` ve `refunded` sayaçları eklendi
- Kargo iptal → otomatik status değişimini engelle

#### ✅ Admin Panel Audit
- 40+ sayfa tarandı
- Footer route düzeltildi (`app/admin/(admin)/footer/page.tsx` oluşturuldu)
- Operasyon sağlığı skoru: ürün katalog eksiklikleri çıkarıldı, sadece operasyonel metrikler

#### ✅ Ürün Açıklama & Detay Kriterleri
- `cleanAdvanced()`: description/shortDescription deepClean'den korundu
- ProductClient: otomatik detay satırları (karat, gram, boyut) eklendi
- Detay kartları CSS: insani boyutlara küçültüldü (ikon 68px→36px, font düzeltildi)

#### ✅ CI/CD
- `.github/workflows/deploy.yml` oluşturuldu
- Build + lint → Manuel onay → Firebase deploy akışı

#### ✅ İlk Push
- 33 dosya, 3131 ekleme
- Commit: `02028d8`
