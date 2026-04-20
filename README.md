# Landingpage Roaster

Savage but useful landing page feedback in seconds.

## Links
- Repo: https://github.com/patpatwithhat/landingpage-roaster
- Production: https://roaster.patpatwithhat.xyz
- Fallback Vercel URL: https://landingpage-roaster-i9na6xewu-patpatwithhats-projects.vercel.app

## Current scope
- homepage URL input
- OpenAI-backed landing page analysis
- clarity / CTA / trust / SEO scoring
- neutral analysis core with swappable output tones
- suggested fixes and rewrite ideas

## Project identity
- Prefix: `LPR`
- Central secret location: `~/.openclaw/.env`
- Reserved env keys for this project start with `LPR_`
- Supabase uses the new key naming: `PUBLISHABLE` and `SECRET`

## Local development

```bash
npm install
export LPR_OPENAI_API_KEY=...
npm run dev
```

Then open `http://localhost:3000`.

## Notes
This is an early prototype. The current version focuses on a clean product loop first, then deeper analysis later.
