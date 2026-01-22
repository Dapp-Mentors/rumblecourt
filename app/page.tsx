export default function Home(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8
                     bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">Rumble Court</h1>
        <p className="text-xl text-gray-700 mb-8">
          AI-Powered Financial Health Coach dApp
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Personalized Savings Plans
            </h3>
            <p className="text-gray-600">
              Get AI-generated, low-risk DeFi strategies tailored to your wallet and goals.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Blockchain-Verified Progress
            </h3>
            <p className="text-gray-600">
              Immutable on-chain tracking of your financial milestones and achievements.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              2026 Resolution Support
            </h3>
            <p className="text-gray-600">
              Build consistent saving habits with AI coaching and real-world impact measurement.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Features</h2>
          <ul className="text-left text-gray-700 space-y-2">
            <li>" Wallet integration with MetaMask/WalletConnect</li>
            <li>" Natural language goal input via chat interface</li>
            <li>" AI agent reasoning chains for responsible DeFi suggestions</li>
            <li>" Smart contract-based savings vaults</li>
            <li>" Text-to-audio coaching and PDF reports</li>
            <li>" Opik-powered evaluation and observability</li>
          </ul>
        </div>

        <div className="mt-12">
          <p className="text-gray-600">
            Built for the 2026 ETHGlobal Hackathon " Financial Health Category
          </p>
        </div>
      </div>
    </main>
  )
}