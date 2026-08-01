// CareBridge AI — Shared Types

// === Enums & Unions ===

export type Language = 'zh-TW' | 'en' | 'id' | 'vi';

export type Role = 'caregiver' | 'contact';

export type RiskLevel = 'emergency' | 'urgent' | 'attention' | 'monitor';

export type IncidentStatus = 'pending' | 'read' | 'contacted' | 'scheduled' | 'resolved';

export type SymptomStatus = 'present' | 'absent' | 'unknown';

export type ConversationContext = 'standalone' | 'embedded';

// === Household ===

export interface ElderProfile {
  elderId: string;
  displayName: string;
  age: number;
  birthday?: string;
  city?: string;
  gender?: string;
  chronicConditions: string[];
  otherConditions?: string;
  medications: string[];
  allergies: string[];
  baselineMobility: string;
  baselineCognition: string;
}

/** Profile for a caregiver or contact user within a household */
export interface UserProfile {
  name: string;
  phone: string;
  /** Only meaningful for contacts — relationship to the elder */
  relationship?: string;
  language?: Language;
  updatedAt?: string;
}

export interface Household {
  householdId: string;
  joinCode: string;
  elderProfile: ElderProfile;
  caregiverProfile?: UserProfile;
  contactProfile?: UserProfile;
  /** Care guidelines authored by the contact, read-only for the caregiver */
  careGuidelines?: string;
  careGuidelinesUpdatedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// === Incident ===

export interface ExtractedSymptom {
  code: string;
  label: string;
  status: SymptomStatus;
  evidence: string;
}

export interface IncidentAnswer {
  questionId: string;
  answer: 'yes' | 'no' | 'unknown';
  timestamp: string;
}

export interface Incident {
  incidentId: string;
  householdId: string;
  elderId: string;
  createdByRole: Role;
  originalLanguage: Language;
  originalText: string;
  translatedText: string | null;
  extractedSymptoms: ExtractedSymptom[];
  answers: IncidentAnswer[];
  riskLevel: RiskLevel | null;
  triggeredRules: string[];
  missingInformation: string[];
  recommendedActions: string[];
  sourceIds: string[];
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

// === Daily Log ===

export interface MealLog {
  percentage: number;
  notes: string;
}

export interface MedicationLog {
  taken: boolean;
  notes: string;
}

export interface SleepLog {
  hours: number;
  quality: string;
}

export interface DailyLog {
  logId: string;
  householdId: string;
  elderId: string;
  date: string; // YYYY-MM-DD
  createdByRole: Role;
  meals: MealLog;
  medication: MedicationLog;
  sleep: SleepLog;
  mobility: string;
  breathing: string;
  weight?: number;
  mood?: string;
  excretion?: string;
  temperature?: number;
  notes: string;
  aiAlertTriggered: boolean;
  createdAt: string;
  updatedAt?: string;
}

// === Notification ===

export interface Notification {
  notificationId: string;
  householdId: string;
  incidentId: string;
  recipientRole: Role;
  title: string;
  originalSummary: string;
  translatedSummary: string;
  readAt: string | null;
  responseStatus: IncidentStatus;
  createdAt: string;
}

// === Conversation (Care Copilot) ===

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  translatedContent: string | null;
  timestamp: string;
}

export interface Conversation {
  conversationId: string;
  householdId: string;
  elderId: string;
  startedByRole: Role;
  language: Language;
  context: ConversationContext;
  relatedIncidentId: string | null;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

// === API Response ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

// === Bedrock Contracts ===

export interface SymptomExtractionResult {
  originalLanguage: string;
  translatedTextZhTW: string;
  symptoms: ExtractedSymptom[];
  uncertainties: string[];
}

export interface AssessmentQuestion {
  questionId: string;
  textByLanguage: Record<Language, string>;
  options: string[];
}

export interface AssessmentResult {
  riskLevel: RiskLevel;
  triggeredRules: string[];
  confirmedFacts: string[];
  missingInformation: string[];
  recommendedActions: string[];
  escalationWarnings: string[];
  sourceIds: string[];
  disclaimer: string;
}

export interface CopilotResponse {
  response: string;
  translatedResponse: string | null;
  suggestedFollowUps: string[];
}

// === Chat (caregiver <-> contact real-time messaging) ===

export interface ChatMessage {
  messageId: string;
  householdId: string;
  senderRole: Role;
  senderName: string;
  /** Text exactly as typed by the sender */
  originalText: string;
  originalLanguage: Language;
  /** Bedrock translations keyed by target language */
  translations: Partial<Record<Language, string>>;
  createdAt: string;
}
