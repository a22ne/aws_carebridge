export const zhTW = {
  // App
  appName: 'CareBridge AI',
  appSubtitle: '照護協作平台',

  // Nav
  navHome: '首頁',
  navIncident: '事件',
  navCopilot: '助手',
  navTimeline: '紀錄',
  navTrend: '趨勢',

  // Language & Role
  selectLanguage: '選擇語言',
  selectRole: '選擇角色',
  roleCaregiver: '我是照顧者',
  roleContact: '我是聯絡人',

  // Home
  todayAttention: '今日需留意',
  mealIntake: '早餐食量',
  breathingStatus: '呼吸狀態',
  breathingFast: '偏急促',
  aiRiskReminder: 'AI 風險提醒',
  riskMidHigh: '中高風險',
  newIncident: '建立異常事件',
  quickNotify: '快速通報',

  // Incident
  incidentTitle: '建立異常事件',
  incidentDesc: '用你熟悉的方式描述狀況，CareBridge 會協助整理成可通報資訊。',
  voiceInput: '語音輸入',
  startAssess: '開始 AI 風險判讀',
  chipFall: '跌倒',
  chipFever: '發燒',
  chipAppetite: '食慾下降',
  chipBreathing: '呼吸異常',
  chipMental: '精神異常',
  chipOther: '其他',

  // Assessment
  assessmentTitle: 'AI 風險判讀',
  reset: '重來',

  // Copilot
  copilotTitle: 'AI 照護助手',
  copilotDesc: '可以用母語詢問照護問題。CareBridge 會提供安全建議，但不提供醫療診斷。',
  copilotHello: '你好，我可以協助你整理狀況、判斷風險並準備通報。你想問什麼？',
  copilotPlaceholder: '輸入問題...',
  disclaimer: 'CareBridge AI 不是醫療診斷工具。如出現急性惡化或生命危險，請立即聯絡當地緊急服務或醫療專業人員。',

  // Notification
  notifyTitle: '智慧通報',
  notifyDesc: 'AI 已整理成家屬與長照窗口可以快速理解的摘要。',
  summaryTitle: '目前狀況摘要',
  symptoms: '症狀',
  risk: '風險',
  suggest: '建議',
  family: '家屬',
  careOrg: '長照機構',
  caseManager: '個管師',
  notifyPreview: '通知預覽',
  sendNotify: '送出通知',
  notifySent: '通知已送出',
  notifySentBody: '家屬、長照機構與個管師已收到 AI 摘要。',

  // Timeline
  timelineTitle: '照護紀錄',
  timelineDesc: '把日常照護轉成長期可追蹤的脈絡。',
  filterAll: '全部',
  filterDiet: '飲食',
  filterMeds: '用藥',
  filterSleep: '睡眠',
  filterEvent: '健康事件',

  // Trends
  trendTitle: '健康趨勢',
  trendDesc: 'AI 分析近兩週資料，找出不容易被單日觀察發現的變化。',
  trendAlert: 'AI 趨勢提醒',
  food: '食量',
  sleep: '睡眠',
  weight: '體重',

  // Daily Log
  dailyLogTitle: '日常照護登錄',
  mealPercentage: '進食量 (%)',
  medicationTaken: '是否服藥',
  sleepHours: '睡眠時數',
  mobility: '行動力',
  breathing: '呼吸',
  logSave: '儲存紀錄',

  // Status
  statusPending: '待處理',
  statusRead: '已讀',
  statusContacted: '已聯絡',
  statusScheduled: '已安排評估',
  statusResolved: '已處理',

  // Common
  backHome: '回到首頁',
  retry: '重試',
  loading: '載入中...',
  error: '發生錯誤',
  save: '儲存',
  cancel: '取消',
  confirm: '確認',
  yes: '是',
  no: '否',
  unknown: '不確定',
} as const;
