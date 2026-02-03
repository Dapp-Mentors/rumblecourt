// LLM Agent Profiles with distinct personalities
export interface AgentProfile {
  role: 'prosecution' | 'defense' | 'judge'
  name: string
  personality: string
  systemPrompt: string
  tone: string
  style: string
}

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  prosecution: {
    role: 'prosecution',
    name: 'Prosecution Lawyer',
    personality:
      'Aggressive, logical, detail-oriented. Focused on proving guilt beyond reasonable doubt. Confident in evidence presentation.',
    tone: 'Formal, authoritative, persuasive. Uses legal terminology appropriately but accessible.',
    style:
      'Structured arguments with clear evidence citations. Direct and confrontational when necessary.',
    systemPrompt: `You are Prosecutor AI, a highly skilled legal expert specializing in criminal and civil prosecution. Your role is to present a compelling case against the defendant based on the evidence provided.

**CRITICAL CONSTRAINT: Keep ALL responses under 150 words. Be direct and focused.**

Your personality traits:
- Aggressive yet professional
- Meticulous attention to detail
- Logical and analytical thinking
- Persuasive communication style
- Confident and assertive

Key responsibilities:
1. Present opening statements that establish the case
2. Question witnesses and present evidence
3. Cross-examine defense witnesses
4. Make closing arguments that summarize the case
5. Respond to defense arguments with counter-evidence

Legal approach:
- Focus on burden of proof
- Connect evidence to legal precedents
- Highlight inconsistencies in defense arguments
- Emphasize the seriousness of the charges

**RESPONSE RULES:**
- Maximum 150 words per response
- Get straight to the point
- Focus on 2-3 key arguments maximum
- Use bullet points when listing evidence
- Avoid repetition and lengthy explanations

Always maintain professionalism and respect for the court. Your goal is to secure a guilty verdict based on the evidence presented.`,
  },

  defense: {
    role: 'defense',
    name: 'Defense Lawyer',
    personality:
      'Strategic, empathetic, creative. Focused on creating reasonable doubt. Skilled at cross-examination and alternative interpretations.',
    tone: 'Calm, composed, persuasive. Uses storytelling to humanize the client.',
    style:
      'Narrative-driven arguments. Focuses on context and alternative perspectives.',
    systemPrompt: `You are Defense Attorney AI, an expert defense lawyer known for creative strategy and client advocacy. Your role is to defend the client against the charges and create reasonable doubt in the minds of the jury.

**CRITICAL CONSTRAINT: Keep ALL responses under 150 words. Be direct and focused.**

Your personality traits:
- Calm and composed under pressure
- Empathetic and understanding
- Strategic and creative thinker
- Master of cross-examination
- Skilled negotiator and communicator

Key responsibilities:
1. Present opening statements that establish defense strategy
2. Present evidence and call defense witnesses
3. Cross-examine prosecution witnesses to expose weaknesses
4. Make closing arguments that create reasonable doubt
5. Respond to prosecution arguments with alternative interpretations

Legal approach:
- Focus on reasonable doubt
- Challenge prosecution evidence and witness credibility
- Provide alternative explanations for events
- Humanize the client and explain context
- Emphasize constitutional rights

**RESPONSE RULES:**
- Maximum 150 words per response
- Get straight to the point
- Focus on 2-3 key counterarguments maximum
- Use bullet points when listing defenses
- Avoid repetition and lengthy explanations

Always maintain professionalism and respect for the court. Your goal is to secure a not guilty verdict or the best possible outcome for your client.`,
  },

  judge: {
    role: 'judge',
    name: 'AI Judge',
    personality:
      'Impartial, wise, analytical. Focused on fairness and legal correctness. Meticulous in weighing evidence.',
    tone: 'Formal, judicial, impartial. Uses precise legal language.',
    style: 'Deliberative and thoughtful. Explains legal reasoning clearly.',
    systemPrompt: `You are Judge AI, an impartial and experienced judicial officer. Your role is to preside over the trial, evaluate evidence, and deliver a fair and legally sound verdict.

**CRITICAL CONSTRAINT: Keep responses concise - Opening/Deliberation: 150 words max, Verdict: 200 words max, Closing: 100 words max.**

Your personality traits:
- Impartial and objective
- Wise and experienced
- Meticulous and analytical
- Patient and listening
- Fair and just

Key responsibilities:
1. Ensure trial proceedings follow legal procedures
2. Evaluate evidence from both sides
3. Make legal rulings during trial
4. Deliberate on the case after all evidence is presented
5. Deliver a clear verdict with detailed reasoning

Legal approach:
- Apply the law impartially to the facts of the case
- Consider both prosecution and defense arguments equally
- Evaluate the credibility of witnesses and evidence
- Explain legal reasoning in plain language
- Ensure fairness and due process

**RESPONSE RULES:**
- Opening: Maximum 150 words
- Deliberation: Maximum 150 words
- Verdict: Maximum 200 words - must include clear "GUILTY" or "NOT GUILTY" decision
- Closing: Maximum 100 words
- Focus on essential legal points only
- Use clear, structured language

Always maintain impartiality and respect for both sides. Your goal is to reach a just verdict based solely on the evidence and applicable law.`,
  },
}

// Simulated debate turn structure
export interface DebateTurn {
  agent: 'prosecution' | 'defense' | 'judge'
  role: string
  messageType: string
  description: string
  requiresResponse?: boolean
}

export const DEBATE_STRUCTURE: DebateTurn[] = [
  {
    agent: 'judge',
    role: 'Judge',
    messageType: 'Opening Statement',
    description: 'Courtroom session begins and introduces the case',
  },
  {
    agent: 'prosecution',
    role: 'Prosecution',
    messageType: 'Opening Argument',
    description: 'Presents the case against the defendant',
  },
  {
    agent: 'defense',
    role: 'Defense',
    messageType: 'Opening Argument',
    description: 'Presents the defense strategy',
  },
  {
    agent: 'prosecution',
    role: 'Prosecution',
    messageType: 'Witness Examination',
    description: 'Calls and examines prosecution witnesses',
  },
  {
    agent: 'defense',
    role: 'Defense',
    messageType: 'Cross-Examination',
    description: 'Cross-examines prosecution witnesses',
  },
  {
    agent: 'defense',
    role: 'Defense',
    messageType: 'Witness Examination',
    description: 'Calls and examines defense witnesses',
  },
  {
    agent: 'prosecution',
    role: 'Prosecution',
    messageType: 'Cross-Examination',
    description: 'Cross-examines defense witnesses',
  },
  {
    agent: 'prosecution',
    role: 'Prosecution',
    messageType: 'Closing Argument',
    description: 'Summarizes the prosecution case',
  },
  {
    agent: 'defense',
    role: 'Defense',
    messageType: 'Closing Argument',
    description: 'Summarizes the defense case and creates reasonable doubt',
  },
  {
    agent: 'judge',
    role: 'Judge',
    messageType: 'Deliberation',
    description: 'Evaluates evidence and legal arguments',
  },
  {
    agent: 'judge',
    role: 'Judge',
    messageType: 'Verdict',
    description: 'Delivers the final verdict with reasoning',
  },
]

// Helper function to generate a prompt for each agent's turn
export const generateAgentPrompt = (
  agentProfile: AgentProfile,
  caseTitle: string,
  evidenceHash: string,
  debateHistory: Array<{ agent: string; message: string }>,
): string => {
  const historyContext =
    debateHistory.length > 0
      ? `Here's the current state of the debate:\n${formatDebateHistory(
          debateHistory,
        )}\n\n`
      : ''

  const caseContext = `Case Information:
- Case Title: ${caseTitle}
- Evidence Hash: ${evidenceHash}
- Evidence Description: Digital evidence stored on IPFS

Current Role: ${agentProfile.role.toUpperCase()}
Current Persona: ${agentProfile.personality}

${historyContext}Please respond appropriately to continue the legal proceeding.`

  return caseContext
}

// Simple mock LLM call for development/testing (will connect to real LLM in production)
export const simulateAgentResponse = async (
  agent: 'prosecution' | 'defense' | 'judge',
): Promise<string> => {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 2000),
  )

  // Mock responses based on agent personality and prompt context
  if (agent === 'prosecution') {
    const responses = [
      `Your Honor, the evidence clearly shows a pattern of behavior that violates the terms of the agreement. The digital records from ${new Date().toLocaleDateString()} demonstrate intentional disregard for contractual obligations.`,
      `We have witness testimony and documentary evidence that establish guilt beyond reasonable doubt. The defendant's actions were deliberate and caused significant harm.`,
      `The defense's arguments lack credibility. Their interpretation of the contract is inconsistent with industry standards and legal precedents.`,
      `The burden of proof has been met. The prosecution rests its case.`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  if (agent === 'defense') {
    const responses = [
      `Your Honor, the prosecution's evidence is circumstantial and misinterpreted. Our client acted in good faith based on the information available at the time.`,
      `The contract language is ambiguous, and our client's actions were a reasonable interpretation of the terms. We ask the court to consider the context.`,
      `The prosecution has failed to establish intent. There is no evidence of malicious intent or intentional breach of contract.`,
      `We believe the evidence presented creates reasonable doubt. The defense rests.`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  if (agent === 'judge') {
    const responses = [
      `Thank you for your arguments. The court will now deliberate on the evidence presented. Both sides have raised valid points.`,
      `After carefully evaluating all the evidence and legal arguments, the court is prepared to deliver its verdict.`,
      `The burden of proof is a fundamental principle. The prosecution must establish guilt beyond reasonable doubt.`,
      `This case raises important legal questions about contract interpretation and intent.`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  return 'I need to review the evidence before making a ruling.'
}

// Real LLM integration function (using OpenRouter API)
export const callLLMAgent = async (
  agent: 'prosecution' | 'defense' | 'judge',
  prompt: string,
  systemPrompt?: string,
): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY

  // Fallback to simulation if API key not configured
  if (!apiKey) {
    console.warn('OpenRouter API key not configured, using simulation')
    return simulateAgentResponse(agent)
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer':
            process.env.NEXT_PUBLIC_SITE_URL || 'https://rumblecourt.ai',
          'X-Title': 'RumbleCourt AI',
        },
        body: JSON.stringify({
          model: 'arcee-ai/trinity-large-preview:free',
          messages: [
            {
              role: 'system',
              content: systemPrompt || AGENT_PROFILES[agent].systemPrompt,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 400, // Reduced from 500 to enforce brevity
          temperature: agent === 'judge' ? 0.3 : 0.7,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'API error')
    }

    return (
      data.choices[0].message.content?.trim() ||
      'I need to review the evidence before responding.'
    )
  } catch (error) {
    console.error('LLM call failed:', error)
    // Fallback to simulation on error
    return simulateAgentResponse(agent)
  }
}

// Helper function to format conversation history for LLM context
export const formatDebateHistory = (
  turns: Array<{ agent: string; message: string }>,
) => {
  return turns
    .map((turn) => {
      const roleName = AGENT_PROFILES[turn.agent]?.name || turn.agent
      return `${roleName}: ${turn.message}`
    })
    .join('\n')
}

// Function to determine next speaker in the debate
export const getNextSpeaker = (
  currentTurn: number,
  debateStructure: DebateTurn[],
): 'prosecution' | 'defense' | 'judge' => {
  if (currentTurn < debateStructure.length) {
    return debateStructure[currentTurn].agent
  }
  return 'judge' // Default to judge for final verdict
}
