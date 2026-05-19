import { useEffect, useMemo, useState } from "react";
import {
  buildCatalogSuggestions,
  findRiskyMatches,
  findVehicleDataGaps,
  generateAdminInsightCategory,
  generateExpertReport,
} from "../services/adminExpertService";
import { useTrip } from "../TripContext";

const insightCategories = [
  { key: "dataGaps", title: "Eksik araç verisi", fallback: findVehicleDataGaps },
  { key: "riskyMatches", title: "Riskli rota/araç", fallback: findRiskyMatches },
  { key: "suggestions", title: "Geliştirme önerisi", fallback: buildCatalogSuggestions },
];

function SeverityBadge({ severity }) {
  const label = severity === "high" ? "Yüksek" : severity === "medium" ? "Orta" : "Düşük";
  return <span className={`severity-badge ${severity}`}>{label}</span>;
}

function InsightList({ title, items, loading, source, updatedAt, onRefresh }) {
  return (
    <div className="admin-insight-card glass">
      <div className="admin-insight-head">
        <div className="section-heading compact">
          <span className="eyebrow">{title}</span>
          <h3>{items.length} kayıt</h3>
        </div>
        <button className="secondary-btn admin-refresh-btn" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "AI tarıyor" : "AI ile yenile"}
        </button>
      </div>
      <p className="admin-insight-meta">
        {source === "gemini" ? "Gemini buldu" : "Yerel analiz"}{updatedAt ? ` · ${updatedAt}` : ""}
      </p>
      <div className="admin-insight-list">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="admin-insight-row">
              <SeverityBadge severity={item.severity} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="analysis-snippet">Bu başlıkta kritik kayıt bulunmadı.</p>
        )}
      </div>
    </div>
  );
}

export function AdminAiPage() {
  const { vehicles, state, aiRequestLog, geminiStatus } = useTrip();
  const [expertReport, setExpertReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(() =>
    Object.fromEntries(
      insightCategories.map((category) => [
        category.key,
        { items: [], source: "fallback", updatedAt: "" },
      ]),
    ),
  );
  const [insightLoading, setInsightLoading] = useState({});

  const fallbackInsights = useMemo(
    () =>
      Object.fromEntries(
        insightCategories.map((category) => [
          category.key,
          { items: category.fallback(vehicles, state), source: "fallback", updatedAt: "" },
        ]),
      ),
    [vehicles, state],
  );

  const runExpert = async () => {
    setLoading(true);
    const report = await generateExpertReport(vehicles, state);
    setExpertReport(report);
    setLoading(false);
  };

  const refreshInsight = async (type) => {
    setInsightLoading((current) => ({ ...current, [type]: true }));
    const result = await generateAdminInsightCategory(type, vehicles, state);
    setInsights((current) => ({ ...current, [type]: result }));
    setInsightLoading((current) => ({ ...current, [type]: false }));
  };

  useEffect(() => {
    runExpert();
    insightCategories.forEach((category) => {
      refreshInsight(category.key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">Gemini Uzman</span>
        <h2>Katalog ve rota karar kalitesini denetle</h2>
        <p>Eksik araç verisi, riskli rota eşleşmeleri, geliştirme önerileri ve Gemini bağlantı durumu bu panelde izlenir.</p>
      </div>

      <div className="admin-ai-grid">
        <article className="gemini-card gemini-border admin-ai-hero">
          <div className="analysis-map-header">
            <div>
              <span className="eyebrow">API durumu</span>
              <h3>Google Gemini</h3>
            </div>
            <span className={`admin-badge ${geminiStatus.hasApiKey ? "success" : "warning"}`}>
              {geminiStatus.hasApiKey ? "API KEY OK" : "FALLBACK"}
            </span>
          </div>
          <div className="vehicle-specs">
            <div className="metric-row">
              <span>Model</span>
              <strong>{geminiStatus.model}</strong>
            </div>
            <div className="metric-row">
              <span>Sağlayıcı</span>
              <strong>{geminiStatus.provider}</strong>
            </div>
            <div className="metric-row">
              <span>Son çıktı</span>
              <strong>{expertReport?.source === "gemini" ? "Gemini" : "Fallback"}</strong>
            </div>
          </div>
          <button className="primary-btn" type="button" onClick={runExpert} disabled={loading}>
            {loading ? "Analiz ediliyor" : "Uzman analizini yenile"}
          </button>
        </article>

        <article className="admin-insight-card glass">
          <div className="section-heading compact">
            <span className="eyebrow">Gemini Rent Expert özeti</span>
            <h3>Operasyon önerisi</h3>
          </div>
          <p className="analysis-snippet">{expertReport?.summary || "Uzman raporu hazırlanıyor."}</p>
          {expertReport?.demoScenario ? <p className="analysis-snippet">{expertReport.demoScenario}</p> : null}
        </article>
      </div>

      <div className="admin-ai-grid three">
        {insightCategories.map((category) => {
          const insight = insights[category.key]?.items?.length || insights[category.key]?.updatedAt
            ? insights[category.key]
            : fallbackInsights[category.key];

          return (
            <InsightList
              key={category.key}
              title={category.title}
              items={insight.items}
              loading={Boolean(insightLoading[category.key])}
              source={insight.source}
              updatedAt={insight.updatedAt}
              onRefresh={() => refreshInsight(category.key)}
            />
          );
        })}
      </div>

      <div className="admin-insight-card glass" style={{ marginTop: 18 }}>
        <div className="section-heading compact">
          <span className="eyebrow">Son AI istekleri</span>
          <h3>Gemini ve fallback izleri</h3>
        </div>
        <div className="admin-log-table">
          {(aiRequestLog.length ? aiRequestLog : [{ id: "empty", createdAt: "-", area: "Henüz istek yok", question: "Widget veya uzman panelini kullan", source: "-", model: geminiStatus.model }]).map((log) => (
            <div key={log.id} className="admin-log-row">
              <span>{log.createdAt}</span>
              <strong>{log.area}</strong>
              <span>{log.source}</span>
              <span>{log.model}</span>
              <p>{log.question}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
