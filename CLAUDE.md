# İşlem! — matematik oyunu proje talimatları

## Güncel ürün yönü
- Kullanıcı müzikten matematik oyununa geçişi ve oynanabilir tam dönüşümü istedi. İşlem! geçici çalışma adıdır; marka uygunluğu doğrulanmadı.
- GitHub Pages hedefidir; Sites kullanılmaz. Statik HTML/CSS/JS mevcut seçimdir, kullanıcı gerekli ek teknolojilere izin verdi. Runtime CDN/font/framework yok; Supabase SDK yereldir.
- Solo ve Ranked ayrıdır. Solo yalnız haftalık/aylık solo liderliğine puan kazandırır; Elo veya ranked eşleşmesini etkilemez.
- Ranked Elo kullanır. Kullanıcının son kararı: 1’e1 sınırsız soru düellosu; her oyuncunun90saniyelik kişisel saati var, doğru cevap yalnız kendi saatine+5saniye ekler. Saatler aynı anda ve kesintisiz çalışır; süresi önce biten kaybeder. Kazanan puan toplamıyla belirlenmez. Aynı soru dizisinde her oyuncu bağımsız ilerler; yeni soru rakibin sorusunu/süresini değiştirmez.
- Kullanıcının son Solo kararı: koşu90 saniyeyle başlar; soru sınırı yok; her doğru cevap mevcut bitiş zamanına5 saniye ekler. Süre soruda/yanlışta/geçişte işlemeye devam eder; sıfırlanmaz ve üst sınır yok. Doğruda+100puan ve anında yeni soru; geçmede+0saniye ve yeni soru; yanlışta3sn bekleme mevcut varsayımdır. Ranked de kişisel saatli sınırsız düellodur.
- Soru motorları18 kalıp içerir; tüm cevaplar tam sayıdır. Misafir motoru18kalıplı karışık torba kullanır; sunucu hemen aynı soruyu tekrar etmemeye çalışır.
- Uygulama ayarları: eşleşmeden sonra ortak3sn geri sayım; Ranked cevabı doğruysa beklemeden sonraki soru, yanlışta3sn aynı soruda bekleme; Ranked Pas kapalı. Başlangıç Elo1000,K32 ve rütbe eşikleri ilk sürüm varsayımlarıdır. Eşit anda iki saatin dolması beraberliktir. Sonuç kontrolü sunucu zamanına göre iki deadline’ın önceliğini karşılaştırır; geç gelen cevap bonus kazandırmaz.
- Rütbe taslağı: Çırak0–999,Hesapçı1000–1199,Çözücü1200–1399,Stratejist1400–1599,Üstat1600–1799,Dâhi1800+.
- Sunucu puan/süre/cevap doğrulaması girişli oyunda otoritedir; misafir Solo yerel pratiktir ve canlı tabloya yazılmaz. Tamamlanmış girişli solo koşularının puanları dönem içinde toplanır; eski müzik sonuçlarını kullanma.
- Sunucu doğrulaması bot/otomatik çözüm engeli garantisi değildir. Soru cevapları sonuç öncesi sunucudan dönmemelidir.

## Liderlik ve genel oyuncu profilleri
- Solo liderlik satırları oyuncu avatarını,rütbe rozetini,Elo ve Solo puanını gösterir;oyuncu adına basınca genel profil açılır.
- Genel profil yalnız ad,avatar,rütbe/Elo ve toplam Solo/Ranked istatistiklerini gösterir. E-posta,ham metadata,özel geçmiş ve oturum verisi paylaşılmaz.
- Haftalık/aylık sekme görünümü yalnız aria-pressed=true ile belirlenir;eski active sınıfını ikinci seçim kaynağı yapma. Gecikmiş yanıt önceki dönemi/profili yeniden açmamalıdır.

## Açık beta yayın ve güvenlik
- Kullanıcı eski deponun adını değiştirip güncel matematik sürümünü GitHub Pages ile yayınlamayı onayladı. Depo EReaXe/islem, hedef https://ereaxe.github.io/islem/.
- Pages kaynağı GitHub Actions olmalı; .github/workflows/pages.yml yalnız check-release.cjs izin listesindeki10aktifdosyayı yayınlar. Eski ses/kapak,SQL,belge,testve .local-tests yayın paketine girmez.
- Yayından önce test-math.cjs,test-auth.cjs,test-security.cjs,check-release.cjs ve talimat eşitliği geçmeli. Actions commitSHA ile sabit;SDKyerelSHA/SRI ve CSP korunur.
- Hesap başına istek/oyunbaşlatma sınırları ve payload4KB/object doğrulaması vardır. Emekli müzik RPC/yazma erişimleri kapalı,eski veriler korunur.
- Bu sürüm gündelik açık betadır;tam bot/otomatik çözüm/Sybil/antiDDoS koruması veya güvenlikgarantisi iddia etme. Auth e-posta doğrulamasının kapalı olması önceki kullanıcı kararıdır;yeniden açmayı kendiliğinden yapma.

## Dosya ve veri koruma
- Aktif index.html/style.css/app.js matematik arayüzüdür; math-engine.js misafir soru motorudur; auth.js mevcut hesapları korur. config.js yalnız public publishable key içerir.
- db/math.sql yeni oyun backend kaynağıdır. Eski db/schema.sql,db/rooms.sql,müzik katalog/sesleri ve geçmiş sonuçlar korunur; eski scriptler aktif sayfadan yüklenmez.
- Kullanıcı dosyalarını silme; secret/service_role istemciye ekleme; parolaları kendin saklama. Metadata yalnız görünüm içindir,yetki için değildir.
- Supabase mevcut proje binissqzmhxnqlftwlnj kullanılır; matematik tabloları eski sonuçlardan ayrıdır. Supabase işlerinde ilgili beceriyi oku.

## İşbirliği ve doğrulama
- Başlarken AGENTS.md,PROJECT_STATUS.md,notes.md oku ve kaynakla doğrula. Kullanıcının son kararı eski metinden üstündür.
- AGENTS.md ve CLAUDE.md aynı içerikte olmalı; değişince node scripts/sync-instructions.cjs --from AGENTS.md ve --check çalıştır.
- Anlamlı değişikliklerde durum/not belgelerini güncelle. Fikirleri onaylanmış karar sayma.
- Kullanıcı uygun görevlerde alt ajanlar istedi; arayüz,backend ve bağımsız denetim rollerinden yararlan.
- Responsive mobil/masaüstü,yatay taşmama,etiketli girişler,klavye,görünür odak ve azaltılmış hareket desteğini koru. Sonuç/yeniden başlat odak yönetimini doğrula.
- Node benzetimi,SQL testi,gerçek tarayıcı ve gerçek iki cihazlı maç kanıtlarını ayrı raporla. Test edilmemiş şeyi edilmiş gösterme.
- Yerel sunucu node scripts/serve.cjs veya baslat.cmd; http://localhost:3000. Pages alt yolu için göreli asset yolları ve new URL('./',document.baseURI) dönüşü korunur. .nojekyll korunur.
- Kaynak repo https://github.com/EReaXe/islem. Eski local-prototype-archive dalını yayınlama. Pages deployment doğrulanmadan yayınlandı deme.
