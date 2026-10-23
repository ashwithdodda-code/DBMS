import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${isDestructive ? 'bg-rose-500/10 text-rose-400' : 'bg-[#C7F36B]/10 text-[#C7F36B]'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-[#93A1B2] leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#263241] mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-[#93A1B2] hover:text-[#F4F7FA] hover:bg-[#18212C] rounded-lg transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-[#C7F36B] hover:bg-[#b5e05a] text-[#080B10]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
