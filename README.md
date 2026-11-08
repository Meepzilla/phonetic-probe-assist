# Phonetic Probe Assist

Administer phonetic probes, record IPA transcriptions and error patterns, track phoneme coverage, and export session data.

Source code exported from Firebase Studio on 2026-11-07 as a backup. The Firebase App Hosting config and the local .env file were removed, and this repo contains no secrets and no Firebase project config.

## Run locally

Copy .env.example to .env and set GEMINI_API_KEY, then run npm install and npm run dev. The AI flows in src/ai run on the server and need that key.

## Cloudflare hosting

This is a Next.js app with server-side AI flows, so it deploys to Cloudflare Workers, not as a static site. The OpenNext Cloudflare adapter is installed. Run npm run deploy to build and deploy to Cloudflare Workers, or npm run preview to test the Worker locally. Set the key once with npx wrangler secret put GEMINI_API_KEY. Never commit the key.
