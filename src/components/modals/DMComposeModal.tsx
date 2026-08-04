import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/store/toastStore';
import { useT } from '@/i18n/useT';

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: { recipient?: string; title?: string; body?: string };
}

export function DMComposeModal({ open, onClose, prefill }: Props) {
  const t = useT();
  const [recipient, setRecipient] = useState(prefill?.recipient ?? '');
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [body, setBody] = useState(prefill?.body ?? '');
  const toast = useToastStore((s) => s.show);

  function send() {
    toast(t.modals.dmSent);
    setRecipient(''); setTitle(''); setBody('');
    onClose();
  }

  const inputStyle = {
    border: '1.5px solid var(--c-bd)',
    borderRadius: '9px',
    backgroundColor: 'var(--c-inp-bg)',
    color: 'var(--c-tx1)',
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="420px">
      <div className="p-5">
        <div className="text-[15px] font-bold mb-4" style={{ color: 'var(--c-tx1)' }}>{t.modals.newDM}</div>

        <div className="mb-2.5">
          <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--c-tx2)' }}>{t.modals.recipient}</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t.modals.selectRecipient}
            className="w-full h-[38px] px-3 text-xs outline-none"
            style={inputStyle}
          />
        </div>

        <div className="mb-2.5">
          <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--c-tx2)' }}>{t.modals.subject}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.modals.enterSubject}
            className="w-full h-[38px] px-3 text-xs outline-none"
            style={inputStyle}
          />
        </div>

        <div className="mb-4">
          <label className="text-[11.5px] font-semibold mb-1 block" style={{ color: 'var(--c-tx2)' }}>{t.modals.content}</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t.modals.enterMessage}
            rows={3}
            className="w-full px-3 py-2 text-xs outline-none resize-none"
            style={inputStyle}
          />
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold border-none cursor-pointer"
            style={{ backgroundColor: 'var(--c-page-bg)', color: 'var(--c-tx2)' }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={send}
            className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold border-none cursor-pointer"
            style={{ backgroundColor: 'var(--c-pri)', color: '#fff' }}
          >
            {t.modals.sendDM}
          </button>
        </div>
      </div>
    </Modal>
  );
}
