import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  buildRiskWarnings,
  buildVehicleSummary,
  getVehicleTechnicalBars,
} from "../data";
import { useTrip } from "../TripContext";

export function VehicleDetailPage() {
  const { vehicleId } = useParams();
  const { vehicles, state, askGemini } = useTrip();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [compareId, setCompareId] = useState(null);
  const compareRef = useRef(null);
  const vehicle = vehicles.find((item) => item.id === vehicleId);

  const similarVehicles = useMemo(() => {
    if (!vehicle) return [];
    return vehicles
      .filter((item) => item.id !== vehicle.id)
      .map((item) => {
        let score = 0;
        if (item.category === vehicle.category) score += 4;
        if (item.segmentTag === vehicle.segmentTag) score += 3;
        if (Math.abs(item.price - vehicle.price) < 1000) score += 2;
        if (Math.abs(item.comfort - vehicle.comfort) <= 2) score += 1;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => entry.item);
  }, [vehicle, vehicles]);

  const compareVehicle = useMemo(() => {
    if (!compareId) return null;
    return vehicles.find((item) => item.id === compareId) || null;
  }, [compareId, vehicles]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!vehicle) {
    return <Navigate to="/vehicles" replace />;
  }

  const summary = vehicle.aiSummary || buildVehicleSummary(vehicle);
  const warnings = buildRiskWarnings(vehicle, state);
  const routeText = vehicle.routeFit.join(" · ");
  const bars = getVehicleTechnicalBars(vehicle);

  const handleAiInsight = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiInsight("Gemini yanıtlıyor...");

    const prompt = [
      `${vehicle.name} aracını bu seyahat için değerlendir.`,
      "Kısa ama açıklayıcı ol.",
      "Artıları, eksileri ve bu rota için uygunluğunu söyle.",
      "Varsa net bir öneri ver.",
      `Araç bilgisi: segment ${vehicle.segment}, fiyat ₺${vehicle.price}, yakıt ${vehicle.fuel}, tüketim ${vehicle.consumption} L/100km, bagaj ${vehicle.luggage} L, koltuk ${vehicle.seats}, konfor ${vehicle.comfort}/10, performans ${vehicle.performance}/10.`,
    ].join(" ");

    const reply = await askGemini(prompt, {
      state,
      topVehicle: vehicle,
      currentRoute: `${state.fromCity} → ${state.toCity}`,
      showInWidget: false,
    });

    setAiInsight(reply || "Gemini yanıtı alınamadı.");
    setAiLoading(false);
  };

  const galleryShots = [
    {
      title: "Ana görünüm",
      image: vehicle.imageUrl,
      fallback: vehicle.emoji,
    },
    {
      title: "Konfor odağı",
      image: vehicle.imageUrl,
      fallback: "✨",
    },
    {
      title: "Bagaj alanı",
      image: vehicle.imageUrl,
      fallback: "🧳",
    },
    {
      title: "Yol profili",
      image: vehicle.imageUrl,
      fallback: "🛣️",
    },
  ];

  const priceTimeline = Array.from({ length: 7 }, (_, index) => {
    const offset = [-0.03, -0.01, 0.04, 0.08, 0.02, -0.02, 0.06][index];
    const price = Math.round(vehicle.price * (1 + offset));
    return {
      label: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][index],
      price,
      best: price === Math.min(...Array.from({ length: 7 }, (_, i) => Math.round(vehicle.price * (1 + [-0.03, -0.01, 0.04, 0.08, 0.02, -0.02, 0.06][i])))),
    };
  });

  return (
    <section className="section reveal">
      <div className="section-heading">
        <span className="eyebrow">Araç detayı</span>
        <h2>{vehicle.name}</h2>
        <p>{summary}</p>
      </div>

      <div className="detail-layout">
        <div className="detail-main glass">
          <div
            className="vehicle-hero-image vehicle-clickable"
            role="button"
            tabIndex={0}
            onClick={() => setLightboxIndex(0)}
            onKeyDown={(event) => event.key === "Enter" && setLightboxIndex(0)}
          >
            {vehicle.imageUrl ? (
              <img src={vehicle.imageUrl} alt={vehicle.name} />
            ) : (
              <div className="vehicle-hero-fallback">{vehicle.emoji}</div>
            )}
          </div>

          <div className="chip-row" style={{ marginTop: 18 }}>
            <span className="chip active">{vehicle.segment}</span>
            <span className="chip">{vehicle.fuel}</span>
            <span className="chip">{routeText}</span>
          </div>

          <div className="analysis-snippet" style={{ marginTop: 14 }}>
            {summary}
          </div>

          <div className="detail-gallery">
            {galleryShots.map((shot, index) => (
              <article
                key={shot.title}
                className="detail-gallery-card vehicle-clickable"
                role="button"
                tabIndex={0}
                onClick={() => setLightboxIndex(index)}
                onKeyDown={(event) => event.key === "Enter" && setLightboxIndex(index)}
              >
                <div className="detail-gallery-media">
                  {shot.image ? (
                    <img src={shot.image} alt={shot.title} />
                  ) : (
                    <div className="detail-gallery-fallback">{shot.fallback}</div>
                  )}
                </div>
                <strong>{shot.title}</strong>
              </article>
            ))}
          </div>
        </div>

        <aside className="detail-side">
          <div className="analysis-track glass">
            <div className="analysis-steps">
              <div className="analysis-step active">AI özet</div>
              <div className="analysis-step">Teknik veriler</div>
              <div className="analysis-step">Uyumluluk</div>
              <div className="analysis-step">Risk notları</div>
            </div>
          </div>

          <div className="detail-card glass">
            <h3>Teknik Bilgiler</h3>
            <div className="vehicle-specs">
              <div className="metric-row">
                <span>Günlük fiyat</span>
                <strong>₺{vehicle.price}</strong>
              </div>
              <div className="metric-row">
                <span>Yakıt tüketimi</span>
                <strong>{vehicle.consumption} L/100km</strong>
              </div>
              <div className="metric-row">
                <span>Bagaj hacmi</span>
                <strong>{vehicle.luggage} L</strong>
              </div>
              <div className="metric-row">
                <span>Kişi kapasitesi</span>
                <strong>{vehicle.seats} kişi</strong>
              </div>
              <div className="metric-row">
                <span>Konfor</span>
                <strong>{vehicle.comfort}/10</strong>
              </div>
              <div className="metric-row">
                <span>Performans</span>
                <strong>{vehicle.performance}/10</strong>
              </div>
            </div>
          </div>

          <div className="detail-card glass">
            <div className="detail-actions">
              <button className="primary-btn" type="button" onClick={handleAiInsight}>
                AI ile yorumla
              </button>
            </div>
            {aiOpen ? <p className="analysis-snippet">{aiLoading ? "Gemini yanıtlıyor..." : aiInsight}</p> : null}
          </div>

          <div className="detail-card glass">
            <h3>AI Uyumluluk</h3>
            <p className="details">{vehicle.notes}</p>
            <div className="decision-tags" style={{ marginTop: 14 }}>
              <span>Şehir içi</span>
              <span>Uzun yol</span>
              <span>Outdoor</span>
            </div>
            <ul className="risk-list" style={{ marginTop: 18 }}>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="detail-bars glass" style={{ marginTop: 18 }}>
        <div className="section-heading" style={{ marginBottom: 12 }}>
          <span className="eyebrow">Teknik özellik karşılaştırma barları</span>
          <h3 style={{ margin: 0 }}>Bu araç nasıl konumlanıyor?</h3>
        </div>
        <div className="bar-list">
          {bars.map((bar) => (
            <div key={bar.label} className="bar-row">
              <div className="bar-labels">
                <span>{bar.label}</span>
                <strong>%{bar.value}</strong>
              </div>
              <div className="bar-track has-tooltip" data-tip={bar.tip}>
                <span style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={compareRef} id="compare-section" className="detail-related" style={{ marginTop: 18 }}>
        <div className="section-heading">
          <span className="eyebrow">Benzer araçlar</span>
          <h3 style={{ margin: 0 }}>Alternatif ürünler</h3>
        </div>
        <div className="vehicle-grid">
          {similarVehicles.map((item) => (
            <article key={item.id} className="vehicle-card">
              <div className="vehicle-visual">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }}
                  />
                ) : (
                  item.emoji
                )}
              </div>
              <div className="badge">{item.segment}</div>
              <h3>{item.name}</h3>
              <p className="details">{item.aiSummary || buildVehicleSummary(item)}</p>
              <div className="vehicle-specs">
                <div className="metric-row">
                  <span>Fiyat</span>
                  <strong>₺{item.price}/gün</strong>
                </div>
                <div className="metric-row">
                  <span>Yakıt</span>
                  <strong>{item.fuel}</strong>
                </div>
              </div>
              <div className="planner-actions" style={{ marginTop: 14 }}>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setCompareId(item.id);
                    window.setTimeout(() => {
                      document.getElementById("compare-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 0);
                  }}
                >
                  Karşılaştır
                </button>
                <Link className="primary-btn" to={`/vehicles/${item.id}`}>
                  İncele
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div id="compare-area" className="detail-bars glass" style={{ marginTop: 18 }}>
        <div className="section-heading" style={{ marginBottom: 12 }}>
          <span className="eyebrow">Karşılaştırma alanı</span>
          <h3 style={{ margin: 0 }}>Seçilen araçla hızlı kıyas</h3>
        </div>
        {compareVehicle ? (
          <div className="detail-compare-grid">
            <article className="compare-card">
              <strong>{vehicle.name}</strong>
              <p>{summary}</p>
            </article>
            <article className="compare-card">
              <strong>{compareVehicle.name}</strong>
              <p>{compareVehicle.aiSummary || buildVehicleSummary(compareVehicle)}</p>
            </article>
          </div>
        ) : (
          <p className="analysis-snippet">Benzer araçlardan “Karşılaştır” butonuna basarak iki aracı yan yana görebilirsin.</p>
        )}
      </div>

      <div className="planner-actions" style={{ marginTop: 20 }}>
        <Link className="secondary-btn" to="/vehicles">
          Araçlara Dön
        </Link>
        <Link className="primary-btn" to="/planner">
          Bu araç bana uygun mu? AI&apos;a sor
        </Link>
      </div>

      {lightboxIndex !== null ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button className="lightbox-close" type="button" onClick={() => setLightboxIndex(null)}>
              ×
            </button>
            <button
              className="lightbox-nav left"
              type="button"
              onClick={() => setLightboxIndex((index) => (index - 1 + galleryShots.length) % galleryShots.length)}
            >
              ‹
            </button>
            <button
              className="lightbox-nav right"
              type="button"
              onClick={() => setLightboxIndex((index) => (index + 1) % galleryShots.length)}
            >
              ›
            </button>
            <div className="lightbox-media">
              {galleryShots[lightboxIndex].image ? (
                <img src={galleryShots[lightboxIndex].image} alt={galleryShots[lightboxIndex].title} />
              ) : (
                <div className="lightbox-fallback">{galleryShots[lightboxIndex].fallback}</div>
              )}
            </div>
            <div className="lightbox-caption">
              <strong>{galleryShots[lightboxIndex].title}</strong>
              <span>{summary}</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
