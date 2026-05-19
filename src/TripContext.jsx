import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  logAiDevEvent,
  sendTripQuestion,
} from "./services/geminiService";

const TripContext = createContext(null);

const defaultSiteSettings = {
  siteName: "Robot Rent A Car",
  logoText: "R",
  logoUrl: "",
  faviconUrl: "",
  headerTitle: "Robot Rent A Car",
  headerSubtitle: "Gemini destekli araç kiralama uzmanı",
  footerText: "İhtiyacını anlat, robot uzman rota, bagaj, bütçe ve yol şartına göre aracı seçsin.",
  footerNote: "Demo panel · login gerekmez",
  footerLegal: "KVKK · Gizlilik · Kullanım Şartları",
};

const defaultReservations = [];

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
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);
  const [vehicles, setVehicles] = useState(() => {
    if (typeof window === "undefined") return baseVehicles;
    try {
      const stored = window.localStorage.getItem("tripai_vehicles");
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
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false);
  const [aiRecommendationError, setAiRecommendationError] = useState("");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetDraft, setWidgetDraft] = useState("");
  const messageIdRef = useRef(1);
  const [messages, setMessages] = useState([
    {
      id: "welcome-0",
      kind: "assistant",
      text: "Merhaba, ben Gemini destekli Robot Rent Expert. Rota, kişi ve bagaj bilgine göre en uygun aracı açıklamalı şekilde bulurum.",
    },
  ]);
  const [siteSettings, setSiteSettings] = useState(() => {
    if (typeof window === "undefined") return defaultSiteSettings;
    try {
      const stored = window.localStorage.getItem("tripai_site_settings");
      return stored ? { ...defaultSiteSettings, ...JSON.parse(stored) } : defaultSiteSettings;
    } catch {
      return defaultSiteSettings;
    }
  });
  const [reservations, setReservations] = useState(() => {
    if (typeof window === "undefined") return defaultReservations;
    try {
      const stored = window.localStorage.getItem("tripai_reservations");
      return stored ? JSON.parse(stored) : defaultReservations;
    } catch {
      return defaultReservations;
    }
  });
  const [campaigns, setCampaigns] = useState(() => {
    if (typeof window === "undefined") return baseCampaigns;
    try {
      const stored = window.localStorage.getItem("tripai_campaigns");
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
      window.localStorage.setItem("tripai_vehicles", JSON.stringify(vehicles));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      window.localStorage.setItem("tripai_site_settings", JSON.stringify(siteSettings));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [siteSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem("tripai_reservations", JSON.stringify(reservations));
    } catch {
      // Ignore storage failures in demo mode.
    }
  }, [reservations]);

  useEffect(() => {
    try {
      window.localStorage.setItem("tripai_campaigns", JSON.stringify(campaigns));
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

  const routeLabel = `${state.fromCity} → ${state.toCity}`;

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
    if (!widgetOpen) return;
    if (messages.length > 1) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `message-${messageIdRef.current++}`,
        kind: "assistant",
        text: "Bu panel bulunduğun sayfaya göre soru sorabilir. Örneğin, 4 kişi ve 3 valiz için hangi araç uygun diye sorabilirsin.",
      },
    ]);
  }, [widgetOpen, messages.length]);

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
      const min = key === "adults" ? 1 : 0;
      const max = key === "adults" ? 8 : 6;
      return { ...prev, [key]: clamp(prev[key] + delta, min, max) };
    });
  };

  const handleAnalyze = () => {
    if (!state.fromCity.trim() || !state.toCity.trim() || !state.departureDate) {
      setAnalysisVisible(false);
      setAnalysisRunning(false);
      setAnalysisStatus("Eksik bilgi");
      setAnalysisSnippet("Başlangıç, varış ve tarih bilgisi olmadan analiz başlatılamaz.");
      window.alert("Analiz için başlangıç, varış ve yolculuk tarihi gerekli.");
      return;
    }

    setAnalysisVisible(true);
    setAnalysisRunning(true);
    setAiRecommendationLoading(true);
    setAiRecommendationError("");
    setAnalysisStep(0);
    setAnalysisStatus("Analiz başlatıldı");
    setAnalysisSnippet("Rota analiz ediliyor...");
    navigate("/analysis");

    generateStructuredRecommendation(state, vehicles)
      .then((result) => {
        setAiRecommendation(result.data);
        setAiRecommendationError(result.error || "");
        appendAiLog({
          area: "Agentic JSON öneri",
          question: `${state.fromCity} - ${state.toCity}`,
          source: result.source,
          error: result.error || "",
        });
      })
      .catch((error) => {
        setAiRecommendationError(error.message);
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
    const topVehicle = ranked[0]?.vehicle;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, kind: "user", text: trimmed },
      { id: assistantMessageId, kind: "assistant", text: "Gemini yanıtlıyor..." },
    ]);
    setWidgetDraft("");

    sendTripQuestion({
      question: trimmed,
      state,
      topVehicle,
      currentRoute: routeLabel,
    }).then((result) => {
      appendAiLog({ area: "Floating widget", question: trimmed, source: result.source, error: result.error || "" });
      if (result.source === "fallback") {
        window.setTimeout(() => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId ? { ...message, text: result.text } : message,
            ),
          );
        }, 180);
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId ? { ...message, text: result.text } : message,
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
      "Sen bir rent a car katalog metni yazarı ve araç uygunluk uzmanısın.",
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
