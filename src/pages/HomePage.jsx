import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildRecommendationSet, estimateFuelCost, getRouteLabel } from "../services/recommendationService";
import { useTrip } from "../TripContext";

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function getScenarioDates() {
  const departure = new Date();
  departure.setDate(departure.getDate() + 1);
  const returning = new Date(departure);
  returning.setDate(returning.getDate() + 3);
  return {
    departureDate: formatDateInput(departure),
    returnDate: formatDateInput(returning),
  };
}

export function HomePage() {
  const { state, setState, vehicles } = useTrip();
  const [livePanelIndex, setLivePanelIndex] = useState(0);
  const recommendationSet = buildRecommendationSet(vehicles, state);
  const popularVehicles = recommendationSet.scored.slice(0, 3);
  const hasActiveRoute = Boolean(state.routeType);
  const featuredEyebrow = hasActiveRoute ? "Rota uyumlu araçlar" : "Popüler araçlar";
  const featuredTitle = hasActiveRoute
    ? `${getRouteLabel(state.routeType)} için öne çıkanlar`
    : "Popüler seçimlerden öne çıkanlar";
  const featuredDescription = hasActiveRoute
    ? "Seçtiğin rota tipine, bütçe ve yolcu bilgilerine göre en güçlü adaylar."
    : "Rota bilgisi girildiğinde bu alan seçimine göre yeniden sıralanır.";
  const routeScenarios = [
    ["İstanbul", "Rize", "Yayla ve uzun yol", "mountain", "outdoor", 5, 3, 3200],
    ["İzmir", "Bodrum", "Ekonomik hafta sonu", "city", "economy", 2, 1, 1800],
    ["Ankara", "Kapadokya", "Aile ve bagaj dengesi", "mixed", "family", 4, 2, 2800],
  ];
  const livePanelStates = [
    {
      score: "+%92",
      scoreLabel: "uygunluk skoru",
      luggage: "520L",
      luggageLabel: "bagaj önerisi",
      routeMode: state.routeType || "yayla",
      routeLabel: "rota modu",
      decision:
        "5 kişi, 4 büyük valiz ve yayla rotası için küçük hatchback yerine SUV veya crossover önerildi.",
    },
    {
      score: "₺4.8K",
      scoreLabel: "tahmini toplam",
      luggage: "4 valiz",
      luggageLabel: "yük dengesi",
      routeMode: "uzun yol",
      routeLabel: "analiz modu",
      decision:
        "Uzun yol ve bagaj ihtiyacı birlikte hesaplanınca düşük tüketimli geniş bagajlı seçenekler öne alındı.",
    },
    {
      score: "18 dk",
      scoreLabel: "karar süresi",
      luggage: "%87",
      luggageLabel: "konfor uyumu",
      routeMode: "ekonomi",
      routeLabel: "öncelik",
      decision:
        "Bütçe önceliği yükseldiği için günlük kira ve yakıt tahmini düşük araçlar yeniden sıralandı.",
    },
  ];
  const livePanel = livePanelStates[livePanelIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLivePanelIndex((current) => (current + 1) % livePanelStates.length);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, [livePanelStates.length]);

  return (
    <>
      <section id="home" className="hero section">
        <div className="hero-copy reveal">
          <h1>
            <span className="hero-title-line">Yolculuğuna</span>
            <span className="hero-title-line">
              <span className="hero-title-accent">en uygun aracı</span>
            </span>
            <span className="hero-title-line hero-title-gradient">
              AI ile <span className="hero-title-strong">bul.</span>
            </span>
          </h1>
          <p className="lead">
            Rota, yol şartları, kişi sayısı, bagaj ve bütçene göre seni tek tek filtre yormadan
            en mantıklı araçlara yönlendiriyoruz.
          </p>
          <div className="hero-actions">
            <Link className="primary-btn large" to="/planner">
              DriveWise Uzmanına Sor
            </Link>
            <Link className="secondary-btn large" to="/vehicles">
              Araçları Klasik Olarak İncele
            </Link>
          </div>
          <div className="hero-stats">
            <div>
              <strong>3 öneri</strong>
              <span>Ekonomik, dengeli, konforlu</span>
            </div>
            <div>
              <strong>5 adım</strong>
              <span>Rota, yol tipi, kişi, bagaj, öncelik</span>
            </div>
            <div>
              <strong>Canlı analiz</strong>
              <span>Risk, maliyet, bagaj uyumu</span>
            </div>
          </div>
        </div>

        <div className="hero-visual reveal delay-1">
          <div className="visual-card glass">
            <div className="visual-card-top">
              <span>DriveWise analiz paneli</span>
              <span className="status-dot">Çevrimiçi</span>
            </div>
            <div className="route-map">
              <svg className="route-map-graphic" viewBox="0 0 640 300" aria-hidden="true">
                <defs>
                  <linearGradient id="routeLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5b8cff" />
                    <stop offset="50%" stopColor="#8d63ff" />
                    <stop offset="100%" stopColor="#5b8cff" />
                  </linearGradient>
                </defs>
                <line
                  x1="118"
                  y1="212"
                  x2="488"
                  y2="90"
                  className="route-line"
                  stroke="url(#routeLineGradient)"
                />
                <circle cx="118" cy="212" r="16" className="route-node route-node-start" />
                <circle cx="488" cy="90" r="16" className="route-node route-node-end" />
              </svg>
              <div className="car-puck">
                <span className="car-puck-inner">🚗</span>
              </div>
              <div className="map-label start-label">İstanbul</div>
              <div className="map-label end-label">Rize</div>
            </div>
            <div className="mini-insights">
              <div className="live-insight-card" key={`score-${livePanelIndex}`}>
                <strong>{livePanel.score}</strong>
                <span>{livePanel.scoreLabel}</span>
              </div>
              <div className="live-insight-card" key={`luggage-${livePanelIndex}`}>
                <strong>{livePanel.luggage}</strong>
                <span>{livePanel.luggageLabel}</span>
              </div>
              <div className="live-insight-card" key={`route-${livePanelIndex}`}>
                <strong>{livePanel.routeMode}</strong>
                <span>{livePanel.routeLabel}</span>
              </div>
            </div>
          </div>
          <div className="floating-note glass gemini-border">
            <strong>Canlı karar özeti</strong>
            <p>“{livePanel.decision}”</p>
          </div>
        </div>
      </section>

      <section className="section quick-start reveal">
        <div className="section-heading">
          <span className="eyebrow">DriveWise nasıl karar verir?</span>
          <h2>Aramak yerine ihtiyacını anlat.</h2>
        </div>
        <div className="quick-grid">
          <div className="quick-card glass">
            <span>Rota</span>
            <strong>Başlangıç ve varış noktanı gir</strong>
            <p>Şehir içi, uzun yol, dağ yolu veya karışık rota.</p>
          </div>
          <div className="quick-card glass">
            <span>Kapasite</span>
            <strong>Kişi ve bagaj sayısını belirt</strong>
            <p>Yetişkin, çocuk, bebek koltuğu ve valizler.</p>
          </div>
          <div className="quick-card glass">
            <span>Öncelik</span>
            <strong>Ekonomi, konfor veya performans seç</strong>
            <p>AI sana en uygun araç tipine hızla yönelsin.</p>
          </div>
        </div>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <span className="eyebrow">Hackathon kriterlerine hazır</span>
          <h2>Demo sadece görsel değil, karar veren bir ürün.</h2>
          <p>
            Kullanıcı değerini rota ve bütçe probleminden alır; teknik tarafta skorlama,
            fallback AI, admin denetimi ve müşteri talebi akışını birlikte çalıştırır.
          </p>
        </div>
        <div className="value-grid">
          {[
            ["Kullanıcı değeri", "Kişi, bagaj, rota ve bütçe bilgisiyle doğru araç seçimini hızlandırır."],
            ["Teknik mimari", "Deterministik öneri motoru Gemini yanıtı gelmediğinde de çalışmaya devam eder."],
            ["Agentic yapı", "Widget, araç detayı ve admin uzmanı farklı görevlerde AI karar desteği verir."],
            ["Teslim edilebilir ürün", "Araç kataloğu, rezervasyon talebi, admin paneli ve canlı demo akışı hazırdır."],
          ].map(([title, text]) => (
            <article key={title} className="value-card glass">
              <strong>{title}</strong>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <span className="eyebrow">{featuredEyebrow}</span>
          <h2>{featuredTitle}</h2>
          <p>{featuredDescription}</p>
        </div>
        <div className="vehicle-grid">
          {popularVehicles.map(({ vehicle, score }) => {
            const cost = estimateFuelCost(vehicle, state);
            return (
              <article key={vehicle.id} className="vehicle-card">
                <div className="vehicle-visual">
                  {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt={vehicle.name} /> : vehicle.emoji}
                  <div className="badge">{vehicle.segment}</div>
                </div>
                <h3>{vehicle.name}</h3>
                <div className="score">{score}/100 DriveWise skoru</div>
                <p className="details">{vehicle.notes}</p>
                <div className="vehicle-specs">
                  <div className="metric-row">
                    <span>Günlük fiyat</span>
                    <strong>₺{vehicle.price}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Tahmini yakıt</span>
                    <strong>₺{cost.fuel.toLocaleString("tr-TR")}</strong>
                  </div>
                </div>
                <Link className="primary-btn" to={`/vehicles/${vehicle.id}`}>
                  Detay
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section reveal">
        <div className="section-heading">
          <span className="eyebrow">Popüler rota senaryoları</span>
          <h2>Jüri demosu için hızlı örnekler</h2>
        </div>
        <div className="quick-grid">
          {routeScenarios.map(([from, to, title, routeType, priority, adults, largeBags, budget]) => (
            <Link
              key={`${from}-${to}`}
              className="quick-card glass route-scenario"
              to="/planner"
              onClick={() =>
                setState((prev) => {
                  const scenarioDates = getScenarioDates();
                  return {
                    ...prev,
                    ...scenarioDates,
                    step: 5,
                    fromCity: from,
                    toCity: to,
                    routeType,
                    priority,
                    adults,
                    children: 0,
                    largeBags,
                    mediumBags: 1,
                    backpacks: 0,
                    budget,
                    purpose: priority === "economy" ? "cityUse" : "holiday",
                    fuelPriority: priority === "economy" ? "economic" : "balanced",
                    comfortPriority: priority === "family" ? "high" : "medium",
                    vehiclePreference: "any",
                  };
                })
              }
            >
              <span>{getRouteLabel(routeType)}</span>
              <strong>{from} → {to}</strong>
              <p>{title}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
