import { Link, NavLink } from "react-router-dom";

const navItems = [
  ["/", "Ana Sayfa"],
  ["/planner", "AI ile Araç Bul"],
  ["/vehicles", "Araçlar"],
  ["/analysis", "Analiz"],
  ["/campaigns", "Kampanyalar"],
  ["/offices", "Ofisler"],
  ["/services", "Hizmetler"],
  ["/admin", "Admin"],
];

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="TripAI ana sayfa">
        <span className="brand-mark">T</span>
        <span className="brand-text">
          <strong>TripAI</strong>
          <small>AI destekli araç öneri platformu</small>
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
          AI ile Araç Bul
        </Link>
      </div>
    </header>
  );
}
