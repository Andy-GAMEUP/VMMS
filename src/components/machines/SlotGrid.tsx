interface Slot {
  row: number;
  col: number;
  productName?: string;
  stock: number;
  capacity: number;
}

interface Props {
  slots: Slot[];
  rows?: number;
  cols?: number;
}

function getStatus(slot: Slot) {
  if (slot.capacity === 0) return 'none';
  const ratio = slot.stock / slot.capacity;
  if (ratio === 0) return 'empty';
  if (ratio < 0.3) return 'low';
  if (ratio >= 0.7) return 'full';
  return 'mid';
}

export function SlotGrid({ slots, rows = 8, cols = 7 }: Props) {
  const grid: (Slot | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const s of slots) {
    if (s.row < rows && s.col < cols) grid[s.row][s.col] = s;
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 48px)`, minWidth: `${cols * 52}px` }}>
        {grid.flat().map((slot, i) => {
          const status = slot ? getStatus(slot) : 'none';
          return (
            <div key={i} className={`slot-cell slot-cell--${status}`}>
              {slot ? (
                <>
                  <span className="truncate w-full text-center text-[9px]">{slot.productName ?? '-'}</span>
                  <span className="text-[10px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {slot.stock}/{slot.capacity}
                  </span>
                </>
              ) : (
                <span className="text-[10px]">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px]" style={{ color: 'var(--c-tx3)' }}>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--c-ok)' }} />정상</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--c-warn)' }} />부족</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--c-err)' }} />소진</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--c-bd)' }} />없음</span>
      </div>
    </div>
  );
}
