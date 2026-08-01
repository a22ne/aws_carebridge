# CareBridge AI MVP — Tasks

## Gate 1: Foundation & Deploy (Day 1, 09:00–11:00)

- [ ] TASK-001 — Monorepo 骨架建立
  - Priority: P0
  - Owner: all
  - Depends on: none
  - Requirement: REQ-18
  - Deliverable: package.json (workspaces), tsconfig, .gitignore, .env.example, README skeleton
  - Acceptance check: `npm install` succeeds, TypeScript compiles
  - Demo blocker: yes

- [ ] TASK-002 — SAM Infrastructure 基礎
  - Priority: P0
  - Owner: backend
  - Depends on: TASK-001
  - Requirement: REQ-03, REQ-05
  - Deliverable: template.yaml with API Gateway + health Lambda + 5 DynamoDB tables + SAM Parameters + Outputs
  - Acceptance check:
    - `sam validate --lint` succeeds
    - `sam build` succeeds
    - `sam deploy` creates stack without errors
    - `GET /health` returns HTTP 200 with `{ success: true, requestId: "..." }`
    - `aws cloudformation describe-stacks` returns ApiBaseUrl + all table names
    - DynamoDB: create household via API → record exists in Households table
    - DynamoDB: joinCode queryable via JoinCodeIndex
    - CloudWatch: health request produces log with requestId + duration
    - CloudWatch: logs do NOT contain AWS credentials or tokens
  - Demo blocker: yes

- [ ] TASK-002A — Bedrock Guardrail Infrastructure
  - Priority: P0
  - Owner: ai
  - Depends on: TASK-002
  - Requirement: REQ-12
  - Deliverable: Bedrock Guardrail created (SAM or Console fallback) + BEDROCK_GUARDRAIL_ID/VERSION in env
  - Acceptance check:
    - Guardrail blocks diagnostic-seeking prompts
    - Safe fallback response returned when blocked
    - Guardrail ID and version not hardcoded in handlers
    - If Console-created: deployment-runbook documents steps
  - Demo blocker: yes (for Care Copilot)

- [ ] TASK-003 — React 前端骨架
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-001
  - Requirement: REQ-18
  - Deliverable: Vite + React + Tailwind + React Router + i18n setup + Bottom Nav
  - Acceptance check: dev server runs, pages route correctly
  - Demo blocker: yes

- [ ] TASK-004 — Amplify 初次部署
  - Priority: P0
  - Owner: all
  - Depends on: TASK-003
  - Requirement: REQ-18
  - Deliverable: Amplify connected to GitHub, main branch auto-deploys, amplify.yml in repo
  - Acceptance check:
    - Amplify detects monorepo with appRoot=apps/web
    - `main` push triggers auto build & deploy
    - Amplify URL opens and shows app
    - `VITE_API_BASE_URL` set in Amplify environment variables
    - React Router sub-pages (e.g. /copilot, /timeline) do NOT 404 on direct access
    - API client connects to backend (no CORS error in console)
  - Demo blocker: yes

- [ ] TASK-005 — Shared Types Package
  - Priority: P0
  - Owner: backend
  - Depends on: TASK-001
  - Requirement: all
  - Deliverable: packages/shared-types with all TypeScript interfaces
  - Acceptance check: types compile, importable from frontend and backend
  - Demo blocker: yes

- [ ] TASK-006 — i18n 基礎設定
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-003
  - Requirement: REQ-01
  - Deliverable: i18n framework + 4-language dictionary (core keys)
  - Acceptance check: language switch works on all nav items
  - Demo blocker: yes

---

## Gate 2: Data & Core Flow (Day 1, 11:00–15:00)

- [ ] TASK-007 — Language & Role Selection 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-006
  - Requirement: REQ-01, REQ-02
  - Deliverable: Language picker + Role picker screens
  - Acceptance check: selection persists in localStorage, routes to correct home
  - Demo blocker: yes

- [ ] TASK-008 — Household API (create + join + get)
  - Priority: P0
  - Owner: backend
  - Depends on: TASK-002, TASK-005
  - Requirement: REQ-03, REQ-04
  - Deliverable: 3 Lambda handlers + DynamoDB operations + joinCode generation
  - Acceptance check: can create household, get code, join with code from another client
  - Demo blocker: yes

- [ ] TASK-009 — Elder Profile Setup 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-007
  - Requirement: REQ-03
  - Deliverable: Form for elder name, age, chronic conditions + API integration
  - Acceptance check: elder saved to DynamoDB via API
  - Demo blocker: yes

- [ ] TASK-010 — Caregiver Home 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-009
  - Requirement: REQ-05, REQ-13
  - Deliverable: Dashboard with elder card, metrics, risk alert card, action buttons, recent items
  - Acceptance check: matches prototype layout, links to incident/copilot/timeline/trend
  - Demo blocker: yes

- [ ] TASK-011 — Incident API (create + get + list)
  - Priority: P0
  - Owner: backend
  - Depends on: TASK-008
  - Requirement: REQ-05
  - Deliverable: Lambda handlers for incident CRUD
  - Acceptance check: incident saved with original text + language, retrievable by householdId
  - Demo blocker: yes

- [ ] TASK-012 — New Incident 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-010, TASK-011
  - Requirement: REQ-05
  - Deliverable: Text input, symptom chips, submit button → calls API
  - Acceptance check: incident created in DynamoDB from UI input
  - Demo blocker: yes

- [ ] TASK-013 — Daily Log 頁面 (frontend form)
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-010
  - Requirement: REQ-13
  - Deliverable: Form with required + optional fields, save to local state (API if time)
  - Acceptance check: form submits, entry appears in timeline
  - Demo blocker: no (P0-B)

- [ ] TASK-014 — Contact Home + Join Flow 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-008
  - Requirement: REQ-04
  - Deliverable: Code entry screen, contact dashboard showing household incidents
  - Acceptance check: entering valid code shows household data
  - Demo blocker: yes

---

## Gate 3: AI & Assessment (Day 1, 15:00–18:00)

- [ ] TASK-015 — Bedrock Symptom Extraction Lambda
  - Priority: P0
  - Owner: ai
  - Depends on: TASK-011
  - Requirement: REQ-06
  - Deliverable: Lambda calling Bedrock with prompt contract, JSON validation, retry logic
  - Acceptance check:
    - Given Indonesian text, returns structured symptoms + zh-TW translation
    - Bedrock model ID read from process.env.BEDROCK_MODEL_ID
    - JSON schema validation on Bedrock response
    - Retry up to 2x on parse failure
    - CloudWatch log contains requestId, model invocation duration
    - Permission denied → identifiable CloudWatch error (not fake success)
  - Demo blocker: yes

- [ ] TASK-016 — AI Assessment 頁面 (Q&A flow)
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-015
  - Requirement: REQ-07
  - Deliverable: Chat-style UI, one question at a time, answer buttons, progress bar
  - Acceptance check: questions appear one by one, answers are sent to API
  - Demo blocker: yes

- [ ] TASK-017 — Answer API + Next Question Logic
  - Priority: P0
  - Owner: ai
  - Depends on: TASK-015
  - Requirement: REQ-07
  - Deliverable: Lambda that accepts answer, determines next question via Bedrock
  - Acceptance check: each answer triggers new question until assessment complete
  - Demo blocker: yes

- [ ] TASK-018 — Clinical Rules JSON + Rule Engine
  - Priority: P0
  - Owner: ai
  - Depends on: TASK-005
  - Requirement: REQ-08
  - Deliverable: clinical-rules.json (10 red flags + 5-8 chronic rules), evaluation engine, tests
  - Acceptance check: given symptoms, returns correct risk level + triggered rules
  - Demo blocker: yes

- [ ] TASK-019 — Assess API (Rule Engine + Risk Result)
  - Priority: P0
  - Owner: ai
  - Depends on: TASK-017, TASK-018
  - Requirement: REQ-09
  - Deliverable: Lambda combining rule engine + structured assessment → risk result
  - Acceptance check: returns riskLevel, triggeredRules, recommendations, sources
  - Demo blocker: yes

- [ ] TASK-020 — Risk Result 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-019
  - Requirement: REQ-09
  - Deliverable: Risk display with color-coded level, facts, missing info, actions, disclaimer
  - Acceptance check: matches prototype risk card layout
  - Demo blocker: yes

- [ ] TASK-021 — Care Copilot Backend
  - Priority: P0
  - Owner: ai
  - Depends on: TASK-002, TASK-002A
  - Requirement: REQ-12
  - Deliverable: Conversation CRUD + Bedrock message handler with Guardrails
  - Acceptance check:
    - Send message → get response, history saved in DynamoDB
    - Diagnostic-seeking prompt → Guardrail blocks → safe fallback returned
    - Model ID and Guardrail ID from env vars (not hardcoded)
    - Guardrail does NOT replace deterministic Rule Engine
    - CloudWatch contains requestId, no PII leakage
  - Demo blocker: yes

- [ ] TASK-022 — Care Copilot 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-021
  - Requirement: REQ-12
  - Deliverable: Chat UI, input field, send button, disclaimer, suggested questions
  - Acceptance check: interactive conversation works, history persists across refresh
  - Demo blocker: yes

---

## Gate 4: Notification & Polish (Day 2, 09:00–11:00)

- [ ] TASK-023 — Notify API
  - Priority: P0
  - Owner: backend
  - Depends on: TASK-019
  - Requirement: REQ-10
  - Deliverable: Lambda generating zh-TW notification summary, saving to Notifications table
  - Acceptance check: notification created with summary, visible to contact
  - Demo blocker: yes

- [ ] TASK-024 — Notification Preview 頁面 (Caregiver)
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-023
  - Requirement: REQ-10
  - Deliverable: Summary display, recipient toggles, preview text, send button
  - Acceptance check: matches prototype notify screen
  - Demo blocker: yes

- [ ] TASK-025 — Contact Notification Detail + Status Update
  - Priority: P0
  - Owner: frontend + backend
  - Depends on: TASK-023, TASK-014
  - Requirement: REQ-11
  - Deliverable: Contact sees notification, can update status (pending→resolved)
  - Acceptance check: status update reflects on caregiver side after refresh
  - Demo blocker: yes

- [ ] TASK-026 — Care Timeline 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-013, TASK-012
  - Requirement: REQ-14
  - Deliverable: Chronological list with icons, filters, mixing daily logs + incidents
  - Acceptance check: matches prototype timeline layout, filters work
  - Demo blocker: no (P0-B, but highly visible)

- [ ] TASK-027 — Health Trends 頁面
  - Priority: P0
  - Owner: frontend + ai
  - Depends on: TASK-013
  - Requirement: REQ-15
  - Deliverable: Charts (mock data), stats cards, AI trend alert (Bedrock call)
  - Acceptance check: charts render, AI alert text appears
  - Demo blocker: no (P0-B)

- [ ] TASK-028 — Structured Summary 頁面
  - Priority: P0
  - Owner: frontend
  - Depends on: TASK-026
  - Requirement: REQ-16
  - Deliverable: Medical report format view with elder info, symptoms, patterns
  - Acceptance check: readable structured layout with disclaimer
  - Demo blocker: no (P0-B)

- [ ] TASK-029 — i18n 四語補齊
  - Priority: P0
  - Owner: frontend
  - Depends on: all UI tasks
  - Requirement: REQ-01
  - Deliverable: All UI keys have zh-TW, en, id, vi translations
  - Acceptance check: switching language shows no missing keys or raw key names
  - Demo blocker: yes

---

## Gate 5: Demo QA (Day 2, 11:00–13:00)

- [ ] TASK-030 — Loading / Error / Retry States
  - Priority: P0
  - Owner: frontend
  - Depends on: all UI tasks
  - Requirement: REQ-18
  - Deliverable: Every async action has loading, error with retry, empty states
  - Acceptance check: disconnect network → errors shown; slow API → loading shown
  - Demo blocker: yes

- [ ] TASK-031 — Mobile QA (390px)
  - Priority: P0
  - Owner: all
  - Depends on: TASK-030
  - Requirement: REQ-18
  - Deliverable: All screens tested at 390px, no overflow, buttons tappable
  - Acceptance check: full demo flow at mobile width
  - Demo blocker: yes

- [ ] TASK-032 — Desktop & Projection QA
  - Priority: P0
  - Owner: all
  - Depends on: TASK-031
  - Requirement: REQ-18
  - Deliverable: Layout adapts on desktop, fonts visible on projector
  - Acceptance check: Chrome DevTools responsive two-device side-by-side demo
  - Demo blocker: yes

- [ ] TASK-033 — README 完成
  - Priority: P0
  - Owner: all
  - Depends on: all
  - Requirement: REQ-18
  - Deliverable: Complete setup guide, demo runbook, architecture overview
  - Acceptance check: new machine can setup and run demo following README only
  - Demo blocker: yes

- [ ] TASK-034 — Demo 排練 & 錄影
  - Priority: P0
  - Owner: all
  - Depends on: TASK-032
  - Requirement: N/A
  - Deliverable: Full demo run-through, record video, prepare fallback
  - Acceptance check: 6-minute demo script works end-to-end
  - Demo blocker: yes

---

## Daily Log Backend (if time permits)

- [ ] TASK-035 — Daily Log API (create + list)
  - Priority: P0-B (depends on progress)
  - Owner: backend
  - Depends on: TASK-002
  - Requirement: REQ-13
  - Deliverable: Lambda for daily log CRUD
  - Acceptance check: logs saved to DynamoDB, retrievable by household
  - Demo blocker: no

- [ ] TASK-036 — Daily Log AI Monitoring Alert (frontend)
  - Priority: P0-B
  - Owner: frontend
  - Depends on: TASK-013
  - Requirement: REQ-13
  - Deliverable: Frontend logic detecting combination of abnormal entries → show alert card
  - Acceptance check: entering low food + abnormal breathing triggers alert on home
  - Demo blocker: no
