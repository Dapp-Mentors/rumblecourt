# RumbleCourt: AI-Powered Debate & Courtroom Simulator for Smarter Decisions

![RumbleCourt Interface](screenshots/Lawyers%20Argue%202.png)

**Built for the Commit To Change AI Agents Hackathon (Productivity & Work Habits Category)**  
*Helping professionals and everyday users turn their 2026 resolution to "think clearer, decide better, and work more efficiently" into lasting habits through structured, multi-perspective reasoning.*

## 🎯 What is RumbleCourt?

RumbleCourt is an AI agent-powered simulator that stages real-time debates between opposing viewpoints on any submitted topic or evidence, culminating in a reasoned verdict from a neutral AI judge.

While deeply valuable for legal professionals simulating courtroom scenarios, it’s designed for **everyone**:
- Test arguments and strategies risk-free
- Observe both sides of any issue in structured debate
- Get an unbiased synthesis and likely outcome
- Build sharper thinking and decision-making habits

Think of it as a **personal reasoning accelerator** — whether preparing for a legal case, a workplace debate, a public speech, or just exploring a tough personal decision.

## 🚀 Why RumbleCourt Boosts Productivity & Work Habits

Many people set New Year’s resolutions to:
- Make faster, more confident decisions
- Reduce time wasted on unbalanced thinking
- Build disciplined routines for preparation and analysis
- Improve focus and output in high-stakes situations

RumbleCourt turns those intentions into sustainable habits by:

- **Accelerating preparation time** — Run full debate cycles in minutes instead of hours of solo brainstorming or research
- **Reducing decision paralysis** — Quickly surface strengths, weaknesses, and likely outcomes from both sides
- **Training balanced reasoning** — Regular use reinforces the habit of considering opposing views before acting
- **Fitting into daily workflows** — Short, focused simulations make structured thinking a repeatable routine rather than an occasional effort

The outcome: higher-quality work, fewer missteps, and consistent professional (or personal) momentum all year long.

## 🎪 How It Works

1. **Connect Wallet** – Securely link MetaMask or WalletConnect (for on-chain recording)
2. **Submit Your Topic/Case** – Enter details and evidence via the intuitive command terminal
3. **AI Agents Debate** – Specialised LLM agents take opposing sides and argue dynamically in real-time
4. **Neutral Judge Decides** – An unbiased AI judge analyses everything and delivers a reasoned verdict
5. **Immutable Record** – Full proceedings and outcome permanently stored on Polygon for reference and transparency

## ✨ Key Features

### 🤖 Autonomous Multi-Agent Reasoning System
- Three specialised agents: two advocates with opposing stances + one neutral judge
- Real-time adaptive arguments that respond to your evidence and prompts
- Advanced prompt engineering for depth, fairness, and logical rigor

### ⚖️ Transparent & Structured Outcomes
- Judge focused purely on logic, evidence, and balance
- Immutable blockchain record of every exchange and verdict
- Verifiable proceedings without exposing sensitive details

### 📈 Habit-Building Workflow
- Rapid iteration: test multiple angles or evidence sets in one session
- Case/debate history dashboard with easy revisit and comparison
- Simple one-click commands for starting, adding evidence, or requesting verdict

### 🔍 Built-in Observability with Opik
- Full tracing of agent reasoning chains and performance
- Automated metrics for argument quality, coherence, and balance
- Insights to refine prompts and improve simulation reliability over time

![Judge Verdict 1](screenshots/Judge%20Verdict%201.png)

## 🛠 Tech Stack (Hackathon Highlights)

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **AI Agents**: OpenRouter (Agentic Trinity model) with sophisticated reasoning chains
- **Observability & Evaluation**: Deep Opik SDK integration for tracing and optimisation
- **Blockchain**: Polygon Amoy testnet + Solidity contracts for immutable records
- **Wallet Integration**: wagmi + WalletConnect/MetaMask
- **Real-time Interface**: Live terminal feed with animated courtroom visuals

## 🚀 Quick Start

### For Everyone (No Coding Needed)
1. Visit the live demo
2. Connect your wallet (optional for public simulations)
3. Use the command terminal to submit a topic and evidence
4. Watch the debate unfold and review the judge’s verdict — in minutes!

### For Developers
```bash
git clone https://github.com/Dapp-Mentors/rumblecourt.git
cd rumblecourt
npm install

cp .env.local.example .env.local
# Add your OpenRouter key and Polygon RPC URL

npm run dev
```

### MetaMask Configuration
When adding the network to MetaMask:
- **Network Name**: Rumble Court Local
- **RPC URL**: https://hardhat.dappmentors.org (Public URL) or http://127.0.0.1:8545 (Local URL)
- **Chain ID**: 31337
- **Currency Symbol**: ETH

## 🎯 Who It Helps & How

### Legal Professionals (Primary Productivity Impact)
- Pre-litigation risk assessment and strategy testing
- Faster case preparation with simulated outcomes
- Habit of thorough, balanced analysis before committing resources

### Debate & Public Speaking Preparation
- Practice arguments for presentations, negotiations, or competitions
- See how opposing views might challenge your position
- Build confidence through repeated, low-pressure rehearsal

### Workplace & Personal Decision-Making
- Explore pros/cons of business decisions, policy proposals, or life choices
- Train the habit of seeking counter-arguments before deciding
- Improve critical thinking routines for everyday challenges

### Students & Lifelong Learners
- Understand structured reasoning and logical debate
- Experiment with evidence and see how it shifts outcomes
- Develop disciplined thinking habits early

## 🌟 Why This Fits the Commit To Change Hackathon

- **Real resolution support**: Turns common goals like “decide better,” “prepare more effectively,” and “work smarter” into measurable daily habits
- **Sophisticated multi-agent design**: Autonomous agents with distinct roles, tool use, and adaptive reasoning
- **Outstanding Opik integration**: Comprehensive tracing, evaluation, and optimisation for reliable, improvable agent behaviour
- **Broad yet practical utility**: Deployable tool with clear impact on thinking and productivity routines

## 🤝 Contributing

Contributions very welcome! Fork, branch, and submit PRs — especially features that enhance debate versatility, habit tracking, or Opik insights.

## 📄 License

MIT License

---

**RumbleCourt**: Train your mind to see both sides, decide with clarity, and turn better thinking into a daily habit. ⚖️🤖🚀
