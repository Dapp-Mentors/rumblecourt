import React from 'react';
import { Terminal, Sparkles, MessageSquare, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from './types';

interface TerminalMessageProps {
  message: ChatMessage;
}

const TerminalMessage: React.FC<TerminalMessageProps> = ({ message }) => {
  const getRoleIcon = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return <Terminal className="w-5 h-5 text-cyan-400" />;
      case 'assistant':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'system':
        return <MessageSquare className="w-5 h-5 text-slate-400" />;
      case 'prosecution':
        return <Terminal className="w-5 h-5 text-red-400" />;
      case 'defense':
        return <Terminal className="w-5 h-5 text-blue-400" />;
      case 'judge':
        return <Terminal className="w-5 h-5 text-yellow-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-400" />;
    }
  };

  const getRoleColor = (role: ChatMessage['role']): string => {
    switch (role) {
      case 'user':
        return 'border-cyan-500/30 bg-cyan-500/5';
      case 'assistant':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'system':
        return 'border-slate-500/50 bg-slate-500/10';
      case 'prosecution':
        return 'border-red-500/30 bg-red-500/5';
      case 'defense':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'judge':
        return 'border-yellow-500/30 bg-yellow-500/5';
      default:
        return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  const getRoleName = (role: ChatMessage['role']): string => {
    switch (role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'RumbleCourt AI';
      case 'system':
        return 'Court System';
      case 'prosecution':
        return 'Prosecution Lawyer';
      case 'defense':
        return 'Defense Lawyer';
      case 'judge':
        return 'AI Judge';
      default:
        return 'Unknown';
    }
  };

  const getBorderColor = (role: ChatMessage['role']): string => {
    switch (role) {
      case 'user':
        return 'border-cyan-500/50';
      case 'assistant':
        return 'border-purple-500/50';
      case 'system':
        return 'border-slate-500/50';
      case 'prosecution':
        return 'border-red-500/50';
      case 'defense':
        return 'border-blue-500/50';
      case 'judge':
        return 'border-yellow-500/50';
      default:
        return 'border-slate-500/50';
    }
  };

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${getRoleColor(message.role)} transition-all duration-300`}>
      <div className="shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 border-2 ${getBorderColor(message.role)}`}>
          {getRoleIcon(message.role)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-white">{getRoleName(message.role)}</span>
          <span className="text-xs text-slate-500" suppressHydrationWarning={true}>
            {message.timestampString}
          </span>
        </div>

        <div className="text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              // Headings
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b border-slate-700">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-white mt-5 mb-3">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">
                  {children}
                </h3>
              ),

              // Paragraphs
              p: ({ children }) => (
                <p className="mb-4 text-slate-300 leading-relaxed">
                  {children}
                </p>
              ),

              // Lists
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-2 text-slate-300">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-2 text-slate-300">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="ml-2 text-slate-300">
                  {children}
                </li>
              ),

              // Code
              code: ({ className, children }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-sm border border-slate-700">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="block p-4 rounded-lg bg-slate-900 text-cyan-300 font-mono text-sm overflow-x-auto border border-slate-700 my-3">
                    {children}
                  </code>
                );
              },

              // Blockquotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-slate-800/30 italic text-slate-400">
                  {children}
                </blockquote>
              ),

              // Links
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 hover:decoration-cyan-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),

              // Strong/Bold
              strong: ({ children }) => (
                <strong className="font-bold text-white">
                  {children}
                </strong>
              ),

              // Emphasis/Italic
              em: ({ children }) => (
                <em className="italic text-slate-300">
                  {children}
                </em>
              ),

              // Horizontal Rule
              hr: () => (
                <hr className="my-6 border-slate-700" />
              ),

              // Tables
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border border-slate-700 rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-800">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2 text-left text-white font-semibold border-b border-slate-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 text-slate-300 border-b border-slate-800">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.evidence && (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-300">{message.evidence.description}</span>
            </div>
            <p className="text-sm text-slate-400">{message.evidence.content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalMessage;