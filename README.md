# SpeakLoop

Browser-based English speaking practice tool. Upload an mp3, get automatic sentence-by-sentence playback with configurable repeat counts — inspired by Natural Reader and Speechify.

## What it does

1. Drop an mp3 (e.g. one you generated with ElevenLabs).
2. In-browser Whisper (via `@xenova/transformers`) transcribes it and splits it into sentences with timestamps. No API key required.
3. Tap any sentence to loop it N times, then auto-advance.
4. A "Now Reading" panel shows the current sentence large, with a progress bar and word highlight.

## Original workflow reference

See [`english_practice_workflow.md`](./english_practice_workflow.md) for the broader OPIc/TOEFL/interview practice workflow that inspired this app.

## Run locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173/ in Chrome or Edge (Safari has known issues with the ONNX runtime used for Whisper).

First mp3 upload downloads the Whisper base model (~150MB, cached afterward).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v3
- `@xenova/transformers` for in-browser Whisper
- HTML5 Audio for playback; custom loop engine in `src/lib/useAudioLooper.ts`

## Structure

```
web/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── FileDrop.tsx
│   │   ├── ProgressCard.tsx
│   │   ├── NowReading.tsx
│   │   ├── SentenceList.tsx
│   │   └── ControlBar.tsx
│   └── lib/
│       ├── transcribe.ts           # main-thread API
│       ├── transcribe.worker.ts    # Whisper worker
│       └── useAudioLooper.ts       # sentence loop engine
```
