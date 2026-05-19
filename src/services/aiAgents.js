import { buildRiskWarnings, computeScore } from "../data";
import {
  buildDecisionSummary,
  buildRecommendationSet,
  estimateFuelCost,
  estimateLuggageNeedLitres,
  getLuggageFit,
  getPriorityLabel,
  getRouteLabel,
} from "./recommendationService";

const PURPOSE_LABELS = {
  holiday: "tatil",
  business: "iş",
  familyVisit: "aile ziyareti",
  cityUse: "şehir içi kullanım",
  longTrip: "uzun yol",
};

const VEHICLE_TYPE_LABELS = {
  any: "esnek",
  sedan: "sedan",
  hatchback: "hatchback",
  suv: "SUV",
  electric: "elektrikli",
  automatic: "otomatik",
  manual: "manuel",
};

function vehicleTypeMatches(vehicle, preference) {
  const text = `${vehicle.name} ${vehicle.segment} ${vehicle.segmentTag} ${vehicle.fuel} ${vehicle.transmission}`.toLocaleLowerCase("tr-TR");
  if (!preference || preference === "any") return true;
  if (preference === "automatic") return vehicle.transmission === "Otomatik";
  if (preference === "manual") return vehicle.transmission === "Manuel";
  if (preference === "electric") return /elektrik|hibrit/.test(text);
  return text.includes(preference.toLocaleLowerCase("tr-TR"));
}

export function runRouteAnalysisAgent(state) {
  const passengerCount = state.adults + state.children;
  const luggageNeed = estimateLuggageNeedLitres(state);
  const isLong = state.routeType === "long" || state.routeType === "mixed" || state.purpose === "longTrip";
  const isFamily = passengerCount >= 4 || state.children > 0 || state.seats > 0;
  const isHeavyLuggage = luggageNeed >= 420 || state.oversize;
  const purpose = PURPOSE_LABELS[state.purpose] || "genel kullanım";

  return {
    routeKind: isLong ? "şehirler arası / uzun yol" : state.routeType === "city" ? "şehir içi / kısa rota" : getRouteLabel(state.routeType),
    purpose,
    passengerCount,
    luggageNeed,
    isFamily,
    isHeavyLuggage,
    summary: `${state.fromCity} - ${state.toCity} hattı ${getRouteLabel(state.routeType)} profiliyle değerlendirildi. ${passengerCount} yolcu, yaklaşık ${luggageNeed} L bagaj ihtiyacı ve ${purpose} amacı araç seçiminde belirleyici.`,
  };
}

export function runVehicleMatchAgent(vehicles, state, routeAnalysis) {
  const ranked = vehicles
    .filter((vehicle) => vehicle.available !== false)
    .map((vehicle) => {
      let score = computeScore(vehicle, state);
      if (vehicleTypeMatches(vehicle, state.vehiclePreference)) score += state.vehiclePreference === "any" ? 0 : 8;
      if (state.fuelPriority === "economic" && vehicle.consumption <= 5.2) score += 8;
      if (state.fuelPriority === "performance" && vehicle.performance >= 8) score += 7;
      if (state.comfortPriority === "high" && vehicle.comfort >= 8) score += 8;
      if (state.comfortPriority === "low" && vehicle.price <= state.budget) score += 4;
      if (routeAnalysis.isHeavyLuggage && vehicle.luggage >= routeAnalysis.luggageNeed) score += 6;
      return { vehicle, score: Math.max(0, Math.min(100, Math.round(score))) };
    })
    .sort((a, b) => b.score - a.score);

  return {
    best: ranked[0],
    ranked,
    reason: ranked[0]
      ? `${ranked[0].vehicle.name}, rota tipi, yolcu sayısı, bagaj hacmi ve ${getPriorityLabel(state.priority)} önceliği birlikte puanlandığında en yüksek uyumu verdi.`
      : "Uygun araç bulunamadı.",
  };
}

export function runBudgetOptimizationAgent(vehicles, state) {
  const recommendationSet = buildRecommendationSet(
    vehicles.filter((vehicle) => vehicle.available !== false),
    state,
  );

  return {
    economic: recommendationSet.economical,
    balanced: recommendationSet.balanced,
    comfort: recommendationSet.comfort,
    budgetRange: `₺${Number(state.budgetMin || 1200).toLocaleString("tr-TR")} - ₺${Number(state.budget || 0).toLocaleString("tr-TR")}/gün`,
  };
}

export function runSafetySuitabilityAgent(vehicle, state) {
  if (!vehicle) {
    return {
      warnings: ["Katalogda uygun araç bulunamadı."],
      suitability: "kontrol edilemedi",
      luggageFit: null,
    };
  }

  const luggageFit = getLuggageFit(vehicle, state);
  const warnings = buildRiskWarnings(vehicle, state);
  if (state.children > 0 && state.seats <= 0) warnings.push("Çocuk yolcu var; çocuk koltuğu ihtiyacı tekrar doğrulanmalı.");
  if (state.vehiclePreference !== "any" && !vehicleTypeMatches(vehicle, state.vehiclePreference)) {
    warnings.push(`${VEHICLE_TYPE_LABELS[state.vehiclePreference]} tercihi birebir karşılanmıyor; uygunluk diğer kriterlerden geliyor.`);
  }

  return {
    warnings,
    suitability: luggageFit.risk ? "sınırda" : "uygun",
    luggageFit,
  };
}

export function runExplanationAgent({ bestMatch, budget, routeAnalysis, safety, state }) {
  const vehicle = bestMatch?.vehicle;
  if (!vehicle) return "Araç önerisi üretilemedi.";

  const cost = estimateFuelCost(vehicle, state);
  return `${vehicle.name}, ${routeAnalysis.routeKind} kullanımında ${routeAnalysis.passengerCount} yolcu ve ${routeAnalysis.luggageNeed} L bagaj ihtiyacına en dengeli yanıtı verdi. Günlük ₺${vehicle.price.toLocaleString("tr-TR")} fiyat, yaklaşık ₺${cost.fuel.toLocaleString("tr-TR")} yakıt tahmini ve ${safety.luggageFit?.label.toLocaleLowerCase("tr-TR")} nedeniyle ${budget.budgetRange} bütçe aralığında mantıklı seçim.`;
}

export function orchestrateAiAgents(vehicles, state) {
  const routeAnalysis = runRouteAnalysisAgent(state);
  const vehicleMatch = runVehicleMatchAgent(vehicles, state, routeAnalysis);
  const budget = runBudgetOptimizationAgent(vehicles, state);
  const safety = runSafetySuitabilityAgent(vehicleMatch.best?.vehicle, state);
  const explanation = runExplanationAgent({ bestMatch: vehicleMatch.best, budget, routeAnalysis, safety, state });
  const bestVehicle = vehicleMatch.best?.vehicle;

  return {
    routeAnalysis: routeAnalysis.summary,
    routeAgent: routeAnalysis,
    bestVehicle: bestVehicle
      ? {
          id: bestVehicle.id,
          name: bestVehicle.name,
          reason: explanation,
          score: vehicleMatch.best.score,
        }
      : null,
    economicOption: budget.economic?.vehicle
      ? {
          id: budget.economic.vehicle.id,
          name: budget.economic.vehicle.name,
          reason: `${budget.economic.vehicle.name}, günlük fiyat ve tüketim tarafında en düşük toplam maliyet adaylarından biri.`,
        }
      : null,
    comfortOption: budget.comfort?.vehicle
      ? {
          id: budget.comfort.vehicle.id,
          name: budget.comfort.vehicle.name,
          reason: `${budget.comfort.vehicle.name}, konfor (${budget.comfort.vehicle.comfort}/10), performans (${budget.comfort.vehicle.performance}/10) ve rota uyumu nedeniyle daha rahat alternatif.`,
        }
      : null,
    balancedOption: budget.balanced?.vehicle
      ? {
          id: budget.balanced.vehicle.id,
          name: budget.balanced.vehicle.name,
          reason: buildDecisionSummary(budget.balanced.vehicle, state),
        }
      : null,
    warnings: safety.warnings,
    summary: bestVehicle
      ? `${bestVehicle.name} ilk öneri. Ekonomik alternatif ${budget.economic?.vehicle?.name || "-"}, konfor alternatifi ${budget.comfort?.vehicle?.name || "-"}.`
      : "Öneri üretilemedi.",
    source: "local-agents",
  };
}
