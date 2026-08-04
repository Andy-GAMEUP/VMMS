import { Modal } from '@/components/ui/Modal';
import { useT } from '@/i18n/useT';

interface Product {
  name: string;
  type: string;
  sub: string;
  price: number;
  code: string;
  shelfLife?: string;
  desc?: string;
  monthSales?: string;
  monthCnt?: string;
  statusText?: string;
  statusColor?: string;
  stocked?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailModal({ open, onClose, product }: Props) {
  const t = useT();
  if (!product) return null;
  const p = product;
  const priceLabel = `${p.price.toLocaleString()}원`;

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-[18px] py-4 border-b" style={{ borderColor: 'var(--c-bd)' }}>
        <svg onClick={onClose} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="cursor-pointer">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="text-[14.5px] font-bold" style={{ color: 'var(--c-tx1)' }}>{t.modals.productDetail}</span>
      </div>

      {/* Hero */}
      <div className="text-center py-6 px-5">
        <div
          className="w-24 h-24 rounded-[22px] mx-auto mb-3.5 flex items-center justify-center"
          style={{ backgroundColor: 'var(--c-pri-lt)', color: 'var(--c-pri)' }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2h6v3.2l3 4.3V20a2 2 0 01-2 2H8a2 2 0 01-2-2V9.5l3-4.3V2zm2 2v2.6L8 10.6V20h8v-9.4l-3-4.3V4h-2z" />
          </svg>
        </div>
        <div className="text-base font-bold" style={{ color: 'var(--c-tx1)' }}>{p.name}</div>
        <div className="text-[11.5px] mt-1" style={{ color: 'var(--c-tx3)' }}>{p.type} · {p.sub}</div>
        <div className="text-lg font-bold mt-1.5" style={{ color: 'var(--c-pri)', fontVariantNumeric: 'tabular-nums' }}>{priceLabel}</div>
      </div>

      {/* Basic info */}
      <div className="px-5 pb-4">
        <SectionTitle>{t.modals.basicInfo}</SectionTitle>
        <InfoRow label={t.modals.productType} value={p.type} />
        <InfoRow label={t.modals.sellPrice} value={priceLabel} valueColor="var(--c-pri)" bold />
        <InfoRow label={t.modals.shelfLife} value={p.shelfLife ?? '-'} />
        <InfoRow label={t.modals.productCode} value={p.code} last />
      </div>

      {/* Description */}
      <div className="px-5 pb-4">
        <SectionTitle>{t.modals.productDesc}</SectionTitle>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--c-tx2)' }}>
          {p.desc ?? t.modals.noDescription}
        </div>
      </div>

      {/* Sales status (only for stocked products) */}
      {p.stocked && (
        <div className="px-5 pb-5">
          <SectionTitle>{t.modals.salesStatus}</SectionTitle>
          <InfoRow label={t.modals.monthlySales} value={p.monthSales ?? '-'} valueColor="var(--c-pri)" bold />
          <InfoRow label={t.modals.monthlyOrders} value={p.monthCnt ?? '-'} />
          <InfoRow label={t.modals.stockStatus} value={p.statusText ?? '-'} valueColor={p.statusColor} last />
        </div>
      )}
    </Modal>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      className="text-xs font-bold py-2.5 border-b mb-1.5"
      style={{ color: 'var(--c-tx2)', borderColor: 'var(--c-bd2)' }}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value, valueColor, bold, last }: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex py-2"
      style={last ? undefined : { borderBottom: '1px solid var(--c-bd2)' }}
    >
      <span className="w-[90px] text-[11.5px]" style={{ color: 'var(--c-tx3)' }}>{label}</span>
      <span
        className="flex-1 text-[11.5px]"
        style={{ fontWeight: bold ? 600 : 500, color: valueColor ?? 'var(--c-tx1)' }}
      >
        {value}
      </span>
    </div>
  );
}
