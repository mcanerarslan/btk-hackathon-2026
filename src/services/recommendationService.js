import { buildRiskWarnings, computeScore } from "../data";

const ROUTE_LABELS = {
  city: "şehir içi",
  long: "uzun yol",
  mountain: "dağ/yayla",
  winter: "kış",
  outdoor: "kamp/outdoor",
  mixed: "karışık rota",
  family: "aile",
};

const PRIORITY_LABELS = {
  economy: "ekonomik",
  balanced: "dengeli",
  comfort: "konfor",
  performance: "performans",
  family: "aile",
  outdoor: "outdoor",
};

export function getRouteLabel(routeType) {
  return ROUTE_LABELS[routeType] || routeType;
}

export function getPriorityLabel(priority) {
  return PRIORITY_LABELS[priority] || priority;
}

export function getTripDays(state) {
  const start = new Date(state.departureDate);
  const end = new Date(state.returnDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const diff = Math.ceil((end - start) / 86400000);
  return Math.max(1, diff);
}

export function estimateDistanceKm(state) {
  const route = `${state.fromCity || ""}-${state.toCity || ""}`.toLocaleLowerCase("tr-TR");
  if (route.includes("istanbul") && route.includes("rize")) return 1140;
  if (route.includes("istanbul") && route.includes("antalya")) return 700;
  if (route.includes("ankara") && route.includes("kapadokya")) return 300;
  if (route.includes("izmir") && route.includes("bodrum")) return 240;
  if (state.routeType === "city") return 90;
  if (state.routeType === "mountain" || state.routeType === "outdoor") return 420;
  return 520;
}

export function estimateFuelCost(vehicle, state) {
  const distance = estimateDistanceKm(state);
  const fuelUnitPrice = vehicle.fuel?.toLocaleLowerCase("tr-TR").includes("benzin") ? 43 : 41;
  const litres = (distance * vehicle.consumption) / 100;
  return {
    distance,
    litres: Math.round(litres),
    fuel: Math.round(litres * fuelUnitPrice),
    rental: vehicle.price * getTripDays(state),
    total: Math.round(litres * fuelUnitPrice) + vehicle.price * getTripDays(state),
  };
}

export function estimateLuggageNeedLitres(state) {
  return state.largeBags * 95 + state.mediumBags * 65 + state.backpacks * 28 + (state.oversize ? 90 : 0);
}

export function getLuggageFit(vehicle, state) {
  const need = estimateLuggageNeedLitres(state);
  const ratio = vehicle.luggage / Math.max(1, need);
  return {
    need,
    label: ratio >= 1.15 ? "Rahat uyum" : ratio >= 0.9 ? "Sınırda uyum" : "Riskli uyum",
    risk: ratio < 0.9,
  };
}

export function buildRecommendationSet(vehicles, state) {
  const scored = vehicles
    .map((vehicle) => ({ vehicle, score: computeScore(vehicle, state) }))
    .sort((a, b) => b.score - a.score);

  const affordable = scored.filter((item) => item.vehicle.price <= state.budget);
  const pickFrom = affordable.length ? affordable : scored;
  const economical = [...pickFrom].sort(
    (a, b) => a.vehicle.price + a.vehicle.consumption * 120 - (b.vehicle.price + b.vehicle.consumption * 120),
  )[0];
  const balanced = scored[0];
  const comfort = [...pickFrom].sort(
    (a, b) => b.vehicle.comfort + b.vehicle.performance / 2 + b.score / 25 - (a.vehicle.comfort + a.vehicle.performance / 2 + a.score / 25),
  )[0];

  return {
    economical,
    balanced,
    comfort,
    scored,
  };
}

export function buildEliminationNotes(vehicles, state, selectedIds = []) {
  return vehicles
    .filter((vehicle) => !selectedIds.includes(vehicle.id))
    .map((vehicle) => {
      const warnings = buildRiskWarnings(vehicle, state).filter(
        (warning) => !/dengeli görünüyor|dengeli gorunuyor/i.test(warning),
      );
      const luggage = getLuggageFit(vehicle, state);
      const budgetProblem = vehicle.price > state.budget;
      const routeProblem = !vehicle.routeFit.includes(state.routeType);
      const reason =
        warnings[0] ||
        (budgetProblem ? `Günlük fiyat bütçeyi ₺${vehicle.price - state.budget} aşıyor.` : "") ||
        (luggage.risk ? `Bagaj ihtiyacı yaklaşık ${luggage.need} L; araç ${vehicle.luggage} L sunuyor.` : "") ||
        (routeProblem ? `${getRouteLabel(state.routeType)} etiketi bu araçta güçlü değil.` : "") ||
        "Seçilen alternatifler aynı ihtiyaca daha yüksek skorla yanıt verdi.";
      return { id: vehicle.id, name: vehicle.name, reason };
    })
    .slice(0, 4);
}

export function buildDecisionSummary(vehicle, state) {
  if (!vehicle) return "Öneri üretmek için katalogda araç bulunamadı.";
  const luggage = getLuggageFit(vehicle, state);
  const cost = estimateFuelCost(vehicle, state);
  return `${vehicle.name}, ${getRouteLabel(state.routeType)} rotası ve ${getPriorityLabel(state.priority)} önceliği için en güçlü aday. Yaklaşık ${cost.distance} km rota, ${cost.fuel.toLocaleString("tr-TR")} TL yakıt ve ${getTripDays(state)} günlük kira ile toplam ${cost.total.toLocaleString("tr-TR")} TL civarı maliyet verir. Bagaj tarafı: ${luggage.label}.`;
}
