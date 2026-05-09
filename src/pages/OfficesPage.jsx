export function OfficesPage() {
  return (
    <section id="offices" className="section offices reveal">
      <div className="section-heading">
        <span className="eyebrow">Ofisler</span>
        <h2>Şehir bazlı teslim alma noktaları.</h2>
      </div>
      <div className="office-grid">
        {[
          ["İstanbul Havalimanı", "7/24 teslim alma, hızlı çıkış noktası."],
          ["Ankara Merkez", "Şehir içi teslim ve iade kolaylığı."],
          ["İzmir Alsancak", "Sahil rotaları için pratik erişim."],
        ].map(([title, text]) => (
          <article key={title} className="office-card glass">
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
