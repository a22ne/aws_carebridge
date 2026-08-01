---
inclusion: always
---

# CareBridge AI — Technical Steering

## 技術棧

### Frontend
- React 18+
- TypeScript (strict mode)
- Vite
- Tailwind CSS
- React Router
- Responsive Web App / PWA
- Mobile-first (390px 基準)
- AWS Amplify Hosting（GitHub push 自動 deploy）

### Backend
- Amazon API Gateway (HTTP API)
- AWS Lambda (TypeScript, Node.js 22, runtime `nodejs22.x`)
- AWS SDK v3
- Amazon DynamoDB (multi-table)
- Amazon Bedrock Converse API
  - Display name: Claude Sonnet 4
  - Inference profile ID: `us.anthropic.claude-sonnet-4-20250514-v1:0`
  - Model ID managed via SAM parameter → Lambda env `BEDROCK_MODEL_ID`
- Amazon Bedrock Guardrails (managed via `BEDROCK_GUARDRAIL_ID` + `BEDROCK_GUARDRAIL_VERSION`)
- Amazon CloudWatch Logs

### Infrastructure
- AWS SAM (template.yaml)
- Region: `us-west-2`
- 所有資源可從 repo 重新部署
- 環境變數控制 Region / Stack Name / API URL

## Repository 結構 (Monorepo)

```
aws_carebridge/
├─ .kiro/                    # Steering, Specs, Hooks
├─ apps/web/                 # React frontend
├─ services/api/             # Lambda backend
├─ packages/
│  ├─ shared-types/          # 共用 TypeScript 型別
│  ├─ i18n/                  # 翻譯資源
│  └─ clinical-rules/        # 規則定義與驗證
├─ infrastructure/           # SAM template
├─ docs/                     # 架構文件、runbook
├─ .env.example
├─ .gitignore
├─ package.json              # monorepo root (workspaces)
└─ CAREBRIDGE_KIRO_MASTER_STANDARD.md
```

## TypeScript 規則

- 啟用 strict mode
- 避免 `any`，必要時用 `unknown` + type guard
- API input/output 使用 `packages/shared-types` 共享型別
- 風險值、角色、語言、狀態使用 union type
- 外部輸入做 runtime validation（zod 或手動）
- 不在前端複製後端醫療風險邏輯
- 不把 Bedrock 原始回應直接信任為型別安全資料

## API 回應格式

成功：
```json
{
  "success": true,
  "data": {},
  "error": null,
  "requestId": "string"
}
```

失敗：
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "STABLE_MACHINE_READABLE_CODE",
    "message": "User-safe message",
    "retryable": true
  },
  "requestId": "string"
}
```

## API 端點

```
POST   /households
POST   /households/join
GET    /households/{householdId}

POST   /incidents
POST   /incidents/{incidentId}/extract
POST   /incidents/{incidentId}/answer
POST   /incidents/{incidentId}/assess
POST   /incidents/{incidentId}/notify

GET    /households/{householdId}/incidents
GET    /incidents/{incidentId}
PATCH  /incidents/{incidentId}/status

POST   /daily-logs
GET    /households/{householdId}/daily-logs
GET    /daily-logs/{logId}

POST   /copilot/conversations
POST   /copilot/conversations/{conversationId}/messages
GET    /copilot/conversations/{conversationId}
GET    /households/{householdId}/conversations

POST   /trends/{householdId}/alert
```

## 錯誤處理

每個外部依賴必須考慮：timeout、無效回應、權限錯誤、暫時性錯誤、重試、使用者 fallback。

- 不得使用空 catch block
- API 失敗前端必須可辨識與重試
- AWS API 暫時失敗顯示 Retry + request ID，不偽裝成功
- Bedrock JSON 無法解析時不當作成功

## Logging

CloudWatch Logs 包含：request ID、endpoint 名稱、結果、錯誤代碼、duration、事件 ID。
不得記錄：AWS secret、Token、完整憑證、不必要的完整個資。

## 測試

最低測試範圍：
- Unit: Rule Engine、risk precedence、unknown handling、schema、API validation、Bedrock JSON parsing、i18n completeness
- Integration: household → incident → answer → assess → notify → status → timeline
- Demo Smoke: Amplify URL → 語言角色 → 建立事件 → Bedrock → 問答 → 通知 → 跨裝置

## 部署

- `main` branch → Amplify 自動 deploy → Demo URL
- `dev` branch → 整合測試
- `sam deploy` 由三人共同負責
- Demo 前不得依賴未提交的本機版本
