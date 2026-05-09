# Site Marka Kimliği Renk Paleti

Bu dosya, `prompts` klasöründeki Markdown dosyalarından çıkarılan marka kimliğine uygun renk paletini içerir.

## Marka Kimliği Analizi

Sitenin marka kimliği, AI destekli araç kiralama ve seyahat asistanı konsepti üzerine kurulu:
- **Modern, premium, temiz, akıcı, teknolojik ve güven veren** bir his.
- Kullanıcı deneyimi basit, etkileyici ve hızlı.
- AI odaklı, akıllı yolculuk planlama vurgusu.
- Seyahat temalı (rota, yol şartları, bagaj, bütçe).
- Güven ve karar destek sistemi ön planda.

## Çıkarılan Renk Paleti

`ai-trip-ui-design.md` dosyasındaki "Renk Paleti Önerisi" bölümünden şu renkler önerilmiş:

- **Koyu lacivert arka plan**: Güven, profesyonellik ve derinlik hissi verir. Seyahat ve teknoloji temalı siteler için ideal.
- **Beyaz / açık gri metin**: Temizlik, okunaklılık ve modernlik sağlar.
- **Mavi ve mor gradient detaylar**: Teknoloji ve AI vurgusu için. Mavi güven ve huzur, mor yenilik ve yaratıcılık temsil eder.
- **Yeşil uygunluk skorları**: Pozitif geri bildirim, doğa ve seyahat temasıyla uyumlu.
- **Turuncu risk uyarıları**: Dikkat çekici, uyarıcı ama korkutucu olmayan ton.

Bu temel renkleri genişleterek, site için tutarlı ve marka kimliğine uygun bir renk paleti oluşturulmuştur. Renkler Hex kodlarıyla belirtildi ve kullanım önerileri eklendi.

### Önerilen Renk Paleti

1. **Ana Renk (Primary)**: Koyu Lacivert (#1e3a8a)
   - Kullanım: Ana arka plan, header, navigasyon. Güven ve profesyonellik verir.

2. **İkincil Renk (Secondary)**: Mavi Gradient (#3b82f6 to #6366f1)
   - Kullanım: Butonlar, CTA'lar, vurgular. Teknoloji ve AI hissi sağlar. Gradient olarak kullanılırsa daha etkileyici olur.

3. **Vurgu Renk (Accent)**: Mor (#8b5cf6)
   - Kullanım: Detaylar, ikonlar, animasyonlar. Yenilik ve akıllı teknoloji vurgusu.

4. **Pozitif/Girişim Renk (Success)**: Yeşil (#10b981)
   - Kullanım: Uygunluk skorları, onay ikonları, olumlu geri bildirimler. Seyahat ve doğa temasıyla uyumlu.

5. **Uyarı Renk (Warning)**: Turuncu (#f97316)
   - Kullanım: Risk uyarıları, dikkat çekici bölümler. Korkutucu olmadan dikkat çeker.

6. **Metin ve Arka Plan Renkleri**:
   - Beyaz (#ffffff): Ana metin, kart arka planları.
   - Açık Gri (#f8fafc): İkincil metin, gölgeler.
   - Koyu Gri (#64748b): Alt metin, açıklamalar.

7. **Nötr Renkler (Neutral)**: Açık Gri Tonları (#e2e8f0, #cbd5e1)
   - Kullanım: Kart kenarları, ayırıcılar, soft shadow efektleri.

### Tasarım Önerileri

- **Gradient Kullanımı**: Mavi-mor gradient'i butonlarda ve hero alanında kullanın. Örneğin, "Seyahatimi Planla" butonu için.
- **Kontrast ve Erişilebilirlik**: Beyaz metin koyu lacivert arka planda yüksek kontrast sağlar. Erişilebilirlik için WCAG standartlarına uyun.
- **Tema Tutarlılığı**: Tüm renkler seyahat ve teknoloji temasıyla uyumlu. Koyu lacivert güven, mavi/mor AI, yeşil olumlu, turuncu uyarı.
- **TailwindCSS Entegrasyonu**: Projenizde Tailwind kullandığınız için, bu renkleri `tailwind.config.ts` dosyasına ekleyebilirsiniz (örneğin, `primary: '#1e3a8a'`).

Bu palet, sitenin modern ve güven veren marka kimliğini güçlendirecek.