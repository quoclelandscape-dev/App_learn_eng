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
  const { id, type, title, description, duration = 6000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  // Icons and colors configuration based on type
  const config = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/90 border-emerald-500/30' : 'bg-white/95 border-emerald-250',
      shadow: 'shadow-emerald-500/10',
      progress: 'bg-emerald-500',
    },
    error: {
      icon: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/90 border-rose-500/30' : 'bg-white/95 border-rose-250',
      shadow: 'shadow-rose-500/10',
      progress: 'bg-rose-500',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/90 border-amber-500/30' : 'bg-white/95 border-amber-250',
      shadow: 'shadow-amber-500/10',
      progress: 'bg-amber-500',
    },
    info: {
      icon: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
      bg: theme === 'dark' ? 'bg-zinc-900/90 border-blue-500/30' : 'bg-white/95 border-blue-250',
      shadow: 'shadow-blue-500/10',
      progress: 'bg-blue-500',
    },
  }[type];

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border backdrop-blur-md p-4 shadow-xl transition-all duration-350 animate-slide-in-right ${config.bg} ${config.shadow}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 space-y-1">
          <h3 className={`text-sm font-bold tracking-wide ${theme === 'dark' ? 'text-zinc-150' : 'text-zinc-800'}`}>
            {title}
          </h3>
          <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-550'}`}>
            {description}
          </p>
        </div>
        <button
          onClick={() => onClose(id)}
          className={`rounded-full p-1 transition-colors ${
            theme === 'dark'
              ? 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
              : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
          }`}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress Bar Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-850/20">
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

// Inline custom CSS for Toast keyframes in index/global.css or standard class animations
