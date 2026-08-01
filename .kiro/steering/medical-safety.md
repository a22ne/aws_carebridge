---
inclusion: always
---

# CareBridge AI — Medical Safety Steering

## 三層判讀架構

### 第一層：Deterministic Red-Flag Rule Engine

不可被 AI 推翻的緊急警訊。規則定義在 `clinical-rules.json`。

緊急情況 Red Flags：
- 無法喚醒
- 意識明顯改變
- 嚴重呼吸困難
- 嘴唇或皮膚發青
- 持續胸痛
- 疑似中風 FAST 徵象
- 大量出血
- 跌倒後失去意識
- 抽搐
- 突然無法站立或行走

慢性病相關規則（簡單示意）：
- 高血壓急性惡化（收縮壓 > 180 或舒張壓 > 120）
- 血糖異常（嚴重低血糖症狀）
- COPD 急性惡化（呼吸困難加劇 + 痰量增加）
- 心律不整（脈搏明顯不規則 + 頭暈）
- 糖尿病足部傷口感染徵象

### 第二層：Structured Assessment Flow

- 根據事件類型決定問題順序
- 找出缺少的關鍵資料
- 每次選出最影響風險判斷的一題
- 計算風險分級
- 產生建議行動代碼
- 連結可追蹤來源
- 資料不足時保留 `unknown`

### 第三層：Bedrock Language Layer

只負責：
- 理解自然語言
- 擷取結構化症狀
- 翻譯
- 將固定問題轉成使用者語言
- 產生易理解的摘要
- 產生通知文字
- Care Copilot 對話回覆

## AI 禁止事項

Bedrock 不得：
- 產生疾病診斷
- 自行建立數值門檻
- 改寫風險等級定義
- 推翻 red-flag rule engine
- 建議開始/停止/修改處方藥
- 將 `unknown` 解讀為否定
- 資訊不足時假裝確定
- 產生無來源的醫療結論
- 一次輸出多題或冗長建議

## Care Copilot 安全邊界

Care Copilot 根據專業醫療知識作為指引方向，但**絕對不提供專業診斷**。

可以做：
- 提供觀察建議（觀察什麼、多久觀察一次）
- 建議何時應升級（聯絡家屬、就醫）
- 解釋 AI 風險評估的結果
- 協助整理狀況描述
- 翻譯照護相關概念

不可以做：
- 說「這是 XX 疾病」
- 建議用藥
- 否定就醫必要性
- 替代 119 或急診
- 資訊不足時給確定性結論

每次 Copilot 回覆後，UI 必須可見非診斷聲明。

## 風險等級

固定值（不得新增同義不同拼字）：
- `emergency`：立即尋求緊急協助
- `urgent`：需要儘快專業評估
- `attention`：建議當日或近期評估
- `monitor`：目前可持續觀察

## 風險結果必要欄位

每次評估必須包含：
- `riskLevel`
- `triggeredRules`
- 已確認事實
- `missingInformation`
- `recommendedActions`
- 升級警訊
- `sourceIds`
- 非醫療診斷聲明

## `unknown` 處理

- `unknown` 不得儲存為 `false`
- `unknown` 不得被 AI 解讀為否定
- 顯示時明確標示為「尚未確認」
- 風險計算中 `unknown` 傾向保守（不降級）

## clinical-rules.json 變更流程

修改規則檔時必須：
1. 通過 JSON Schema validation
2. 確認風險值合法（只能是四個 enum 值）
3. 確認來源欄位存在（sourceTitle, sourceUrl）
4. 確認 unknown 不會被誤判成 false
5. 執行規則單元測試

規則來源：從公信力機構找，著重緊急情況與常見慢性病。

## 非診斷聲明

所有風險結果頁面、Copilot 回覆、通知文字必須包含類似：

> CareBridge AI 不是醫療診斷工具。如出現急性惡化或生命危險，請立即聯絡當地緊急服務或醫療專業人員。

## 緊急狀況顯示

當 `riskLevel === 'emergency'` 時：
- 最顯眼的視覺提示（danger 色彩）
- 明確的「立即撥打急救電話」指引
- 不得被其他 UI 元素遮擋
- 不等待 AI 回覆完成
