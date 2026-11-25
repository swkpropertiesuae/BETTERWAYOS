import { useCallback, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth-context';
import { BrandSplashScreen } from './components/BrandSplashScreen';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { LauncherPage } from './pages/LauncherPage';
import { DashboardPage } from './pages/DashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { LeadsPage } from './pages/LeadsPage';
import { BanksDeskPage } from './pages/BanksDeskPage';
import { CalculatorsPage } from './pages/CalculatorsPage';
import { FinancePage } from './pages/FinancePage';
import { CompliancePage } from './pages/CompliancePage';
import { DataHubPage } from './pages/DataHubPage';
import { ReceptionQrPage } from './pages/ReceptionQrPage';
import { TeamPage } from './pages/TeamPage';
import { AiCopilotPage, AutomationsPage, InsidePage, PhonePage } from './pages/CoreSuitePages';
import { ClientPortalPage, MarketPulsePage, MobilePreviewPage, PartnerHubPage } from './pages/EcosystemPages';
import { ClientVaultPage, MyAssignedClientsPage, ShabibsCornerPage } from './pages/ShabibsCornerAndVaultPages';
import { CalendarPage, CommunicationsPage, FieldDutyPage, MyWorkPage } from './pages/ExecutionAndFieldPages';
import { HrWorkspacePage, UtilitiesSuitePage, WebsiteStudioPage, WordStudioPage } from './pages/UtilitiesAndStudioPages';

export default function App() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
      if (sessionStorage.getItem('bw.splash.shown') === '1') return false;
    } catch {
      /* ignore */
    }
    return true;
  });

  const handleSplashDone = useCallback(() => {
    try {
      sessionStorage.setItem('bw.splash.shown', '1');
    } catch {
      /* ignore */
    }
    setShowSplash(false);
  }, []);

  if (showSplash) return <BrandSplashScreen ready={!loading} onDone={handleSplashDone} />;
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#070E1A] text-white text-sm">
        Starting Betterway Mortgages OS…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: loc.pathname }} />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/home" replace />} />
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<LauncherPage />} />
        <Route path="/shabibs-corner" element={<ShabibsCornerPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/my-work" element={<MyWorkPage />} />
        <Route path="/my-cases" element={<MyAssignedClientsPage />} />
        <Route path="/vault" element={<ClientVaultPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/field-duty" element={<FieldDutyPage />} />
        <Route path="/communications" element={<CommunicationsPage />} />
        <Route path="/banks" element={<BanksDeskPage />} />
        <Route path="/calculators" element={<CalculatorsPage />} />
        <Route path="/word-studio" element={<WordStudioPage />} />
        <Route path="/utilities" element={<UtilitiesSuitePage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/data-hub" element={<DataHubPage />} />
        <Route path="/reception-qr" element={<ReceptionQrPage />} />
        <Route path="/hr" element={<HrWorkspacePage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/website-studio" element={<WebsiteStudioPage />} />
        <Route path="/inside" element={<InsidePage />} />
        <Route path="/automations" element={<AutomationsPage />} />
        <Route path="/phone" element={<PhonePage />} />
        <Route path="/ai" element={<AiCopilotPage />} />
        <Route path="/market" element={<MarketPulsePage />} />
        <Route path="/portal" element={<ClientPortalPage />} />
        <Route path="/partners" element={<PartnerHubPage />} />
        <Route path="/mobile-preview" element={<MobilePreviewPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
