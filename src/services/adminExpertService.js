import { buildRiskWarnings, computeScore } from "../data";
import { generateGeminiText, getGeminiStatus } from "./geminiService";

const requiredFields = ["name", "segment", "price", "fuel", "transmission", "consumption", "luggage", "seats", "comfort", "performance", "routeFit", "notes"];

const insightDefinitions = {
  dataGaps: {
    label: "Eksik araç verisi",
    fallback: findVehicleDataGaps,
    goal: "katalogda öneri kalitesini düşüren eksik veya zayıf araç verilerini bul",
  },
  riskyMatches: {
    label: "Riskli rota/araç eşleşmesi",
    fallback: findRiskyMatches,
    goal: "aktif rota ve kullanıcı ihtiyacı için riskli araç eşleşmelerini bul",
  },
  suggestions: {
    label: "Geliştirme önerisi",
    fallback: buildCatalogSuggestions,
    goal: "adminin katalog, filtre, paket veya demo değerini artıracak geliştirme aksiyonlarını bul",
  },
};

function compactVehicleForAdmin(vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    category: vehicle.category,
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
    notes: vehicle.notes,
    aiSummary: vehicle.aiSummary,
  };
}

function normalizeSeverity(severity) {
  const normalized = String(severity || "").toLowerCase();
  if (["high", "medium", "low"].includes(normalized)) return normalized;
  if (/yuksek|yüksek|kritik/.test(normalized)) return "high";
  if (/orta/.test(normalized)) return "medium";
  return "low";
}

function firstTextValue(item, keys) {
  return keys
    .map((key) => item?.[key])
    .find((value) => value !== undefined && value !== null && String(value).trim());
}

function parseInsightItems(text, fallbackItems) {
  const cleaned = String(text || "")
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : Object.values(parsed || {}).find(Array.isArray);

    if (!Array.isArray(items)) return { items: fallbackItems, parsed: false };
    if (!items.length) return { items: [], parsed: true };

    const normalizedItems = items
      .map((item, index) => ({
        id: String(item.id || `ai-insight-${index + 1}`),
        title: String(firstTextValue(item, ["title", "baslik", "başlık", "issue", "sorun", "konu"]) || "").trim(),
        severity: normalizeSeverity(firstTextValue(item, ["severity", "onem", "önem", "risk", "seviye"])),
        text: String(
          firstTextValue(item, [
            "text",
            "description",
            "aciklama",
            "açıklama",
            "detail",
            "detay",
            "reason",
            "gerekce",
            "gerekçe",
            "recommendation",
            "oneri",
            "öneri",
          ]) || "",
        ).trim(),
      }))
      .filter((item) => item.title && item.text)
      .slice(0, 5);

    return normalizedItems.length
      ? { items: normalizedItems, parsed: true }
      : { items: fallbackItems, parsed: false };
  } catch {
    return { items: fallbackItems, parsed: false };
  }
}

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
  const compactVehicles = vehicles.map(compactVehicleForAdmin);

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

export async function generateAdminInsightCategory(type, vehicles, state) {
  const definition = insightDefinitions[type];
  if (!definition) {
    throw new Error(`Unknown admin insight type: ${type}`);
  }

  const fallbackItems = definition.fallback(vehicles, state);
  const compactVehicles = vehicles.map(compactVehicleForAdmin);
  const prompt = [
    "Sen Gemini Rent Expert adli admin karar destek uzmanisin.",
    "Turkce, kisa, uygulanabilir ve sorun odakli yaz.",
    `${definition.label} kategorisinde ${definition.goal}.`,
    "Sadece gecerli JSON array dondur. Markdown, aciklama veya kod blogu kullanma.",
    "Her eleman su alanlari icersin: id, title, severity, text.",
    "severity sadece high, medium veya low olsun. En fazla 5 kayit uret.",
    `Aktif rota: ${state.fromCity} - ${state.toCity}, rota tipi: ${state.routeType}, yolcu: ${state.adults + state.children}, buyuk valiz: ${state.largeBags}, oncelik: ${state.priority}`,
    `Mevcut yerel analiz: ${JSON.stringify(fallbackItems)}`,
    `Katalog: ${JSON.stringify(compactVehicles)}`,
  ].join("\n");

  const result = await generateGeminiText(prompt, JSON.stringify(fallbackItems), 1600, {
    responseMimeType: "application/json",
    temperature: 0.2,
    validate: false,
  });
  const parsed = result.source === "gemini"
    ? parseInsightItems(result.text, fallbackItems)
    : { items: fallbackItems, parsed: false };

  return {
    items: parsed.items,
    source: parsed.parsed ? "gemini" : "fallback",
    error: parsed.parsed ? "" : result.error || "invalid-admin-insight-json",
    updatedAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}
