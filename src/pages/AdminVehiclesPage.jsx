import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { buildVehicleSummary } from "../data";
import { useTrip } from "../TripContext";

const defaultVehicleForm = {
  name: "",
  segment: "",
  category: "economy",
  segmentTag: "suv",
  price: "",
  fuel: "Dizel",
  transmission: "Otomatik",
  consumption: "",
  luggage: "",
  seats: "5",
  comfort: "7",
  performance: "7",
  routeFit: "city,long,mixed",
  notes: "",
  emoji: "🚙",
  imageUrl: "",
  available: true,
};

function normalizeRouteFit(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toVehicleForm(vehicle) {
  return {
    name: vehicle.name || "",
    segment: vehicle.segment || "",
    category: vehicle.category || "economy",
    segmentTag: vehicle.segmentTag || "suv",
    price: String(vehicle.price ?? ""),
    fuel: vehicle.fuel || "Dizel",
    transmission: vehicle.transmission || "Otomatik",
    consumption: String(vehicle.consumption ?? ""),
    luggage: String(vehicle.luggage ?? ""),
    seats: String(vehicle.seats ?? "5"),
    comfort: String(vehicle.comfort ?? "7"),
    performance: String(vehicle.performance ?? "7"),
    routeFit: Array.isArray(vehicle.routeFit) ? vehicle.routeFit.join(",") : "city,long,mixed",
    notes: vehicle.notes || "",
    emoji: vehicle.emoji || "🚙",
    imageUrl: vehicle.imageUrl || "",
    available: vehicle.available !== false,
  };
}

export function AdminVehiclesPage() {
  const { vehicles, setVehicles, askGeminiForVehicleSummary } = useTrip();
  const [summaryLoadingId, setSummaryLoadingId] = useState("");
  const [summaryStatus, setSummaryStatus] = useState("");

  const handleDeleteVehicle = (vehicleId) => {
    const target = vehicles.find((vehicle) => vehicle.id === vehicleId);
    if (!target) return;
    const confirmed = window.confirm(`${target.name} kaydı silinsin mi?`);
    if (!confirmed) return;

    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== vehicleId));
  };

  const regenerateSummary = async (vehicle) => {
    setSummaryLoadingId(vehicle.id);
    setSummaryStatus(`${vehicle.name} için AI açıklaması isteniyor...`);
    try {
      const result = await askGeminiForVehicleSummary(vehicle);
      const summary = result.text;
      setVehicles((prev) =>
        prev.map((item) => (item.id === vehicle.id ? { ...item, aiSummary: summary || buildVehicleSummary(item) } : item)),
      );
      setSummaryStatus(
        result.source === "gemini"
          ? `${vehicle.name} için Gemini açıklaması üretildi.`
          : result.error === "short-gemini-summary"
            ? `${vehicle.name} için Gemini açıklaması kısa kaldı; detaylı yerel açıklama kullanıldı.`
          : `${vehicle.name} için Gemini yanıt vermedi; yerel açıklama kullanıldı${
              result.error ? ` (${result.error})` : ""
            }.`,
      );
    } catch (error) {
      setSummaryStatus(`${vehicle.name} için açıklama üretilemedi: ${error.message}`);
    } finally {
      setSummaryLoadingId("");
    }
  };

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">Araç yönetimi</span>
        <h2>Katalog kayıtlarını yönet</h2>
        <p>Yeni araç ekle, mevcut aracı düzenle ya da kaldır.</p>
        <div className="admin-page-header-actions">
          <Link className="primary-btn" to="/admin/vehicles/arac-ekle">
            Araç Ekle
          </Link>
        </div>
      </div>

      <div className="admin-list glass" style={{ marginTop: 18 }}>
        <div className="section-heading compact">
          <span className="eyebrow">Araçlar</span>
          <h3>Katalog listesi</h3>
          {summaryStatus ? <p>{summaryStatus}</p> : null}
        </div>

        <div className="admin-vehicle-table">
          <div className="admin-vehicle-table-head">
            <span>Görsel</span>
            <span>Araç</span>
            <span>Fiyat</span>
            <span>Teknik</span>
            <span>İşlemler</span>
          </div>
          {vehicles.map((vehicle) => (
            <article key={vehicle.id} className="admin-vehicle-row">
              <div className="admin-vehicle-thumb">
                {vehicle.imageUrl ? (
                  <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                  />
                ) : (
                  vehicle.emoji
                )}
              </div>
              <div className="admin-vehicle-title">
                <strong>{vehicle.name}</strong>
                <span>{vehicle.segment}</span>
                <p>{vehicle.aiSummary || buildVehicleSummary(vehicle)}</p>
              </div>
              <strong className="admin-vehicle-price">₺{Number(vehicle.price).toLocaleString("tr-TR")}/gün</strong>
              <div className="admin-vehicle-pills">
                <span>{vehicle.fuel}</span>
                <span>{vehicle.transmission || "Otomatik"}</span>
                <span>{vehicle.luggage} L</span>
                <span>{vehicle.seats} kişi</span>
                <span>{vehicle.available === false ? "Müsait değil" : "Müsait"}</span>
              </div>
              <div className="admin-card-actions">
                <Link className="secondary-btn" to={`/admin/vehicles/${vehicle.id}/duzenle`}>
                  Düzenle
                </Link>
                <button className="secondary-btn" type="button" onClick={() => regenerateSummary(vehicle)} disabled={summaryLoadingId === vehicle.id}>
                  {summaryLoadingId === vehicle.id ? "Gemini..." : "AI açıklaması üret"}
                </button>
                <button className="ghost-btn danger" type="button" onClick={() => handleDeleteVehicle(vehicle.id)}>
                  Sil
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}

export function AdminVehicleFormPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { vehicles, setVehicles } = useTrip();
  const editingVehicle = vehicleId ? vehicles.find((vehicle) => vehicle.id === vehicleId) : null;
  const isEditing = Boolean(vehicleId);
  const [vehicleForm, setVehicleForm] = useState(() => (editingVehicle ? toVehicleForm(editingVehicle) : defaultVehicleForm));
  const [imagePreview, setImagePreview] = useState(editingVehicle?.imageUrl || "");

  const isVehicleReady = useMemo(
    () => vehicleForm.name.trim().length > 0 && vehicleForm.segment.trim().length > 0 && vehicleForm.price !== "",
    [vehicleForm],
  );

  if (isEditing && !editingVehicle) {
    return <Navigate to="/admin/vehicles" replace />;
  }

  const handleVehicleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImagePreview(result);
      setVehicleForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleVehicleSubmit = (event) => {
    event.preventDefault();
    if (!isVehicleReady) return;

    const normalizedVehicle = {
      id: vehicleId || `admin-${Date.now()}`,
      name: vehicleForm.name.trim(),
      segment: vehicleForm.segment.trim(),
      category: vehicleForm.category,
      segmentTag: vehicleForm.segmentTag,
      price: Number(vehicleForm.price),
      fuel: vehicleForm.fuel.trim() || "Dizel",
      transmission: vehicleForm.transmission || "Otomatik",
      consumption: Number(vehicleForm.consumption) || 0,
      luggage: Number(vehicleForm.luggage) || 0,
      seats: Number(vehicleForm.seats) || 5,
      comfort: Number(vehicleForm.comfort) || 7,
      performance: Number(vehicleForm.performance) || 7,
      routeFit: normalizeRouteFit(vehicleForm.routeFit),
      notes: vehicleForm.notes.trim() || "Ek açıklama girilmedi.",
      emoji: vehicleForm.emoji.trim() || "🚙",
      imageUrl: vehicleForm.imageUrl.trim(),
      available: vehicleForm.available,
    };

    normalizedVehicle.aiSummary = buildVehicleSummary(normalizedVehicle);

    setVehicles((prev) => {
      if (isEditing) {
        return prev.map((vehicle) => (vehicle.id === vehicleId ? normalizedVehicle : vehicle));
      }

      return [normalizedVehicle, ...prev];
    });

    navigate("/admin/vehicles");
  };

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">{isEditing ? "Araç düzenle" : "Araç ekle"}</span>
        <h2>{isEditing ? `${editingVehicle.name} kaydını güncelle` : "Yeni araç kaydı"}</h2>
        <p>{isEditing ? "Değişiklikler katalog ve analiz sonuçlarına yansır." : "Yeni araç kaydedildikten sonra araç yönetimine dönülür."}</p>
        <div className="admin-page-header-actions">
          <Link className="secondary-btn" to="/admin/vehicles">
            Araç Yönetimine Dön
          </Link>
        </div>
      </div>

      <div className="admin-form glass">
        <form onSubmit={handleVehicleSubmit}>
          <div className="field-grid two">
            <label className="field">
              <span>Araç adı</span>
              <input
                type="text"
                value={vehicleForm.name}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Volkswagen Tiguan"
              />
            </label>
            <label className="field">
              <span>Segment</span>
              <input
                type="text"
                value={vehicleForm.segment}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, segment: e.target.value }))}
                placeholder="SUV"
              />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select
                value={vehicleForm.category}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, category: e.target.value }))}
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
                value={vehicleForm.segmentTag}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, segmentTag: e.target.value }))}
              >
                <option value="suv">SUV</option>
                <option value="family">Family</option>
                <option value="premium">Premium</option>
                <option value="outdoor">Outdoor</option>
                <option value="city">City</option>
              </select>
            </label>
            <label className="field">
              <span>Uygunluk durumu</span>
              <select
                value={vehicleForm.available ? "available" : "unavailable"}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, available: e.target.value === "available" }))}
              >
                <option value="available">Müsait</option>
                <option value="unavailable">Müsait değil</option>
              </select>
            </label>
            <label className="field">
              <span>Günlük fiyat</span>
              <input
                type="number"
                value={vehicleForm.price}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="2450"
              />
            </label>
            <label className="field">
              <span>Yakıt tipi</span>
              <input
                type="text"
                value={vehicleForm.fuel}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, fuel: e.target.value }))}
                placeholder="Dizel"
              />
            </label>
            <label className="field">
              <span>Vites</span>
              <select
                value={vehicleForm.transmission}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, transmission: e.target.value }))}
              >
                <option value="Otomatik">Otomatik</option>
                <option value="Manuel">Manuel</option>
              </select>
            </label>
            <label className="field">
              <span>Tüketim</span>
              <input
                type="number"
                step="0.1"
                value={vehicleForm.consumption}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, consumption: e.target.value }))}
                placeholder="5.9"
              />
            </label>
            <label className="field">
              <span>Bagaj (L)</span>
              <input
                type="number"
                value={vehicleForm.luggage}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, luggage: e.target.value }))}
                placeholder="520"
              />
            </label>
            <label className="field">
              <span>Kapasite</span>
              <input
                type="number"
                value={vehicleForm.seats}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, seats: e.target.value }))}
                placeholder="5"
              />
            </label>
            <label className="field">
              <span>Konfor</span>
              <input
                type="number"
                value={vehicleForm.comfort}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, comfort: e.target.value }))}
                placeholder="8"
              />
            </label>
            <label className="field">
              <span>Performans</span>
              <input
                type="number"
                value={vehicleForm.performance}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, performance: e.target.value }))}
                placeholder="8"
              />
            </label>
            <label className="field">
              <span>Emoji / ikon</span>
              <input
                type="text"
                value={vehicleForm.emoji}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, emoji: e.target.value }))}
                placeholder="🚙"
              />
            </label>
            <label className="field">
              <span>Rota etiketleri</span>
              <input
                type="text"
                value={vehicleForm.routeFit}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, routeFit: e.target.value }))}
                placeholder="city,long,mixed"
              />
            </label>
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span>Kısa açıklama</span>
            <textarea
              rows="4"
              value={vehicleForm.notes}
              onChange={(e) => setVehicleForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Bu araç hangi kullanım için uygun?"
            />
          </label>

          <div className="field-grid two" style={{ marginTop: 16 }}>
            <label className="field">
              <span>Görsel URL</span>
              <input
                type="url"
                value={vehicleForm.imageUrl}
                onChange={(e) => setVehicleForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label className="field">
              <span>Görsel yükle</span>
              <input type="file" accept="image/*" onChange={(e) => handleVehicleFile(e.target.files?.[0])} />
            </label>
          </div>

          {(imagePreview || vehicleForm.imageUrl) && (
            <div className="admin-preview glass-soft">
              <span>Önizleme</span>
              <div className="admin-image-preview">
                <img
                  src={imagePreview || vehicleForm.imageUrl}
                  alt={vehicleForm.name || "Araç önizleme"}
                />
              </div>
            </div>
          )}

          <div className="planner-actions admin-actions">
            <div className="action-meta">
              <span>{isEditing ? "Güncelleme sonrası araç yönetimine dönülür." : "Kayıt sonrası araç yönetimine dönülür."}</span>
            </div>
            <div className="admin-button-row">
              <Link className="secondary-btn" to="/admin/vehicles">
                İptal
              </Link>
              <button className="primary-btn" type="submit" disabled={!isVehicleReady} style={{ opacity: isVehicleReady ? 1 : 0.5 }}>
                {isEditing ? "Güncelle" : "Aracı Kaydet"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
