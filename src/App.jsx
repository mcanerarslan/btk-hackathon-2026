import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { AdminLayout } from "./components/AdminLayout";
import { TripProvider } from "./TripContext";
import { HomePage } from "./pages/HomePage";
import { PlannerPage } from "./pages/PlannerPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { ComparePage } from "./pages/ComparePage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminCampaignFormPage, AdminCampaignsPage } from "./pages/AdminCampaignsPage";
import { AdminVehicleFormPage, AdminVehiclesPage } from "./pages/AdminVehiclesPage";
import { AdminSitePage } from "./pages/AdminSitePage";
import { AdminAiPage } from "./pages/AdminAiPage";

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
          <Route path="compare" element={<ComparePage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />
          <Route path="vehicles" element={<AdminVehiclesPage />} />
          <Route path="vehicles/arac-ekle" element={<AdminVehicleFormPage />} />
          <Route path="vehicles/:vehicleId/duzenle" element={<AdminVehicleFormPage />} />
          <Route path="campaigns" element={<AdminCampaignsPage />} />
          <Route path="campaigns/kampanya-ekle" element={<AdminCampaignFormPage />} />
          <Route path="campaigns/:campaignId/duzenle" element={<AdminCampaignFormPage />} />
          <Route path="site" element={<AdminSitePage />} />
          <Route path="ai" element={<AdminAiPage />} />
          <Route path="insights" element={<Navigate to="/admin/ai" replace />} />
        </Route>
      </Routes>
    </TripProvider>
  );
}

export default App;
