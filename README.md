# AFTERFRAME

AFTERFRAME is a local-first Video.js v10 player built with React, Vite, and an optional Electron desktop shell. Local videos stay on the device. The optional Supabase setup is for account-backed metadata only; this app does not upload video files.

## Run locally

```sh
npm install
npm run dev
```

Build the browser app with `npm run build`. Run the Electron desktop app with `npm run desktop:dev` during development or `npm run desktop` for a production build.

## Deploy to Vercel

Import this repository in Vercel. The included `vercel.json` uses `npm run build` and publishes `dist`. Vercel can build preview deployments from branches and production deployments from the configured production branch.

If you later enable Supabase features, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Vercel project's Environment Variables for the environments that need them. These are public client settings; never put a Supabase secret or service-role key in a `VITE_` variable.

## Optional Supabase setup

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
2. Apply `supabase/migrations/20261113000000_create_video_progress.sql` to your Supabase project.
3. Import `supabase` from `src/lib/supabaseClient.js` in the feature that needs it. It is `null` when the optional variables are absent, so local playback works without a Supabase project.

The migration creates an RLS-protected table for per-user progress metadata. It intentionally has no video path or file-content columns. The app currently does not provide sign-in or cloud sync; the client and schema are foundations for adding those features.
