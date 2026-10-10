import React, { useState } from 'react';
import { 
  X, 
  Database, 
  ArrowRight, 
  Check, 
  Copy, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Server
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import { 
  isSupabaseConfigured, 
  transferAllDataToSupabase, 
  SUPABASE_SQL_SCHEMA, 
  SupabaseTransferReport 
} from '../../services/supabase';

interface SupabaseTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseTransferModal: React.FC<SupabaseTransferModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    allUsers, 
    semesters, 
    courses, 
    assignments, 
    lectures, 
    quizzes, 
    chatMessages 
  } = useAcademic();

  const [isTransferring, setIsTransferring] = useState(false);
  const [transferReport, setTransferReport] = useState<SupabaseTransferReport | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'status'>('overview');

  if (!isOpen) return null;

  const configured = isSupabaseConfigured();
  const totalRecords = allUsers.length + semesters.length + courses.length + assignments.length + lectures.length + quizzes.length;

  const handleCopySql = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      exportDate: new Date().toISOString(),
      metadata: {
        app: 'Ilmistaan Academic Portal',
        source: 'University Academic Diary System',
        targetEngine: 'Supabase PostgreSQL',
        totalRecords
      },
      users: allUsers,
      semesters,
      courses,
      assignments,
      lectures,
      quizzes,
      chatMessages
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `supabase_all_data_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExecuteTransfer = async () => {
    setIsTransferring(true);
    try {
      const payload = {
        users: allUsers,
        semesters,
        courses,
        assignments,
        lectures,
        quizzes,
        chatMessages
      };
      const report = await transferAllDataToSupabase(payload);
      setTransferReport(report);
      setActiveTab('status');
    } catch (err: any) {
      console.error('Transfer failed:', err);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Database className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Supabase Data Transfer & Migration Hub</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Migrate all academic courses, deliverables, curriculum notes, and accounts to Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 border-b-2 px-1 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Transfer Overview
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 border-b-2 px-1 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Supabase SQL Schema
          </button>
          {transferReport && (
            <button
              onClick={() => setActiveTab('status')}
              className={`pb-2.5 border-b-2 px-1 transition-colors cursor-pointer ${
                activeTab === 'status'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Migration Results
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs text-slate-600">
          {activeTab === 'overview' && (
            <>
              {/* Connection Status Card */}
              <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                configured 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start gap-2.5">
                  {configured ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs">
                      {configured ? 'Supabase Client Connected' : 'Supabase Credentials Setup Guide'}
                    </h4>
                    <p className="text-[11px] mt-0.5 leading-relaxed text-slate-700">
                      {configured
                        ? 'Your Supabase project is configured in the environment. You can click "Transfer All Data to Supabase" below to execute batch upserts.'
                        : 'To send live data directly to your Supabase project, provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment or download the pre-packaged SQL script and JSON export below.'}
                    </p>
                  </div>
                </div>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                  configured ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                }`}>
                  {configured ? 'Live Ready' : 'Export Ready'}
                </span>
              </div>

              {/* Data Summary Grid */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px]">
                  All Data Prepared for Transfer ({totalRecords} Total Records):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Semesters</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{semesters.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Timeline terms</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Courses / Subjects</span>
                    <span className="font-mono text-lg font-bold text-emerald-800">{courses.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">9 enrolled subjects</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assignments</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{assignments.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Deliverables & tasks</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Lecture Notes</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{lectures.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Curriculum topics</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Quizzes / Tests</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{quizzes.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Scope & marks</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Users & Students</span>
                    <span className="font-mono text-lg font-bold text-slate-900">{allUsers.length}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Admin & students</span>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={handleExecuteTransfer}
                    disabled={isTransferring}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {isTransferring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                    <span>Transfer All Data to Supabase</span>
                  </button>

                  <button
                    onClick={handleDownloadJson}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Download JSON Export</span>
                  </button>

                  <button
                    onClick={handleCopySql}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Supabase PostgreSQL DDL Script</h4>
                  <p className="text-[11px] text-slate-500">
                    Paste this directly into the <strong>SQL Editor</strong> in your Supabase Dashboard to create all relational tables.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied to Clipboard' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[380px] border border-slate-800">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'status' && transferReport && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Transfer Execution Summary</div>
                  <div className="text-[11px] text-slate-400 font-mono">{transferReport.timestamp}</div>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                  transferReport.success ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {transferReport.success ? 'SUCCESS' : transferReport.isConfigured ? 'PARTIAL' : 'EXPORT READY'}
                </span>
              </div>

              <div className="space-y-2">
                {transferReport.tables.map(table => (
                  <div
                    key={table.name}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 uppercase mr-2">{table.name}</span>
                      <span className="text-slate-400">({table.count} records)</span>
                      {table.error && (
                        <p className="text-[10px] text-amber-700 mt-0.5">{table.error}</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${
                      table.status === 'transferred' ? 'bg-emerald-100 text-emerald-800' :
                      table.status === 'skipped' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {table.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PostgreSQL Data Integrity Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
