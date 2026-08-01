# CareBridge AI MVP — Requirements

## REQ-01: Language Selection [P0]

**As a** user (caregiver or contact)  
**I want to** select my preferred language  
**So that** I can use the app in my native language

### Acceptance Criteria

- GIVEN the app opens for the first time WHEN the language selection screen appears THEN zh-TW, en, id, vi are available
- GIVEN a language is selected WHEN navigating the app THEN all UI text displays in the selected language
- GIVEN language is changed later THEN all UI updates immediately without page reload
- GIVEN user's original input text WHEN language is switched THEN original input is NOT modified

---

## REQ-02: Role Selection [P0]

**As a** user  
**I want to** choose my role (caregiver or contact)  
**So that** I see relevant content and actions for my role

### Acceptance Criteria

- GIVEN first app open WHEN language is selected THEN role selection screen appears
- GIVEN role is selected THEN home screen shows role-specific content
- GIVEN caregiver role THEN bottom nav shows: 首頁/事件/AI助手/紀錄/趨勢
- GIVEN contact role THEN nav shows appropriate contact-focused items
- Role stored in localStorage for persistence

---

## REQ-03: Household & Elder Setup [P0-A]

**As a** caregiver  
**I want to** create a household and register an elder's basic info  
**So that** the system can track care for this person

### Acceptance Criteria

- GIVEN caregiver selects "create household" WHEN minimal elder data is entered (name, age, chronic conditions) THEN household is created in DynamoDB
- GIVEN household is created THEN a 6-character alphanumeric Household Code is generated
- GIVEN Household Code THEN it does not expire
- GIVEN the code THEN another device can join and see the same household data
- API: `POST /households` returns `householdId` + `joinCode`

---

## REQ-04: Join Household [P0-A]

**As a** contact  
**I want to** join a household using a code  
**So that** I can see the elder's care data and incidents

### Acceptance Criteria

- GIVEN contact enters a valid 6-char code WHEN submitted THEN DynamoDB links contact to household
- GIVEN invalid code THEN error message with retry option
- GIVEN joined THEN contact sees same incidents, timeline, and notifications as the household
- API: `POST /households/join`

---

## REQ-05: Create Incident [P0-A]

**As a** caregiver  
**I want to** describe an abnormal situation in my native language  
**So that** the system can analyze it

### Acceptance Criteria

- GIVEN caregiver is on incident page WHEN free text is entered THEN submit is enabled
- GIVEN text is submitted THEN original text + detected language are saved to DynamoDB
- GIVEN empty text THEN submit button is disabled
- GIVEN placeholder text THEN it is NOT sent as actual data
- API: `POST /incidents` with `originalText`, `originalLanguage`, `householdId`, `elderId`

---

## REQ-06: AI Symptom Extraction & Translation [P0-A]

**As the** system  
**I want to** extract structured symptoms and translate to zh-TW  
**So that** the assessment flow has structured data to work with

### Acceptance Criteria

- GIVEN incident is created WHEN extract is called THEN Bedrock returns JSON with: symptoms[], translatedTextZhTW, originalLanguage, uncertainties[]
- GIVEN each symptom THEN it has: code, label, status (present|absent|unknown), evidence
- GIVEN Bedrock fails to parse THEN retry up to 2 times, then show retryable error
- GIVEN extraction succeeds THEN results are saved to incident record in DynamoDB
- API: `POST /incidents/{incidentId}/extract`

---

## REQ-07: Guided Q&A (One Question at a Time) [P0-A]

**As a** caregiver  
**I want to** answer one focused question at a time  
**So that** I don't get overwhelmed and the system gathers critical info

### Acceptance Criteria

- GIVEN extraction is complete WHEN assessment begins THEN system asks ONE question
- GIVEN question THEN it is the most risk-relevant unanswered item
- GIVEN answer options THEN at least: yes, no, unknown
- GIVEN question is answered THEN answer is saved and next question appears
- GIVEN question is already answered THEN it is NOT asked again
- GIVEN question text THEN it displays in the user's selected language
- API: `POST /incidents/{incidentId}/answer`

---

## REQ-08: Red-Flag Rule Engine [P0-A]

**As the** system  
**I want to** deterministically identify emergency conditions  
**So that** critical situations are never missed regardless of AI behavior

### Acceptance Criteria

- GIVEN confirmed symptoms match a red-flag rule THEN `emergency` risk level is triggered
- GIVEN rule engine result THEN it CANNOT be overridden by Bedrock
- GIVEN `unknown` status THEN it is NOT treated as `false` (conservative approach)
- GIVEN triggered rules THEN `triggeredRules[]` and `sourceIds[]` are included in result
- Rules defined in `clinical-rules.json` with schema validation

---

## REQ-09: Risk Assessment Result [P0-A]

**As a** caregiver  
**I want to** see a clear risk result with reasons and next steps  
**So that** I know what to do

### Acceptance Criteria

- GIVEN assessment is complete THEN result shows: riskLevel, triggeredRules, confirmed facts, missingInformation, recommendedActions, sourceIds
- GIVEN result THEN non-diagnosis disclaimer is always visible
- GIVEN `emergency` level THEN prominent visual alert + "call emergency services" guidance
- GIVEN result THEN caregiver can proceed to notification
- API: `POST /incidents/{incidentId}/assess`

---

## REQ-10: Smart Notification [P0-A]

**As a** caregiver  
**I want to** notify contacts with an AI-generated cross-language summary  
**So that** they understand the situation quickly

### Acceptance Criteria

- GIVEN assessment is done WHEN notify is triggered THEN zh-TW summary is generated
- GIVEN summary THEN it includes: symptoms, risk level, recommended actions
- GIVEN summary THEN it marks confirmed vs unconfirmed info
- GIVEN notification THEN it is saved to DynamoDB Notifications table
- GIVEN notification THEN contact can see it in their app
- API: `POST /incidents/{incidentId}/notify`

---

## REQ-11: Contact Status Update [P0-A]

**As a** contact  
**I want to** update the handling status of an incident  
**So that** the caregiver knows the situation is being addressed

### Acceptance Criteria

- GIVEN contact views notification THEN status options are: pending, read, contacted, scheduled, resolved
- GIVEN status update THEN it is saved to DynamoDB
- GIVEN status update THEN caregiver's view reflects the new status (polling or refresh)
- API: `PATCH /incidents/{incidentId}/status`

---

## REQ-12: AI Care Copilot [P0-A]

**As a** caregiver  
**I want to** have a guided conversation with an AI assistant  
**So that** I get context-aware care guidance in my language

### Acceptance Criteria

- GIVEN copilot page WHEN user types a message THEN Bedrock responds with care guidance
- GIVEN response THEN it is translated if user language differs from response language
- GIVEN conversation THEN history is saved to DynamoDB (Conversations table)
- GIVEN copilot THEN it NEVER provides medical diagnosis
- GIVEN copilot THEN non-diagnosis disclaimer is always visible
- GIVEN copilot THEN it is accessible from independent nav entry AND embedded in incident flow
- GIVEN Bedrock Guardrails THEN diagnostic-sounding responses are blocked
- API: `POST /copilot/conversations`, `POST /copilot/conversations/{id}/messages`

---

## REQ-13: Daily Care Log [P0-B]

**As a** caregiver  
**I want to** record daily care observations via a form  
**So that** there is a structured record of the elder's daily condition

### Acceptance Criteria

- GIVEN daily log form THEN required fields: meals (%), medication (yes/no), sleep (hours), mobility, breathing
- GIVEN form THEN optional fields: weight, mood, excretion, temperature
- GIVEN form submitted THEN log is displayed in Care Timeline
- GIVEN backend available THEN log is saved to DynamoDB DailyLogs table
- GIVEN backend unavailable THEN log is shown in frontend (noted as not synced)
- GIVEN multiple abnormal entries THEN AI monitoring alert triggers (frontend rule)

---

## REQ-14: Care Timeline [P0-B]

**As a** user (caregiver or contact)  
**I want to** see a chronological view of all care events  
**So that** I can track the elder's care history

### Acceptance Criteria

- GIVEN timeline page THEN it shows both daily logs AND incidents in chronological order
- GIVEN each entry THEN it shows: icon, title, time, brief description
- GIVEN filters THEN user can filter by: all, diet, medication, sleep, events
- GIVEN no data THEN empty state is shown (not blank)
- GIVEN incident with risk THEN it shows risk badge

---

## REQ-15: Health Trends [P0-B]

**As a** user  
**I want to** see health trends over time  
**So that** I can spot gradual changes that daily observations miss

### Acceptance Criteria

- GIVEN trends page THEN charts show: food intake, sleep hours, weight (mock data for competition)
- GIVEN trend data THEN AI trend alert text is generated (calls Bedrock)
- GIVEN AI alert THEN it mentions specific declining metrics and recommended actions
- GIVEN insufficient data THEN empty state shown (not fake data pretending to be real)
- API: `POST /trends/{householdId}/alert` (Bedrock generates alert text)

---

## REQ-16: Structured Medical Summary [P0-B]

**As a** contact  
**I want to** see a structured care report  
**So that** I can share it with medical professionals

### Acceptance Criteria

- GIVEN summary page THEN it displays: elder info, recent symptoms, risk events, daily care patterns, medication adherence
- GIVEN summary THEN it is formatted for quick medical professional reading
- GIVEN summary THEN non-diagnosis disclaimer is included
- GIVEN competition version THEN frontend rendering from available data (no separate backend endpoint required)

---

## REQ-17: Cross-Device Sync [P0-A]

**As** both caregiver and contact  
**I want** real-time (or near-real-time) data sync  
**So that** both roles see the same information

### Acceptance Criteria

- GIVEN caregiver creates incident WHEN contact refreshes THEN incident appears
- GIVEN contact updates status WHEN caregiver refreshes THEN status is updated
- GIVEN sync THEN it works via DynamoDB read (short polling or manual refresh)
- GIVEN sync failure THEN user sees appropriate error with retry
- No WebSocket required for competition version

---

## REQ-18: Responsive & Demo Ready [P0]

**As** demo presenters  
**I want** the app to work on mobile and desktop  
**So that** we can demo using Chrome DevTools responsive mode

### Acceptance Criteria

- GIVEN 390px width THEN all screens are usable and readable
- GIVEN desktop width THEN layout adapts (not just scaled mobile)
- GIVEN Chrome DevTools responsive THEN two devices can be shown side by side
- GIVEN projection THEN font sizes and contrast are adequate
- GIVEN all primary buttons THEN minimum touch target 44px
