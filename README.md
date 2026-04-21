# SpeakLoop

> Drop an mp3, auto-split into sentences, loop each one N times. Browser-based English speaking practice — no API key, no account, no server.

Built for OPIc / TOEFL / interview shadowing. Inspired by Natural Reader and Speechify, but with one feature they don't have: **per-sentence repeat counts with auto-advance**, so you can drill a sentence 5 times and move on without touching the mouse.

## Why it exists

Most English practice workflows force you to either:
- Use Apple Music / Spotify (which mixes practice audio with your music library), or
- Pay for TTS credits every time you change a single word in your script

SpeakLoop is the missing player: you bring your own mp3 (ElevenLabs, textbook audio, a voice memo — anything) and it becomes a shadowing tool. Transcription happens locally in your browser via [Whisper](https://openai.com/research/whisper) running on [🤗 Transformers.js](https://github.com/huggingface/transformers.js).

## Features

- **Auto sentence splitting** — Whisper transcribes and chunks the audio with accurate timestamps.
- **Per-sentence repeat** — 1× / 2× / 3× / 5× / 10× / ∞ in one click.
- **Auto-advance** — after N repeats, move to the next sentence automatically.
- **Now Reading panel** — current sentence displayed large with progress bar and word highlight.
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

1. Drop an mp3 on the page (or click to browse).
2. Wait for transcription (seconds to a minute depending on audio length).
3. Click any sentence to loop it.
4. Use the bottom bar to set repeat count, speed, and gap length.

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
