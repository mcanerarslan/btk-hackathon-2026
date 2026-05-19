import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { buildVehicleInsight, buildVehicleSummary, computeScore } from "../data";
import { useTrip } from "../TripContext";
import { useMemo, useState } from "react";

export function VehiclesPage() {
  const { state, setState, vehicles } = useTrip();
  const [filters, setFilters] = useState({
    maxPrice: 5000,
    fuel: "all",
    transmission: "all",
    seats: 1,
    luggage: 0,
    route: "all",
  });
  const [compareIds, setCompareIds] = useState([]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const categoryMatch =
        state.filter === "all" ||
        vehicle.category === state.filter ||
        vehicle.segmentTag === state.filter;
      const priceMatch = vehicle.price <= filters.maxPrice;
      const fuelMatch = filters.fuel === "all" || vehicle.fuel === filters.fuel;
      const transmissionMatch = filters.transmission === "all" || (vehicle.transmission || "Otomatik") === filters.transmission;
      const seatsMatch = vehicle.seats >= Number(filters.seats);
      const luggageMatch = vehicle.luggage >= Number(filters.luggage);
      const routeMatch = filters.route === "all" || vehicle.routeFit.includes(filters.route);
      return categoryMatch && priceMatch && fuelMatch && transmissionMatch && seatsMatch && luggageMatch && routeMatch;
    });
  }, [filters, state.filter, vehicles]);

  const fuelOptions = Array.from(new Set(vehicles.map((vehicle) => vehicle.fuel)));
  const comparedVehicles = vehicles.filter((vehicle) => compareIds.includes(vehicle.id));

  const toggleCompare = (vehicleId) => {
    setCompareIds((prev) => {
      if (prev.includes(vehicleId)) return prev.filter((id) => id !== vehicleId);
      return [...prev, vehicleId].slice(-3);
    });
  };

  return (
    <section id="cars" className="section cars reveal">
      <div className="section-heading">
        <span className="eyebrow">Klasik gezilebilir araç alanı</span>
        <h2>AI kullanmadan da keşfedebilirsin.</h2>
      </div>
      <div className="chip-row">
        {[
          ["all", "Tümü"],
          ["economy", "Ekonomik"],
          ["suv", "SUV"],
          ["family", "Aile"],
          ["premium", "Premium"],
          ["outdoor", "Outdoor"],
        ].map(([filter, label]) => (
          <button
            key={filter}
            className={`chip ${state.filter === filter ? "active" : ""}`}
            type="button"
            onClick={() => setState((prev) => ({ ...prev, filter }))}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="catalog-toolbar glass">
        <label className="field">
          <span>Maksimum fiyat: ₺{filters.maxPrice}</span>
          <input
            type="range"
            min="1200"
            max="5000"
            step="100"
            value={filters.maxPrice}
            onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: Number(event.target.value) }))}
          />
        </label>
        <label className="field">
          <span>Yakıt</span>
          <select value={filters.fuel} onChange={(event) => setFilters((prev) => ({ ...prev, fuel: event.target.value }))}>
            <option value="all">Tümü</option>
            {fuelOptions.map((fuel) => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Vites</span>
          <select value={filters.transmission} onChange={(event) => setFilters((prev) => ({ ...prev, transmission: event.target.value }))}>
            <option value="all">Tümü</option>
            <option value="Otomatik">Otomatik</option>
            <option value="Manuel">Manuel</option>
          </select>
        </label>
        <label className="field">
          <span>Kişi kapasitesi</span>
          <select value={filters.seats} onChange={(event) => setFilters((prev) => ({ ...prev, seats: event.target.value }))}>
            {[1, 2, 3, 4, 5, 6, 7].map((seat) => <option key={seat} value={seat}>{seat}+ kişi</option>)}
          </select>
        </label>
        <label className="field">
          <span>Bagaj hacmi</span>
          <select value={filters.luggage} onChange={(event) => setFilters((prev) => ({ ...prev, luggage: event.target.value }))}>
            <option value="0">Tümü</option>
            <option value="440">440 L+</option>
            <option value="500">500 L+</option>
            <option value="700">700 L+</option>
          </select>
        </label>
        <label className="field">
          <span>Rota uygunluğu</span>
          <select value={filters.route} onChange={(event) => setFilters((prev) => ({ ...prev, route: event.target.value }))}>
            <option value="all">Tümü</option>
            <option value="city">Şehir içi</option>
            <option value="long">Uzun yol</option>
            <option value="mountain">Dağ/yayla</option>
            <option value="winter">Kış</option>
            <option value="outdoor">Outdoor</option>
          </select>
        </label>
      </div>

      <div className="vehicle-grid">
        {filteredVehicles.map((vehicle) => {
          const insight = vehicle.aiSummary || buildVehicleInsight(vehicle) || buildVehicleSummary(vehicle);
          const insightBody = insight.replace(/^AI yorumu:\s*/i, "");

          return (
            <article key={vehicle.id} className="vehicle-card">
              <div className="vehicle-visual">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                  />
                ) : (
                  vehicle.emoji
                )}
                <div className="badge">{vehicle.segment}</div>
              </div>
              <h3>{vehicle.name}</h3>
              <div className="score">{computeScore(vehicle, state)}/100 Gemini uygunluk</div>
              <p className="details ai-insight-copy">
                <span className="ai-sparkles" aria-hidden="true">
                  <Sparkles size={16} strokeWidth={2.4} />
                </span>
                {insightBody}
              </p>
              <div className="vehicle-specs">
                <div className="metric-row">
                  <span>Fiyat</span>
                  <strong>₺{vehicle.price}/gün</strong>
                </div>
                <div className="metric-row">
                  <span>Yakıt</span>
                  <strong>{vehicle.fuel}</strong>
                </div>
                <div className="metric-row">
                  <span>Bagaj</span>
                  <strong>{vehicle.luggage} L</strong>
                </div>
                <div className="metric-row">
                  <span>Kapasite</span>
                  <strong>{vehicle.seats} kişi</strong>
                </div>
                <div className="metric-row">
                  <span>Vites</span>
                  <strong>{vehicle.transmission || "Otomatik"}</strong>
                </div>
                <div className="metric-row">
                  <span>Skorlar</span>
                  <strong>
                    Yakıt {Math.max(20, 100 - Math.round(vehicle.consumption * 12))} · Konfor {vehicle.comfort * 10} · Performans {vehicle.performance * 10}
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Uygunluk</span>
                  <strong>{vehicle.available === false ? "Müsait değil" : "Müsait"}</strong>
                </div>
              </div>
              <div className="vehicle-ai-reason">
                <strong>Kimler için uygun?</strong>
                <p>
                  {vehicle.seats >= 7
                    ? "Kalabalık aileler ve çok bagajlı yolculuklar."
                    : vehicle.segmentTag === "suv" || vehicle.category === "outdoor"
                      ? "Uzun yol, yayla ve değişken yol koşulları."
                      : vehicle.category === "premium"
                        ? "Konfor ve prestij beklentisi olan iş/uzun yol kullanıcıları."
                        : "Şehir içi ve bütçe odaklı kısa-orta yolculuklar."}
                </p>
                <strong>Artıları / eksileri</strong>
                <p>
                  Artı: {vehicle.consumption <= 5.2 ? "yakıt ekonomisi" : vehicle.comfort >= 8 ? "konfor" : "fiyat dengesi"}.
                  Eksi: {vehicle.luggage < 400 ? "bagaj kapasitesi sınırlı" : vehicle.price > state.budget ? "bütçeyi aşabilir" : "özel beklentiler için segment kontrol edilmeli"}.
                </p>
              </div>
              <div className="planner-actions">
                <button className="secondary-btn" type="button" onClick={() => toggleCompare(vehicle.id)}>
                  {compareIds.includes(vehicle.id) ? "Çıkar" : "Karşılaştır"}
                </button>
                <Link className="primary-btn" to={`/vehicles/${vehicle.id}`}>
                  Detaylı İncele
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {comparedVehicles.length ? (
        <div className="compare-table-wrap glass" style={{ marginTop: 18 }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Kriter</th>
                {comparedVehicles.map((vehicle) => <th key={vehicle.id}>{vehicle.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Gemini skor", (vehicle) => `${computeScore(vehicle, state)}/100`],
                ["Günlük fiyat", (vehicle) => `₺${vehicle.price}`],
                ["Yakıt", (vehicle) => vehicle.fuel],
                ["Tüketim", (vehicle) => `${vehicle.consumption} L/100km`],
                ["Bagaj", (vehicle) => `${vehicle.luggage} L`],
                ["Kapasite", (vehicle) => `${vehicle.seats} kişi`],
              ].map(([label, getter]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {comparedVehicles.map((vehicle) => <td key={vehicle.id}>{getter(vehicle)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
