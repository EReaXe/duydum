# Duydum! — ortak proje talimatları

Bu dosya AGENTS.md ve CLAUDE.md için aynıdır. Her iki dosya aynı kuralları ifade eder; biri diğerinden üstün değildir.

## Çalışmaya başlarken ve belge düzeni

- Önce bu dosyayı, PROJECT_STATUS.md ve notes.md dosyalarını oku; ilgili kaynak kodunu kontrol ederek mevcut durumu doğrula.
- Kullanıcının son açık kararı eski belge ve önerilerin önündedir. Çelişki görürsen belgeleri güncelle; önerileri onaylanmış kural gibi uygulama.
- AGENTS.md veya CLAUDE.md değiştiğinde diğerini aynı işlemde, birebir aynı içerikle güncelle. İş bitmeden `node scripts/sync-instructions.cjs --check` çalıştır.
- Tek dosyadan eşitleme: `node scripts/sync-instructions.cjs --from AGENTS.md` veya `--from CLAUDE.md`.
- İsteğe bağlı otomatik izleme: `node scripts/sync-instructions.cjs --watch`. İzleyici yalnız çalışırken otomatik eşitler; iki dosyanın ayrı ayrı değiştiği çelişkilerde üzerine yazmadan durur.
- Yeni fikir ve henüz karara bağlanmamış seçenekleri notes.md içinde tut. Onaylananları bu ortak talimatlara geçir ve notun durumunu güncelle.
- Her anlamlı geliştirmeden sonra PROJECT_STATUS.md içindeki tamamlananlar, eksikler ve doğrulama durumunu güncelle. Test edilmemiş şeyi test edilmiş gösterme.

## Ürün ve teknik sınırlar

- Oyun adı **Duydum!**. Düz metin/dosya kimliğinde `duydum` kullanılabilir. “Bir kesit yeter.” mevcut sloganıdır; marka/alan adı uygunluğu doğrulanmış değildir.
- Proje yerel HTML, CSS ve JavaScript ile geliştirilir. Gerekli ek teknolojiler değerlendirilebilir; gereksiz framework veya runtime bağımlılığı ekleme.
- **Sites kullanma; Sites ile oluşturma, eşitleme veya yayınlama yapma.** Önceki yayın güncel yerel proje değildir.
- Uygulama dosyaları ana klasörde bulunur: index.html, style.css, app.js; varlıklar assets/, yardımcı araçlar scripts/ altında tutulur. Gereksiz dist/yayın arşivi oluşturma.
- Solo altyapısı korunur fakat kapalı beta süresince kullanıcı erişimi kapalıdır; yalnız arkadaş odaları açıktır. Hesap kayıt/giriş işlemleri kullanıcı onayıyla Supabase üzerinden internet kullanır; hesap akışını localhost:3000 üzerinden çalıştır. CDN/harici font ekleme; SDK yerel vendor dosyasıdır.
- Kullanıcı Supabase bağlantısını ve kayıt/girişi onayladı. Duydum projesi ToxArts Studios organizasyonunda oluşturuldu (ref: binissqzmhxnqlftwlnj). Auth ve kişiye özel beta sonuç tablosu bağlıdır; arkadaş odası backend eklendi, ranked altyapısı henüz uygulanmadı. Yalnız publishable key istemciye konur, secret/service_role asla eklenmez. Şifreleri kendin depolama. Görünen ad metadata içindedir, yetki kararında kullanılmaz. Auth SDK sürümü 2.118.0 yerelde sabittir.
- Kullanıcının kaynak dosyalarını koru; ses işlemlerini proje içindeki kopyalarda yap.

## Kesinleşen oyun kuralları

- Şarkı adı **yazılarak** tahmin edilir; çoktan seçmeli değildir. Sanatçı adı zorunlu değildir.
- Büyük/küçük harf, noktalama ve Türkçe karakter farkları normalleştirilir. Küçük yazım hatalarına tolerans istenir; özellikle kısa isimlerde uygulanacak kesin eşik açık karardır.
- Dinleme aşamaları **1 → 2 → 4 → 7 → 11 → 16 saniye**.
- Her aşamada bir tahmin veya **Pas** hakkı vardır. Yanlış tahmin ve Pas oyuncuya özel olarak sonraki aşamayı açar; diğer oyuncuların kesit süresini değiştirmez.
- Yanlış tahminde ayrıca puan düşülmez; sonraki aşamanın kazanılabilir puanı azalır.
- Son aşamada yanlış tahmin/Pas ile haklar biter, tur puanı 0 olur.
- Puan kısa kesitte tanımaya dayanır; yazma hızı veya tur başlangıcından geçen süre esas alınmaz.
- Her tur en fazla **60 saniye**. Çok oyunculuda herkes doğru bildiyse veya haklarını tükettiyse tur erken biter; tek kişinin bitirmesi diğerlerini durdurmaz. Süre dolduğunda bilemeyenler 0 alır.
- Şarkı cevabı çok oyunculuda herkes bitince veya süre dolunca açıklanır; ardından sonraki tura geçilir.
- **Canlı Akış** pas, tahmin ve doğru bilme olaylarını gösterir. Tahmin metinleri gizli kalır.
- Doğru olayında dinlenen kesitin süresi ve kazanılan puan gösterilir: “X, 4 saniyelik kesitte bildi! +700 puan.” Bu süre turda geçen zaman değildir.

## Üç oyun modu

1. **Solo:** Sınırsız ilerleme; şarkı başına en fazla 60 saniye; solo liderlik tablosu hedeflenir. Sıralama hesabı henüz kesinleşmemiştir.
2. **Arkadaşlarla:** Özel oda/oda koduyla kendi aralarında oyun. Maç 10 tur, 10 farklı şarkı; maç sonu toplam puana göre sıralama.
3. **Ranked:** Diğer oyuncularla eşleştirme, rütbe ve rank puanı; 10 turluk maç yapısı. Oyuncu sayısı, rütbe basamakları ve rank hesabı henüz kesinleşmemiştir.

Arkadaş maçları ranked puanını etkilememelidir. Henüz uygulanmayan modları çalışan özellik gibi sunma.

## Ses ve görsel varlıklar

- Diske alınan oyun sesinin gerçek süresi **en fazla 16 saniye** olmalıdır; yalnız oynatıcıda sınırlamak yeterli değildir. Uzun kaynağın başlangıcını koruyarak ilk 16 saniyeye kadar kes.
- Süreyi ve dosya boyutunu işlem sonrası doğrula. MP3 tam kareleri nedeniyle 16 saniyeden biraz kısa çıktı kabul edilir.
- Mevcut Node aracı: `node scripts/prepare-audio.cjs kaynak.mp3 assets/hedef.mp3`. Araç Layer III MP3 içindir; desteklenmeyen biçimi uzantı değiştirerek kabul etme.
- İlk beta şarkısı kullanıcının kendi bestesi **Simitler — Snap**, id snap-beta-001; dosya assets/track-001.mp3. Diğer 9 şarkı catalog.js içinde, sesler assets/audio altında. Tam orijinaller projeye tekrar eklenmemeli.
- Şarkı görselleri ürün kapsamındadır. Gerçek Snap kapağı henüz sağlanmadı; mevcut soyut SVG yedek kapaktır, resmi kapak diye tanıtma.
- İnternetten bulunan kapaklar ileride yerel dosya olarak alınabilir. Oyun sırasında cevap/sanatçı sızdıran kapak veya metin gösterme; sonuçta aç.
- İkon ve fontlar yerel olmalı. Oynat/duraklat simgelerinde font glifi yerine tutarlı CSS/SVG şekilleri kullan.

## Görsel yön ve kullanım

- Kullanıcının mobil referansları esin kaynağıdır: koyu mor zemin, pembe oynat, sarı Pas, yeşil başarı; kalın koyu konturlar, yuvarlatılmış kartlar, sert gölgeler.
- Referansı birebir kopyalama; web ve mobil için özgün responsive düzen kur.
- Masaüstünde oyun ve yan skor/akış alanı; mobilde okunaklı tek sütun. Dar ekranda yatay taşma olmamalı.
- Klavye erişimi, etiketli girişler, görünür odak, yeterli dokunma alanı ve azaltılmış hareket desteği korunsun. Sonuç/yeniden başlat geçişlerinde odak yönetilsin.

## İşbirliği ve doğrulama

- Kullanıcı alt ajanlarla oyun fikri/kuralları, arayüz, görsel varlıklar ve bağımsız denetim çalışması istedi. Uygun görevlerde bu rolleri kullan; eşzamanlılık sınırına göre sıralı çalıştır. Sürekli kapalı sohbet arka planında çalışıldığını iddia etme.
- Ürün danışmanının önerileri kullanıcı onayı olmadan kesinleşmiş karar sayılmaz.
- Değişikliğe uygun kontrol yap. Oyun için doğru/yanlış tahmin, Pas, son aşama, süre, sonuç ve yeniden başlat akışlarını koru.
- Kaynak/benzetim testi ile gerçek tarayıcı, mobil görünüm ve ses testini ayrı raporla.
- Tamamen istemci tarafındaki prototipte cevabın kaynak koddan gizlenebildiğini iddia etme. Sunucu doğrulaması gelecek çok oyunculu/ranked tasarımının parçasıdır.

## Güncel geliştirme önceliği

- Ana sayfa ve Supabase kayıt/giriş çalışıyor; kullanıcı bunu doğruladı. Profil adı/avatar rengi, kişisel beta istatistikleri ve sonuç kaydı eklendi. Günlük görev, paylaşım kartı ve katalog aracı henüz uygulanmadı.
- Auth için scripts/serve.cjs veya baslat.cmd ile http://localhost:3000 kullan. Kullanıcı beta aşamasında e-posta doğrulamasının kapatılmasını istedi (24 Ekim 2026). Panelde Confirm email kapatılıp kaydedildi; canlı Auth settings yanıtı mailer_autoconfirm=true ve disable_signup=false olarak doğrulandı. Yeniden açma kararı kullanıcıya aittir. Gerçek kayıt/giriş/çıkış kullanıcı hesabıyla ayrıca doğrulanmalı.

## Profil ve beta sonuçları

- Profil adı ve avatar rengi Auth metadata içinde yalnız gösterim amaçlı tutulur.
- beta_solo_results özel deneme geçmişidir; rekabetçi/anti-hile doğrulanmış skor değildir ve liderlik tablosuna karıştırılmaz.
- Tur sahibi oturum başlangıcı tamamlandıktan sonra, tur başında sabitlenir. Misafir turu sonradan giriş yapılan hesaba taşınmaz.
- Her tur tek UUID ile yazılır; yeniden denemede aynı UUID kullanılır. Sonuçlar yalnız sahibine SELECT/INSERT açıktır; istemci UPDATE/DELETE yapamaz. Puan veritabanında aşama/sonuçtan hesaplanır.
- played_at tur başında kaydedilir ve yeniden denemede korunur; seri/geçmiş eklenme tarihiyle sıralanmamalıdır. İstemci zamanı beta içindir; ranked için güvenilir sunucu zamanlaması gerekir.
- Kaydedilemeyen sonuçlar açık sayfada yeniden denenebilir; kalıcı çevrimdışı kuyruk henüz yok. Sayfa kapanmadan yeniden deneme mesajı gösterilir.
- Şema kaynağı db/schema.sql; uzakta beta_solo_results ve beta_result_play_order migrationları uygulandı. RLS/advisor ve gerçek tarayıcı kontrollerini değişikliğe göre güncelle.

## Manuel katalog ve tekrar önleme

- Kullanıcı şarkı ekleme aracı istemiyor; şarkıları birlikte manuel ekle. catalog.js her şarkı için sabit id, ad, sanatçı, ses ve kapak yolu tutar; alternatif cevaplar isteğe bağlıdır.
- Mevcut katalog 10 şarkıdır. İlk Snap kimliği eski sonuçlarla uyumlu kalır. Yeni idleri Supabase beta_solo_results allowlist ile birlikte güncelle; Supabase sorumlusu alt ajan bu işleri yürütür.
- Şarkıları yükleme sırasıyla çalma. Fisher–Yates ile karıştırılmış torbadan seç; katalog tükenmeden şarkı tekrarlanmasın. Sınırsız solo yeni döngüde tekrar karıştırılır; son şarkı yeni döngünün ilk şarkısı olamaz. Arkadaş maçında 10 farklı şarkı şarttır.
- Kapak alt ajanı doğru sanatçı/kayıt eşleşmesini araştırıp yerel görsel ekler. Kaynak ve SHA-256 assets/covers/sources.json içinde tutulur. Snap için gerçek kapak henüz yok, fallback kullanılır.
- O turdaki doğru ad, sanatçı ve kapak yalnız tur sonunda açıklanır; yazılı tahmin önerileri genel katalogdaki ad/sanatçıları gösterebilir ve mevcut tur cevabına göre sıralanamaz. Profil geçmişi gerçek song_id üzerinden doğru ad/sanatçıya bağlanır; yeniden deneme o turun şarkı kimliğini korur.
- Arkadaş odaları kapalı beta için uygulanmıştır; dış cihazların erişeceği barındırma ayrıca gerekir, localhost dışarıdan erişilebilir değildir.

## Tahmin önerileri

- Yazdıkça tüm katalogdan ad/sanatçı eşleşmesine göre en fazla 3 öneri sun. Eşleşme azsa sahte/doldurma önerisi ekleme. Türkçe karakter farkları normalleştirilir.
- Öneriye tıklama veya ok tuşları + Enter yalnız şarkı adını girişe doldurur; hakkı harcamaz ve otomatik tahmin göndermez. Göndermek için Tahmin et veya liste seçimi kapandıktan sonra Enter kullanılır. Escape/odak kaybı/Pas/tur sonu listeyi kapatır.

## Kapalı beta — arkadaş odaları

- Kullanıcının son kararı: yalnız Arkadaşlarla oyna açık; Solo ve Ranked kapalı. Solo butonu disabled ve click guard korunur. Eski solo geçmişi profilde okunabilir.
- Hesapla Oda oluştur / 5 karakterli rastgele harf-rakam koduyla Katıl. Kod büyük/küçük harfe duyarsız; karışan karakterler üretilmez. En az2, en fazla8 oyuncu (uygulama varsayımı).
- Her maç10 farklı şarkı, en fazla60sn/tur; herkes bitince erken sonuç,4sn sonuç gösterimi. Oyuncuya özel kesit/puan ve gizli tahmin metni kuralları aynen geçerli.
- 10tur sonunda oda ve kod kapanmaz. Oda sahibi Tekrar oyna ile aynı odada sıfır puanlı yeni10tur açabilir; tekrar sayısına sınır yok.
- Oda sahibi Odayı kapat derse veya son üye ayrılırsa oda silinir/kod geçersizleşir. Eski kodun başka odaya atanmasını önlemek için yalnız kod rezerv kaydı tutulur. Sahip ayrılırsa kalan oyuncuya sahiplik devredilir.
- Aktif maça yeni oyuncu girmez; lobi/maçsonunda katılım açık. Tarayıcı yenilemede aynı sekmenin sessionStorage kodu ve hesapla geri yükleme var.90sn bağlantısız üyeler temizlenir; aktif istekler24saatlik hareketsizlik süresini yeniler. Tümü stale odanın kodu katılımda geçersizleşir.
- Backend Supabase sorumlusu alt ajanın kapsamındadır. db/rooms.sql kaynak; public.duydum_room tek istemci RPC; özel duydum_private şeması doğrudan kapalıdır. auth.uid/üyelik/host doğrulaması gerekir. Metadata yalnız ad/avatardır.
- guess/pass payload {request_id,match_id,round,stage,guess?}; sunucu row lock + UUID idempotency + beklenen aşama kontrolü yapar. Eski aşama STAGE_CHANGED; duplicate id önce kontrol edilir. Tahmin/doğru/puan/süre sunucuda hesaplanır.
- rooms.js1,5sn polling, sunucu zamanı ofsetli sayaç; bağlantı sorunu/hesap değişimi yarışları korunur. Poll tahmin alanını silmemeli veya odağını düşürmemeli. Room sonuçları solo beta tablosuna veya ranka yazılmaz; maç skoru oda ömründedir.
- Cevap/kapağı UI’da sonuçtan önce açma. Yerel catalog.js ve anlamlı song_id teknik olarak incelenebilir; bu sürümü ranked için hileye dayanıklı diye tanıtma.
- Sites kullanılmaz. Uzak arkadaşların gerçek cihaz testi için aynı dosyaların ulaşılabilir adreste barındırılması ayrı iştir.
