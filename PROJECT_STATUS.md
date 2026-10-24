# Duydum! — proje durumu

Son doğrulama: 24 Ekim 2026. Bu belge projenin seviyesini kaydeder; kullanıcının kişisel teknik seviyesini varsaymaz.

## Mevcut seviye

Ana sayfa + 10 şarkılı solo beta + çalışan Supabase Auth + kişisel profil ve kalıcı beta sonuçları. Kullanıcı kayıt/girişin çalıştığını doğruladı. Arkadaş odası backend ve istemcisi eklendi; dış adres ve gerçek cihazlarla kapalı beta denemesi sıradaki doğrulamadır.

## Çalışan özellikler

- Duydum! mor/pembe/sarı/yeşil responsive arayüz, yerel SVG marka ve soyut yedek kapak.
- E-posta/şifre kayıt-giriş; SDK oturum yenileme/kalıcılığı ve bu tarayıcıdan çıkış. E-posta doğrulaması kullanıcı isteğiyle kapalı; canlı settings mailer_autoconfirm=true.
- Profilim penceresinde görünen ad ve dört avatar rengi düzenlenir (Auth metadata, yetki amacıyla kullanılmaz).
- Yazılı şarkı tahmini, normalleştirme, basit yazım toleransı; 1/2/4/7/11/16 saniye; Pas/yanlış ilerlemesi; 60 saniye; sonuç ve tekrar.
- Girişli tur sonuçları Supabase beta_solo_results tablosuna kaydolur. Profilde oynanan tur, doğru tur, başarı oranı, en iyi seri, toplam deneme puanı ve son beş sonuç.
- Tur sahibi başta sabit; misafir sonuçları hesaba yazılmaz. Tek UUID tekrar denemeyi idempotent yapar. played_at yeniden denemede korunur; seri gerçek tur sırasına dayanır.
- RLS yalnız kendi sonuçlarını SELECT/INSERT ettirir; istemciden UPDATE/DELETE yok. Puan veritabanında hesaplanır. RPC get_beta_stats security invoker kullanır.

## Veri ve çalıştırma

- Supabase: Duydum, binissqzmhxnqlftwlnj, ToxArts Studios, eu-central-1.
- Schema: db/schema.sql; uzak migrationlar beta_solo_results ve beta_result_play_order.
- Node ile scripts/serve.cjs veya baslat.cmd → http://localhost:3000. Hesap/profil/kayıt internet gerektirir. Misafir solo index.html doğrudan açılarak çevrimdışı çalışır.
- SDK 2.118.0 yerel assets/vendor içindedir; manifest SHA-256 kaydı var. İstemcide yalnız publishable key var.
- İlk şarkı: Simitler — Snap, assets/track-001.mp3; 255.790 bayt, 15,98694 saniye (612 MP3 frame). Orijinal kayıt korunur. scripts/prepare-audio.cjs en fazla 16 saniyelik MP3 hazırlar.
- Oyun içi oturum puanı yenilemede sıfırlanır; başarılı kaydedilen girişli beta sonuçları kalıcıdır. Başarısız kayıt kuyruğu yalnız sayfa belleğinde; kapatmadan retry gerekir.

## Tamamlanmayanlar / sınırlar

- Katalog 10 şarkıya genişletildi; arkadaşlarla 10 turluk maç altyapısı henüz yok.
- Arkadaş odası eklendi; gerçek iki tarayıcı/iki hesapla maç testi ve dış erişimli barındırma henüz yapılmadı.
- Ranked eşleştirme/rütbe/anti-hile; liderlik tablosu ve solo sıralama formülü.
- Gerçek Snap kapağı; mevcut görsel soyut yedektir.
- Günlük görev, paylaşım kartı ve kalıcı offline kayıt kuyruğu. Katalog hazırlama ekranı kullanıcı isteğiyle kapsam dışında.
- Yazım toleransı kısa isimlerde fazla geniş olabilir; notes.md içinde açık karar.
- Beta sonuçlarının kazanma/aşama bilgisi istemciden gelir, rekabet için güvenilir skor değildir. played_at istemci zamanıdır. Bilinen şarkı sayacı benzersiz eser değil doğru tur sayar.
- Önceki Sites yayını güncel yerel projenin parçası değildir; silindiği doğrulanmadı. Sites tekrar kullanılmaz.

## Doğrulama kanıtı

- JS sözdizimi, DOM ID/yerel asset kontrolleri; AGENTS/CLAUDE eşitlik kontrolü geçti.
- Oyun ve auth akışları Node benzetimleriyle önceki aşamada kontrol edildi.
- Canlı Auth settings ve beklenen invalid_credentials yanıtı; kullanıcı gerçek kayıt/girişi doğruladı.
- Gerçek tarayıcı: misafir/ana sayfa/solo sonuç; girişli gerçek tur → “hesabına kaydedildi” → sayfa yenileme → profil 1 tur, 1 doğru, %100, seri 1, 1000 puan doğrulandı.
- Kullanıcının adı değiştirilmeden profil kaydetme test edildi; profil güncellemesinden sonra istatistikler korundu. Test amaçlı 1 gerçek beta turu hesapta bulunur.
- SQL rollback testleri: owner insert/read, diğer hesap okuma/yazma engeli, anonim RPC engeli, generated points, update engeli, duplicate UUID engeli, sonradan retry ile tur sırası/seri koruması. Test SQL verileri kalıcı bırakılmadı.
- Bağımsız denetim üç race/retry sorunu buldu; auth.ready bekleme, played_at ve hesabına dönünce retry kontrolü düzeltildi.
- Profil mobil 390 px kontrolü: sayfa/content 375 px, dialog 339 px, yatay taşma yok. Gerçek telefon klavyesi test edilmedi; kesit ses zamanlaması milisaniye düzeyinde ölçülmedi.
- Supabase security advisor tabloda RLS sorunu bildirmedi. Mevcut proje uyarısı: leaked password protection kapalı; plan/uygunluk değerlendirilmedi, otomatik ayar değişmedi. Kaynak: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Dosya haritası

index.html / style.css: arayüz; app.js: oyun; auth.js: hesap ve olay arayüzü; profile.js: profil, kayıt ve istatistik; config.js: public ayarlar; db/schema.sql: şema kaynağı; scripts/: bakım araçları; assets/: yerel varlıklar.

AGENTS.md ve CLAUDE.md eş kurallar; notes.md fikir/açık karar; README.md çalıştırma. Sonraki adımı kullanıcıyla seç: katalog büyütme veya arkadaş odası altyapısı. Yeni model kendiliğinden ranked başlatmamalı.

## Güncelleme — 10 şarkılık katalog

Kullanıcının verdiği 9 MP3 eklendi. catalog.js: Snap; TRALALA; Günah Benim; Zamansızdık; Şarkılar Sokaklara Ait; Toz Pembe; RÜYA; CRUSH!; Hileli; Karambol. Her kayıtta şarkı adı/sanatçı/ses/kapak var. Tüm sesler 15,98694 sn ve 255.790 bayt; 10 ses toplam 2.557.900 bayt. Yeni 9 kaynak 7.296.706 bayttan 2.302.110 bayta indi. Orijinaller değiştirilmedi. assets/audio/preparation.json işlem raporu.

9 doğru kayıt kapağı Apple Music/iTunes metadata ile eşleştirilip 400×400 JPG olarak yerel indirildi; toplam 503.605 bayt. Kaynaklar assets/covers/sources.json. Snap kullanıcı bestesi için gerçek kapak yok, soyut fallback. Kapaklar yalnız sonuçta açılır.

Fisher–Yates torba seçimi her katalog döngüsünü rastgele ve tekrarsız yapar. Sınırsız solo döngüler devam eder; döngü sınırında art arda aynı şarkı engellenir. Henüz oda maçı yoktur. Profil kayıtları songId üzerinden gerçek şarkıya bağlanır. Supabase sorumlusu expand_beta_catalog_allowlist migrationını uyguladı; db/schema.sql güncel ve eski kayıtlar korunur.

Doğrulama: scripts/test-catalog.cjs 100 döngü, tüm 10 ses MP3 frame/süre, tüm ad/sanatçı/karakter kabulü ve 20 uygulama turu/sonuç/kimlik/Pas testlerini geçti. Bağımsız ajan 30.000 seçim ve 30 tur inceledi, engelleyici hata bulmadı. Supabase rollback testleri 10 geçerli ID ve geçersiz ID reddi, puan, UUID, played_at, RLS/anon kontrollerini geçti. Yeni RLS uyarısı yok.

Gerçek tarayıcıda iki Pas ile bitirilen test turu kaydedildi (Snap ve Günah Benim, ikisi de 0 puan). Günah Benim kapağı 400px olarak yüklendi, hata günlüğü boş. Bunlar kullanıcının beta hesabındaki test geçmişine eklendi. 10 parçanın her biri tarayıcıda tek tek dinlenmedi; frame yapısı ve süreler doğrulandı.

Sonraki hedef: arkadaş odası/lobi ve 10 turluk kapalı beta. Şarkı ekleme UI aracı yapılmayacak; yeni dosyalar kullanıcıyla manuel eklenecek.

## Tahmin otomatik tamamlama

Tahmin girişine erişilebilir combobox/listbox eklendi. Genel katalogdan ad/sanatçıya göre en fazla 3 öneri; Türkçe karakter normalleştirme; click ve ok/Enter ile yalnız alana ekleme. Escape/blur/Pas/tur bitişi listeyi kapatır. Kapak ve doğru cevap önerilere özel ipucu sağlamaz. Tarayıcıda manifest→3 öneri, tıklama, sarkilar→Şarkılar Sokaklara Ait, ArrowDown/Enter ve hakkın tüketilmemesi doğrulandı; test turu bitirilmeden sayfa yenilendi, yeni sonuç kaydı oluşturulmadı. Katalog/regresyon testleri geçti.

## Üst menü ve ikon düzeltmeleri — 24 Ekim 2026

Kullanıcının profil adı, metin ikonlar ve Ana sayfa dönüşü geri bildirimleri uygulandı. Üstte avatar + okunaklı ad + Profilim rozeti; modlarda tutarlı inline SVG oynat/grup/kupa ve açık modda ok/kapalı modda kilit. Ana sayfaya dön ayrı 44px düğme. Bazı eylem okları da SVG ile değişti. Auth isim güncelleme id/data sözleşmesi korundu. Gerçek tarayıcıda profil açılışı ve geri dönüş kontrol edildi; mobil viewport 375px içerik375px, isim görünür ve taşma yok. Katalog/regresyon testi geçti; test sırasında tur başlatılmadığından sonuç kaydı eklenmedi.

## Güncelleme — yalnız arkadaşlarla kapalı beta

Oda Oluştur/Katıl,5 karakterli rastgele kod ve lobi eklendi. Solo ve Ranked erişimi kapalı; mevcut solo kodu/istatistikleri korunur. Hesap şart;2–8 oyuncu. Kod oda boyunca geçerli;10tur sonunda oda kapanmaz. Host Tekrar oyna ile yeni maç başlatır. Host kapanışta/son ayrılmada kod geçersiz; rezerv/tombstone yeniden kullanımını engeller. Host ayrılınca devir,90sn stale üyelik temizliği ve24saat idle TTL var; aktif odada TTL yenilenir.

rooms.js Supabase public.duydum_room RPC ile1,5sn polling yapar. Sunucu10farklı şarkı,60sn limit,erken bitiş,4sn sonuç ve10tur finali yönetir. guess/pass stage ve requestUUID ile korunur; score ve normalizasyon sunucudadır. Livefeed tahmin metnini göstermez. Kendi bitiren oyuncu diğerlerini bekler, kapak yalnız ortak sonuçta açılır. Arkadaş skoru oda ömründe kalır, solo kayıtlarına karışmaz.

Remote migrationlar: private_friend_rooms; friend_rooms_idle_ttl_and_variable_scope; friend_room_expected_stage_guard. db/rooms.sql kaynağı; db/rooms-test.sql rollbacktesti. Özel şema doğrudan erişime kapalı, tek authenticated definer RPC auth.uid/üyelik/host kontrolü yapar. Advisor definer kullanımını ve bilinçli deny-all private RLS politikalarını bildiriyor; bunlar incelendi, sahte policyyle gizlenmedi. Önceki leakedpassword uyarısı değişmedi.

Doğrulama:
- Supabase rollbacktesti2 kullanıcıyla10turu tamamladı;tekrarsız deck,tahmin gizliliği,kendi aşaması,idempotency,eski aşama reddi,puan,60sn,final→replay aynıcode/yeni match,host devri,kapasite,anon/member/host kısıtları,stale oda ve kapalı kod kontrolleri geçti. Sentetik kullanıcı ve test verileri rollback,kalıcı bırakılmadı.
- scripts/test-rooms.cjs: solo kapalı,oluştur/lobi/2kişi start,Pas,açılmayan erken cevap,solo yazımı olmaması,sonuç,lobi/maça dön,poll veclose;hesap değişiminden sonra eskiRPCnin odayı açmaması geçti.
- Katalog20tur/100döngü regresyonu ve DOM/JS kontrolleri geçti.
- Gerçek tarayıcıda5haneli oda oluşturma,yenilemeyle dönüş,bir kişiyle start engeli,hostclose veeskiWRWKP koduyla katılım reddi doğrulandı. Sonrasında kullanıcı hesabında örnek bir lobi açıldı (test kodu belgeye alınmaz). Mobil375px içerik375px,yatay taşmayok;browsererrorlog boş.
- İki ayrı gerçek tarayıcı/hesapla sesli maç henüz denenmedi;sunucutesti ve istemcibenzetimi bunun yerine geçtiği iddia edilmez. Yerel song_id/katalog DevTools ile incelenebilir;ranked düzeyinde cevap gizliliği garantisi yok.

Dış erişim:localhost yalnız cihaz içi. Arkadaş daveti için Sites dışında barındırma/erişilebilir URL hâlâ kurulmalı. Oyun sesleri yerel asset;Supabase bağlantısı tek başına HTML/MP3 dosyalarını başka cihazlara sunmaz.

## GitHub yükleme ve Pages hazırlığı — 24 Ekim 2026

Solo kapalı kartının oku kilit SVG ile düzeltildi. Son bağımsız denetim auth başlangıcındaki geç getUser yanıtının çıkış sonrası eski kullanıcıyı yeniden göstermesi yarışını buldu; accountRevision guard ile düzeltildi ve scripts/test-auth.cjs ile tekrar üretim/regresyon testi geçti. Auth dönüşü artık sayfanın taban dizininden türetilir; /duydum/ ve localhost base testleri geçti.

GitHub Pages mimari olarak uyumlu: statik arayüz/yerel sesler Pages, backend Supabase. Supabase ajanı Pages Origin ile Auth GET ve oda RPC preflight CORS yanıtlarını canlı doğruladı. .nojekyll eklendi. Henüz Pages üzerinde deployment ve iki ayrı cihaz maçı yapılmadı. Kullanıcı EReaXe/duydum deposuna yüklemeyi istedi; Pages etkinleştirme bu hazırlıkla ayrı tutulur. Gizli credential yok; config.js public publishable key içerir.

GitHub yüklemesi doğrulandı: https://github.com/EReaXe/duydum, main ilk commit06375c2. Remote config.js içeriği GitHub connector üzerinden okundu. Eski Sites/uzun ses içeren yerel prototip geçmişi local-prototype-archive dalında yalnız yerelde korundu; GitHub’a temiz parentless ilk snapshot gönderildi. main origin/main izliyor. Pages deployment henüz etkinleştirilmedi. Kilit görseli gerçek tarayıcıda doğrulandı; tüm üç test scripti ve talimat eşitliği geçti.
