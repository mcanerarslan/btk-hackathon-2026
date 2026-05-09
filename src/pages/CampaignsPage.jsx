export function CampaignsPage() {
  return (
    <section id="campaigns" className="section campaigns reveal">
      <div className="section-heading">
        <span className="eyebrow">Kampanyalar</span>
        <h2>Sezonluk fırsatlar ve AI önerileri.</h2>
      </div>
      <div className="promo-grid">
        {[
          ["Yaz rotaları", "%20 indirimli SUV seçkisi", "Uzun yol ve aile kullanımına uygun araçlar."],
          ["Hafta sonu", "Kompakt araçlarda düşük fiyat", "Şehir içi ve kısa mesafe planları için."],
          ["Outdoor", "Kamp paketleri", "Bagaj hacmi ve yol dayanımı öncelikli seçimler."],
        ].map(([title, big, text]) => (
          <article key={title} className="promo-card glass">
            <span>{title}</span>
            <strong>{big}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
