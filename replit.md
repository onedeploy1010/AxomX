# CoinMax - Replit Agent Guide

## Overview

CoinMax is a DeFi (Decentralized Finance) DApp built as a mobile-first web application. It provides:

- **Prediction Markets** — Users bet on crypto price movements (bull/bear) with grid and market views
- **Vault System** — Locked staking with time-based yield plans (5/15/45 days)
- **AI Quantitative Strategies** — Copy-trading strategies with performance tracking
- **Node System** — Tiered membership (MAX/MINI nodes) with referral mechanics
- **Profile & Wallet** — Web3 wallet connection via Thirdweb with user profiles

The app follows a dual execution model (`EXTERNAL` for real exchange execution, `INTERNAL` for platform-managed) across all trading and vault operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with 5 main pages: Dashboard, Trade, Vault, Strategy, Profile
- **State Management**: TanStack React Query for server state; no Redux or complex client state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for price charts and strategy performance visualization
- **Styling**: Tailwind CSS with CSS variables for a dark green-themed design system. Custom utility classes like `hover-elevate`, `glow-green-sm`, `gradient-green-dark`
- **Web3 Integration**: Thirdweb SDK for wallet connection (MetaMask, Coinbase Wallet, Rainbow, Rabby, in-app wallet). The Thirdweb client ID is fetched from the server at `/api/config` to avoid exposing it in client code
- **External Data**: CoinGecko API for live crypto prices and chart data (BTC, ETH, BNB, DOGE, SOL)

### Backend

- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Key Endpoints**:
  - `GET /api/config` — Returns Thirdweb client ID
  - `POST /api/auth/wallet` — Wallet-based auth (creates profile if new)
  - `GET /api/profile/:walletAddress` — Fetch user profile
  - `GET /api/strategies` — List trading strategies
  - `GET /api/predictions` — List prediction markets
  - `GET /api/vault/positions/:userId` — User vault positions
- **Dev Server**: Vite dev server is integrated as Express middleware with HMR
- **Production**: Client is built to `dist/public`, server is bundled with esbuild to `dist/index.cjs`

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Uses `SUPABASE_DATABASE_URL` or `DATABASE_URL` environment variable, with SSL enabled
- **Schema Location**: `shared/schema.ts` — shared between client and server
- **Key Tables**:
  - `profiles` — User profiles keyed by wallet address, includes referral codes, node type, team level
  - `vault_positions` — User staking positions with plan type, amounts, status
  - `strategies` — AI trading strategies with performance metrics
  - `strategy_subscriptions` — User subscriptions to strategies
  - `prediction_markets` — Prediction market listings with odds
  - `node_memberships` — Node tier memberships
  - `system_config` — Platform configuration
- **Enums**: `execution_mode` (EXTERNAL/INTERNAL), `vault_plan`, `vault_status`, `node_type`, `account_type`, `strategy_status`
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Seeding**: `server/seed.ts` populates initial strategies and prediction markets

### Storage Layer

- **Pattern**: Repository/Storage interface (`IStorage`) with `DatabaseStorage` implementation in `server/storage.ts`
- **Why**: Abstracts database access behind an interface, making it testable and swappable

### Build System

- **Development**: `tsx server/index.ts` runs the server with Vite middleware for HMR
- **Production Build**: Custom `script/build.ts` that runs Vite build for client and esbuild for server. Server dependencies are selectively bundled (allowlist) to reduce cold start times
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

## External Dependencies

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (primary) |
| `SUPABASE_DATABASE_URL` | Alternative PostgreSQL connection (Supabase preferred) |
| `THIRDWEB_CLIENT_ID` | Thirdweb SDK client ID for wallet connections |

### Third-Party Services

- **PostgreSQL** (via Supabase or any Postgres provider) — Primary data store
- **Thirdweb** — Web3 wallet connection and authentication. Client ID served from backend to keep it semi-private
- **CoinGecko API** — Free tier, called directly from the frontend for real-time crypto prices and historical chart data. Rate-limited with 30s refetch interval
- **Recharts** — Charting library for price visualization
- **Polymarket, Hyperliquid, One Engine** — Referenced in design docs as planned execution layer integrations (not yet implemented in code)

### Key NPM Packages

- `drizzle-orm` + `drizzle-zod` — ORM and schema validation
- `thirdweb` — Web3 SDK
- `express` v5 — HTTP server
- `@tanstack/react-query` — Async state management
- `wouter` — Client-side routing
- `recharts` — Charts
- `react-icons` — Icon set (used for crypto logos)
- `vaul` — Drawer component
- `lucide-react` — Icon library

## Recent Changes (Feb 2026)

- Restructured frontend into component-based architecture with reusable components under `client/src/components/`:
  - `dashboard/`: PriceHeader, PriceChart, AssetTabs, DepthBar, ExchangeDepth, TrendingFeed
  - `trade/`: PredictionGrid, BetControls, MarketCard, StatsPanel
  - `vault/`: VaultChart, VaultStats, VaultPlans
  - `strategy/`: StrategyHeader, StrategyCard, HedgeSection
  - `profile/`: AssetsOverview, NodeSection, ReferralCard, SettingsList
- Added `client/src/lib/constants.ts` for shared formatting utilities and asset mappings
- Added Binance order book depth data integration (via direct API calls)
- Fixed tsx binary symlink issue in node_modules
- All 5 pages (Dashboard, Trade, Vault, Strategy, Profile) fully functional with real API data