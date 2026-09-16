# Çok Satıcılı Pazaryeri Dönüşüm Planı

## Hedef

Mevcut tek-satıcı e-ticaret altyapısını, platform sahibinin kendi ürünlerini de sattığı ve harici satıcıların mağaza açabildiği güvenli bir pazaryerine dönüştürmek.

## Uygulama sırası

### P0 — Temel veri ve yetki mimarisi

- `sellers` koleksiyonu: mağaza bilgileri, şirket/vergi bilgileri, başvuru ve onay durumu.
- Kullanıcı rolleri: `customer`, `seller`, `admin`, `super_admin`.
- Her ürüne zorunlu `sellerId`, `storeId` ve yayın/onay durumu eklenmesi.
- Mevcut ürünlerin platformun kendi mağazasına bağlanması.
- Firestore güvenlik kuralları: satıcı yalnızca kendi mağaza, ürün ve sipariş verilerini yönetebilmeli.
- Admin onayı olmadan mağaza ve ürün yayına alınmamalı.

### P1 — Satıcı başvurusu ve paneli

- Satıcı kayıt/başvuru akışı ve belge yükleme.
- Admin tarafında başvuru inceleme, onay, askıya alma ve reddetme.
- Satıcı paneli: ürün, stok, fiyat, sipariş ve mağaza profili yönetimi.
- İşlem günlüğü ve kritik değişikliklerde denetim kaydı.

### P2 — Sepet ve sipariş mimarisi

- Sepette farklı satıcıların ürünlerini destekleme.
- Tek müşteri ödemesinden bir ana sipariş ve satıcı bazlı alt siparişler üretme.
- Kargo ücreti, kampanya, kupon, iptal ve iade hesaplarını satıcı bazında ayırma.
- Satıcının yalnızca kendi alt siparişini görmesi ve işleyebilmesi.

### P3 — Komisyon ve para akışı

- Kategori veya satıcı bazlı komisyon oranları.
- Platform komisyonu, ödeme masrafı, kargo ve satıcı hakedişinin değişmez kayıtlarla hesaplanması.
- İade/iptal sonrası hakediş düzeltmeleri.
- Satıcı bakiyesi, ödeme takvimi, mutabakat ve dışa aktarılabilir raporlar.
- Ödeme kuruluşunun pazaryeri/alt üye işyeri desteği kesinleştirilmeden canlı para dağıtımına geçilmemesi.

### P4 — Mağaza vitrini ve müşteri güveni

- Her satıcı için mağaza sayfası, logo, açıklama, puan ve mağaza politikaları.
- Ürün sayfasında satıcı bilgisinin açık gösterimi.
- Satıcı ve ürün değerlendirmelerinin ayrı tutulması.
- Mesafeli satış, KVKK, iade ve satıcı sözleşmelerinin pazaryeri modeline göre güncellenmesi.

### P5 — Operasyon ve canlıya geçiş

- Satıcı performansı, geciken kargo, iptal ve iade oranları.
- Uyuşmazlık ve destek akışı.
- Sahtecilik/risk kontrolleri ve hesap askıya alma.
- Test satıcılarıyla uçtan uca sipariş, ödeme, kargo, iptal, iade ve hakediş senaryoları.

## İlk geliştirme paketi

1. Veri modellerini ve rol/yetki matrisini kesinleştir.
2. `sellers` altyapısını ve platformun kendi varsayılan mağazasını oluştur.
3. Mevcut ürünlere `sellerId`/`storeId` geçişi uygula.
4. Firestore rules ve sunucu tarafı yetki kontrollerini ekle.
5. Satıcı başvuru ekranı ile temel satıcı panelini oluştur.
6. Ardından sipariş bölme ve komisyon altyapısına geç.

## Kritik not

Mevcut ödeme ve sipariş kodu tek satıcılı varsayımlara dayanıyor. Önce veri sahipliği ve alt sipariş modeli kurulmadan satıcı paneli veya komisyon ekranı geliştirmek veri sızıntısı ve yanlış hakediş riski doğurur.
