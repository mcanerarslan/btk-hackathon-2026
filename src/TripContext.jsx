import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  analysisStages,
  assistantReply,
  buildRiskWarnings,
  clamp,
  computeScore,
  initialState,
  vehicles as baseVehicles,
} from "./data";

const TripContext = createContext(null);
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function buildGeminiPrompt(question, state, topVehicle, currentRoute) {
  const vehicleContext = topVehicle
    ? [
        `Önerilen araç: ${topVehicle.name}`,
        `Segment: ${topVehicle.segment}`,
        `Fiyat: ₺${topVehicle.price}/gün`,
        `Yakıt: ${topVehicle.fuel}`,
        `Tüketim: ${topVehicle.consumption} L/100km`,
        `Bagaj: ${topVehicle.luggage} L`,
        `Koltuk: ${topVehicle.seats}`,
        `Konfor: ${topVehicle.comfort}/10`,
        `Performans: ${topVehicle.performance}/10`,
        `Not: ${topVehicle.notes}`,
      ].join("\n")
    : "Önerilen araç: yok";

  return [
    "Sen bir araç kiralama ve rota planlama asistanısın.",
    "Yanıtı Türkçe ver.",
    "Kısa, net ve açıklamalı cevap ver.",
    "Kullanıcının sorusuna göre öneri yap ama uydurma veri ekleme.",
    "Eğer uygun araç varsa adını açıkça söyle.",
    "",
    `Kullanıcı sorusu: ${question}`,
    `Rota: ${currentRoute}`,
    `Yolcu sayısı: ${state.adults + state.children}`,
    `Bagaj: ${state.largeBags} büyük, ${state.mediumBags} orta, ${state.backpacks} sırt çantası`,
    `Öncelik: ${state.priority}`,
    vehicleContext,
  ].join("\n");
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

async function fetchGeminiReply(question, state, topVehicle, currentRoute) {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildGeminiPrompt(question, state, topVehicle, currentRoute) }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 220,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const payload = await response.json();
  return extractGeminiText(payload) || null;
}

async function sendGeminiQuestion({
  question,
  state,
  topVehicle,
  currentRoute,
  onPending,
  onSuccess,
  onFallback,
}) {
  const localReply = assistantReply(question, state, topVehicle, currentRoute);
  if (!GEMINI_API_KEY) {
    onFallback?.(localReply);
    return localReply;
  }

  onPending?.();

  try {
    const geminiReply = await fetchGeminiReply(question, state, topVehicle, currentRoute);
    const reply = geminiReply || localReply;
    onSuccess?.(reply);
    return reply;
  } catch {
    onFallback?.(localReply);
    return localReply;
  }
}

export function TripProvider({ children }) {
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);
  const [vehicles, setVehicles] = useState(() => {
    if (typeof window === "undefined") return baseVehicles;
    try {
      const stored = window.localStorage.getItem("tripai_vehicles");
      return stored ? JSON.parse(stored) : baseVehicles;
    } catch {
      return baseVehicles;
    }
  });
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("Hazırlanıyor");
  const [analysisSnippet, setAnalysisSnippet] = useState("Rota analiz ediliyor...");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetDraft, setWidgetDraft] = useState("");
  const messageIdRef = useRef(1);
  const [messages, setMessages] = useState([
    {
      id: "welcome-0",
      kind: "assistant",
      text: "Merhaba, seyahat bilgilerini girmeni bekliyorum. İstersen sana en uygun aracı açıklamalı şekilde bulurum.",
    },
  ]);

  const timerRef = useRef(null);

  const ranked = useMemo(
    () =>
      vehicles
        .map((vehicle) => ({
          vehicle,
          score: computeScore(vehicle, state),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [
      state.routeType,
      state.priority,
      state.adults,
      state.children,
      state.seats,
      state.largeBags,
      state.mediumBags,
      state.backpacks,
      state.oversize,
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

  const routeLabel = `${state.fromCity} → ${state.toCity}`;

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
    setAnalysisVisible(true);
    setAnalysisRunning(true);
    setAnalysisStep(0);
    setAnalysisStatus("Analiz başlatıldı");
    setAnalysisSnippet("Rota analiz ediliyor...");
    navigate("/analysis");
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

    sendGeminiQuestion({
      question: trimmed,
      state,
      topVehicle,
      currentRoute: routeLabel,
      onFallback: (reply) => {
        window.setTimeout(() => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId ? { ...message, text: reply } : message,
            ),
          );
        }, 180);
      },
      onSuccess: (reply) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId ? { ...message, text: reply } : message,
          ),
        );
      },
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

    return sendGeminiQuestion({
      question: trimmed,
      state: resolvedState,
      topVehicle: resolvedTopVehicle,
      currentRoute: resolvedRoute,
      onFallback: (reply) => {
        if (overrides.showInWidget === false) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId ? { ...message, text: reply } : message,
          ),
        );
      },
      onSuccess: (reply) => {
        if (overrides.showInWidget === false) return;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId ? { ...message, text: reply } : message,
          ),
        );
      },
    });
  };

  const value = {
    state,
    setState,
    vehicles,
    setVehicles,
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
    ranked,
    catalog,
    routeLabel,
    handleCounter,
    handleAnalyze,
    handleSendMessage,
    askGemini,
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
