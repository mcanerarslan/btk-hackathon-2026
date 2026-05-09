import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AIWidget } from "./AIWidget";

export function SiteLayout() {
  return (
    <div>
      <div className="page-bg">
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="grid-overlay" />
      </div>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <AIWidget />
    </div>
  );
}
