import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from '@/hooks/useI18n';
import { AppStateProvider, useAppState } from '@/hooks/useAppState';
import { AppShell } from '@/components/AppShell';

// Pages
import LanguageSelect from '@/pages/LanguageSelect';
import RoleSelect from '@/pages/RoleSelect';
import ElderSetup from '@/pages/ElderSetup';
import JoinHousehold from '@/pages/JoinHousehold';
import CaregiverHome from '@/pages/CaregiverHome';
import ContactHome from '@/pages/ContactHome';
import NewIncident from '@/pages/NewIncident';
import Assessment from '@/pages/Assessment';
import Copilot from '@/pages/Copilot';
import Timeline from '@/pages/Timeline';
import Trends from '@/pages/Trends';
import Notify from '@/pages/Notify';
import DailyLog from '@/pages/DailyLog';

function HomeRedirect() {
  const { role } = useAppState();
  if (role === 'contact') return <ContactHome />;
  return <CaregiverHome />;
}

function App() {
  return (
    <I18nProvider>
      <AppStateProvider>
        <div className="min-h-screen bg-background font-sans text-ink">
          <Routes>
            {/* Onboarding (no shell) */}
            <Route path="/" element={<LanguageSelect />} />
            <Route path="/role" element={<RoleSelect />} />
            <Route path="/setup" element={<ElderSetup />} />
            <Route path="/join" element={<JoinHousehold />} />

            {/* Main app (with shell) */}
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomeRedirect />} />
              <Route path="/incident" element={<NewIncident />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/trend" element={<Trends />} />
              <Route path="/notify" element={<Notify />} />
              <Route path="/daily-log" element={<DailyLog />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AppStateProvider>
    </I18nProvider>
  );
}

export default App;
