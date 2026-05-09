import { useTrip } from "../TripContext";
import { analysisStages, comparisonMetrics, formatComparisonValue } from "../data";

export function AnalysisPage() {
  const { analysisVisible, analysisStep, analysisStatus, analysisSnippet, ranked, state, buildRiskWarnings } = useTrip();
  const top = ranked[0]?.vehicle;
  const totalPassengers = state.adults + state.children;
  const luggageNeed = state.largeBags * 3 + state.mediumBags * 2 + state.backpacks;
  const progress = `${((analysisStep + 1) / analysisStages.length) * 100}%`;

  if (!analysisVisible) {
    return (
      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">AI analiz ekranı</span>
          <h2>Önce formu tamamla, sonra analiz ekranını aç.</h2>
          <p>Planner sayfasına gidip akışı başlatınca bu sayfa canlı analiz ve önerileri gösterir.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="analysis" className="section analysis reveal">
        <div className="section-heading">
          <span className="eyebrow">AI analiz ekranı</span>
          <h2>Sistem yol, bagaj ve bütçeyi birlikte değerlendiriyor.</h2>
        </div>
        <div className="analysis-shell">
          <div className="analysis-track glass">
            <div className="analysis-progress">
              <span style={{ width: progress }} />
            </div>
            <div className="analysis-steps">
              {analysisStages.map((label, index) => {
                const classes = ["analysis-step"];
                if (index < analysisStep) classes.push("done");
                if (index === analysisStep) classes.push("active");
                return (
                  <div key={label} className={classes.join(" ")}>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="analysis-map glass">
            <div className="analysis-map-header">
              <strong>Rota üzerinde AI aracın ilerliyor</strong>
              <span>{analysisStatus}</span>
            </div>
            <div className="analysis-route">
              <div className="analysis-node" />
              <div className="analysis-line" />
              <div className="analysis-node end" />
              <div className="analysis-car">🚙</div>
            </div>
            <div className="analysis-snippet">{analysisSnippet}</div>
          </div>
        </div>
      </section>

      <section className="section results reveal">
        <div className="section-heading">
          <span className="eyebrow">Araç önerileri</span>
          <h2>3 ana seçenek hazır.</h2>
        </div>
        <div className="recommendation-grid">
          {ranked.map((item, index) => {
            const highlight = index === 0 ? "En uygun" : index === 1 ? "Alternatif" : "Konforlu";
            return (
              <article key={item.vehicle.id} className="recommendation-card">
                <div className="badge">{highlight}</div>
                <div className="vehicle-visual" style={{ marginBottom: 14 }}>
                  {item.vehicle.imageUrl ? (
                    <img
                      src={item.vehicle.imageUrl}
                      alt={item.vehicle.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }}
                    />
                  ) : (
                    item.vehicle.emoji
                  )}
                </div>
                <h3>
                  {item.vehicle.emoji} {item.vehicle.name}
                </h3>
                <div className="score">{item.score}/100 AI uygunluk</div>
                <div className="recommendation-specs">
                  <div className="spec-row">
                    <span>Segment</span>
                    <strong>{item.vehicle.segment}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Günlük fiyat</span>
                    <strong>₺{item.vehicle.price}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Yakıt</span>
                    <strong>{item.vehicle.fuel}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Bagaj</span>
                    <strong>{item.vehicle.luggage} L</strong>
                  </div>
                  <div className="spec-row">
                    <span>Kapasite</span>
                    <strong>{item.vehicle.seats} kişi</strong>
                  </div>
                </div>
                <p className="details">{item.vehicle.notes}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section explain reveal">
        <div className="decision-panel glass">
          <div>
            <span className="eyebrow">Açıklamalı AI karar alanı</span>
            <h2>{top ? `${top.name} neden öne çıktı?` : "Neden bu araç önerildi?"}</h2>
            <p>
              Bu rota için {totalPassengers} yolcu ve yaklaşık {luggageNeed} parça eşdeğeri bagaj
              hesaplandı. {top?.name} bagaj ve yolcu dengesini korurken {state.routeType} rota için
              daha güvenli ve dengeli bir seçenek sundu.
            </p>
          </div>
          <div className="decision-tags">
            <span>Rota: {state.routeType}</span>
            <span>Öncelik: {state.priority}</span>
            <span>Bagaj: {luggageNeed} eşdeğer</span>
            <span>Yolcu: {totalPassengers}</span>
          </div>
        </div>
        <div className="risk-panel glass">
          <div className="risk-head">
            <span className="eyebrow">Risk ve uyarılar</span>
            <strong>Güven veren ama dürüst analiz</strong>
          </div>
          <ul className="risk-list">
            {top && buildRiskWarnings(top, state).map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      </section>

      <section className="section compare reveal">
        <div className="section-heading">
          <span className="eyebrow">Araç karşılaştırma</span>
          <h2>Kriter bazlı tablo</h2>
        </div>
        <div className="compare-table-wrap glass">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Kriter</th>
                <th>{ranked[0]?.vehicle.name}</th>
                <th>{ranked[1]?.vehicle.name}</th>
                <th>{ranked[2]?.vehicle.name}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonMetrics.map(([label, key]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{formatComparisonValue(ranked[0]?.vehicle[key], key)}</td>
                  <td>{formatComparisonValue(ranked[1]?.vehicle[key], key)}</td>
                  <td>{formatComparisonValue(ranked[2]?.vehicle[key], key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
