import { useTrip } from "../TripContext";
import { stepLabels } from "../data";

export function PlannerPage() {
  const { state, setState, handleCounter, handleAnalyze } = useTrip();
  const stepProgress = `${(state.step / 5) * 100}%`;

  return (
    <section id="planner" className="section planner reveal">
      <div className="section-heading">
        <span className="eyebrow">Adım adım seyahat formu</span>
        <h2>Uzun form değil, akıcı bir karar akışı.</h2>
        <p>
          Her seçim anında sistem tepki verir, ilerleme çubuğu artar ve analiz bir sonraki adıma
          hazırlanır.
        </p>
      </div>

      <div className="planner-shell glass">
        <div className="planner-top">
          <div className="stepper" aria-label="Form ilerlemesi">
            <div className="stepper-track">
              <span style={{ width: stepProgress }} />
            </div>
            <div className="step-labels">
              {stepLabels.map((label, index) => (
                <button
                  key={label}
                  className={`step-chip ${state.step === index + 1 ? "active" : ""}`}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, step: index + 1 }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="planner-hint">
            <strong>AI ipucu</strong>
            <span>Girilen bilgiler analiz edilerek 3 araç önerisi hazırlanır.</span>
          </div>
        </div>

        <form className="planner-form" onSubmit={(e) => e.preventDefault()}>
          <div className={`form-step ${state.step === 1 ? "active" : ""}`} data-step="1">
            <div className="field-grid two">
              <label className="field">
                <span>Nereden?</span>
                <input
                  type="text"
                  value={state.fromCity}
                  onChange={(e) => setState((prev) => ({ ...prev, fromCity: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Nereye?</span>
                <input
                  type="text"
                  value={state.toCity}
                  onChange={(e) => setState((prev) => ({ ...prev, toCity: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Gidiş tarihi</span>
                <input
                  type="date"
                  value={state.departureDate}
                  onChange={(e) => setState((prev) => ({ ...prev, departureDate: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Dönüş tarihi</span>
                <input
                  type="date"
                  value={state.returnDate}
                  onChange={(e) => setState((prev) => ({ ...prev, returnDate: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Yolculuk amacı</span>
                <select
                  value={state.purpose}
                  onChange={(e) => setState((prev) => ({ ...prev, purpose: e.target.value }))}
                >
                  <option value="holiday">Tatil</option>
                  <option value="business">İş</option>
                  <option value="familyVisit">Aile ziyareti</option>
                  <option value="cityUse">Şehir içi kullanım</option>
                  <option value="longTrip">Uzun yol</option>
                </select>
              </label>
            </div>
          </div>

          <div className={`form-step ${state.step === 2 ? "active" : ""}`} data-step="2">
            <div className="card-options">
              {[
                ["city", "Şehir içi", "Kısa mesafe, düşük maliyet"],
                ["long", "Uzun yol", "Konfor, bagaj ve sürüş dengesi"],
                ["mountain", "Dağ / yayla yolu", "Yerden yükseklik ve motor gücü"],
                ["winter", "Kış şartları", "Çekiş ve güvenlik öncelikli"],
                ["outdoor", "Kamp / outdoor", "Bagaj hacmi ve dayanıklılık"],
                ["mixed", "Karışık rota", "Şehir + uzun yol + hafif arazi"],
              ].map(([value, title, text]) => (
                <button
                  key={value}
                  className={`option-card ${state.routeType === value ? "active" : ""}`}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, routeType: value }))}
                >
                  <strong>{title}</strong>
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`form-step ${state.step === 3 ? "active" : ""}`} data-step="3">
            <div className="counter-grid">
              {[
                ["adults", "Yetişkin", state.adults],
                ["children", "Çocuk", state.children],
                ["seats", "Bebek koltuğu", state.seats],
              ].map(([key, label, value]) => (
                <div key={key} className="counter glass-soft">
                  <span>{label}</span>
                  <div className="counter-row">
                    <button type="button" onClick={() => handleCounter(key, -1)}>
                      −
                    </button>
                    <strong>{value}</strong>
                    <button type="button" onClick={() => handleCounter(key, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`form-step ${state.step === 4 ? "active" : ""}`} data-step="4">
            <div className="counter-grid luggage-grid">
              {[
                ["largeBags", "Büyük valiz", state.largeBags],
                ["mediumBags", "Orta valiz", state.mediumBags],
                ["backpacks", "Sırt çantası", state.backpacks],
              ].map(([key, label, value]) => (
                <div key={key} className="counter glass-soft">
                  <span>{label}</span>
                  <div className="counter-row">
                    <button type="button" onClick={() => handleCounter(key, -1)}>
                      −
                    </button>
                    <strong>{value}</strong>
                    <button type="button" onClick={() => handleCounter(key, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <label className="toggle-row glass-soft">
              <span>Ekstra büyük eşya var mı?</span>
              <input
                type="checkbox"
                checked={state.oversize}
                onChange={(e) => setState((prev) => ({ ...prev, oversize: e.target.checked }))}
              />
            </label>
          </div>

          <div className={`form-step ${state.step === 5 ? "active" : ""}`} data-step="5">
            <label className="field budget-field">
              <span>Günlük bütçe: ₺{Number(state.budget || 0).toLocaleString("tr-TR")}</span>
              <input
                type="range"
                min="1200"
                max="5000"
                step="100"
                value={state.budget}
                onChange={(e) => setState((prev) => ({ ...prev, budget: Number(e.target.value) }))}
              />
            </label>
            <div className="field-grid two">
              <label className="field">
                <span>Minimum bütçe</span>
                <input
                  type="number"
                  min="1000"
                  max={state.budget}
                  step="100"
                  value={state.budgetMin}
                  onChange={(e) => setState((prev) => ({ ...prev, budgetMin: Number(e.target.value) }))}
                />
              </label>
              <label className="field">
                <span>Araç tipi tercihi</span>
                <select
                  value={state.vehiclePreference}
                  onChange={(e) => setState((prev) => ({ ...prev, vehiclePreference: e.target.value }))}
                >
                  <option value="any">Fark etmez</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="electric">Elektrikli / Hibrit</option>
                  <option value="automatic">Otomatik</option>
                  <option value="manual">Manuel</option>
                </select>
              </label>
              <label className="field">
                <span>Yakıt önceliği</span>
                <select
                  value={state.fuelPriority}
                  onChange={(e) => setState((prev) => ({ ...prev, fuelPriority: e.target.value }))}
                >
                  <option value="economic">Ekonomik</option>
                  <option value="balanced">Dengeli</option>
                  <option value="performance">Performanslı</option>
                </select>
              </label>
              <label className="field">
                <span>Konfor önceliği</span>
                <select
                  value={state.comfortPriority}
                  onChange={(e) => setState((prev) => ({ ...prev, comfortPriority: e.target.value }))}
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                </select>
              </label>
            </div>
            <div className="priority-grid">
              {[
                ["economy", "En ekonomik", "Düşük günlük ücret, düşük tüketim"],
                ["balanced", "Dengeli öneri", "Konfor ve ekonomi dengesi"],
                ["comfort", "Konfor odaklı", "Geniş iç hacim ve rahat sürüş"],
                ["performance", "Performans odaklı", "Motor gücü ve yol hakimiyeti"],
                ["family", "Aile dostu", "Kalabalık kullanım ve güvenlik"],
                ["outdoor", "Kamp / arazi", "Bagaj, çekiş ve dayanıklılık"],
              ].map(([value, title, text]) => (
                <button
                  key={value}
                  className={`priority-card ${state.priority === value ? "active" : ""}`}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, priority: value }))}
                >
                  <strong>{title}</strong>
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="planner-actions">
            <button
              className="secondary-btn"
              type="button"
              disabled={state.step === 1}
              style={{ opacity: state.step === 1 ? 0.5 : 1 }}
              onClick={() => setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }))}
            >
              Geri
            </button>
            <div className="action-meta">
              <span>Adım {state.step} / 5</span>
            </div>
            <button
              className="primary-btn"
              type="button"
              onClick={() =>
                state.step < 5
                  ? setState((prev) => ({ ...prev, step: prev.step + 1 }))
                  : handleAnalyze()
              }
            >
              {state.step === 5 ? "Analiz Et" : "Devam"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
