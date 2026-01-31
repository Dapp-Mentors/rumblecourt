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

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="px-4 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Case History</h2>
        </div>
        <p className="text-xs text-slate-500">{cases.length} total cases</p>
      </div>

      {/* Cases List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {cases.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No cases yet</p>
            <p className="text-xs mt-1">Create your first case</p>
          </div>
        ) : (
          cases.map((case_) => (
            <button
              key={case_.caseId.toString()}
              onClick={() => onSelectCase(case_.caseId.toString())}
              className={`
                w-full text-left p-3 rounded-lg border transition-all
                ${currentCase?.caseId === case_.caseId
                  ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                  : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white line-clamp-1">
                  {case_.caseTitle}
                </h3>
                {getStatusIcon(case_.status)}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                Evidence: {case_.evidenceHash}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(Number(case_.filedAt) * 1000).toLocaleDateString()}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full ${case_.status === CaseStatus.IN_TRIAL ? 'bg-green-500/20 text-green-300' :
                  case_.status === CaseStatus.COMPLETED ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                  {case_.status === CaseStatus.PENDING ? 'PENDING' :
                    case_.status === CaseStatus.IN_TRIAL ? 'IN_TRIAL' :
                      case_.status === CaseStatus.COMPLETED ? 'COMPLETED' :
                        'APPEALED'}
                </span>
                <span className="text-xs text-slate-600">
                  Case ID: {case_.caseId.toString()}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30 flex-shrink-0">
        <p className="text-xs text-slate-500 text-center">
          Use commands to manage cases
        </p>
      </div>
    </div>
  );
};

export default CaseHistorySidebar;