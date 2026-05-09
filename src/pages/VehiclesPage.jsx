import { Link } from "react-router-dom";
import { buildVehicleSummary } from "../data";
import { useTrip } from "../TripContext";

export function VehiclesPage() {
  const { state, setState, catalog } = useTrip();

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
      <div className="vehicle-grid">
        {catalog.map((vehicle) => (
          <article key={vehicle.id} className="vehicle-card">
            <div className="vehicle-visual">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }}
                />
              ) : (
                vehicle.emoji
              )}
            </div>
            <div className="badge">{vehicle.segment}</div>
            <h3>{vehicle.name}</h3>
            <p className="details">
              {vehicle.aiSummary || buildVehicleSummary(vehicle)}
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
            </div>
            <div style={{ marginTop: 14 }}>
              <Link className="primary-btn" to={`/vehicles/${vehicle.id}`}>
                Detaylı İncele
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
