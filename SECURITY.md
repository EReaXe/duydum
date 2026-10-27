# İşlem! açık beta güvenlik değerlendirmesi

27 Ekim 2026. Bu inceleme belirli kaynak,SQL ve çalışma zamanı kontrollerini kapsar;tam penetrasyon testi veya güvenlik garantisi değildir.

## Doğrulanan sınırlar

- Şifreler Supabase Auth tarafından yönetilir;istemcide yalnız publishable key bulunur. Geçici bot parolaları Git dışında tutuldu ve yerel dosya silindi.
- Özel matematik tablolarında RLS ve doğrudan tablo erişim iptali var. Yardımcı SQL fonksiyonları istemci rollerine kapalı. Ayrı üye/hesap kontrolleri ve sabit search_path uygulanır.
- Girişli oyunların cevap,süre,puan ve Elo hesabı sunucuda. Kullanıcı payload içindeki sahte skor,Elo,deadline veya user_id yetki sağlamaz. Cevap sonuçtan önce açılmaz.
- UUID yeniden denemesi,stale soru,geç cevap,deadline önceliği ve tek Elo settlement test edildi. Kuyruk/Solo geçişinde çift aktif oturum yarışı kapatıldı.
- Payload JSON nesnesi ve en fazla4KB. Hesap başına API bütçesi40burst/10istek-sn;başlangıç bütçesi4burst/10saniyede1yenilenme. Bu sınırlamalar ağ katmanı DoS savunması değildir.
- Genel profil yalnız ad,avatar,Elo ve toplu oyun istatistikleri döndürür;e-posta,hammetadata,özelgeçmiş ve oturum bilgileri dönmez.
- Eski müzik oda RPC ve sonuç INSERT erişimleri emekli edildi;geçmiş kendi kayıtlarının okunması korunur.
- Arayüz kullanıcı verisini textContent ile gösterir;avatar izin listesi ve rütbe sınırları test edilir. Aktif ilk taraf kodda dinamik HTML/eval yok.
- CSP yalnız yerel script ve proje Supabase bağlantısına izin verir. Yerel SDK SHA-256/SRI ile sabit. Actions sürümleri resmi tag commit kimliklerine sabit.
- Pages artifact yalnız10izinlidosya içerir;SQL,eski müzik,testaraçları,belgeler ve gizli yereltestdosyaları dışarıdadır. CI en düşük gereken izinlerle çalışır.

## Kanıt

18.000 bağımsız soru;Solo/Ranked akışları;istemci hesap/poll/profil yarışları;SQL yetki,helpergrant,payload,rate/refill,sonsuzdeadline engeli,çiftoturum,forgedpayload,çaprazUUID ve legacyemeklilik testleri geçti. Gerçek iki Authbotuyla95saniye süre sonu ve ayrılma maçları tamamlandı;Elo+16/−16 ve tekrarsettlement engeli doğrulandı. Bir bot gerçek Chrome arayüzünden de cevap verdi. Fiziksel iki cihaz/yük testi yapılmadı.

Kullanıcının açık onayıyla yalnız iki test hesabı ve ilişkili test maçları temizlendi;kalan test hesabı0.

## Kalan sınırlar

- Otomatik matematik çözücüleri,çokhesaplı Elo işbirliği ve dağıtık trafik saldırıları tam engellenmez. Rekabetçi ödüllü/yoğun üretim hizmeti olarak değerlendirilmemeli.
- Anonim liderlik/genel profil okumalarında SQL üzerinden güvenilir IP hız sınırı yok. Trafik artarsa gateway/CDN rate limit ve maliyet izleme gerekir.
- E-posta doğrulaması önceki kullanıcı kararıyla kapalı. Leaked password protection mevcut projede kapalı uyarısı sürüyor;otomatik olarak Auth ayarı değiştirilmedi. [Supabase parola güvenliği](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- GitHub Pages statik sunucudur;CSP meta olarak uygulanır,özel güvenlik HTTP başlıkları sunucudaki gibi yönetilmez. HTTPS Pages ayarında zorunludur.

Sonuç: incelenen engelleyici hatalar düzeltildikten sonra gündelik kullanım için açık beta yayını uygundur. Yeni bulguda yeniden değerlendir.
