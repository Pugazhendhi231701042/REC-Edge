import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, FileText, Send, RotateCcw, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'APPROVED':
      case 'DEAN_APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
          label: 'Dean Approved (Final)',
        };
      case 'HOD_APPROVED':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />,
          label: 'HoD Approved → Sent to Dean',
        };
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200 font-semibold',
          icon: <Send className="w-3.5 h-3.5 mr-1 text-blue-600" />,
          label: status === 'RESUBMITTED' ? 'Resubmitted to HoD' : 'Submitted to HoD',
        };
      case 'RETURNED_FOR_CORRECTION':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
          icon: <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-700" />,
          label: 'Returned by HoD',
        };
      case 'RETURNED_BY_DEAN':
        return {
          bg: 'bg-rose-50 text-rose-900 border-rose-300 font-semibold',
          icon: <RotateCcw className="w-3.5 h-3.5 mr-1 text-rose-700" />,
          label: 'Returned by Dean',
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-purple-600" />,
          label: 'In Progress',
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          icon: <FileText className="w-3.5 h-3.5 mr-1 text-sky-600" />,
          label: 'Faculty Assigned',
        };
      case 'FINALIZED':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-cyan-600" />,
          label: 'Curriculum Finalized',
        };
      case 'OVERDUE':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />,
          label: 'Overdue Stage',
        };
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${style.bg} ${className}`}>
      {style.icon}
      {style.label}
    </span>
  );
};
