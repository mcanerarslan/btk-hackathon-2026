import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useTrip } from "../TripContext";

const defaultCampaignForm = {
  title: "",
  headline: "",
  description: "",
  discount: "",
  category: "city",
  audience: "",
  startDate: "",
  endDate: "",
  status: "active",
  code: "",
};

function toCampaignForm(campaign) {
  return {
    title: campaign.title || "",
    headline: campaign.headline || "",
    description: campaign.description || "",
    discount: String(campaign.discount ?? ""),
    category: campaign.category || "city",
    audience: campaign.audience || "",
    startDate: campaign.startDate || "",
    endDate: campaign.endDate || "",
    status: campaign.status || "active",
    code: campaign.code || "",
  };
}

function formatDate(value) {
  if (!value) return "Tarih yok";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export function AdminCampaignsPage() {
  const { campaigns, setCampaigns } = useTrip();

  const handleDeleteCampaign = (campaignId) => {
    const target = campaigns.find((campaign) => campaign.id === campaignId);
    if (!target) return;
    const confirmed = window.confirm(`${target.title} kampanyası silinsin mi?`);
    if (!confirmed) return;

    setCampaigns((prev) => prev.filter((campaign) => campaign.id !== campaignId));
  };

  const toggleCampaignStatus = (campaignId) => {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === campaignId
          ? { ...campaign, status: campaign.status === "active" ? "passive" : "active" }
          : campaign,
      ),
    );
  };

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">Kampanya yönetimi</span>
        <h2>Kampanyaları oluştur ve yayınla</h2>
        <p>Fırsat kartlarını ekle, düzenle, pasife al ya da yayından kaldır.</p>
        <div className="admin-page-header-actions">
          <Link className="primary-btn" to="/admin/campaigns/kampanya-ekle">
            Kampanya Ekle
          </Link>
        </div>
      </div>

      <div className="admin-list glass" style={{ marginTop: 18 }}>
        <div className="section-heading compact">
          <span className="eyebrow">Kampanyalar</span>
          <h3>Yayın listesi</h3>
        </div>

        <div className="admin-campaign-table">
          <div className="admin-campaign-table-head">
            <span>Kampanya</span>
            <span>İndirim</span>
            <span>Tarih</span>
            <span>Durum</span>
            <span>İşlemler</span>
          </div>
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="admin-campaign-row">
              <div className="admin-vehicle-title">
                <strong>{campaign.title}</strong>
                <span>{campaign.category}</span>
                <p>{campaign.headline}</p>
              </div>
              <strong className="admin-vehicle-price">
                {campaign.discount ? `%${campaign.discount}` : "Özel"}
              </strong>
              <div className="admin-campaign-date">
                <span>{formatDate(campaign.startDate)}</span>
                <span>{formatDate(campaign.endDate)}</span>
              </div>
              <span className={`admin-badge ${campaign.status === "active" ? "success" : "warning"}`}>
                {campaign.status === "active" ? "Yayında" : "Pasif"}
              </span>
              <div className="admin-card-actions">
                <Link className="secondary-btn" to={`/admin/campaigns/${campaign.id}/duzenle`}>
                  Düzenle
                </Link>
                <button className="secondary-btn" type="button" onClick={() => toggleCampaignStatus(campaign.id)}>
                  {campaign.status === "active" ? "Pasife Al" : "Yayınla"}
                </button>
                <button className="ghost-btn danger" type="button" onClick={() => handleDeleteCampaign(campaign.id)}>
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

export function AdminCampaignFormPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { campaigns, setCampaigns } = useTrip();
  const editingCampaign = campaignId ? campaigns.find((campaign) => campaign.id === campaignId) : null;
  const isEditing = Boolean(campaignId);
  const [campaignForm, setCampaignForm] = useState(() =>
    editingCampaign ? toCampaignForm(editingCampaign) : defaultCampaignForm,
  );

  const isCampaignReady = useMemo(
    () =>
      campaignForm.title.trim().length > 0 &&
      campaignForm.headline.trim().length > 0 &&
      campaignForm.description.trim().length > 0,
    [campaignForm],
  );

  if (isEditing && !editingCampaign) {
    return <Navigate to="/admin/campaigns" replace />;
  }

  const handleCampaignSubmit = (event) => {
    event.preventDefault();
    if (!isCampaignReady) return;

    const normalizedCampaign = {
      id: campaignId || `campaign-${Date.now()}`,
      title: campaignForm.title.trim(),
      headline: campaignForm.headline.trim(),
      description: campaignForm.description.trim(),
      discount: Number(campaignForm.discount) || 0,
      category: campaignForm.category,
      audience: campaignForm.audience.trim() || "Genel kitle",
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      status: campaignForm.status,
      code: campaignForm.code.trim().toUpperCase(),
    };

    setCampaigns((prev) => {
      if (isEditing) {
        return prev.map((campaign) => (campaign.id === campaignId ? normalizedCampaign : campaign));
      }

      return [normalizedCampaign, ...prev];
    });

    navigate("/admin/campaigns");
  };

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">{isEditing ? "Kampanya düzenle" : "Kampanya ekle"}</span>
        <h2>{isEditing ? `${editingCampaign.title} kaydını güncelle` : "Yeni kampanya kaydı"}</h2>
        <p>Kayıtlar kullanıcı tarafındaki kampanyalar sayfasına anında yansır.</p>
        <div className="admin-page-header-actions">
          <Link className="secondary-btn" to="/admin/campaigns">
            Kampanya Yönetimine Dön
          </Link>
        </div>
      </div>

      <div className="admin-form glass">
        <form onSubmit={handleCampaignSubmit}>
          <div className="field-grid two">
            <label className="field">
              <span>Kampanya adı</span>
              <input
                type="text"
                value={campaignForm.title}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Yaz rotaları"
              />
            </label>
            <label className="field">
              <span>Başlık</span>
              <input
                type="text"
                value={campaignForm.headline}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, headline: e.target.value }))}
                placeholder="%20 indirimli SUV seçkisi"
              />
            </label>
            <label className="field">
              <span>İndirim oranı</span>
              <input
                type="number"
                value={campaignForm.discount}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, discount: e.target.value }))}
                placeholder="20"
              />
            </label>
            <label className="field">
              <span>Kampanya kodu</span>
              <input
                type="text"
                value={campaignForm.code}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="YAZ20"
              />
            </label>
            <label className="field">
              <span>Kategori</span>
              <select
                value={campaignForm.category}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="city">Şehir içi</option>
                <option value="suv">SUV</option>
                <option value="family">Aile</option>
                <option value="premium">Premium</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </label>
            <label className="field">
              <span>Hedef kitle</span>
              <input
                type="text"
                value={campaignForm.audience}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="Aile ve uzun yol"
              />
            </label>
            <label className="field">
              <span>Başlangıç tarihi</span>
              <input
                type="date"
                value={campaignForm.startDate}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Bitiş tarihi</span>
              <input
                type="date"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </label>
            <label className="field">
              <span>Durum</span>
              <select
                value={campaignForm.status}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Yayında</option>
                <option value="passive">Pasif</option>
              </select>
            </label>
          </div>

          <label className="field" style={{ marginTop: 16 }}>
            <span>Açıklama</span>
            <textarea
              rows="4"
              value={campaignForm.description}
              onChange={(e) => setCampaignForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Kampanya kullanıcıya nasıl anlatılacak?"
            />
          </label>

          <div className="admin-preview glass-soft">
            <span>Önizleme</span>
            <article className="promo-card glass admin-campaign-preview">
              <span>{campaignForm.title || "Kampanya adı"}</span>
              <strong>{campaignForm.headline || "Kampanya başlığı"}</strong>
              <p>{campaignForm.description || "Kısa açıklama"}</p>
              <small>
                {campaignForm.code ? `${campaignForm.code.toUpperCase()} kodu` : campaignForm.audience || "Hedef kitle"}
                {campaignForm.discount ? ` · %${campaignForm.discount}` : ""}
              </small>
            </article>
          </div>

          <div className="planner-actions admin-actions">
            <div className="action-meta">
              <span>{isEditing ? "Güncelleme sonrası kampanya yönetimine dönülür." : "Kayıt sonrası kampanya yönetimine dönülür."}</span>
            </div>
            <div className="admin-button-row">
              <Link className="secondary-btn" to="/admin/campaigns">
                İptal
              </Link>
              <button className="primary-btn" type="submit" disabled={!isCampaignReady} style={{ opacity: isCampaignReady ? 1 : 0.5 }}>
                {isEditing ? "Güncelle" : "Kampanyayı Kaydet"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
