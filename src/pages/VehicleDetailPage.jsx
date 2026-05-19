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

function formatRouteLabel(state) {
  const from = state.fromCity?.trim();
  const to = state.toCity?.trim();
  if (from && to) return `${from} → ${to}`;
  if (from || to) return from || to;
  return "";
}

function formatBagNeed(state) {
  const parts = [
    state.largeBags > 0 ? `${state.largeBags} büyük valiz` : "",
    state.mediumBags > 0 ? `${state.mediumBags} orta valiz` : "",
    state.backpacks > 0 ? `${state.backpacks} sırt çantası` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "bagaj bilgisi girilmemiş";
}

function pickVariant(items, seed, offset = 0) {
  return items[Math.abs(seed + offset) % items.length];
}

function buildLocalVehicleInsight(vehicle, state, route, variantSeed = Date.now()) {
  const passengerCount = state.adults + state.children;
  const estimatedBagNeed = state.largeBags * 120 + state.mediumBags * 70 + state.backpacks * 30;
  const routeLabel = route || "rota bilgisi netleşmemiş kullanımda";
  const routePhrase = route ? `${route} rotasında` : "rota bilgisi netleşmemiş kullanımda";
  const bagText =
    estimatedBagNeed > 0
      ? vehicle.luggage >= estimatedBagNeed
        ? pickVariant(
            [
              `${vehicle.luggage} L bagaj hacmi mevcut ${formatBagNeed(state)} ihtiyacını karşılamaya yakın görünüyor`,
              `${formatBagNeed(state)} için ${vehicle.luggage} L bagaj tarafı genel olarak yeterli kalır`,
              `bagaj tarafında ${vehicle.luggage} L hacim, ${formatBagNeed(state)} yükünü makul seviyede taşır`,
            ],
            variantSeed,
            1,
          )
        : pickVariant(
            [
              `${vehicle.luggage} L bagaj hacmi ${formatBagNeed(state)} için sınıra yaklaşabilir`,
              `${formatBagNeed(state)} planında ${vehicle.luggage} L bagaj dikkatli yerleşim gerektirebilir`,
              `bagaj yükü artarsa ${vehicle.luggage} L hacim bu araçta kısıtlayıcı olabilir`,
            ],
            variantSeed,
            2,
          )
      : pickVariant(
          [
            `${vehicle.luggage} L bagaj hacmi hafif ve orta yükler için değerlendirilebilir`,
            `bagaj bilgisi girilmediği için ${vehicle.luggage} L hacmi hafif seyahat varsayımıyla yeterli sayılabilir`,
            `${vehicle.luggage} L bagaj, günlük kullanım ve az eşyalı yolculuklarda pratik kalır`,
          ],
          variantSeed,
          3,
        );
  const passengerText =
    passengerCount > vehicle.seats
      ? pickVariant(
          [
            `${passengerCount} kişi için ${vehicle.seats} koltuk yetersiz kalır`,
            `${vehicle.seats} koltuk kapasitesi ${passengerCount} kişilik planı taşımaz`,
            `yolcu sayısı ${passengerCount} ise bu araç koltuk tarafında uygun değildir`,
          ],
          variantSeed,
          4,
        )
      : pickVariant(
          [
            `${vehicle.seats} koltuk kapasitesi ${passengerCount || "belirtilen"} kişi için yeterli görünüyor`,
            `${passengerCount || "mevcut"} kişi için ${vehicle.seats} koltuklu kabin tarafında belirgin bir sorun görünmüyor`,
            `koltuk kapasitesi ${vehicle.seats} kişi olduğu için yolcu tarafı makul kalıyor`,
          ],
          variantSeed,
          5,
        );
  const driveText = pickVariant(
    vehicle.performance >= 8
      ? ["performans ve sollama rahatlığı güçlü", "motor tepkisi güçlü", "performans tarafında rahat hissettiren"]
      : vehicle.performance >= 6
        ? ["performans tarafı dengeli", "sürüş karakteri dengeli", "güç ve tüketim dengesi orta noktada"]
        : ["performans tarafı daha sakin", "hızlanma beklentisini abartmayan", "sakin sürüşe daha uygun"],
    variantSeed,
    6,
  );
  const comfortText = pickVariant(
    vehicle.comfort >= 8
      ? ["uzun yolda konfor beklentisi yüksekse avantajlıdır", "konfor seviyesi uzun yol için güçlü bir artıdır", "rahatlık önceliğinde iyi bir puan toplar"]
      : vehicle.comfort >= 6
        ? ["konforu günlük kullanım için yeterli düzeydedir", "konfor tarafı temel beklentileri karşılar", "rahatlık seviyesi kısa ve orta rotalarda yeterli kalır"]
        : ["konfor beklentisi yüksekse daha üst segment düşünülmelidir", "rahatlık tarafı temel seviyede kalır", "uzun yolda konfor hassasiyeti varsa sınırlı kalabilir"],
    variantSeed,
    7,
  );
  const routeFitText =
    vehicle.routeFit.includes(state.routeType) || vehicle.routeFit.includes("mixed")
      ? pickVariant(
          [
            `${routeLabel} ve ${state.routeType} yol tipiyle uyumu makul`,
            `${state.routeType} yol tipinde kullanım profili katalog verisiyle çelişmiyor`,
            `${routeLabel} için rota uyumu kabul edilebilir seviyede`,
          ],
          variantSeed,
          8,
        )
      : pickVariant(
          [
            `${routeLabel} için yol tipi uyumu ayrıca kontrol edilmeli`,
            `${state.routeType} yol tipi bu araçta ekstra dikkat gerektirebilir`,
            `${routeLabel} planında rota koşulları netleşmeden kesin öneri vermek doğru olmaz`,
          ],
          variantSeed,
          9,
        );
  const consumptionText =
    vehicle.consumption > 0
      ? `${vehicle.consumption} L/100km tüketim`
      : `${vehicle.fuel.toLowerCase()} kullanım`;

  const templates = [
    `${vehicle.name}, ${routePhrase} ${driveText} bir seçenek; ${routeFitText}. ${bagText} ve ${passengerText}. ${consumptionText}, ₺${vehicle.price.toLocaleString("tr-TR")} günlük fiyat ve ${comfortText}; bu yüzden bütçe, bagaj ve yol tipine göre karar verilmelidir.`,
    `${routePhrase} ${vehicle.name} daha çok ${driveText} karakteriyle öne çıkar. ${bagText}; ayrıca ${passengerText}. ${consumptionText} ve ₺${vehicle.price.toLocaleString("tr-TR")} günlük fiyat dengesi iyi okunmalı, ${comfortText}.`,
    `${vehicle.name} için ana tablo şöyle: ${routeFitText}, sürüşte ise ${driveText} bir yapı var. ${bagText} ve ${passengerText}. Yakıt/fiyat tarafında ${consumptionText} ile ₺${vehicle.price.toLocaleString("tr-TR")} günlük bedel birlikte değerlendirilmeli; ${comfortText}.`,
    `${vehicle.name}, ${routePhrase} bütçe ve pratiklik odaklı bakıldığında değerlendirilebilir. ${consumptionText} ve ₺${vehicle.price.toLocaleString("tr-TR")} günlük fiyat avantaj yaratırken ${bagText}. Son karar için ${passengerText}; ${comfortText}.`,
  ];

  return pickVariant(templates, variantSeed, 10);
}

function normalizeVehicleInsight(text, fallbackText, currentVehicle, vehicles = []) {
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
  const mentionsOtherVehicle = vehicles.some((vehicle) => {
    if (!currentVehicle || vehicle.id === currentVehicle.id) return false;
    return cleaned.toLocaleLowerCase("tr-TR").includes(vehicle.name.toLocaleLowerCase("tr-TR"));
  });

  return looksBroken || mentionsOtherVehicle ? fallbackText : cleaned;
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

  useEffect(() => {
    setAiOpen(false);
    setAiInsight("");
    setAiLoading(false);
  }, [vehicleId]);

  if (!vehicle) {
    return <Navigate to="/vehicles" replace />;
  }

  const summary = vehicle.aiSummary || buildVehicleSummary(vehicle);
  const warnings = buildRiskWarnings(vehicle, state);
  const routeText = vehicle.routeFit.join(" · ");
  const bars = getVehicleTechnicalBars(vehicle);
  const suitabilityScore = computeScore(vehicle, state);
  const totalPassengers = state.adults + state.children;
  const decisionSummaryReady =
    Boolean(state.fromCity?.trim()) &&
    Boolean(state.toCity?.trim()) &&
    Boolean(state.departureDate) &&
    Boolean(state.returnDate) &&
    totalPassengers > 0;
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
    const route = formatRouteLabel(state);
    const variationKey = Date.now() + Math.floor(Math.random() * 1000);
    const localFallback = buildLocalVehicleInsight(vehicle, state, route, variationKey);

    const prompt = [
      "Aşağıdaki tek aracı mevcut seyahat için değerlendir.",
      `Bu yanıt yalnızca ${vehicle.name} için yazılacak; başka araç adı yazma veya önceki araç metnini tekrar etme.`,
      `Bu denemenin varyasyon kimliği: ${variationKey}. Bu kimliği metinde yazma; sadece farklı cümle yapısı ve farklı başlangıç seçmek için kullan.`,
      "Aynı araç için önceki yanıt kalıbını tekrar etme; anlam aynı kalsa bile cümle sırası ve ifade farklı olsun.",
      "Kısa ama açıklayıcı ol.",
      "Selamlama, kapanış sözü veya anlamsız ek metin yazma.",
      "Markdown başlığı, kalın yazı, parantezli başlık veya liste kullanma.",
      "Yanıt 3 kısa cümleden oluşsun ve mutlaka tamamlanmış cümlelerle bitsin.",
      "Artıları, eksileri ve bu rota için uygunluğunu söyle.",
      "Varsa net bir öneri ver.",
      "",
      `Rota: ${route}`,
      `Yol tipi: ${state.routeType}`,
      `Öncelik: ${state.priority}`,
      `Yolcu: ${totalPassengers} kişi`,
      `Bagaj ihtiyacı: ${formatBagNeed(state)}`,
      `Bütçe: ${state.budget || "belirtilmedi"} TL/gün`,
      "",
      `Araç adı: ${vehicle.name}`,
      `Segment: ${vehicle.segment}`,
      `Kategori: ${vehicle.category}`,
      `Segment etiketi: ${vehicle.segmentTag}`,
      `Fiyat: ₺${vehicle.price}/gün`,
      `Yakıt: ${vehicle.fuel}`,
      `Vites: ${vehicle.transmission || "Otomatik"}`,
      `Tüketim: ${vehicle.consumption} L/100km`,
      `Bagaj: ${vehicle.luggage} L`,
      `Koltuk: ${vehicle.seats}`,
      `Konfor: ${vehicle.comfort}/10`,
      `Performans: ${vehicle.performance}/10`,
      `Uygun rota etiketleri: ${vehicle.routeFit.join(", ")}`,
      `Not: ${vehicle.notes}`,
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

    setAiInsight(normalizeVehicleInsight(result.text, localFallback, vehicle, vehicles));
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
          {decisionSummaryReady ? (
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
          ) : null}

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
