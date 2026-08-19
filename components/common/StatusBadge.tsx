import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, FileText, Send, RotateCcw } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Approved by HoD',
        };
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Send className="w-3.5 h-3.5 mr-1" />,
          label: status === 'RESUBMITTED' ? 'Resubmitted' : 'Submitted for Review',
        };
      case 'RETURNED_FOR_CORRECTION':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <RotateCcw className="w-3.5 h-3.5 mr-1" />,
          label: 'Returned for Correction',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          label: 'In Progress',
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <FileText className="w-3.5 h-3.5 mr-1" />,
          label: 'Assigned',
        };
      case 'FINALIZED':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Curriculum Finalized',
        };
      case 'OVERDUE':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
          label: 'Overdue',
        };
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Active Stage',
        };
      case 'INACTIVE':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: <Clock className="w-3.5 h-3.5 mr-1" />,
          label: 'Upcoming Stage',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <FileText className="w-3.5 h-3.5 mr-1" />,
          label: status.replace(/_/g, ' '),
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${className}`}>
      {style.icon}
      {style.label}
    </span>
  );
};
