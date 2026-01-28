import React from 'react';
import { Terminal, Sparkles, User, Bot, Shield, MessageSquare, FileText } from 'lucide-react';
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
      case 'plaintiff':
        return <User className="w-5 h-5 text-cyan-400" />;
      case 'defendant':
        return <Bot className="w-5 h-5 text-red-400" />;
      case 'judge':
        return <Shield className="w-5 h-5 text-purple-400" />;
      case 'system':
        return <MessageSquare className="w-5 h-5 text-slate-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-400" />;
    }
  };

  const getRoleColor = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return 'border-cyan-500/30 bg-cyan-500/5';
      case 'assistant':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'plaintiff':
        return 'border-cyan-500/50 bg-cyan-500/10';
      case 'defendant':
        return 'border-red-500/50 bg-red-500/10';
      case 'judge':
        return 'border-purple-500/50 bg-purple-500/10';
      case 'system':
        return 'border-slate-500/50 bg-slate-500/10';
      default:
        return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  const getRoleName = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'RumbleCourt AI';
      case 'plaintiff':
        return 'Plaintiff Attorney';
      case 'defendant':
        return 'Defendant Attorney';
      case 'judge':
        return 'The Honorable Judge';
      case 'system':
        return 'Court System';
      default:
        return 'Unknown';
    }
  };

  const getBorderColor = (role: ChatMessage['role']) => {
    switch (role) {
      case 'user':
        return 'border-cyan-500/50';
      case 'assistant':
        return 'border-purple-500/50';
      case 'plaintiff':
        return 'border-cyan-500/50';
      case 'defendant':
        return 'border-red-500/50';
      case 'judge':
        return 'border-purple-500/50';
      case 'system':
        return 'border-slate-500/50';
      default:
        return 'border-slate-500/50';
    }
  };

  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${getRoleColor(message.role)} transition-all duration-300`}>
      <div className="flex-shrink-0">
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
        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{message.content}</p>
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