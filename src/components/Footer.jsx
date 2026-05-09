import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="brand-mark">T</span>
        <div>
          <strong>TripAI</strong>
          <p>AI destekli araç öneri ve seyahat planlama platformu.</p>
        </div>
      </div>
      <div className="footer-links">
        <Link to="/">Ana Sayfa</Link>
        <Link to="/vehicles">Araçlar</Link>
        <Link to="/planner">AI ile Araç Bul</Link>
        <Link to="/campaigns">Kampanyalar</Link>
        <Link to="/offices">Ofisler</Link>
        <Link to="/admin">Admin</Link>
      </div>
      <div className="footer-meta">
        <span>KVKK · Gizlilik · Kullanım Şartları</span>
        <span>Mock demo · Login gerekmez</span>
      </div>
    </footer>
  );
}
