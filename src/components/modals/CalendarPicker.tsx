import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useT } from '@/i18n/useT';

interface CalendarPickerProps {
  open: boolean;
  onClose: () => void;
  onApply: (start: Date, end: Date) => void;
  initial?: { start?: Date; end?: Date };
}

export function CalendarPicker({ open, onClose, onApply, initial }: CalendarPickerProps) {
  const t = useT();
  const [viewDate, setViewDate] = useState(() => initial?.start ?? new Date());
  const [start, setStart] = useState<Date | null>(initial?.start ?? null);
  const [end, setEnd] = useState<Date | null>(initial?.end ?? null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { day: number; date: Date | null }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, date: new Date(year, month, d) });
    return cells;
  }, [year, month]);

  function pick(date: Date) {
    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
    } else if (date < start) {
      setStart(date);
    } else {
      setEnd(date);
    }
  }

  function isInRange(date: Date) {
    if (!start || !end) return false;
    return date >= start && date <= end;
  }

  function isSelected(date: Date) {
    if (start && date.toDateString() === start.toDateString()) return true;
    if (end && date.toDateString() === end.toDateString()) return true;
    return false;
  }

  const rangeLabel = start
    ? end
      ? `${fmt(start)} ~ ${fmt(end)}`
      : `${fmt(start)} ~ ${t.calendar.selectEndDate}`
    : t.calendar.selectDate;

  const canApply = !!(start && end);

  return (
    <Modal open={open} onClose={onClose} maxWidth="360px">
      <div className="p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3.5">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-[30px] h-[30px] rounded-lg border flex items-center justify-center cursor-pointer"
            style={{ borderColor: 'var(--c-bd)', backgroundColor: 'var(--c-sf)', color: 'var(--c-tx2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="text-[14.5px] font-bold" style={{ color: 'var(--c-tx1)' }}>
            {t.calendar.yearMonth(year, month + 1)}
          </div>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-[30px] h-[30px] rounded-lg border flex items-center justify-center cursor-pointer"
            style={{ borderColor: 'var(--c-bd)', backgroundColor: 'var(--c-sf)', color: 'var(--c-tx2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {t.calendar.dow.map((w) => (
            <div key={w} className="text-center text-[10.5px] font-semibold py-1" style={{ color: 'var(--c-tx3)' }}>
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((cell, i) => {
            if (!cell.date) return <div key={i} />;
            const sel = isSelected(cell.date);
            const inRange = isInRange(cell.date);
            return (
              <div
                key={i}
                onClick={() => pick(cell.date!)}
                className="aspect-square flex items-center justify-center text-xs cursor-pointer"
                style={{
                  backgroundColor: sel ? 'var(--c-pri)' : inRange ? 'var(--c-pri-lt)' : 'transparent',
                  color: sel ? '#fff' : inRange ? 'var(--c-pri)' : 'var(--c-tx1)',
                  fontWeight: sel ? 700 : 400,
                  borderRadius: sel ? '50%' : '4px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {cell.day}
              </div>
            );
          })}
        </div>

        {/* Range label */}
        <div className="flex items-center justify-between mt-3.5 px-3 py-2.5 rounded-[10px]" style={{ backgroundColor: 'var(--c-page-bg)' }}>
          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--c-tx2)' }}>{rangeLabel}</span>
          <span
            onClick={() => { setStart(null); setEnd(null); }}
            className="text-[11px] font-semibold cursor-pointer"
            style={{ color: 'var(--c-pri)' }}
          >
            {t.common.reset}
          </span>
        </div>

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
            onClick={() => { if (start && end) onApply(start, end); }}
            className="flex-1 h-[42px] rounded-[10px] text-[13px] font-semibold border-none cursor-pointer"
            style={{
              backgroundColor: canApply ? 'var(--c-pri)' : 'var(--c-bd)',
              color: canApply ? '#fff' : 'var(--c-tx3)',
            }}
          >
            {t.common.apply}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function fmt(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
