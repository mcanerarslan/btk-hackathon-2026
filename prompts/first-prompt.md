Bu projeyi geliştirirken temel referans sırası şu olmalı:

1. `site-yapısı.md`
2. `site-structure-ui-spec.md`
3. `renk-paleti.md`

Çakışma olursa öncelik sırası:

1. `site-yapısı.md`
2. `site-structure-ui-spec.md`
3. `renk-paleti.md`

Önemli kısıt:

Bu projede LLM kullanılacaksa yalnızca Google Gemini modelleri ve Gemini API kullanılabilir. OpenAI, Anthropic veya farklı LLM sağlayıcıları kullanılmamalıdır.

Markdown dosyalarındaki proje fikrine bağlı kal:

- AI destekli araç kiralama ve seyahat asistanı
- rota, yol şartları, kişi sayısı, bagaj bilgisi, bütçe ve konfor beklentisine göre araç önerisi
- ekonomik / konfor / performans odaklı öneriler
- açıklamalı AI kararları
- agentic yapı mantığı

Projenin hedef deneyimi:

- modern, premium, güven veren araç kiralama platformu
- AI destekli araç bulma deneyimi ana odakta
- klasik şekilde araç gezebilme, filtreleme ve detay görme desteği
- sol altta sabit AI widget
- login/register zorunlu değil

Projeyi parçalara ayırarak geliştir:

1. Global layout, header ve footer
2. Ana sayfa ve hero alanı
3. AI araç bulma akışı
4. Araç listeleme ve filtreleme
5. Araç detay sayfası
6. AI analiz ve öneri ekranı
7. Karşılaştırma ve risk alanları
8. Sol alt AI widget

Tasarım yönlendirmesi:

- koyu lacivert arka plan
- mavi ve mor gradient detaylar
- beyaz / açık gri metin
- yeşil uygunluk skorları
- turuncu risk uyarıları
- rounded kartlar
- soft shadow
- glassmorphism alanlar
- gradient butonlar
- minimal ikonlar
- geniş boşluklar
- büyük ve okunabilir typography
- responsive davranış zorunlu

Teknik beklentiler:

- Temiz ve anlaşılır kod yaz
- Modüler dosya yapısı kur
- Gereksiz karmaşıklıktan kaçın
- MVP odaklı ilerle
- Önce çalışan temel sürümü çıkar
- Daha sonra agentic yapı, risk analizi ve gelişmiş öneriler eklenebilir

LLM entegrasyonu için:

- Sadece Gemini API kullan
- API anahtarını `.env` dosyasından oku
- Kod içine API key yazma
- Gemini çağrılarını ayrı bir servis/modül içinde tut
- Model çıktısını kullanıcıya açıklamalı öneri olarak göster

Uygulama önceliği:

1. Layout yapısı
2. Header/Footer
3. Ana sayfa
4. Araçlar sayfası
5. Araç detay sayfası
6. AI araç bulma sayfası
7. Floating AI widget
8. Responsive ve animasyonlar

Amaç:

Bu proje hackathon için hazırlanıyor. Ürün gerçek bir problemi çözmeli, kullanıcı dostu olmalı ve sunumda kolayca demo edilebilmelidir.

İstenen çıktı:

- önce basit ama çalışan bir demo geliştir
- sonra geliştirme adımlarını öner
