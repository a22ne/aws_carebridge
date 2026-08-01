import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role } from '@carebridge/shared-types';

interface AppState {
  role: Role | null;
  householdId: string | null;
  elderId: string | null;
  joinCode: string | null;
}

interface AppStateContextValue extends AppState {
  setRole: (role: Role) => void;
  setHousehold: (householdId: string, joinCode: string) => void;
  setElder: (elderId: string) => void;
  reset: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const ROLE_KEY = 'carebridge-role';
const HOUSEHOLD_KEY = 'carebridge-household';
const ELDER_KEY = 'carebridge-elder';
const JOINCODE_KEY = 'carebridge-joincode';

function getInitial(): AppState {
  if (typeof window === 'undefined') {
    return { role: null, householdId: null, elderId: null, joinCode: null };
  }
  const role = localStorage.getItem(ROLE_KEY) as Role | null;
  const householdId = localStorage.getItem(HOUSEHOLD_KEY);
  const elderId = localStorage.getItem(ELDER_KEY);
  const joinCode = localStorage.getItem(JOINCODE_KEY);
  return { role, householdId, elderId, joinCode };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getInitial);

  const setRole = useCallback((role: Role) => {
    setState(prev => ({ ...prev, role }));
    localStorage.setItem(ROLE_KEY, role);
  }, []);

  const setHousehold = useCallback((householdId: string, joinCode: string) => {
    setState(prev => ({ ...prev, householdId, joinCode }));
    localStorage.setItem(HOUSEHOLD_KEY, householdId);
    localStorage.setItem(JOINCODE_KEY, joinCode);
  }, []);

  const setElder = useCallback((elderId: string) => {
    setState(prev => ({ ...prev, elderId }));
    localStorage.setItem(ELDER_KEY, elderId);
  }, []);

  const reset = useCallback(() => {
    setState({ role: null, householdId: null, elderId: null, joinCode: null });
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(HOUSEHOLD_KEY);
    localStorage.removeItem(ELDER_KEY);
    localStorage.removeItem(JOINCODE_KEY);
  }, []);

  return (
    <AppStateContext.Provider value={{ ...state, setRole, setHousehold, setElder, reset }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
