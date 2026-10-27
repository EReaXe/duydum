# İşlem! — hızlı matematik yarışı

GitHub Pages uyumlu, yerel HTML/CSS/JS matematik web oyunu. İşlem! çalışma adıdır.

## Oyna

node scripts/serve.cjs veya baslat.cmd → http://localhost:3000.

Misafir Solo internet olmadan çalışır ve sonuçları yalnız cihazındaki tarayıcıda saklar. Hesapla oynanan Solo, canlı haftalık/aylık sıralamaya puan yazar. Ranked iki girişli oyuncuyu eşleştirir; ikinci gerçek oyuncu gerekir. Hesap ve canlı oyun internet/Supabase kullanır.

Solo:90 saniyelik koşu, sınırsız soru. Doğru cevap+100puan ve kalan süreye+5saniye; anında sonraki soru. Yanlışta3saniye bekle, aynı soruda tekrar dene; sayaç devam eder. Soru geçmek puan/süre kazandırmaz. Süre bitince koşu tamamlanır. Ranked: her oyuncuya90saniyelik kişisel saat; doğruya kendi saatine+5saniye,sınırsız soru. Aynı soru dizisinde bağımsız ilerleme. İki saat aynı anda çalışır; ilk biten kaybeder. Eşleşmeden sonra ortak3sngeri sayım var. Yanlışta3snbekleme,RankedPas kapalı. Sonuç sunucu tarafından belirlenir,Elo1000başlangıç/K32. Solo Elo değiştirmez. Ranked ayrılma hükmen yenilgidir.

18 soru kalıbı: işlem önceliği, eksik çarpan/toplanan/bölünen, yarım/çeyrek, artan/katlanan örüntü, parantez, çarpma-çıkarma, yüzde, kare, iki adım, çevre, ortalama, zaman/uzunluk dönüşümü ve kalan bulma.

## Yapı

- index.html,style.css: responsive arayüz.
- app.js: oyun ve profil/leaderboard denetimi.
- math-engine.js: misafir pratik motoru.
- auth.js,config.js,assets/vendor/: mevcut hesap bağlantısı; yalnız public key.
- db/math.sql: sunucu soru/puan/eşleşme/Elo ve sıralama backend'i.
- scripts/test-math.cjs: matematik ve istemci akış kontrolleri.

Eski catalog.js,rooms.js,profile.js,db/schema.sql,db/rooms.sql ve müzik varlıkları veri kaybını önlemek için korunur; aktif sayfa bunları yüklemez. Eski müzik testleri yeni oyunun testi değildir.

## GitHub Pages

Settings → Pages → Build and deployment → Source: GitHub Actions. .github/workflows/pages.yml yalnız izin verilen aktif oyun dosyalarını yayınlar. .nojekyll ve göreli yollar korunur. Pages statik dosyaları sunar; canlı oyun backend'i mevcut Supabase projesindedir. Node yayın ortamında gerekmez. Depo: https://github.com/EReaXe/islem. Yayın adresi: https://ereaxe.github.io/islem/. Deployment durumu PROJECT_STATUS.md içindedir.

## Doğrulama

- node scripts/test-math.cjs
- node scripts/test-auth.cjs
- node scripts/sync-instructions.cjs --check

Güvenlik kapsamı ve açık beta sınırları SECURITY.md içinde belgelenmiştir. Bot önleme kapsamlı değildir; gerçek kullanıcı yükü ve bağlantı gecikmesi ayrıca değerlendirilmelidir.

## Liderlik ve oyuncu profilleri

Haftalık/aylık Solo satırları avatar,rütbe ve Elo gösterir;adına basınca genel oyuncu profili açılır. Bu profil e-posta veya özel tur geçmişini içermez.

Geliştirici için scripts/test-ranked-live.cjs açık --prepare/--match parametreleriyle gerçek Auth/Ranked entegrasyon testidir;otomatik çalıştırılmaz. Testkimlikbilgileri .local-tests/ altında gitignore edilir. Canlı test hesabı temizliği açık kullanıcı onayıyla yapılır.
