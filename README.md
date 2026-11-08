# Phonetic Probe Assist

Administer phonetic probes, record IPA transcriptions and error patterns, track phoneme coverage, and export session data.

Source code exported from Firebase Studio on 2026-11-07 as a backup. The Firebase App Hosting config and the local .env file were removed, and this repo contains no secrets and no Firebase project config.

## Run locally

Run npm install and npm run dev. No API key or secret is needed. The AI features have been removed, so dialect adaptation and per-word image generation are no longer available.

## Cloudflare hosting

This is a Next.js app, so it deploys to Cloudflare Workers, not as a static site. The OpenNext Cloudflare adapter is installed. Run npm run deploy to build and deploy to Cloudflare Workers, or npm run preview to test the Worker locally. No API key or secret is needed.
