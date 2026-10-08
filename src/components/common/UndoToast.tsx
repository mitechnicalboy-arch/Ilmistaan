import React, { useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';

export const UndoToast: React.FC = () => {
  const { undoToast, setUndoToast } = useAcademic();

  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [undoToast, setUndoToast]);

  if (!undoToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-3 text-xs border border-slate-700">
        <span>{undoToast.message}</span>
        <button
          onClick={() => {
            undoToast.onUndo();
            setUndoToast(null);
          }}
          className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 ml-2 uppercase tracking-wider text-[11px] underline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>
        <button
          onClick={() => setUndoToast(null)}
          className="text-slate-400 hover:text-white p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
