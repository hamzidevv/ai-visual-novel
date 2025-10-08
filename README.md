# AI Visual Novel: AI-Powered Interactive Storytelling

AI Visual Novel is an immersive visual novel experience that combines AI-generated narrative, dynamic character emotions, and rich background scenes to create unique interactive stories based on player input.

## Features

### 🎮 Immersive Gameplay
- Interactive storytelling where your choices shape the narrative
- Dynamic chapter system with beautiful transition screens
- React-based UI for smooth and responsive gameplay

### 🧠 AI-Powered Content Generation
- Narrative generation based on player input
- AI-generated background scenes that match the story context
- Dynamic character expressions that reflect the emotional tone of the story

### 🎭 Character & World Customization
- Customizable character appearance (gender, style)
- Multiple universe settings (fantasy, sci-fi, etc.)
- Dynamic background elements including weather and time of day

### 🗣️ Voice & Audio Features
- Speech recognition for voice commands
- Text-to-speech narration of story content
- Emotional analysis of narrative to determine character expressions

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [Google Gemini](https://ai.google.dev/) - For AI image generation
- [TailwindCSS 4](https://tailwindcss.com/) - For styling
- [TypeScript](https://www.typescriptlang.org/) - For type safety

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- NPM, Yarn, or PNPM
- API keys for:
  - Gemini 2.0 Flash (Google GenAI)
  - Background removal service (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gladdydev/ai-visual-novel.git
   cd ai-visual-novel
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   REMOVE_BG_API_KEY=your_removebg_api_key  # Optional
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure
```
├── public/              # Static assets
│   ├── backgrounds/     # Fallback background images
│   └── characters/      # Fallback character images
├── app/                 # Next.js 15 app directory
│   ├── api/             # API routes
│   │   ├── background/  # Background generation API
│   │   └── generate-character/ # Character generation API
│   ├── components/      # React components
│   │   ├── foreground-character.tsx
│   │   ├── game-background.tsx
│   │   ├── input-box.tsx
│   │   ├── main-game.tsx
│   │   └── text-box.tsx
│   ├── context/         # React context
│   │   └── GameContext.tsx
│   ├── lib/             # Utility functions
│   │   └── services/
│   │       └── apiService.ts
│   └── settings/        # Game settings page
├── .env.local           # Environment variables (not tracked)
├── package.json
└── README.md
```

## How to Play

1. **Start Your Adventure**: Begin with the default scenario or customize your game world in Settings
2. **Give Commands**: Type what you want to do or say in the input box at the bottom of the screen
3. **Use Voice Input**: Click the microphone icon to use speech instead of typing
4. **Advance Chapters**: Progress naturally through the story or use `/nextchapter` to skip ahead
5. **Change Character Emotions**: The character reacts based on story tone, or use `/happy`, `/sad`, `/default` commands

### Special Commands
- `/happy` - Force happy character emotion
- `/sad` - Force sad character emotion
- `/default` - Reset to neutral character emotion
- `/nextchapter` - Advance to the next chapter
- `/settings` - Display current game settings

## Game Settings

Access the settings page by clicking the gear icon in the top-right corner. Customize:

- **Universe**: Choose between fantasy, sci-fi, medieval, modern, etc.
- **Character**: Select gender, visual style, and appearance consistency
- **Background**: Set the mood, enable dynamic time of day and weather effects

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key
- `REMOVE_BG_API_KEY` - API key for background removal service (optional)

## Package.json

```json
{
  "name": "ai-visual-novel",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@google/genai": "^0.6.1",
    "@google/generative-ai": "^0.23.0",
    "axios": "^1.8.1",
    "dotenv": "^16.4.7",
    "lucide-react": "^0.484.0",
    "mongodb": "^6.14.2",
    "mongoose": "^8.12.1",
    "nanoid": "^5.1.2",
    "next": "15.2.1",
    "openai": "^4.86.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-markdown": "^10.0.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.2.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google's Gemini for AI image generation
- Next.js team for the amazing framework
- All contributors and testers who helped shape this project

---

**Note**: This is a work in progress. Some features may be experimental or not fully implemented.
