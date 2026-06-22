'use client';

import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dialogueTitle: string;
  theme: 'dark' | 'light';
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  dialogueTitle,
  theme,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-0 md:p-4">
      <div className={`w-full max-w-md overflow-hidden rounded-t-3xl md:rounded-2xl border p-6 shadow-2xl transition-colors duration-200 ${
        theme === 'dark'
          ? 'border-white/10 bg-zinc-900/95 text-zinc-100 shadow-purple-500/10'
          : 'border-zinc-200 bg-white text-zinc-900 shadow-zinc-300/50'
      }`}>
        {/* Drag handle decoration */}
        <div className="flex justify-center pb-3 -mt-2 flex-shrink-0 md:hidden">
          <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-250'}`} />
        </div>
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-450">
              <AlertTriangle size={20} className="animate-pulse text-red-500" />
            </div>
            <h2 className="text-lg font-semibold tracking-wide">Xác Nhận Xóa Hội Thoại</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${
              theme === 'dark' 
                ? 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100' 
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          <p className={`text-sm leading-relaxed ${
            theme === 'dark' ? 'text-zinc-300' : 'text-zinc-650'
          }`}>
            Bạn có chắc chắn muốn xóa cuộc hội thoại <span className="font-semibold text-purple-500 dark:text-purple-400">&quot;{dialogueTitle}&quot;</span> này không?
          </p>
          <div className={`p-3 rounded-xl border text-2xs flex items-start gap-2.5 ${
            theme === 'dark' 
              ? 'bg-amber-500/5 border-amber-500/10 text-amber-400/90' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <span className="font-bold uppercase tracking-wide mt-0.5">Chú ý:</span>
            <span>Hội thoại này sẽ được ẩn khỏi giao diện học tập của bạn, nhưng bạn có thể phục hồi lại từ cơ sở dữ liệu nếu cần thiết (Xóa mềm).</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 mt-6 pt-4 border-t ${
          theme === 'dark' ? 'border-white/5' : 'border-zinc-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'border-white/10 hover:bg-white/5 text-zinc-300 bg-transparent'
                : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700 bg-white'
            }`}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-650 py-3 text-sm font-medium text-white shadow-lg shadow-red-600/20 hover:bg-red-550 transition-all active:scale-[0.98]"
          >
            <Trash2 size={16} />
            Xóa hội thoại
          </button>
        </div>
      </div>
    </div>
  );
}
