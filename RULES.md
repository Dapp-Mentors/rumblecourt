# Dapp Mentors - Coding Standards & Quality Criteria
## Blockchain & AI Development Agency

**Version:** 1.1  
**Last Updated:** December 30, 2025

---

## 1. Core Philosophy

Code must be:
- **Secure by design** (priority for smart contracts)
- **Educational** (clear and teachable)
- **Production-ready** (enterprise quality)
- **Community-driven** (reusable for Web3 and other purposes)

---

## 2. General Principles

- **Code Metrics:** Functions ≤50 lines; files ≤300 lines; cyclomatic complexity ≤10/function.
- **Quality:** 80% test coverage (95% for smart contracts); mandatory code reviews.
- **SOLID:** Single responsibility; open-closed; Liskov substitution; interface segregation; dependency inversion.

---

## 3. File Naming

- Use lowercase hyphens for multi-word names; be descriptive and concise.

**Examples:**
- Smart Contracts: `token-contract.sol`, `nft-marketplace.rs`
- Frontend: `wallet-connect-button.tsx`, `use-wallet-connection.hook.ts`
- Backend: `blockchain-service.ts`, `user-authentication.controller.ts`
- AI/ML: `sentiment-analysis-model.py`, `data-preprocessing.py`
- Tests: `token-contract.test.sol`, `wallet-integration.spec.ts`

---

## 4. Naming Conventions

### Variables
- JS/TS: camelCase; constants: SCREAMING_SNAKE_CASE (e.g., `userWalletAddress`, `MAX_GAS_LIMIT`).
- Python: snake_case; constants: SCREAMING_SNAKE_CASE (e.g., `user_wallet_address`, `MAX_EPOCHS`).
- Solidity: camelCase/public, underscore for private; constants: SCREAMING_SNAKE_CASE (e.g., `totalSupply`, `MAX_SUPPLY`).

### Functions
- JS/TS: camelCase, verb-noun (e.g., `connectWallet()`, `transferTokens()`).
- Python: snake_case (e.g., `preprocess_dataset()`).
- Solidity: PascalCase for public/external; camelCase with underscore for internal (e.g., `transferTokens()`, `_calculateFee()`).
- Rust: snake_case (e.g., `transfer_tokens()`).

### Classes/Types
- All: PascalCase (e.g., `WalletManager`, `NeuralNetworkModel`).

---

## 5. Smart Contract Standards (Solidity)

Use ^0.8.20+; SPDX MIT; OpenZeppelin bases; custom errors; NatSpec docs; events for state changes; CEI pattern; explicit visibility; immutable/constants.

**Structure Outline:**
1. SPDX/Pragma/Imports
2. Contract Doc/Definition
3. State Vars
4. Events
5. Errors
6. Modifiers
7. Constructor
8. External/Public Functions
9. Internal/Private Functions

**Best Practices:**
- Latest stable version.
- Custom errors for gas efficiency.
- Emit events on changes.
- Overflow protection (built-in ≥0.8).
- Avoid reentrancy.

---

## 6. TypeScript/JavaScript Standards

**Project Structure:**
```
app/
├── components/
├── hooks/
├── services/
├── utils/
├── types/
├── contexts/
└── constants/
```

- Use ethers.js for Web3.
- Explicit types; async/await for promises.
- Validate inputs; handle errors.
- React: Functional components; hooks for state/logic.

---

## 7. Python Standards (AI/ML)

**Project Structure:**
```
ai-services/
├── models/
├── training/
├── preprocessing/
├── evaluation/
├── utils/
└── tests/
```

- Use type hints; logging.
- For ML: torch/transformers; clear forward/predict methods.
- Training: Device-agnostic; optimizers like AdamW.

---

## 8. Documentation

- **Functions:** NatSpec/JSDoc with params, returns, throws, examples.
- **Inline Comments:** Explain "why" (not "what"); for complex logic.
- **README:** Project desc, features, prereqs, install/config/usage/test/deploy, license (MIT).

---

## 9. Testing

- Coverage: 95% contracts; 80% backend/AI; 70% frontend.
- Structure: Describe/it; setup/teardown; arrange-act-assert.
- Tools: Forge for Solidity; Jest for JS/TS; pytest for Python.
- Test edges, errors, security.

---

## 10. Security

**Checklist:**
- Reentrancy (CEI/ReentrancyGuard).
- Access control.
- Overflow/underflow.
- Input validation.
- No hardcoded secrets; use env vars.
- Mitigate external calls, oracles, flash loans.

**Env Vars:** Use `.env` (gitignored); example committed.

---

## 11. Git Workflow

**Branches:** `main` (prod), `develop` (integration), `feature/xxx`, `fix/xxx`, `hotfix/xxx`, `release/vx.x.x`.
**Developer Branches:** Each developer must always work on development tasks on their specific branch bearing their name in lowercase (e.g., "darlington_gospel") for easy traceability. All commits from the developer will go into this branch, and a descriptive PR must be created upon completing and in alignment to the subtask given to them.
**Commits:** Conventional: `feat(scope): subject` (e.g., `feat(wallet): add MetaMask`).
**PR Template:** Desc, change type, testing, checklist (style, security, docs). See our Notion workspace for more details.

---

## 12. Code Review Checklist

- **Functionality:** Purpose met; edges/errors handled.
- **Quality:** Conventions followed; no duplication; readable.
- **Security:** Validation; no secrets; vulnerabilities addressed.
- **Testing:** Coverage; meaningful tests.
- **Docs:** Functions/complexity explained; README updated.

---

## 13. Tools & Linters

- **Contracts:** Solhint, Slither, Mythril, Hardhat.
- **JS/TS:** ESLint, Prettier, TS compiler (rules: no-any, explicit returns, max-len 100, complexity ≤10).
- **Python:** pylint, black, mypy.
- Enforce via CI.

---

## 14. Continuous Improvement

Update for new tech, practices, feedback. Review quarterly.

**Last Review:** December 30, 2025  
**Next Review:** March 31, 2026

Contact Engineering for questions/PRs. Focus on secure, maintainable systems.