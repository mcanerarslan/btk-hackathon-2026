import { buildRiskWarnings, computeScore } from "../data";
import { generateGeminiText, getGeminiStatus } from "./geminiService";

const requiredFields = ["name", "segment", "price", "fuel", "transmission", "consumption", "luggage", "seats", "comfort", "performance", "routeFit", "notes"];

export function findVehicleDataGaps(vehicles) {
  return vehicles.flatMap((vehicle) => {
    const missing = requiredFields.filter((field) => {
      const value = vehicle[field];
      if (Array.isArray(value)) return value.length === 0;
      return value === undefined || value === null || value === "" || value === 0;
    });

    if (!missing.length) return [];

    return [
      {
        id: vehicle.id,
        title: vehicle.name || "Isimsiz arac",
        severity: missing.includes("luggage") || missing.includes("consumption") ? "high" : "medium",
        text: `Eksik alanlar: ${missing.join(", ")}. Oneri kalitesi icin bu verileri tamamla.`,
      },
    ];
  });
}

export function findRiskyMatches(vehicles, state) {
  return vehicles
    .map((vehicle) => ({
      vehicle,
      score: computeScore(vehicle, state),
      warnings: buildRiskWarnings(vehicle, state).filter((warning) => !/dengeli gorunuyor|dengeli görünüyor/i.test(warning)),
    }))
    .filter((item) => item.score < 70 || item.warnings.length > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((item) => ({
      id: item.vehicle.id,
      title: item.vehicle.name,
      severity: item.score < 55 ? "high" : "medium",
      text: `${state.fromCity} - ${state.toCity} rotasinda skor ${item.score}/100. ${item.warnings[0] || "Rota uyumu zayif."}`,
    }));
}

export function buildCatalogSuggestions(vehicles) {
  const segmentCounts = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.category] = (acc[vehicle.category] || 0) + 1;
    return acc;
  }, {});

  const suggestions = [
    {
      id: "filter-capacity",
      title: "Kapasite filtresini one cikar",
      severity: "low",
      text: "Kullanici bagaj ve yolcu bilgisi verdigi icin liste sayfasinda kapasite filtresi daha gorunur olmali.",
    },
    {
      id: "insurance-route",
      title: "Rota bazli sigorta paketi",
      severity: "medium",
      text: "Kis, yayla ve outdoor rotalari icin admin tarafinda sigorta paketi eslestirmesi demo degerini artirir.",
    },
  ];

  if (!segmentCounts.outdoor || segmentCounts.outdoor < 2) {
    suggestions.unshift({
      id: "outdoor-gap",
      title: "Outdoor segmenti zayif",
      severity: "high",
      text: "Katalogda outdoor/yayla rotasina uygun arac sayisi dusuk. En az bir 4x4 veya yuksek yerden SUV ekle.",
    });
  }

  return suggestions;
}

export function getDeterministicExpertReport(vehicles, state) {
  const gaps = findVehicleDataGaps(vehicles);
  const risks = findRiskyMatches(vehicles, state);
  const suggestions = buildCatalogSuggestions(vehicles);
  const bestDemoVehicle = vehicles
    .map((vehicle) => ({ vehicle, score: computeScore(vehicle, state) }))
    .sort((a, b) => b.score - a.score)[0]?.vehicle;

  return {
    status: getGeminiStatus(),
    source: "fallback",
    gaps,
    risks,
    suggestions,
    demoScenario: `${state.fromCity} - ${state.toCity} hattinda ${state.adults + state.children} kisi, ${state.largeBags} buyuk valiz ve ${state.routeType} rota tipiyle ${bestDemoVehicle?.name || "SUV"} onerisi guclu demo senaryosu verir.`,
    summary: "Deterministik uzman analizi: katalog verisi, rota riski ve filtre kalitesi uzerinden incelendi.",
  };
}

export async function generateExpertReport(vehicles, state) {
  const fallbackReport = getDeterministicExpertReport(vehicles, state);
  const compactVehicles = vehicles.map((vehicle) => ({
    name: vehicle.name,
    segment: vehicle.segment,
    price: vehicle.price,
    fuel: vehicle.fuel,
    transmission: vehicle.transmission,
    consumption: vehicle.consumption,
    luggage: vehicle.luggage,
    seats: vehicle.seats,
    routeFit: vehicle.routeFit,
    comfort: vehicle.comfort,
    performance: vehicle.performance,
  }));

  const prompt = [
    "Sen Gemini Rent Expert adli admin karar destek uzmanisin.",
    "Turkce, kisa ve operasyonel yaz.",
    "Arac katalog kalitesi, eksik veri, riskli rota/arac eslesmesi ve gelistirme onerileri uret.",
    "Ciktiyi 1 paragraf ozet olarak ver; JSON verme.",
    `Aktif rota: ${state.fromCity} - ${state.toCity}, rota tipi: ${state.routeType}, yolcu: ${state.adults + state.children}, buyuk valiz: ${state.largeBags}, oncelik: ${state.priority}`,
    `Katalog: ${JSON.stringify(compactVehicles)}`,
  ].join("\n");

  const result = await generateGeminiText(prompt, fallbackReport.summary, 360);
  return {
    ...fallbackReport,
    source: result.source,
    summary: result.text,
    error: result.error,
  };
}
