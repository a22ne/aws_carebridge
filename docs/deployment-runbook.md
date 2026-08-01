# CareBridge AI — Deployment Runbook

## Prerequisites

- Node.js >= 22
- AWS CLI configured (`us-west-2`, valid credentials)
- AWS SAM CLI installed
- GitHub repo: `a22ne/aws_carebridge`

## Step 1: Backend Deploy (SAM)

```bash
cd infrastructure
cp samconfig.toml.example samconfig.toml
# Edit samconfig.toml if needed (stack_name, region, parameter_overrides)

sam build
sam deploy
```

### After deploy, note the outputs:

```bash
aws cloudformation describe-stacks --stack-name carebridge-ai --query "Stacks[0].Outputs" --output table
```

Key outputs:
- `ApiBaseUrl` — The API Gateway URL (e.g. `https://abc123.execute-api.us-west-2.amazonaws.com/prod`)
- Table names (for verification)

### Backend Smoke Test

```bash
curl https://<ApiBaseUrl>/health
```

Expected: `{ "success": true, "data": { "service": "CareBridge AI API", ... }, "requestId": "..." }`

## Step 2: Bedrock Guardrail

### Option A: SAM-managed (preferred)

If Guardrail is defined in `template.yaml`, it deploys automatically with `sam deploy`.

### Option B: Console fallback (competition)

If CloudFormation Guardrail support has issues:

1. Go to **Amazon Bedrock** → **Guardrails** → **Create guardrail**
2. Name: `CareBridge-CopilotGuardrail`
3. Configure:
   - **Content filters**: Block HIGH severity for hate, insults, sexual, violence
   - **Denied topics**: Add topic "Medical Diagnosis" with definition: "Any content that provides specific disease diagnosis, prescribes medication, or claims to replace professional medical judgment"
   - **Sensitive information**: Redact PII (names, addresses, phone numbers)
   - **Blocked messaging**:
     - Input: "I can only help with care guidance, not medical diagnosis."
     - Output: "This response was filtered for safety. Please consult a medical professional for diagnosis."
4. Create version
5. Copy **Guardrail ID** and **Version**
6. Update SAM deploy:

```bash
sam deploy --parameter-overrides "BedrockGuardrailId=<id> BedrockGuardrailVersion=<version>"
```

## Step 3: Amplify Frontend Deploy

### First time setup:

1. Go to **AWS Amplify** Console → **Create new app**
2. Connect to GitHub → `a22ne/aws_carebridge`
3. Branch: `main`
4. Amplify should detect `amplify.yml` in repo root
5. If monorepo app root is not auto-detected, set:
   - **App root**: `apps/web`
   - Or set environment variable: `AMPLIFY_MONOREPO_APP_ROOT=apps/web`
6. Add environment variable:
   - `VITE_API_BASE_URL` = `<ApiBaseUrl from Step 1>`
7. Save and deploy

### Verify:

- Amplify URL opens
- Language selection works
- Navigate to `/copilot` directly → does NOT 404 (SPA rewrite working)
- Open browser DevTools Network tab → API calls go to correct URL, no CORS errors

## Step 4: CORS Update (if not using wildcard)

If restricting CORS to Amplify URL only:

```bash
sam deploy --parameter-overrides "AllowedOrigins=https://main.d1234.amplifyapp.com"
```

## Step 5: Full Smoke Test

Run through in order:

1. ✅ Amplify URL opens
2. ✅ Select language (zh-TW / en / id / vi)
3. ✅ Select role (caregiver)
4. ✅ Create household + elder profile → API returns householdId + joinCode
5. ✅ Note the Household Code
6. ✅ Create incident with Indonesian text
7. ✅ Bedrock extraction returns structured symptoms + translation
8. ✅ AI asks one question at a time
9. ✅ Rule Engine returns risk result with triggered rules
10. ✅ Notification created
11. ✅ Open second browser window → select Contact role → enter Household Code
12. ✅ Contact sees incident + notification
13. ✅ Contact updates status → Caregiver refresh sees updated status
14. ✅ Care Copilot: send message → get response
15. ✅ Care Copilot: send diagnostic-seeking prompt → Guardrail blocks safely
16. ✅ Timeline shows entries
17. ✅ Trends page renders

### Logging verification:

```bash
aws logs filter-log-events --log-group-name /aws/lambda/carebridge-ai-HealthFunction-xxx --query "events[].message"
```

Confirm:
- ✅ requestId present
- ✅ No AWS credentials in logs
- ✅ No unnecessary PII

## Rollback

If deployment breaks Demo:

1. Do NOT delete the stack
2. Revert `main` to last known good commit
3. Amplify auto-redeploys from reverted main
4. For backend: `sam deploy` with previous parameters

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Check `AllowedOrigins` parameter matches Amplify URL |
| Bedrock permission denied | Check Lambda role has `bedrock:InvokeModel` permission |
| Guardrail not applying | Verify `BEDROCK_GUARDRAIL_ID` and `BEDROCK_GUARDRAIL_VERSION` env vars |
| Amplify build fails | Check `amplify.yml` appRoot and install commands |
| React Router 404 | Verify SPA rewrite rule in `amplify.yml` |
| API URL undefined in frontend | Set `VITE_API_BASE_URL` in Amplify environment variables |
| `sam build` fails | Ensure Node.js >= 22 installed locally |
