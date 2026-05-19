import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useTrip } from "../TripContext";

const adminNavItems = [
  ["/admin", "Özet"],
  ["/admin/vehicles", "Araç Yönetimi"],
  ["/admin/campaigns", "Kampanyalar"],
  ["/admin/site", "Site Ayarları"],
  ["/admin/ai", "Gemini Uzman"],
];

export function AdminLayout() {
  const { siteSettings } = useTrip();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`admin-page${sidebarOpen ? " drawer-open" : ""}`}>
      <div className="admin-page-bg">
        <div className="ambient-band ambient-band-one" />
        <div className="ambient-band ambient-band-two" />
        <div className="grid-overlay" />
      </div>

      <aside className={`admin-sidebar glass${sidebarOpen ? " is-open" : ""}`}>
        <div className="admin-sidebar-head">
          <div className="admin-sidebar-brand">
            <span className="brand-mark brand-mark-preview">
              {siteSettings.logoUrl ? (
                <img src={siteSettings.logoUrl} alt="" className="brand-image" />
              ) : (
                siteSettings.logoText?.trim() || siteSettings.siteName?.trim()?.slice(0, 1) || "D"
              )}
            </span>
            <div className="admin-sidebar-brand-copy">
              <strong>{siteSettings.siteName}</strong>
              <p>Operasyon paneli</p>
            </div>
          </div>

          <button
            className="admin-sidebar-close"
            type="button"
            aria-label="Admin menüyü kapat"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="admin-nav" aria-label="Admin menü">
          {adminNavItems.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"}
              className={({ isActive }) => `admin-nav-link${isActive ? " active" : ""}`}
              title={label}
            >
              <span className="admin-nav-link-label">{label}</span>
            </NavLink>
          ))}
          </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-toggle-btn" type="button" onClick={() => setSidebarOpen(false)}>
            Menüyü gizle
          </button>
          <Link className="admin-back-btn" to="/">
            Siteye dön
          </Link>
        </div>
      </aside>

      <main className="admin-shell">
          <div className="admin-workspace">
            <section className="admin-workspace-main">
              <Outlet />
            </section>
          </div>
      </main>
    </div>
  );
}
