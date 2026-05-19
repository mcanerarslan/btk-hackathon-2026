import { Link, NavLink } from "react-router-dom";
import { useTrip } from "../TripContext";

const navItems = [
  ["/", "Ana Sayfa"],
  ["/vehicles", "Filo"],
  ["/planner", "Akıllı Öneri"],
  ["/analysis", "Rota Analizi"],
  ["/compare", "Karşılaştır"],
  ["/campaigns", "Fırsatlar"],
  ["/admin", "Yönetim"],
];

export function Header() {
  const { siteSettings } = useTrip();
  const logoLabel = siteSettings.logoText?.trim() || siteSettings.siteName?.trim()?.slice(0, 1) || "R";

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label={`${siteSettings.siteName} ana sayfa`}>
        <span className="brand-mark">
          {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} alt="" className="brand-image" /> : logoLabel}
        </span>
        <span className="brand-text">
          <strong>{siteSettings.headerTitle}</strong>
          <small>{siteSettings.headerSubtitle}</small>
        </span>
      </Link>
      <nav className="main-nav" aria-label="Ana menü">
        {navItems.map(([to, label]) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active-link" : "")}>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="header-actions">
        <button className="ghost-btn" type="button">
          TR
        </button>
        <Link className="primary-btn" to="/planner">
          Uzmanla Seç
        </Link>
      </div>
    </header>
  );
}
