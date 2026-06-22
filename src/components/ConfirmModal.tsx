import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border z-10 flex flex-col"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)'
            }}
          >
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-2.5">
                {danger && (
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                )}
                <h3 className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[var(--notion-bg-hover)] text-stone-400 hover:text-stone-600 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {message}
              </p>
            </div>

            {/* Footer Buttons */}
            <div 
              className="p-4 px-6 border-t flex items-center justify-end gap-3" 
              style={{ 
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--bg-elevated)'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-xl font-medium border cursor-pointer hover:bg-[var(--notion-bg-hover)] transition-colors bg-transparent"
                style={{ 
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-default)'
                }}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-xs rounded-xl font-bold cursor-pointer transition-transform duration-100 hover:scale-[1.02] active:scale-[0.98] text-white`}
                style={{ 
                  backgroundColor: danger ? '#ef4444' : 'var(--notion-accent-blue)'
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
