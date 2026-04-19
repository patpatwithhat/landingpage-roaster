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
  reserved_keys:
    - LPR_OPENAI_API_KEY
    - LPR_SUPABASE_URL
    - LPR_SUPABASE_PUBLISHABLE_KEY
    - LPR_SUPABASE_SECRET_KEY
    - LPR_UPSTASH_REDIS_REST_URL
    - LPR_UPSTASH_REDIS_REST_TOKEN

product:
  tone:
    - sharp
    - playful
    - useful
    - weird
  goal: savage but actionable landing page audits in seconds
  current_phase: prototype
  priorities:
    - real analyzer light
    - deployable demo
    - improve personality and brand
    - optional auth and usage limits
    - optional paid features
```
