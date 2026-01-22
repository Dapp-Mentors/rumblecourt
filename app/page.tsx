export default function Home(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8
                     bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">Rumble Court</h1>
        <p className="text-xl text-gray-700 mb-8">
          AI-Driven Courtroom Simulator
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Agent Litigation
            </h3>
            <p className="text-gray-600">
              LLM-powered opposing lawyers engage in fierce, real-time courtroom debates.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Blockchain Transparency
            </h3>
            <p className="text-gray-600">
              All proceedings and verdicts immutably recorded on-chain for complete transparency.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pre-Litigation Preview
            </h3>
            <p className="text-gray-600">
              Simulate trial outcomes before real-world litigation to save time and resources.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Core Features</h2>
          <ul className="text-left text-gray-700 space-y-2">
            <li>" Real-time AI lawyer debates on user-submitted evidence</li>
            <li>" Neutral judge LLM delivers binding verdicts</li>
            <li>" On-chain recording of trials and outcomes</li>
            <li>" Adjournment tracking and case history reference</li>
            <li>" Productivity enhancement for legal professionals</li>
            <li>" Opik-powered evaluation and observability</li>
          </ul>
        </div>

        <div className="mt-12">
          <p className="text-gray-600">
            Built for the 2026 ETHGlobal Hackathon " Legal Technology Category
          </p>
        </div>
      </div>
    </main>
  )
}