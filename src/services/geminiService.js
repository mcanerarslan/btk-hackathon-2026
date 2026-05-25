import { assistantReply } from "../data";
import { orchestrateAiAgents } from "./aiAgents";

export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_ENDPOINT = "/api/gemini";
const RETRYABLE_GEMINI_STATUSES = new Set([429, 500, 502, 503, 504]);

class GeminiApiError extends Error {
  constructor(status, detail) {
    super(`Gemini API error: ${status}${detail ? ` - ${detail}` : ""}`);
    this.name = "GeminiApiError";
    this.status = status;
    this.detail = detail;
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getRetryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after") || 0);
  if (retryAfter > 0) return Math.min(retryAfter * 1000, 3000);
  return attempt === 0 ? 700 : 1400;
}

function isRetryableGeminiError(error) {
  return RETRYABLE_GEMINI_STATUSES.has(Number(error?.status));
}

export function getGeminiUserMessage(error) {
  const message = typeof error === "string" ? error : error?.message || "";

  if (/missing-api-key/i.test(message)) {
    return "Gemini API anahtarı bulunamadı; yerel öneri motoru devrede.";
  }

  if (/Gemini API error:\s*(429|503)|high demand|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(message)) {
    return "Gemini şu anda yoğun. Yerel öneri motoru devrede; biraz sonra tekrar deneyebilirsin.";
  }

  if (/Gemini API error:\s*(500|502|504)/i.test(message)) {
    return "Gemini geçici olarak yanıt veremedi. Yerel öneri motoru devrede.";
  }

  if (/invalid-json|invalid-gemini-text/i.test(message)) {
    return "Gemini yanıtı doğrulanamadı; yerel öneri motoru devrede.";
  }

  return message ? "Gemini yanıtı alınamadı; yerel öneri motoru devrede." : "";
}

export function getGeminiStatus() {
  return {
    model: GEMINI_MODEL,
    hasApiKey: true,
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
  if (/^\*\*[^*]+:\*\*$/.test(cleaned)) return true;
  if (/^[^.!?]+:\s*$/.test(cleaned)) return true;

  return false;
}

function isUsableGeminiText(text) {
  const cleaned = cleanGeminiText(text);
  if (cleaned.length < 20) return false;
  const withoutMarkdown = cleaned.replace(/\*\*/g, "").trim();
  if (/^kullan[ıi]c[ıi]\s+(sorusu|talebi)\s*:/i.test(withoutMarkdown)) return false;
  if (/^(rota|yolcu say[ıi]s[ıi]|bagaj|bebek koltu[gğ]u|yol tipi|[oö]ncelik|g[uü]nl[uü]k b[uü]t[cç]e|[oö]nerilen ara[cç]|segment|fiyat|yak[ıi]t|t[uü]ketim|koltuk|konfor|performans|not)\s*:/i.test(withoutMarkdown)) {
    return false;
  }
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
    "Sen Gemini destekli DriveWise rota ve araç seçim uzmanisin.",
    "Yanitini Turkce ver.",
    "Gundelik, dogal ve kisa konus; musteri temsilcisi gibi sakin ve net cevap ver.",
    "Markdown basligi, kalin yazi, etiketli alan veya 'Kullanici talebi' gibi prompt tekrari yazma.",
    "Kullanici selam verirse kisa karsilik ver; gereksiz kapanis sozu yazma.",
    "Soru arac kiralama disindaysa konuyu nazikce filo, rota, bagaj, butce veya rezervasyon baglamina bagla.",
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
    "Sen Gemini destekli DriveWise Akilli Rota Asistani icin karar veren uzman agentsin.",
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

async function requestGeminiText(prompt, maxOutputTokens, attempt, options = {}) {
  const generationConfig = {
    temperature: options.temperature ?? 0.35,
    maxOutputTokens,
  };

  if (options.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
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

    const error = new GeminiApiError(response.status, errorDetail);
    if (attempt < 2 && isRetryableGeminiError(error)) {
      await wait(getRetryDelay(response, attempt));
      return requestGeminiText(prompt, maxOutputTokens, attempt + 1, options);
    }

    throw error;
  }

  return response.json();
}

async function fetchGeminiText(prompt, maxOutputTokens = 320, options = {}) {
  console.info(`[AI] Gemini calistiriliyor: ${GEMINI_MODEL}`);
  const payload = await requestGeminiText(prompt, maxOutputTokens, 0, options);
  console.info("[AI] Gemini yaniti alindi");
  const finishReason = payload?.candidates?.[0]?.finishReason || "";
  const text = cleanGeminiText(extractGeminiText(payload));

  if (finishReason === "MAX_TOKENS") {
    console.warn("[AI] Gemini metni token limiti nedeniyle kesildi");
    return null;
  }

  if (options.validate === false || isUsableGeminiText(text)) return text;

  console.warn(
    `[AI] Gemini metni kullanilamadi: finishReason=${finishReason || "unknown"} length=${text.length}`,
  );
  return null;
}

export async function sendTripQuestion({ question, state, topVehicle, currentRoute, fallbackText: fallbackOverride }) {
  const fallbackText = fallbackOverride || assistantReply(question, state, topVehicle, currentRoute);

  try {
    const prompt = buildTripAssistantPrompt(question, state, topVehicle, currentRoute);
    const text = await fetchGeminiText(prompt, 260);
    return { text: text || fallbackText, source: text ? "gemini" : "fallback", error: text ? "" : "invalid-gemini-text" };
  } catch (error) {
    console.warn(`[AI] Gemini fallback kullanildi: ${error.message}`);
    return { text: fallbackText, source: "fallback", error: error.message };
  }
}

export async function generateGeminiText(prompt, fallbackText, maxOutputTokens = 420, options = {}) {
  try {
    const text = await fetchGeminiText(prompt, maxOutputTokens, options);
    return { text: text || fallbackText, source: text ? "gemini" : "fallback", error: text ? "" : "invalid-gemini-text" };
  } catch (error) {
    console.warn(`[AI] Gemini fallback kullanildi: ${error.message}`);
    return { text: fallbackText, source: "fallback", error: error.message };
  }
}

export async function generateStructuredRecommendation(state, vehicles) {
  const localRecommendation = orchestrateAiAgents(vehicles, state);

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
