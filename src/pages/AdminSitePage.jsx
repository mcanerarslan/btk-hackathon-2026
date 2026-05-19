import { useEffect, useState } from "react";
import { useTrip } from "../TripContext";

const defaultSiteForm = {
  siteName: "",
  logoText: "",
  logoUrl: "",
  faviconUrl: "",
  headerTitle: "",
  headerSubtitle: "",
  footerText: "",
  footerNote: "",
  footerLegal: "",
};

function toSiteForm(siteSettings) {
  return {
    siteName: siteSettings.siteName || "",
    logoText: siteSettings.logoText || "",
    logoUrl: siteSettings.logoUrl || "",
    faviconUrl: siteSettings.faviconUrl || "",
    headerTitle: siteSettings.headerTitle || "",
    headerSubtitle: siteSettings.headerSubtitle || "",
    footerText: siteSettings.footerText || "",
    footerNote: siteSettings.footerNote || "",
    footerLegal: siteSettings.footerLegal || "",
  };
}

export function AdminSitePage() {
  const { siteSettings, updateSiteSettings, defaultSiteSettings } = useTrip();
  const [siteForm, setSiteForm] = useState(defaultSiteForm);
  const [siteLogoPreview, setSiteLogoPreview] = useState("");
  const [siteFaviconPreview, setSiteFaviconPreview] = useState("");

  useEffect(() => {
    setSiteForm(toSiteForm(siteSettings));
    setSiteLogoPreview(siteSettings.logoUrl || "");
    setSiteFaviconPreview(siteSettings.faviconUrl || "");
  }, [siteSettings]);

  const handleBrandFile = (file, target) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (target === "logo") {
        setSiteLogoPreview(result);
        setSiteForm((prev) => ({ ...prev, logoUrl: result }));
      }
      if (target === "favicon") {
        setSiteFaviconPreview(result);
        setSiteForm((prev) => ({ ...prev, faviconUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSiteSubmit = (event) => {
    event.preventDefault();
    updateSiteSettings({
      siteName: siteForm.siteName.trim() || defaultSiteSettings.siteName,
      logoText: siteForm.logoText.trim() || defaultSiteSettings.logoText,
      logoUrl: siteForm.logoUrl.trim(),
      faviconUrl: siteForm.faviconUrl.trim(),
      headerTitle: siteForm.headerTitle.trim() || defaultSiteSettings.headerTitle,
      headerSubtitle: siteForm.headerSubtitle.trim() || defaultSiteSettings.headerSubtitle,
      footerText: siteForm.footerText.trim() || defaultSiteSettings.footerText,
      footerNote: siteForm.footerNote.trim() || defaultSiteSettings.footerNote,
      footerLegal: siteForm.footerLegal.trim() || defaultSiteSettings.footerLegal,
    });
  };

  const resetSiteForm = () => {
    setSiteForm(toSiteForm(defaultSiteSettings));
    setSiteLogoPreview(defaultSiteSettings.logoUrl || "");
    setSiteFaviconPreview(defaultSiteSettings.faviconUrl || "");
    updateSiteSettings(defaultSiteSettings);
  };

  const headerLogo = siteForm.logoUrl.trim() || siteLogoPreview;
  const faviconPreview = siteForm.faviconUrl.trim() || siteFaviconPreview;
  const faviconLabel = siteForm.logoText.trim() || siteForm.siteName.trim() || "T";

  return (
    <>
      <div className="section-heading admin-page-header">
        <span className="eyebrow">Site ayarları</span>
        <h2>Header ve footer içeriğini yönet</h2>
        <p>Logo, favicon ve marka metinleri bu sayfadan ayrı olarak düzenlenir.</p>
      </div>

      <form className="admin-form glass" onSubmit={handleSiteSubmit}>
        <div className="field-grid two">
          <label className="field">
            <span>Site adı</span>
            <input
              type="text"
              value={siteForm.siteName}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, siteName: e.target.value }))}
              placeholder="TripAI"
            />
          </label>
          <label className="field">
            <span>Logo kısa metni</span>
            <input
              type="text"
              value={siteForm.logoText}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, logoText: e.target.value }))}
              placeholder="T"
            />
          </label>
          <label className="field">
            <span>Header başlığı</span>
            <input
              type="text"
              value={siteForm.headerTitle}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, headerTitle: e.target.value }))}
              placeholder="TripAI"
            />
          </label>
          <label className="field">
            <span>Header alt metni</span>
            <input
              type="text"
              value={siteForm.headerSubtitle}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, headerSubtitle: e.target.value }))}
              placeholder="AI destekli araç öneri platformu"
            />
          </label>
          <label className="field">
            <span>Footer metni</span>
            <input
              type="text"
              value={siteForm.footerText}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, footerText: e.target.value }))}
              placeholder="AI destekli araç öneri ve seyahat planlama platformu."
            />
          </label>
          <label className="field">
            <span>Footer notu</span>
            <input
              type="text"
              value={siteForm.footerNote}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, footerNote: e.target.value }))}
              placeholder="Demo panel · login gerekmez"
            />
          </label>
          <label className="field">
            <span>Yasal metin</span>
            <input
              type="text"
              value={siteForm.footerLegal}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, footerLegal: e.target.value }))}
              placeholder="KVKK · Gizlilik · Kullanım Şartları"
            />
          </label>
          <label className="field">
            <span>Logo görsel URL</span>
            <input
              type="url"
              value={siteForm.logoUrl}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="field-grid two">
          <label className="field">
            <span>Logo yükle</span>
            <input type="file" accept="image/*" onChange={(e) => handleBrandFile(e.target.files?.[0], "logo")} />
          </label>
          <label className="field">
            <span>Favicon görsel URL</span>
            <input
              type="url"
              value={siteForm.faviconUrl}
              onChange={(e) => setSiteForm((prev) => ({ ...prev, faviconUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label className="field">
            <span>Favicon yükle</span>
            <input type="file" accept="image/*" onChange={(e) => handleBrandFile(e.target.files?.[0], "favicon")} />
          </label>
        </div>

        <div className="admin-preview glass-soft">
          <span>Canlı önizleme</span>
          <div className="admin-brand-preview">
            <div className="admin-brand-card">
              <div className="brand-mark brand-mark-preview">
                {headerLogo ? <img src={headerLogo} alt="" className="brand-image" /> : faviconLabel}
              </div>
              <div>
                <strong>{siteForm.headerTitle || "TripAI"}</strong>
                <p>{siteForm.headerSubtitle || "AI destekli araç öneri platformu"}</p>
              </div>
            </div>
            <div className="admin-footer-preview">
              <strong>{siteForm.siteName || "TripAI"}</strong>
              <p>{siteForm.footerText || "AI destekli araç öneri ve seyahat planlama platformu."}</p>
              <span>{siteForm.footerLegal || "KVKK · Gizlilik · Kullanım Şartları"}</span>
              <span>{siteForm.footerNote || "Demo panel · login gerekmez"}</span>
              <span className="admin-favicon-preview">Favicon: {faviconPreview ? "yüklenmiş" : "varsayılan"}</span>
            </div>
          </div>
        </div>

        <div className="planner-actions admin-actions">
          <button className="secondary-btn" type="button" onClick={resetSiteForm}>
            Varsayılana dön
          </button>
          <button className="primary-btn" type="submit">
            Değişiklikleri Kaydet
          </button>
        </div>
      </form>
    </>
  );
}
