# 智學AI — Project Context

HK AI literacy app for kids 10-13, Duolingo-style, Traditional Chinese.

## Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Vercel

## Key decisions
- Anonymous UUID from first visit, attaches to Google account on login
- Google Sheets as CMS, sync script pushes to Supabase
- Mobile-first responsive webapp, native app later with Expo
- All UI in Traditional Chinese (zh-HK)

## Supabase tables
users, user_stats, user_progress, user_answers, units, chapters, questions, question_options, anonymous_sessions

## Current status
- MVP mockup phase — UI scaffold with mock data, no real backend yet
