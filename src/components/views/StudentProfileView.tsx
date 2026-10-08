import React, { useState } from 'react';
import { 
  User, 
  Download, 
  LogOut, 
  Globe, 
  ShieldCheck, 
  Mail, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const StudentProfileView: React.FC = () => {
  const { 
    currentUser, 
    semesters, 
    courses, 
    assignments, 
    lectures, 
    quizzes, 
    signOut 
  } = useAcademic();

  const [timezone, setTimezone] = useState(currentUser?.timezone || 'Asia/Karachi (GMT+5)');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isExported, setIsExported] = useState(false);

  // Complete data export to JSON backup file
  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      student: currentUser,
      semesters,
      courses,
      assignments,
      lectures,
      quizzes
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ilmistaan_backup_${currentUser?.name?.replace(/\s+/g, '_')}_fall2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setIsExported(true);
    setTimeout(() => setIsExported(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Student Profile & Data Portability
        </h2>
        <p className="text-xs text-slate-500">
          Manage your personal university credentials, timezones, and full JSON data backup
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xl flex items-center justify-center border-2 border-emerald-200">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{currentUser?.name}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono">{currentUser?.email}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold capitalize">
                {currentUser?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100">
          <div>
            <label className="block text-slate-400 font-medium mb-1">University Email</label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{currentUser?.email}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">University Timezone</label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="bg-transparent focus:outline-none w-full text-xs font-mono"
              >
                <option value="Asia/Karachi (GMT+5)">Asia/Karachi (GMT+5)</option>
                <option value="UTC (GMT+0)">UTC (GMT+0)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="Asia/Dubai (GST)">Asia/Dubai (GST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Portability Section */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
            Data Portability & Complete Backup
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Download an offline, unencrypted JSON backup file containing all your semesters, 9 enrolled courses, assignment deliverables, lecture curriculum notes, and quiz results.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Complete Academic Diary (JSON)</span>
            </button>

            {isExported && (
              <span className="text-xs font-medium text-emerald-700 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backup file downloaded successfully!</span>
              </span>
            )}
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-slate-900">Sign Out of Academic Session</div>
            <div className="text-[11px] text-slate-400">Safely terminate your university session on this device</div>
          </div>

          <button
            onClick={() => setShowSignOutModal(true)}
            className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showSignOutModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 text-center">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Confirm Sign Out</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to log out of your university student portal?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowSignOutModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutModal(false);
                  signOut();
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
