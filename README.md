# Reelmind — AI video editor starter kit

A working front-end for an AI-native video editor: upload → style pick →
simulated AI analysis (with a visible reasoning log) → results screen with
retention/hook scores, a timeline, edit rationale, and a chat panel that
refines the edit in plain language.

It's a **static site** — plain HTML/CSS/JS, no build step, no dependencies.
You can open `index.html` directly or deploy it in two minutes.

## What's real vs. simulated

Be clear-eyed about this before you show it to anyone:

| Feature | This repo |
|---|---|
| Upload flow, style selection, progress UI | Real, works today |
| Video playback in the results screen | **Real** — plays your actual uploaded file |
| Thumbnail grid | **Real** — frames captured from your actual video via `<canvas>`, click one to jump the player there |
| Aspect-ratio export previews (16:9 / 9:16 / 1:1) | **Real** — live CSS crop of your actual video, synced to the main player |
| Caption position/weight/color controls | **Real** — restyle the on-screen overlay live |
| Caption *text*, cut plan, retention/hook scores, edit rationale, B-roll suggestions, SEO titles | **Simulated** — scripted in `app.js`, not derived from your video's actual audio/content |
| Chat refinement | **Rule-based demo** — keyword matching in `app.js`, not a live model |
| Actual cutting, real transcription, color grading, rendering, server-side export | **Not implemented** — no video is uploaded or processed server-side |

So you can genuinely review your own footage — play it, scrub thumbnails
pulled from real frames, see it cropped for Shorts vs. YouTube — while the
*editing intelligence* (what to cut, what to say in captions, what score to
give it) is a scripted stand-in for the real pipeline. Below is the shortest
path from here to the real thing.

## Making it real

1. **Storage** — accept the upload into S3/R2/GCS instead of only reading it
   in-browser (`app.js` → `handleFile`).
2. **Transcription** — run [Whisper](https://github.com/openai/whisper) (or
   an API) on the audio track to get word-level timestamps.
3. **Cut planning** — send the transcript + your goal/style choices to an LLM
   (Claude, GPT, etc.) with a prompt that asks it to return a structured edit
   plan (JSON: keep/cut ranges, B-roll slots, subtitle style). Replace the
   scripted `ANALYSIS_STEPS` / `buildResults()` in `app.js` with a real call
   to your backend that returns this plan.
4. **Rendering** — execute the plan with [FFmpeg](https://ffmpeg.org/) (cuts,
   subtitle burn-in, color, audio ducking) on a server or queued worker
   (Celery/Temporal). This is the part that needs real compute — plan for
   GPU workers if you want fast turnaround on long footage.
5. **Chat refinement** — replace `respondToRefinement()` with a call to an
   LLM that receives the current edit plan + chat history + the user's
   message, and returns an updated plan (only touching what was asked). Feed
   that back into the renderer.
6. **Creator DNA** — when a user uploads reference videos, transcribe +
   analyze cut timing/subtitle style/music from them, store the profile
   (a small JSON doc is enough to start), and pass it into the edit-planning
   prompt for every future upload.

None of this needs to be built at once — the chat-refinement step alone
(LLM in, structured plan out, FFmpeg executes it) gets you to a genuinely
useful v1 faster than trying to build all eleven "agents" from the original
brief simultaneously.

## Deploy on GitHub Pages

1. Create a new GitHub repo and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Reelmind starter kit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo: **Settings → Pages → Source → Deploy from a branch → `main` /
   `/ (root)`** → Save.
3. Your site will be live at `https://<you>.github.io/<repo>/` within a
   minute or two.

A ready-made GitHub Actions workflow is included at
`.github/workflows/deploy.yml` if you'd rather deploy via Actions (useful
once you add a build step, e.g. if you migrate to a framework later).

## Local preview

No build step needed — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## File map

```
index.html   structure for landing page + the try-it workbench
styles.css   design system (colors, type, layout) — all custom, no framework
app.js       all interactivity: upload, simulated analysis, chat, scoring
```
