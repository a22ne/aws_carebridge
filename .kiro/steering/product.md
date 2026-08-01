---
inclusion: always
---

# CareBridge AI — Product Steering

## 產品目標

CareBridge AI 是 AI 跨語言照護協作平台，解決外籍照護工作者面對長者日常與異常狀況時，缺乏語言能力、醫療知識與溝通管道的問題。

核心能力：
1. 日常照護結構化記錄
2. 異常事件 AI 風險評估
3. AI Care Copilot（情境式引導助手）
4. 跨語言智慧通報
5. 健康趨勢追蹤與 AI 提醒
6. 結構化病歷摘要

## 非診斷定位

CareBridge AI **不是醫療診斷工具**。所有 UI、prompt、API 回應不得暗示系統可診斷疾病或取代醫護人員。

## 使用者與角色

| 角色 | 使用者 | 核心需求 |
|------|--------|---------|
| 照顧者 | 外籍照護工作者（印尼/越南/菲律賓） | 母語記錄日常、通報異常、使用 Copilot、知道下一步 |
| 聯絡人 | 家屬/雇主/個管師/長照機構 | 接收通知、查看摘要、了解趨勢、確認處理 |

App 首次開啟必須選擇角色，角色影響首頁、可用操作、通知方向、事件可見內容與導覽。

## P0 Demo 主流程

### P0-A 必須 AWS 串接可操作：
1. 語言選擇 → 角色選擇 → 建立家庭/長者 → 取得 Household Code
2. 照顧者建立異常事件 → Bedrock 擷取症狀 → 逐題問答 → Rule Engine → 風險結果
3. 跨語言通報 → 聯絡人查看 → 更新狀態 → 同步回照顧者
4. Care Copilot 對話（輸入 → 翻譯 → 回覆 → 追問）

### P0-B 前端可展示為主：
- 日常照護登錄（表單式）
- Care Timeline（整合日常+事件）
- 健康趨勢（mock 圖表 + Bedrock AI 提醒）
- 結構化病歷摘要

## P0、P1、P2 邊界

- **P0**：上述所有功能。核心通報 + Copilot 必須 AWS 串接；其餘前端展示為主。
- **P1**：Translate / Cognito / SNS / 語音輸入 / 趨勢真實 aggregate / 更精緻動畫 / 社群接口示意
- **P2**：長照機構串接 / HIS / 影像診斷 / 原生 App / 專業知識庫 / Copilot 感知日常資料

## Scope Freeze 原則

P0-A 流程可運作後，除阻斷 Demo 的問題外不得變更：
- 核心 User Flow
- DynamoDB 主資料模型
- API 路徑
- risk level 定義
- Household Code 串接方式
- Bedrock 結構化輸出契約
- clinical-rules.json schema

最後一小時只修阻斷 Demo 的問題，不增功能。

## 評分策略

| 面向 | 策略 |
|------|------|
| 創新性 | 三層 AI 安全架構，AI 有明確責任邊界 |
| 實用性 | 真實痛點、可操作端到端流程、多語言覆蓋真實人群 |
| 技術深度 | Bedrock + DynamoDB + Lambda + API Gateway 完整串接 |
| 完整度 | Live Demo 可操作、跨裝置同步、降級方案 |
| AWS 使用 | 核心每步都經過 AWS 服務 |
| Kiro 使用 | 完整 .kiro 展示 Spec-driven development |
