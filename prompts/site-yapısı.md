# RotaPilot AI

## AI Destekli Araç Kiralama, Rota Risk ve Seyahat Maliyet Asistanı

## Yarışma İçin Konu Kararı

Bu proje yarışma için geliştirilmeye değer. Ancak fikrin yalnızca “araç kiralama asistanı” olarak sunulması yeterince güçlü değildir; çünkü klasik bir ürün öneri chatbotu gibi algılanabilir.

Kazanmaya daha yakın versiyon şudur:

> Kullanıcının seyahat planını, yol koşullarını, hava durumunu, kişi/bagaj ihtiyacını ve bütçesini analiz eden; kiralık araçları açıklanabilir skorlarla karşılaştıran; yanlış araç seçimi riskini önceden gösteren agentic AI karar destek sistemi.

Bu yaklaşım yarışma kriterlerine daha iyi oturur:

- Kullanıcı değeri: gerçek bir karar problemine çözüm üretir.
- Teknik puan: tek chatbot yerine çoklu agent yapısı, skor motoru ve veri tabanlı analiz içerir.
- Doğruluk: öneriler sadece metinsel değil, puanlama ve hesaplarla desteklenir.
- Agentic yapı: rota, hava, bagaj, bütçe ve öneri agentları ayrı görevler üstlenir.
- Yenilikçilik: araç kiralama sitelerindeki filtre mantığını karar asistanına dönüştürür.
- Demo gücü: jüriye 1 dakikada net problem, analiz ve sonuç gösterilebilir.

---

# Proje Özeti

RotaPilot AI, seyahat planına göre en uygun kiralık aracı seçen yapay zeka destekli bir karar asistanıdır.

Kullanıcı doğal dille seyahatini anlatır:

> “İstanbul’dan Rize yaylalarına gideceğiz. 5 kişiyiz, 4 büyük valiz ve kamp ekipmanı var. Yakıt çok önemli ama araç dağ yollarında zorlanmasın.”

Sistem bu isteği analiz ederek:

- rota zorluğunu,
- hava ve yol risklerini,
- kişi ve bagaj ihtiyacını,
- yakıt ve toplam maliyeti,
- araçların uygunluk skorlarını,
- riskli araç sınıflarını,
- alternatif önerileri

tek ekranda açıklar.

Amaç, kullanıcının yüzlerce araç arasında filtrelerle kaybolmasını önlemek ve yanlış araç seçimi riskini azaltmaktır.

---

# Problem

Araç kiralama platformları çoğunlukla araçları fiyat, marka, model ve sınıf filtresiyle listeler. Fakat kullanıcıların gerçek sorusu genellikle şudur:

- Bu araç benim rotama uygun mu?
- Bagajım gerçekten sığar mı?
- Uzun yolda yakıt maliyeti ne olur?
- Dağ, kar, yağmur veya stabilize yolda sorun yaşar mıyım?
- Daha ucuz aracı seçersem hangi riskleri alırım?
- Ailem, çocuklarım veya kamp ekipmanım için doğru seçim hangisi?

Mevcut sistemler bu sorulara karar odaklı cevap vermez. Kullanıcı teknik özellikleri kendisi yorumlamak zorunda kalır.

Bu da:

- yanlış araç seçimine,
- yüksek yakıt maliyetine,
- yolculukta konfor kaybına,
- bagaj ve kapasite sorunlarına,
- kötü kiralama deneyimine

neden olabilir.

---

# Çözüm

RotaPilot AI, kullanıcının seyahat senaryosunu anlayıp araçları yalnızca fiyatına göre değil, gerçek kullanım uygunluğuna göre sıralar.

Sistem her araç için açıklanabilir bir karar kartı üretir:

- Genel uygunluk skoru
- Rota uyumluluğu
- Bagaj uyumluluğu
- Yakıt/maliyet tahmini
- Konfor seviyesi
- Risk uyarıları
- Neden önerildi?
- Hangi durumda önerilmez?

Örnek çıktı:

## En Dengeli Öneri

### Peugeot 3008

- Genel skor: 88/100
- Rota uyumu: yüksek
- Bagaj uyumu: yeterli
- Yakıt maliyeti: orta
- Dağ yolu riski: düşük

Neden önerildi:

- 5 kişilik yolculuk için iç hacmi daha uygun.
- Kamp ekipmanı ve büyük valizler için bagaj kapasitesi daha güvenli.
- Rize yayla rotasında motor gücü küçük hatchback araçlara göre daha avantajlı.

Risk:

- En ekonomik seçenek değildir.
- Şehir içi park kolaylığı Egea Cross gibi modellere göre daha düşüktür.

---

# Ana Kullanıcı Akışı

## 1. Doğal Dil İle Seyahat Girişi

Kullanıcı uzun form doldurmak zorunda kalmaz.

Örnek:

> “Ankara’dan Kapadokya’ya 3 günlük aile gezisine çıkacağız. 2 yetişkin, 2 çocuk, 2 valiz var. Bütçem düşük ama konfor da önemli.”

AI bu metinden otomatik olarak şunları çıkarır:

- başlangıç noktası,
- varış noktası,
- kişi sayısı,
- bagaj miktarı,
- yolculuk amacı,
- bütçe hassasiyeti,
- konfor beklentisi,
- özel riskler.

## 2. Agentic Analiz

Her agent kendi alanını analiz eder ve ortak karar motoruna skor döndürür.

## 3. Araç Karşılaştırma

Sistem 3 ana öneri sunar:

- En ekonomik seçim
- En dengeli seçim
- En konforlu/güvenli seçim

## 4. Açıklanabilir Sonuç

Kullanıcı sadece araç ismi görmez; neden o aracın seçildiğini anlar.

## 5. Risk Uyarısı

Sistem uygun olmayan araçları da açıklar:

- “Küçük hatchback araçlar bu bagaj miktarı için riskli.”
- “1.0 motor araçlar dik yayla yollarında performans sorunu yaşatabilir.”
- “Kar yağışı beklenen rotada yaz lastikli araç tercih edilmemeli.”

---

# Agentic Yapı

Projede çoklu agent mimarisi kullanılacaktır. Her agent belirli bir görevi yerine getirir ve sonuçları karar motoruna aktarır.

## 1. Intent Parser Agent

Kullanıcının doğal dilde yazdığı seyahat isteğini yapılandırılmış veriye çevirir.

Çıktı örneği:

```json
{
  "from": "Istanbul",
  "to": "Rize",
  "passengers": 5,
  "large_luggage": 4,
  "extra_items": ["kamp ekipmanı"],
  "priority": "yakıt ve yol güvenliği",
  "route_type": "uzun yol + dağ yolu"
}
```

## 2. Route Risk Agent

Rota uzunluğu, tahmini yol tipi, eğim, şehir içi/şehir dışı oranı ve zorlu yol ihtimalini analiz eder.

Ürettiği bilgiler:

- tahmini mesafe,
- yol zorluğu,
- şehir içi/uzun yol oranı,
- dağ/yayla riski,
- düşük motor hacmi riski.

## 3. Weather Agent

Seyahat tarihine göre hava durumunu analiz eder.

Ürettiği bilgiler:

- yağmur riski,
- kar/buz riski,
- görüş mesafesi riski,
- lastik/çekiş önerisi.

## 4. Passenger & Luggage Agent

Kişi sayısı, valiz sayısı ve özel ekipmanları analiz eder.

Ürettiği bilgiler:

- minimum koltuk ihtiyacı,
- minimum bagaj hacmi,
- çocuk koltuğu ihtiyacı,
- tavan bagajı veya SUV ihtiyacı.

## 5. Budget & Fuel Agent

Araç fiyatı, yakıt tüketimi ve rota mesafesine göre toplam maliyet tahmini üretir.

Hesapladığı değerler:

- kiralama bedeli,
- tahmini yakıt maliyeti,
- toplam seyahat araç maliyeti,
- ekonomik seçenek farkı.

## 6. Vehicle Matching Agent

Araç veri setindeki modelleri kullanıcının ihtiyacına göre skorlar.

Skor başlıkları:

- rota uygunluğu,
- bagaj uygunluğu,
- yakıt verimliliği,
- konfor,
- bütçe uyumu,
- risk seviyesi.

## 7. Recommendation Explainer Agent

Son öneriyi insanın anlayacağı şekilde açıklar.

Bu agent şunları üretir:

- kısa karar özeti,
- öneri gerekçeleri,
- alternatifler,
- risk uyarıları,
- “bu aracı seç / seçme” açıklaması.

---

# Skorlama Mantığı

Araç önerileri yalnızca LLM cevabına bırakılmaz. Her araç için deterministik bir skor hesaplanır, AI bu skoru açıklar.

Örnek skor formülü:

```text
Genel Skor =
Rota Uyumu x 0.25 +
Bagaj Uyumu x 0.20 +
Yakıt Verimliliği x 0.20 +
Bütçe Uyumu x 0.15 +
Konfor x 0.10 +
Hava/Yol Güvenliği x 0.10
```

Bu yapı teknik puanı güçlendirir çünkü proje sadece metin üretmez; karar algoritması kullanır.

---

# Örnek Demo Senaryosu

## Kullanıcı Girdisi

> “İstanbul’dan Rize Ayder Yaylası’na gideceğiz. 5 kişiyiz. 4 büyük valiz, 1 bebek arabası ve kamp ekipmanı var. Bütçem orta. Yakıt önemli ama yolda zorlanmak istemiyorum.”

## Sistem Analizi

- Yolculuk tipi: uzun yol + dağ/yayla yolu
- Kapasite ihtiyacı: yüksek
- Bagaj ihtiyacı: çok yüksek
- Yakıt hassasiyeti: yüksek
- Risk: düşük motor hacimli sedan/hatchback araçlarda performans ve bagaj riski

## Öneriler

### 1. En Dengeli Seçim: Peugeot 3008

- Genel skor: 88/100
- Güçlü yön: konfor, bagaj, rota uyumu
- Zayıf yön: fiyatı ekonomik modellere göre daha yüksek

### 2. En Ekonomik Seçim: Fiat Egea Cross

- Genel skor: 78/100
- Güçlü yön: yakıt ve fiyat
- Zayıf yön: tam dolu araçla yayla yollarında performans riski

### 3. En Güvenli/Konforlu Seçim: Dacia Duster 4x4

- Genel skor: 84/100
- Güçlü yön: bozuk yol ve yayla uyumu
- Zayıf yön: yakıt tüketimi daha yüksek olabilir

## Risk Uyarısı

> Bu rota için küçük hatchback araçlar önerilmez. 5 yolcu, 4 büyük valiz ve kamp ekipmanı nedeniyle bagaj kapasitesi ve motor performansı yetersiz kalabilir.

---

# Uygulama Ekranları

## 1. Akıllı Seyahat Girişi

- Tek doğal dil giriş alanı
- Tarih, kişi sayısı ve bütçe için hızlı seçimler
- “Ekonomi / Dengeli / Konfor / Outdoor” seyahat modu

## 2. Analiz Paneli

- Rota zorluğu
- Hava riski
- Bagaj ihtiyacı
- Yakıt hassasiyeti
- Toplam maliyet tahmini

## 3. Araç Öneri Kartları

Her kartta:

- araç adı,
- görsel,
- genel skor,
- güçlü yönler,
- zayıf yönler,
- tahmini yakıt maliyeti,
- neden önerildiği.

## 4. Karşılaştırma Tablosu

Araçlar şu başlıklarda karşılaştırılır:

- fiyat,
- yakıt,
- bagaj,
- konfor,
- rota uyumu,
- risk.

## 5. AI Açıklama ve Soru Cevap

Kullanıcı şunu sorabilir:

- “Neden daha ucuz aracı önermedin?”
- “Bu araçla yaylaya çıkmak riskli mi?”
- “Bagajım sığmazsa hangi alternatifi seçmeliyim?”

---

# Teknik Yapı

## Frontend

- Next.js
- TypeScript
- TailwindCSS
- Shadcn UI veya sade custom component yapısı

## Backend

- FastAPI veya Node.js
- REST API
- Araç skorlama servisi
- Agent orchestration servisi

## Yapay Zeka

- Gemini API veya OpenAI API
- Structured output / JSON mode
- RAG destekli araç bilgi tabanı
- Prompt chaining

## Agent Framework

- LangGraph veya sade custom workflow
- Her agent için ayrı görev tanımı
- Ortak karar objesi

## Harita ve Hava Verisi

- OpenRouteService veya Google Maps API
- OpenWeather API
- Demo için mock veri kullanılabilir

## Veritabanı

- Supabase veya Firebase
- Araç katalog tablosu
- Demo seyahat senaryoları
- Kullanıcı arama geçmişi

---

# Minimum Uygulanabilir Ürün

Hackathon süresinde yapılması gereken MVP:

## Zorunlu Özellikler

- Doğal dil seyahat girişi
- AI ile yapılandırılmış ihtiyaç çıkarımı
- En az 12 araçlık demo veri seti
- Araç skorlama algoritması
- 3 öneri modu: ekonomik, dengeli, konforlu
- Risk uyarısı
- Açıklanabilir öneri metni
- Araç karşılaştırma ekranı

## Opsiyonel Özellikler

- Canlı hava durumu API entegrasyonu
- Canlı rota API entegrasyonu
- Kiralama sitesi entegrasyonu
- Kullanıcı profili
- PDF seyahat/araç raporu

Hackathon için öncelik, çalışan ve anlaşılır MVP olmalıdır. Gerçek kiralama entegrasyonu şart değildir.

---

# Demo İçin Örnek Araç Veri Seti

Başlangıç veri setinde şu araçlar kullanılabilir:

- Fiat Egea
- Fiat Egea Cross
- Renault Clio
- Toyota Corolla
- Hyundai i20
- Peugeot 3008
- Dacia Duster
- Dacia Duster 4x4
- Volkswagen Passat
- Renault Megane
- Citroen C5 Aircross
- Ford Tourneo Courier

Her araç için tutulacak alanlar:

- sınıf,
- günlük fiyat,
- yakıt tüketimi,
- bagaj hacmi,
- koltuk sayısı,
- motor gücü,
- yol tipi uygunluğu,
- konfor skoru,
- outdoor skoru.

---

# Jüri Kriterlerine Göre Güçlendirme

## Kullanıcı Değeri

Gerçek bir tüketici problemi çözülür: kullanıcı hangi aracı seçmesi gerektiğini daha bilinçli anlar.

## Teknik Puan

Proje:

- agentic workflow,
- structured AI output,
- karar skorlama algoritması,
- veri tabanlı araç eşleştirme,
- harita/hava entegrasyonu

içerdiği için teknik olarak güçlü sunulabilir.

## Performans ve Doğruluk

LLM tek başına karar vermez. Önce deterministik skor hesaplanır, ardından AI bu kararı açıklar. Bu sayede cevaplar daha tutarlı olur.

## Agentic Yapılar

Her agent ayrı analiz üretir. Son karar, agent sonuçlarının birleşimiyle oluşur.

## Yenilikçilik ve Özgünlük

Klasik e-ticaret ürün önerisinin seyahat riski, rota ve maliyet bağlamıyla birleşmesi projeyi daha özgün yapar.

## Kullanıcı Dostu Çalışma

Kullanıcı uzun filtrelerle uğraşmaz. Seyahatini yazar, sistem karar destek raporu üretir.

## Sunum ve İletişim

Demo akışı çok nettir:

1. Kullanıcı karmaşık bir seyahat isteği yazar.
2. Agentlar ihtiyacı analiz eder.
3. Sistem 3 aracı skorlarla karşılaştırır.
4. Riskli seçenekleri açıklar.
5. Kullanıcı “neden?” sorusuna cevap alır.

---

# 1 Dakikalık Demo Video Akışı

## 0-10 Saniye

Problem gösterilir:

> “Araç kiralarken fiyatı görüyoruz ama aracın rotamıza, bagajımıza ve yol şartlarına uygun olup olmadığını bilmiyoruz.”

## 10-25 Saniye

Kullanıcı doğal dilde seyahat isteği girer.

## 25-40 Saniye

Agent analiz ekranı gösterilir:

- rota riski,
- hava riski,
- bagaj ihtiyacı,
- bütçe/yakıt analizi.

## 40-55 Saniye

Araç öneri kartları gösterilir:

- ekonomik,
- dengeli,
- güvenli/konforlu.

## 55-60 Saniye

Kapanış cümlesi:

> “RotaPilot AI, araç kiralamayı liste seçme deneyiminden çıkarıp açıklanabilir bir karar destek sistemine dönüştürür.”

---

# Sunum İçin Kısa Pitch

RotaPilot AI, kullanıcıların seyahat planlarına göre doğru kiralık aracı seçmesini sağlayan agentic AI destekli bir karar asistanıdır.

Kullanıcı sadece seyahatini doğal dille yazar. Sistem rota, hava, bagaj, bütçe ve araç özelliklerini ayrı agentlarla analiz eder. Sonuçta araçları yalnızca fiyata göre değil, gerçek kullanım uygunluğuna göre skorlar.

Bu sayede kullanıcı hangi aracı neden seçmesi gerektiğini, hangi araçların riskli olduğunu ve toplam maliyetin yaklaşık ne olacağını net şekilde görür.

---

# Sonuç

Bu fikir mevcut haliyle geliştirilebilir ve yarışma için güçlü bir ürüne dönüşebilir. Kazanma ihtimalini artırmak için projenin odağı “araç öneren chatbot” değil, “rota ve kullanım senaryosuna göre açıklanabilir araç seçimi yapan agentic karar motoru” olmalıdır.

En kritik başarı noktası şudur:

> Jüriye sadece güzel bir arayüz değil, AI agentların gerçekten analiz yaptığı ve kararın skorlarla açıklandığı çalışan bir demo gösterilmelidir.
