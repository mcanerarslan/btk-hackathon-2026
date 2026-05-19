export function ServicesPage() {
  return (
    <section id="services" className="section services reveal">
      <div className="section-heading">
        <span className="eyebrow">Hizmetler</span>
        <h2>DriveWise ile ek seçenekler de görünür.</h2>
      </div>
      <div className="service-grid">
        {["Ek sürücü", "Çocuk koltuğu", "Sigorta paketleri", "Uzun dönem kiralama", "Kamp / outdoor paketleri"].map(
          (title) => (
            <article key={title} className="service-card glass">
              {title}
            </article>
          ),
        )}
      </div>
    </section>
  );
}
