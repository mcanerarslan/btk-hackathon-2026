import { useMemo, useState } from "react";
import { buildVehicleSummary } from "../data";
import { useTrip } from "../TripContext";

const adminStats = [
  ["Aktif araç", "128"],
  ["Bu hafta talep", "342"],
  ["AI eşleşme oranı", "%92"],
  ["Riskli rota uyarısı", "14"],
];

const defaultForm = {
  name: "",
  segment: "",
  category: "economy",
  segmentTag: "suv",
  price: "",
  fuel: "Dizel",
  consumption: "",
  luggage: "",
  seats: "5",
  comfort: "7",
  performance: "7",
  routeFit: "city,long,mixed",
  notes: "",
  emoji: "🚙",
  imageUrl: "",
};

export function AdminPage() {
  const { ranked, state, vehicles, setVehicles } = useTrip();
  const [authMode, setAuthMode] = useState("open");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [imagePreview, setImagePreview] = useState("");

  const shouldGate = authMode === "password";

  const isReady = useMemo(
    () => form.name.trim().length > 0 && form.segment.trim().length > 0 && form.price !== "",
    [form],
  );

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImagePreview(result);
      setForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddVehicle = (event) => {
    event.preventDefault();
    if (!isReady) return;

    const newVehicle = {
      id: `admin-${Date.now()}`,
      name: form.name.trim(),
      segment: form.segment.trim(),
      category: form.category,
      segmentTag: form.segmentTag,
      price: Number(form.price),
      fuel: form.fuel.trim(),
      consumption: Number(form.consumption) || 0,
      luggage: Number(form.luggage) || 0,
      seats: Number(form.seats) || 5,
      comfort: Number(form.comfort) || 7,
      performance: Number(form.performance) || 7,
      routeFit: form.routeFit
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: form.notes.trim() || "Ek açıklama girilmedi.",
      emoji: form.emoji.trim() || "🚙",
      imageUrl: form.imageUrl.trim(),
    };
    newVehicle.aiSummary = buildVehicleSummary(newVehicle);

    setVehicles((prev) => [newVehicle, ...prev]);
    setForm(defaultForm);
    setImagePreview("");
  };

  return (
    <section className="section reveal">
      <div className="section-heading">
        <span className="eyebrow">Admin panel</span>
        <h2>Başlangıçta açık, sonra şifreli kullanıma geçirilebilir.</h2>
        <p>
          Şu an panel doğrudan görüntüleniyor. İstersen aşağıdan şifreli moda geçip giriş
          mantığını aktif edebilirsin.
        </p>
      </div>

      <div className="planner-shell glass">
        <div className="planner-top">
          <div className="planner-hint" style={{ width: "auto" }}>
            <strong>Panel modu</strong>
            <span>İlk aşama açık erişim, sonra login koruması.</span>
          </div>
          <div className="chip-row">
            <button
              className={`chip ${authMode === "open" ? "active" : ""}`}
              type="button"
              onClick={() => setAuthMode("open")}
            >
              Açık görüntüleme
            </button>
            <button
              className={`chip ${authMode === "password" ? "active" : ""}`}
              type="button"
              onClick={() => setAuthMode("password")}
            >
              Şifreli giriş
            </button>
          </div>
        </div>

        {shouldGate && !isAuthed ? (
          <div className="analysis-shell">
            <div className="analysis-track glass">
              <div className="analysis-steps">
                <div className="analysis-step active">Admin giriş gerekli</div>
                <div className="analysis-step">Şifreyi gir ve devam et</div>
              </div>
            </div>
            <div className="analysis-map glass">
              <div className="analysis-map-header">
                <strong>Şifreli panel</strong>
                <span>Demo erişim</span>
              </div>
              <div className="widget-input" style={{ marginTop: 18 }}>
                <input
                  type="password"
                  placeholder="Admin şifresi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="primary-btn"
                  type="button"
                  onClick={() => {
                    if (password.trim()) setIsAuthed(true);
                  }}
                >
                  Giriş
                </button>
              </div>
              <div className="analysis-snippet">
                İpucu: demo şifreyi istediğin zaman bağlayabiliriz.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="hero-stats">
              {adminStats.map(([label, value]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="admin-grid">
              <form className="admin-form glass" onSubmit={handleAddVehicle}>
                <div className="section-heading" style={{ marginBottom: 14 }}>
                  <span className="eyebrow">Araç ekle</span>
                  <h3 style={{ margin: 0 }}>Yeni araç kaydı</h3>
                </div>

                <div className="field-grid two">
                  <label className="field">
                    <span>Araç adı</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Volkswagen Tiguan"
                    />
                  </label>
                  <label className="field">
                    <span>Segment</span>
                    <input
                      type="text"
                      value={form.segment}
                      onChange={(e) => setForm((prev) => ({ ...prev, segment: e.target.value }))}
                      placeholder="SUV"
                    />
                  </label>
                  <label className="field">
                    <span>Kategori</span>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="economy">Ekonomik</option>
                      <option value="balanced">Dengeli</option>
                      <option value="family">Aile</option>
                      <option value="premium">Premium</option>
                      <option value="outdoor">Outdoor</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Segment etiketi</span>
                    <select
                      value={form.segmentTag}
                      onChange={(e) => setForm((prev) => ({ ...prev, segmentTag: e.target.value }))}
                    >
                      <option value="suv">SUV</option>
                      <option value="family">Family</option>
                      <option value="premium">Premium</option>
                      <option value="outdoor">Outdoor</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Günlük fiyat</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="2450"
                    />
                  </label>
                  <label className="field">
                    <span>Yakıt tipi</span>
                    <input
                      type="text"
                      value={form.fuel}
                      onChange={(e) => setForm((prev) => ({ ...prev, fuel: e.target.value }))}
                      placeholder="Dizel"
                    />
                  </label>
                  <label className="field">
                    <span>Tüketim</span>
                    <input
                      type="number"
                      step="0.1"
                      value={form.consumption}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, consumption: e.target.value }))
                      }
                      placeholder="5.9"
                    />
                  </label>
                  <label className="field">
                    <span>Bagaj (L)</span>
                    <input
                      type="number"
                      value={form.luggage}
                      onChange={(e) => setForm((prev) => ({ ...prev, luggage: e.target.value }))}
                      placeholder="520"
                    />
                  </label>
                  <label className="field">
                    <span>Kapasite</span>
                    <input
                      type="number"
                      value={form.seats}
                      onChange={(e) => setForm((prev) => ({ ...prev, seats: e.target.value }))}
                      placeholder="5"
                    />
                  </label>
                  <label className="field">
                    <span>Konfor</span>
                    <input
                      type="number"
                      value={form.comfort}
                      onChange={(e) => setForm((prev) => ({ ...prev, comfort: e.target.value }))}
                      placeholder="8"
                    />
                  </label>
                  <label className="field">
                    <span>Performans</span>
                    <input
                      type="number"
                      value={form.performance}
                      onChange={(e) => setForm((prev) => ({ ...prev, performance: e.target.value }))}
                      placeholder="8"
                    />
                  </label>
                  <label className="field">
                    <span>Emoji / ikon</span>
                    <input
                      type="text"
                      value={form.emoji}
                      onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
                      placeholder="🚙"
                    />
                  </label>
                  <label className="field">
                    <span>Rota etiketleri</span>
                    <input
                      type="text"
                      value={form.routeFit}
                      onChange={(e) => setForm((prev) => ({ ...prev, routeFit: e.target.value }))}
                      placeholder="city,long,mixed"
                    />
                  </label>
                </div>

                <label className="field" style={{ marginTop: 16 }}>
                  <span>Kısa açıklama</span>
                  <textarea
                    rows="4"
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Bu araç hangi kullanım için uygun?"
                  />
                </label>

                <div className="field-grid two" style={{ marginTop: 16 }}>
                  <label className="field">
                    <span>Görsel URL</span>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="field">
                    <span>Görsel yükle</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </label>
                </div>

                {(imagePreview || form.imageUrl) && (
                  <div className="admin-preview glass-soft">
                    <span>Önizleme</span>
                    <div className="vehicle-visual" style={{ marginTop: 12 }}>
                      <img
                        src={imagePreview || form.imageUrl}
                        alt={form.name || "Araç önizleme"}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 20 }}
                      />
                    </div>
                  </div>
                )}

                <div className="planner-actions" style={{ marginTop: 18 }}>
                  <div className="action-meta">
                    <span>Yeni araç katalog ve analiz sayfasına eklenecek.</span>
                  </div>
                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={!isReady}
                    style={{ opacity: isReady ? 1 : 0.5 }}
                  >
                    Aracı Kaydet
                  </button>
                </div>
              </form>

              <div className="admin-list glass">
                <div className="section-heading" style={{ marginBottom: 14 }}>
                  <span className="eyebrow">Mevcut araçlar</span>
                  <h3 style={{ margin: 0 }}>Katalog listesi</h3>
                </div>
            <div className="vehicle-grid admin-vehicle-list">
                  {vehicles.map((vehicle) => (
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
                      <p className="details">{vehicle.aiSummary || buildVehicleSummary(vehicle)}</p>
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
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="analysis-shell" style={{ marginTop: 18 }}>
              <div className="analysis-track glass">
                <div className="analysis-steps">
                  <div className="analysis-step active">Son analizler</div>
                  <div className="analysis-step">Popüler rota talepleri</div>
                  <div className="analysis-step">Riskli seçimler</div>
                  <div className="analysis-step">Araç envanteri</div>
                </div>
              </div>
              <div className="analysis-map glass">
                <div className="analysis-map-header">
                  <strong>Öneri özeti</strong>
                  <span>
                    {state.fromCity} → {state.toCity}
                  </span>
                </div>
                <div className="analysis-snippet">
                  En üst eşleşme: {ranked[0]?.vehicle.name}. Açık panelde bu veriyi yönetim
                  ekranında izleyebilir, sonra şifreli moda geçebilirsin.
                </div>
              </div>
            </div>

            <div className="vehicle-grid" style={{ marginTop: 18 }}>
              {vehicles.slice(0, 3).map((vehicle) => (
                <article key={vehicle.id} className="vehicle-card">
                  <div className="badge">{vehicle.category}</div>
                  <h3>{vehicle.name}</h3>
                  <p className="details">{vehicle.aiSummary || buildVehicleSummary(vehicle)}</p>
                  <div className="vehicle-specs">
                    <div className="metric-row">
                      <span>Fiyat</span>
                      <strong>₺{vehicle.price}/gün</strong>
                    </div>
                    <div className="metric-row">
                      <span>Durum</span>
                      <strong>Aktif</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
