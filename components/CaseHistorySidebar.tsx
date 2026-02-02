import React from 'react';
import { FolderOpen, FileText, Calendar, Clock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { Case, CaseStatus } from './types';

interface CaseHistorySidebarProps {
  cases: Case[];
  currentCase: Case | null;
  onSelectCase: (caseId: string) => void;
}

const CaseHistorySidebar: React.FC<CaseHistorySidebarProps> = ({ cases, currentCase, onSelectCase }) => {

  const getStatusIcon = (status: Case['status']) => {
    switch (status) {
      case CaseStatus.IN_TRIAL:
        return <Clock className="w-3 h-3 text-green-400" />;
      case CaseStatus.COMPLETED:
        return <CheckCircle2 className="w-3 h-3 text-blue-400" />;
      case CaseStatus.PENDING:
        return <MinusCircle className="w-3 h-3 text-slate-400" />;
      default:
        return <XCircle className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Case['status']) => {
    switch (status) {
      case CaseStatus.IN_TRIAL:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case CaseStatus.COMPLETED:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case CaseStatus.PENDING:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
  };

  const getStatusLabel = (status: Case['status']) => {
    switch (status) {
      case CaseStatus.PENDING:
        return 'PENDING';
      case CaseStatus.IN_TRIAL:
        return 'IN TRIAL';
      case CaseStatus.COMPLETED:
        return 'COMPLETED';
      default:
        return 'APPEALED';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Compact Header */}
      <div className="px-3 py-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Case History</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {cases.length}
          </span>
        </div>
      </div>

      {/* Cases List - Optimized for scrolling */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 custom-scrollbar">
        {cases.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400 mb-1 font-medium">No cases yet</p>
            <p className="text-xs text-slate-500">File your first case to get started</p>
          </div>
        ) : (
          cases.map((case_) => (
            <button
              key={case_.caseId.toString()}
              onClick={() => onSelectCase(case_.caseId.toString())}
              className={`
                w-full text-left p-2.5 rounded-lg border transition-all duration-200
                ${currentCase?.caseId === case_.caseId
                  ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800 hover:scale-[1.01]'
                }
              `}
            >
              {/* Title and Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-xs font-semibold text-white line-clamp-2 leading-tight flex-1">
                  {case_.caseTitle}
                </h3>
                {getStatusIcon(case_.status)}
              </div>

              {/* Evidence Hash - Truncated */}
              <div className="mb-2">
                <p className="text-[10px] text-slate-500 mb-0.5">Evidence:</p>
                <p className="text-xs text-cyan-400 font-mono truncate">
                  {case_.evidenceHash}
                </p>
              </div>

              {/* Date and Case ID */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(Number(case_.filedAt) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <span>ID: {case_.caseId.toString()}</span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(case_.status)}`}>
                  {getStatusLabel(case_.status)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer Tip */}
      <div className="px-3 py-2 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0">
        <p className="text-[10px] text-slate-500 text-center">
          💡 Click a case to view details
        </p>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </div>
  );
};

export default CaseHistorySidebar;