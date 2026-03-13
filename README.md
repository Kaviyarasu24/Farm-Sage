# Farm Sage AI Assistant

Farm Sage is a Next.js app that helps farmers with practical, weather-aware agricultural guidance through a multilingual AI chat interface.

## Highlights

- Live environmental context (temperature, humidity, rainfall)
- Auto location via browser geolocation
- Manual coordinate input fallback
- AI chat assistant for farming questions
- Multilingual responses (English, Hindi, Telugu, Tamil, Marathi)
- Voice-to-text input using browser speech recognition
- Leaf image upload/camera input UI for disease diagnosis workflow

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Radix UI-based components
- OpenRouter API for LLM responses
- Open-Meteo API for weather data
- Nominatim (OpenStreetMap) reverse geocoding for place name

## Project Structure

```text
app/
  page.tsx               # Main Farm Sage interface
  api/chat/route.ts      # Server route that calls OpenRouter
  layout.tsx             # App metadata and root layout
components/
  ui/                    # Reusable UI component library
lib/
  utils.ts               # Utility helpers
```

## Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` in the project root:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

3. Start the development server:

```bash
pnpm dev
```

4. Open:

```text
http://localhost:3000
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting

## How Chat Works

1. Client sends user messages, selected language, and weather context to `POST /api/chat`.
2. Server builds a farming-focused system prompt.
3. Server calls OpenRouter chat completions endpoint.
4. Assistant reply is returned and rendered in the chat UI.

## Notes

- The disease diagnosis card currently shows a static demo analysis after image selection.
- Weather depends on browser location permission or valid manual coordinates.
- Voice input depends on browser support for `SpeechRecognition` / `webkitSpeechRecognition`.

## Deployment

This app can be deployed on Vercel or any Node.js host that supports Next.js App Router.

Set `OPENROUTER_API_KEY` in your deployment environment variables before running in production.
