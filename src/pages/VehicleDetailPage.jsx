import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, ChevronLeft, ChevronRight, Scale, Sparkles, X } from "lucide-react";
import {
  buildRiskWarnings,
  buildVehicleSummary,
  computeScore,
  getVehicleTechnicalBars,
} from "../data";
import { useTrip } from "../TripContext";

function normalizeVehicleInsight(text, fallbackText) {
  const cleaned = String(text || "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s+/gm, "")
    .trim();

  const openParenCount = (cleaned.match(/\(/g) || []).length;
  const closeParenCount = (cleaned.match(/\)/g) || []).length;
  const looksBroken =
    cleaned.length < 60 ||
    openParenCount > closeParenCount ||
    /[\s(:\-–—,]$/.test(cleaned) ||
    /^.+değerlendirmesi\s*\(?$/i.test(cleaned);

  return looksBroken ? fallbackText : cleaned;
}

export function VehicleDetailPage() {
  const { vehicleId } = useParams();
  const { vehicles, state, askGemini, createReservation } = useTrip();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [compareId, setCompareId] = useState(null);
  const [reservationForm, setReservationForm] = useState({
    name: "",
    phone: "",
    note: "",
  });
  const [reservationResult, setReservationResult] = useState(null);
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
  const suitabilityScore = computeScore(vehicle, state);
  const totalPassengers = state.adults + state.children;
  const tripDays = Math.max(
    1,
    Math.ceil(
      (new Date(state.returnDate).getTime() - new Date(state.departureDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ) || 1,
  );
  const estimatedTotal = vehicle.price * tripDays;
  const reservationReady = reservationForm.name.trim().length > 1 && reservationForm.phone.trim().length > 6;

  const handleReservationSubmit = (event) => {
    event.preventDefault();
    if (!reservationReady) return;

    const result = createReservation({
      vehicleId: vehicle.id,
      customerName: reservationForm.name.trim(),
      phone: reservationForm.phone.trim(),
      note: reservationForm.note.trim(),
    });

    setReservationResult(result);
    setReservationForm({ name: "", phone: "", note: "" });
  };

  const handleAiInsight = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiInsight("Gemini yanıtlıyor...");
    const route = `${state.fromCity} → ${state.toCity}`;
    const localFallback = [
      `${vehicle.name}, ${route} rotası için ${vehicle.performance >= 7 ? "performans tarafında yeterli" : "performans tarafında daha sakin"} bir seçenek.`,
      `${vehicle.luggage} L bagaj ve ${vehicle.seats} koltuk kapasitesiyle yolcu/bagaj ihtiyacı makulse tercih edilebilir.`,
      `${vehicle.consumption} L/100km tüketim ve ₺${vehicle.price} günlük fiyatıyla karar verirken bütçe ve yol tipini birlikte değerlendirmek gerekir.`,
    ].join(" ");

    const prompt = [
      `${vehicle.name} aracını bu seyahat için değerlendir.`,
      "Kısa ama açıklayıcı ol.",
      "Selamlama, kapanış sözü veya anlamsız ek metin yazma.",
      "Markdown başlığı, kalın yazı, parantezli başlık veya liste kullanma.",
      "Yanıt 3 kısa cümleden oluşsun ve mutlaka tamamlanmış cümlelerle bitsin.",
      "Artıları, eksileri ve bu rota için uygunluğunu söyle.",
      "Varsa net bir öneri ver.",
      `Araç bilgisi: segment ${vehicle.segment}, fiyat ₺${vehicle.price}, yakıt ${vehicle.fuel}, tüketim ${vehicle.consumption} L/100km, bagaj ${vehicle.luggage} L, koltuk ${vehicle.seats}, konfor ${vehicle.comfort}/10, performans ${vehicle.performance}/10.`,
    ].join(" ");

    const result = await askGemini(prompt, {
      area: "Araç detayı Gemini yorumla",
      state,
      topVehicle: vehicle,
      currentRoute: route,
      showInWidget: false,
      fallbackText: localFallback,
      returnResult: true,
    });

    setAiInsight(normalizeVehicleInsight(result.text, localFallback));
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
  const bestPrice = Math.min(...priceTimeline.map((day) => day.price));

  const decisionItems = [
    ["Rota", `${state.fromCity} → ${state.toCity}`],
    ["Tarih", `${state.departureDate} / ${state.returnDate}`],
    ["Yolcu", `${totalPassengers} kişi`],
    ["Tahmini toplam", `₺${estimatedTotal.toLocaleString("tr-TR")}`],
  ];

  const quickSpecs = [
    ["Günlük", `₺${vehicle.price.toLocaleString("tr-TR")}`],
    ["Yakıt", vehicle.fuel],
    ["Tüketim", `${vehicle.consumption} L/100km`],
    ["Bagaj", `${vehicle.luggage} L`],
    ["Koltuk", `${vehicle.seats} kişi`],
    ["Vites", vehicle.transmission || "Otomatik"],
  ];

  return (
    <section className="section vehicle-detail-page reveal">
      <Link className="detail-back-link" to="/vehicles">
        <ArrowLeft size={18} />
        Araçlara dön
      </Link>

      <div className="detail-hero glass">
        <div className="detail-hero-copy">
          <span className="eyebrow">Araç detayı</span>
          <h2>{vehicle.name}</h2>
          <p>{summary}</p>
          <div className="detail-pills">
            <span>{vehicle.segment}</span>
            <span>{vehicle.fuel}</span>
            <span>{vehicle.transmission || "Otomatik"}</span>
            <span>{routeText}</span>
          </div>
          <div className="detail-hero-actions">
            <button className="primary-btn" type="button" onClick={handleAiInsight}>
              <Sparkles size={18} />
              Gemini ile yorumla
            </button>
            <a className="secondary-btn" href="#reservation">
              <CalendarCheck size={18} />
              Rezervasyon talebi
            </a>
          </div>
        </div>

        <div className="detail-hero-media">
          <button
            className="vehicle-hero-image"
            type="button"
            onClick={() => setLightboxIndex(0)}
            aria-label={`${vehicle.name} görselini büyüt`}
          >
            {vehicle.imageUrl ? (
              <img src={vehicle.imageUrl} alt={vehicle.name} />
            ) : (
              <div className="vehicle-hero-fallback">{vehicle.emoji}</div>
            )}
          </button>
          <div className="detail-score-card">
            <span>Gemini uygunluk</span>
            <strong>{suitabilityScore}/100</strong>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <main className="detail-main">
          <section className="detail-card glass">
            <div className="detail-section-title">
              <span className="eyebrow">Karar özeti</span>
              <h3>Bu araç seyahate ne kadar uyuyor?</h3>
            </div>
            <div className="decision-summary-grid">
              {decisionItems.map(([label, value]) => (
                <div key={label} className="decision-summary-item">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="detail-note">
              <strong>{vehicle.notes}</strong>
              <ul className="risk-list compact">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="detail-card glass">
            <div className="detail-section-title">
              <span className="eyebrow">Teknik bilgiler</span>
              <h3>Günlük kullanım metrikleri</h3>
            </div>
            <div className="detail-spec-grid">
              {quickSpecs.map(([label, value]) => (
                <div key={label} className="detail-spec-card">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="bar-list detail-bar-list">
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
          </section>

          <section className="detail-card glass">
            <div className="detail-section-title">
              <span className="eyebrow">Görseller</span>
              <h3>Araç görünümü</h3>
            </div>
            <div className="detail-gallery">
              {galleryShots.map((shot, index) => (
                <button
                  key={shot.title}
                  className="detail-gallery-card"
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                >
                  <span className="detail-gallery-media">
                    {shot.image ? (
                      <img src={shot.image} alt={shot.title} />
                    ) : (
                      <span className="detail-gallery-fallback">{shot.fallback}</span>
                    )}
                  </span>
                  <strong>{shot.title}</strong>
                </button>
              ))}
            </div>
          </section>

          <section ref={compareRef} id="compare-section" className="detail-card glass">
            <div className="detail-section-title">
              <span className="eyebrow">Alternatifler</span>
              <h3>Benzer araçlarla hızlı kıyas</h3>
            </div>
            <div className="detail-related-grid">
              {similarVehicles.map((item) => (
                <article key={item.id} className="detail-related-card">
                  <div className="detail-related-media">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : item.emoji}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.segment}</span>
                  </div>
                  <p>₺{item.price}/gün · {item.fuel} · {item.luggage} L</p>
                  <div className="detail-related-actions">
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
                      <Scale size={16} />
                      Kıyasla
                    </button>
                    <Link className="primary-btn" to={`/vehicles/${item.id}`}>
                      İncele
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div id="compare-area" className="detail-compare-box">
              {compareVehicle ? (
                <div className="detail-compare-grid">
                  {[vehicle, compareVehicle].map((item) => (
                    <article key={item.id} className="compare-card">
                      <strong>{item.name}</strong>
                      <dl>
                        <div>
                          <dt>Fiyat</dt>
                          <dd>₺{item.price}/gün</dd>
                        </div>
                        <div>
                          <dt>Tüketim</dt>
                          <dd>{item.consumption} L/100km</dd>
                        </div>
                        <div>
                          <dt>Bagaj</dt>
                          <dd>{item.luggage} L</dd>
                        </div>
                        <div>
                          <dt>Konfor</dt>
                          <dd>{item.comfort}/10</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="analysis-snippet">Alternatiflerden “Kıyasla” seçerek teknik farkları yan yana görebilirsin.</p>
              )}
            </div>
          </section>
        </main>

        <aside className="detail-side">
          <section className="detail-card glass detail-sticky-card">
            <div className="detail-price">
              <span>Günlük fiyat</span>
              <strong>₺{vehicle.price.toLocaleString("tr-TR")}</strong>
              <small>{tripDays} günlük tahmini toplam ₺{estimatedTotal.toLocaleString("tr-TR")}</small>
            </div>
            <div className="price-timeline">
              {priceTimeline.map((day) => (
                <div key={day.label} className={day.price === bestPrice ? "best" : ""}>
                  <span>{day.label}</span>
                  <strong>₺{day.price}</strong>
                </div>
              ))}
            </div>
            {aiOpen ? (
              <div className="detail-ai-answer">
                <span className="eyebrow">Gemini yorumu</span>
                <p>{aiLoading ? "Gemini yanıtlıyor..." : aiInsight}</p>
              </div>
            ) : null}
          </section>

          <form id="reservation" className="detail-card glass reservation-card" onSubmit={handleReservationSubmit}>
            <div className="detail-section-title">
              <span className="eyebrow">Rezervasyon</span>
              <h3>Talep oluştur</h3>
            </div>
            <label className="field">
              <span>Ad soyad</span>
              <input
                type="text"
                value={reservationForm.name}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Müşteri adı"
              />
            </label>
            <label className="field">
              <span>Telefon</span>
              <input
                type="tel"
                value={reservationForm.phone}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="05xx xxx xx xx"
              />
            </label>
            <label className="field">
              <span>Not</span>
              <textarea
                rows="3"
                value={reservationForm.note}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="Teslim alma saati, ek istek veya ödeme notu"
              />
            </label>
            <button className="primary-btn" type="submit" disabled={!reservationReady}>
              <CalendarCheck size={18} />
              Talep oluştur
            </button>
            {reservationResult ? (
              <p className="reservation-success">
                {reservationResult.vehicleName} için talep alındı. Admin panelinden takip edilebilir.
              </p>
            ) : null}
          </form>
        </aside>
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
              <X size={20} />
            </button>
            <button
              className="lightbox-nav left"
              type="button"
              onClick={() => setLightboxIndex((index) => (index - 1 + galleryShots.length) % galleryShots.length)}
            >
              <ChevronLeft size={28} />
            </button>
            <button
              className="lightbox-nav right"
              type="button"
              onClick={() => setLightboxIndex((index) => (index + 1) % galleryShots.length)}
            >
              <ChevronRight size={28} />
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
