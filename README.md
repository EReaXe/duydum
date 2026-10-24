# Duydum! — yerel beta

`index.html` dosyasını tarayıcıda açarak oyna. Misafir solo için kurulum, internet veya sunucu gerekmez. Hesap işlemleri için aşağıdaki localhost adımlarını kullan. Sesin başlaması için oynat düğmesine bas.

## Dosyalar

- `index.html`: oyun ekranı
- `style.css`: görünüm ve mobil düzen
- `app.js`: ses, tahmin, süre ve puan mantığı
- `assets/track-001.mp3`: Simitler — Snap

10 şarkılık solo betadır. Oyun ekranındaki oturum puanı yenileyince sıfırlanır; girişli oyuncunun tamamlanan beta denemeleri Supabase’de saklanır. Arkadaş odaları, ranked ve liderlik tablosu henüz uygulanmamıştır. Kesitler aynı başlangıçtan 1, 2, 4, 7, 11 ve 16 saniye çalar. Yanlış tahmin ve Pas sonraki kesiti açar.

Sites, CDN veya harici font kullanılmaz. Supabase yalnız hesap işlemleri için bağlıdır; çok oyunculu altyapı henüz yok.


## Ses dosyası kuralı

Oyuna eklenen ses dosyaları en fazla **16 saniye** olmalıdır. Daha uzun kaynakların yalnız ilk 16 saniyeye kadar olan kesiti assets içine alınır; tam kaynak dosyası değiştirilmez. Bu sınır yalnız oynatıcıda değil, diskteki dosyada da uygulanır.

## Proje belgeleri

- `AGENTS.md` / `CLAUDE.md`: aynı içerikli proje kuralları ve model talimatları.
- `notes.md`: kullanıcı fikirleri, öneriler ve açık kararlar.
- `PROJECT_STATUS.md`: mevcut geliştirme seviyesi, eksikler ve doğrulama durumu.

Talimat dosyalarını kontrol et: `node scripts/sync-instructions.cjs --check`.
Birinden diğerine kopyala: `node scripts/sync-instructions.cjs --from AGENTS.md` (veya `CLAUDE.md`).
Otomatik eşitlemeyi açık tut: `node scripts/sync-instructions.cjs --watch`. Bu araç geliştirme içindir; oyunu açmak için gerekmez. İzleyici kapalıyken dosyalar otomatik eşitlenmez; modellerin iki dosyayı birlikte güncellemesi kurala bağlanmıştır.

## Hesaplar ve ana sayfa

Ana sayfa ve Supabase Auth eklendi. Hesap işlemleri için `baslat.cmd` dosyasını çalıştır veya `node scripts/serve.cjs` komutunu kullan, ardından http://localhost:3000 adresini aç. Node bu yerel sunucu için gerekir; misafir solo index.html doğrudan açılarak kullanılabilir.

Kayıtta oyuncu adı, e-posta ve en az 8 karakterlik şifre istenir. Beta için e-posta doğrulaması kapalıdır; kayıt sonrasında doğrudan oturum açılır. Hesap akışları internet kullanır. Girişli solo denemeleri profile kaydedilir; rekabetçi liderliğe sayılmaz.

Supabase projesi: Duydum (`binissqzmhxnqlftwlnj`). Dashboard → Authentication → URL Configuration bölümünde Site URL ve Redirect URLs için `http://localhost:3000` kullan. Farklı adres kullanacaksan config.js içindeki authRedirectUrl ve Supabase izinlerini birlikte güncelle. E-posta doğrulaması kullanıcı isteğiyle beta süresince kapalıdır.

`config.js` yalnız herkese açık publishable key içerir; secret/service_role anahtarını istemciye ekleme. SDK sürümü 2.118.0 sabitlenmiştir; assets/vendor içindeki lisans dosyasını koru.

## Profil ve istatistikler

Girişten sonra Profilim menüsünden oyuncu adı ve dört avatar renginden biri seçilir. Oynanan tur, doğru bilinen tur, başarı oranı, en iyi seri, toplam deneme puanı ve son beş sonuç Supabase’den gelir. Bilinen şarkı sayacı şu an benzersiz şarkıları değil doğru bitirilen turları sayar; katalog 10 şarkıdır.

Kayıt hatasında sayfayı kapatmadan yeniden dene. İstatistikleri yenile düğmesi açık sayfadaki bekleyen kendi sonuçlarını da yeniden gönderir. Kalıcı offline kuyruk yoktur. db/schema.sql mevcut uzak şemanın kaynak kopyasıdır; otomatik her açılışta çalıştırılmaz.

## Şarkı kataloğu

catalog.js içinde 10 şarkı, sanatçı, sabit kimlik, yerel ses ve kapak bilgisi vardır. Sıra her döngüde rastgele karıştırılır; bütün şarkılar gelmeden tekrar olmaz. Katalog tükenince solo yeni döngüyle devam eder; son şarkı hemen yeniden çalmaz. Yeni şarkılar kullanıcıyla manuel eklenir; şarkı ekleme ekranı yoktur. Katalog dosyası Supabase song_id izin listesiyle birlikte güncellenir.

Sesler en fazla 16 saniyedir. 9 yeni gerçek kapak ve kaynak kayıtları assets/covers altında; Snap soyut fallback kullanır. Test: `node scripts/test-catalog.cjs`.

## Arkadaşlarla kapalı beta

Şu an yalnız arkadaş modu açık; Solo/Ranked kapalıdır. Giriş yap → Arkadaşlarla oyna → Oda oluştur veya 5 karakterli kodla Katıl. En az2 kişiyle oda sahibi maçı başlatır (üst sınır8). 10 farklı şarkı ve tur başına60sn; herkes bitince erken sonuç ve4sn sonra sonraki tur.10tur sonunda Tekrar oyna aynı odada yeni maç başlatır.

Sahip Odayı kapat ile kodu iptal eder. Sahip ayrılırsa yetki devredilir; son oyuncu çıkınca oda kapanır. Yenilemede aynı sekmede odaya dönüş desteklenir;90sn bağlantısız üyeler temizlenir. Arkadaş maçı solo/ranked geçmişine yazılmaz.

Oda state Supabase sunucusundadır, istemci1,5sn aralıkla güncellenir. db/rooms.sql backend kaynağı, db/rooms-test.sql rollback doğrulama senaryosudur (SQL Editor/araçla geliştirici çalıştırır). Frontend kontrolü: `node scripts/test-rooms.cjs`.

`localhost:3000` yalnız bu bilgisayarda açılır. Arkadaşların kendi cihazlarından girebilmesi için uygulamanın erişilebilir bir adreste sunulması gerekir; henüz dış erişim yayını yapılmadı. Sites kullanılmaz.

## GitHub Pages

Bu arayüz statik HTML/CSS/JS olduğu için GitHub Pages ile uyumludur; oda, hesap ve skor işlemleri Supabase üzerinde çalışır. Yerel Node sunucusu Pages üzerinde gerekmez.

Depo: https://github.com/EReaXe/duydum

Yayınlamak için GitHub → Settings → Pages → Deploy from a branch → main → /(root) seç. Beklenen proje adresi: https://ereaxe.github.io/duydum/ (Pages etkinleştirilip deployment başarılı olduktan sonra kullanılabilir). .nojekyll dosyası eklenmiştir. Assets/script yolları göreli, authRedirectUrl sayfanın taban dizininden hesaplanır.

Localhost oturumu bu adrese taşınmaz; Pages üzerinde tekrar giriş yap. E-posta doğrulaması şimdilik kapalıdır. İleride doğrulama, şifre sıfırlama veya OAuth açılırsa Supabase Authentication → URL Configuration içine bu Pages adresini ve gerektiğinde localhost adresini ekle.

GitHub Pages dosyaları ve depo herkese açık olur; beş haneli oda kodu erişim paylaşımı sağlar, uygulamanın kendisini özel yayına dönüştürmez. İstemcide yalnız publishable key bulunur.

Kontroller: `node scripts/test-auth.cjs`, `node scripts/test-rooms.cjs`, `node scripts/test-catalog.cjs`, `node scripts/sync-instructions.cjs --check`.
