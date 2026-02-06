# RumbleCourt: AI-Powered Courtroom Simulator

## 🎯 What is RumbleCourt?

**RumbleCourt** is your personal courtroom simulator where AI lawyers battle it out over your evidence, and a neutral AI judge delivers real verdicts. Think of it as a "legal flight simulator" - practice your case strategy, test your arguments, and see potential outcomes before stepping into a real courtroom.

## 🚀 Why This Matters

**For Legal Professionals:**
- Preview case outcomes before real litigation
- Test different legal strategies risk-free
- Save time and resources on case preparation
- Improve decision-making with AI-powered insights

**For Everyone:**
- Understand how legal arguments work
- See justice in action with transparent, recorded proceedings
- Access legal simulation without expensive software

## 🎪 How It Works

1. **Connect Wallet** - Securely connect your MetaMask or WalletConnect wallet
2. **File Your Case** - Submit case details and evidence through the command terminal
3. **AI Lawyers Battle** - Watch as opposing AI attorneys debate your case in real-time
4. **Judge Delivers Verdict** - A neutral AI judge analyzes everything and renders a decision
5. **Immutable Record** - Every trial is permanently recorded on the blockchain for transparency

## ✨ Key Features

### 🤖 AI-Powered Legal Teams
- **Prosecution & Defense**: Two AI lawyers with opposing viewpoints
- **Real-Time Debates**: Dynamic courtroom arguments that adapt to your evidence
- **Evidence Analysis**: AI examines documents, photos, and testimony

### ⚖️ Fair & Transparent
- **Neutral Judge**: Unbiased AI judge focused only on the facts
- **Blockchain Recording**: Every word, argument, and verdict is permanently stored
- **Public Ledger**: Transparent proceedings anyone can verify

### 🎮 User-Friendly Experience
- **Command Terminal**: Simple text-based interface for case management
- **Live Simulation**: Watch the trial unfold in real-time with animated courtroom
- **Case History**: View all your cases with status tracking
- **Quick Actions**: One-click commands for common tasks

## 🛠 Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **AI Brains**: OpenRouter models (Trinity Large Preview) with Opik observability
- **Blockchain**: Polygon testnet (Mumbai) with Solidity smart contracts
- **Smart Contract**: Minimal courtroom contract with case lifecycle management
- **AI Observability**: Opik SDK for LLM interaction tracing and optimization
- **Wallet Integration**: MetaMask/WalletConnect via wagmi
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom animations

## 📁 Project Structure

```
rumbleCourt/
├── app/                    # Frontend application
│   ├── courtroom/         # Main simulation interface
│   ├── history/           # View past cases
│   ├── api/               # Backend endpoints
│   └── components/        # Reusable UI components
├── contracts/             # Blockchain smart contracts
│   └── RumbleCourt.sol    # Minimal courtroom contract
├── lib/                   # Core logic & configurations
│   ├── llm-agents.ts      # AI agent management
│   ├── courtroom-mcp-tools.ts # Blockchain interaction tools
│   └── opik-client.ts     # AI interaction logging
├── services/              # Backend services
│   └── blockchain.ts      # Contract interaction layer
├── context/               # React context providers
│   ├── CourtroomContext.tsx # Main application state
│   └── WalletContext.tsx    # Wallet connection state
├── components/            # UI components
│   ├── CourtroomSimulation.tsx # Main terminal interface
│   ├── CaseHistorySidebar.tsx  # Case management sidebar
│   └── TerminalMessage.tsx     # Message display component
└── scripts/               # Deployment & utilities
```

## 🚀 Quick Start

### For Users (No Coding Required)
1. Visit our live demo
2. Connect your wallet (MetaMask or similar)
3. Use the command terminal to file your first case
4. Watch the AI courtroom drama unfold!

### For Developers
```bash
# Clone and setup
git clone https://github.com/Dapp-Mentors/rumblecourt.git
cd rumbleCourt
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys:
# NEXT_PUBLIC_OPENROUTER_API_KEY=your_key_here
# NEXT_PUBLIC_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/your_key

# Start development server
npm run dev

# Optional: Local blockchain development
# In another terminal, start local blockchain
npm run node

# Deploy contract to local network
npm run deploy:local

# Run tests
npm run test

# Check code quality
npm run lint
```

### Smart Contract Development
```bash
# Compile contracts
npx hardhat compile

# Run contract tests
npx hardhat test

# Deploy to Polygon Mumbai testnet
npx hardhat run scripts/deploy.ts --network polygonMumbai
```

## 🎯 Use Cases

### Law Firms & Attorneys
- **Case Strategy Testing**: Try different legal approaches before real trials
- **Client Education**: Show clients potential outcomes in an engaging way
- **Team Training**: Practice arguments and evidence presentation
- **Pre-Litigation Analysis**: Assess case strength and potential verdicts before filing

### Law Students
- **Learning Tool**: Understand courtroom dynamics and legal reasoning
- **Mock Trials**: Practice without the pressure of real cases
- **Evidence Analysis**: Learn how different evidence affects case outcomes
- **Legal Strategy Development**: Experiment with different argument approaches

### Curious Minds
- **Legal Education**: See how the justice system works in practice
- **Debate Practice**: Test your argumentation skills
- **Transparency**: Witness fair, unbiased legal proceedings
- **AI Technology Exploration**: Experience cutting-edge AI in legal contexts

### Blockchain Enthusiasts
- **Smart Contract Interaction**: Experience real blockchain transactions
- **Decentralized Applications**: Use a complete Web3 legal platform
- **On-Chain Transparency**: Verify case records on the blockchain

## 🔒 Security & Privacy

- **Your Evidence**: Only you control access to your case files
- **Blockchain Transparency**: Public verification without compromising privacy
- **Secure Storage**: Encrypted evidence handling
- **No Data Mining**: We don't sell or misuse your information

## 🌟 What Makes RumbleCourt Special

### 🤖 Advanced AI Architecture
- **Multi-Agent System**: Three specialized AI agents (Prosecution, Defense, Judge) with distinct personalities and legal strategies
- **Opik Observability**: Real-time LLM interaction tracing for optimization and debugging
- **Smart Prompt Engineering**: Context-aware prompts that adapt based on case history and evidence
- **Automatic Quality Scoring**: Built-in evaluation metrics for relevance, argument quality, and legal accuracy

### ⚖️ Blockchain-Powered Transparency
- **Immutable Case Records**: Every case filing, trial, and verdict permanently stored on-chain
- **Transparent Verdicts**: Public blockchain ledger ensures fair and verifiable outcomes
- **Case Lifecycle Management**: Complete tracking from filing through appeal process
- **Decentralized Trust**: No central authority required for case validation

### 🎮 Next-Generation User Experience
- **Command Terminal Interface**: Intuitive text-based commands for case management
- **Live Trial Simulation**: Real-time courtroom drama with animated interface
- **Smart Case History**: Automatic organization with most recent and completed cases prioritized
- **Quick Actions**: One-click commands for common legal tasks

### Unlike Traditional Legal Software
- **No Expensive Licenses**: Built on open, accessible technology
- **AI-Powered Insights**: Dynamic analysis you can't get from static software
- **Real-Time Interaction**: Watch arguments develop, don't just read reports
- **Transparent Process**: See exactly how decisions are made

### Built for the Future
- **Web3 Ready**: Blockchain integration for next-generation transparency
- **AI-First**: Designed around the capabilities of modern AI
- **User-Centric**: Simple interface, powerful results
- **Evolving**: Constantly improving with new AI capabilities

## 🤝 Contributing

We welcome contributors! Whether you're a developer, designer, legal expert, or just passionate about legal tech:

1. Fork the repository
2. Create your feature branch
3. Submit a pull request

See our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📚 Documentation

- [API Documentation](docs/api.md)
- [Smart Contract Guide](docs/contracts.md)
- [Development Setup](docs/development.md)

## 🐛 Issues & Support

Found a bug? Have a question? [Open an issue](https://github.com/Dapp-Mentors/rumblecourt/issues) or join our community discussions.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**RumbleCourt**: Where AI meets justice, and everyone gets their day in court. ⚖️🤖
