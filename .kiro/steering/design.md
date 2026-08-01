---
inclusion: always
---

# CareBridge AI — Design Steering

## 視覺方向

Human-centered, warm, trustworthy, accessible, social innovation, future healthcare.
不像醫院後台，不要科技感過重。

參考 prototype: https://a22ne.github.io/carebridge/

## 色彩系統

```css
:root {
  --primary: #6D8EA0;       /* 主色 */
  --primary-dark: #456B7E;  /* 深主色 */
  --accent: #7FB685;        /* 強調色 */
  --accent-surface: #E8F4EA;/* 強調底色 */
  --background: #F7F8FA;    /* 背景 */
  --surface: #FFFFFF;       /* 卡片底色 */
  --ink: #17303C;           /* 文字主色 */
  --muted: #6B7F89;         /* 次要文字 */
  --line: #E2E9ED;          /* 邊框 */
  --warning: #E8B762;       /* 警告（柔和橙） */
  --danger: reserved;       /* 只用於 emergency 風險等級 */
}
```

## Responsive 規則

- Mobile-first，基準寬度 390px
- 桌面版不得只是放大手機畫面
- 所有主要按鈕最小觸控尺寸 44px
- 長文字必須正常換行
- 文字不得遮擋按鈕或輸入區
- Demo 投影需考慮字體大小與對比度

## 元件規範

- Bottom Navigation（5 項：首頁/事件/AI助手/紀錄/趨勢）
- Card 圓角 22px，陰影 `0 10px 28px rgba(39,65,76,.07)`
- Button 圓角 18px
- Primary button: `background: var(--primary); color: #fff`
- Secondary button: `background: var(--accent-surface); color: #367A52`
- Ghost button: `background: #fff; border: 1px solid var(--line)`
- Toast notification
- Bottom Sheet
- Dialog / Overlay

## 必要介面狀態

所有非同步功能必須設計：
1. Loading（含 Skeleton）
2. Empty State
3. Error State + Retry
4. Success State
5. Disabled State

不得只有成功狀態。

## 動畫

動畫只用於表達狀態變化：頁面切換、AI 處理中、問題出現、評估完成、通知成功。
必須支援 `prefers-reduced-motion`。

## i18n

四語系：`zh-TW` / `en` / `id` / `vi`

規則：
- 使用集中式 i18n 字典（不得在元件中硬編碼文字）
- 新增 key 時四語必須同時存在
- 不得以 key 本身作為 fallback 顯示
- 原始使用者輸入不得因切換 UI 語言而改變
- 醫療安全文字須經人工檢視
- 日期格式隨語言切換

## 核心畫面清單

1. Language Selection
2. Role Selection
3. Elder Profile Setup
4. Caregiver Home（含 AI 風險提醒卡片）
5. Contact Home
6. Daily Log（日常照護登錄表單）
7. New Incident
8. AI Assessment（逐題問答）
9. Risk Result
10. Notification Preview（智慧通報）
11. Contact Notification Detail
12. AI Care Copilot（獨立對話頁）
13. Care Timeline（整合日常+事件）
14. Health Trends（圖表 + AI 提醒）
15. Structured Summary（病歷摘要）
16. Settings

## 無障礙

- 足夠色彩對比（WCAG AA）
- 語義化 HTML
- ARIA labels
- 鍵盤可操作
- 投影場景考慮放大字體
