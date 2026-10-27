## Yayın hazırlığı ve güvenlik — 27 Ekim 2026

Kullanıcı iki botun kalıcı temizliğini onayladı;yalnız buikiAuthhesabı ve ilgili2testmaçı silindi,kalanbot0. Eski GitHub deposu EReaXe/islem olarak yeniden adlandırıldı;yerelorigin güncellendi. Pages kaynağıGitHubActions seçildi. Yeni matematikdeploymentsonucu henüz doğrulanmadı.

Güvenlik:backend yetki/grant/RLS/definer/UUID/rate/payload/state testleri ve bağımsızfrontenddenetimi geçti. Kuyruk→Solo çiftoturumyarışı kapatıldı;hesapAPI/başlangıçbütçesi ve4KBobjectguard eklendi;emeklimüzikyazıları kapalı. CSP,SDK SRI,SHA-sabitActions ve10dosyalık yayınizinlistesi eklendi. Ayrıntı SECURITY.md. Kalan bot/Sybil/anontrafik veparolakoruma sınırlarıaçıkbetasınırıolarakbelirtildi.

## Liderlik, genel profiller ve gerçek bot testi — 27 Ekim 2026

Liderlik satırlarına avatar,Ranked rütbe rozeti,Elo ve profil açma eklendi. Aylık seçimin iki sekmeyi dolu göstermesi CSS .active etkisinden kaynaklanıyordu;yalnız aria-pressed=true kullanılarak düzeltildi. Genel profilde ad/avatar,Elo ve toplam Solo/Ranked sayıları var;e-posta/özel geçmiş yok. Backend migration math_public_player_profiles_and_leaderboard_badges canlıda;anonim ve girişli genel profil desteklenir.

Doğrulama:Node dönem/profil eskiyanıt yarışları,kapatma sonrası geçyanıt,avatar whitelist,güvenli metin,tümrütbe eşikleri ve oyun/authregresyonları geçti. SQL8alan allowlist,anonim/girişli profil,gizlilik ve okuma yan etkisizliği geçti. Chrome gerçek9000puanlı kullanıcı satırı/avatar/Hesapçı1000veprofilistatistikleri doğrulandı;buay seçili iken buhafta transparent,buay dolgulu. Mobil390px/content375px,liderlik ve profil taşmasız görselkontrol edildi.

Gerçek Ranked:iki geçici Auth hesabı standartsignup/passwordlogin ile açıldı. Normaloyunculara karışmamak için yalnız botların Elo değerleri10000ile izole edildi. İki ayrıHTTP istemci gerçekmaç oynadı;aynı soru dizisi,+5yalnızkendi saatinde,yanlış3sn,UUIDyenidenistekteçiftbonusolmaması doğrulandı. Gerçek95snsaati biten BotB kaybetti;BotA+16/BotB−16Elo. Tamamlanmışmaçpoll ikinciEloyazmadı. İkincimaçta BotAayrıldı,BotBkazandı. Ağraporu .local-tests/ranked-live-report.json success=true. Normal kullanıcı hesabınınpuanına/Elo'sunadokunulmadı.

BotA ayrı127.0.0.1Chromeorigininde giriş yaptı;gerçekRanked oyunekranı,ikisayaç,botBdoğrusayısı ve tarayıcıdan6×3−10=8cevabıyla4doğru/+5snbildirimigörüldü.390pxbotmaçı content375px,yataytaşmayok. Tamsonuç/EloHTTP+SQLiledoğrulandı;ikifizikselcihaz testi yapılmadı. Başarısızilkcanlıtestin nedeni testscriptindeB'nin2.sorusunuA'nın3.sorusuyla karşılaştırmasıydı;ürünhatasıdeğildi,düzeltildi ve testbaştanbaşarılıtamamlandı.

Testhesaplarıve2maçkaydı henüzduruyor:kalıcıtemizlemeotomatikonayincelemesince,kullanıcınınsilmeaçıkonayıolmadığıgerekçesiyle reddedildi. Silmekiçin kullanıcıonayıgerekiyor. Geçiciparoladosyası yereldensilindi;.local-tests/ gitignorealtında. BotlarSolotablosunapuaneklemedi;maçlarbitmişvekuyrukboş.

Yeni arayüz yerelde,backendcanlıda. GitHub/Pagesyayınıyapılmadı. Önceki 'gerçekikihesapdenenmedi' kayıtları bu yenitesttenönceki tarihselkanıtlardır.


## Ranked kişisel saat düellosu — 27 Ekim 2026

Kullanıcı Ranked için heroyuncu90sn,doğruya kendi saatine+5sn,sınırsızsoru ve önce saati bitenin kaybetmesi kuralını istedi. Yeni maçlarda eski10soru/puanla kazanan sistemi yerini bu kurala bırakır. Aynı sorudizisinde bağımsız ilerleme,ortak3snbaşlangıç,yanlış3sn ve RankedPas kapalı uygulama seçimleridir. Elo maç sonucuna göre kalır; Solo bağımsızdır.

Aşağıdaki eski Ranked10soru kayıtları tarihsel sürüme aittir.

# İşlem! — proje durumu

Son güncelleme: 27 Ekim 2026. İşlem! geçici çalışma adıdır.

## Mevcut seviye

Müzik arayüzü tamamen matematik yarışına dönüştürüldü. Yeni ana sayfa, Solo/Ranked, haftalık/aylık liderlik, rütbeler, soru/sonuç ve profil ekranları hazır. Eski hesap entegrasyonu korunur; eski müzik kodu/varlıkları ve sonuç verileri silinmedi, aktif sayfadan yüklenmez.

Güncel tempo: Yeni Solo koşuları90 saniyeyle başlar; doğruya+5 saniye. Aşağıdaki60 saniyelik test kayıtları önceki ayara aittir.

## Güncelleme — sınırsız Solo koşusu

Kullanıcı önceki Solo sürümünün çalıştığını doğruladı. Solo artık60saniye başlangıç,sınırsız soru ve her doğruya mevcut sayaç üstüne+5saniye/+100puan verir. Doğru ve geçmede anında yeni soru; yanlış3sn aynı soruda bekletir,süre akmaya devam eder. Geçmede bonus yok,süre üst sınırı yok. Soru kalıpları6dan18e çıkarıldı;misafir torbası18çeşidi karışık tüketir. Ranked10soru20sn ve Elo kuralları korunur.

Yeni Supabase Solo format_version2; eski kayıtlar/aktif version1 oturumlar veri silmeden korunur. Sunucu yalnız mevcut soruyu tutar; UUID tekrarları sonraki soruda dahi çift süre/puan eklemez.

Node doğrulaması:18.000 bağımsız aritmetik örneği,60→50→55,40+cevap sınırsız devam,skip0bonus,cooldown,son milisaniye/timeout,UI15doğru125sn,inputtemizleme ve eski poll/hesapyarışları geçti. SQL25doğru,UUID tekrarları,50→55,skip,timeout ve tamRanked/Elo regresyonu geçti. GerçekChrome misafir60sn başlangıç,+5sn sonrası61sn,12.soruda40sn iledevam ve yeni yüzde/zaman soruları görüldü. GerçekChrome süre bitiminde100puan/1doğru/11tamamlanan soru sonucu,ardından yeniden başlatmada60sn/SORU1 doğrulandı. Yeni390pxmobil görünüm content375px,yataytaşma yok;tarayıcıerrorlog boş. Yeniformat2girişli koşu SQL ile doğrulandı,gerçek kullanıcı hesabıyla tarayıcı koşusu ayrıca yapılmadı.

Aşağıdaki ilk sürüm doğrulama kayıtları tarihseldir;10soruluk Solo yeni kural değildir.

## İlk sürüm oynanışı (tarihsel)

- 10 soru; işlem önceliği, eksik sayı, kısa sözel işlem, örüntü ve parantez. Tam sayı cevap.
- Soru20sn, cevap gösterimi2sn, yanlış cevapta3sn bekleme. Solo soru geçme var. İlk Ranked sorusunda3sn bağlantı payı var.
- Misafir Solo yerel pratik: son30 koşu tarayıcıda saklanır, canlı tabloya yazılmaz.
- Girişli Solo: sunucu soru/süre/cevap/puan doğrular; tamamlanan koşular haftalık/aylık tabloda toplanır. Yarım bırakılanlar tabloya girmez. Solo Elo değiştirmez.
- Ranked1v1: benzer Elo kuyruğu, bekledikçe genişleyen aralık, aynı10 soru, ilk doğru100/ikinci60. Kazanan maç puanıyla belirlenir; Elo1000/K32, eşit Elo'da +16/−16. Beraberlik eşit Elo'da0.
- Hükmen mağlubiyet ve45sn bağlantı toleransı; iki taraf da stale ise Elo değişmeden kapanış. İkinci gerçek oyuncu gerekir; bot rakip veya sahte sıralama yok.
- Başlangıç rütbe eşikleri Çırak/Hesapçı/Çözücü/Stratejist/Üstat/Dâhi. Rakamlar ilk sürüm varsayımlarıdır.

## Backend

Supabase binissqzmhxnqlftwlnj içinde ayrı math_private şeması ve public.math_game RPC. Kaynak db/math.sql, rollback test db/math-test.sql. Mevcut eski tablolar değişmedi. Özel tablolar RLS ve doğrudan erişim iptaliyle korunur; RPC hesap/üyelik doğrular. Cevap yalnız sonuçta açılır. UUID tekrar denemesi çift puanı engeller; maç kilidi ve settled Elo tekrarını engeller.

Uzak migrationlar backend alt ajanı tarafından uygulandı. Advisor yeni matematik güvenlik uyarısı bildirmedi; özel tablolarda politikasız RLS INFO bilinçli deny-all. Eski oda SECURITY DEFINER ve leaked password protection uyarıları değişmedi.

## Doğrulama

- scripts/test-math.cjs:12.000 sorunun bağımsız aritmetik doğrulaması; tam sayı parser;2999/3000ms bekleme; tam süre sınırı; geç/cevap/10tur; çift puan engeli.
- Gerçek app.js VM akışı:misafir10tur,sonuç/yeniden başlat,yerel geçmiş,misafir Ranked giriş şartı,canlı puan yazmama. Gecikmiş poll cevabının doğru cevabı veya hesap değişimini geri almaması.
- scripts/test-auth.cjs:Pages/localhost dönüşü ve çıkış sonrası gecikmiş kullanıcı yanıtı regresyonu geçti.
- SQL iki sentetik kullanıcı rollback:tam Solo1000,Ranked10tur100/60,Elo1016/984,tek settlement,üye/anon erişim,cevap gizliliği,cooldown,UUID,skip,cancel,yarım Solo dışlama,timeout,iki taraf stale. Kalıcı test kullanıcısı/verisi bırakılmadı.
- Gerçek Chrome localhost:10soruluk misafir koşusu3doğru300puan;yanlış3sn bekleme ve yeniden doğru cevap;skip,sonuç ve ana sayfa;mobil yeniden başlat;Ranked giriş dialogu;canlı anonim liderlik boş yanıtı doğrulandı. Tarayıcı error log boş.
- Mobil390px görünüm:content375px(scrollbar payı),yatay taşma yok;ana sayfa ve oyun görsel incelendi. Gerçek telefon klavyesi denenmedi.
- DOM69benzersizID ve auth hedefleri;JS syntax,talimat eşitliği,diff whitespace kontrolü geçti.

## Kalan doğrulamalar ve sınırlar

- İki gerçek hesap/iki cihazla eşzamanlı Ranked tarayıcı maçı ve yeni matematik profilinin kullanıcı hesabıyla canlı kontrolü henüz yapılmadı. SQL/VM bunun yerine geçtiği iddia edilmez.
- Bot/otomatik çözüm önleme,yük testi,üretim izleme ve ayrıntılı kötüye kullanım sınırları yok. İki stale oyuncuda maç sonucu başlığı skora göre görünebilir,gerçek Elo değişimi0 kalır.
- Başlangıç Elo,rütbe eşikleri,puan dengesi ve solo dönem hesabı oynanabilir ilk sürüm ayarlarıdır;değiştirilebilir.
- Yerel sunucu localhost:3000 hazır. GitHub'a yeni matematik sürümü gönderilmedi;Pages deployment yapılmadı/doğrulanmadı. Repo adı hâlâ duydum.

## Dosyalar

index.html/style.css arayüz;app.js denetim;math-engine.js misafir motoru;auth.js/config.js/vendor hesap;db/math.sql backend;scripts/test-math.cjs kontroller. README çalıştırma ve Pages yönergesi. Eski müzik testleri yeni sürümün kanıtı değildir.

## Solo tempo ayarı — 27 Ekim 2026

Kullanıcı daha rahat tempo için en uygun ayarın seçilmesini onayladı. Yeni Solo başlangıcı90saniye;doğru+5saniye/+100puan,yanlış3sn,sorulimitsiz kuralı korunur. Önceki60saniye kayıtları tarihseldir. Yeni süre yalnız yeni koşularda başlar;aktif koşu sıfırlanmaz. Node motor/UI kontrolleri90→80→85 örneğiyle güncellendi.

90sn doğrulama: yerel motor/UI testleri geçti. Canlı Supabase math_solo_initial_90_seconds uygulandı; rollbacktesti90başlangıç,80→85bonus,aktif/eskikoşu deadlinekoruması ve Ranked/Elo regresyonunu geçti. Bu küçük süre değişikliği için yeni gerçek tarayıcı testi yapılmadı.

### Ranked saat sistemi doğrulaması

Canlı Supabase math_ranked_personal_clocks_v3 ve math_ranked_settlement_before_restart uygulandı. Yeni Ranked format3,oyuncuyaözel deadline/question_index ve ortak starts_at kullanır. Aynısorudizisi private match_questions tablosunda tutulur;başlangıçtanönce soru/cevap kapalıdır.

SQL rollback:25doğru ile sınırsızilerleme,ortak90snbaşlangıç,kişiyeözel+5sn,rakibindeğişmemesi,aynıindexaynısoru,yanlış3sn,UUIDtekrarları,eskitur,geçcevap,puanıyüksekolanınsüreyenilgisi,ikigecikmişdeadlinekarşılaştırması,eşitdeadlineberaberlik,Eloyenidenişlememe ve timeoutsonrası doğrudanqueue/solo_start ileElokaçırmaengeli geçti. Solo90snveeskioturumkorumaregresyonları geçti. Testverileri rollback.

NodeVM:ortak3sngerisayım,soruhenüzgelmediysegönderimengeli,80→85yalnızkendisüresi,rakipilerlemesindegirdininkorunması,10üstüsoru,sıfırdayerelpuanlakazananüretmeme,sunucukararıveElo geçti. 18.000aritmetikörneğiveSolo/authregresyonları geçti. GerçekChrome anasayfakuralları doğrulandı;ikigerçekhesaplabutarayıcıdamaçhenüzdenenmedi. Yeniiki-saatoyunekranımobildesunucumaçıylagörseltestedilmedi.

Bağımsızdenetimdebulunan timeoutyenibaşlatmaElokaçırması düzeltildi. Yeni frontend yerelde;GitHub/Pagesyayınıyapılmadı.
