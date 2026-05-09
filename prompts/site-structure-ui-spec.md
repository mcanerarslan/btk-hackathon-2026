prompts klasöründeki tüm Markdown dosyalarını oku.

Ana tasarım referansı olarak `ai-trip-ui-design.md` dosyasını kullan.

Bu projeyi yalnızca tek sayfalık basit bir form olarak yapma; ancak MVP akışında AI destekli seyahat planlama deneyimini merkezde tut.

Site; header, footer, çok sayfalı yapı ve klasik araç kiralama gezilebilirliği olan modern bir platform gibi çalışmalı. Ancak sitenin ana amacı AI ile kullanıcıya en doğru aracı önermek olmalı.

Yeni yapı şu şekilde olmalı:

1. Global Header
- Logo
- Ana Sayfa
- Araçlar
- Kampanyalar
- Ofisler
- Hizmetler
- Yardım
- Dil seçimi
- CTA: AI ile Araç Bul
- Login zorunlu olmamalı

2. Global Footer
- Kurumsal bilgiler
- Hızlı linkler
- Yardım / iletişim
- Sosyal medya
- KVKK / gizlilik / kullanım şartları
- Kısa açıklama: AI destekli araç öneri platformu

3. Ana Sayfa
- Büyük hero alanı
- AI ile araç bulma çağrısı
- Klasik hızlı rezervasyon alanı
- Popüler araçlar
- Popüler şehirler
- AI nasıl çalışır bölümü
- Neden bizi seçmelisiniz bölümü

4. Araçlar Sayfası
Kullanıcı AI kullanmadan da araçları gezebilmelidir.

Olması gerekenler:
- Araç listeleme
- Filtreler
  - segment
  - fiyat
  - yakıt tipi
  - vites
  - kişi kapasitesi
  - bagaj hacmi
- Araç kartları
- Araç detayına gitme
- Karşılaştırma özelliği
- AI öneri widgeti her zaman sol altta sabit kalmalı

5. Araç Detay Sayfası
- Araç görseli
- Teknik bilgiler
- Bagaj hacmi
- Yakıt tüketimi
- Günlük fiyat
- Uygun olduğu yolculuk tipleri
- Benzer araçlar
- CTA: Bu araç bana uygun mu? AI’a sor

6. AI Araç Bulma Sayfası
Bu sitenin ana deneyimi olmalı ve `ai-trip-ui-design.md` içindeki çok adımlı, açıklamalı akışa uymalıdır.

Kullanıcı:
- rota girer
- kişi sayısı girer
- bagaj/eşya bilgisi girer
- bütçe seçer
- konfor/ekonomi/performans önceliğini seçer

Sonuçta:
- ekonomik öneri
- dengeli öneri
- konforlu öneri
- risk uyarıları
- neden bu araç önerildi açıklaması

gösterilmeli.

7. Sol Alt AI Widget
Tüm sayfalarda sabit görünmeli.

Widget özellikleri:
- sol altta küçük floating button
- açılınca mini chat paneli
- kullanıcı bulunduğu sayfaya göre soru sorabilmeli
- örnek:
  - “Bu araç bana uygun mu?”
  - “4 kişi ve 3 valiz için hangi aracı seçmeliyim?”
  - “Ekonomik bir seçenek öner”
  - “Dağ yolu için bu araç yeterli mi?”

Widget tasarımı:
- yuvarlak floating buton
- glow efekti
- açılış/kapanış animasyonu
- küçük AI asistan avatarı
- mobilde ekranı kaplamayacak şekilde responsive

8. Kampanyalar Sayfası
- kampanya kartları
- indirimli araçlar
- sezonluk fırsatlar
- AI önerisi: “Bu kampanya senin yolculuğuna uygun mu?”

9. Ofisler Sayfası
- şehir bazlı ofisler
- harita görünümü
- teslim alma / bırakma noktaları

10. Hizmetler Sayfası
- ek sürücü
- çocuk koltuğu
- sigorta paketleri
- uzun dönem kiralama
- kamp/outdoor paketleri

Tasarım Beklentisi:
- Koyu lacivert, mavi-mor gradient ve glassmorphism odaklı premium AI hissi
- Güven veren araç kiralama yapısı korunmalı, ancak klasik site görünümüne sıkışmamalı
- Header ve footer profesyonel olmalı
- Sayfalar arası tutarlı tasarım dili kullanılmalı
- Animasyonlar bol ama abartısız olmalı
- Framer Motion kullanılabilir
- Responsive tasarım zorunlu

Önemli:
Site sadece AI formundan ibaret olmasın. Kullanıcı isterse klasik şekilde araçları gezebilsin, filtreleyebilsin ve detaylara bakabilsin.

Ancak ana sayfa ve ilk demo akışı `ai-trip-ui-design.md` ile uyumlu olmalı:
- landing / hero
- adım adım seyahat formu
- AI analiz ekranı
- 3 araç önerisi
- açıklamalı karar alanı
- karşılaştırma bölümü

Her noktada AI widget ve “AI ile doğru aracı bul” çağrısı görünür olmalı.
- Uygulama geliştirilirken güvenli kodlama, hataları tespit edici kontrol ve performans optimizasyonu da dikkate alınmalıdır.

Öncelik:
1. Layout yapısı
2. Header/Footer
3. Ana sayfa
4. Araçlar sayfası
5. Araç detay sayfası
6. AI araç bulma sayfası
7. Floating AI widget
8. Responsive ve animasyonlar

Mock data kullanılabilir. Login/register zorunlu değildir.
