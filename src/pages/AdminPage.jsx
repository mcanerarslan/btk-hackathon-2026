import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  buildCatalogSuggestions,
  findRiskyMatches,
  findVehicleDataGaps,
  generateAdminInsightCategory,
} from "../services/adminExpertService";
import { useTrip } from "../TripContext";

const dashboardInsightCards = [
  { key: "dataGaps", label: "Eksik veri", fallback: findVehicleDataGaps, emptyTitle: "Kritik eksik yok", emptyText: "Katalog verileri demo için yeterli görünüyor." },
  { key: "riskyMatches", label: "Riskli eşleşme", fallback: findRiskyMatches, emptyTitle: "Risk düşük", emptyText: "Aktif rota için katalog dengeli." },
  { key: "suggestions", label: "Geliştirme önerisi", fallback: buildCatalogSuggestions, emptyTitle: "Öneri yok", emptyText: "Katalog ve filtre yapısı dengeli görünüyor." },
];

function AdminInsightSummaryCard({ card, insight, loading, onRefresh }) {
  const firstItem = insight.items[0];

  return (
    <article className="admin-insight-card glass">
      <div className="admin-insight-head">
        <div>
          <span className="eyebrow">{card.label}</span>
          <h3>{firstItem?.title || card.emptyTitle}</h3>
        </div>
        <button className="secondary-btn admin-refresh-btn" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "AI tarıyor" : "Yenile"}
        </button>
      </div>
      <p>{firstItem?.text || card.emptyText}</p>
      <p className="admin-insight-meta">
        {insight.source === "gemini" ? "Gemini buldu" : "Yerel analiz"}{insight.updatedAt ? ` · ${insight.updatedAt}` : ""}
      </p>
    </article>
  );
}

export function AdminPage() {
  const { vehicles, ranked, state, aiRequestLog, geminiStatus, reservations, updateReservationStatus } = useTrip();
  const gaps = findVehicleDataGaps(vehicles);
  const risks = findRiskyMatches(vehicles, state);
  const suggestions = buildCatalogSuggestions(vehicles);
  const [dashboardInsights, setDashboardInsights] = useState({});
  const [insightLoading, setInsightLoading] = useState({});
  const fallbackDashboardInsights = useMemo(
    () =>
      Object.fromEntries(
        dashboardInsightCards.map((card) => [
          card.key,
          { items: card.fallback(vehicles, state), source: "fallback", updatedAt: "" },
        ]),
      ),
    [vehicles, state],
  );
  const averageScore = ranked.length
    ? Math.round(ranked.reduce((total, item) => total + item.score, 0) / ranked.length)
    : 0;

  const refreshInsight = async (type) => {
    setInsightLoading((current) => ({ ...current, [type]: true }));
    const result = await generateAdminInsightCategory(type, vehicles, state);
    setDashboardInsights((current) => ({ ...current, [type]: result }));
    setInsightLoading((current) => ({ ...current, [type]: false }));
  };

  useEffect(() => {
    dashboardInsightCards.forEach((card) => {
      refreshInsight(card.key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h2>Operasyonel DriveWise dashboard</h2>
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
        {dashboardInsightCards.map((card) => (
          <AdminInsightSummaryCard
            key={card.key}
            card={card}
            insight={dashboardInsights[card.key] || fallbackDashboardInsights[card.key]}
            loading={Boolean(insightLoading[card.key])}
            onRefresh={() => refreshInsight(card.key)}
          />
        ))}
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
