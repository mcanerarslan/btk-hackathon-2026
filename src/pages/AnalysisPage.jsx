import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  Clock,
  Construction,
  ExternalLink,
  Gauge,
  MapPin,
  Mountain,
  Navigation,
  RefreshCw,
  Route,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { useTrip } from "../TripContext";
import { buildGoogleMapsUrl, fetchLiveRoute } from "../services/mapsService";

const routePresets = [
  ["İstanbul", "Rize", "Karadeniz uzun yol"],
  ["İzmir", "Bodrum", "Yazlık sahil rotası"],
  ["Antalya", "Kaş", "Virajlı sahil yolu"],
  ["Ankara", "Kapadokya", "İç Anadolu turu"],
];

function inferRouteProfile(from, to, routeType) {
  const routeText = `${from} ${to}`.toLocaleLowerCase("tr-TR");
  const isBlackSea = /rize|trabzon|artvin|ordu|giresun|karadeniz/.test(routeText);
  const isCoastal = /bodrum|kaş|kas|fethiye|marmaris|antalya|izmir|ayvalık|cesme|çeşme/.test(routeText);
  const isMountain = routeType === "mountain" || /rize|artvin|kapadokya|yayla|bolu|erzurum/.test(routeText);
  const isCityHeavy = /istanbul|ankara|izmir/.test(routeText);
  const distance = isBlackSea ? 1120 : isCoastal ? 430 : isMountain ? 610 : routeType === "city" ? 48 : 520;
  const durationHours = Math.max(1, Math.round((distance / (isCityHeavy ? 72 : 88)) * 10) / 10);
  const tollRisk = /istanbul|izmir|ankara|bursa|gebze|osmangazi|avrasya|yavuz/.test(routeText);
  const slope = isMountain || isBlackSea ? "Orta-yüksek eğim" : isCoastal ? "Yer yer eğimli" : "Düşük-orta eğim";
  const curve = isBlackSea || isCoastal || isMountain ? "Sık viraj ve dar kesit olasılığı" : "Genelde akıcı ana yol";

  return {
    distance,
    durationHours,
    confidence: isBlackSea || isCoastal || isMountain ? 88 : 76,
    roadCondition: isBlackSea
      ? "Kıyı geçişleri, tüneller ve yağış sonrası kaygan zemin ihtimali"
      : isCoastal
        ? "Sahil bağlantılarında sezon trafiği ve virajlı kesimler"
        : isCityHeavy
          ? "Şehir çıkışı yoğunluğu ve otoyol bağlantıları"
          : "Ana arter ağırlıklı, yerel yol durumuna bağlı değişkenlik",
    accident: isCityHeavy
      ? "Şehir çıkışında yoğunluk kaynaklı kaza riski takip edilmeli"
      : isCoastal
        ? "Virajlı kesimlerde ani fren ve tek şerit daralma riski"
        : "Canlı kaza verisi bağlı değil; rota öncesi trafik kaynağıyla doğrula",
    roadwork: isBlackSea
      ? "Tünel, viyadük ve sahil yolu bakım çalışması ihtimali yüksek"
      : tollRisk
        ? "Otoyol gişe ve bağlantı yollarında çalışma/şerit daralması kontrol edilmeli"
        : "Planlı çalışma için yerel trafik duyurusu kontrol edilmeli",
    tolls: tollRisk ? "Ücretli otoyol/köprü seçeneği olası" : "Ücretli yol zorunlu görünmüyor",
    slope,
    curve,
    recommendedRouteType: isMountain ? "mountain" : isCoastal ? "mixed" : routeType,
  };
}

function buildLiveRouteReport(from, to, route, profile, note) {
  const warnings = route.warnings.length ? route.warnings.join(" ") : "Google rota yanıtında özel uyarı dönmedi.";
  const trafficText = route.hasTrafficDelay
    ? `Canlı trafik normal süreye göre yaklaşık ${route.trafficDelay} ekliyor.`
    : "Canlı trafik normal süreye göre belirgin gecikme göstermiyor.";

  return [
    `Rota Analizi: ${from} - ${to}`,
    `Mesafe: ${route.distanceKm} km.`,
    `Süre: Trafik dahil ${route.duration}; normal koşul ${route.staticDuration}. ${trafficText}`,
    `Yol: ${route.summary}. ${warnings}`,
    `Ücretli yol: ${route.tolls}`,
    `Yokuş/eğim: ${profile.slope}.`,
    `Dağ/viraj: ${profile.curve}.`,
    note ? `Sürücü notu: ${note}` : "",
    "İleri tarih seçildiyse trafik ve yol çalışması bilgileri hareket saatine kadar değişebilir.",
  ]
    .filter(Boolean)
    .join("\n");
}

const routeTypeLabels = {
  city: "şehir içi",
  long: "uzun yol",
  mountain: "dağ/yayla",
  winter: "kış",
  outdoor: "outdoor",
  mixed: "karma yol",
};

function getVehicleRouteCharacter(vehicle) {
  const searchable = `${vehicle.name} ${vehicle.segment} ${vehicle.segmentTag} ${vehicle.fuel}`.toLocaleLowerCase("tr-TR");
  if (/elektrik/.test(searchable)) {
    return `${vehicle.performance}/10 performans ve elektrikli aktarma, ani hızlanma ihtiyacı olan bağlantılarda güçlü kalır`;
  }
  if (vehicle.category === "outdoor" || vehicle.segmentTag === "suv") {
    return `${vehicle.segment.toLocaleLowerCase("tr-TR")} gövde yapısı, bozuk zemin ve eğimli kesitlerde daha rahat hareket alanı verir`;
  }
  if (vehicle.comfort >= 9) {
    return `${vehicle.comfort}/10 konfor puanı, uzun sürüşte yorgunluğu azaltan tarafını öne çıkarır`;
  }
  if (vehicle.consumption <= 5.2) {
    return `${vehicle.consumption} L/100km tüketim, trafik veya uzayan rota ihtimalinde maliyeti aşağıda tutar`;
  }
  return `${vehicle.performance}/10 performans ve ${vehicle.comfort}/10 konfor dengesi, rota belirsizliğinde güvenli bir orta nokta sunar`;
}

function buildRouteAiReason(vehicle, profile, liveRoute, signals, rank) {
  const routeLabel = routeTypeLabels[profile.recommendedRouteType] || "rota";
  const firstFocus = signals.hasSteepSlope
    ? "eğimli/yayla hattında"
    : signals.hasCurves
      ? "viraj ve dar kesit ihtimalinde"
      : signals.hasTrafficRisk
        ? "trafik gecikmesi olasılığında"
        : signals.hasTollOrLongRoad
          ? "uzun veya otoyol ağırlıklı kullanımda"
          : `${routeLabel} profilinde`;
  const character = getVehicleRouteCharacter(vehicle);
  const liveDetail = liveRoute?.ok
    ? `Canlı kontrol ${liveRoute.distanceKm} km ve ${liveRoute.duration} gösterdiği için`
    : "Canlı trafik verisi kesinleşmeden";
  const capacityDetail =
    vehicle.luggage >= 520
      ? `${vehicle.luggage} L bagaj hacmi, plansız yük artışına tolerans bırakır`
      : vehicle.seats >= 7
        ? `${vehicle.seats} koltuk kapasitesi, kalabalık yolculukta daha esnek kalır`
        : `${vehicle.consumption} L/100km tüketim ve ${vehicle.transmission || "otomatik"} vites günlük kullanımı sade tutar`;
  const rankingAngle = [
    `${firstFocus} ilk tercih sebebi ${character}.`,
    `${firstFocus} bu aracı listede tutan fark ${character}.`,
    `${firstFocus} alternatif olarak değerli; çünkü ${character}.`,
  ][rank] || `${firstFocus} ${character}.`;

  return `${rankingAngle} ${liveDetail} ${capacityDetail}.`;
}

function buildRouteVehicleRecommendations(vehicles, state, profile, liveRoute) {
  const hasSteepSlope = /yüksek|yayla|dağ/i.test(profile.slope);
  const hasCurves = /viraj|dar/i.test(profile.curve);
  const hasVariableRoad = /kaygan|dar|değişken|tünel|sahil|yerel/i.test(profile.roadCondition);
  const hasTrafficRisk = Boolean(liveRoute?.ok && liveRoute.hasTrafficDelay);
  const hasRoadworkRisk = Boolean(liveRoute?.ok && liveRoute.warnings.length);
  const hasTollOrLongRoad = /ücretli|otoyol|köprü/i.test(profile.tolls) || profile.distance >= 500;
  const targetRouteTypes = new Set(
    [
      profile.recommendedRouteType,
      hasSteepSlope ? "mountain" : "",
      hasCurves ? "mixed" : "",
      hasVariableRoad ? "outdoor" : "",
      hasTollOrLongRoad ? "long" : "",
    ].filter(Boolean),
  );

  return vehicles
    .filter((vehicle) => vehicle.available !== false)
    .map((vehicle) => {
      let score = 42;
      const routeMatches = vehicle.routeFit.some((routeType) => targetRouteTypes.has(routeType));
      const isSuvLike = vehicle.segmentTag === "suv" || vehicle.category === "outdoor";
      const totalPassengers = Number(state.adults || 0) + Number(state.children || 0);
      const luggageUnits =
        Number(state.largeBags || 0) * 3 + Number(state.mediumBags || 0) * 2 + Number(state.backpacks || 0);

      if (routeMatches) {
        score += 18;
      }
      if (hasSteepSlope) {
        score += vehicle.performance >= 8 ? 18 : vehicle.performance >= 7 ? 10 : -14;
      }
      if (hasCurves) {
        score += vehicle.comfort >= 8 ? 12 : vehicle.comfort >= 7 ? 7 : -4;
      }
      if (hasVariableRoad || hasRoadworkRisk) {
        score += isSuvLike ? 16 : routeMatches ? 8 : -6;
      }
      if (hasTrafficRisk) {
        score += vehicle.consumption <= 5.6 ? 10 : vehicle.transmission === "Otomatik" ? 5 : 0;
      }
      if (hasTollOrLongRoad) {
        score += vehicle.comfort >= 8 ? 9 : 0;
        score += vehicle.consumption <= 6.2 ? 7 : 0;
      }
      if (totalPassengers > 0) score += vehicle.seats >= totalPassengers ? 8 : -18;
      if (luggageUnits > 0) score += vehicle.luggage >= luggageUnits * 35 ? 9 : vehicle.luggage >= luggageUnits * 25 ? 4 : -12;

      return {
        vehicle,
        score: Math.max(0, Math.min(100, Math.round(score))),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      reason: buildRouteAiReason(
        item.vehicle,
        profile,
        liveRoute,
        { hasSteepSlope, hasCurves, hasTrafficRisk, hasTollOrLongRoad },
        index,
      ),
    }));
}

export function AnalysisPage() {
  const { state, setState, vehicles } = useTrip();
  const [fromPlace, setFromPlace] = useState(state.fromCity);
  const [toPlace, setToPlace] = useState(state.toCity);
  const [routeNote, setRouteNote] = useState("");
  const [aiRouteReport, setAiRouteReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [departureMode, setDepartureMode] = useState("now");
  const [futureDeparture, setFutureDeparture] = useState(state.departureDate ? `${state.departureDate}T09:00` : "");
  const [liveRoute, setLiveRoute] = useState(null);
  const [liveRouteLoading, setLiveRouteLoading] = useState(false);
  const routeProfile = useMemo(
    () => inferRouteProfile(fromPlace, toPlace, state.routeType),
    [fromPlace, toPlace, state.routeType],
  );
  const now = Date.now();
  const selectedFutureTime = futureDeparture ? new Date(futureDeparture).getTime() : 0;
  const departureDate = new Date(
    departureMode === "future" && selectedFutureTime > now + 120000
      ? selectedFutureTime
      : now + 300000,
  );
  const departureTime = departureDate.toISOString();
  const isLiveReady = liveRoute?.ok;
  const liveErrorMessage = liveRoute && !liveRoute.ok ? liveRoute.message : "";
  const routeRisks = [
    {
      icon: AlertTriangle,
      label: "Kaza / trafik",
      value: isLiveReady
        ? liveRoute.hasTrafficDelay
          ? `Google canlı trafik süresi normalden ${liveRoute.trafficDelay} uzun.`
          : "Google canlı rota süresinde belirgin trafik gecikmesi görünmüyor."
        : liveErrorMessage || "Canlı harita verisi bağlanınca burası Google rota süresine göre güncellenir.",
    },
    {
      icon: Construction,
      label: "Yol çalışması",
      value: isLiveReady
        ? liveRoute.warnings.length
          ? liveRoute.warnings.join(" ")
          : "Google rota yanıtında ayrı bir çalışma/uyarı metni dönmedi."
        : liveErrorMessage
          ? "Routes API aktif olduktan sonra Google rota uyarıları burada görünür."
          : "Canlı Google rota yanıtı olmadan çalışma bilgisi kesin gösterilmez.",
    },
    { icon: Banknote, label: "Ücretli yollar", value: isLiveReady ? liveRoute.tolls : "Google Routes API bağlanınca ücret/gişe bilgisi kontrol edilir." },
    { icon: Mountain, label: "Yokuş / eğim", value: routeProfile.slope },
    { icon: Gauge, label: "Dağ / viraj", value: routeProfile.curve },
    {
      icon: ShieldCheck,
      label: "Yol koşulu",
      value: isLiveReady
        ? `${liveRoute.distanceKm} km · trafik dahil ${liveRoute.duration} · normal ${liveRoute.staticDuration}.`
        : routeProfile.roadCondition,
    },
  ];
  const fallbackRouteReport = liveRoute?.message
    ? `${liveRoute.message} Google Haritalar butonundan rotayı anlık harita üzerinde açabilirsin. İleri tarih seçilirse sonuç, canlı trafik yerine tarihsel trafik modeline daha fazla dayanabilir.`
    : `${fromPlace} - ${toPlace} için canlı Google rota verisi henüz alınmadı. Google Routes API anahtarı bağlandığında trafik dahil süre, normal süre, ücretli yol ve harita uyarıları bu panelde güncellenir. ${routeProfile.slope} ve ${routeProfile.curve.toLocaleLowerCase("tr-TR")} araç seçimi için dikkate alınır.${routeNote ? ` Ek not: ${routeNote}` : ""}`;
  const googleMapsUrl = buildGoogleMapsUrl(fromPlace, toPlace);
  const routeVehicleRecommendations = useMemo(
    () => buildRouteVehicleRecommendations(vehicles, state, routeProfile, liveRoute),
    [vehicles, state, routeProfile, liveRoute],
  );

  useEffect(() => {
    setLiveRoute(null);
    setAiRouteReport("");
  }, [fromPlace, toPlace, departureMode, futureDeparture]);

  const refreshLiveRoute = (cleanFrom = fromPlace.trim(), cleanTo = toPlace.trim()) => {
    setLiveRouteLoading(true);
    return fetchLiveRoute({ from: cleanFrom, to: cleanTo, departureTime })
      .then((result) => {
        setLiveRoute(result);
        return result;
      })
      .finally(() => setLiveRouteLoading(false));
  };

  const analyzeRoute = () => {
    const cleanFrom = fromPlace.trim() || state.fromCity;
    const cleanTo = toPlace.trim() || state.toCity;
    if (!cleanFrom || !cleanTo) {
      setAiRouteReport("Rota analizi için başlangıç ve varış noktası gir.");
      return;
    }
    setFromPlace(cleanFrom);
    setToPlace(cleanTo);
    setState((prev) => ({
      ...prev,
      fromCity: cleanFrom,
      toCity: cleanTo,
      routeType: routeProfile.recommendedRouteType,
    }));
    setAiLoading(true);
    setAiRouteReport("Canlı harita verisi kontrol ediliyor...");
    refreshLiveRoute(cleanFrom, cleanTo).then((result) => {
      if (!result.ok) {
        const liveText = `${result.message} Bu nedenle uygulama içinde kesin canlı trafik sonucu gösterilemiyor; Google Haritalar rotasını açarak anlık yol durumunu görebilirsin.`;
        setAiRouteReport(liveText);
        setAiLoading(false);
        return;
      }

      const liveText = buildLiveRouteReport(cleanFrom, cleanTo, result, routeProfile, routeNote);
      setAiRouteReport(liveText);
      setAiLoading(false);
    });
  };

  return (
    <>
      <section className="section route-intelligence reveal">
        <div className="section-heading">
          <span className="eyebrow">AI rota analizi</span>
          <h2>Yer veya mekan yaz, DriveWise yol risklerini ve araç uyumunu çıkarsın.</h2>
          <p>
            Başlangıç ve varış noktasına göre kaza riski, çalışma ihtimali, ücretli yollar,
            eğim, dağ yolu ve virajlı kesimler tek ekranda değerlendirilir.
          </p>
        </div>

        <div className="route-lab-shell">
          <div className="route-search-panel glass">
            <div className="route-search-head">
              <div>
                <span className="eyebrow">Rota seçimi</span>
                <h3>Haritadan hissi veren hızlı seçim</h3>
              </div>
              <span className="route-confidence">%{routeProfile.confidence} AI güven</span>
            </div>

            <div className="field-grid two">
              <label className="field">
                <span>Nereden?</span>
                <input
                  type="text"
                  value={fromPlace}
                  placeholder="İl, ilçe, havalimanı veya mekan"
                  onChange={(event) => setFromPlace(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Nereye?</span>
                <input
                  type="text"
                  value={toPlace}
                  placeholder="Örn. Ayder Yaylası, Kaş, Kapadokya"
                  onChange={(event) => setToPlace(event.target.value)}
                />
              </label>
            </div>

            <div className="field-grid two">
              <label className="field">
                <span>Zaman</span>
                <select value={departureMode} onChange={(event) => setDepartureMode(event.target.value)}>
                  <option value="now">Şimdi, canlı trafik</option>
                  <option value="future">İleri tarih, değişebilir</option>
                </select>
              </label>
              <label className="field">
                <span>Kalkış zamanı</span>
                <input
                  type="datetime-local"
                  value={futureDeparture}
                  onFocus={() => setDepartureMode("future")}
                  onChange={(event) => {
                    setDepartureMode("future");
                    setFutureDeparture(event.target.value);
                  }}
                />
              </label>
            </div>

            <label className="field">
              <span>Ek not</span>
              <textarea
                rows="3"
                value={routeNote}
                placeholder="Örn. ücretli yoldan kaçın, çocuk var, gece sürüşü olacak"
                onChange={(event) => setRouteNote(event.target.value)}
              />
            </label>

            <div className="route-preset-row">
              {routePresets.map(([from, to, label]) => (
                <button
                  key={label}
                  className="route-preset"
                  type="button"
                  onClick={() => {
                    setFromPlace(from);
                    setToPlace(to);
                  }}
                >
                  <MapPin size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="planner-actions">
              <button className="primary-btn" type="button" onClick={analyzeRoute}>
                {liveRouteLoading ? <RefreshCw size={18} /> : <WandSparkles size={18} />}
                Canlı rota kontrol et
              </button>
              <a
                className="secondary-btn"
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={18} />
                Haritada aç
              </a>
              <span className="action-meta">
                {departureMode === "now"
                  ? "Google Routes API bağlıysa anlık trafik kullanılır."
                  : "İleri tarihlerde sonuç trafik değişimine göre farklılaşabilir."}
              </span>
            </div>
          </div>

          <div className="route-map-panel glass">
            <div className="analysis-map-header">
              <strong>{fromPlace || "Başlangıç"} → {toPlace || "Varış"}</strong>
              <span>
                {isLiveReady
                  ? `${liveRoute.distanceKm} km · ${liveRoute.duration}`
                  : "Google rota bağlantısı"}
              </span>
            </div>
            <div className="route-canvas" aria-label="Rota haritası ön izlemesi">
              <div className="map-grid" />
              <div className="map-road main" />
              <div className="map-road side one" />
              <div className="map-road side two" />
              <div className="map-pin start"><Navigation size={18} /></div>
              <div className="map-pin end"><MapPin size={18} /></div>
              <div className="map-alert accident">Kaza riski</div>
              <div className="map-alert work">Çalışma</div>
              <div className="map-alert toll">Ücretli yol</div>
              <div className="map-car"><Route size={20} /></div>
            </div>
          </div>
        </div>

        <div className="route-risk-grid">
          {routeRisks.map(({ icon: Icon, label, value }) => (
            <article key={label} className="route-risk-card glass">
              <div className="route-risk-icon">
                <Icon size={20} />
              </div>
              <div>
                <strong>{label}</strong>
                <p>{value}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="ai-route-report glass gemini-border">
          <div>
            <span className="eyebrow">Canlı yol raporu</span>
            <p>{aiRouteReport || fallbackRouteReport}</p>
            {isLiveReady ? (
              <div className="live-route-meta">
                <span><Clock size={15} /> Sorgu: {liveRoute.requestedAt}</span>
                <span>Kaynak: Google Routes API</span>
              </div>
            ) : null}
            {liveRoute && !liveRoute.ok && liveRoute.activationUrl ? (
              <div className="live-route-meta">
                <a href={liveRoute.activationUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  Routes API'yi etkinleştir
                </a>
              </div>
            ) : null}
          </div>
          <span>{aiLoading || liveRouteLoading ? "Kontrol ediliyor" : isLiveReady ? "Canlı veri" : "Harita bekliyor"}</span>
        </div>
      </section>

      <section className="section results reveal">
        <div className="section-heading">
          <span className="eyebrow">DriveWise araç önerisi</span>
          <h2>Yokuş, viraj, yol koşulu ve yol üstü olasılıklara göre 3 araç.</h2>
          <p>
            Öneriler rota analizindeki eğim, dağ/viraj, yol zemini, trafik, çalışma ve uzun yol
            sinyallerine göre yeniden puanlanır.
          </p>
        </div>

        <div className="recommendation-grid route-recommendation-grid">
          {routeVehicleRecommendations.map(({ vehicle, score, reason }) => (
            <article key={vehicle.id} className="recommendation-card route-recommendation-card">
              <div className="vehicle-visual">
                {vehicle.imageUrl ? <img src={vehicle.imageUrl} alt={vehicle.name} /> : vehicle.emoji}
                <div className="badge">{vehicle.segment}</div>
              </div>
              <p className="route-ai-reason ai-insight-copy">
                <span className="ai-sparkles" aria-hidden="true">
                  <WandSparkles size={16} strokeWidth={2.4} />
                </span>
                {reason}
              </p>
              <h3>{vehicle.name}</h3>
              <div className="score">{score}/100 rota uygunluğu</div>
              <div className="recommendation-specs">
                <div className="spec-row">
                  <span>Performans</span>
                  <strong>{vehicle.performance}/10</strong>
                </div>
                <div className="spec-row">
                  <span>Konfor</span>
                  <strong>{vehicle.comfort}/10</strong>
                </div>
                <div className="spec-row">
                  <span>Yol uyumu</span>
                  <strong>{vehicle.routeFit.join(" · ")}</strong>
                </div>
                <div className="spec-row">
                  <span>Tüketim</span>
                  <strong>{vehicle.consumption} L/100km</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

    </>
  );
}
