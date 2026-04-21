# SpeakLoop 🪄

> Drop an mp3, auto-split into sentences, loop each one N times. Browser-based English speaking practice — no API key, no account, no server.

[한국어 README](./README.ko.md)

![SpeakLoop](./docs/screenshot.png)

A browser-only shadowing player for mp3 audio. Inspired by Natural Reader and Speechify, but with one feature they don't have: **per-sentence repeat counts with auto-advance**, so you can drill a sentence 5 times and move on without touching the mouse.

## What it's good for

Anything you can hand to it as an mp3 becomes a shadowing drill:

- **OPIc / TOEFL speaking practice** — record or generate your answer, then loop each sentence until it's automatic
- **Interview answers** — drill memorized responses one sentence at a time
- **Textbook / podcast excerpts** — paste a clip in and shadow through it
- **TTS output** (ElevenLabs, OpenAI TTS, Edge TTS, etc.) — turn a script you wrote into a loopable practice track

Transcription happens locally in your browser via [Whisper](https://openai.com/research/whisper) running on [🤗 Transformers.js](https://github.com/huggingface/transformers.js), so your audio never leaves the tab.

## Features

- **Auto sentence splitting** — Whisper transcribes and chunks the audio with accurate timestamps.
- **Per-sentence repeat** — 1× / 2× / 3× / 5× / 10× / ∞ in one click.
- **Auto-advance** — after N repeats, move to the next sentence automatically.
- **Now Reading panel** — current sentence displayed large with progress bar and word highlight.
- **Record & A/B compare** — capture your take per sentence and play it back against the original; recordings persist in IndexedDB.
- **Daily timer** — once-a-day study timer pinned below the header. Live HH:MM counter while running; once you end today's session it stays locked until local midnight so tomorrow feels like a fresh start.
- **Speed & gap control** — 0.5×–2× speed, 0–2s silence between repeats for shadowing.
- **100% local** — audio never leaves your machine. No backend, no API key.
- **WebGPU accelerated** — 5–10× faster than CPU on Apple Silicon and modern GPUs.

## Live demo

Deploy your own in 2 minutes — see [Deploy](#deploy) below. (A hosted demo link can go here once deployed.)

## Run locally

Requires Node 18+.

```bash
git clone https://github.com/JinJuLee/englishspeak.git
cd englishspeak/web
npm install
npm run dev
```

Open http://localhost:5173/ in **Chrome or Edge**. (Safari does not support the cross-origin isolation mode Whisper needs.)

First mp3 upload downloads the Whisper-base model (~150MB). Chrome caches it in IndexedDB — subsequent uses are instant.

## How to use

1. Hit **Start today's session** in the top bar — the daily timer begins ticking and won't reset until local midnight.
2. Drop an mp3 on the page (or click to browse).
3. Wait for transcription (seconds to a minute depending on audio length).
4. Click any sentence to loop it. Tap the mic to record yourself and A/B against the original.
5. Use the bottom bar to set repeat count, speed, and gap length.
6. Hit **End** when you're done — the timer locks for the rest of the day.

Typical shadowing loop: set repeat to 3×, speed to 0.75×, enable auto-advance. Play the whole script back hands-free.

## Deploy

This is a pure static site, but it needs two HTTP response headers to enable SharedArrayBuffer (required by ONNX Runtime):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

### Cloudflare Pages (recommended — free, unlimited)

1. Push this repo to GitHub (already done).
2. Connect the repo in Cloudflare Pages.
3. Build command: `npm run build` · Build output: `dist` · Root directory: `web`.
4. Add this as `web/public/_headers`:

   ```
   /*
     Cross-Origin-Opener-Policy: same-origin
     Cross-Origin-Embedder-Policy: credentialless
   ```

### Vercel

1. Import the repo.
2. Framework preset: Vite. Root directory: `web`.
3. Add `web/vercel.json`:

   ```json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
           { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" }
         ]
       }
     ]
   }
   ```

### GitHub Pages

Not supported — GitHub Pages can't set custom response headers, so SharedArrayBuffer is unavailable and Whisper won't initialize.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v3
- [@huggingface/transformers](https://github.com/huggingface/transformers.js) v3 (Whisper base, WebGPU)
- HTML5 Audio with a custom per-sentence loop engine

## Layout

```
web/
├── public/                         # static assets
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── FileDrop.tsx            # drag-and-drop upload
│   │   ├── ProgressCard.tsx        # decode + model download status
│   │   ├── NowReading.tsx          # large current-sentence panel
│   │   ├── SentenceList.tsx        # click-to-jump list
│   │   └── ControlBar.tsx          # play / speed / repeat / gap
│   └── lib/
│       ├── transcribe.ts           # main-thread API
│       ├── transcribe.worker.ts    # Whisper worker
│       └── useAudioLooper.ts       # per-sentence loop engine
└── vite.config.ts
```

## Known limitations

- **Safari unsupported.** WebKit doesn't support `Cross-Origin-Embedder-Policy: credentialless`, so SharedArrayBuffer can't be enabled for cross-origin model files. Use Chrome or Edge.
- **English only** by default. Model supports 99 languages; swap `language: "en"` in `src/App.tsx` or add a language picker.
- **Whisper base** is the sweet spot (accuracy vs. size). For better accuracy, switch to `onnx-community/whisper-small` in `src/lib/transcribe.ts` (≈250MB).

## Related

- [`english_practice_workflow.md`](./english_practice_workflow.md) — the original Aiko + AudioLingo + ElevenLabs workflow this app replaces for the in-browser case.

## License

MIT
