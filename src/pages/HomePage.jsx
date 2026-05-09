import { Link } from "react-router-dom";
import { useTrip } from "../TripContext";

export function HomePage() {
  const { state } = useTrip();

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
              Seyahatimi Planla
            </Link>
            <Link className="secondary-btn large" to="/vehicles">
              Araçları İncele
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
              <span>AI analiz paneli</span>
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
              <div>
                <strong>+%92</strong>
                <span>uygunluk skoru</span>
              </div>
              <div>
                <strong>520L</strong>
                <span>bagaj önerisi</span>
              </div>
              <div>
                <strong>{state.routeType}</strong>
                <span>rota modu</span>
              </div>
            </div>
          </div>
          <div className="floating-note glass">
            <strong>AI karar alanı</strong>
            <p>
              “5 kişi, 4 büyük valiz ve yayla rotası için küçük hatchback yerine SUV veya crossover
              önerildi.”
            </p>
          </div>
        </div>
      </section>

      <section className="section quick-start reveal">
        <div className="section-heading">
          <span className="eyebrow">Hızlı başlangıç</span>
          <h2>Aramak yerine söyle, önerelim.</h2>
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
    </>
  );
}
