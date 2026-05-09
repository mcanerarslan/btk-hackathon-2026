export const vehicles = [
  {
    id: "egea-cross",
    name: "Fiat Egea Cross",
    segment: "Ekonomik Crossover",
    category: "economy",
    segmentTag: "suv",
    price: 1680,
    fuel: "Dizel",
    consumption: 4.8,
    luggage: 440,
    seats: 5,
    comfort: 6,
    performance: 5,
    routeFit: ["city", "mixed", "long"],
    notes: "Düşük tüketim, yeterli bagaj, şehir + uzun yol dengesi.",
    emoji: "🚙",
  },
  {
    id: "peugeot-3008",
    name: "Peugeot 3008",
    segment: "SUV",
    category: "premium",
    segmentTag: "suv",
    price: 2890,
    fuel: "Dizel",
    consumption: 5.7,
    luggage: 520,
    seats: 5,
    comfort: 9,
    performance: 7,
    routeFit: ["long", "mountain", "winter", "mixed"],
    notes: "Uzun yol konforu, geniş hacim ve güçlü motor.",
    emoji: "🚘",
  },
  {
    id: "toyota-corolla",
    name: "Toyota Corolla",
    segment: "Sedan",
    category: "balanced",
    segmentTag: "family",
    price: 2100,
    fuel: "Benzin-Hibrit",
    consumption: 4.3,
    luggage: 470,
    seats: 5,
    comfort: 8,
    performance: 6,
    routeFit: ["city", "long", "mixed"],
    notes: "Dengeli kullanım, sessiz sürüş ve iyi yakıt ekonomisi.",
    emoji: "🚗",
  },
  {
    id: "hyundai-staria",
    name: "Hyundai Staria",
    segment: "Minivan",
    category: "family",
    segmentTag: "family",
    price: 3350,
    fuel: "Dizel",
    consumption: 6.9,
    luggage: 831,
    seats: 7,
    comfort: 9,
    performance: 6,
    routeFit: ["long", "family", "mixed", "outdoor"],
    notes: "Kalabalık aileler ve çok bagaj için ideal.",
    emoji: "🚌",
  },
  {
    id: "dacia-duster",
    name: "Dacia Duster",
    segment: "Outdoor SUV",
    category: "outdoor",
    segmentTag: "outdoor",
    price: 2320,
    fuel: "Dizel",
    consumption: 5.9,
    luggage: 445,
    seats: 5,
    comfort: 7,
    performance: 8,
    routeFit: ["mountain", "winter", "outdoor", "mixed"],
    notes: "Arazi temalı kullanım ve zorlu rota koşulları için güçlü.",
    emoji: "🛻",
  },
  {
    id: "bmw-3",
    name: "BMW 3 Serisi",
    segment: "Premium Sedan",
    category: "premium",
    segmentTag: "premium",
    price: 4380,
    fuel: "Benzin",
    consumption: 6.7,
    luggage: 480,
    seats: 5,
    comfort: 10,
    performance: 9,
    routeFit: ["long", "city", "mixed"],
    notes: "Konfor ve performans odağı yüksek premium seçenek.",
    emoji: "🏁",
  },
];

export const analysisStages = [
  "Rota analiz ediliyor",
  "Yol şartları kontrol ediliyor",
  "Bagaj ihtiyacı hesaplanıyor",
  "Yakıt maliyeti tahmin ediliyor",
  "En uygun araçlar eşleştiriliyor",
];

export const comparisonMetrics = [
  ["Günlük fiyat", "price"],
  ["Yakıt tüketimi", "consumption"],
  ["Bagaj hacmi", "luggage"],
  ["Kapasite", "seats"],
  ["Konfor", "comfort"],
  ["Performans", "performance"],
];

export const stepLabels = ["1. Rota", "2. Yol tipi", "3. Yolcu", "4. Bagaj", "5. Öncelik"];

export const initialState = {
  step: 1,
  routeType: "long",
  priority: "economy",
  adults: 4,
  children: 1,
  seats: 1,
  largeBags: 4,
  mediumBags: 2,
  backpacks: 2,
  oversize: true,
  filter: "all",
  fromCity: "İstanbul",
  toCity: "Rize",
  departureDate: "2026-06-12",
  returnDate: "2026-06-18",
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function routeBoost(vehicle, routeType) {
  const fitsRoute = vehicle.routeFit.includes(routeType);
  if (fitsRoute) return 18;
  if (routeType === "mixed" && vehicle.routeFit.includes("long")) return 10;
  if (routeType === "family" && vehicle.category === "family") return 14;
  if (routeType === "city" && vehicle.category === "economy") return 10;
  return -8;
}

function routeTypeBonusForOutdoor(vehicle) {
  return vehicle.routeFit.includes("outdoor") ? 12 : 0;
}

export function computeScore(vehicle, state) {
  const totalPassengers = state.adults + state.children;
  const luggageNeed = state.largeBags * 3 + state.mediumBags * 2 + state.backpacks;
  let score = 50;

  score += routeBoost(vehicle, state.routeType);
  score += vehicle.seats >= totalPassengers ? 12 : -18;
  score += vehicle.luggage >= luggageNeed * 35 ? 14 : vehicle.luggage >= luggageNeed * 25 ? 6 : -14;

  if (state.priority === "economy") {
    score += Math.max(0, 16 - vehicle.price / 500);
    score += vehicle.consumption < 5.5 ? 10 : 0;
  }
  if (state.priority === "balanced") {
    score += 8 + vehicle.comfort;
  }
  if (state.priority === "comfort") {
    score += vehicle.comfort * 2.5;
  }
  if (state.priority === "performance") {
    score += vehicle.performance * 2.8;
  }
  if (state.priority === "family") {
    score += vehicle.category === "family" ? 25 : 0;
    score += vehicle.comfort;
  }
  if (state.priority === "outdoor") {
    score += vehicle.category === "outdoor" || vehicle.segmentTag === "suv" ? 20 : -6;
    score += routeTypeBonusForOutdoor(vehicle);
  }

  if (state.oversize && vehicle.luggage < luggageNeed * 30) score -= 18;
  if (state.routeType === "winter" && vehicle.segmentTag === "suv") score += 12;
  if (state.routeType === "mountain" && vehicle.performance >= 7) score += 8;

  return Math.round(score);
}

export function buildRiskWarnings(vehicle, state) {
  const warnings = [];
  const totalPassengers = state.adults + state.children;
  const luggageNeed = state.largeBags * 3 + state.mediumBags * 2 + state.backpacks;

  if (state.routeType === "mountain" && vehicle.performance < 7) {
    warnings.push("Bu rota için düşük motor gücü yetersiz kalabilir.");
  }
  if (state.routeType === "winter" && vehicle.segmentTag !== "suv") {
    warnings.push("Kış şartlarında SUV veya daha yüksek yerden yapılı araç önerilir.");
  }
  if (vehicle.seats < totalPassengers) {
    warnings.push("Koltuk kapasitesi yolcu sayısına göre sınırda kalıyor.");
  }
  if (vehicle.luggage < luggageNeed * 30) {
    warnings.push("Bagaj kapasitesi eşyalar için yetersiz olabilir.");
  }
  if (!warnings.length) {
    warnings.push("Seçilen araç bu rota için dengeli görünüyor.");
  }
  return warnings;
}

export function formatComparisonValue(value, key) {
  if (value == null) return "-";
  if (key === "price") return `₺${value}`;
  if (key === "consumption") return `${value} L/100km`;
  if (key === "luggage") return `${value} L`;
  if (key === "seats") return `${value}`;
  return `${value}/10`;
}

export function assistantReply(question, state, topVehicle, currentRoute) {
  if (/uygun/i.test(question) && topVehicle) {
    return `${topVehicle.name} bu rota için güçlü aday. ${currentRoute} hattında bagaj ve kişi sayısı uyumluysa öneririm.`;
  }
  if (/valiz|bagaj/i.test(question)) {
    return `Mevcut formda bagaj yükü belirgin. ${state.largeBags} büyük valiz ve ${state.mediumBags} orta valiz nedeniyle SUV veya minivan daha güvenli.`;
  }
  if (/ekonom/i.test(question)) {
    return "Ekonomik tarafta Fiat Egea Cross ve Toyota Corolla öne çıkıyor. Düşük tüketim ve makul günlük ücret sunuyorlar.";
  }
  if (/dağ|yayla|yol/i.test(question)) {
    return "Dağ ve yayla rotası için Dacia Duster veya Peugeot 3008 daha uygun. Yerden yükseklik ve motor gücü önemli.";
  }
  return "Bu rota için yol tipi, kişi sayısı ve bagaj birlikte değerlendirilmeli. İstersen analiz ekranını açıp açıklamalı önerileri görebilirsin.";
}

export function buildVehicleSummary(vehicle) {
  const routeText =
    vehicle.routeFit.includes("mountain") || vehicle.routeFit.includes("winter")
      ? "zorlu rota koşulları"
      : vehicle.routeFit.includes("city")
        ? "şehir içi kullanım"
        : "uzun yol dengesi";
  const comfortText =
    vehicle.comfort >= 9
      ? "yüksek konfor"
      : vehicle.comfort >= 7
        ? "dengeli konfor"
        : "temel konfor";
  const luggageText =
    vehicle.luggage >= 700
      ? "geniş bagaj hacmi"
      : vehicle.luggage >= 500
        ? "iyi bagaj kapasitesi"
        : "kompakt bagaj yapısı";

  return `${vehicle.name}, ${routeText}, ${comfortText} ve ${luggageText} sunan ${vehicle.segment.toLowerCase()} bir seçenek olarak öne çıkıyor.`;
}

export function buildVehicleInsight(vehicle) {
  const strengths = [];
  if (vehicle.consumption <= 5) strengths.push("yakıt ekonomisi güçlü");
  if (vehicle.luggage >= 500) strengths.push("bagaj hacmi rahat");
  if (vehicle.comfort >= 8) strengths.push("uzun yol konforu iyi");
  if (vehicle.performance >= 8) strengths.push("motor tarafı güçlü");
  if (vehicle.routeFit.includes("mountain") || vehicle.routeFit.includes("winter")) {
    strengths.push("zorlu rota uyumu yüksek");
  }

  const highlight = strengths.length
    ? strengths.slice(0, 3).join(", ")
    : "dengeli kullanım profili";

  return `AI yorumu: ${vehicle.name} için ${highlight}. Bu kombinasyon, aracı ${vehicle.routeFit.includes("city") ? "şehir içi" : "seyahat"} kullanımında daha mantıklı bir seçenek haline getiriyor.`;
}

export function getVehicleTechnicalBars(vehicle) {
  return [
    {
      label: "Yakıt ekonomisi",
      value: Math.max(20, 100 - Math.round(vehicle.consumption * 12)),
      tip: "Düşük tüketim, uzun rotalarda maliyeti aşağı çeker.",
    },
    {
      label: "Bagaj uyumu",
      value: Math.min(100, Math.round((vehicle.luggage / 900) * 100)),
      tip: "Bagaj hacmi bagajlı seyahatler için uygunluk sinyali verir.",
    },
    {
      label: "Konfor",
      value: Math.min(100, vehicle.comfort * 10),
      tip: "Koltuk rahatlığı ve uzun yol hissi bu skora yansır.",
    },
    {
      label: "Performans",
      value: Math.min(100, vehicle.performance * 10),
      tip: "Motor gücü ve yol tepkisi bu alanda görünür.",
    },
  ];
}
