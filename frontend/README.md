# MemeFi Frontend

A beautiful, modern Next.js frontend for the MemeFi protocol - a Sui-native memecoin launch and trading protocol with protocol-enforced fair launches and privacy-aware early trading sessions.

## 🎨 Design

This frontend uses the same design system, colors, fonts, and smooth animations from the GiGi Energy Drink landing page:

- **Primary Color**: Lime Green (#AFFF00) - representing DeFi energy and fairness
- **Background**: Clean white with charcoal text (#121212)
- **Fonts**: Inter (sans-serif) and JetBrains Mono (monospace)
- **Animations**: Framer Motion for smooth, performant animations
- **Smooth Scroll**: Lenis for buttery-smooth scrolling
- **Effects**: Click sparks, floating gradients, noise overlays

## 🚀 Features

- **Hero Section**: Bold headline with animated features and stats
- **How It Works**: Three-step process visualization
- **Responsive Navigation**: Smooth scrolling, mobile menu
- **Interactive Elements**: Click sparks, hover effects, scroll animations
- **Optimized Performance**: Next.js 15, React 19, Tailwind CSS 4

## 📦 Tech Stack

- **Framework**: Next.js 16.0.10
- **React**: 19.2.0
- **Styling**: Tailwind CSS 4.1.9
- **Animations**: Framer Motion 12.26.2
- **Smooth Scroll**: Lenis 1.3.17
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## 🛠️ Installation

```bash
# Navigate to the project directory
cd d:/Projects/HackMoney/memefi-frontend

# Install dependencies (using pnpm, npm, or yarn)
pnpm install
# or
npm install
# or
yarn install
```

## 🏃 Development

```bash
# Start the development server
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
memefi-frontend/
├── app/
│   ├── globals.css          # Global styles with custom theme
│   ├── layout.tsx            # Root layout with fonts and providers
│   └── page.tsx              # Home page
├── components/
│   ├── ui/                   # Reusable UI components (Button, Card, etc)
│   ├── click-spark.tsx       # Click effect animation
│   ├── lenis-provider.tsx    # Smooth scroll provider
│   ├── navigation.tsx        # Navigation bar
│   ├── hero-section.tsx      # Hero section
│   ├── how-it-works.tsx      # How it works section
│   └── footer.tsx            # Footer
├── lib/
│   └── utils.ts              # Utility functions
└── public/
    └── images/               # Static images
```

## 🎯 Design System

### Colors

- **Lime**: `#AFFF00` - Primary accent, buttons, highlights
- **Charcoal**: `#121212` - Primary text, dark backgrounds
- **White**: `#FFFFFF` - Main background
- **Crypto Blue**: Accent for variety

### Typography

- **Headings**: Inter, Black weight (900), tight tracking
- **Body**: Inter, Regular/Medium
- **Code/Mono**: JetBrains Mono

### Animation Principles

- **Smooth**: Ease curves [0.25, 0.4, 0.25, 1]
- **Spring**: Stiffness 100-300, damping 20-30
- **Staggered**: 0.1s delays for sequential items
- **Hover**: Scale 1.05-1.1, quick transitions

## 🔗 Integration Points

This frontend is designed to integrate with:

- **Sui Wallet Kit**: For wallet connection
- **Sui TypeScript SDK**: For blockchain interactions
- **ENS SDK**: For temporary session identities
- **MemeFi Smart Contracts**: Move modules on Sui

## 📝 Next Steps

1. Install dependencies: `pnpm install`
2. Run development server: `pnpm dev`
3. Integrate Sui Wallet connection
4. Connect to smart contracts
5. Add launch and session functionality
6. Implement ENS integration

## 🎨 Customization

The design system is fully customizable through CSS variables in `app/globals.css`:

```css
:root {
  --lime: oklch(0.92 0.2 128);
  --charcoal: oklch(0.145 0 0);
  /* ... more variables */
}
```

## 📄 License

Built for HackMoney 2026 hackathon.

## 🙏 Credits

- Design system inspired by modern energy drink landing pages
- Built with Next.js, Tailwind CSS, and Framer Motion
- For the Sui and ENS ecosystems
