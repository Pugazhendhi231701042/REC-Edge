'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SyllabusPDFGenerator } from '@/components/pdf/SyllabusPDFGenerator';
import {
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Send,
  Eye,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export default function DeanDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [extensionRequests, setExtensionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stage Initiation Modal State
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [targetStage, setTargetStage] = useState<any>(null);
  const [initiateDeadline, setInitiateDeadline] = useState('');
  const [submittingStage, setSubmittingStage] = useState(false);

  // Selected Approved Syllabus for Drilldown Viewer
  const [selectedSyllabus, setSelectedSyllabus] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOverview, resStages, resExt] = await Promise.all([
        fetch('/api/dean/overview'),
        fetch('/api/dean/stage'),
        fetch('/api/dean/extensions'),
      ]);

      if (resOverview.ok) {
        const data = await resOverview.json();
        setOverview(data);
      }
      if (resStages.ok) {
        const data = await resStages.json();
        setStages(data.stages || []);
      }
      if (resExt.ok) {
        const data = await resExt.json();
        setExtensionRequests(data.requests || []);
      }
    } catch (err: any) {
      setError('Failed to load Dean dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInitiate = (stg: any) => {
    setTargetStage(stg);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setInitiateDeadline(d.toISOString().slice(0, 16));
    setShowInitiateModal(true);
  };

  const handleConfirmInitiation = async () => {
    if (!targetStage || !initiateDeadline) return;
    setSubmittingStage(true);
    setError('');

    try {
      const res = await fetch('/api/dean/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: targetStage.id,
          deadline: initiateDeadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate stage.');

      setShowInitiateModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleDecisionExtension = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/dean/extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update extension request');
    }
  };

  const activeStage = stages.find((s) => s.status === 'ACTIVE');

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Governance & Progress</h1>
            <p className="text-xs text-desc mt-1">SuperAdmin / Dean Overview — Regulation 26 (2026–2027)</p>
          </div>

          {activeStage && (
            <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-purple-50 p-3 rounded-2xl border border-purple-200">
              <Clock className="w-5 h-5 text-brand-600 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase font-bold text-brand-700 tracking-wider">Active Academic Stage</p>
                <p className="text-xs font-bold text-slate-900">{activeStage.name}</p>
                <p className="text-[10px] text-desc">Deadline: {new Date(activeStage.deadline).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Key Institutional Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Departments"
            value={overview?.deptSummaries?.length || 0}
            subtitle="Active Academic Programmes"
            icon={<Building2 className="w-5 h-5 text-brand-600" />}
          />
          <StatCard
            title="Total Subjects"
            value={overview?.overallTotalSubjects || 0}
            subtitle="Formed in Curriculum"
            icon={<FileText className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Approved Syllabi"
            value={overview?.overallApproved || 0}
            subtitle="Approved by HoDs"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            colorClassName="text-emerald-700 bg-emerald-50 border-emerald-200"
          />
          <StatCard
            title="Institutional Completion"
            value={`${overview?.overallCompletionPercentage || 0}%`}
            subtitle="Syllabus Formation Progress"
            icon={<Sparkles className="w-5 h-5 text-amber-600" />}
            colorClassName="text-amber-700 bg-amber-50 border-amber-200"
          />
        </div>

        {/* Academic Workflow Stages */}
        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Academic Workflow Stages</h3>
              <p className="text-xs text-desc">Initiate stages and enforce institutional deadlines.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stages.map((stg) => (
              <div
                key={stg.id}
                className={`p-5 rounded-2xl border transition-all ${
                  stg.status === 'ACTIVE'
                    ? 'bg-purple-50/50 border-brand-300 shadow-md ring-1 ring-brand-500/20'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900">{stg.name}</span>
                  <StatusBadge status={stg.status} />
                </div>
                <p className="text-xs text-desc min-h-[36px]">{stg.description}</p>

                {stg.status === 'ACTIVE' ? (
                  <div className="mt-4 pt-3 border-t border-purple-200 flex items-center justify-between text-xs font-semibold text-brand-800">
                    <span>Deadline: {new Date(stg.deadline).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleOpenInitiate(stg)}
                      className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700 text-xs shadow-xs"
                    >
                      Update Deadline
                    </button>
                  </div>
                ) : stg.name === 'Curriculum & Syllabus Formation' ? (
                  <button
                    onClick={() => handleOpenInitiate(stg)}
                    className="mt-4 w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Initiate Stage</span>
                  </button>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-200 text-center text-xs font-semibold text-slate-400">
                    🔒 Placeholder Upcoming Stage
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Extension Requests */}
        {extensionRequests.filter((r) => r.status === 'PENDING').length > 0 && (
          <div className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 space-y-4">
            <h3 className="text-sm font-bold text-amber-900 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-amber-600" />
              Pending Deadline Extension Requests
            </h3>
            <div className="space-y-3">
              {extensionRequests
                .filter((r) => r.status === 'PENDING')
                .map((req) => (
                  <div key={req.id} className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {req.department?.programmeName} ({req.department?.shortName})
                      </p>
                      <p className="text-xs text-desc mt-0.5">
                        Requested by: <strong>{req.requestedBy?.name}</strong> | Requested New Deadline:{' '}
                        <strong className="text-amber-800">{new Date(req.requestedDeadline).toLocaleDateString()}</strong>
                      </p>
                      <p className="text-xs text-slate-700 mt-1 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        Reason: "{req.reason}"
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleDecisionExtension(req.id, 'APPROVE')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center"
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => handleDecisionExtension(req.id, 'REJECT')}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center"
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Department Progress Table */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Department-wise Formation Progress</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-purple-50 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Department / Programme</th>
                  <th className="p-3">HoD</th>
                  <th className="p-3 text-center">Subjects Formed</th>
                  <th className="p-3 text-center">Faculty Assigned</th>
                  <th className="p-3 text-center">Submitted</th>
                  <th className="p-3 text-center">HoD Approved</th>
                  <th className="p-3 text-center">Completion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview?.deptSummaries?.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      {d.programmeName} ({d.shortName})
                      <span className="block text-[10px] text-desc font-normal">Code: {d.departmentCode} | Semesters: {d.semesters}</span>
                    </td>
                    <td className="p-3 text-slate-700">{d.hodName}</td>
                    <td className="p-3 text-center font-semibold">{d.totalSubjects}</td>
                    <td className="p-3 text-center font-semibold text-indigo-600">{d.assignedCount}</td>
                    <td className="p-3 text-center font-semibold text-blue-600">{d.submittedCount}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{d.approvedCount}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${d.completionPercentage}%` }}></div>
                        </div>
                        <span className="font-bold text-slate-800">{d.completionPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approved Syllabi Directory */}
        <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Approved Syllabi Directory (Dean Access)</h3>
          <p className="text-xs text-desc">Only syllabi approved by Heads of Department are displayed here for institutional signoff.</p>

          {overview?.approvedSyllabi?.length === 0 ? (
            <p className="text-xs text-desc py-6 text-center">No syllabi have been approved by HoDs yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview?.approvedSyllabi?.map((subj: any) => (
                <div key={subj.id} className="p-4 border border-purple-100 rounded-xl bg-purple-50/20 hover:shadow-md transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-brand-700 uppercase bg-purple-100 px-2 py-0.5 rounded">
                      {subj.subjectCode}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{subj.subjectName}</h4>
                    <p className="text-[11px] text-desc">
                      Faculty: {subj.assignedFaculty?.name} | Dept: {subj.department?.shortName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSyllabus(subj)}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg flex items-center"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View & Print
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Printable PDF Modal */}
        {selectedSyllabus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-slate-900">Approved Syllabus Document Viewer</h3>
                <button onClick={() => setSelectedSyllabus(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <SyllabusPDFGenerator
                subject={selectedSyllabus}
                submission={selectedSyllabus.submission}
                documentTitle="Approved Syllabus Document"
              />
            </div>
          </div>
        )}

        {/* Stage Initiation Modal */}
        {showInitiateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Initiate Stage: {targetStage?.name}?</h3>
              <p className="text-xs text-desc">
                Starting this stage will send an institutional email alert and dashboard activation notification to all active Heads of Department.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Set Completion Deadline *</label>
                <input
                  type="datetime-local"
                  required
                  value={initiateDeadline}
                  onChange={(e) => setInitiateDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button onClick={() => setShowInitiateModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmInitiation}
                  disabled={submittingStage}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  {submittingStage ? 'Initiating...' : 'Confirm & Initiate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
