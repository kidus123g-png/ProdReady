import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning';
}

interface NotificationToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  isLightMode?: boolean;
}

export default function NotificationToast({ 
  toast, 
  onClose
}: NotificationToastProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsFadingOut(false);
      return;
    }

    setIsFadingOut(false);

    // Fade out starts at 2800ms, triggers onClose at 3000ms
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2800);

    const closeTimer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [toast, onClose]);

  if (!toast) return null;

  // Variant dot color mapping
  const dotColor = toast.type === 'success' ? 'var(--notion-green)' :
                   toast.type === 'warning' ? 'var(--notion-red)' : 'var(--notion-accent-blue)';

  return (
    <div 
      id="notification-toast-frame"
      className={`fixed bottom-6 right-6 z-55 w-full max-w-[320px] p-[10px_14px] text-[13px] rounded-[6px] border flex items-center justify-between gap-3 animate-slideInRight select-none transition-opacity duration-200 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundColor: 'var(--notion-bg-secondary)',
        borderColor: 'var(--notion-border)',
        color: 'var(--notion-text-primary)'
      }}
    >
      {/* Colored circular dot */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span 
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <p className="flex-1 min-w-0 font-sans leading-snug truncate" title={toast.text}>
          {toast.text}
        </p>
      </div>

      {/* Ghost style close button */}
      <button
        onClick={() => {
          setIsFadingOut(true);
          setTimeout(onClose, 200);
        }}
        className="p-1 rounded hover:bg-[var(--notion-bg-hover)] cursor-pointer transition-colors duration-100 flex items-center justify-center shrink-0 border-none bg-transparent"
        style={{ color: 'var(--notion-text-tertiary)' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
