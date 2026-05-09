# AI Destekli Akıllı Araç Kiralama ve Seyahat Asistanı

## Proje Özeti

Bu proje, kullanıcıların seyahat planlarına göre en uygun kiralık aracı seçmelerine yardımcı olan yapay zeka destekli bir araç öneri sistemidir.

Sistem;
- gidilecek rota,
- yol şartları,
- kişi sayısı,
- bagaj miktarı,
- bütçe,
- konfor beklentisi,
- yakıt tüketimi

gibi parametreleri analiz ederek kullanıcıya en uygun araçları önerir.

Amaç, klasik araç kiralama sitelerindeki karmaşık filtreleme sistemini daha akıllı, kullanıcı dostu ve karar verme odaklı hale getirmektir.

---

# Problem

Mevcut araç kiralama platformlarında kullanıcılar:

- Hangi aracın ihtiyaçlarına uygun olduğunu bilememektedir.
- Araçların bagaj kapasitesini gerçek kullanım senaryosuna göre değerlendirememektedir.
- Uzun yol, dağ yolu veya şehir içi kullanım için doğru araç seçmekte zorlanmaktadır.
- Yakıt tüketimi ve toplam maliyet konusunda yeterince bilgi sahibi değildir.
- Çok fazla seçenek arasında kararsız kalmaktadır.

Bu durum kullanıcı deneyimini zorlaştırmakta ve yanlış araç seçimlerine neden olmaktadır.

---

# Çözüm

Geliştirilen sistem, kullanıcının seyahat bilgilerini analiz ederek yapay zeka yardımıyla araç önerileri sunar.

Kullanıcıdan alınan bilgiler:

- Başlangıç ve varış noktası
- Seyahat rotası
- Yol tipi ve hava şartları
- Kişi sayısı
- Bagaj boyutu ve ağırlığı
- Bütçe
- Öncelik (ekonomi / konfor / performans)

AI sistemi bu verileri analiz ederek:

- uygun araç önerileri,
- alternatif seçenekler,
- yakıt tahmini,
- bagaj uygunluğu,
- rota uyumluluğu,
- maliyet analizi

sunmaktadır.

---

# Örnek Kullanım Senaryosu

Kullanıcı şu bilgileri girer:

- İstanbul → Rize Yayla Turu
- 5 kişi
- 4 büyük valiz
- Kamp ekipmanları
- Yakıt önemli
- Dağ yollarında zorlanmamalı

Sistem çıktısı:

## Ekonomik Öneri
- Fiat Egea Cross
- Düşük yakıt tüketimi
- Bagaj kapasitesi yeterli
- Hafif arazi koşullarına uygun

## Konfor Odaklı Öneri
- Peugeot 3008
- Uzun yol konforu yüksek
- Geniş iç hacim
- Daha güçlü motor

## Risk Analizi
- Küçük hatchback araçlar önerilmez.
- Dik yayla yollarında düşük motor hacmi zorlayabilir.

---

# Yapay Zeka Kullanımı

Projede yapay zeka yalnızca chatbot olarak değil, karar destek sistemi olarak kullanılmaktadır.

## AI Görevleri

- Kullanıcı ihtiyaç analizi
- Doğal dil işleme
- Araç eşleştirme
- Yol ve rota analizi
- Bagaj uygunluk analizi
- Yakıt ve maliyet tahmini
- Açıklamalı öneri üretimi

---

# Agentic Yapı

Projede çoklu agent mimarisi kullanılacaktır.

## 1. Route Analysis Agent
- Rota analizi
- Yol tipi belirleme
- Eğimli yolları analiz etme
- Uzun yol değerlendirmesi

## 2. Weather Agent
- Hava durumu kontrolü
- Yağış ve kar riski analizi

## 3. Passenger & Luggage Agent
- Kişi sayısı analizi
- Bagaj kapasitesi değerlendirmesi

## 4. Budget Agent
- Ekonomik analiz
- Yakıt maliyeti hesaplama

## 5. Recommendation Agent
- En uygun araçları seçme
- Sebepleriyle açıklama üretme

---

# Yenilikçi Özellikler

## Explainable AI
Sistem yalnızca araç önermek yerine neden önerdiğini de açıklar.

Örneğin:

- “Bu araç düşük yakıt tüketimi nedeniyle önerildi.”
- “Bagaj kapasitesi kamp ekipmanları için uygundur.”
- “Dağ yolları için motor gücü yeterlidir.”

---

## Akıllı Risk Analizi
Sistem kullanıcıyı yanlış seçimler konusunda uyarabilir.

Örneğin:

- “Bu rota için düşük motor hacmi yetersiz kalabilir.”
- “Bagaj kapasitesi yetersiz olabilir.”

---

## Seyahat Modları
Kullanıcı önceliğine göre farklı öneriler sunulur:

- Ekonomik
- Konfor
- Performans
- Kalabalık Aile
- Kamp / Outdoor

---

# Teknik Yapı

## Frontend
- Next.js
- TailwindCSS

## Backend
- FastAPI / Node.js

## Yapay Zeka
- Gemini API

## Agent Framework
- LangChain
- LangGraph

## Harita ve Rota
- Google Maps API
- OpenRouteService

## Veritabanı
- Firebase / Supabase

---

# Kullanıcı Dostu Tasarım

Sistem basit ve anlaşılır bir arayüz ile çalışacaktır.

Kullanıcı:
- uzun formlar doldurmak yerine doğal dil ile istek yazabilir.
- araçları karşılaştırabilir.
- önerilerin neden yapıldığını görebilir.

---

# Projenin Güçlü Yönleri

- Gerçek hayat problemi çözmesi
- AI kullanımının anlamlı olması
- Çoklu agent mimarisi
- Uygulanabilir ve geliştirilebilir olması
- Güçlü demo potansiyeli
- Kullanıcı dostu deneyim sunması

---

# Gelecekteki Geliştirmeler

- Gerçek zamanlı araç kiralama entegrasyonu
- Otel öneri sistemi
- Yakıt fiyat analizi
- Trafik yoğunluğu analizi
- Kamp alanı önerileri
- AI destekli rota optimizasyonu

---

# Sonuç

Bu proje, klasik araç kiralama deneyimini yapay zeka destekli akıllı bir seyahat asistanına dönüştürmeyi hedeflemektedir.

Sistem yalnızca araç listelemek yerine:
- kullanıcı ihtiyacını anlamakta,
- seyahat koşullarını analiz etmekte,
- açıklamalı ve mantıklı öneriler sunmaktadır.

Bu sayede kullanıcılar daha doğru, ekonomik ve konforlu araç seçimleri yapabilmektedir.