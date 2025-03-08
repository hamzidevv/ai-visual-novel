# AI Visual Novel

A modern visual novel application powered by Next.js, Google's Gemini, and Hugging Face, featuring dynamic storytelling and image generation.

## Features

- Interactive visual novel experience
- AI-powered narrative generation
- Dynamic image generation for scenes
- Save/Load game functionality
- Modern UI with custom backgrounds and characters
- Real-time story progression and image changes when context change
- Responsive design

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [Google Gemini](https://ai.google.dev/) - For AI narrative generation
- [Hugging Face](https://huggingface.co/) - For image generation
- TypeScript - For type-safe code
- CSS Modules - For component styling
- Server-side components and API routes
- React Server Components (RSC)

## Project Structure
```
├── public/              # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/             # Next.js 15 app directory
│   │   ├── api/         # API routes
│   │   ├── components/  # React components
│   │   │   ├── foreground-character.tsx
│   │   │   ├── game-background.tsx
│   │   │   ├── input-box.tsx
│   │   │   ├── main-game.tsx
│   │   │   └── text-box.tsx
│   │   └── context/
│   │       └── GameContext.tsx
├── .env.local           # Environment variables (not tracked)
├── .eslintrc.json
├── .gitignore
├── eslint-config.mjs
├── globals.css
├── layout.tsx
├── next-env.d.ts
├── next.config.ts       # Next.js configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
└── README.md
```

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
# or pnpm install
```

3. Create a `.env.local` file with your API keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

4. Run the development server:
```bash
npm run dev
# or pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key
- `HUGGINGFACE_API_KEY` - Your Hugging Face API key



## Acknowledgments

- Google for providing the Gemini AI capabilities
- Hugging Face for the image generation models
- Next.js team for the excellent framework
- The visual novel community for inspiration
