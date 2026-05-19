import audiA4Image from "./photos/audia4.jpg";
import bmw320Image from "./photos/bmw320.webp";
import daciaDusterImage from "./photos/daciaduster.webp";
import fiatEgeaImage from "./photos/fiategea.png";
import fiatEgeaCrossImage from "./photos/fiategeacross.jpg";
import hyundaiI20Image from "./photos/hyundaii20.png";
import hyundaiStariaImage from "./photos/hyundaistraia.webp";
import mercedesVitoImage from "./photos/Mercedes-Benz-Vito.jpg";
import opelCorsaImage from "./photos/Opel-Corsa.jpg";
import passatImage from "./photos/passat.jpg";
import peugeot3008Image from "./photos/peugeot3008.jpg";
import renaultClioImage from "./photos/renaultclio.jpg";
import skodaOctaviaImage from "./photos/skodaoctavia.jpg";
import teslaModelYImage from "./photos/tesla-model-y.jpg";
import toyotaCorollaImage from "./photos/toyotacorolla.webp";

export const vehicles = [
  {
    id: "egea-cross",
    name: "Fiat Egea Cross",
    segment: "Ekonomik Crossover",
    category: "economy",
    segmentTag: "suv",
    price: 1680,
    fuel: "Dizel",
    transmission: "Otomatik",
    consumption: 4.8,
    luggage: 440,
    seats: 5,
    comfort: 6,
    performance: 5,
    routeFit: ["city", "mixed", "long"],
    notes: "Düşük tüketim, yeterli bagaj, şehir + uzun yol dengesi.",
    emoji: "🚙",
    imageUrl: fiatEgeaCrossImage,
  },
  {
    id: "fiat-egea",
    name: "Fiat Egea",
    segment: "Ekonomik Sedan",
    category: "economy",
    segmentTag: "city",
    price: 1580,
    fuel: "Dizel",
    transmission: "Manuel",
    consumption: 4.6,
    luggage: 520,
    seats: 5,
    comfort: 6,
    performance: 5,
    routeFit: ["city", "mixed", "long"],
    notes: "Düşük yakıt tüketimi ve geniş bagajıyla ekonomik sedan seçeneği.",
    emoji: "🚗",
    imageUrl: fiatEgeaImage,
  },
  {
    id: "renault-clio",
    name: "Renault Clio",
    segment: "Kompakt Hatchback",
    category: "economy",
    segmentTag: "city",
    price: 1450,
    fuel: "Benzin",
    transmission: "Otomatik",
    consumption: 5.2,
    luggage: 391,
    seats: 5,
    comfort: 6,
    performance: 5,
    routeFit: ["city", "mixed"],
    notes: "Şehir içi kullanım ve ekonomik günlük kiralama için çevik seçenek.",
    emoji: "🚗",
    imageUrl: renaultClioImage,
  },
  {
    id: "hyundai-i20",
    name: "Hyundai i20",
    segment: "Kompakt Hatchback",
    category: "economy",
    segmentTag: "city",
    price: 1520,
    fuel: "Benzin",
    transmission: "Otomatik",
    consumption: 5.4,
    luggage: 352,
    seats: 5,
    comfort: 6,
    performance: 5,
    routeFit: ["city", "mixed"],
    notes: "Kolay park, düşük tüketim ve kısa-orta rota kullanımında pratik tercih.",
    emoji: "🚗",
    imageUrl: hyundaiI20Image,
  },
  {
    id: "peugeot-3008",
    name: "Peugeot 3008",
    segment: "SUV",
    category: "premium",
    segmentTag: "suv",
    price: 2890,
    fuel: "Dizel",
    transmission: "Otomatik",
    consumption: 5.7,
    luggage: 520,
    seats: 5,
    comfort: 9,
    performance: 7,
    routeFit: ["long", "mountain", "winter", "mixed"],
    notes: "Uzun yol konforu, geniş hacim ve güçlü motor.",
    emoji: "🚘",
    imageUrl: peugeot3008Image,
  },
  {
    id: "toyota-corolla",
    name: "Toyota Corolla",
    segment: "Sedan",
    category: "balanced",
    segmentTag: "family",
    price: 2100,
    fuel: "Benzin-Hibrit",
    transmission: "Otomatik",
    consumption: 4.3,
    luggage: 470,
    seats: 5,
    comfort: 8,
    performance: 6,
    routeFit: ["city", "long", "mixed"],
    notes: "Dengeli kullanım, sessiz sürüş ve iyi yakıt ekonomisi.",
    emoji: "🚗",
    imageUrl: toyotaCorollaImage,
  },
  {
    id: "skoda-octavia",
    name: "Skoda Octavia",
    segment: "Geniş Sedan",
    category: "balanced",
    segmentTag: "family",
    price: 2280,
    fuel: "Dizel",
    transmission: "Otomatik",
    consumption: 4.9,
    luggage: 600,
    seats: 5,
    comfort: 8,
    performance: 7,
    routeFit: ["long", "family", "mixed"],
    notes: "Geniş bagajı ve uzun yol dengesiyle aile seyahatlerinde güçlü aday.",
    emoji: "🚘",
    imageUrl: skodaOctaviaImage,
  },
  {
    id: "audi-a4",
    name: "Audi A4",
    segment: "Premium Sedan",
    category: "premium",
    segmentTag: "premium",
    price: 4120,
    fuel: "Benzin",
    transmission: "Otomatik",
    consumption: 6.4,
    luggage: 460,
    seats: 5,
    comfort: 9,
    performance: 8,
    routeFit: ["long", "city", "mixed"],
    notes: "Premium sedan konforu ve dengeli performans isteyen rotalar için güçlü seçenek.",
    emoji: "🏁",
    imageUrl: audiA4Image,
  },
  {
    id: "hyundai-staria",
    name: "Hyundai Staria",
    segment: "Minivan",
    category: "family",
    segmentTag: "family",
    price: 3350,
    fuel: "Dizel",
    transmission: "Otomatik",
    consumption: 6.9,
    luggage: 831,
    seats: 7,
    comfort: 9,
    performance: 6,
    routeFit: ["long", "family", "mixed", "outdoor"],
    notes: "Kalabalık aileler ve çok bagaj için ideal.",
    emoji: "🚌",
    imageUrl: hyundaiStariaImage,
  },
  {
    id: "dacia-duster",
    name: "Dacia Duster",
    segment: "Outdoor SUV",
    category: "outdoor",
    segmentTag: "outdoor",
    price: 2320,
    fuel: "Dizel",
    transmission: "Manuel",
    consumption: 5.9,
    luggage: 445,
    seats: 5,
    comfort: 7,
    performance: 8,
    routeFit: ["mountain", "winter", "outdoor", "mixed"],
    notes: "Arazi temalı kullanım ve zorlu rota koşulları için güçlü.",
    emoji: "🛻",
    imageUrl: daciaDusterImage,
  },
  {
    id: "bmw-3",
    name: "BMW 3 Serisi",
    segment: "Premium Sedan",
    category: "premium",
    segmentTag: "premium",
    price: 4380,
    fuel: "Benzin",
    transmission: "Otomatik",
    consumption: 6.7,
    luggage: 480,
    seats: 5,
    comfort: 10,
    performance: 9,
    routeFit: ["long", "city", "mixed"],
    notes: "Konfor ve performans odağı yüksek premium seçenek.",
    emoji: "🏁",
    imageUrl: bmw320Image,
  },
  {
    id: "tesla-model-y",
    name: "Tesla Model Y",
    segment: "Elektrikli SUV",
    category: "premium",
    segmentTag: "suv",
    price: 4650,
    fuel: "Elektrik",
    transmission: "Otomatik",
    consumption: 0,
    luggage: 854,
    seats: 5,
    comfort: 9,
    performance: 9,
    routeFit: ["city", "long", "mixed"],
    notes: "Sessiz sürüş, geniş bagaj ve yüksek performans isteyen elektrikli rota planları için güçlü seçenek.",
    emoji: "⚡",
    imageUrl: teslaModelYImage,
    available: true,
  },
  {
    id: "vw-passat",
    name: "Volkswagen Passat",
    segment: "Geniş Sedan",
    category: "balanced",
    segmentTag: "family",
    price: 2480,
    fuel: "Dizel",
    transmission: "Otomatik",
    consumption: 5.1,
    luggage: 586,
    seats: 5,
    comfort: 8,
    performance: 7,
    routeFit: ["long", "family", "mixed"],
    notes: "Uzun yol, iş seyahati ve aile kullanımı için geniş bagajlı dengeli sedan.",
    emoji: "🚘",
    imageUrl: passatImage,
    available: true,
  },
  {
    id: "opel-corsa",
    name: "Opel Corsa",
    segment: "Kompakt Hatchback",
    category: "economy",
    segmentTag: "city",
    price: 1390,
    fuel: "Benzin",
    transmission: "Manuel",
    consumption: 5.0,
    luggage: 309,
    seats: 5,
    comfort: 5,
    performance: 5,
    routeFit: ["city", "mixed"],
    notes: "Şehir içi, düşük bütçe ve az bagajlı kısa seyahatlerde pratik ekonomik seçenek.",
    emoji: "🚗",
    imageUrl: opelCorsaImage,
    available: true,
  },
  {
    id: "mercedes-vito",
    name: "Mercedes Vito",
    segment: "Premium Minivan",
    category: "family",
    segmentTag: "family",
    price: 3890,
    fuel: "Dizel",
    transmission: "Otomatik",
    consumption: 7.2,
    luggage: 990,
    seats: 8,
    comfort: 8,
    performance: 7,
    routeFit: ["long", "family", "mixed"],
    notes: "Kalabalık ekipler, çok valiz ve VIP transfer benzeri yolculuklar için geniş hacimli çözüm.",
    emoji: "🚐",
    imageUrl: mercedesVitoImage,
    available: true,
  },
];

export const campaigns = [
  {
    id: "summer-suv",
    title: "Yaz rotaları",
    headline: "%20 indirimli SUV seçkisi",
    description: "Uzun yol ve aile kullanımına uygun araçlar.",
    discount: 20,
    category: "suv",
    audience: "Aile ve uzun yol",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    status: "active",
    code: "YAZ20",
  },
  {
    id: "weekend-city",
    title: "Hafta sonu",
    headline: "Kompakt araçlarda düşük fiyat",
    description: "Şehir içi ve kısa mesafe planları için.",
    discount: 15,
    category: "city",
    audience: "Kısa seyahat",
    startDate: "2026-05-01",
    endDate: "2026-12-31",
    status: "active",
    code: "WEEKEND15",
  },
  {
    id: "outdoor-pack",
    title: "Outdoor",
    headline: "Kamp paketleri",
    description: "Bagaj hacmi ve yol dayanımı öncelikli seçimler.",
    discount: 12,
    category: "outdoor",
    audience: "Kamp ve yayla rotaları",
    startDate: "2026-04-15",
    endDate: "2026-10-15",
    status: "active",
    code: "OUTDOOR12",
  },
];

export function mergeCampaignCatalog(storedCampaigns) {
  if (!Array.isArray(storedCampaigns)) return campaigns;

  const storedById = new Map(storedCampaigns.map((campaign) => [campaign.id, campaign]));
  const mergedBase = campaigns.map((baseCampaign) => {
    const storedCampaign = storedById.get(baseCampaign.id);
    return storedCampaign ? { ...baseCampaign, ...storedCampaign } : baseCampaign;
  });
  const baseIds = new Set(campaigns.map((campaign) => campaign.id));
  const customCampaigns = storedCampaigns.filter((campaign) => !baseIds.has(campaign.id));

  return [...mergedBase, ...customCampaigns];
}

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
  routeType: "",
  priority: "",
  budget: "",
  budgetMin: "",
  purpose: "",
  fuelPriority: "",
  comfortPriority: "",
  vehiclePreference: "",
  adults: 0,
  children: 0,
  seats: 0,
  largeBags: 0,
  mediumBags: 0,
  backpacks: 0,
  oversize: false,
  filter: "all",
  fromCity: "",
  toCity: "",
  departureDate: "",
  returnDate: "",
};

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function routeBoost(vehicle, routeType) {
  if (!routeType) return 0;
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

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getLuggageNeedLitres(state) {
  return (
    toNumber(state.largeBags) * 95 +
    toNumber(state.mediumBags) * 65 +
    toNumber(state.backpacks) * 28 +
    (state.oversize ? 90 : 0)
  );
}

export function computeScore(vehicle, state) {
  const totalPassengers = toNumber(state.adults) + toNumber(state.children);
  const luggageNeed = getLuggageNeedLitres(state);
  const budget = toNumber(state.budget, 0);
  const budgetMin = toNumber(state.budgetMin, 0);
  let score = 50;

  score += routeBoost(vehicle, state.routeType);
  if (totalPassengers > 0) {
    score += vehicle.seats >= totalPassengers ? 12 : -24;
  }
  if (luggageNeed > 0) {
    score += vehicle.luggage >= luggageNeed * 1.15 ? 14 : vehicle.luggage >= luggageNeed * 0.9 ? 6 : -18;
  }

  if (state.priority === "economy") {
    score += Math.max(0, 16 - vehicle.price / 500);
    score += vehicle.consumption > 0 && vehicle.consumption < 5.5 ? 10 : vehicle.fuel === "Elektrik" ? 12 : 0;
  }
  if (budget && vehicle.price > budget) {
    score -= Math.min(24, Math.round((vehicle.price - budget) / 120));
  } else if (budget && vehicle.price <= budget) {
    score += 6;
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

  if (state.fuelPriority === "economic" && vehicle.consumption <= 5.2) score += 7;
  if (state.fuelPriority === "balanced" && vehicle.consumption <= 6.2) score += 4;
  if (state.fuelPriority === "performance" && vehicle.performance >= 8) score += 7;
  if (state.comfortPriority === "high") score += vehicle.comfort >= 8 ? 8 : -4;
  if (state.comfortPriority === "medium") score += vehicle.comfort >= 7 ? 4 : 0;
  if (state.comfortPriority === "low" && budget && vehicle.price <= budget) score += 3;
  if (budgetMin && vehicle.price < budgetMin) score -= 2;
  if (state.vehiclePreference && state.vehiclePreference !== "any") {
    const searchable = `${vehicle.name} ${vehicle.segment} ${vehicle.segmentTag} ${vehicle.fuel} ${vehicle.transmission}`.toLocaleLowerCase("tr-TR");
    if (state.vehiclePreference === "automatic" && vehicle.transmission === "Otomatik") score += 7;
    else if (state.vehiclePreference === "manual" && vehicle.transmission === "Manuel") score += 7;
    else if (state.vehiclePreference === "electric" && /elektrik|hibrit/.test(searchable)) score += 7;
    else if (searchable.includes(state.vehiclePreference.toLocaleLowerCase("tr-TR"))) score += 7;
  }

  if (state.oversize && vehicle.luggage < luggageNeed) score -= 18;
  if (state.routeType === "winter" && vehicle.segmentTag === "suv") score += 12;
  if (state.routeType === "mountain" && vehicle.performance >= 7) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildRiskWarnings(vehicle, state) {
  const warnings = [];
  const totalPassengers = toNumber(state.adults) + toNumber(state.children);
  const luggageNeed = getLuggageNeedLitres(state);

  if (state.routeType === "mountain" && vehicle.performance < 7) {
    warnings.push("Bu rota için düşük motor gücü yetersiz kalabilir.");
  }
  if (state.routeType === "winter" && vehicle.segmentTag !== "suv") {
    warnings.push("Kış şartlarında SUV veya daha yüksek yerden yapılı araç önerilir.");
  }
  if (vehicle.seats < totalPassengers) {
    warnings.push("Koltuk kapasitesi yolcu sayısına göre sınırda kalıyor.");
  }
  if (luggageNeed > 0 && vehicle.luggage < luggageNeed * 0.9) {
    warnings.push(`Bagaj kapasitesi yaklaşık ${luggageNeed} L ihtiyaca göre yetersiz kalabilir.`);
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
  const normalizedQuestion = question.toLocaleLowerCase("tr-TR");
  const hasRoute = Boolean(state.fromCity?.trim() && state.toCity?.trim());
  const routeText = hasRoute ? `${state.fromCity.trim()} → ${state.toCity.trim()}` : "";
  const passengerCount = state.adults + state.children;
  const hasPassengerInfo = passengerCount > 0;
  const hasLuggageInfo = state.largeBags > 0 || state.mediumBags > 0 || state.backpacks > 0;
  const needParts = [
    hasPassengerInfo ? `${passengerCount} kişi` : "",
    state.largeBags > 0 ? `${state.largeBags} büyük valiz` : "",
    state.mediumBags > 0 ? `${state.mediumBags} orta valiz` : "",
    state.backpacks > 0 ? `${state.backpacks} sırt çantası` : "",
  ].filter(Boolean);
  const needText = needParts.length ? needParts.join(", ") : "kişi ve bagaj bilgisi";

  if (/^(selam|merhaba|mrb|hey|iyi günler|iyi gunler)\b/i.test(normalizedQuestion)) {
    return "Merhaba, buradayım. İstersen direkt nasıl bir yolculuk planladığını yaz; kişi, bagaj ve bütçeye göre filodaki araçları birlikte daraltalım.";
  }
  if (/^(teşekkür|tesekkur|sağ ol|sag ol|eyvallah)/i.test(normalizedQuestion)) {
    return "Rica ederim. Aklında bir araç varsa adını yaz, yoksa kullanım amacını söyle; ona göre daha net yönlendireyim.";
  }
  if (/(ne yapabilirsin|nasıl yardımcı|nasil yardimci|kimsin)/i.test(normalizedQuestion)) {
    return "Filodaki araçları fiyat, yakıt, konfor, bagaj ve rota ihtiyacına göre yorumlayabiliyorum. Günlük kullanım mı, uzun yol mu, kalabalık aile mi; onu yazman yeterli.";
  }
  if (/konfor|rahat|premium/i.test(question)) {
    return "Konfor tarafında BMW 3 Serisi, Peugeot 3008, Audi A4, Tesla Model Y ve Hyundai Staria öne çıkıyor. Daha dengeli bütçede Toyota Corolla, Skoda Octavia, Volkswagen Passat ve Mercedes Vito da rahat seçenekler.";
  }
  if (/(neden|niye|seç|sec|tercih)/i.test(question) && topVehicle) {
    const priceText = `günlük ₺${topVehicle.price.toLocaleString("tr-TR")}`;
    const consumptionText =
      topVehicle.consumption > 0 ? `${topVehicle.consumption} L/100km tüketim` : "elektrikli kullanım";
    const routeNote = hasRoute
      ? ` ${routeText} hattı için yol tipi ve bagaj ihtiyacını ayrıca kontrol etmek gerekir.`
      : " Rota netleşirse yol şartına göre son kontrolü yapmak gerekir.";

    return `${topVehicle.name} seçmek için temel gerekçe: ${topVehicle.segment.toLowerCase()} sınıfında ${priceText} fiyat, ${consumptionText}, ${topVehicle.seats} kişilik kabin ve ${topVehicle.luggage} L bagaj sunuyor. ${topVehicle.notes} Şehir içi veya hafif bagajlı kullanımda mantıklı bir tercih olur.${routeNote}`;
  }
  if (/uygun/i.test(question) && topVehicle) {
    if (!hasRoute) {
      if (!hasPassengerInfo && !hasLuggageInfo) {
        return `${topVehicle.name} genel kullanım için mantıklı bir aday. Daha net konuşmam için sadece kaç kişi gideceğini, bagaj durumunu ve şehir içi mi uzun yol mu kullanacağını yazman yeterli.`;
      }
      return `${needText} için ${topVehicle.name} değerlendirilebilir. Rota da belli olursa yol şartı tarafında daha net “olur/olmaz” diyebilirim.`;
    }
    return `${topVehicle.name} ${routeText} hattı için güçlü aday. Bagaj ve kişi sayısı uyumluysa öneririm.`;
  }
  if (/valiz|bagaj/i.test(question)) {
    if (!hasLuggageInfo) {
      return "Bagaj miktarı belirtilmediği için net hacim yorumu yapamam. Kaç büyük valiz, orta valiz veya sırt çantası olduğunu yazarsan uygun bagaj hacmine göre araç önerebilirim.";
    }
    return `Mevcut formda bagaj yükü belirgin. ${state.largeBags} büyük valiz ve ${state.mediumBags} orta valiz nedeniyle SUV veya minivan daha güvenli.`;
  }
  if (/ekonom|az yak|yakıt|yakit|tasarruf|ucuz|bütçe|butce/i.test(question)) {
    return "Ekonomik ve az yakan seçeneklerde Toyota Corolla, Renault Clio, Opel Corsa ve Hyundai i20 öne çıkıyor. Şehir içi ve düşük bütçe için Corsa/Clio, daha dengeli tüketim ve konfor için Corolla daha mantıklı.";
  }
  if (/dağ|yayla|yol/i.test(question)) {
    return "Dağ ve yayla rotası için Dacia Duster veya Peugeot 3008 daha uygun. Yerden yükseklik ve motor gücü önemli.";
  }
  if (!hasRoute) {
    return "Bunu araç seçimi açısından yorumlayabilirim. Bana kullanım şeklini biraz açarsan filodan mantıklı seçenekleri söyleyeyim: şehir içi mi, uzun yol mu, kaç kişi ve yaklaşık ne kadar bagaj var?";
  }
  return `${routeText} için bunu araç seçimi tarafında düşünürsek yol tipi, kişi sayısı ve bagaj belirleyici olur. İstersen bu bilgilerle filodaki en uygun seçenekleri sıralayabilirim.`;
}

export function buildVehicleSummary(vehicle, variantKey = 0) {
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

  const transmissionText = vehicle.transmission?.toLowerCase() || "otomatik";
  const summaries = [
    `${vehicle.name}, ${vehicle.fuel.toLowerCase()} motoru ve ${vehicle.consumption} L/100km tüketimiyle günlük maliyeti kontrol altında tutan ${vehicle.segment.toLowerCase()} bir seçenek. ${vehicle.luggage} litrelik bagajı, ${vehicle.seats} kişilik oturma düzeni ve ${transmissionText} vitesiyle ${routeText} için pratik bir yapı sunar; ${comfortText} ve ${luggageText} beklentisi olan kullanıcılar için dengeli bir tercih olur.`,
    `${vehicle.name}, ${vehicle.price} TL günlük fiyatı, ${vehicle.fuel.toLowerCase()} yakıt yapısı ve ${vehicle.consumption} L/100km tüketimiyle bütçesini izleyen kullanıcıya hitap eder. ${vehicle.luggage} litrelik bagaj hacmi ve ${vehicle.seats} koltuğu, aracı ${routeText} odaklı kiralamalarda kullanışlı kılar; ${transmissionText} vites de günlük sürüşü sadeleştirir.`,
    `${vehicle.segment} sınıfındaki ${vehicle.name}, düşük tüketim, ölçülü performans ve pratik bagaj dengesini öne çıkarır. ${vehicle.luggage} L bagaj, ${vehicle.seats} kişilik kabin ve ${comfortText} karakteriyle ${routeText} için rahat yönetilen, abartısız ve mantıklı bir kiralama alternatifidir.`,
  ];
  return summaries[Math.abs(Number(variantKey) || 0) % summaries.length];
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
