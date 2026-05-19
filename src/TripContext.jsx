import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  analysisStages,
  buildVehicleSummary,
  buildRiskWarnings,
  clamp,
  computeScore,
  campaigns as baseCampaigns,
  initialState,
  mergeCampaignCatalog,
  vehicles as baseVehicles,
} from "./data";
import {
  generateGeminiText,
  generateStructuredRecommendation,
  getGeminiStatus,
  getGeminiUserMessage,
  logAiDevEvent,
  sendTripQuestion,
} from "./services/geminiService";

const TripContext = createContext(null);

const defaultSiteSettings = {
  siteName: "DriveWise",
  logoText: "D",
  logoUrl: "",
  faviconUrl: "",
  headerTitle: "DriveWise",
  headerSubtitle: "AI destekli akıllı araç seçimi",
  footerText: "Rotanı, bagajını ve bütçeni anlat; DriveWise yolculuğuna en uygun aracı seçsin.",
  footerNote: "Demo panel · login gerekmez",
  footerLegal: "KVKK · Gizlilik · Kullanım Şartları",
};

const defaultReservations = [];
const STORAGE_PREFIX = "drivewise";
const LEGACY_STORAGE_PREFIX = "trip" + "ai";

const storageKey = (name) => `${STORAGE_PREFIX}_${name}`;
const legacyStorageKey = (name) => `${LEGACY_STORAGE_PREFIX}_${name}`;

function getStoredValue(name) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKey(name)) || window.localStorage.getItem(legacyStorageKey(name));
}

function normalizeStoredSiteSettings(settings) {
  const normalized = { ...defaultSiteSettings, ...settings };
  const oldBrandPattern = new RegExp(
    [
      ["ro", "bot\\s*rent"].join(""),
      ["rent\\s*a", "\\s*car"].join(""),
      ["tr", "ip\\s*ai"].join(""),
    ].join("|"),
    "i",
  );

  if (oldBrandPattern.test(normalized.siteName || "")) normalized.siteName = defaultSiteSettings.siteName;
  if (oldBrandPattern.test(normalized.headerTitle || "")) normalized.headerTitle = defaultSiteSettings.headerTitle;
  if (oldBrandPattern.test(normalized.headerSubtitle || "")) normalized.headerSubtitle = defaultSiteSettings.headerSubtitle;
  if (oldBrandPattern.test(normalized.footerText || "")) normalized.footerText = defaultSiteSettings.footerText;
  if (!normalized.logoText || oldBrandPattern.test(normalized.logoText) || normalized.logoText === "R") {
    normalized.logoText = defaultSiteSettings.logoText;
  }

  return normalized;
}

function getFirstNumberBefore(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

function buildQuestionState(question, state) {
  const passengerCount = getFirstNumberBefore(question, /(\d+)\s*(?:kişi|kisi|yolcu)/i);
  const luggageCount = getFirstNumberBefore(question, /(\d+)\s*(?:valiz|bavul|bagaj)/i);

  return {
    ...state,
    ...(passengerCount
      ? {
          adults: passengerCount,
          children: 0,
        }
      : {}),
    ...(luggageCount
      ? {
          largeBags: luggageCount,
          mediumBags: 0,
          backpacks: 0,
        }
      : {}),
  };
}

function normalizeQuestion(text) {
  return text.toLocaleLowerCase("tr-TR");
}

function normalizeSearchText(text) {
  return normalizeQuestion(text)
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function findMentionedVehicle(question, vehicles) {
  const normalizedQuestion = normalizeSearchText(question);
  return vehicles.find((vehicle) => {
    const name = normalizeSearchText(vehicle.name);
    const id = normalizeSearchText(vehicle.id).replace(/-/g, " ");
    return normalizedQuestion.includes(name) || normalizedQuestion.includes(id);
  });
}

function isCatalogAvailabilityQuestion(question) {
  const normalized = normalizeSearchText(question);
  return /(neden|niye|var mi|mevcut mu|katalogda|filoda).*(yok|var|mevcut)|(?:yok|var|mevcut).*(neden|niye|mi)/i.test(
    normalized,
  );
}

function extractRequestedVehicleLabel(question) {
  return question
    .replace(/\?/g, "")
    .replace(/\b(neden|niye|yok|var mı|var mi|mevcut mu|katalogda|filoda|araç|arac|araba)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCatalogAvailabilityReply(question, vehicles, mentionedVehicle) {
  if (mentionedVehicle) {
    return `${mentionedVehicle.name} filoda mevcut. ${mentionedVehicle.segment} sınıfında, günlük ₺${mentionedVehicle.price.toLocaleString("tr-TR")} fiyatlı ve ${mentionedVehicle.luggage} L bagaj hacmine sahip. Detay sayfasından uygunluk ve rezervasyon bilgisine bakabilirsin.`;
  }

  const requestedLabel = extractRequestedVehicleLabel(question);
  const visibleName = requestedLabel || "Bu araç";
  const alternatives = vehicles
    .filter((vehicle) => vehicle.available !== false)
    .slice(0, 3)
    .map((vehicle) => vehicle.name)
    .join(", ");

  return `${visibleName} şu an filoda/katalogda görünmüyor. Bu yüzden yerine başka bir aracı seçmiş gibi gerekçe üretmem doğru olmaz. Mevcut alternatiflerden ${alternatives} gibi araçları inceleyebilirsin.`;
}

function getQuestionIntent(question) {
  const normalized = normalizeQuestion(question);
  if (/konfor|rahat|premium|lüks|luks/.test(normalized)) return "comfort";
  if (/ekonom|az yak|yakıt|yakit|tasarruf|ucuz|bütçe|butce/.test(normalized)) return "economy";
  if (/dağ|dag|yayla|arazi|kış|kis|kar|suv|yüksek|yuksek/.test(normalized)) return "outdoor";
  if (/kalabalık|kalabalik|minivan|vip|çok valiz|cok valiz|geniş|genis/.test(normalized)) return "capacity";
  return "balanced";
}

function buildWidgetVehicleSuggestions(question, vehicles, state) {
  const recommendationIntent = /öner|uygun|hangi|araç|araba|valiz|bagaj|bavul|ekonom|konfor|rahat|premium|az yak|yakıt|yakit|dağ|dag|yayla|yol|suv|minivan|neden|seç|sec|tercih/i.test(question);
  if (!recommendationIntent) return [];

  if (isCatalogAvailabilityQuestion(question)) return [];

  const mentionedVehicle = findMentionedVehicle(question, vehicles);
  if (mentionedVehicle) {
    return [
      {
        id: mentionedVehicle.id,
        name: mentionedVehicle.name,
        score: computeScore(mentionedVehicle, state),
        meta: `${mentionedVehicle.seats} kişi · ${mentionedVehicle.luggage} L bagaj · ₺${mentionedVehicle.price}/gün`,
      },
    ];
  }

  const intent = getQuestionIntent(question);
  const passengerCount = state.adults + state.children;
  const luggageUnits = state.largeBags * 3 + state.mediumBags * 2 + state.backpacks;
  const availableVehicles = vehicles.filter((vehicle) => vehicle.available !== false);
  const capacityMatches = availableVehicles.filter(
    (vehicle) =>
      vehicle.seats >= passengerCount &&
      (!luggageUnits || vehicle.luggage >= luggageUnits * 30),
  );
  const suggestionPool = capacityMatches.length ? capacityMatches : availableVehicles;

  return suggestionPool
    .map((vehicle) => {
      let score = computeScore(vehicle, state);

      if (intent === "economy") {
        score += Math.max(0, 7 - vehicle.consumption) * 12;
        score += Math.max(0, 3000 - vehicle.price) / 45;
        if (vehicle.category === "economy") score += 18;
        if (/hibrit|elektrik/i.test(vehicle.fuel)) score += 12;
      }

      if (intent === "comfort") {
        score += vehicle.comfort * 9;
        if (vehicle.category === "premium") score += 22;
        if (vehicle.segmentTag === "premium") score += 14;
        if (vehicle.segmentTag === "family" && vehicle.comfort >= 8) score += 8;
      }

      if (intent === "outdoor") {
        if (vehicle.routeFit.some((fit) => ["mountain", "winter", "outdoor"].includes(fit))) score += 32;
        if (["suv", "outdoor"].includes(vehicle.segmentTag)) score += 18;
        score += vehicle.performance * 4;
      }

      if (intent === "capacity") {
        score += vehicle.seats * 8;
        score += vehicle.luggage / 18;
        if (vehicle.segmentTag === "family") score += 15;
      }

      return { vehicle, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ vehicle, score }) => ({
      id: vehicle.id,
      name: vehicle.name,
      score,
      meta: `${vehicle.seats} kişi · ${vehicle.luggage} L bagaj · ₺${vehicle.price}/gün`,
    }));
}

function formatRouteLabel(state) {
  const fromCity = state.fromCity.trim();
  const toCity = state.toCity.trim();
  return fromCity && toCity ? `${fromCity} → ${toCity}` : "Rota belirtilmedi";
}

function mergeVehicleCatalog(storedVehicles) {
  if (!Array.isArray(storedVehicles)) return baseVehicles;

  const storedById = new Map(storedVehicles.map((vehicle) => [vehicle.id, vehicle]));
  const mergedBase = baseVehicles.map((baseVehicle) => {
    const storedVehicle = storedById.get(baseVehicle.id);
    if (!storedVehicle) return baseVehicle;

    return {
      ...baseVehicle,
      ...storedVehicle,
      imageUrl: storedVehicle.imageUrl || baseVehicle.imageUrl || "",
    };
  });
  const baseIds = new Set(baseVehicles.map((vehicle) => vehicle.id));
  const customVehicles = storedVehicles.filter((vehicle) => !baseIds.has(vehicle.id));

  return [...mergedBase, ...customVehicles];
}

export function TripProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [vehicles, setVehicles] = useState(() => {
    if (typeof window === "undefined") return baseVehicles;
    try {
      const stored = getStoredValue("vehicles");
      return stored ? mergeVehicleCatalog(JSON.parse(stored)) : baseVehicles;
    } catch {
      return baseVehicles;
    }
  });
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("Hazırlanıyor");
  const [analysisSnippet, setAnalysisSnippet] = useState("Rota analiz ediliyor...");
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [smartRecommendationVisible, setSmartRecommendationVisible] = useState(false);
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false);
  const [aiRecommendationError, setAiRecommendationError] = useState("");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetDraft, setWidgetDraft] = useState("");
  const messageIdRef = useRef(1);
  const [messages, setMessages] = useState([
    {
      id: "welcome-0",
      kind: "assistant",
      text:
        "Merhaba, ben DriveWise AI asistanı. Rota, kişi ve bagaj bilgine göre en uygun aracı açıklamalı şekilde bulurum.\n---\nBu panel bulunduğun sayfaya göre soru sorabilir. Örneğin, 4 kişi ve 3 valiz için hangi araç uygun diye sorabilirsin.",
    },
  ]);
  const [siteSettings, setSiteSettings] = useState(() => {
    if (typeof window === "undefined") return defaultSiteSettings;
    try {
      const stored = getStoredValue("site_settings");
      return stored ? normalizeStoredSiteSettings(JSON.parse(stored)) : defaultSiteSettings;
    } catch {
      return defaultSiteSettings;
    }
  });
  const [reservations, setReservations] = useState(() => {
    if (typeof window === "undefined") return defaultReservations;
    try {
      const stored = getStoredValue("reservations");
      return stored ? JSON.parse(stored) : defaultReservations;
    } catch {
      return defaultReservations;
    }
  });
  const [campaigns, setCampaigns] = useState(() => {
    if (typeof window === "undefined") return baseCampaigns;
    try {
      const stored = getStoredValue("campaigns");
      return stored ? mergeCampaignCatalog(JSON.parse(stored)) : baseCampaigns;
    } catch {
      return baseCampaigns;
    }
  });
  const [aiRequestLog, setAiRequestLog] = useState([]);

  const timerRef = useRef(null);

  const ranked = useMemo(
    () =>
      vehicles
        .filter((vehicle) => vehicle.available !== false)
        .map((vehicle) => ({
          vehicle,
          score: computeScore(vehicle, state),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [
      state.routeType,
      state.priority,
      state.budget,
      state.adults,
      state.children,
      state.seats,
      state.largeBags,
      state.mediumBags,
      state.backpacks,
      state.oversize,
      state.purpose,
      state.fuelPriority,
      state.comfortPriority,
      state.vehiclePreference,
      state.budgetMin,
      vehicles,
    ],
  );

  const catalog = useMemo(() => {
    return vehicles.filter(
      (vehicle) =>
        state.filter === "all" ||
        vehicle.category === state.filter ||
        vehicle.segmentTag === state.filter,
    );
  }, [state.filter, vehicles]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey("vehicles"), JSON.stringify(vehicles));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey("site_settings"), JSON.stringify(siteSettings));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [siteSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey("reservations"), JSON.stringify(reservations));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [reservations]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey("campaigns"), JSON.stringify(campaigns));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [campaigns]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = `${siteSettings.siteName} - Akıllı Araç Kiralama Asistanı`;
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = siteSettings.faviconUrl || siteSettings.logoUrl || "/favicon.svg";
  }, [siteSettings.faviconUrl, siteSettings.logoUrl, siteSettings.siteName]);

  const routeLabel = formatRouteLabel(state);

  const appendAiLog = (entry) => {
    setAiRequestLog((prev) =>
      [
        {
          id: `ai-log-${Date.now()}-${prev.length}`,
          createdAt: new Date().toLocaleString("tr-TR"),
          model: getGeminiStatus().model,
          ...entry,
        },
        ...prev,
      ].slice(0, 8),
    );
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!analysisRunning) return undefined;

    timerRef.current = window.setInterval(() => {
      setAnalysisStep((current) => {
        if (current >= analysisStages.length - 1) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
          setAnalysisRunning(false);
          setAnalysisVisible(true);
          setAnalysisStatus("Analiz tamamlandı");
          setAnalysisSnippet(
            `${ranked[0].vehicle.name} ekonomik, ${ranked[1].vehicle.name} dengeli, ${ranked[2].vehicle.name} ise konfor tarafında öne çıktı.`,
          );
          return current;
        }

        const next = current + 1;
        setAnalysisStatus(analysisStages[next]);
        setAnalysisSnippet(
          [
            "Rota üzerindeki çizgi hareket ediyor.",
            "Yol tipi ve hava koşulları eşleştiriliyor.",
            "Bagaj ve yolcu kapasitesi hesaplanıyor.",
            "Yakıt tüketimi ve günlük maliyet tahmin ediliyor.",
            "En uygun 3 araç eşleştirildi.",
          ][next],
        );
        return next;
      });
    }, 850);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [
    analysisRunning,
    ranked,
    state.routeType,
    state.priority,
    state.budget,
    state.adults,
    state.children,
    state.seats,
    state.largeBags,
    state.mediumBags,
    state.backpacks,
    state.oversize,
    vehicles,
  ]);

  const handleCounter = (key, delta) => {
    setState((prev) => {
      const min = 0;
      const max = key === "adults" ? 8 : 6;
      const current = Number(prev[key] || 0);
      return { ...prev, [key]: clamp(current + delta, min, max) };
    });
  };

  const handleAnalyze = () => {
    const totalPassengers = Number(state.adults || 0) + Number(state.children || 0);
    const dailyBudget = Number(state.budget || 0);
    const departureTime = state.departureDate ? new Date(state.departureDate).getTime() : NaN;
    const returnTime = state.returnDate ? new Date(state.returnDate).getTime() : NaN;
    const missingRequired =
      !state.fromCity.trim() ||
      !state.toCity.trim() ||
      !state.departureDate ||
      !state.returnDate ||
      !state.purpose ||
      !state.routeType ||
      !state.priority ||
      !state.fuelPriority ||
      !state.comfortPriority ||
      !state.vehiclePreference ||
      totalPassengers < 1 ||
      !dailyBudget;

    if (missingRequired) {
      setAnalysisVisible(false);
      setAnalysisRunning(false);
      setSmartRecommendationVisible(false);
      setAiRecommendation(null);
      setAnalysisStatus("Eksik bilgi");
      setAnalysisSnippet("Akıllı öneri için rota, tarih, yolcu, bütçe ve tercih alanlarını doldur.");
      window.alert("Akıllı öneri için rota, tarih, yolcu, bütçe ve tercih alanlarını doldurmalısın.");
      return;
    }

    if (!Number.isNaN(departureTime) && !Number.isNaN(returnTime) && returnTime <= departureTime) {
      setAnalysisVisible(false);
      setAnalysisRunning(false);
      setSmartRecommendationVisible(false);
      setAiRecommendation(null);
      setAnalysisStatus("Tarih hatası");
      setAnalysisSnippet("Dönüş tarihi gidiş tarihinden sonra olmalı.");
      window.alert("Dönüş tarihi gidiş tarihinden sonra olmalı.");
      return;
    }

    setAnalysisVisible(true);
    setSmartRecommendationVisible(true);
    setAnalysisRunning(true);
    setAiRecommendationLoading(true);
    setAiRecommendationError("");
    setAnalysisStep(0);
    setAnalysisStatus("Öneri başlatıldı");
    setAnalysisSnippet("Araç uygunluğu hesaplanıyor...");

    generateStructuredRecommendation(state, vehicles)
      .then((result) => {
        setAiRecommendation(result.data);
        setAiRecommendationError(getGeminiUserMessage(result.error));
        appendAiLog({
          area: "Agentic JSON öneri",
          question: `${state.fromCity} - ${state.toCity}`,
          source: result.source,
          error: result.error || "",
        });
      })
      .catch((error) => {
        setAiRecommendationError(getGeminiUserMessage(error));
      })
      .finally(() => {
        setAiRecommendationLoading(false);
      });
  };

  const handleSendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMessageId = `message-${messageIdRef.current++}`;
    const assistantMessageId = `message-${messageIdRef.current++}`;
    const questionState = buildQuestionState(trimmed, state);
    const vehicleSuggestions = buildWidgetVehicleSuggestions(trimmed, vehicles, questionState);
    const mentionedVehicle = findMentionedVehicle(trimmed, vehicles);
    const isAvailabilityQuestion = isCatalogAvailabilityQuestion(trimmed);
    const topVehicle =
      isAvailabilityQuestion
        ? mentionedVehicle
        : mentionedVehicle ||
      (vehicleSuggestions.length
        ? vehicles.find((vehicle) => vehicle.id === vehicleSuggestions[0].id)
        : ranked[0]?.vehicle);

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, kind: "user", text: trimmed },
      { id: assistantMessageId, kind: "assistant", text: "Gemini yanıtlıyor...", vehicleSuggestions: [] },
    ]);
    setWidgetDraft("");

    if (isAvailabilityQuestion) {
      window.setTimeout(() => {
        const text = buildCatalogAvailabilityReply(trimmed, vehicles, mentionedVehicle);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId ? { ...message, text, vehicleSuggestions: mentionedVehicle ? vehicleSuggestions : [] } : message,
          ),
        );
      }, 180);
      return;
    }

    sendTripQuestion({
      question: trimmed,
      state: questionState,
      topVehicle,
      currentRoute: routeLabel,
    }).then((result) => {
      appendAiLog({ area: "Floating widget", question: trimmed, source: result.source, error: result.error || "" });
      if (result.source === "fallback") {
        window.setTimeout(() => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId ? { ...message, text: result.text, vehicleSuggestions } : message,
            ),
          );
        }, 180);
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId ? { ...message, text: result.text, vehicleSuggestions } : message,
        ),
      );
    });
  };

  const askGemini = (question, overrides = {}) => {
    const trimmed = question.trim();
    if (!trimmed) return Promise.resolve("");

    const resolvedState = overrides.state || state;
    const resolvedTopVehicle = overrides.topVehicle || ranked[0]?.vehicle;
    const resolvedRoute = overrides.currentRoute || routeLabel;
    const userMessageId = `message-${messageIdRef.current++}`;
    const assistantMessageId = `message-${messageIdRef.current++}`;

    if (overrides.showInWidget !== false) {
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, kind: "user", text: trimmed },
        { id: assistantMessageId, kind: "assistant", text: "Gemini yanıtlıyor..." },
      ]);
    }

    logAiDevEvent({
      area: overrides.area || "AI action",
      action: "Gemini istegi basladi",
      vehicle: resolvedTopVehicle?.name || "",
      route: resolvedRoute,
    });

    return sendTripQuestion({
      question: trimmed,
      state: resolvedState,
      topVehicle: resolvedTopVehicle,
      currentRoute: resolvedRoute,
      fallbackText: overrides.fallbackText,
    }).then((result) => {
      appendAiLog({ area: overrides.area || "AI action", question: trimmed, source: result.source, error: result.error || "" });
      logAiDevEvent({
        area: overrides.area || "AI action",
        action: "Gemini istegi tamamlandi",
        vehicle: resolvedTopVehicle?.name || "",
        route: resolvedRoute,
        source: result.source,
        error: result.error || "",
      });
      if (overrides.showInWidget !== false) {
        const text = result.text;
        const delay = result.source === "fallback" ? 180 : 0;
        window.setTimeout(() => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId ? { ...message, text } : message,
            ),
          );
        }, delay);
      }

      if (overrides.returnResult) {
        return result;
      }

      return result.text;
    });
  };

  const updateSiteSettings = (updates) => {
    setSiteSettings((prev) => ({ ...prev, ...updates }));
  };

  const createReservation = (payload) => {
    const vehicle = vehicles.find((item) => item.id === payload.vehicleId);
    if (!vehicle) return null;

    const reservation = {
      id: `rez-${Date.now()}`,
      status: "Yeni talep",
      createdAt: new Date().toLocaleString("tr-TR"),
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      route: routeLabel,
      departureDate: state.departureDate,
      returnDate: state.returnDate,
      passengers: state.adults + state.children,
      luggage: `${state.largeBags} büyük, ${state.mediumBags} orta, ${state.backpacks} sırt çantası`,
      dailyPrice: vehicle.price,
      ...payload,
    };

    setReservations((prev) => [reservation, ...prev].slice(0, 20));
    return reservation;
  };

  const updateReservationStatus = (reservationId, status) => {
    setReservations((prev) =>
      prev.map((reservation) =>
        reservation.id === reservationId ? { ...reservation, status } : reservation,
      ),
    );
  };

  const askGeminiForVehicleSummary = (vehicle) => {
    const variationKey = Date.now() + Math.floor(Math.random() * 1000);
    const fallbackSummary = buildVehicleSummary(vehicle, variationKey);
    const angles = [
      "yakıt ekonomisi ve günlük kullanım rahatlığı",
      "bagaj, kabin pratikliği ve aile/şehir kullanımı",
      "fiyat-performans dengesi ve uzun yol kullanılabilirliği",
      "sade, güven veren kiralama profili ve rota esnekliği",
    ];
    const openings = [
      "araç adıyla başla",
      "yakıt ve tüketim avantajıyla başla",
      "kullanım senaryosuyla başla",
      "bagaj ve kabin pratikliğiyle başla",
    ];
    const selectedAngle = angles[variationKey % angles.length];
    const selectedOpening = openings[Math.floor(variationKey / angles.length) % openings.length];
    console.info(`[AI] Admin arac aciklamasi uretilecek: ${vehicle.name}`);
    const prompt = [
      "Sen bir DriveWise katalog metni yazarı ve araç uygunluk uzmanısın.",
      "Görev: Aşağıdaki tek araç için katalog kartında kullanılacak açıklayıcı araç betimlemesi üret.",
      "Yanıt yalnızca Türkçe olsun ve 2-3 doğal cümleden oluşsun.",
      "Toplam uzunluk 280-420 karakter aralığında olsun.",
      "Bu istek her çalıştırıldığında aynı araç için yeni bir metin üretmelidir; önceki cevap kalıbını veya aynı cümle sırasını tekrar etme.",
      `Bu denemede anlatım odağı: ${selectedAngle}.`,
      `Bu denemede başlangıç biçimi: ${selectedOpening}.`,
      `Varyasyon kimliği: ${variationKey}. Bu kimliği metinde yazma; sadece farklı ifade seçmek için kullan.`,
      "Başına 'AI yorumu', 'Gemini', madde işareti veya tırnak koyma.",
      "Kullanıcının mevcut seyahat formuna göre değil, yalnızca araç verisine göre yaz.",
      "Uydurma donanım, güvenlik paketi, stok bilgisi veya kampanya ekleme.",
      "Yalnızca verilen özellikleri kullan: fiyat, yakıt, vites, tüketim, bagaj, koltuk, konfor, performans ve kullanım tipi.",
      "Aracı 'ekonomik dizel' gibi tek etikete indirgeme; sürüş karakterini, bagaj/pratiklik tarafını ve hangi kullanımda mantıklı olduğunu açıkla.",
      "Pazarlama abartısı yapma; teknik verilerden gerçekçi çıkarım yap.",
      "",
      `Araç adı: ${vehicle.name}`,
      `Segment: ${vehicle.segment}`,
      `Kategori: ${vehicle.category}`,
      `Segment etiketi: ${vehicle.segmentTag}`,
      `Günlük fiyat: ${vehicle.price} TL`,
      `Yakıt: ${vehicle.fuel}`,
      `Vites: ${vehicle.transmission || "Otomatik"}`,
      `Tüketim: ${vehicle.consumption} L/100km`,
      `Bagaj: ${vehicle.luggage} L`,
      `Koltuk: ${vehicle.seats}`,
      `Konfor: ${vehicle.comfort}/10`,
      `Performans: ${vehicle.performance}/10`,
      `Uygun rota etiketleri: ${vehicle.routeFit?.join(", ")}`,
      `Mevcut not: ${vehicle.notes}`,
    ].join(" ");

    return generateGeminiText(prompt, fallbackSummary, 260).then((result) => {
      appendAiLog({ area: "Admin araç açıklaması", question: vehicle.name, source: result.source, error: result.error || "" });
      console.info(
        `[AI] Admin arac aciklamasi tamamlandi: ${vehicle.name} kaynak=${result.source}${
          result.error ? ` hata=${result.error}` : ""
        }`,
      );
      const text = result.text
        .replace(/^["“”']|["“”']$/g, "")
        .replace(/^AI yorumu:\s*/i, "")
        .replace(/^Gemini:\s*/i, "")
        .trim();
      const isTooShort = text.length < 140;

      return {
        text: isTooShort ? fallbackSummary : text,
        source: isTooShort ? "fallback" : result.source,
        error: isTooShort ? "short-gemini-summary" : result.error || "",
      };
    });
  };

  const value = {
    state,
    setState,
    vehicles,
    setVehicles,
    campaigns,
    setCampaigns,
    analysisVisible,
    analysisRunning,
    analysisStep,
    analysisStatus,
    analysisSnippet,
    setAnalysisVisible,
    setAnalysisRunning,
    setAnalysisStep,
    setAnalysisStatus,
    setAnalysisSnippet,
    widgetOpen,
    setWidgetOpen,
    widgetDraft,
    setWidgetDraft,
    messages,
    setMessages,
    siteSettings,
    updateSiteSettings,
    defaultSiteSettings,
    reservations,
    createReservation,
    updateReservationStatus,
    aiRequestLog,
    aiRecommendation,
    smartRecommendationVisible,
    aiRecommendationLoading,
    aiRecommendationError,
    geminiStatus: getGeminiStatus(),
    ranked,
    catalog,
    routeLabel,
    handleCounter,
    handleAnalyze,
    handleSendMessage,
    askGemini,
    askGeminiForVehicleSummary,
    buildRiskWarningsForTop: () => (ranked[0]?.vehicle ? buildRiskWarnings(ranked[0].vehicle, state) : []),
    buildRiskWarnings,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrip must be used within TripProvider");
  return context;
}
