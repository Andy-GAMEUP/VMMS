import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToastStore } from '@/store/toastStore';
import { useT } from '@/i18n/useT';

interface UnstockedProduct {
  id: string;
  name: string;
  type: string;
  sub: string;
  price: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  products: UnstockedProduct[];
  onOpenDetail?: (product: UnstockedProduct) => void;
}

export function OrderModal({ open, onClose, products, onOpenDetail }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const toast = useToastStore((s) => s.show);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  function inc(id: string) {
    setSelected((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, 99) }));
  }

  function dec(id: string) {
    setSelected((prev) => {
      const qty = (prev[id] ?? 1) - 1;
      if (qty <= 0) { const next = { ...prev }; delete next[id]; return next; }
      return { ...prev, [id]: qty };
    });
  }

  function sendOrder() {
    const count = Object.keys(selected).length;
    if (count === 0) return;
    toast(t.modals.orderSent(count));
    setSelected({});
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="460px">
      <div className="p-5">
        <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--c-tx1)' }}>{t.modals.orderTitle}</div>
        <div className="text-[11.5px] leading-relaxed mb-3.5" style={{ color: 'var(--c-tx3)' }}>
          {t.modals.orderDesc}
        </div>

        {products.map((p) => {
          const checked = !!selected[p.id];
          const qty = selected[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className="flex items-center gap-2.5 p-2.5 rounded-[10px] mb-1.5"
              style={{ backgroundColor: 'var(--c-page-bg)' }}
            >
              {/* Checkbox */}
              <div
                onClick={() => toggle(p.id)}
                className="w-5 h-5 rounded-[5px] border-2 flex-shrink-0 cursor-pointer flex items-center justify-center text-xs font-bold"
                style={{
                  borderColor: checked ? 'var(--c-pri)' : 'var(--c-bd)',
                  backgroundColor: checked ? 'var(--c-pri)' : 'transparent',
                  color: checked ? '#fff' : 'transparent',
                }}
              >
                {checked ? '✓' : ''}
              </div>

              {/* Icon */}
              <div
                className="w-[38px] h-[38px] rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--c-pri-lt)', color: 'var(--c-pri)' }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 2h6v3.2l3 4.3V20a2 2 0 01-2 2H8a2 2 0 01-2-2V9.5l3-4.3V2zm2 2v2.6L8 10.6V20h8v-9.4l-3-4.3V4h-2z" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] font-semibold" style={{ color: 'var(--c-tx1)' }}>{p.name}</div>
                <div className="text-[9.5px]" style={{ color: 'var(--c-tx3)' }}>
                  {p.type} · {p.sub} · {p.price.toLocaleString()}원
                </div>
                {onOpenDetail && (
                  <span
                    onClick={() => onOpenDetail(p)}
                    className="inline-block text-[9px] font-semibold cursor-pointer mt-1 px-1.5 py-0.5 border rounded"
                    style={{ color: 'var(--c-pri)', borderColor: 'var(--c-pri)' }}
                  >
                    {t.machines.detailInfo}
                  </span>
                )}
              </div>

              {/* Qty control */}
              {checked && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => dec(p.id)}
                    className="w-[25px] h-[25px] rounded-[7px] border text-sm font-semibold cursor-pointer"
                    style={{ borderColor: 'var(--c-bd)', backgroundColor: 'var(--c-sf)', color: 'var(--c-tx2)' }}
                  >
                    −
                  </button>
                  <span className="text-[12.5px] font-semibold min-w-[18px] text-center" style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--c-tx1)' }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => inc(p.id)}
                    className="w-[25px] h-[25px] rounded-[7px] border text-sm font-semibold cursor-pointer"
                    style={{ borderColor: 'var(--c-bd)', backgroundColor: 'var(--c-sf)', color: 'var(--c-tx2)' }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Actions */}
        <div className="flex gap-2.5 mt-3.5">
          <button
            onClick={onClose}
            className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold border-none cursor-pointer"
            style={{ backgroundColor: 'var(--c-page-bg)', color: 'var(--c-tx2)' }}
          >
            {t.common.cancel}
          </button>
          <button
            onClick={sendOrder}
            className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold border-none cursor-pointer"
            style={{ backgroundColor: 'var(--c-pri)', color: '#fff' }}
          >
            {t.modals.orderSend}
          </button>
        </div>
      </div>
    </Modal>
  );
}
