import type {
  ApiResponse,
  Household,
  Incident,
  DailyLog,
  Notification,
  Conversation,
  ChatMessage,
  SymptomExtractionResult,
  AssessmentQuestion,
  AssessmentResult,
  CopilotResponse,
} from '@carebridge/shared-types';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to server',
        retryable: true,
      },
      requestId: 'local-' + Date.now(),
    };
  }
}

// === Households ===

export async function createHousehold(elderProfile: {
  displayName: string;
  age: number;
  birthday?: string;
  city?: string;
  gender?: string;
  chronicConditions: string[];
  otherConditions?: string;
}) {
  return request<Household>('/households', {
    method: 'POST',
    body: JSON.stringify({ elderProfile }),
  });
}

export async function updateHousehold(householdId: string, elderProfile: {
  displayName?: string;
  age?: number;
  birthday?: string;
  city?: string;
  gender?: string;
  chronicConditions?: string[];
  otherConditions?: string;
}) {
  return request<Household>(`/households/${householdId}`, {
    method: 'PATCH',
    body: JSON.stringify({ elderProfile }),
  });
}

export async function updateUserProfile(
  householdId: string,
  role: 'caregiver' | 'contact',
  profile: { name?: string; phone?: string; relationship?: string; language?: string }
) {
  const key = role === 'caregiver' ? 'caregiverProfile' : 'contactProfile';
  return request<Household>(`/households/${householdId}`, {
    method: 'PATCH',
    body: JSON.stringify({ [key]: profile }),
  });
}

export async function updateCareGuidelines(householdId: string, careGuidelines: string) {
  return request<Household>(`/households/${householdId}`, {
    method: 'PATCH',
    body: JSON.stringify({ careGuidelines }),
  });
}

export async function joinHousehold(joinCode: string) {
  return request<Household>('/households/join', {
    method: 'POST',
    body: JSON.stringify({ joinCode }),
  });
}

export async function getHousehold(householdId: string) {
  return request<Household>(`/households/${householdId}`);
}

// === Incidents ===

export async function createIncident(data: {
  householdId: string;
  elderId: string;
  originalText: string;
  originalLanguage: string;
}) {
  return request<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function extractSymptoms(incidentId: string, householdId: string) {
  return request<SymptomExtractionResult>(`/incidents/${incidentId}/extract`, {
    method: 'POST',
    body: JSON.stringify({ householdId }),
  });
}

export async function submitAnswer(incidentId: string, householdId: string, questionId: string, answer: string) {
  return request<AssessmentQuestion | null>(`/incidents/${incidentId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ householdId, questionId, answer }),
  });
}

export async function assessIncident(incidentId: string, householdId: string) {
  return request<AssessmentResult>(`/incidents/${incidentId}/assess`, {
    method: 'POST',
    body: JSON.stringify({ householdId }),
  });
}

export async function notifyContacts(incidentId: string, householdId: string) {
  return request<Notification>(`/incidents/${incidentId}/notify`, {
    method: 'POST',
    body: JSON.stringify({ householdId }),
  });
}

export async function getIncident(incidentId: string, householdId: string) {
  return request<Incident>(`/incidents/${incidentId}?householdId=${householdId}`);
}

export async function getHouseholdIncidents(householdId: string) {
  return request<Incident[]>(`/households/${householdId}/incidents`);
}

export async function updateIncidentStatus(incidentId: string, householdId: string, status: string) {
  return request<Incident>(`/incidents/${incidentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ householdId, status }),
  });
}

// === Daily Logs ===

export async function createDailyLog(data: Partial<DailyLog>) {
  return request<DailyLog>('/daily-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getHouseholdDailyLogs(householdId: string) {
  return request<DailyLog[]>(`/households/${householdId}/daily-logs`);
}

// === Copilot ===

export async function createConversation(data: {
  householdId: string;
  elderId: string;
  language: string;
  context: 'standalone' | 'embedded';
}) {
  return request<Conversation>('/copilot/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function sendCopilotMessage(conversationId: string, householdId: string, content: string) {
  return request<CopilotResponse>(`/copilot/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ householdId, content }),
  });
}

export async function getConversation(conversationId: string, householdId: string) {
  return request<Conversation>(`/copilot/conversations/${conversationId}?householdId=${householdId}`);
}

// === Chat (caregiver <-> contact) ===

export async function sendChatMessage(householdId: string, data: {
  senderRole: 'caregiver' | 'contact';
  senderName: string;
  originalText: string;
  originalLanguage: string;
}) {
  return request<ChatMessage>(`/households/${householdId}/chat`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getChatMessages(householdId: string, limit = 100) {
  return request<ChatMessage[]>(`/households/${householdId}/chat?limit=${limit}`);
}

// === Trends ===

export interface TrendAlertResponse {
  hasEnoughData: boolean;
  minimumDaysRequired: number;
  currentDays: number;
  alertText: string | null;
}

export async function getTrendAlert(householdId: string, language?: string) {
  return request<TrendAlertResponse>(`/trends/${householdId}/alert`, {
    method: 'POST',
    body: JSON.stringify({ language: language || 'zh-TW' }),
  });
}
