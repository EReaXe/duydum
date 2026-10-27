
## Ranked kişisel saat düellosu — 27 Ekim 2026

Kullanıcı Ranked için heroyuncu90sn,doğruya kendi saatine+5sn,sınırsızsoru ve önce saati bitenin kaybetmesi kuralını istedi. Yeni maçlarda eski10soru/puanla kazanan sistemi yerini bu kurala bırakır. Aynı sorudizisinde bağımsız ilerleme,ortak3snbaşlangıç,yanlış3sn ve RankedPas kapalı uygulama seçimleridir. Elo maç sonucuna göre kalır; Solo bağımsızdır.

Aşağıdaki eski Ranked10soru kayıtları tarihsel sürüme aittir.

## Ranked — Elo kararı (27 Ekim 2026)

- Kullanıcı Ranked için Elo sistemi istedi. Ranked derecesi maç sonucu ve rakibin Elo değerine göre değişecek; soru puanları doğrudan Elo olarak eklenmeyecek.
- Solo oyunlar yalnız solo liderlik puanına etki eder; Ranked Elo, rütbe ve eşleştirme seviyesini değiştirmez.
- Başlangıç Elo, K katsayısı, rütbe eşikleri, yerleştirme maçları, beraberlik ve ayrılma kuralları henüz kesinleşmedi. Ranked oyuncu sayısı da açık; 1'e 1 ajan önerisidir.

## Matematik yarışı — kullanıcı kararı ve açık tasarım

27 Ekim 2026: Hızlı işlem, kolay fakat düşündüren sorular, Solo dönemsel liderlik ve Ranked yarış kullanıcı tarafından seçildi. Ranked doğru cevap sırası soru puanını belirleyecek; maç sonucu rank ilerlemesini etkileyecek. Haftalık/aylık dönem, oyuncu sayısı, 10 soruluk maç örneği ve kesin puan/rank hesabı açık. Yeni ürün için arkadaş modu kararı henüz verilmedi.

# Yeni ürün yönü — 27 Ekim 2026

- [Kullanıcı / onaylandı] Müzik yerine matematik soruları üzerine oyun; GitHub Pages yayını; adım adım ortak geliştirme. Yalnız HTML/CSS/JS kısıtı kaldırıldı.
- [Açık] Hedef kitle, zorluk ve konular, yazılı/şıklı cevap, süre/puan, solo/arkadaş önceliği, isim ve görsel yön.
- [Ajan / öneri] Önce kısa solo prototiple temel oyun döngüsünü doğrula, ardından arkadaş yarışını uyarla. Bu henüz kullanıcı kararı değildir.
- [Koruma] Hazırlık aşamasında eski varlıklar ve uzak veriler silinmedi.

Aşağıdaki notlar eski müzik sürümünün tarihsel kayıtlarıdır.

---

# Duydum! — fikir ve karar notları

Son derleme: 24 Ekim 2026. Bu dosya fikir arşividir; bağlayıcı kurallar AGENTS.md / CLAUDE.md içindedir.

## Kullanıcıdan gelen yön

- [Onaylandı] Solo, özel arkadaş odaları ve ranked olmak üzere üç mod.
- [Onaylandı] Yazılı tahmin, oyuncuya özel Pas, canlı olay akışı; 1/2/4/7/11/16 saniye.
- [Onaylandı] Özel/ranked maçlar 10 farklı şarkı; solo sınırsız; turlar en fazla 60 saniye.
- [Onaylandı] Duydum! adı; mobil referanslardan esinli mor/pembe/sarı/yeşil responsive web tasarımı.
- [Onaylandı] Şarkı görselleri; başlangıçta kullanıcının bestesi Simitler — Snap ile beta.
- [Onaylandı] Veri tasarrufu: proje içindeki ses dosyaları fiziksel olarak en fazla 16 saniye.
- [Onaylandı] Sites kullanılmaz. Yerel HTML/CSS/JS, ana klasörde sade dosya düzeni.
- [Onaylandı / kısmen uygulandı] Supabase Auth bağlandı; skor, oda ve eşzamanlı oyun altyapısı sonraki aşamadır.
- [Onaylandı] Kurallar, tasarım, varlıklar ve denetim için alt ajan desteği.

## Henüz onaylanmamış / açık kararlar

- Solo liderlik hesabı: toplam puan mı, 10 ardışık turun en iyi toplamı mı? Kullanıcı özel tercih bildirmedi. Ajanın önerisi: 10 ardışık tur; kariyer toplamı ayrı gösterilebilir.
- Ranked: ilk sürüm 1'e 1 önerisi; henüz oyuncu sayısı seçilmedi. Rank maç sonucuna/rakip seviyesine dayanabilir; oyun puanını birebir rank puanına çevirmemek öneridir.
- Beraberlik: kısa kesitlerde bilinen sayılarla çözme veya beraberliği kabul etme seçenekleri açık.
- Arkadaş odası kapasitesi, hazır sistemi, sahiplik devri, kopma/yeniden bağlanma ve rövanş davranışı açık.
- Lobi → hazır → geri sayım → tur → sonuç → sonraki tur → maç sonucu → rövanş akışı öneridir.
- Dil/tür havuzları, kategori bazında solo tabloları ve ranked ortak katalog öneridir. Aynı şarkının remix/farklı kaydının aynı maçta tekrarı önlenebilir.
- Mevcut puan tablosu: 1000/850/700/500/300/100. Bu prototip ayarıdır; bağımsız kesin kullanıcı onayı alınmış tablo gibi değerlendirme.
- Kesitler aynı başlangıçtan uzar; yeniden dinleme şu an ücretsizdir ve saat devam eder. Mevcut davranıştır; uzun vadeli denge kararı ayrıca ele alınabilir.
- Kısa adlarda tolerans: mevcut dört harfte tek farklı harf kabulü “snip” gibi girdileri de kabul eder. Yanlış pozitifleri azaltacak politika değerlendirilmeli.
- Gerçek Snap kapağı henüz yok; soyut yerel kapak kullanılıyor. Yeni katalog için kaynak/izin ve kapak seçimi henüz tamamlanmadı.
- Çok oyunculuda cevap/puan sunucuda doğrulanmalı, aynı aşamada çift tahmin engellenmeli, bağlantı kopması turu durdurmamalı.

## Geçmiş ve devamlılık

- İlk prototip geçici “Kesit” adıyla Sites üzerinde yayımlandı; kullanıcı daha sonra Sites'i açıkça kaldırdı. Eski yayın yerel geliştirmeyi temsil etmez; silindiği doğrulanmadı.
- Önce kesit-beta/dist içindeydi; kullanıcı isteğiyle bütün uygulama Launch köküne taşındı.
- Kullanıcının kısa onaylarını bağlamıyla değerlendir; yeni ürün kurallarını danışman önerisiyle karıştırma.
- Yeni notlarda kaynak (kullanıcı/ajan), durum (öneri/onaylandı/ertelendi) ve karar gerekçesini belirt. Onaylanan kararları ortak talimatlara taşı.

## 24 Ekim 2026 — ana sayfa ve hesaplar

- [Kullanıcı / onaylandı] Diğer geliştirmelerden önce ayrı ana sayfa, Supabase bağlantısı ve kullanıcı kayıt/giriş akışları.
- [Kullanıcı / onaylandı] ToxArts Studios organizasyonunda ayrı Duydum projesi oluşturuldu: binissqzmhxnqlftwlnj, Frankfurt (eu-central-1).
- [Uygulandı] Ana sayfa, misafir solo geçişi, e-posta/şifre kayıt-giriş, görünen ad, şifre tekrarı, oturum yenileme ve bu tarayıcıdan çıkış.
- [Sonraya bırakıldı] Seri/rekor, yerel profil ve istatistikler, paylaşım kartı, kategoriler, günlük meydan okuma, oda ayarları ve şarkı katalog hazırlama ekranı. Önce hesap akışını tamamlayıp doğrula.
- [Teknik karar] Supabase SDK 2.118.0 assets/vendor altında; runtime CDN yok. Hesap işlemleri internet ve localhost ister; misafir solo file:// ile çalışmaya devam eder.

- [Kullanıcı / onaylandı ve uygulandı] Beta aşamasında e-posta doğrulaması geçici olarak kapatılacak. Supabase MCP Auth yapılandırmasını değiştiremiyor; panel tarayıcıda giriş istiyor. Kullanıcı panelde giriş yaptı ve kaydetme onayını verdi; Confirm email kapatıldı. Auth settings: mailer_autoconfirm=true.

## Profil ve kalıcı ilerleme — 24 Ekim 2026

- [Kullanıcı / onaylandı ve uygulandı] Önerilen profil menüsü + istatistikler + Supabase sonuç kaydı paketi “nasıl istersen” yanıtıyla kabul edildi.
- Profil adı ve avatar rengi düzenlenir. Beta istatistikleri: tur, bilinen tur, başarı oranı, en iyi seri, toplam puan ve son beş sonuç.
- Tek şarkı tekrarları deneme olarak saklanır; rekabetçi tablo/rank değildir. Kullanıcının mevcut hesabında gerçek tarayıcı kontrolünden 1 doğru deneme turu (+1000) bırakıldı; SQL testleri rollback edildi.
- [Teknik sınır] Hesap izolasyonu var; kazanma/aşama istemciden geliyor. Rekabet için sunucu doğrulaması gerekir. Başarısız kayıtların kuyruğu yalnız açık sayfada yaşar.
- [Açık] Şarkı kataloğu, arkadaş odaları, ranked, paylaşım kartı, günlük görev ve katalog aracı sonraki işlerdir.

## 10 şarkılık kapalı beta kataloğu — 24 Ekim 2026

- [Kullanıcı / onaylandı ve uygulandı] Ad + sanatçı + kapak; kapak araştırmasını alt ajan yapar. Şarkı ekleme UI aracı istenmiyor, manuel birlikte ekleme yapılacak.
- [Uygulandı] Snap üzerine 9 gönderilen MP3 eklendi; maksimum 16 saniye, orijinaller korunur. Kapaklar sonuç kartında açılır, runtime yerel dosyalardır.
- [Uygulandı] Rastgele karışık katalog; aynı döngüde tekrar yok, sınırsız soloda döngü bitince yeni karışım; döngü sınırında son şarkı tekrarı yok.
- [Sıradaki hedef] Arkadaş odaları ve ilk arkadaşlarla kapalı beta. Mevcut localhost yalnız aynı cihazdır; dış erişim için Sites kullanılmadan erişilebilir barındırma ayrıca ele alınacak.
- [Test notu] Tarayıcıda 2 adet 0 puanlı test turu (Snap/Günah Benim) mevcut hesaba kaydedildi. Supabase ajanının test verileri rollback edildi.

## Tahmin önerileri — 24 Ekim 2026

- [Kullanıcı / uygulandı] Yazarken en fazla 3 şarkı önerisi; seçimle adın alana dolması. Ad ve sanatçı eşleşmeleri, Türkçe karakter normalleştirme. Az eşleşmede yalnız gerçek eşleşmeler gösterilir.
- Öneri seçimi tek başına tahmin hakkı tüketmez. Ok/Enter seçimi ve Escape kapatma destekli; mevcut tur cevabı öneri sıralamasında kullanılmaz.

- [Kullanıcı / uygulandı] Profil adının küçük kalması, metin tabanlı ikonlar ve Ana sayfa dönüşü düzeltildi. Avatar/isim profil rozeti, tutarlı SVG ikonlar ve belirgin dönüş düğmesi. Mobilde oyuncu adı görünür kalır.

## Arkadaş odaları — kapalı beta kararı

- [Kullanıcı / uygulandı] Oda oluştur / Katıl; rastgele5 haneli kod;10tur sonrası aynı odada Tekrar oyna ile sınırsız yeni maç;oda kapanınca kod geçersiz. Gartic benzeri lobi/oda yaklaşımı.
- [Kullanıcı / uygulandı] Betada yalnız Arkadaşlarla açık; Solo kapalı,Ranked kapalı.
- [Uygulama varsayımı] Minimum2 maksimum8;başlat/tekrar/close host;host ayrılırsa devir;son üyede kapanış;90sn bağlantı toleransı,24saat idleTTL;sonuç4sn.
- [Kalan] Erişilebilir URL ve gerçek arkadaşların iki cihazla kapalı beta doğrulaması. Sites yok. Şimdiki localhost başka cihazda çalışmaz.

- [Kullanıcı / uygulandı] Solo kartı kilit ikonuyla düzeltildi; son denetim ve testler yapıldı. EReaXe/duydum deposuna güncel projeyi yükleme istendi; GitHub Pages uyumluluğu araştırıldı, statik alt dizin yolları/dinamik auth dönüşü hazırlandı. Pages yayını henüz doğrulanmış değildir.

## Elo rütbeleri — 27 Ekim 2026

Ana sayfaya altı rütbeli statik Ranked ön izlemesi eklendi: Çırak (0–999), Hesapçı (1000–1199), Çözücü (1200–1399), Stratejist (1400–1599), Üstat (1600–1799), Dâhi (1800+). İsimler ve eşikler ajan başlangıç önerisidir, kullanıcı tarafından ayrı ayrı kesinleştirilmedi. Solo Elo etkilemez. Gerçek Elo hesabı/eşleştirme ve oyuncu rütbe kaydı bağlanmadı. Mevcut müzik arayüzünün tamamı henüz dönüştürülmedi. Yerel inline SVG rozetler ve 6/3/2 sütunlu responsive CSS kullanıldı.

## Matematik ilk oynanabilir sürüm — 27 Ekim 2026

- [Kullanıcı / uygulandı] Site tamamen matematik yarışına dönüştürüldü. Solo, dönemsel sıralama ve gerçek1v1Ranked/Elo backend'i eklendi. Eski müzik verileri korundu.
- [Uygulama varsayımı] İşlem! çalışma adı;10soru20sn,2sn sonuç,yanlış3sn;solo100,ranked100/60;Elo1000/K32;ilkRanked23sn. Kullanıcı bu sayıları ayrı ayrı kesinleştirmedi.
- [Uygulama varsayımı] Haftalık(Pazartesi)/aylık(ayın1'i) İstanbul döneminde tamamlanan tüm girişli solo puanları toplanır. Misafir koşuları yalnız cihaz geçmişine gider. Elo asla Solo'dan değişmez.
- [Doğrulandı] Node motor/UI yarış testleri,SQL iki oyuncu rollback,gerçek Chrome misafir10tur ve390pxmobil. Ayrıntı PROJECT_STATUS.md.
- [Kalan] İki gerçek hesapla Ranked cihaz denemesi,yayın,nihai isim,denge ve bot önleme. Yayınlanmış gibi sunma.

## Kullanıcı kararı — sınırsız Solo koşusu

Solo60snbaşlangıç,sorulimitsiz,her doğruya mevcut süreye+5sn;50sn→55sn. Uygulandı:anında yeni soru,+100puan,skip0bonus,yanlış3sn veakanortaksayaç.18kalıp eklendi. Süre üst sınırı konulmadı. Ranked10soru ve Solo/Elo ayrımı korunur. Kullanıcı öncekiSolo çalışmasını doğruladı;Ranked gerçekcihaztestini şimdilik yapamayacağını söyledi.

## Solo tempo ayarı — 27 Ekim 2026

Kullanıcı daha rahat tempo için en uygun ayarın seçilmesini onayladı. Yeni Solo başlangıcı90saniye;doğru+5saniye/+100puan,yanlış3sn,sorulimitsiz kuralı korunur. Önceki60saniye kayıtları tarihseldir. Yeni süre yalnız yeni koşularda başlar;aktif koşu sıfırlanmaz. Node motor/UI kontrolleri90→80→85 örneğiyle güncellendi.

## Liderlik ve profil — 27 Ekim 2026

[Kullanıcı/uygulandı] Avatar,rütbe rozeti,oyuncu profili ve aylık sekme görselhatası düzeltildi. [Kullanıcı/testedildi] İkigerçekAuthbotuylaRanked süre/bonus/sonuç/Elo ve ayrılma testi geçti;ayrıChromeoriginindebotUIoyunu da incelendi. [Bekliyor] Otomatikinceleme ikigeçicibotun kalıcı silinmesini açıkonayolmadığından reddetti;temizlikonayıgerekiyor.

## Yayın kararı — 27 Ekim 2026

[Kullanıcı/onaylandı] İkibottesthesabınıveverisinisilme;güvenlikdenetimindensonragüncelsürümüGitHubPagesileyayınlama,eski depoyuyenidenadlandırma. [Uygulandı] İkihesaptemizlendi,depoadıislem,PagesActions. [Değerlendirme] Gündelikaçıkbeta;mutlakgüvenlik/antihilegarantisiyok.
