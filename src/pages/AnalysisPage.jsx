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
import { analysisStages, comparisonMetrics, formatComparisonValue } from "../data";
import {
  buildDecisionSummary,
  buildEliminationNotes,
  buildRecommendationSet,
  estimateFuelCost,
  getLuggageFit,
  getRouteLabel,
} from "../services/recommendationService";
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

function buildRoutePrompt(from, to, profile, topVehicle, note) {
  return [
    `${from} - ${to} rotasını rent a car müşterisi için analiz et.`,
    "Kısa Türkçe yanıt ver. Kaza, yol çalışması, ücretli yol, yokuş/eğim, dağ ve viraj risklerini ayrı ayrı belirt.",
    "Canlı trafik verisi kesin değilse bunu varsayım olarak söyle.",
    note ? `Kullanıcı notu: ${note}` : "",
    topVehicle ? `Önerilen araç: ${topVehicle.name}, ${topVehicle.segment}.` : "",
    `Tahmini mesafe: ${profile.distance} km.`,
    `Yol profili: ${profile.roadCondition}`,
    `Ücretli yol: ${profile.tolls}`,
    `Eğim: ${profile.slope}`,
    `Viraj: ${profile.curve}`,
  ].join("\n");
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

export function AnalysisPage() {
  const {
    analysisVisible,
    analysisStep,
    analysisStatus,
    analysisSnippet,
    ranked,
    state,
    setState,
    vehicles,
    aiRecommendation,
    aiRecommendationLoading,
    aiRecommendationError,
    buildRiskWarnings,
    askGemini,
  } = useTrip();
  const [fromPlace, setFromPlace] = useState(state.fromCity);
  const [toPlace, setToPlace] = useState(state.toCity);
  const [routeNote, setRouteNote] = useState("");
  const [aiRouteReport, setAiRouteReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [departureMode, setDepartureMode] = useState("now");
  const [futureDeparture, setFutureDeparture] = useState(`${state.departureDate}T09:00`);
  const [liveRoute, setLiveRoute] = useState(null);
  const [liveRouteLoading, setLiveRouteLoading] = useState(false);
  const top = ranked[0]?.vehicle;
  const totalPassengers = state.adults + state.children;
  const luggageNeed = state.largeBags * 3 + state.mediumBags * 2 + state.backpacks;
  const progress = `${((analysisStep + 1) / analysisStages.length) * 100}%`;
  const routeProfile = useMemo(
    () => inferRouteProfile(fromPlace, toPlace, state.routeType),
    [fromPlace, toPlace, state.routeType],
  );
  const recommendationSet = buildRecommendationSet(vehicles, state);
  const decisionCards = [
    ["En ekonomik araç", recommendationSet.economical],
    ["En dengeli araç", recommendationSet.balanced],
    ["En konforlu/güvenli araç", recommendationSet.comfort],
  ].filter(([, item]) => item?.vehicle);
  const selectedIds = Array.from(new Set(decisionCards.map(([, item]) => item.vehicle.id)));
  const eliminationNotes = buildEliminationNotes(vehicles, state, selectedIds);
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
  const findRecommendedVehicle = (item) =>
    vehicles.find((vehicle) => vehicle.id === item?.id || vehicle.name === item?.name);

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
          <h2>Yer veya mekan yaz, robot yol risklerini ve araç uyumunu çıkarsın.</h2>
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

      <section id="analysis" className="section analysis reveal">
        <div className="section-heading">
          <span className="eyebrow">Kontrol özeti</span>
          <h2>Rota, bagaj ve bütçe aynı kararda birleşiyor.</h2>
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
              <strong>Rota kontrolü</strong>
              <span>{analysisVisible ? analysisStatus : "Canlı ön analiz"}</span>
            </div>
            <div className="analysis-route">
              <div className="analysis-node" />
              <div className="analysis-line" />
              <div className="analysis-node end" />
              <div className="analysis-car">🚙</div>
            </div>
            <div className="analysis-snippet">
              {analysisVisible ? analysisSnippet : `${fromPlace} - ${toPlace} rotasında yol koşulları, ücretli geçişler ve araç uyumu ön analizde gösteriliyor.`}
            </div>
          </div>
        </div>
      </section>

      <section className="section results reveal">
        <div className="section-heading">
          <span className="eyebrow">Karar özeti</span>
          <h2>Öneri kartları kısa ve kontrol edilebilir.</h2>
        </div>
        <div className="agent-result-grid">
          <article className="agent-result-card glass gemini-border">
            <span className="eyebrow">Rota Analizi</span>
            <p>{aiRecommendationLoading ? "Gemini JSON sonucu bekleniyor..." : aiRecommendation?.routeAnalysis || fallbackRouteReport}</p>
          </article>
          {[
            ["En Uygun Araç", aiRecommendation?.bestVehicle],
            ["Ekonomik Alternatif", aiRecommendation?.economicOption],
            ["Konfor Alternatifi", aiRecommendation?.comfortOption],
          ].map(([title, item]) => {
            const matchedVehicle = findRecommendedVehicle(item);
            return (
              <article key={title} className="agent-result-card glass">
                <span className="eyebrow">{title}</span>
                <h3>{item?.name || matchedVehicle?.name || "Hesaplanıyor"}</h3>
                {item?.score ? <div className="score">{item.score}/100 AI skoru</div> : null}
                {matchedVehicle ? (
                  <div className="mini-spec-row">
                    <span>{matchedVehicle.segment}</span>
                    <span>{matchedVehicle.fuel}</span>
                    <span>₺{matchedVehicle.price}/gün</span>
                    <span>{matchedVehicle.luggage} L</span>
                  </div>
                ) : null}
                <p>{item?.reason || "Yerel agent skoru ve Gemini yanıtı birleştiriliyor."}</p>
              </article>
            );
          })}
          <article className="agent-result-card glass">
            <span className="eyebrow">Dikkat Edilmesi Gerekenler</span>
            <ul className="risk-list compact">
              {(aiRecommendation?.warnings?.length ? aiRecommendation.warnings : buildRiskWarnings(top, state)).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </article>
          <article className="agent-result-card glass gemini-border">
            <span className="eyebrow">Neden Bu Araç?</span>
            <p>{aiRecommendation?.summary || buildDecisionSummary(top, state)}</p>
            <span className="source-pill">{aiRecommendation?.source === "gemini-json" ? "Gemini doğruladı" : "Yerel doğrulama"}</span>
          </article>
        </div>

        <div className="section-heading compact">
          <span className="eyebrow">Araç öneri kartları</span>
          <h2>3 ana seçenek hazır.</h2>
        </div>
        <div className="recommendation-grid">
          {decisionCards.map(([highlight, item]) => {
            const cost = estimateFuelCost(item.vehicle, state);
            const luggage = getLuggageFit(item.vehicle, state);
            return (
              <article key={`${highlight}-${item.vehicle.id}`} className="recommendation-card">
                <div className="vehicle-visual" style={{ marginBottom: 14 }}>
                  {item.vehicle.imageUrl ? (
                    <img
                      src={item.vehicle.imageUrl}
                      alt={item.vehicle.name}
                    />
                  ) : (
                    item.vehicle.emoji
                  )}
                  <div className="badge">{highlight}</div>
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
                  <div className="spec-row">
                    <span>Yakıt tahmini</span>
                    <strong>₺{cost.fuel.toLocaleString("tr-TR")}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Bagaj uyumu</span>
                    <strong>{luggage.label}</strong>
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
              Bu rota için {totalPassengers} yolcu, yaklaşık {luggageNeed} parça eşdeğeri bagaj ve
              günlük ₺{Number(state.budget).toLocaleString("tr-TR")} bütçe hesaplandı. {top?.name} bagaj ve
              yolcu dengesini korurken {getRouteLabel(state.routeType)} için daha güvenli ve dengeli bir seçenek sundu.
            </p>
          </div>
          <div className="decision-tags">
            <span>Rota: {state.routeType}</span>
            <span>Öncelik: {state.priority}</span>
            <span>Bütçe: ₺{Number(state.budget).toLocaleString("tr-TR")}/gün</span>
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

      <section className="section explain reveal">
        <div className="decision-panel glass">
          <div>
            <span className="eyebrow">Son karar özeti</span>
            <h2>Robotun net önerisi</h2>
            <p>{buildDecisionSummary(top, state)}</p>
          </div>
        </div>
        <div className="risk-panel glass">
          <div className="risk-head">
            <span className="eyebrow">Elendi</span>
            <strong>Hangi araç neden geride kaldı?</strong>
          </div>
          <ul className="risk-list">
            {eliminationNotes.map((note) => (
              <li key={note.id}>
                <strong>{note.name}:</strong> {note.reason}
              </li>
            ))}
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
