# The Urim: AI-Powered Financial Health Coach dApp

## Overview

The Urim is a decentralized application that helps crypto users achieve their 2026 financial resolutions through personalized, low-risk coaching. Using advanced AI agents and blockchain technology, it analyzes wallet data to provide responsible DeFi suggestions focused on savings and yield generation.

## Categories
- **Primary:** Financial Health
- **Secondary:** Best Use of Opik

## Core Features

### Wallet Integration
- Connect via MetaMask or WalletConnect
- Fetch balances and transaction history using Moralis/Alchemy APIs
- Analyze spending patterns and risk levels

### AI Agent Coaching
- Natural language goal input (e.g., "Save $5,000 in stablecoins by June")
- LangChain.js reasoning chains for:
  - Goal parsing and extraction
  - Wallet data analysis
  - Personalized DeFi plan generation
- Enforced responsible advice with structured prompts

### Blockchain Integration
- Smart contract: `SavingsVault.sol` for on-chain progress tracking
- Functions: Create vaults, deposit/lock funds, set milestones, withdraw on achievement
- Immutable proof of progress via blockchain events

### Enhanced Outputs
- Text-to-audio coaching using Web Speech API
- Downloadable PDF reports with Chart.js visualizations
- Projected savings charts and wallet breakdowns

### Opik Integration
- Comprehensive LLM tracing and evaluation
- Eval suites for accuracy, reliability, and user impact
- Shareable dashboards for agent performance metrics

## Tech Stack

- **Frontend/Backend:** Next.js 16 + TypeScript
- **LLM:** OpenAI GPT-4o or OpenRouter models
- **Blockchain:** EVM (Polygon testnet), Solidity 0.8.19, Hardhat, ethers.js/wagmi
- **Evaluator:** Opik SDK
- **APIs:** Moralis/Alchemy (wallet data), CoinGecko/CoinMarketCap (market data)
- **Styling:** Tailwind CSS

## Project Structure

```
the-urim/
├── app/
│   ├── api/
│   │   ├── chat/          # LLM interaction endpoints
│   │   ├── wallet/        # Wallet data fetching
│   │   └── opik/          # Evaluation and tracing
│   ├── components/        # React components
│   │   ├── ChatInterface.tsx
│   │   ├── WalletConnect.tsx
│   │   └── SavingsPlan.tsx
│   ├── lib/               # Configurations
│   │   ├── wagmi.ts       # Wallet integration
│   │   ├── opik.ts        # Evaluation setup
│   │   └── llm.ts         # AI agent chains
│   └── utils/             # API utilities
│       ├── moralis.ts     # Wallet data APIs
│       └── coingecko.ts   # Market data APIs
├── contracts/             # Smart contracts
│   └── SavingsVault.sol
├── scripts/               # Deployment scripts
│   └── deploy.ts
├── test/                  # Test files
│   └── SavingsVault.test.ts
├── hardhat.config.ts      # Hardhat configuration
├── .env.local.example     # Environment variables template
└── README.md
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in API keys
4. Start development server: `npm run dev`
5. For smart contracts: `npx hardhat compile`

## User Flow

1. User connects EVM wallet
2. Inputs financial resolution via chat
3. Agent analyzes wallet data and generates personalized plan
4. User approves and interacts with on-chain savings vault
5. Agent tracks progress and provides ongoing coaching
6. Outputs include text response, audio playback, and PDF reports

## Hackathon Alignment

- Built during Jan 13 - Feb 2026 hackathon period
- Demonstrates strong LLM agent capabilities with reasoning chains
- Deep Opik integration for observability and evaluation
- Focus on practical financial health tools
- Functional demo with real-world impact potential

## Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or WalletConnect-compatible wallet
- API keys for:
  - OpenAI/OpenRouter (LLM services)
  - Moralis/Alchemy (wallet data)
  - CoinGecko/CoinMarketCap (market data)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Daltonic/The-Urim-AI-Powered-Financial-Health-Coach-dApp.git
   cd the-urim
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# LLM Configuration
OPENAI_API_KEY=your_openai_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Wallet Data APIs
MORALIS_API_KEY=your_moralis_api_key
ALCHEMY_API_KEY=your_alchemy_api_key

# Market Data APIs
COINGECKO_API_KEY=your_coingecko_api_key
CMC_API_KEY=your_coinmarketcap_api_key

# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your_api_key
```

## Usage

### Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract Development

Compile contracts:
```bash
npx hardhat compile
```

Run tests:
```bash
npx hardhat test
```

Deploy to testnet:
```bash
npx hardhat run scripts/deploy.ts --network polygonMumbai
```

### Code Quality

Run linter:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

## Testing

Run the test suite:
```bash
npm test
```

For smart contracts:
```bash
npx hardhat test
```

## Deployment

### Frontend Deployment

Build for production:
```bash
npm run build
npm start
```

### Smart Contract Deployment

Deploy to Polygon mainnet:
```bash
npx hardhat run scripts/deploy.ts --network polygon
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT