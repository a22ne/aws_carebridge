# CareBridge AI

**AI Cross-Language Care Coordination Platform**  
AI 跨語言照護協作平台

> CareBridge AI 不是醫療診斷工具。所有 AI 輸出為照護引導，不取代醫護人員專業判斷。

## Overview

當照顧者不知道下一步該怎麼做時，CareBridge AI 提供：
- 日常照護結構化記錄
- 異常事件 AI 風險評估
- AI Care Copilot 情境式引導
- 跨語言智慧通報
- 健康趨勢追蹤

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **AI**: Amazon Bedrock (Claude Sonnet 4)
- **Infrastructure**: AWS SAM
- **Hosting**: AWS Amplify

## Quick Start

### Prerequisites

- Node.js >= 22
- AWS CLI configured (`us-west-2`)
- AWS SAM CLI
- Git

### Setup

```bash
# Clone
git clone https://github.com/a22ne/aws_carebridge.git
cd aws_carebridge

# Install dependencies
npm install

# Create local env
cp .env.example .env.local
# Edit .env.local with your API URL

# Start frontend dev server
npm run dev
```

### Backend Deploy

```bash
# Build API
npm run build:api

# Deploy infrastructure
cd infrastructure
cp samconfig.toml.example samconfig.toml
# Edit samconfig.toml
sam build
sam deploy
```

### After Deploy

1. Copy the API URL from SAM output (`ApiBaseUrl`)
2. Update `VITE_API_BASE_URL` in `.env.local`
3. Update Amplify environment variables (`VITE_API_BASE_URL`)

## Repository Structure

```
aws_carebridge/
├─ .kiro/              # Kiro Steering, Specs, Hooks
├─ apps/web/           # React frontend
├─ services/api/       # Lambda backend
├─ packages/
│  ├─ shared-types/    # TypeScript interfaces
│  ├─ i18n/            # 4-language translations
│  └─ clinical-rules/  # Medical rule engine
├─ infrastructure/     # AWS SAM template
└─ docs/               # Architecture docs
```

## Demo

- **Live URL**: https://main.d2sggyq42el3f6.amplifyapp.com
- **API URL**: https://hmlwdwot6i.execute-api.us-west-2.amazonaws.com/prod
- **Caregiver flow**: Language → Role → Create Household → Daily Log → New Incident → AI Assessment → Notify
- **Contact flow**: Language → Role → Join with Code → View Notifications → Update Status

Demo mode: Chrome DevTools responsive, two devices side-by-side.

## Competition

AWS Hackathon 2026 | Team: ProllyWorks | Built with Kiro AI IDE

## License

Competition use only.
