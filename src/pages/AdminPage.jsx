import { Link } from "react-router-dom";
import { buildCatalogSuggestions, findRiskyMatches, findVehicleDataGaps } from "../services/adminExpertService";
import { useTrip } from "../TripContext";

export function AdminPage() {
  const { vehicles, ranked, state, aiRequestLog, geminiStatus, reservations, updateReservationStatus } = useTrip();
  const gaps = findVehicleDataGaps(vehicles);
  const risks = findRiskyMatches(vehicles, state);
  const suggestions = buildCatalogSuggestions(vehicles);
  const averageScore = ranked.length
    ? Math.round(ranked.reduce((total, item) => total + item.score, 0) / ranked.length)
    : 0;

  const stats = [
    ["Toplam araç", vehicles.length],
    ["Aktif araç", vehicles.length],
    ["En çok önerilen", ranked[0]?.vehicle.name || "-"],
    ["Ort. AI skoru", `${averageScore}/100`],
    ["Riskli rota uyarısı", risks.length],
    ["Rezervasyon talebi", reservations.length],
    ["AI analiz kaydı", aiRequestLog.length],
    ["Eksik veri", gaps.length],
  ];

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">Admin özet</span>
        <h2>Operasyonel rent a car dashboard</h2>
        <p>Katalog sağlığı, rota riskleri ve Gemini destekli karar noktaları tek ekranda izlenir.</p>
      </div>

      <div className="hero-stats admin-stats dense">
        {stats.map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <article className="gemini-card gemini-border admin-dashboard-card">
          <span className="eyebrow">Gemini bağlantısı</span>
          <h3>{geminiStatus.provider}</h3>
          <div className="vehicle-specs">
            <div className="metric-row">
              <span>Model</span>
              <strong>{geminiStatus.model}</strong>
            </div>
            <div className="metric-row">
              <span>Durum</span>
              <strong>{geminiStatus.hasApiKey ? "API key bulundu" : "Fallback aktif"}</strong>
            </div>
          </div>
          <Link className="primary-btn" to="/admin/ai">
            Gemini Uzman paneli
          </Link>
        </article>

        <article className="admin-dashboard-card glass">
          <span className="eyebrow">En güçlü öneriler</span>
          <div className="admin-mini-list">
            {ranked.map((item) => (
              <div key={item.vehicle.id} className="admin-mini-row">
                <strong>{item.vehicle.name}</strong>
                <span>{item.score}/100</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-dashboard-card glass">
          <span className="eyebrow">Aksiyonlar</span>
          <div className="admin-rail-links">
            <Link className="admin-rail-link" to="/admin/vehicles">Araç ekle/düzenle</Link>
            <Link className="admin-rail-link" to="/admin/site">Site metinleri</Link>
            <Link className="admin-rail-link" to="/vehicles">Kullanıcı katalog görünümü</Link>
          </div>
        </article>
      </div>

      <div className="admin-ai-grid three">
        <article className="admin-insight-card glass">
          <span className="eyebrow">Eksik veri</span>
          <h3>{gaps[0]?.title || "Kritik eksik yok"}</h3>
          <p>{gaps[0]?.text || "Katalog verileri demo için yeterli görünüyor."}</p>
        </article>
        <article className="admin-insight-card glass">
          <span className="eyebrow">Riskli eşleşme</span>
          <h3>{risks[0]?.title || "Risk düşük"}</h3>
          <p>{risks[0]?.text || "Aktif rota için katalog dengeli."}</p>
        </article>
        <article className="admin-insight-card glass">
          <span className="eyebrow">Geliştirme önerisi</span>
          <h3>{suggestions[0]?.title}</h3>
          <p>{suggestions[0]?.text}</p>
        </article>
      </div>

      <div className="admin-insight-card glass" style={{ marginTop: 18 }}>
        <div className="section-heading compact">
          <span className="eyebrow">Müşteri talepleri</span>
          <h3>Rezervasyon takip masası</h3>
        </div>
        <div className="admin-reservation-list">
          {reservations.length ? (
            reservations.map((reservation) => (
              <article key={reservation.id} className="admin-reservation-row">
                <div>
                  <strong>{reservation.customerName}</strong>
                  <p>
                    {reservation.vehicleName} · {reservation.route} · {reservation.passengers} kişi
                  </p>
                  <span>{reservation.createdAt}</span>
                </div>
                <div className="admin-reservation-meta">
                  <span>{reservation.status}</span>
                  <strong>₺{Number(reservation.dailyPrice).toLocaleString("tr-TR")}/gün</strong>
                </div>
                <select
                  value={reservation.status}
                  onChange={(event) => updateReservationStatus(reservation.id, event.target.value)}
                  aria-label={`${reservation.customerName} talep durumu`}
                >
                  <option>Yeni talep</option>
                  <option>Arandı</option>
                  <option>Ön onay</option>
                  <option>Tamamlandı</option>
                  <option>İptal</option>
                </select>
              </article>
            ))
          ) : (
            <p className="analysis-snippet">
              Henüz talep yok. Araç detay sayfasındaki rezervasyon formu ile canlı demo kaydı
              oluşturabilirsin.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
