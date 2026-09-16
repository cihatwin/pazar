# 🚀 Satış Öncesi Son Kontrol Raporu

**Tarih:** 31 Mayıs 2026  
**Hazırlayan:** AI Dev Assistant  
**Proje:** Altıncı Kuyumculuk E-Ticaret  
**Durum:** Canlıya geçmeden önce son tarama

---

## 📊 Genel Özet

| Kategori | Durum | Not |
|----------|-------|-----|
| 🏗️ Build | ✅ Başarılı | Hatasız derleniyor |
| 🧹 Lint | ⚠️ Warning | 0 hata, ~28 warning (kullanılmayan değişken) |
| 🔒 Güvenlik | ⚠️ Dikkat | 3 eksik security header + npm audit bulgular |
| 💳 Ödeme | 🔴 KRİTİK | PayTR **TEST** modunda! |
| 📱 WhatsApp | 🔴 KRİTİK | 3 yerde placeholder numara |
| 🗄️ Firestore | ⚠️ Dikkat | Rules dosyası repo'da yok |
| 🔍 SEO | ✅ Tamam | robots.ts, sitemap.ts, metadata mevcut |
| ♿ Erişilebilirlik | ⚠️ Warning | Bazı `<img>` tag'leri `next/image` değil |
| 📦 npm Audit | ⚠️ Dikkat | 35 zafiyet (1 critical, 11 high) |
| 🧩 Error Handling | ✅ OK | error.tsx + not-found.tsx mevcut |

---

## 🔴 KRİTİK — Canlıya Geçmeden MUTLAKA Yapılmalı

### 1. 💳 PayTR Test Modundan Çık

> ⚠️ **Ödeme sistemi şu anda TEST modunda! Gerçek ödeme alınamaz.**

`.env.local` dosyasında:

```diff
-PAYMENT_MODE=test
+PAYMENT_MODE=live

-PAYTR_DEBUG_ON=1
+PAYTR_DEBUG_ON=0

-PAYTR_TEST_MODE=1
+PAYTR_TEST_MODE=0
```

**Not:** Bu değişikliği canlıya geçerken yap, test ortamında test modunda kalmalı.

---

### 2. 📱 WhatsApp Placeholder Numaraları

3 dosyada `90XXXXXXXXXX` veya boş WhatsApp linki var:

| Dosya | Satır | Sorun |
|-------|-------|-------|
| `apps/web/src/app/(shop)/HomeClient.tsx` | 567 | `wa.me/90XXXXXXXXXX` |
| `apps/web/src/app/(site)/olcu-rehberi/page.tsx` | 307 | `wa.me/90XXXXXXXXXX` |
| `apps/web/src/components/common/WhatsAppBubble.tsx` | 27 | `+90XXXXXXXXXX` default prop |
| `apps/web/src/app/(site)/checkout/success/[id]/page.tsx` | 678 | `wa.me/` ← **BOŞ numara!** |

**Düzeltme:** Tüm yerlerde doğru numara → `905078482448` (iletişim sayfasındaki gibi)

---

### 3. 🔒 Security Headers Eksik

`next.config.mjs` dosyasında 3 kritik header **yok**:

```diff
 headers: [
   { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
   { key: "X-XSS-Protection", value: "1; mode=block" },
   { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
+  { key: "X-Content-Type-Options", value: "nosniff" },
+  { key: "X-Frame-Options", value: "SAMEORIGIN" },
+  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
 ],
```

**Not:** `firebase.json` hosting config'inde `X-Content-Type-Options` ve `X-Frame-Options` var ama Vercel/App Hosting kullanıyorsan oradan servis edilmez, `next.config` içinde de olmalı.

---

## 🟡 ÖNEMLİ — Kısa Sürede Yapılmalı

### 4. 📦 Firebase Functions SDK Sürümü

`functions/package.json`:

```
firebase-functions: ^4.9.0  ← Eski (>=5.1.0 gerekli)
```

Firebase 2. nesil functions için `^5.1.0` önerilir. Deploy sırasında uyarı verebilir.

### 5. 📦 npm Audit Bulguları

```
35 zafiyet: 1 critical, 11 high, 22 moderate, 1 low
```

Çoğu `next` ve `yaml` gibi transitive bağımlılıklar. Deneme:
```bash
cd apps/web && npm audit fix
```

### 6. 🪵 Production Console.log Temizliği

55 adet `console.log` var kodda. Bunlar production'da gereksiz. Özellikle:

| Dosya | Dikkat |
|-------|--------|
| `apps/web/src/app/api/payments/start/route.ts:957` | `console.log` ödeme session payload logluyor — **hassas veri** |

### 7. 📂 Firestore Security Rules

Repo'da `firestore.rules` dosyası **yok**. Eğer Firebase konsolundan yönetiyorsan sorun değil, ama:
- Rules'ın repo'da versiyonlanması önerilir
- Firebase Console'dan mevcut rules'ları kontrol et

---

## 🟢 TAVSİYE — Sonraki Sprint İçin

### 8. `next/image` Kullanımı

7+ yerde `<img>` tag'ı kullanılmış. `next/image` ile değiştirilirse:
- LCP iyileşir
- WebP/AVIF otomatik format
- Lazy loading otomatik

### 9. Error Boundary Genişletme

Sadece 1 `error.tsx` var (`(site)` altında). Öneri:
- `(shop)/error.tsx` — mağaza hataları
- `admin/(admin)/error.tsx` — admin hataları
- `(site)/checkout/error.tsx` — ödeme hataları

### 10. Kullanılmayan Değişken Temizliği

~28 lint warning var. Hepsi `@typescript-eslint/no-unused-vars`:

| Dosya | Değişken |
|-------|----------|
| `login/page.tsx` | `msg` |
| `register/page.tsx` | `tr`, `en` |
| `hesabim/page.tsx` | `sendPasswordResetEmail`, `orderBy`, `AccountStats`, `startPasswordReset`, `defaultAddress` |
| `checkout/page.tsx` | `showRatesBox`, `email`, `profileLoading`, `countdownItems`, `missingProfileFields`, `profileReadyForCheckout` |

### 11. Loading States

Sadece 2 `loading.tsx` var. Ek olarak:
- `(site)/cart/loading.tsx`
- `(site)/checkout/loading.tsx`
- `admin/(admin)/loading.tsx`

### 12. Git Durumu

2 dosya commit edilmemiş:
- `apps/web/src/components/admin/app/(admin)/stock/page.tsx` (M)
- `functions/lib/rates.js` (M)

### 13. Çift PAYMENT_PROVIDER

`.env.local` dosyasında `PAYMENT_PROVIDER` **2 kez** tanımlanmış. İkincisi birincisini ezecek:
```
PAYMENT_PROVIDER=***  ← satır 15
PAYMENT_PROVIDER=***  ← satır 17
```

### 14. Manifest WebSocket Hatası

Dev server'da `manifest.webmanifest` 500 hatası veriyordu — build sonrası `.next` cache temizliğiyle çözüldü. Production build'de sorun olmamalı ama dikkat edilmeli.

---

## ✅ Sorunsuz Alanlar

| Alan | Durum |
|------|-------|
| 🏗️ **Build** | `next build` hatasız tamamlanıyor |
| 🔐 **API Auth** | Tüm admin API route'ları `verifyAdmin` ile korumalı |
| 🛡️ **Rate Limiting** | Middleware tüm API route'larını koruyor |
| 💳 **PayTR Callback** | Rate limit'ten doğru şekilde hariç tutulmuş |
| 🔐 **Env güvenliği** | `.env.local` gitignore'da, secret'lar NEXT_PUBLIC_ ile sızmıyor |
| 🗺️ **SEO** | `robots.ts`, `sitemap.ts`, `metadata` export'ları mevcut |
| 📱 **PWA** | `manifest.ts` mevcut, service worker var |
| 🧭 **Routing** | Admin disallow, API disallow doğru yapılandırılmış |
| 🎨 **HSTS** | `Strict-Transport-Security` header'ı aktif |
| 🔑 **Admin Panel** | Permission-based sidebar, yetki kontrolü var |

---

## 🎯 Canlıya Geçiş Checklist

- [ ] 1. PayTR → LIVE moda geç (PAYMENT_MODE=live, TEST_MODE=0, DEBUG=0)
- [ ] 2. WhatsApp numaralarını düzelt (4 dosya)
- [ ] 3. Security headers ekle (next.config.mjs)
- [ ] 4. payments/start route'daki console.log'u kaldır
- [ ] 5. Çift PAYMENT_PROVIDER satırını temizle
- [ ] 6. npm audit fix çalıştır
- [ ] 7. Commit edilmemiş dosyaları commit et
- [ ] 8. Test siparişi oluştur & PayTR live doğrula
- [ ] 9. Firebase Console'dan Firestore rules kontrol et
- [ ] 10. Production domain SSL sertifikası kontrol et
