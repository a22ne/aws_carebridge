---
title: CareBridge AI — Kiro 專案主控規範
document_type: Master Project Standard and Bootstrap Directive
version: 2.0
status: Team confirmed
project: CareBridge AI
competition: AWS Hackathon 2026
last_updated: 2026-08-01
recommended_location: repository root / CAREBRIDGE_KIRO_MASTER_STANDARD.md
confirmed_decisions:
  team_size: 3
  aws_region: us-west-2
  bedrock_model: Claude Sonnet 4 (claude-sonnet-4-20250514)
  repository: monorepo (github.com/a22ne/aws_carebridge)
  dynamodb: multi-table
  household_code: 6-char alphanumeric, no expiry
  demo_mode: Chrome DevTools responsive
  prototype_ref: https://a22ne.github.io/carebridge/
---

# CareBridge AI — Kiro 專案主控規範

> 本文件是 CareBridge AI 專案的最高層開發作業標準，提供給 Kiro AI 與所有專案成員共同遵循。  
> 它用來限制產品範圍、統一技術與設計決策、建立可驗收的 Spec、降低多人協作衝突，並確保 Live Demo 可在競賽時間內完成。  
> 除非團隊明確批准變更，Kiro 不得自行擴張產品範圍、替換核心技術路線或降低醫療安全要求。

## 文件使用說明

- 產品範圍、角色、核心流程、AWS 架構、醫療安全、Kiro 交付物、協作方式、時程與完成定義，均依據原始專案文件整理。
- 程式品質、錯誤格式、測試分層、Pull Request 與工作紀錄等細節，是為了把原始要求轉成可執行的開發標準；它們不代表新增產品功能。
- 若本文件的實作細節與團隊後續確認衝突，以團隊明確決策為準，但不得違反醫療安全、秘密管理與競賽硬性要求。

---

## 0. Kiro 首次讀取本文件時的行為

Kiro 首次讀取本文件時，**不得直接大量生成程式碼，也不得自行開始實作**。

第一個回覆必須依序輸出：

A. 對產品目標與評分策略的理解  
B. P0、P1、P2 功能表  
C. AWS 架構  
D. User Flow  
E. Repository 結構  
F. Kiro Spec、Steering 與 Hooks 規劃  
G. 團隊跨電腦協作方式  
H. 時程與工作分配  
I. 最大五項風險與降級方案  
J. 需要團隊確認的決策  

完成上述內容後，等待團隊確認，再建立 `.kiro/steering`、`.kiro/specs`、`.kiro/hooks` 與程式碼。

如果團隊之後要求新增或修改功能，Kiro 必須先：

1. 說明需求屬於 P0、P1 或 P2。
2. 說明是否會影響 Live Demo、醫療安全、資料模型、API 或既有流程。
3. 提出最小修改方案。
4. 取得確認後再實作。
5. 不得因需求模糊而自行擴張產品範圍。

---

# 1. 專案使命與產品邊界

## 1.1 產品名稱

**CareBridge AI**

## 1.2 產品定位

**AI Cross-Language Care Coordination Platform**  
**AI 跨語言照護協作平台**

## 1.3 一句話價值主張

當照顧者不知道下一步該怎麼做時，CareBridge AI 提供日常照護記錄、即時風險辨識、情境式 AI 引導、多語溝通與智慧通報。

## 1.4 核心問題

當長者出現日常或異常狀況時，第一線外籍照顧者可能不知道：

- 情況是否危險。
- 應該觀察哪些資訊。
- 如何清楚描述症狀。
- 下一步應做什麼。
- 應該聯絡誰。
- 如何用家屬能理解的語言通報。
- 日常照護紀錄如何結構化保存與追蹤。

系統必須協助完成：

1. 日常照護情況登錄與結構化保存。
2. 異常狀況描述。
3. AI 引導式資訊蒐集（Care Copilot）。
4. 緊急警訊辨識。
5. 照護風險分級。
6. 跨語言摘要。
7. 聯絡人智慧通報。
8. 事件紀錄與狀態同步。
9. 健康趨勢追蹤與 AI 提醒。
10. 結構化病歷摘要產生。

## 1.5 非診斷定位

CareBridge AI **不是醫療診斷工具**。

所有產品、介面、提示詞、API 回應與文件均不得暗示：

- 系統可以診斷疾病。
- AI 可以取代醫師、護理師或緊急醫療服務。
- AI 可以自行決定藥物開始、停止或修改。
- AI 產生的文字高於規則引擎或正式醫療指引。
- 資訊不足時可以推測為確定答案。

---

# 2. 競賽約束與決策優先順序

## 2.1 時間限制

- 開發時段：2026/8/1 09:00–18:00。
- 開發時段：2026/8/2 09:00–19:00。
- 2026/8/2 14:00 前必須完成提案提交。
- 提交物：提案大綱、完整提案簡報、Live Demo 部署網址、Live Demo 錄製影片連結、GitHub 連結（含完整原始碼）、使用者硬體說明（optional）。
- 簡報時間 6 分鐘。
- 評審問答 4 分鐘。
- 必須具備可實際操作的 Live Demo。
- 必須實際使用 Kiro。
- 核心流程必須呼叫 AWS 後端服務。
- 程式碼與完整 `.kiro` 資料夾必須上傳 GitHub。

## 2.2 決策排序

發生衝突時，依下列順序決策：

1. **醫療安全與不可誤導性**
2. **Live Demo 可完成、可操作、可恢復**
3. **P0 主流程完整**
4. **AWS 後端確實串接**
5. **資料正確保存與跨電腦同步**
6. **Kiro Specs、Steering、Hooks 可被評審看見並驗證**
7. **多語言與可用性**
8. **視覺精緻度**
9. **P1 加分功能**
10. **P2 賽後功能**

不得為了視覺效果犧牲資料正確性、安全性或核心流程。

## 2.3 禁止事項

競賽期間不得：

- 自行增加大型功能範圍。
- 建立無法驗證的複雜醫療 RAG。
- 訓練自有模型。
- 實作影像診斷。
- 實作完整醫院 HIS 串接。
- 實作完整醫療院所地圖。
- 開發原生 iOS 或 Android App。
- 讓靜態假資料冒充 AWS 成功回應。
- 使用 LocalStorage 作為跨電腦正式事件資料來源。
- 將秘密、Access Key、Token、密碼或憑證提交到 GitHub。
- 在 AI 資訊不足時假裝確定。
- 讓 Bedrock 推翻 deterministic rule engine。

---

# 3. 使用者、角色與權限

## 3.1 角色 A：照顧者

主要使用者可能是印尼、越南、菲律賓或其他外籍照護工作者。

照顧者需要：

- 使用熟悉的語言操作。
- 記錄每日照護情況（進食、用藥、睡眠、行動力、呼吸等）。
- 輸入或說出長者狀況。
- 使用 AI Care Copilot 取得情境式照護引導。
- 接受 AI 一次一題的引導。
- 知道當下應採取的行動。
- 將資訊通知聯絡人。
- 建立照護事件紀錄。
- 查看聯絡人的處理狀態。
- 查看健康趨勢與 AI 提醒。

## 3.2 角色 B：聯絡人

聯絡人可能是家屬、雇主、個管師或照護機構人員。

聯絡人需要：

- 接收異常通知。
- 查看照顧者原始輸入。
- 查看中文摘要。
- 理解風險等級與判斷原因。
- 看見已確認與未確認資訊。
- 確認下一步處理方式。
- 更新已讀、已聯絡、已安排評估等狀態。
- 查看歷史事件與趨勢。
- 查看結構化病歷摘要。
- 查看日常照護登錄紀錄。

## 3.3 角色規則

App 第一次開啟時必須選擇：

- 我是照顧者。
- 我是聯絡人。

角色會影響：

- 首頁內容。
- 可用操作。
- 通知的發送與接收。
- 事件可見內容。
- 狀態更新權限。
- 導覽項目與文字。

角色差異不得只存在於通知功能。

---

# 4. 競賽版功能分級

## 4.1 P0：Live Demo 不可缺少

P0 分為兩類：**必須 AWS 串接可操作**與**前端可展示為主（後端依進度決定）**。

### P0-A：必須 AWS 串接的核心流程

1. 選擇語言。
2. 選擇照顧者或聯絡人角色。
3. 建立家庭與最小長者資料。
4. 產生 Household Code（6 位英數字，不過期）。
5. 照顧者建立異常事件。
6. 原始事件寫入 DynamoDB。
7. Bedrock 擷取症狀與產生翻譯。
8. AI 一次只詢問一個關鍵問題。
9. 儲存使用者回答。
10. deterministic rule engine 辨識 red flags。
11. structured assessment 產生風險等級與下一步。
12. 顯示觸發原因、已確認事實、缺少資訊、行動與來源。
13. 產生跨語言摘要與 App 內通知。
14. 聯絡人用 Household Code 查看同一事件。
15. 聯絡人更新處理狀態（pending → read → contacted → scheduled → resolved）。
16. 照顧者端取得更新狀態。
17. AI Care Copilot 可互動對話（輸入 → AI 翻譯 → 回覆 → 追問）。
18. Copilot 對話歷史保存於 DynamoDB。
19. 手機與桌面均可操作（Chrome DevTools responsive 展示）。
20. GitHub 包含完整 `.kiro`。
21. README 足以讓新電腦完成設定與 Demo。

### P0-B：前端可展示為主（後端依進度決定）

22. 日常照護情況登錄（表單式：進食/用藥/睡眠/行動力/呼吸 + 可選欄位）。
23. 日常登錄 AI 監測提醒（組合異常時主動提醒啟動風險評估）。
24. Care Timeline 整合日常紀錄與異常事件。
25. 健康趨勢圖表（前端 mock 資料）+ AI 趨勢提醒文字（呼叫 Bedrock）。
26. 結構化病歷摘要（照護報告格式展示）。

### P0 策略說明

- P0-A 為 Demo 核心，必須真正呼叫 AWS 後端並可操作。
- P0-B 優先完成前端 UI 展示，後端串接依時間進度決定。
- 若 P0-B 後端未完成，前端可使用 mock 資料展示 UI，但不得偽裝 AWS 成功回應。
- 趨勢圖表使用前端 mock 資料；AI 趨勢提醒文字需呼叫 Bedrock。

### AI Care Copilot 定義

Care Copilot 是**情境感知的引導式照護助手**，不是開放式醫療問答聊天機器人。

定位：
- 基於當前照護情境提供觀察建議與下一步引導。
- 用照顧者的母語協助整理狀況。
- 提供安全的照護建議（如何觀察、何時升級、注意事項）。
- 絕對不可以提供專業醫療診斷。
- 對話有邊界：圍繞照護任務，而非自由醫療聊天。

互動規則：
- 獨立入口頁面（底部導覽）。
- 同時內嵌在事件流程中（如緊急通報等場景）。
- 對話歷史需保存。
- 競賽版先做獨立對話，不需感知日常登錄資料。
- 暫無專業醫療知識庫，先展示互動性（輸入 → 翻譯 → 回覆 → 追問）。
- 後續版本再接入專業知識庫（P2）。
- 根據專業醫療知識作為指引方向，但本身絕對不提供專業診斷。
- 加 Bedrock Guardrails 限制回答範圍。

### 日常照護登錄定義

照顧者每日記錄長者生活資訊，資料累積後用於趨勢分析與異常偵測。

必填欄位：
- 進食狀況（食量百分比）
- 用藥紀錄（是否服藥）
- 睡眠（時數）
- 行動力
- 呼吸狀態

可選欄位：
- 體重
- 情緒
- 排泄
- 體溫

登錄方式：
- 競賽版以表單式（逐欄填寫）為主。
- 自由文字 + AI 擷取依進度決定是否添加（P1）。

日常登錄 AI 監測：
- 當多項異常組合出現時，系統主動提醒照顧者啟動風險評估。
- 監測邏輯可在前端以簡單規則實現（競賽版），後續可移至後端。

## 4.2 P1：評分加分

在不危及 P0 的前提下才可實作：

- Amazon Translate 正式翻譯。
- Amazon Cognito 身份驗證。
- Amazon SNS 外部推播通知。
- Amazon S3 儲存醫療來源文件。
- Bedrock Knowledge Bases。
- 瀏覽器語音輸入。
- 日常登錄自由文字 + AI 擷取。
- 健康趨勢真實資料 aggregate（從 DailyLog 後端計算）。
- 社群功能接口示意（保留入口，不深入實作）。
- 更精緻的動畫、Skeleton 與圖表。
- 自動化程度更高的測試與部署。

## 4.3 P2：賽後功能

- 長照機構正式串接。
- 複雜預測模型。
- 正式醫療資料交換與 HIS 串接。
- 完整醫療院所地圖。
- 影像診斷。
- 自有模型訓練。
- 原生行動 App。
- 正式商用身份與權限架構。
- 大規模醫療知識庫與審核流程（Care Copilot 專業知識庫）。
- Care Copilot 感知日常登錄資料作為上下文。
- 照顧者社群與經驗分享。

## 4.4 Scope Freeze

一旦 P0 流程可運作，除阻斷 Demo 的錯誤外，不得變更：

- 核心 User Flow。
- DynamoDB 主資料模型。
- API 路徑。
- risk level 定義。
- Household Code 串接方式。
- Bedrock 的結構化輸出契約。
- clinical-rules.json schema。

最後一小時只能修復阻斷 Demo 的問題，不得新增功能。

---

# 5. 標準 Live Demo 劇本

## 5.1 輸入

照顧者選擇 Bahasa Indonesia，輸入：

> Pagi ini beliau tidak mau makan. Napasnya lebih cepat dan jalannya tidak stabil.

## 5.2 系統必須完成

1. 保存印尼文原文。
2. 保存原始語言 `id`。
3. 產生中文翻譯。
4. 擷取結構化症狀：
   - 食慾下降。
   - 呼吸急促。
   - 行走不穩。
5. 每次只詢問一個最影響風險判斷的問題。
6. 回答選項至少包含：
   - 是。
   - 否。
   - 不確定。
7. 根據確認資訊執行規則引擎與風險評估。
8. 顯示：
   - 已確認事實。
   - 尚未確認資訊。
   - 判斷原因。
   - 現在應做的事情。
   - 需要立即升級處理的警訊。
   - 指引來源。
   - 非醫療診斷聲明。
9. 產生中文通知。
10. 聯絡人在另一台電腦查看事件。
11. 聯絡人更新：
   - 已聯絡照顧者。
   - 已安排醫療評估。
12. 狀態同步回照顧者端。

## 5.3 Demo 資料規則

- 所有輸入欄位預設空白。
- 不得預填案例文字。
- 可使用 Placeholder，但不得把 Placeholder 當作實際送出資料。
- Timeline 只能顯示真正建立的事件。
- Trend Analysis 無足夠資料時顯示 Empty State。
- API 失敗時顯示可重試錯誤，不得顯示虛假成功。

---

# 6. 醫療安全與 AI 責任分層

## 6.1 三層判讀架構

### 第一層：Deterministic Red-Flag Rule Engine

負責不可被 AI 推翻的緊急警訊。

最低限度應支援：

- 無法喚醒。
- 意識明顯改變。
- 嚴重呼吸困難。
- 嘴唇或皮膚發青。
- 持續胸痛。
- 疑似中風 FAST 徵象。
- 大量出血。
- 跌倒後失去意識。
- 抽搐。
- 突然無法站立或行走。

補充慢性病相關規則（簡單示意）：

- 高血壓急性惡化（收縮壓 > 180 或舒張壓 > 120）。
- 血糖異常（嚴重低血糖症狀）。
- COPD 急性惡化（呼吸困難加劇 + 痰量增加）。
- 心律不整（脈搏明顯不規則 + 頭暈）。
- 糖尿病足部傷口感染徵象。

### 第二層：Structured Assessment Flow

負責：

- 根據事件類型決定問題順序。
- 找出缺少的關鍵資料。
- 每次選出最影響風險判斷的一題。
- 計算風險分級。
- 產生建議行動代碼。
- 連結可追蹤來源。
- 在資料不足時保留 `unknown`。

### 第三層：Bedrock Language Layer

只負責：

- 理解自然語言。
- 擷取結構化症狀。
- 翻譯。
- 將固定或結構化問題轉成使用者語言。
- 產生容易理解的摘要。
- 產生聯絡人通知文字。

## 6.2 Bedrock 禁止事項

Bedrock 不得：

- 產生疾病診斷。
- 自行建立數值門檻。
- 自行改寫風險等級定義。
- 推翻 red-flag rule engine。
- 建議開始、停止或修改處方藥。
- 將 `unknown` 解讀為否定。
- 在資訊不足時假裝確定。
- 產生沒有來源或無法對應規則的醫療結論。
- 一次輸出大量問題或冗長建議。

## 6.3 風險等級

系統僅使用以下值：

- `emergency`：立即尋求緊急協助。
- `urgent`：需要儘快專業評估。
- `attention`：建議當日或近期評估。
- `monitor`：目前可持續觀察。

不得新增同義但不同拼字的風險值。

## 6.4 風險結果必要欄位

每次評估結果必須包含：

- `riskLevel`
- `triggeredRules`
- 已確認事實
- `missingInformation`
- `recommendedActions`
- 升級警訊
- `sourceIds`
- 非醫療診斷聲明

## 6.5 clinical-rules.json 標準

每條規則至少包含：

- `ruleId`
- `title`
- `version`
- `conditions`
- `riskLevel`
- `actionCode`
- `sourceTitle`
- `sourceUrl`
- `publishedAt`
- `reviewedAt`
- `status`

修改規則檔時必須：

1. 通過 JSON Schema validation。
2. 確認風險值合法。
3. 確認來源欄位存在。
4. 確認 unknown 不會被誤判成 false。
5. 執行對應單元測試。
6. 由指定 Owner 審核。

---

# 7. AWS 最小技術架構

## 7.1 Frontend

- React。
- TypeScript。
- Vite。
- Responsive Web App / PWA。
- Mobile-first。
- AWS Amplify Hosting。
- GitHub push 後自動 Build 與 Deploy。

## 7.2 Backend

- Amazon API Gateway HTTP API。
- AWS Lambda。
- TypeScript。
- AWS SDK v3。
- Amazon DynamoDB。
- Amazon Bedrock Converse API（Claude Sonnet 4, `claude-sonnet-4-20250514`）。
- Amazon Bedrock Guardrails。
- Amazon CloudWatch Logs。

## 7.3 Infrastructure as Code

- 使用 AWS SAM。
- 所有 AWS 資源必須可從 repository 重新部署。
- 不得依賴未被記錄的手動 Console 設定。
- 正式部署由單一 Infrastructure Owner 執行。
- AWS Region、Stack Name、API URL 必須由環境變數控制。

## 7.4 第二優先 AWS 服務

只有 P0 穩定後才能加入：

- Amazon Translate。
- Amazon Cognito。
- Amazon SNS。
- Amazon S3。
- Bedrock Knowledge Bases。

## 7.5 降級方案

- Translate 未完成：由 Bedrock 翻譯，但保留原文。
- Cognito 未完成：使用一次性 Household Code 連接兩個角色。
- SNS 未完成：使用 DynamoDB 保存的 App 內通知。
- Knowledge Base 未完成：使用可測試的 `clinical-rules.json`。
- 語音辨識未完成：保留文字輸入；語音按鈕不得假裝成功。
- AWS API 暫時失敗：顯示 Retry 與 request ID，不得偽裝成功。
- AI 回應失敗：原始事件仍需保存，允許重新執行 extract 或 assessment。
- 外部通知失敗：App 內通知仍需可見。

---

# 8. API 作業標準

## 8.1 建議端點

```text
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

## 8.2 一致回應格式

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
    "message": "Localized or user-safe message",
    "retryable": true
  },
  "requestId": "string"
}
```

## 8.3 API 原則

- 每個回應必須包含 `requestId`。
- 前端不得直接顯示敏感的內部錯誤內容。
- Lambda 必須記錄 request ID 與必要診斷資訊。
- 不得在 log 中寫入秘密、完整憑證或不必要的個人資料。
- 輸入必須驗證。
- 不接受空白事件文字。
- Placeholder 不得成為送出內容。
- `unknown` 必須與 `false` 分開處理。
- 重複送出不得造成無法解釋的重複事件。
- 跨電腦資料一律讀寫 DynamoDB。
- API 失敗必須可在 UI 上辨識與重試。

---

# 9. 資料模型標準

## 9.1 Household

- `householdId`
- `joinCode`
- `createdAt`

## 9.2 ElderProfile

- `elderId`
- `householdId`
- `displayName`
- `age`
- `chronicConditions`
- `medications`
- `allergies`
- `baselineMobility`
- `baselineCognition`
- `createdAt`
- `updatedAt`

## 9.3 Incident

- `incidentId`
- `householdId`
- `elderId`
- `createdByRole`
- `originalLanguage`
- `originalText`
- `translatedText`
- `extractedSymptoms`
- `answers`
- `riskLevel`
- `triggeredRules`
- `missingInformation`
- `recommendedActions`
- `sourceIds`
- `status`
- `createdAt`
- `updatedAt`

## 9.4 Notification

- `notificationId`
- `householdId`
- `incidentId`
- `recipientRole`
- `title`
- `originalSummary`
- `translatedSummary`
- `readAt`
- `responseStatus`
- `createdAt`

## 9.5 DailyLog

- `logId`
- `householdId`
- `elderId`
- `date`（YYYY-MM-DD）
- `createdByRole`
- `meals`（食量百分比、備註）
- `medication`（是否服藥、備註）
- `sleep`（時數、品質）
- `mobility`（行動力評估）
- `breathing`（呼吸狀態）
- `weight`（可選）
- `mood`（可選）
- `excretion`（可選）
- `temperature`（可選）
- `notes`
- `aiAlertTriggered`（是否觸發 AI 監測提醒）
- `createdAt`
- `updatedAt`

## 9.6 Conversation（Care Copilot）

- `conversationId`
- `householdId`
- `elderId`
- `startedByRole`
- `language`
- `messages`（陣列：role, content, translatedContent, timestamp）
- `context`（embedded | standalone）
- `relatedIncidentId`（可選，內嵌時關聯的事件）
- `createdAt`
- `updatedAt`

## 9.7 資料規則

- 所有時間使用 ISO 8601。
- 未知資料使用 `unknown`。
- `unknown` 不得儲存為 `false`。
- 原始文字不得被翻譯內容覆蓋。
- 原始語言與中文翻譯必須同時保存。
- 結構化症狀必須與原始文字可追溯。
- 正式事件不得只存在瀏覽器。
- LocalStorage 只允許保存：
  - 當前語言。
  - 當前角色。
  - 未送出的表單草稿。
- Household Code 必須可讓另一台電腦讀取同一家庭事件。
- join code 不得直接作為 DynamoDB 主鍵暴露所有資料細節。
- 資料模型變更需更新：
  - TypeScript types。
  - API validation。
  - SAM 或 DynamoDB 設計。
  - Spec design。
  - 測試。
  - README。

---

# 10. Bedrock Prompt Contract

每個 Bedrock 呼叫都必須有明確、可測試的輸入與輸出契約。

## 10.1 症狀擷取輸入

至少包含：

- 原始文字。
- 原始語言。
- 可選長者基線資料。
- 允許的症狀欄位。
- 禁止診斷指令。
- JSON-only 輸出要求。

## 10.2 症狀擷取輸出

必須是可解析 JSON，至少包含：

```json
{
  "originalLanguage": "id",
  "translatedTextZhTW": "string",
  "symptoms": [
    {
      "code": "string",
      "label": "string",
      "status": "present | absent | unknown",
      "evidence": "string"
    }
  ],
  "uncertainties": ["string"]
}
```

## 10.3 逐題問答規則

- 每次只能回傳一題。
- 問題必須是目前最影響風險判斷的未確認資訊。
- 不得重複已回答問題。
- 必須提供結構化 question ID。
- 回答至少支援 `yes`、`no`、`unknown`。
- 問題顯示語言跟隨目前使用者語言。
- 風險計算不由語言模型自由決定。

## 10.4 通知文字規則

通知必須：

- 以已確認事實為基礎。
- 明確標示尚未確認資訊。
- 不使用診斷語氣。
- 不誇大或淡化風險。
- 與 rule engine 結果一致。
- 保留原始照顧者輸入的可追溯性。
- 內容簡短，適合手機閱讀。

## 10.5 AI 失敗處理

- JSON 無法解析時，不得直接當作成功。
- 允許有限次重試。
- 重試仍失敗時顯示可重試錯誤。
- 已保存的事件資料不得遺失。
- 不得用本機硬編碼假回應冒充 Bedrock 成功。

---

# 11. 前端、設計與可用性標準

## 11.1 視覺方向

- Human-centered。
- Warm。
- Trustworthy。
- Accessible。
- Social Innovation。
- Future Healthcare。
- 不像醫院後台。
- 不要科技感過重。

## 11.2 色彩

- Primary：`#6D8EA0`
- Accent：`#7FB685`
- Background：`#F7F8FA`
- Surface：`#FFFFFF`
- Warning：柔和橙色。
- Danger：只用於緊急狀態。

## 11.3 Responsive

- 手機基準寬度：390px。
- Mobile-first。
- 桌面版不得只是放大手機畫面。
- 長文字必須正常換行。
- 文字不得遮擋圖片、人物、按鈕或輸入區。
- 所有主要按鈕最小觸控尺寸 44px。

## 11.4 必要介面狀態

所有非同步功能必須設計：

- Loading。
- Skeleton Loading。
- Empty State。
- Error State。
- Retry。
- Success State。
- Disabled State。

不得只有成功狀態。

## 11.5 建議元件

- Bottom Navigation。
- Sticky Primary Action。
- Bottom Sheet。
- Toast。
- Dialog。

## 11.6 動畫

動畫只用於表達狀態變化：

- 頁面切換。
- AI 處理中。
- 問題出現。
- 評估完成。
- 通知成功。

必須支援 `prefers-reduced-motion`。

## 11.7 核心畫面

1. Language Selection。
2. Role Selection。
3. Elder Profile Setup。
4. Caregiver Home（含 AI 風險提醒卡片）。
5. Contact Home。
6. Daily Log（日常照護登錄表單）。
7. New Incident。
8. AI Assessment（逐題問答）。
9. Risk Result。
10. Notification Preview（智慧通報）。
11. Contact Notification Detail。
12. AI Care Copilot（獨立對話頁）。
13. Care Timeline（整合日常+事件）。
14. Health Trends（圖表 + AI 提醒）。
15. Structured Summary（病歷摘要）。
16. Settings。

---

# 12. i18n 作業標準

## 12.1 支援語言

- `zh-TW`：繁體中文。
- `en`：English。
- `id`：Bahasa Indonesia。
- `vi`：Tiếng Việt。

## 12.2 集中管理

前端必須使用集中式 i18n 字典。

不得在 React 元件中散落硬編碼的使用者可見文字。

## 12.3 必須隨語言切換的內容

- 導覽列。
- 頁面標題。
- 按鈕。
- 表單標籤。
- Placeholder。
- 選項。
- AI 提問。
- AI 回答。
- 風險結果。
- 通知。
- Toast。
- Dialog。
- Empty State。
- Error State。
- 圖表標籤。
- 日期格式。
- 無障礙文字。

## 12.4 翻譯完整性

新增或修改翻譯 key 時：

1. 四種語言必須同時存在。
2. CI 或 hook 必須檢查缺漏。
3. 不得以 key 本身作為正式顯示 fallback。
4. 醫療安全文字必須經人工檢視。
5. 原始使用者輸入不得因切換 UI 語言而改變。

---

# 13. Repository 標準結構

以下為建議結構，Kiro 可在不改變責任邊界的前提下微調：

```text
carebridge-ai/
├─ .kiro/
│  ├─ steering/
│  │  ├─ product.md
│  │  ├─ tech.md
│  │  ├─ design.md
│  │  ├─ medical-safety.md
│  │  └─ collaboration.md
│  ├─ specs/
│  │  └─ carebridge-mvp/
│  │     ├─ requirements.md
│  │     ├─ design.md
│  │     └─ tasks.md
│  └─ hooks/
├─ apps/
│  └─ web/
├─ services/
│  └─ api/
├─ packages/
│  ├─ shared-types/
│  ├─ i18n/
│  └─ clinical-rules/
├─ infrastructure/
│  ├─ template.yaml
│  └─ samconfig.toml.example
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ demo/
├─ docs/
│  ├─ architecture/
│  ├─ demo-runbook.md
│  └─ fallback-runbook.md
├─ .env.example
├─ .gitignore
├─ package.json
├─ README.md
└─ CAREBRIDGE_KIRO_MASTER_STANDARD.md
```

## 13.1 單一事實來源

- GitHub 是程式碼、Spec 與作業標準的唯一來源。
- `.kiro` 不得加入 `.gitignore`。
- 需求變更必須同步更新 Spec。
- 不得只在聊天中保留重要決策。
- 架構、資料模型與醫療規則變更必須寫入 repository。

---

# 14. Kiro Steering 建立標準

Kiro 在取得團隊確認後，建立以下檔案。

## 14.1 `.kiro/steering/product.md`

必須包含：

- 產品目標。
- 問題定義。
- 使用者與角色差異。
- 非診斷定位。
- P0 Demo 主流程。
- P0、P1、P2 邊界。
- Scope Freeze 原則。
- 評分策略。

## 14.2 `.kiro/steering/tech.md`

必須包含：

- React、TypeScript、Vite。
- AWS SAM。
- API Gateway、Lambda、DynamoDB、Bedrock。
- Repository 與程式結構。
- API 回應格式。
- TypeScript 型別規則。
- 錯誤處理。
- logging 與 request ID。
- 測試與部署要求。

## 14.3 `.kiro/steering/design.md`

必須包含：

- 色彩。
- 元件規範。
- 390px mobile-first。
- 44px 觸控尺寸。
- 響應式規則。
- i18n。
- Empty、Loading、Error、Success、Disabled。
- 無障礙。
- reduced motion。
- 長文字與投影畫面規則。

## 14.4 `.kiro/steering/medical-safety.md`

必須包含：

- Rule Engine 優先。
- 三層判讀架構。
- AI 禁止事項。
- risk level 固定值。
- unknown 處理。
- 來源追蹤。
- 非診斷聲明。
- 緊急狀況顯示。
- clinical-rules.json 變更流程。

## 14.5 `.kiro/steering/collaboration.md`

必須包含：

- Branch 規則。
- Pull Request 規則。
- Commit 規則。
- Secret 管理。
- 檔案 Owner。
- 不同電腦設定。
- AWS 權限。
- 正式部署責任。
- 衝突處理。
- Spec 與程式同步要求。

---

# 15. Kiro Spec 建立標準

建立：

```text
.kiro/specs/carebridge-mvp/
├─ requirements.md
├─ design.md
└─ tasks.md
```

## 15.1 requirements.md

必須使用：

- 可驗收 User Story。
- 明確 Acceptance Criteria。
- GIVEN / WHEN / THEN 或等價格式。
- P0、P1、P2 標記。
- 正常流程、錯誤流程與降級流程。
- 角色差異。
- i18n。
- 跨電腦同步。
- 醫療安全。
- 資料保存。
- Demo 完成標準。

Acceptance Criteria 不得使用：

- 「正常運作」。
- 「使用者體驗良好」。
- 「AI 回答正確」。
- 「畫面美觀」。

以上描述必須改寫成可測試條件。

## 15.2 design.md

必須包含：

- 系統架構。
- AWS 資源與資料流。
- User Flow。
- API。
- DynamoDB Schema。
- Bedrock Prompt Contract。
- Rule Engine。
- i18n。
- Error Handling。
- Deployment。
- Security。
- observability。
- 降級方案。
- 跨電腦同步方式。
- 不使用 LocalStorage 保存正式事件的說明。

## 15.3 tasks.md

Tasks 必須：

- 分為 P0、P1、P2。
- 依依賴關係排序。
- 每項可在短時間內完成與驗收。
- 標明 Owner 或 workstream。
- 標明驗收方式。
- 標明關聯 Requirement。
- 標明是否阻斷 Demo。
- 完成後更新狀態。
- 不得把大型功能寫成單一模糊任務。

每個 task 建議格式：

```markdown
- [ ] TASK-ID — 任務名稱
  - Priority: P0
  - Owner: backend
  - Depends on: TASK-XXX
  - Requirement: REQ-XXX
  - Deliverable:
  - Acceptance check:
  - Demo blocker: yes
```

---

# 16. Kiro Hooks 建立標準

建議建立下列 hooks 或等價自動化。

## 16.1 TypeScript 品質檢查

觸發：

- 儲存 TypeScript 檔案。
- Pull Request。
- Commit 前。

執行：

- lint。
- typecheck。
- 相關單元測試。

## 16.2 Spec Task 驗收

完成 Spec Task 時：

- 執行相關測試。
- 確認 Acceptance Criteria。
- 不通過時不得標記完成。

## 16.3 clinical-rules.json 驗證

修改規則檔時：

- JSON Schema validation。
- risk level enum validation。
- source metadata validation。
- rule unit tests。

## 16.4 Secret Scan

Commit 前檢查：

- AWS Access Key pattern。
- API Token。
- `.env`。
- `.env.local`。
- credentials。
- 私鑰。
- 資料庫密碼。

偵測到疑似秘密時阻擋 Commit。

## 16.5 i18n 完整性

修改翻譯 key 時：

- 檢查 `zh-TW`、`en`、`id`、`vi`。
- 檢查缺漏與多餘 key。
- 檢查元件中新增的硬編碼使用者文字。

---

# 17. 開發與程式品質標準

## 17.1 TypeScript

- 啟用 strict mode。
- 避免不必要的 `any`。
- API input/output 使用共享型別。
- 風險值、角色、語言、狀態使用 union 或 enum。
- 對外部輸入執行 runtime validation。
- 不在前端複製後端醫療風險邏輯。
- 不把 Bedrock 原始回應直接信任為型別安全資料。

## 17.2 元件與模組

- UI 元件與業務邏輯分離。
- Rule Engine 必須是可獨立測試的純邏輯模組。
- Bedrock adapter 與 assessment 邏輯分離。
- DynamoDB repository 與 Lambda handler 分離。
- i18n 資源集中。
- 共用型別不得在多處手動複製。
- 單一檔案不要承擔過多責任。

## 17.3 錯誤處理

每個外部依賴都必須考慮：

- timeout。
- 無效回應。
- 權限錯誤。
- 暫時性服務錯誤。
- 非預期資料。
- 重試。
- 使用者可理解的 fallback。

不得使用空的 catch block。

## 17.4 Logging

CloudWatch Logs 至少包含：

- request ID。
- endpoint 或 function 名稱。
- 執行結果。
- 錯誤代碼。
- duration。
- 必要的事件 ID。

不得記錄：

- AWS secret。
- Token。
- 完整憑證。
- 不必要的完整個資。
- 未遮罩的敏感內容。

---

# 18. 測試與驗收標準

## 18.1 最低測試範圍

### Unit Tests

- Rule Engine。
- risk level precedence。
- unknown handling。
- clinical rules schema。
- API input validation。
- Bedrock JSON parsing。
- i18n key completeness。

### Integration Tests

- 建立 household。
- 建立 incident。
- DynamoDB 保存與讀取。
- answer → next question。
- assess → risk result。
- notify → contact view。
- status update → caregiver view。

### Demo Smoke Test

每次合併到 `main` 前，至少驗證：

1. Amplify URL 可開啟。
2. 語言與角色可選。
3. 空白表單可自行輸入。
4. 可建立 household 與 elder。
5. 可取得 Household Code。
6. 可建立 incident。
7. DynamoDB 中可讀取事件。
8. Bedrock 可擷取症狀。
9. AI 一次只問一題。
10. Rule Engine 有結果。
11. 通知可建立。
12. 第二台裝置可加入。
13. 狀態更新可同步。
14. Timeline 可見。
15. API 失敗時不會顯示假成功。

## 18.2 測試資料

- 測試資料可存在 automated test fixture。
- 正式 Demo UI 不得預填測試案例。
- 測試資料不得包含真實個人敏感資訊。
- Demo 前應清理不需要的測試紀錄，保留可說明的乾淨狀態。

---

# 19. Git 與多人協作標準

## 19.1 Branches

- `main`：可展示、可部署版本。
- `dev`：整合版本。
- `feature/frontend`
- `feature/backend`
- `feature/ai-assessment`
- `feature/content-i18n`

如需更多分支，名稱仍應表達單一工作範圍。

## 19.2 標準流程

每位成員：

1. Clone 同一個 repository。
2. Checkout 自己的 feature branch。
3. 執行 `npm install` 或 `npm ci`。
4. 建立自己的 `.env.local`。
5. 使用自己的 IAM Identity 或主辦單位帳號。
6. 完成功能與測試。
7. Push feature branch。
8. 建立 Pull Request 到 `dev`。
9. 在 `dev` 執行整合測試。
10. 通過後合併到 `main`。
11. `main` push 觸發 Amplify 部署。

## 19.3 高衝突檔案 Owner

下列檔案必須指定單一 Owner：

- `package.json`
- lock file
- `template.yaml`
- 共用 i18n 檔
- DynamoDB Schema
- `clinical-rules.json`
- shared API types

其他成員若需修改，先通知 Owner。

## 19.4 Commit 規則

Commit 應：

- 單一目的。
- 可理解。
- 不混合無關重構。
- 不包含秘密。
- 關聯 task ID。
- 通過 lint、typecheck 與相關測試。

建議格式：

```text
type(scope): summary

Refs: TASK-ID
```

## 19.5 Pull Request 規則

PR 必須說明：

- 修改目的。
- 關聯 Requirement 與 Task。
- 主要檔案。
- 驗收方式。
- 截圖或 API 證據。
- 是否影響資料模型、API、醫療規則或 Demo。
- fallback 是否仍可用。

---

# 20. Secret、權限與部署安全

## 20.1 禁止提交

- AWS Access Key。
- Secret Access Key。
- Session Token。
- API Token。
- 資料庫密碼。
- `.env`。
- `.env.local`。
- credentials。
- 私鑰。
- 真實敏感資料。

## 20.2 必要檔案

- `.gitignore`
- `.env.example`

`.env.example` 只包含變數名稱與非敏感說明，不含真實值。

## 20.3 AWS 權限

- 每位成員使用自己的 IAM Identity。
- 優先使用暫時憑證或 IAM Identity Center。
- 不在聊天、GitHub 或群組貼 Access Key。
- AWS 資源使用同一 Account、Region 與 SAM Stack。
- 只有 Infrastructure Owner 執行正式 `sam deploy`。
- 其他成員使用已部署的 Dev API URL。

## 20.4 Amplify

- `main` 對應正式 Demo URL。
- `dev` 可對應測試 URL。
- GitHub push 自動 Build 與 Deploy。
- 部署失敗必須可從 build log 追蹤。
- Demo 前不得臨時依賴未提交的本機版本。

---

# 21. README 完成標準

README 必須包含：

- 專案簡介。
- 非醫療診斷聲明。
- Architecture overview。
- Repository 結構。
- 新電腦設定步驟。
- Node 與套件需求。
- 本機開發指令。
- AWS 登入方式。
- 環境變數。
- SAM build、local 與 deploy。
- Amplify 部署方式。
- Demo 操作流程。
- Household Code 跨電腦流程。
- 測試指令。
- 故障降級流程。
- Secret 管理。
- `.kiro` 說明。

新成員必須能只依 README 完成基本設定，不應依賴口頭說明。

---

# 22. 開發時程與 Gate

## Gate 1：基礎可部署，約 2 小時

- GitHub repository。
- 本主控規範。
- Kiro Steering。
- Kiro Spec。
- React 基礎架構。
- SAM 基礎架構。
- Amplify 初次部署。
- API health check。

通過條件：

- `main` 可部署。
- 前端可開啟。
- API health endpoint 可回應。
- `.kiro` 已提交。
- 無秘密。

## Gate 2：資料與跨電腦主流程，約 4 小時

- 語言與角色選擇。
- 建立長者資料。
- 建立事件。
- DynamoDB 儲存。
- Household Code。
- 照顧者與聯絡人跨電腦讀取。

通過條件：

- 第二台電腦可讀取同一家庭事件。
- 正式資料不依賴 LocalStorage。

## Gate 3：AI 與安全評估，約 3 小時

- Bedrock 症狀擷取。
- 翻譯。
- AI 逐題問答。
- Rule Engine。
- 風險結果。

通過條件：

- AI 一次一題。
- Rule Engine 優先。
- 結果可追蹤來源。
- unknown 正確處理。

## Gate 4：通知與完整體驗，約 2 小時

- 通知流程。
- Timeline。
- 四語系補齊。
- Loading、Error、Retry。

通過條件：

- 聯絡人可更新狀態。
- 照顧者可看到更新。
- 所有主要字串可切換四語。

## Gate 5：Demo QA，約 2 小時

- 手機 QA。
- 桌面與投影 QA。
- Live Demo 排練。
- AWS 架構圖。
- Demo 備援。
- README。
- 使用說明。

最後一小時：

- 只修阻斷 Demo 的問題。
- 不增加新功能。
- 不進行高風險重構。
- 不更換架構或資料模型。

---

# 23. 最大風險與預設降級方案

## 23.1 Bedrock 回應不穩定

風險：

- JSON 無法解析。
- 回應太慢。
- 問題一次輸出多題。
- 內容超出責任範圍。

降級：

- 強制結構化 prompt contract。
- schema validation。
- 有限重試。
- 使用固定 assessment question bank。
- Rule Engine 不依賴自由文字結論。
- 保留事件並允許重新執行。

## 23.2 跨電腦同步失敗

風險：

- 使用 LocalStorage。
- join code 查詢錯誤。
- DynamoDB key 設計不合適。
- 前端狀態未更新。

降級：

- P0 優先完成 DynamoDB 讀寫。
- 使用手動重新整理或短輪詢。
- 暫不導入 WebSocket。
- 保留 GET incident 與 status endpoint。

## 23.3 AWS 部署或權限失敗

風險：

- IAM 權限不足。
- Region 不一致。
- SAM stack 衝突。
- Amplify build 失敗。

降級：

- 單一 Infrastructure Owner。
- 固定 Account、Region、Stack。
- 先完成最小 health deployment。
- 保留已部署的穩定 main。
- 不在 Demo 前進行非必要資源變更。

## 23.4 多語言內容缺漏

風險：

- 元件硬編碼。
- 四語 key 不一致。
- AI 文字與 UI 語言不一致。

降級：

- 集中式 i18n。
- key completeness hook。
- P0 先保證核心流程四語完整。
- 次要頁面允許最小內容，但不得混雜未標示語言。

## 23.5 醫療安全或風險判定不可解釋

風險：

- LLM 自行決定 risk level。
- 無來源。
- unknown 被當成否。
- 結果看似診斷。

降級：

- deterministic rule engine。
- structured assessment。
- 固定風險值。
- 每個結果顯示 triggered rules 與 source IDs。
- 強制非診斷聲明。
- 無法安全判定時顯示缺少資訊，而不是猜測。

---

# 24. Definition of Done

## 24.1 一般 Task 完成條件

Task 只有在以下條件全部成立時才能標記完成：

- 符合相關 Requirement。
- Acceptance Criteria 可被驗證。
- 程式碼通過 typecheck。
- 程式碼通過 lint。
- 相關測試通過。
- 沒有提交秘密。
- 錯誤與 loading 狀態已處理。
- i18n key 完整。
- 需要時已更新 Spec 與 README。
- Demo blocker 狀態已確認。

## 24.2 P0 專案完成條件

- Amplify URL 可以開啟。
- 手機與桌面均可操作。
- 可切換四種語言。
- 可選照顧者或聯絡人。
- 所有輸入預設空白。
- 可建立家庭與長者。
- 可產生 Household Code。
- 可建立異常事件。
- 事件保存於 DynamoDB。
- Bedrock 可擷取症狀。
- AI 一次只問一題。
- Rule Engine 可產生風險結果。
- 結果包含原因、缺少資訊、下一步與來源。
- 可建立 App 內通知。
- 另一台電腦可用 Household Code 查看事件。
- 聯絡人更新狀態後，照顧者可以看到。
- Timeline 顯示真實事件。
- GitHub 包含完整 `.kiro`。
- GitHub 不包含任何秘密。
- README 可讓新電腦完成設定。
- Live Demo 失敗時有可說明的降級狀態。

---

# 25. Kiro 回覆與工作紀錄規則

Kiro 在每個開發階段應：

1. 先指出正在處理的 Spec Task。
2. 說明會修改哪些檔案。
3. 說明是否影響 API、資料模型、醫療規則或 Demo。
4. 完成後列出：
   - 修改摘要。
   - 測試結果。
   - 尚未完成事項。
   - 已知風險。
   - 下一個建議 Task。
5. 不得把未測試的內容描述為完成。
6. 不得把部分 stub 描述為完整 AWS 串接。
7. 不得隱藏 fallback 或暫時性限制。
8. 若發現規格衝突，先指出衝突並採用本文件的決策優先順序。
9. 重要決策必須更新至 Spec 或 Steering，不只留在對話中。

---

# 26. 團隊已確認決策

以下決策已於 2026-08-01 由團隊確認：

1. **團隊**：3 人，由 Kiro 生成分工建議，三人共同檢查。
2. **AWS Region**：`us-west-2`。Bedrock model：Claude Sonnet 4 (`claude-sonnet-4-20250514`)，已確認可用。
3. **Repository**：monorepo，`github.com/a22ne/aws_carebridge`。
4. **DynamoDB**：多表設計（Households、Incidents、DailyLogs、Notifications、Conversations）。
5. **Household Code**：6 位英數字，不過期。
6. **聯絡人狀態 enum**：`pending → read → contacted → scheduled → resolved`。
7. **clinical-rules.json**：從公信力機構找來源，無醫療背景成員審核。著重緊急情況 + 常見慢性病，10 項 red flags + 5-8 條慢性病規則。
8. **UI Prototype**：已確認，照 `https://a22ne.github.io/carebridge/` 風格走。原始碼位於 `carebridge-main/index.html`。
9. **Amplify**：尚未連接 GitHub，Gate 1 時設定。
10. **Demo 模式**：Chrome DevTools responsive 模式，一個視窗並排展示照顧者端與聯絡人端。
11. **Translate/Cognito/SNS**：P1，不危及 P0 才做。
12. **AWS 架構圖**：如果不麻煩可提供，非必要。
13. **Infrastructure Owner**：三人共同負責 `sam deploy`。
14. **Care Copilot**：情境式引導助手，獨立入口 + 內嵌事件流程，保存對話歷史，競賽版先獨立對話不感知日常資料。
15. **日常登錄**：表單式為主，P0 前端展示為主，後端依進度。
16. **健康趨勢**：前端 mock 資料展示圖表，AI 提醒文字呼叫 Bedrock。

---

# 27. 最終原則

CareBridge AI 的成功標準不是功能最多，而是：

- 問題情境清楚。
- 核心流程真正可操作。
- AWS 後端確實被使用。
- AI 的必要性明確，但責任邊界清楚。
- 醫療風險判定可解釋、可追蹤且不誤導。
- 兩個角色可以跨電腦協作。
- Kiro 的 Spec、Steering 與 Hooks 真正參與開發。
- 發生失敗時，系統誠實顯示狀態並有降級方案。
- 團隊可以在有限時間內穩定完成 Live Demo。

**未經團隊確認，不得偏離以上原則。**
