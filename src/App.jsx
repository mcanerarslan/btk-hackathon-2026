import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { TripProvider } from "./TripContext";
import { HomePage } from "./pages/HomePage";
import { PlannerPage } from "./pages/PlannerPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { OfficesPage } from "./pages/OfficesPage";
import { ServicesPage } from "./pages/ServicesPage";
import { AdminPage } from "./pages/AdminPage";

function App() {
  return (
    <TripProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="vehicles/:vehicleId" element={<VehicleDetailPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="offices" element={<OfficesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </TripProvider>
  );
}

export default App;
