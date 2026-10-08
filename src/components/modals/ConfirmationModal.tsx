import React, { useEffect, useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, X, Loader2 } from 'lucide-react';

export interface ConfirmationModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isAdminAction?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmationModalProps {
  config: ConfirmationModalConfig | null;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ config, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && config?.isOpen && !isProcessing) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config?.isOpen, isProcessing]);

  if (!config || !config.isOpen) return null;

  const handleCancel = () => {
    if (isProcessing) return;
    if (config.onCancel) {
      config.onCancel();
    }
    onClose();
  };

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await config.onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirmation action error:', err);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDestructive = config.isDestructive !== false;
  const isAdmin = config.isAdminAction === true;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in zoom-in-95 duration-150 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${
            isAdmin 
              ? 'bg-purple-100 text-purple-700' 
              : isDestructive 
                ? 'bg-rose-100 text-rose-600' 
                : 'bg-amber-100 text-amber-700'
          }`}>
            {isAdmin ? (
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            ) : isDestructive ? (
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>

          <div className="flex-1 pr-4">
            {isAdmin && (
              <div className="inline-block text-[10px] font-mono uppercase tracking-wider font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded mb-1.5">
                Administrator Authority Action
              </div>
            )}
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {config.title}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
              {config.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {config.cancelText || 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
                <span>{config.confirmText || 'Yes, Delete'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
