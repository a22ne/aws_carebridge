# CareBridge AI MVP — Design

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Amplify)                       │
│  React + TypeScript + Vite + Tailwind                    │
│  Mobile-first PWA, 390px baseline                        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│           Amazon API Gateway (HTTP API)                   │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              AWS Lambda (TypeScript, Node 22)             │
│  Handlers: household, incident, daily-log, copilot,      │
│            notification, trend                            │
└───────┬─────────────┬────────────────┬──────────────────┘
        │             │                │
   DynamoDB      Bedrock API      Rule Engine
   (5 tables)   (Claude Sonnet 4)  (clinical-rules.json)
```

## AWS Resources

| Service | Purpose | Table/Model |
|---------|---------|-------------|
| DynamoDB | Households | `CareBridge-Households` |
| DynamoDB | Incidents | `CareBridge-Incidents` |
| DynamoDB | DailyLogs | `CareBridge-DailyLogs` |
| DynamoDB | Notifications | `CareBridge-Notifications` |
| DynamoDB | Conversations | `CareBridge-Conversations` |
| Bedrock | Symptom extraction, translation, Q&A, Copilot, Trend alert | `us.anthropic.claude-sonnet-4-20250514-v1:0` (via env var) |
| Bedrock Guardrails | Block diagnostic content | Managed via `BEDROCK_GUARDRAIL_ID` env var |
| API Gateway | HTTP API | Single API with routes |
| Lambda | Business logic | One function per handler group |
| Amplify | Frontend hosting | Auto-deploy from `main` |
| CloudWatch | Logging | Lambda logs |

## DynamoDB Schema

### Households Table

| Key | Attribute | Type |
|-----|-----------|------|
| PK | `householdId` | String (ULID) |
| | `joinCode` | String (6-char) |
| | `elderProfile` | Map |
| | `createdAt` | String (ISO 8601) |

GSI: `JoinCodeIndex` — PK: `joinCode`

### Incidents Table

| Key | Attribute | Type |
|-----|-----------|------|
| PK | `householdId` | String |
| SK | `incidentId` | String (ULID) |
| | `elderId` | String |
| | `createdByRole` | String |
| | `originalLanguage` | String |
| | `originalText` | String |
| | `translatedText` | String |
| | `extractedSymptoms` | List |
| | `answers` | List |
| | `riskLevel` | String (enum) |
| | `triggeredRules` | List |
| | `missingInformation` | List |
| | `recommendedActions` | List |
| | `sourceIds` | List |
| | `status` | String (enum) |
| | `createdAt` | String |
| | `updatedAt` | String |

### DailyLogs Table

| Key | Attribute | Type |
|-----|-----------|------|
| PK | `householdId` | String |
| SK | `logId` | String (ULID) |
| | `elderId` | String |
| | `date` | String (YYYY-MM-DD) |
| | `meals` | Map (percentage, notes) |
| | `medication` | Map (taken, notes) |
| | `sleep` | Map (hours, quality) |
| | `mobility` | String |
| | `breathing` | String |
| | `weight` | Number (optional) |
| | `mood` | String (optional) |
| | `excretion` | String (optional) |
| | `temperature` | Number (optional) |
| | `notes` | String |
| | `aiAlertTriggered` | Boolean |
| | `createdAt` | String |

### Notifications Table

| Key | Attribute | Type |
|-----|-----------|------|
| PK | `householdId` | String |
| SK | `notificationId` | String (ULID) |
| | `incidentId` | String |
| | `recipientRole` | String |
| | `title` | String |
| | `originalSummary` | String |
| | `translatedSummary` | String |
| | `readAt` | String (nullable) |
| | `responseStatus` | String (enum) |
| | `createdAt` | String |

### Conversations Table

| Key | Attribute | Type |
|-----|-----------|------|
| PK | `householdId` | String |
| SK | `conversationId` | String (ULID) |
| | `elderId` | String |
| | `startedByRole` | String |
| | `language` | String |
| | `context` | String (embedded/standalone) |
| | `relatedIncidentId` | String (optional) |
| | `messages` | List of {role, content, translatedContent, timestamp} |
| | `createdAt` | String |
| | `updatedAt` | String |

## User Flow

### Caregiver Flow

```
Language → Role(Caregiver) → Create Household + Elder → Get Code
                                    │
    ┌───────────────────────────────┘
    ▼
Home Dashboard
├─ Daily Log → Form → Save → Timeline
├─ AI Risk Alert Card → Start Assessment
├─ New Incident → Text Input → Extract → Q&A → Risk → Notify
├─ Care Copilot → Conversation → Save History
├─ Timeline → Browse daily + incidents
└─ Trends → Charts + AI Alert
```

### Contact Flow

```
Language → Role(Contact) → Enter Household Code → Join
                                    │
    ┌───────────────────────────────┘
    ▼
Home Dashboard
├─ Notifications → View Incident → Update Status
├─ Timeline → Browse care records
├─ Trends → Charts + AI Alert
└─ Structured Summary → Medical report view
```

## Bedrock Prompt Contracts

### Symptom Extraction

Input:
```json
{
  "originalText": "string",
  "originalLanguage": "string",
  "elderBaseline": { "age": 83, "chronicConditions": ["hypertension"] },
  "allowedSymptomFields": ["appetite", "breathing", "mobility", ...],
  "instructions": "Extract symptoms as JSON. Do NOT diagnose. Output JSON only."
}
```

Output:
```json
{
  "originalLanguage": "id",
  "translatedTextZhTW": "string",
  "symptoms": [
    { "code": "string", "label": "string", "status": "present|absent|unknown", "evidence": "string" }
  ],
  "uncertainties": ["string"]
}
```

### Guided Question Generation

Input: current symptoms, answers so far, remaining unknown items
Output: single question object with `questionId`, `textByLanguage`, `options`

### Care Copilot

Input:
```json
{
  "conversationHistory": [...],
  "userMessage": "string",
  "userLanguage": "string",
  "systemPrompt": "You are a care guidance assistant. Never diagnose. Provide observation suggestions and escalation guidance."
}
```

Output:
```json
{
  "response": "string",
  "translatedResponse": "string (zh-TW if different)",
  "suggestedFollowUps": ["string"]
}
```

### Trend Alert

Input: recent daily log summary (mock data for competition)
Output: alert text describing trends and recommendations

## Rule Engine Design

```typescript
interface ClinicalRule {
  ruleId: string;
  title: string;
  version: string;
  conditions: RuleCondition[];  // AND logic
  riskLevel: 'emergency' | 'urgent' | 'attention' | 'monitor';
  actionCode: string;
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string;
  reviewedAt: string;
  status: 'active' | 'draft';
}

interface RuleCondition {
  symptomCode: string;
  operator: 'equals' | 'includes' | 'greaterThan';
  value: string | number | boolean;
  unknownBehavior: 'skip' | 'conservative';  // never treat as false
}
```

Evaluation:
1. Check all active rules against confirmed symptoms
2. `unknown` with `conservative` behavior → rule still triggers at lower confidence
3. Highest risk level wins
4. Return all triggered rules, not just the highest

## Error Handling Strategy

| Failure | User Experience | Technical |
|---------|----------------|-----------|
| Bedrock JSON parse fail | "Processing failed, retrying..." | Retry up to 2x |
| Bedrock timeout | "AI is taking longer than usual" | 30s timeout, retry |
| DynamoDB write fail | "Save failed, tap to retry" | Return retryable error |
| API Gateway 5xx | "Service temporarily unavailable" | Show requestId |
| Network offline | "No connection" banner | Detect navigator.onLine |

## Deployment

- SAM `template.yaml` defines all Lambda + API Gateway + DynamoDB tables
- `samconfig.toml` (from `.example`) sets region, stack name, parameters
- Amplify connects to GitHub `main` branch
- Environment variables passed via Amplify build settings and Lambda env

## Security

- No secrets in GitHub
- `.env.local` for local development (gitignored)
- API Gateway: no auth for competition (Cognito is P1)
- Bedrock Guardrails block diagnostic content
- Input validation on all Lambda handlers
- No PII in CloudWatch logs beyond what's necessary
