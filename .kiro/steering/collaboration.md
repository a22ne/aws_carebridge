---
inclusion: always
---

# CareBridge AI — Collaboration Steering

## 團隊

- 3 人團隊
- 全部使用 Kiro 開發
- Infrastructure Owner：三人共同負責

## Git Flow

```
main ← dev ← feature/*
```

- `main`：可展示、可部署版本。Amplify 自動 deploy。
- `dev`：整合版本。
- `feature/*`：各人工作分支。

## Branch 規則

建議分支：
- `feature/frontend-core`
- `feature/backend-api`
- `feature/ai-assessment`
- `feature/daily-log`
- `feature/copilot`
- `feature/i18n`

## 標準工作流

1. Clone repo
2. `npm install`
3. 建立 `.env.local`（從 `.env.example` 複製）
4. 共用同一 AWS Account / Region (`us-west-2`) / SAM Stack
5. Push feature branch → PR to dev → 整合測試 → merge to main

## Commit 規則

格式：
```
type(scope): summary

Refs: TASK-ID
```

要求：
- 單一目的
- 不混合無關重構
- 不包含秘密
- 通過 lint、typecheck

## Pull Request 規則

PR 必須說明：
- 修改目的
- 關聯 Requirement / Task
- 驗收方式
- 是否影響 API、資料模型、醫療規則或 Demo

## 高衝突檔案保護

修改前需通知團隊：
- `package.json` / lock file
- `infrastructure/template.yaml`
- `packages/i18n/` 翻譯檔
- `packages/shared-types/`
- `packages/clinical-rules/clinical-rules.json`

## Secret 管理

禁止提交：
- AWS Access Key / Secret Access Key / Session Token
- API Token
- `.env` / `.env.local`
- credentials
- 私鑰
- 真實敏感資料

必要檔案：
- `.gitignore`（排除上述）
- `.env.example`（只含變數名稱與說明，不含真實值）

## AWS 權限

- 共用同一 Account
- 優先使用暫時憑證或 IAM Identity Center
- 不在聊天、GitHub 或群組貼 Access Key
- `sam deploy` 三人共同負責

## 部署

- `main` push → Amplify 自動 build & deploy
- SAM deploy 使用固定 stack name
- Demo 前確保 main 穩定
- 部署失敗從 build log 追蹤

## Spec 與程式同步

- 需求變更必須同步更新 Spec
- 重要決策不只留在對話中，要寫入 repo
- 資料模型變更需同步更新：TypeScript types、API validation、SAM、Spec、測試、README

## 衝突處理

發生衝突時依決策排序：
1. 醫療安全
2. Live Demo 可完成
3. P0 完整
4. AWS 串接
5. 資料正確
6. Kiro 展示
7. 多語言
8. 視覺
