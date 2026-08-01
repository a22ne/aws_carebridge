import { Routes, Route, Navigate } from 'react-router-dom';
import { I18nProvider } from '@/hooks/useI18n';
import { AppStateProvider, useAppState } from '@/hooks/useAppState';
import { AppShell } from '@/components/AppShell';

// Onboarding pages
import LanguageSelect from '@/pages/LanguageSelect';
import RoleSelect from '@/pages/RoleSelect';
import CaregiverProfile from '@/pages/CaregiverProfile';
import ContactProfile from '@/pages/ContactProfile';
import ContactChoice from '@/pages/ContactChoice';
import ElderSetup from '@/pages/ElderSetup';
import JoinHousehold from '@/pages/JoinHousehold';

// Main pages
import CaregiverHome from '@/pages/CaregiverHome';
import ContactHome from '@/pages/ContactHome';
import NewIncident from '@/pages/NewIncident';
import Assessment from '@/pages/Assessment';
import Copilot from '@/pages/Copilot';
import Chat from '@/pages/Chat';
import Timeline from '@/pages/Timeline';
import Trends from '@/pages/Trends';
import DailyLog from '@/pages/DailyLog';
import Notify from '@/pages/Notify';
import MonthlyReport from '@/pages/MonthlyReport';

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
            <Route path="/caregiver-profile" element={<CaregiverProfile />} />
            <Route path="/contact-profile" element={<ContactProfile />} />
            <Route path="/contact-choice" element={<ContactChoice />} />
            <Route path="/setup" element={<ElderSetup />} />
            <Route path="/join" element={<JoinHousehold />} />

            {/* Full-screen pages (no shell) */}
            <Route path="/incident" element={<NewIncident />} />
            <Route path="/daily-log" element={<DailyLog />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/notify" element={<Notify />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />

            {/* Main app (with shell — header + bottom nav) */}
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomeRedirect />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/trend" element={<Trends />} />
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
