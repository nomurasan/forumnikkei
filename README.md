<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3254a6d8-da92-4dff-94d0-f1ac44343263

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure the server-only AI variables in `.env.local` (never prefix the keys with `VITE_`):
   - Gemini: `AI_PROVIDER=gemini` and `GEMINI_API_KEY=...`
   - OpenAI: `AI_PROVIDER=openai` and `OPENAI_API_KEY=...`
3. Run the app:
   `npm run dev`

In Easypanel, configure the same variables in the application environment. The browser calls only `POST /api/ai/improve`; provider keys are read exclusively by the Node/Express server.
