import { Link } from "react-router-dom";
import { useTrip } from "../TripContext";

export function Footer() {
  const { siteSettings } = useTrip();
  const logoLabel = siteSettings.logoText?.trim() || siteSettings.siteName?.trim()?.slice(0, 1) || "R";

  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="brand-mark">
          {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} alt="" className="brand-image" /> : logoLabel}
        </span>
        <div>
          <strong>{siteSettings.siteName}</strong>
          <p>{siteSettings.footerText}</p>
        </div>
      </div>
      <div className="footer-links">
        <Link to="/">Ana Sayfa</Link>
        <Link to="/vehicles">Filo</Link>
        <Link to="/planner">Akıllı Öneri</Link>
        <Link to="/campaigns">Fırsatlar</Link>
        <Link to="/admin">Yönetim</Link>
      </div>
      <div className="footer-meta">
        <span>{siteSettings.footerLegal}</span>
        <span>{siteSettings.footerNote}</span>
      </div>
    </footer>
  );
}
