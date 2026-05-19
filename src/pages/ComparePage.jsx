import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { computeScore, formatComparisonValue, comparisonMetrics } from "../data";
import { useTrip } from "../TripContext";
import { buildDecisionSummary, estimateFuelCost, getLuggageFit } from "../services/recommendationService";

export function ComparePage() {
  const { vehicles, state } = useTrip();
  const availableVehicles = vehicles.filter((vehicle) => vehicle.available !== false);
  const [selectedIds, setSelectedIds] = useState(() => availableVehicles.slice(0, 3).map((vehicle) => vehicle.id));

  const selectedVehicles = useMemo(
    () => selectedIds.map((id) => availableVehicles.find((vehicle) => vehicle.id === id)).filter(Boolean),
    [availableVehicles, selectedIds],
  );

  const best = useMemo(
    () =>
      selectedVehicles
        .map((vehicle) => ({ vehicle, score: computeScore(vehicle, state) }))
        .sort((a, b) => b.score - a.score)[0],
    [selectedVehicles, state],
  );

  const updateSelection = (index, vehicleId) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[index] = vehicleId;
      return Array.from(new Set(next)).slice(0, 3);
    });
  };

  return (
    <section className="section compare reveal">
      <div className="section-heading">
        <span className="eyebrow">AI araç karşılaştırma</span>
        <h2>2-3 aracı aynı rota ihtiyacına göre kıyasla.</h2>
        <p>
          Karar sadece fiyat tablosu değil; bagaj, yolcu, rota, yakıt ve konfor skorları birlikte
          değerlendirilir.
        </p>
      </div>

      <div className="compare-picker glass">
        {[0, 1, 2].map((index) => (
          <label key={index} className="field">
            <span>{index + 1}. araç</span>
            <select value={selectedIds[index] || ""} onChange={(event) => updateSelection(index, event.target.value)}>
              {availableVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="compare-table-wrap glass">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Kriter</th>
              {selectedVehicles.map((vehicle) => (
                <th key={vehicle.id}>{vehicle.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AI uygunluk</td>
              {selectedVehicles.map((vehicle) => (
                <td key={vehicle.id}>{computeScore(vehicle, state)}/100</td>
              ))}
            </tr>
            {comparisonMetrics.map(([label, key]) => (
              <tr key={label}>
                <td>{label}</td>
                {selectedVehicles.map((vehicle) => (
                  <td key={vehicle.id}>{formatComparisonValue(vehicle[key], key)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td>Tahmini yakıt</td>
              {selectedVehicles.map((vehicle) => (
                <td key={vehicle.id}>₺{estimateFuelCost(vehicle, state).fuel.toLocaleString("tr-TR")}</td>
              ))}
            </tr>
            <tr>
              <td>Bagaj uyumu</td>
              {selectedVehicles.map((vehicle) => (
                <td key={vehicle.id}>{getLuggageFit(vehicle, state).label}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="decision-panel glass gemini-border">
        <div>
          <span className="eyebrow">AI karar yorumu</span>
          <h2>{best?.vehicle.name || "Araç seç"}</h2>
          <p>{best ? buildDecisionSummary(best.vehicle, state) : "Karşılaştırma için en az iki araç seç."}</p>
        </div>
        <div className="decision-tags">
          <span>
            <Sparkles size={15} /> En yüksek skor: {best?.score || 0}/100
          </span>
          <span>Rota: {state.fromCity} → {state.toCity}</span>
          <span>Yolcu: {state.adults + state.children}</span>
          <span>Bütçe: ₺{Number(state.budget).toLocaleString("tr-TR")}/gün</span>
        </div>
      </div>
    </section>
  );
}
