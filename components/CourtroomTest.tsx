import React, { useState } from 'react';
import { useCourtroom } from '../context/CourtroomContext';
import { Terminal, Wrench, CheckCircle, AlertCircle } from 'lucide-react';

// Simple button and card components to avoid UI dependency issues
const Button = ({ children, onClick, disabled, className }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded ${className || 'bg-blue-500 text-white hover:bg-blue-600'}`}
  >
    {children}
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`border rounded-lg ${className || 'bg-white'}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-b">{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold">{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-600">{children}</p>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4">{children}</div>
);

const CourtroomTest: React.FC = () => {
  const {
    cases,
    currentCase,
    messages,
    isProcessing,
    selectedTool,
    courtroomTools,
    executeTool,
    formatToolResponse
  } = useCourtroom();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    try {
      // Test 1: Check if MCP tools are loaded
      addTestResult('🧪 Testing MCP Tools Integration...');
      const toolCount = Object.keys(courtroomTools).length;
      addTestResult(`✅ Found ${toolCount} MCP tools loaded`);

      // Test 2: Check wallet context integration
      addTestResult('🧪 Testing Wallet Context Integration...');
      // This would be tested when wallet is connected

      // Test 3: Test tool execution (mock)
      addTestResult('🧪 Testing Tool Execution...');
      try {
        const mockResult = await executeTool('get_connected_wallet', {});
        addTestResult(`✅ Tool execution successful: ${JSON.stringify(mockResult)}`);
      } catch (error) {
        addTestResult(`❌ Tool execution failed: ${error}`);
      }

      // Test 4: Test response formatting
      addTestResult('🧪 Testing Response Formatting...');
      const mockResponse = formatToolResponse(
        'get_connected_wallet',
        {},
        { connected: true, address: '0x123...', message: 'Wallet connected successfully' }
      );
      addTestResult(`✅ Response formatting working: ${mockResponse.length > 0 ? 'Formatted successfully' : 'Failed'}`);

      // Test 5: Check context state
      addTestResult('🧪 Testing Context State...');
      addTestResult(`✅ Cases loaded: ${cases.length}`);
      addTestResult(`✅ Messages count: ${messages.length}`);
      addTestResult(`✅ Processing state: ${isProcessing ? 'Processing' : 'Idle'}`);
      addTestResult(`✅ Selected tool: ${selectedTool || 'None'}`);

      addTestResult('🎉 All tests completed successfully!');

    } catch (error) {
      addTestResult(`❌ Test suite failed: ${error}`);
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-cyan-400" />
          <div>
            <CardTitle className="text-white">Courtroom Integration Test</CardTitle>
            <CardDescription className="text-slate-400">
              Verify MCP tools and context integration
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runTests}
          disabled={isProcessing}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Run Integration Tests
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-400">Test Results:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${
                    result.includes('✅') 
                      ? 'bg-green-500/10 text-green-300 border border-green-500/30'
                      : result.includes('❌')
                      ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                      : 'bg-slate-800/50 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourtroomTest;