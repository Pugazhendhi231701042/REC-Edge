import React from 'react';
import { Circle, CheckCircle2, Clock, RotateCcw, Send, FilePlus, UserCheck } from 'lucide-react';

interface TimelineEvent {
  label: string;
  user?: string;
  timestamp?: string | Date;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
}

interface ActivityTimelineProps {
  status: string;
  facultyName?: string;
  createdAt?: string | Date;
  assignedAt?: string | Date;
  updatedAt?: string | Date;
  approvedAt?: string | Date;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  status,
  facultyName,
  createdAt,
  assignedAt,
  updatedAt,
  approvedAt,
}) => {
  const events: TimelineEvent[] = [
    {
      label: 'Subject Created',
      user: 'HoD / MasterAdmin',
      timestamp: createdAt,
      status: 'completed',
      icon: <FilePlus className="w-4 h-4 text-emerald-600" />,
    },
    {
      label: 'Assigned to Faculty',
      user: facultyName || 'Faculty',
      timestamp: assignedAt,
      status: ['ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'RESUBMITTED', 'APPROVED'].includes(status) ? 'completed' : 'pending',
      icon: <UserCheck className="w-4 h-4 text-indigo-600" />,
    },
    {
      label: 'Syllabus Work Started',
      user: facultyName,
      timestamp: updatedAt,
      status: ['IN_PROGRESS', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'RESUBMITTED', 'APPROVED'].includes(status) ? 'completed' : 'pending',
      icon: <Clock className="w-4 h-4 text-purple-600" />,
    },
    {
      label: 'Submitted for Review',
      user: facultyName,
      timestamp: status === 'SUBMITTED' || status === 'APPROVED' ? updatedAt : undefined,
      status: ['SUBMITTED', 'RESUBMITTED', 'APPROVED'].includes(status) ? 'completed' : status === 'RETURNED_FOR_CORRECTION' ? 'current' : 'pending',
      icon: <Send className="w-4 h-4 text-blue-600" />,
    },
  ];

  if (status === 'RETURNED_FOR_CORRECTION') {
    events.push({
      label: 'Returned for Correction',
      user: 'HoD',
      timestamp: updatedAt,
      status: 'current',
      icon: <RotateCcw className="w-4 h-4 text-amber-600" />,
    });
  }

  events.push({
    label: 'Approved by HoD',
    user: 'HoD',
    timestamp: approvedAt,
    status: status === 'APPROVED' ? 'completed' : 'pending',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  });

  return (
    <div className="bg-white rounded-xl p-5 border border-purple-100 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center">
        <Clock className="w-4 h-4 mr-2 text-brand-600" />
        Activity Timeline
      </h4>
      <div className="relative border-l-2 border-purple-100 ml-3 space-y-6">
        {events.map((ev, idx) => (
          <div key={idx} className="relative pl-6">
            <div className={`absolute -left-[9px] top-0 p-1 rounded-full bg-white border ${ev.status === 'completed' ? 'border-emerald-500' : ev.status === 'current' ? 'border-amber-500' : 'border-slate-300'}`}>
              {ev.icon}
            </div>
            <div>
              <p className={`text-xs font-semibold ${ev.status === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>
                {ev.label}
              </p>
              {ev.user && ev.status !== 'pending' && (
                <p className="text-[11px] text-desc">{ev.user}</p>
              )}
              {ev.timestamp && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(ev.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
