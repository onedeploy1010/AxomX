# CoinMax

A cryptocurrency trading and portfolio management web application built with React, Vite, and Supabase.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite 7, TailwindCSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Web3**: Thirdweb SDK (Base Sepolia Testnet)
- **UI**: Radix UI components, Framer Motion, Recharts, Lightweight Charts
- **Routing**: Wouter
- **i18n**: i18next + react-i18next
- **State**: TanStack React Query

## Project Structure

- `src/` - React application source
- `src/lib/supabase.ts` - Supabase client initialization
- `contracts/` - Smart contract related files
- `supabase/` - Supabase configuration
- `shared/` - Shared types/utilities
- `attached_assets/` - Static assets
- `public/` - Public static files

## AI Analysis Section

- Entire section (header, featured card, model pills) wrapped in a single `ai-wrapper-glass` frosted glass container
- Featured card (best model) has colored gradient glass with animated gauge, shimmer sweep, and corner orbs
- Compact model pills use subtle translucent glass style and auto-scroll via CSS marquee animation (`MarqueeRow` component duplicates children for seamless loop, pauses on hover/touch)
- `prefers-reduced-motion` support disables all animations

## Bottom Navigation

- Floating pill-shaped bar centered at bottom with rounded capsule design
- 5 icon-only tabs: Home, Trade, Vault (custom SVG coin icon), Strategy, Profile
- Active tab gets dark inset pill background with green (#00e7a0) icon glow
- Inactive icons are muted; no text labels
- Glass effect: `backdrop-filter: blur(24px)`, gradient background, outer shadow
- Responsive: slightly larger on desktop (sm: breakpoints)

## Configuration

- Vite dev server runs on port 5000 (host: 0.0.0.0)
- Environment variables prefixed with `VITE_` are exposed to the frontend
- Key env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_THIRDWEB_CLIENT_ID`, contract addresses

## Node System

- **Large Node**: $600 contribution (10%, non-refundable) + $6,000 USDC frozen. Daily 0.9% MA earnings. 120-day program with V1→V6 milestones (days 15/30/45/60/90/120). Success at V6 unlocks frozen funds as withdrawable balance.
- **Small Node**: $100 contribution (10%, non-refundable) + $1,000 USDC frozen. Daily 0.5% MA earnings (locked until milestone met). Day 15: V2 unlocks earnings. Day 90: V4 unlocks frozen amount withdrawal.
- Failure to meet milestones: earnings stopped, frozen funds reclaimed, node qualification cancelled.
- On-chain payment = contribution + frozen amount (MINI: $1,100, MAX: $6,600)

## Running

```
npm run dev
```
