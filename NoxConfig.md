# NoxConfig.md

## Project
- Name: landingpage-roaster
- Type: web app
- Status: prototype
- Repo: https://github.com/patpatwithhat/landingpage-roaster
- Production: https://landingpage-roaster.patpatwithhat.xyz

## Goal
Build a lightweight tool that roasts landing pages and gives useful feedback on:
- clarity
- CTA quality
- trust signals
- SEO basics

The first milestone is a simple homepage flow:
- user submits a URL
- app analyzes the page
- app returns a structured verdict with scores, problems, and fixes

## Product Direction
Tone:
- sharp
- playful
- useful
- a little weird
- never uselessly mean

Core promise:
- savage but actionable landing page audits in seconds

## MVP Scope
Include:
- homepage URL input
- simple fetch/analyze flow
- clarity score
- CTA score
- trust score
- SEO quick audit
- suggested fixes
- rewritten hero/CTA suggestions

Do not include yet:
- auth
- billing
- multi-page crawling
- team accounts
- saved reports
- PDF export
- deep SEO crawler

## Workflow
Preferred build loop:
1. keep scope small
2. ship thin vertical slices
3. verify UX quickly
4. only then deepen analysis quality

## Agents
### Builder
- implements the smallest useful next slice
- prefers simple code over abstractions too early

### Reviewer
- checks correctness
- checks UX clarity
- checks that output is actually useful, not generic AI sludge

## Priorities
Current order:
1. real analyzer light
2. deployable demo
3. improve personality / brand
4. optional auth / usage limits
5. optional paid features

## Guardrails
- If this file is missing, Nox should do nothing except report that the project is not configured.
- Prefer concrete progress over speculative architecture.
- Avoid overengineering early.
- Keep outputs easy to demo and easy to explain.
