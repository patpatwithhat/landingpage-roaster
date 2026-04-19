# NoxConfig

```yaml
version: 1

project:
  id: lpr
  name: landingpage-roaster
  repo_root: /home/openclaw/.openclaw/workspace/landingpage-roaster
  key_prefix: LPR
  production_url: https://landingpage-roaster.patpatwithhat.xyz

github:
  repo: patpatwithhat/landingpage-roaster
  default_branch: main

chat:
  discord_channel: landingpage-roaster
  telegram_tag: lpr

agents:
  builder:
    runtime: acp
    agent: codex
    session_name: lpr-builder-codex
  reviewer:
    runtime: acp
    agent: codex
    session_name: lpr-reviewer-codex

workflow:
  review_required: true
  close_issue_on_merge: true
  auto_merge: false

preview:
  enabled: true
  provider: vercel
  mode: production

issue_creation:
  default_labels: []
  default_assignees: []

communication:
  style: caveman

integrations:
  env_prefix: LPR
  env_location: /home/openclaw/.openclaw/.env
  openai_key: LPR_OPENAI_API_KEY
  supabase_url: LPR_SUPABASE_URL
  supabase_publishable_key: LPR_SUPABASE_PUBLISHABLE_KEY
  supabase_secret_key: LPR_SUPABASE_SECRET_KEY
  redis_url: LPR_UPSTASH_REDIS_REST_URL
  redis_token: LPR_UPSTASH_REDIS_REST_TOKEN

product:
  tone: sharp, playful, useful, weird
  goal: savage but actionable landing page audits in seconds
  current_phase: prototype
  priority_1: real analyzer light
  priority_2: deployable demo
  priority_3: improve personality and brand
  priority_4: optional auth and usage limits
  priority_5: optional paid features
```
