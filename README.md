# RumbleCourt: AI-Driven Courtroom Simulator

## Overview

RumbleCourt is an AI-driven courtroom simulator where LLM agents act as opposing lawyers, fiercely debating user-submitted evidence in real-time trials. A neutral judge LLM delivers binding verdicts, while all proceedings and outcomes are immutably recorded on-chain for transparency, adjournment tracking, and future reference—empowering users to preview case outcomes before real-world litigation. This boosts legal professionals' productivity by simulating trials to save time/resources and improve decision-making habits.

## Categories
- **Primary:** Legal Technology
- **Secondary:** AI Simulation

## Core Features

### AI Agent Litigation
- LLM-powered opposing lawyers for dynamic courtroom debates
- Real-time evidence analysis and argumentation
- Neutral judge agent for impartial verdict delivery

### Blockchain Transparency
- On-chain recording of all trial proceedings and outcomes
- Immutable evidence storage and adjournment tracking
- Decentralized case history for future reference

### Pre-Litigation Simulation
- Preview potential case outcomes before real-world litigation
- Risk assessment and strategy optimization
- Productivity enhancement for legal professionals

### Real-Time Trials
- Live courtroom simulations with user-submitted evidence
- Interactive debate sessions between AI lawyers
- Binding verdicts delivered by impartial AI judge

## Tech Stack

- **Frontend/Backend:** Next.js 16 + TypeScript
- **LLM:** OpenAI GPT-4o or OpenRouter models
- **Blockchain:** EVM (Polygon testnet), Solidity 0.8.19, Hardhat, ethers.js/wagmi
- **Evaluator:** Opik SDK
- **APIs:** Moralis/Alchemy (blockchain data), CoinGecko/CoinMarketCap (market data)
- **Styling:** Tailwind CSS

## Project Structure

```
rumbleCourt/
├── app/
│   ├── api/
│   │   ├── chat/          # LLM interaction endpoints
│   │   ├── wallet/        # Blockchain integration
│   │   └── opik/          # Evaluation and tracing
│   ├── components/        # React components
│   │   ├── ChatInterface.tsx
│   │   ├── WalletConnect.tsx
│   │   └── CourtroomSimulation.tsx
│   ├── lib/               # Configurations
│   │   ├── wagmi.ts       # Wallet integration
│   │   ├── opik.ts        # Evaluation setup
│   │   └── llm.ts         # AI agent chains
│   └── utils/             # API utilities
│       ├── moralis.ts     # Blockchain data APIs
│       └── coingecko.ts   # Market data APIs
├── contracts/             # Smart contracts
│   └── CourtRecord.sol
├── scripts/               # Deployment scripts
│   └── deploy.ts
├── test/                  # Test files
│   └── CourtRecord.test.ts
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

1. User submits case evidence and details
2. AI lawyers engage in real-time debate
3. Neutral judge delivers binding verdict
4. All proceedings recorded immutably on-chain
5. Users can review case history and outcomes

## Hackathon Alignment

- Built during Jan 13 - Feb 2026 hackathon period
- Demonstrates advanced LLM agent capabilities with reasoning chains
- Deep Opik integration for observability and evaluation
- Focus on innovative legal technology solutions
- Functional demo with real-world impact potential

## Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or WalletConnect-compatible wallet
- API keys for:
  - OpenAI/OpenRouter (LLM services)
  - Moralis/Alchemy (blockchain data)
  - CoinGecko/CoinMarketCap (market data)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Dapp-Mentors/rumblecourt.git
   cd rumbleCourt
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

# Blockchain Data APIs
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