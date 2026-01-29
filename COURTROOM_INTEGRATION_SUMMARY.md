# RumbleCourt AI - MCP Tools Integration Summary

## Overview

Successfully integrated the courtroom MCP tools into the RumbleCourt AI application. The integration provides blockchain-powered legal simulation with AI-driven command processing via OpenRouter API.

## Key Components Integrated

### 1. MCP Tools (`lib/courtroom-mcp-tools.ts`)
- **Location**: `lib/courtroom-mcp-tools.ts`
- **Purpose**: Contains all blockchain tools for courtroom management
- **Tools Available**:
  - Verdict Storage: `add_authorized_judge`, `record_verdict`, `finalize_verdict`
  - Appeals: `file_appeal`, `update_appeal_status`, `schedule_appeal_hearing`
  - Adjournments: `request_adjournment`, `approve_adjournment`, `emergency_reschedule`
  - Courtroom Participants: `create_participant_profile`, `create_court`, `assign_participant_to_court`
  - Utilities: `get_connected_wallet`

### 2. Context Provider (`context/CourtroomContext.tsx`)
- **Location**: `context/CourtroomContext.tsx`
- **Purpose**: Manages state and provides MCP tools to components
- **Features**:
  - State management for cases, messages, and processing status
  - Wallet context integration
  - Tool execution and response formatting
  - OpenRouter API integration for AI command processing

### 3. Updated Components

#### CourtroomSimulation (`components/CourtroomSimulation.tsx`)
- **Changes**: Now uses `useCourtroom` hook instead of local state
- **Features**: Command processing, case management, AI integration

#### CaseHistorySidebar (`components/CaseHistorySidebar.tsx`)
- **Changes**: Uses CourtroomContext for case data and selection
- **Features**: Case listing, status indicators, selection handling

#### TerminalMessage (`components/TerminalMessage.tsx`)
- **Changes**: Added additional icons for MCP tool responses
- **Features**: Enhanced message display with tool execution results

#### Types (`components/types.ts`)
- **Changes**: Added comprehensive MCP tool type definitions
- **Features**: TypeScript interfaces for all MCP tool data structures

### 4. Page Integration (`app/courtroom/page.tsx`)
- **Changes**: Wrapped CourtroomSimulation with CourtroomProvider
- **Features**: Protected route with wallet connection requirement

## Architecture

```
CourtroomPage
├── CourtroomProvider (Context)
│   ├── CourtroomSimulation (Main Component)
│   │   ├── CaseHistorySidebar (Case Management)
│   │   ├── TerminalMessage (Message Display)
│   │   └── CourtroomTest (Integration Testing)
│   └── MCP Tools Integration
│       ├── Tool Execution
│       ├── Response Formatting
│       └── OpenRouter API
└── ProtectedRoute (Wallet Integration)
```

## How to Use

### 1. Environment Setup
Set the following environment variables:
```bash
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

### 2. Available Commands
The AI assistant can process these commands:

#### Case Management
- `create new case` - Create a new legal case
- `list cases` - Show all available cases
- `show case details` - Display current case information
- `start trial` - Begin AI attorney debate

#### Blockchain Operations
- `record verdict` - Record a verdict on-chain
- `file appeal` - File an appeal against a verdict
- `request adjournment` - Request hearing delay
- `create participant` - Create a courtroom participant profile
- `create court` - Create a new court
- `assign participant` - Assign participant to court

#### Tool Usage
- `use [tool name] tool` - Select a specific MCP tool
- Provide parameters in format: `param1: value1, param2: value2`

### 3. Example Workflow

1. **Connect Wallet**: User connects their wallet via MetaMask
2. **Create Case**: User types "create new case"
3. **AI Processing**: OpenRouter processes the command
4. **Tool Execution**: MCP tools execute blockchain operations
5. **Response Formatting**: Results are formatted and displayed
6. **Transaction**: Blockchain transactions are signed and submitted

### 4. Tool Parameter Examples

```bash
# Record a verdict
use record verdict tool
caseId: 123, verdictType: GUILTY, verdictDetails: "The defendant is found guilty", reasoning: "Evidence shows clear violation", isFinal: true

# File an appeal
use file appeal tool  
originalVerdictId: 456, appealReason: "New evidence discovered", appealDocumentsText: ["document1.pdf", "document2.pdf"]

# Request adjournment
use request adjournment tool
caseId: 789, reason: MEDICAL, reasonDetails: "Doctor's appointment", requestedNewDate: 1704067200
```

## Technical Features

### 1. OpenRouter Integration
- Uses Claude Sonnet 4 model for AI processing
- Supports tool calling for blockchain operations
- Automatic parameter extraction from user commands
- Error handling and fallback responses

### 2. Blockchain Integration
- Ethereum, Polygon, and Polygon Amoy support
- Transaction signing via connected wallet
- Blockchain explorer links for transparency
- Immutable verdict and appeal storage

### 3. Response Formatting
- Markdown formatting for rich display
- Transaction hash and blockchain links
- Structured data presentation
- Error handling and user feedback

### 4. State Management
- Context-based state sharing
- Real-time updates across components
- Processing state management
- Tool selection and parameter handling

## Testing

### Integration Test Component
- **Location**: `components/CourtroomTest.tsx`
- **Purpose**: Verify MCP tools and context integration
- **Features**: Automated testing of tool loading, execution, and formatting

### Test Commands
1. Navigate to courtroom page
2. Open developer tools console
3. Run integration tests via the test component
4. Verify all MCP tools are loaded and functional

## Security Considerations

### 1. Wallet Integration
- Only connects when explicitly requested
- Secure transaction signing
- Network validation (Ethereum, Polygon, Polygon Amoy)

### 2. API Security
- OpenRouter API key protection
- Request validation and sanitization
- Error handling without exposing sensitive data

### 3. Data Privacy
- Local state management
- No unnecessary data persistence
- Secure blockchain transactions

## Future Enhancements

### 1. Additional Tools
- Evidence management tools
- Jury selection and management
- Court scheduling and management
- Legal document generation

### 2. Enhanced AI
- Multi-model support (GPT-4, Claude, Gemini)
- Custom legal knowledge base
- Advanced natural language understanding
- Context-aware responses

### 3. User Experience
- Voice command support
- Advanced case visualization
- Real-time collaboration features
- Mobile app integration

## Troubleshooting

### Common Issues

1. **API Key Not Set**
   - Ensure `NEXT_PUBLIC_OPENROUTER_API_KEY` is configured
   - Check environment variable loading

2. **Wallet Not Connected**
   - Verify MetaMask installation and connection
   - Check network compatibility (Ethereum, Polygon, Polygon Amoy)

3. **Tool Execution Failures**
   - Check parameter format and completeness
   - Verify wallet has sufficient funds for transactions
   - Review blockchain network status

4. **AI Response Issues**
   - Check OpenRouter API status
   - Verify model availability
   - Review prompt formatting

### Debug Information
- Console logs for tool execution
- Network requests monitoring
- State changes tracking
- Error boundary handling

## Conclusion

The integration successfully combines blockchain technology with AI-powered legal simulation, providing a comprehensive courtroom management system. The modular architecture allows for easy extension and maintenance, while the MCP tools framework ensures seamless blockchain integration.

For support or questions, refer to the code comments and documentation within each component.