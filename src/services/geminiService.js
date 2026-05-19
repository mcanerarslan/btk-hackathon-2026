import { assistantReply } from "../data";
import { orchestrateAiAgents } from "./aiAgents";

export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const USE_DEV_GEMINI_PROXY = import.meta.env.DEV;
const GEMINI_ENDPOINT = USE_DEV_GEMINI_PROXY
  ? "/api/gemini"
  : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function getGeminiStatus() {
  return {
    model: GEMINI_MODEL,
    hasApiKey: Boolean(GEMINI_API_KEY),
    provider: "Google Gemini",
  };
}

export function logAiDevEvent(event) {
  if (!import.meta.env.DEV) return;

  fetch("/api/ai-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {
    // Dev logging must never block the user flow.
  });
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

function cleanGeminiText(text) {
  return String(text || "")
    .replace(/^\s*merhaba[!,.\s]*/i, "")
    .trim();
}

function stripJsonFence(text) {
  return String(text || "")
    .replace(/^\s*```json\s*/i, "")
    .replace(/^\s*```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function parseGeminiJson(text) {
  const cleaned = stripJsonFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function hasBrokenFormatting(text) {
  const cleaned = cleanGeminiText(text);
  const boldMarkerCount = (cleaned.match(/\*\*/g) || []).length;
  const openParenCount = (cleaned.match(/\(/g) || []).length;
  const closeParenCount = (cleaned.match(/\)/g) || []).length;

  if (boldMarkerCount % 2 !== 0) return true;
  if (openParenCount > closeParenCount) return true;
  if (/[\s(:\-–—,]$/.test(cleaned)) return true;
  if (/^\*\*[^*]+$/.test(cleaned)) return true;

  return false;
}

function isUsableGeminiText(text) {
  const cleaned = cleanGeminiText(text);
  if (cleaned.length < 20) return false;
  if (/\b(by\s+bybe|bybe|anq)\b/i.test(cleaned)) return false;
  if (/([a-zçğıöşü])\1{4,}/i.test(cleaned)) return false;
  if (hasBrokenFormatting(cleaned)) return false;

  return true;
}

export function buildTripAssistantPrompt(question, state, topVehicle, currentRoute) {
  const vehicleContext = topVehicle
    ? [
        `Onerilen arac: ${topVehicle.name}`,
        `Segment: ${topVehicle.segment}`,
        `Fiyat: ${topVehicle.price} TL/gun`,
        `Yakit: ${topVehicle.fuel}`,
        `Tuketim: ${topVehicle.consumption} L/100km`,
        `Bagaj: ${topVehicle.luggage} L`,
        `Koltuk: ${topVehicle.seats}`,
        `Konfor: ${topVehicle.comfort}/10`,
        `Performans: ${topVehicle.performance}/10`,
        `Not: ${topVehicle.notes}`,
      ].join("\n")
    : "Onerilen arac: yok";

  return [
    "Sen Gemini destekli bir rent a car ve rota karar uzmanisin.",
    "Yanitini Turkce ver.",
    "Kisa, net ve aciklamali cevap ver.",
    "Selamlama, kapanis sozu veya anlamsiz ek metin yazma.",
    "Kullaniciya arac onerirken rota, yolcu, bagaj ve butce verisine dayan.",
    "Uydurma veri ekleme. Belirsiz kisimlari varsayim olarak belirt.",
    "",
    `Kullanici sorusu: ${question}`,
    `Rota: ${currentRoute}`,
    `Yolcu sayisi: ${state.adults + state.children}`,
    `Bagaj: ${state.largeBags} buyuk, ${state.mediumBags} orta, ${state.backpacks} sirt cantasi`,
    `Bebek koltugu: ${state.seats}`,
    `Yol tipi: ${state.routeType}`,
    `Oncelik: ${state.priority}`,
    `Gunluk butce: ${state.budget || "belirtilmedi"} TL`,
    vehicleContext,
  ].join("\n");
}

export function buildStructuredRecommendationPrompt(state, vehicles, localRecommendation) {
  const vehicleCatalog = vehicles
    .filter((vehicle) => vehicle.available !== false)
    .map((vehicle) => ({
      name: vehicle.name,
      class: vehicle.segment,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      dailyPrice: vehicle.price,
      luggageLitres: vehicle.luggage,
      seats: vehicle.seats,
      consumption: vehicle.consumption,
      comfort: vehicle.comfort,
      performance: vehicle.performance,
      routeFit: vehicle.routeFit,
      notes: vehicle.notes,
    }));

  return [
    "Sen Gemini destekli AI Rent A Car ve Akilli Rota Asistani icin karar veren uzman agentsin.",
    "Yalnizca gecerli JSON dondur. Markdown, aciklama, kod blogu veya selamlama yazma.",
    "Verilen arac katalogu disinda arac uydurma.",
    "Yaniti Turkce yaz.",
    "Karar verirken Route Analysis Agent, Vehicle Match Agent, Budget Optimization Agent, Explanation Agent ve Safety & Suitability Agent gibi dusun.",
    "JSON semasi tam olarak su alanlari icermeli:",
    '{"routeAnalysis":"...","bestVehicle":{"name":"...","reason":"...","score":92},"economicOption":{"name":"...","reason":"..."},"comfortOption":{"name":"...","reason":"..."},"warnings":["...","..."],"summary":"..."}',
    "",
    "Kullanici seyahat verisi:",
    JSON.stringify(
      {
        from: state.fromCity,
        to: state.toCity,
        departureDate: state.departureDate,
        returnDate: state.returnDate,
        purpose: state.purpose,
        routeType: state.routeType,
        passengers: state.adults + state.children,
        children: state.children,
        childSeatNeed: state.seats,
        luggage: {
          large: state.largeBags,
          medium: state.mediumBags,
          backpacks: state.backpacks,
          oversize: state.oversize,
        },
        fuelPriority: state.fuelPriority,
        comfortPriority: state.comfortPriority,
        vehiclePreference: state.vehiclePreference,
        priority: state.priority,
        budgetMin: state.budgetMin,
        budgetMax: state.budget,
      },
      null,
      2,
    ),
    "",
    "Arac katalogu:",
    JSON.stringify(vehicleCatalog, null, 2),
    "",
    "Yerel agent on analizi:",
    JSON.stringify(localRecommendation, null, 2),
  ].join("\n");
}

async function fetchGeminiText(prompt, maxOutputTokens = 320) {
  if (!GEMINI_API_KEY) return null;

  console.info(`[AI] Gemini calistiriliyor: ${GEMINI_MODEL}`);

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: USE_DEV_GEMINI_PROXY
      ? { "Content-Type": "application/json" }
      : {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorPayload = await response.json();
      errorDetail = errorPayload?.error?.message || errorPayload?.error || "";
    } catch {
      errorDetail = "";
    }
    throw new Error(`Gemini API error: ${response.status}${errorDetail ? ` - ${errorDetail}` : ""}`);
  }

  const payload = await response.json();
  console.info("[AI] Gemini yaniti alindi");
  const finishReason = payload?.candidates?.[0]?.finishReason || "";
  const text = cleanGeminiText(extractGeminiText(payload));

  if (isUsableGeminiText(text)) return text;

  console.warn(
    `[AI] Gemini metni kullanilamadi: finishReason=${finishReason || "unknown"} length=${text.length}`,
  );
  return null;
}

export async function sendTripQuestion({ question, state, topVehicle, currentRoute, fallbackText: fallbackOverride }) {
  const fallbackText = fallbackOverride || assistantReply(question, state, topVehicle, currentRoute);

  if (!GEMINI_API_KEY) {
    return { text: fallbackText, source: "fallback", error: "missing-api-key" };
  }

  try {
    const prompt = buildTripAssistantPrompt(question, state, topVehicle, currentRoute);
    const text = await fetchGeminiText(prompt, 260);
    return { text: text || fallbackText, source: text ? "gemini" : "fallback", error: text ? "" : "invalid-gemini-text" };
  } catch (error) {
    console.warn(`[AI] Gemini fallback kullanildi: ${error.message}`);
    return { text: fallbackText, source: "fallback", error: error.message };
  }
}

export async function generateGeminiText(prompt, fallbackText, maxOutputTokens = 420) {
  if (!GEMINI_API_KEY) {
    return { text: fallbackText, source: "fallback", error: "missing-api-key" };
  }

  try {
    const text = await fetchGeminiText(prompt, maxOutputTokens);
    return { text: text || fallbackText, source: text ? "gemini" : "fallback", error: text ? "" : "invalid-gemini-text" };
  } catch (error) {
    console.warn(`[AI] Gemini fallback kullanildi: ${error.message}`);
    return { text: fallbackText, source: "fallback", error: error.message };
  }
}

export async function generateStructuredRecommendation(state, vehicles) {
  const localRecommendation = orchestrateAiAgents(vehicles, state);

  if (!GEMINI_API_KEY) {
    return { data: localRecommendation, source: "fallback", error: "missing-api-key" };
  }

  try {
    const prompt = buildStructuredRecommendationPrompt(state, vehicles, localRecommendation);
    const text = await fetchGeminiText(prompt, 900);
    const parsed = parseGeminiJson(text);

    if (!parsed?.routeAnalysis || !parsed?.bestVehicle?.name) {
      return {
        data: {
          ...localRecommendation,
          rawText: text || "",
        },
        source: "fallback",
        error: text ? "invalid-json" : "invalid-gemini-text",
      };
    }

    return {
      data: {
        ...localRecommendation,
        ...parsed,
        source: "gemini-json",
      },
      source: "gemini",
      error: "",
    };
  } catch (error) {
    console.warn(`[AI] Gemini JSON fallback kullanildi: ${error.message}`);
    return { data: localRecommendation, source: "fallback", error: error.message };
  }
}
