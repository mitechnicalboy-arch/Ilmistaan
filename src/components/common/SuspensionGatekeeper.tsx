import React from 'react';
import { AlertOctagon, Mail, LogOut } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const SuspensionGatekeeper: React.FC = () => {
  const { currentUser, signOut } = useAcademic();

  return (
    <div className="fixed inset-0 bg-[#F8FAF9] flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-rose-200 w-full max-w-md p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Account Suspended
        </h2>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Your student enrollment access for <strong className="text-slate-800">{currentUser?.name}</strong> has been temporarily placed on administrative hold by the university registrar.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-left mb-5 text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800">Resolution Checklist:</div>
          <p>• Verify semester registration fee clearance with the finance office.</p>
          <p>• Meet with your departmental academic advisor to resolve prerequisites.</p>
          <p>• Contact university IT helpdesk if you believe this is a technical error.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <a
            href="mailto:registrar@university.edu?subject=Account%20Suspension%20Inquiry"
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Registrar</span>
          </a>
          <button
            onClick={() => signOut()}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
