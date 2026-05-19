# Rent A Car Gemini Uzman Geliştirme Dokümanı

Bu doküman, mevcut `prompts` klasöründeki proje yönlendirmeleri ve mevcut React/Vite kod yapısı incelenerek hazırlanmıştır. Ana referans sırası yine:

1. `site-yapısı.md`
2. `site-structure-ui-spec.md`
3. `ai-trip-ui-design.md`
4. `renk-paleti.md`

Bu dosya, projenin mevcut halinden farklılaştırılması için ek ürün vizyonu, admin dashboard kapsamı, Gemini API kullanımı, AI widget tasarımı ve hackathon teslim odağını netleştirir.

---

# Ürün Vizyonu

Proje, klasik bir rent a car sitesinden daha fazlası olmalıdır.

Kullanıcı tarafında normal araç kiralama sitesi gibi:

- araç listesi,
- araç detayları,
- kampanyalar,
- ofisler,
- hizmetler,
- hızlı rezervasyon akışı

bulunmalıdır.

Ancak projenin farkı, Gemini API ile çalışan AI karar destek katmanı olmalıdır. Sistem yalnızca “araç öneren chatbot” gibi davranmamalı; kullanıcının seyahat amacını, rota tipini, kişi ve bagaj bilgisini, bütçesini, risklerini ve araç kataloğunu birlikte değerlendirerek açıklanabilir öneriler üretmelidir.

Ana ürün hissi:

> Normal araç kiralama deneyimini koruyan, ama her kritik karar noktasında Gemini destekli bir uzmanla kullanıcıyı daha doğru araca yönlendiren premium rent a car platformu.

---

# Mevcut Halden Farklılaşma Hedefi

Mevcut proje zaten AI destekli araç önerisi, floating widget ve araç kataloğu temellerini içeriyor. Yeni hedef, bu temeli daha yarışma odaklı ve özgün hale getirmektir.

## Farklılaştırılacak Alanlar

1. Site sadece AI formu gibi görünmemeli; gerçek bir rent a car platformu gibi gezilebilir olmalı.
2. Araçlar sayfası klasik filtreleme, sıralama ve karşılaştırma deneyimini daha güçlü sunmalı.
3. Admin dashboard kullanıcı sitesinden ayrı bir yönetim deneyimi gibi çalışmalı.
4. Gemini kullanılan tüm alanlar görsel olarak ayırt edilebilmeli.
5. AI uzman modülü sadece cevap vermemeli; yapılmamış veya eksik bırakılmış şeyleri tespit edip öneriler üretmeli.
6. Hackathon jürisine anlatılabilecek net bir agentic yapı bulunmalı.

---

# Kullanıcı Sitesi

Kullanıcı sitesi login zorunluluğu olmadan kullanılmalıdır.

## Ana Sayfa

Ana sayfa şu mesajı ilk ekranda vermeli:

> Araç kiralamadan önce rotanı, bagajını ve yol şartlarını analiz edip sana en doğru aracı Gemini ile öneriyoruz.

Olması gerekenler:

- premium hero alanı,
- “AI ile Araç Bul” CTA,
- “Araçları İncele” CTA,
- kısa hızlı rezervasyon alanı,
- popüler araçlar,
- popüler şehirler,
- AI nasıl çalışır bölümü,
- güven ve şeffaf karar açıklaması.

## Araçlar Sayfası

Kullanıcı AI kullanmadan da araçları normal şekilde gezebilmelidir.

Olması gerekenler:

- araç katalog grid/list görünümü,
- segment filtresi,
- fiyat filtresi,
- yakıt filtresi,
- vites filtresi,
- kişi kapasitesi filtresi,
- bagaj hacmi filtresi,
- rota uygunluğu filtresi,
- araç karşılaştırma seçimi,
- detay sayfasına geçiş,
- her araç kartında AI uygunluk skoru.

Araç kartı içeriği:

- araç adı,
- segment,
- görsel,
- günlük fiyat,
- yakıt tipi,
- tüketim,
- bagaj hacmi,
- koltuk sayısı,
- uygun rota etiketleri,
- Gemini destekli kısa araç yorumu.

## Araç Detay Sayfası

Araç detay sayfası klasik rent a car detay sayfası gibi olmalı, ancak AI karar desteği öne çıkmalıdır.

Olması gerekenler:

- büyük araç görseli,
- teknik bilgiler,
- fiyat,
- bagaj hacmi,
- yakıt tüketimi,
- konfor ve performans skorları,
- uygun olduğu yolculuk tipleri,
- risk uyarıları,
- benzer araçlar,
- CTA: “Bu araç bana uygun mu? Gemini’ye sor”.

## AI Araç Bulma Sayfası

Bu sayfa demo akışının merkezi olmalıdır.

Kullanıcıdan alınacak bilgiler:

- nereden,
- nereye,
- gidiş tarihi,
- dönüş tarihi,
- yolculuk tipi,
- yetişkin/çocuk sayısı,
- bebek koltuğu ihtiyacı,
- büyük/orta valiz sayısı,
- sırt çantası sayısı,
- kamp veya ekstra eşya bilgisi,
- bütçe,
- öncelik: ekonomik, dengeli, konforlu, performans, aile, outdoor.

Sonuç ekranında:

- ekonomik öneri,
- dengeli öneri,
- konforlu/güvenli öneri,
- neden önerildi açıklaması,
- risk uyarıları,
- hangi araçların neden önerilmediği,
- araç karşılaştırması,
- Gemini tarafından oluşturulan kısa karar özeti

gösterilmelidir.

---

# Admin Dashboard

Admin panel kullanıcı sitesinden görsel ve işlevsel olarak ayrılmalıdır. Kullanıcı sitesi premium, karar destekli ve satış odaklıyken; admin panel daha yoğun, operasyonel ve yönetim odaklı olmalıdır.

## Admin Dashboard Girişi

MVP için login zorunlu olmayabilir, ancak dashboard yapısı login eklenebilecek şekilde tasarlanmalıdır.

Admin route önerisi:

- `/admin`
- `/admin/vehicles`
- `/admin/site`
- `/admin/ai`
- `/admin/insights`

## Admin Ana Panel

Gösterilecek metrikler:

- toplam araç sayısı,
- aktif araç sayısı,
- en çok önerilen araç,
- ortalama AI uygunluk skoru,
- riskli rota uyarısı sayısı,
- bu hafta yapılan AI analiz sayısı,
- eksik araç bilgisi bulunan kayıt sayısı.

## Araç Yönetimi

Admin şunları yapabilmelidir:

- araç ekleme,
- araç düzenleme,
- araç silme,
- araç görseli ekleme,
- fiyat güncelleme,
- yakıt tüketimi güncelleme,
- bagaj/koltuk bilgisi düzenleme,
- rota uygunluk etiketleri ekleme,
- AI açıklamasını yeniden üretme.

## Site Yönetimi

Admin şunları düzenleyebilmelidir:

- site adı,
- logo,
- favicon,
- header metni,
- footer metni,
- kampanya içerikleri,
- öne çıkan araçlar,
- ana sayfa CTA metinleri.

## Gemini AI Yönetim Paneli

Bu bölüm projenin yarışma değerini artırır.

Admin burada:

- Gemini model adını görebilmeli,
- API bağlantı durumunu görebilmeli,
- son AI isteklerini görebilmeli,
- fallback cevap kullanılıp kullanılmadığını anlayabilmeli,
- prompt taslağını görüntüleyebilmeli,
- AI çıktısını yeniden üretebilmeli,
- hatalı/eksik AI cevaplarını işaretleyebilmelidir.

---

# Gemini Uzman Modülü

Projede “uzman” olarak konumlanacak AI modülü bulunmalıdır. Bu uzman sadece kullanıcı sorularını cevaplamaz; projeyi geliştirecek eksikleri ve denenmemiş fırsatları da analiz eder.

Uzmanın adı örnek olarak:

- Gemini Rent Expert
- Gemini Ops Expert
- RotaPilot Uzman
- Araç Seçim Uzmanı

## Uzmanın Görevi

Uzman aşağıdaki sorulara cevap üretmelidir:

- Bu araç kataloğunda hangi bilgi eksik?
- Hangi araç hangi rota için riskli?
- Kullanıcıya daha iyi öneri vermek için hangi veri gerekir?
- Hangi filtre veya karşılaştırma eksik?
- Admin hangi araç bilgilerini tamamlamalı?
- Bu kampanya hangi yolculuk tipleri için uygun?
- Hangi araç segmenti katalogda zayıf kalıyor?
- Jüri demosu için hangi senaryo daha etkileyici olur?

## Yapılmamış Şeyleri Deneme Mantığı

Uzman, projede henüz yapılmamış ama geliştirilebilecek fikirleri önermelidir:

- araç katalog kalite kontrolü,
- eksik veri tespiti,
- riskli araç/rota eşleşmesi,
- kampanya-rotaya uygunluk analizi,
- admin için otomatik araç açıklaması üretimi,
- demo senaryosu üretimi,
- kullanıcı yorumlarından araç içgörüsü çıkarma,
- araçlar arası artı/eksi karşılaştırması,
- fiyat/performans skorlaması,
- rota bazlı sigorta paketi önerisi.

Bu özellikler MVP’de tamamen bitmek zorunda değildir. Ancak dashboard içinde “Gemini Uzman Önerileri” paneli olarak gösterilirse agentic yapı ve yenilikçilik puanı güçlenir.

---

# Gemini API Kullanımı

Bu projede LLM kullanılacaksa yalnızca Gemini API kullanılmalıdır.

## Teknik Kurallar

- API key kod içine yazılmamalıdır.
- API key `.env` içinden okunmalıdır.
- Değişken adı: `VITE_GEMINI_API_KEY`
- Model adı: `VITE_GEMINI_MODEL`
- Varsayılan model: `gemini-2.5-flash`
- Gemini çağrıları mümkün olduğunca ayrı servis/modül içinde tutulmalıdır.
- API başarısız olursa deterministik fallback cevap gösterilmelidir.
- Kullanıcıya AI cevabının hangi verilere dayandığı açıklanmalıdır.

## Önerilen Servis Yapısı

```text
src/services/geminiService.js
src/services/recommendationService.js
src/services/adminExpertService.js
```

## Gemini Kullanılacak Alanlar

- floating AI widget,
- araç detayında “bu araç bana uygun mu?” cevabı,
- AI araç bulma sonuç açıklaması,
- admin araç açıklaması üretimi,
- admin eksik veri tespiti,
- Gemini uzman önerileri,
- demo senaryosu üretimi.

---

# Gemini Rainbow Border Tasarımı

Gemini kullanılan her widget ve AI alanı görsel olarak ayırt edilmelidir.

## Kullanım Alanları

- floating AI button,
- açık AI chat paneli,
- AI öneri kartları,
- AI analiz ekranı,
- araç detayındaki “Gemini değerlendirmesi” kartı,
- admin dashboard “Gemini Uzman” paneli,
- API bağlantı durum kartı.

## Görsel Davranış

AI kullanılan alanlarda dönen rainbow border efekti olmalıdır.

Tasarım hissi:

- premium,
- teknolojik,
- abartısız,
- Gemini kullandığını sezdiren,
- koyu arka plan üzerinde parlayan,
- hareketli ama dikkat dağıtmayan.

## CSS Yaklaşımı

Örnek class isimleri:

```css
.gemini-border
.gemini-border::before
.gemini-card
.gemini-orbit
.gemini-glow
```

Önerilen gradient:

```css
conic-gradient(
  from 0deg,
  #4285f4,
  #34a853,
  #fbbc05,
  #ea4335,
  #a142f4,
  #4285f4
)
```

Animasyon:

```css
@keyframes geminiSpin {
  to {
    transform: rotate(360deg);
  }
}
```

Erişilebilirlik:

- `prefers-reduced-motion` durumunda animasyon durmalı veya çok yavaşlamalıdır.
- Border efekti metin okunabilirliğini bozmamalıdır.
- İçerik alanı border animasyonundan ayrı bir iç katmanda olmalıdır.

---

# Agentic Yapı

Yarışma kriterleri için proje agentic yapı olarak anlatılmalıdır.

## Kullanıcı Tarafı Agentları

1. Intent Parser Agent
   - Kullanıcı seyahat metnini yapılandırılmış ihtiyaca çevirir.

2. Route Risk Agent
   - Rota tipini, yol zorluğunu ve riskleri analiz eder.

3. Passenger & Luggage Agent
   - Kişi, çocuk, bebek koltuğu ve bagaj ihtiyacını hesaplar.

4. Budget & Fuel Agent
   - Günlük fiyat, yakıt tüketimi ve toplam maliyeti değerlendirir.

5. Vehicle Matching Agent
   - Araçları deterministik skorla sıralar.

6. Gemini Explainer Agent
   - Sonucu kullanıcı dilinde açıklar.

## Admin Tarafı Agentları

1. Catalog Quality Agent
   - Araç kayıtlarında eksik veya tutarsız bilgi bulur.

2. Pricing Insight Agent
   - Fiyat/performans açısından dengesiz araçları işaretler.

3. Campaign Fit Agent
   - Kampanyaların hangi rota ve kullanıcı tipine uygun olduğunu açıklar.

4. Demo Coach Agent
   - Hackathon demosu için etkili kullanıcı senaryoları üretir.

5. Improvement Expert Agent
   - Projede yapılmamış ama puan getirecek geliştirme fırsatlarını önerir.

---

# Skorlama Mantığı

Araç önerisi yalnızca Gemini cevabına bırakılmamalıdır. Önce deterministik skor hesaplanmalı, Gemini bu skoru açıklamalıdır.

Örnek skor:

```text
Genel Skor =
Rota Uyumu x 0.25 +
Bagaj Uyumu x 0.20 +
Yakıt Verimliliği x 0.20 +
Bütçe Uyumu x 0.15 +
Konfor x 0.10 +
Güvenlik/Risk Uyumu x 0.10
```

Bu yapı doğruluk ve teknik puanı güçlendirir.

---

# MVP Öncelikleri

## Zorunlu

- normal araç listeleme,
- araç detay sayfası,
- AI araç bulma akışı,
- floating Gemini widget,
- admin dashboard ana ekranı,
- admin araç yönetimi,
- Gemini API entegrasyonu,
- fallback cevap sistemi,
- Gemini rainbow border tasarımı,
- açıklanabilir araç önerisi,
- risk uyarıları.

## Güçlü Demo İçin Eklenebilir

- admin Gemini Uzman paneli,
- eksik araç verisi tespiti,
- AI ile araç açıklaması üretme,
- AI ile demo senaryosu üretme,
- araç karşılaştırma tablosu,
- kampanya uygunluk analizi,
- API bağlantı durum kartı.

---

# Hackathon Teslim Notları

Teslimde jüriye şu anlatı verilmelidir:

> Bu proje klasik rent a car sitelerindeki filtreleme deneyimini Gemini destekli karar asistanına dönüştürür. Kullanıcı yalnızca fiyat ve marka görmez; rotasına, bagajına, yol şartlarına ve bütçesine göre neden hangi aracı seçmesi gerektiğini açıkça anlar. Admin tarafında ise Gemini uzmanı katalog eksiklerini, riskli eşleşmeleri ve geliştirme fırsatlarını tespit eder.

## 1 Dakikalık Demo Akışı

1. Ana sayfada problem gösterilir.
2. Kullanıcı AI araç bulma sayfasına geçer.
3. “İstanbul’dan Rize yaylasına 5 kişi, 4 valiz ve kamp ekipmanı ile gidiyoruz” senaryosu girilir.
4. Sistem analiz ekranını gösterir.
5. 3 araç önerisi skorlarla listelenir.
6. Riskli araçların neden önerilmediği açıklanır.
7. Floating Gemini widget üzerinden “Daha ucuz aracı seçersem risk ne?” sorulur.
8. Admin dashboard’da Gemini Uzman paneli gösterilir.

---

# Güvenlik ve Kalite

- Gemini API key asla repoya yazılmamalıdır.
- `.env` dosyası git dışında kalmalıdır.
- Kullanıcı girdisi doğrudan HTML olarak basılmamalıdır.
- Admin panel ileride gerçek auth ile korunabilecek şekilde ayrılmalıdır.
- API hata durumlarında kullanıcıya teknik hata yığını gösterilmemelidir.
- AI cevabı kararın tek kaynağı olmamalıdır; skor algoritması korunmalıdır.

---

# Uygulama Sırası

1. Mevcut sayfa ve route yapısını netleştir.
2. Admin dashboard route yapısını ayır.
3. Araç katalog deneyimini klasik rent a car sitesi gibi güçlendir.
4. Gemini servis katmanını `TripContext` dışına çıkar.
5. Floating widget ve AI kartlarına Gemini rainbow border ekle.
6. Admin Gemini Uzman panelini oluştur.
7. Araç skorlarını ve açıklamalarını Gemini ile zenginleştir.
8. Responsive ve erişilebilirlik kontrolü yap.
9. Demo senaryosunu sabitle.
10. README veya teslim açıklamasına ürün faydası, teknoloji ve demo linkini ekle.

