'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '@/types/notification';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Web Audio API Synthetic Chime
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Chord sequence C5 -> G5
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // User hasn't interacted with page yet, or audio blocked
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const duration = toast.duration || 5000;

      // Play soft chime sound
      playNotificationSound();

      setToasts((prev) => [...prev, { ...toast, id }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}

      {/* Floating Toast Container (Top-Right) */}
      <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bgColor = 'bg-white border-slate-200 text-slate-800';
          let icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;

          if (t.type === 'success') {
            bgColor = 'bg-white border-emerald-200/80 shadow-lg shadow-emerald-500/10 text-slate-900';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
          } else if (t.type === 'error') {
            bgColor = 'bg-white border-rose-200/80 shadow-lg shadow-rose-500/10 text-slate-900';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
          } else if (t.type === 'warning') {
            bgColor = 'bg-white border-amber-200/80 shadow-lg shadow-amber-500/10 text-slate-900';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-md flex items-start gap-3 transition-all transform animate-in slide-in-from-right duration-300 ${bgColor}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">{t.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
