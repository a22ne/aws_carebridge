# CareBridge AI — 3 人分工建議

> 此為 Kiro 生成的建議分工，請三人共同檢查與調整。

## 角色分配

| 成員 | Workstream | 主要負責範圍 |
|------|-----------|-------------|
| **成員 A** | Frontend | React UI 頁面、元件、Tailwind 樣式、Responsive、i18n 整合 |
| **成員 B** | Backend + Infra | SAM 部署、Lambda handlers、DynamoDB 操作、API Gateway、Amplify 設定 |
| **成員 C** | AI + Rules | Bedrock prompt engineering、Rule Engine、Care Copilot 對話邏輯、評估流程 |

## 共同負責

- Kiro Steering / Spec / Hooks（已建立）
- `sam deploy`（三人共同）
- Demo QA 與排練
- README 與簡報
- Git flow（PR review 互相幫忙）

---

## Day 1 (8/1) 任務分配

### 09:00–11:00 Gate 1：基礎部署

| 成員 | 任務 |
|------|------|
| A | TASK-003 React 前端骨架 → TASK-006 i18n 設定 |
| B | TASK-002 SAM 基礎 → TASK-004 Amplify 部署 |
| C | TASK-005 Shared Types → TASK-018 Clinical Rules JSON 初稿 |
| 全員 | TASK-001 確認 monorepo 可 install + compile |

**Gate 1 通過條件**：Amplify URL 可開、API health 可回應、.kiro 已提交

### 11:00–15:00 Gate 2：資料與核心流程

| 成員 | 任務 |
|------|------|
| A | TASK-007 語言/角色選擇 → TASK-009 Elder Setup → TASK-010 Caregiver Home → TASK-012 New Incident 頁面 |
| B | TASK-008 Household API → TASK-011 Incident API → TASK-014 Contact Join 後端 |
| C | TASK-015 Bedrock 症狀擷取 Lambda → TASK-017 Answer + Next Question |

**Gate 2 通過條件**：跨裝置可讀取同一家庭事件，正式資料在 DynamoDB

### 15:00–18:00 Gate 3：AI 與評估

| 成員 | 任務 |
|------|------|
| A | TASK-016 AI Assessment 頁面 → TASK-020 Risk Result 頁面 → TASK-022 Copilot 頁面 |
| B | TASK-019 Assess API（整合 Rule Engine）→ TASK-021 Copilot Backend |
| C | TASK-018 Rule Engine 完善 + 測試 → TASK-021 Copilot Bedrock prompt + Guardrails |

**Gate 3 通過條件**：AI 一次一題、Rule Engine 優先、結果可追蹤來源

---

## Day 2 (8/2) 任務分配

### 09:00–11:00 Gate 4：通知與完整體驗

| 成員 | 任務 |
|------|------|
| A | TASK-024 通知預覽頁 → TASK-026 Timeline → TASK-027 趨勢頁 → TASK-028 病歷摘要頁 |
| B | TASK-023 Notify API → TASK-025 Status Update → TASK-035 Daily Log API（if time） |
| C | TASK-027 趨勢 AI 提醒（Bedrock）→ TASK-029 i18n 四語補齊協助 → TASK-036 AI 監測邏輯 |

**Gate 4 通過條件**：聯絡人可更新狀態、照顧者看到更新、四語可切換

### 11:00–13:00 Gate 5：Demo QA

| 成員 | 任務 |
|------|------|
| A | TASK-030 Loading/Error States → TASK-031 Mobile QA |
| B | TASK-032 Desktop/投影 QA → TASK-033 README |
| C | TASK-034 Demo 排練 + 降級方案確認 |
| 全員 | 完整 Demo 流程跑一次、錄影 |

### 13:00–14:00 提交

| 全員 | 提案大綱、簡報 PDF、Demo URL、錄影連結、GitHub 連結 |

---

## 溝通規則

- 每個 Gate 結束時三人快速同步（5 分鐘）
- 遇到 blocker 立即通知，不要自己卡超過 20 分鐘
- 高衝突檔案修改前先說一聲：`template.yaml`、`package.json`、i18n 檔、shared-types

## Branch 建議

```
成員 A → feature/frontend-core
成員 B → feature/backend-api
成員 C → feature/ai-assessment

整合 → dev → main
```

## 最大風險的責任人

| 風險 | 主要負責 | 協助 |
|------|---------|------|
| Bedrock 回應不穩定 | C | B (retry logic) |
| SAM deploy 失敗 | B | 全員 |
| 跨裝置同步問題 | B | A (polling UI) |
| i18n 缺漏 | A | C (AI 文字) |
| Demo 當天 blocker | 全員立即集中處理 |
