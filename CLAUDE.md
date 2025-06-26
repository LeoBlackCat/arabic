# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start development server with hot reload
- `npm run build` - Build production bundle  
- `npm run deploy` - Build and deploy to GitHub Pages

### Audio Generation
- `node generateMissingAudio.js` - Generate missing audio files using ElevenLabs TTS API (requires ELEVENLABS_API_KEY in .env)

## Architecture

This is a React-based Arabic language learning application with speech recognition and audio playback capabilities.

### Core Components
- **App.js** - Main application component handling speech recognition, audio playback, and game logic
- **verbs-data.js** - Hardcoded Arabic verbs data (primary data source)
- **verbs.js** - Legacy verb loader that reads from logic.json (fallback)
- **arabicUtils.js** - Arabic text normalization utilities

### Data Flow
The app uses two data sources:
1. **Primary**: `verbs-data.js` exports hardcoded verb objects with Arabic text, English translations, and image paths
2. **Fallback**: `logic.json` contains comprehensive Arabic phrases/words data used by `verbs.js`

### Audio System
- **Dual audio modes**: Toggle `PLAY_AUDIO_FILES` in App.js to switch between pre-generated WAV files (`/sounds/`) and browser TTS
- **Audio files**: Located in `/sounds/` directory, named using `chat` representation (e.g., "A7eb.wav")
- **TTS fallback**: Uses browser SpeechSynthesis API with Arabic voice when audio files fail
- **Audio generation**: `generateMissingAudio.js` creates missing audio files via ElevenLabs API

### Speech Recognition
- Uses WebKit Speech Recognition API with Arabic language (`ar-SA`)
- Normalizes both user input and expected text using `arabicUtils.normalizeArabic()`
- Provides feedback with success/error sounds and visual indicators

### Asset Management
- **Images**: Verb illustrations in `/pictures/` directory  
- **Sounds**: Audio files in `/sounds/` directory
- **Webpack**: Copies both directories to `/dist/` during build

### Key Files
- `logic.json` - Master data file containing Arabic phrases with `ar` (Arabic), `chat` (romanized), `eng` (English) fields
- `webpack.config.js` - Configured to copy static assets and serve audio/images during development
- `tailwind.config.js` - Tailwind CSS configuration for styling