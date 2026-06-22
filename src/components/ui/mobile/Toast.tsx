'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
  theme: 'dark' | 'light';
}

export default function Toast({ toast, onClose, theme }: ToastProps) {
  const { id, type, title, description, duration = 5000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      icon: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/95 border-emerald-500/20' : 'bg-white/95 border-emerald-200',
      shadow: 'shadow-emerald-500/5',
      progress: 'bg-emerald-500',
    },
    error: {
      icon: <XCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/95 border-rose-500/20' : 'bg-white/95 border-rose-200',
      shadow: 'shadow-rose-500/5',
      progress: 'bg-rose-500',
    },
    warning: {
      icon: <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/95 border-amber-500/20' : 'bg-white/95 border-amber-200',
      shadow: 'shadow-amber-500/5',
      progress: 'bg-amber-500',
    },
    info: {
      icon: <Info className="h-4.5 w-4.5 text-blue-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/95 border-blue-500/20' : 'bg-white/95 border-blue-200',
      shadow: 'shadow-blue-500/5',
      progress: 'bg-blue-500',
    },
  }[type];

  return (
    <div
      className={`pointer-events-auto relative w-full overflow-hidden rounded-xl border backdrop-blur-md p-3.5 shadow-lg transition-all duration-300 animate-slide-up-mobile ${config.bg} ${config.shadow}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        {config.icon}
        <div className="flex-1 space-y-0.5 min-w-0">
          <h3 className={`text-2xs font-extrabold tracking-wide truncate ${theme === 'dark' ? 'text-zinc-150' : 'text-zinc-800'}`}>
            {title}
          </h3>
          <p className={`text-3xs leading-relaxed break-words ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-550'}`}>
            {description}
          </p>
        </div>
        <button
          onClick={() => onClose(id)}
          className={`rounded-lg p-1 transition-colors shrink-0 ${
            theme === 'dark'
              ? 'text-zinc-555 hover:bg-white/5 hover:text-zinc-300'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
          }`}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress Bar Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800/10">
        <div
          className={`h-full ${config.progress} transition-all linear`}
          style={{
            animation: `shrink-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}
