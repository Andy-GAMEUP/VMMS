import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { productApi } from '@/api/products';
import { formatMoney } from '@/types';
import { useT } from '@/i18n/useT';
import type { Product } from '@/types';

export default function ProductNewPage() {
  const t = useT();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: allProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll({ size: 200 }),
  });

  const { data: sellingIds, isLoading: sellingLoading } = useQuery({
    queryKey: ['sellingIds'],
    queryFn: () => productApi.getSellingIds(),
  });

  const isLoading = productsLoading || sellingLoading;
  const products = allProducts?.records ?? [];
  const sellingSet = new Set(sellingIds ?? []);
  const newProducts = products.filter((p) => !sellingSet.has(p.goodsId));

  const categories = Array.from(new Set(newProducts.map((p) => p.goodsTypeName).filter(Boolean)));

  const filtered = selectedCategory === 'all'
    ? newProducts
    : newProducts.filter((p) => p.goodsTypeName === selectedCategory);

  if (isLoading) {
    return (
      <div className="space-y-3 py-4 px-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />)}
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        <button onClick={() => setSelectedCategory('all')} className="px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
          style={{
            backgroundColor: selectedCategory === 'all' ? 'var(--c-pri)' : 'var(--c-sf)',
            color: selectedCategory === 'all' ? '#fff' : 'var(--c-tx2)',
            borderColor: selectedCategory === 'all' ? 'var(--c-pri)' : 'var(--c-bd)',
          }}>
          {t.common.all} ({newProducts.length})
        </button>
        {categories.map((cat) => {
          const count = newProducts.filter((p) => p.goodsTypeName === cat).length;
          const active = selectedCategory === cat;
          return (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className="px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
              style={{
                backgroundColor: active ? 'var(--c-pri)' : 'var(--c-sf)',
                color: active ? '#fff' : 'var(--c-tx2)',
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
              }}>
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[14px]" style={{ color: 'var(--c-tx3)' }}>{t.products.noNewProducts}</div>
      ) : (
        <div className="px-4 space-y-2">
          {filtered.map((product) => (
            <NewProductCard key={product.goodsId} product={product}
              expanded={expandedId === product.goodsId}
              onToggle={() => setExpandedId(expandedId === product.goodsId ? null : product.goodsId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewProductCard({ product, expanded, onToggle }: { product: Product; expanded: boolean; onToggle: () => void }) {
  const t = useT();

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--c-sf)', border: '1px solid var(--c-bd)' }}>
      <button onClick={onToggle} className="w-full p-4 text-left transition-colors">
        <div className="flex gap-3">
          <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--c-bd2)' }}>
            {product.fileUrl ? (
              <img src={product.fileUrl} alt={product.goodsName} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : <span className="text-lg" style={{ color: 'var(--c-tx3)' }}>📦</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold truncate" style={{ color: 'var(--c-tx1)' }}>{product.goodsName}</div>
            <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ color: 'var(--c-tx3)', backgroundColor: 'var(--c-bg)' }}>{product.goodsTypeName}</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-[15px] font-bold" style={{ color: 'var(--c-pri)' }}>{formatMoney(product.oldGoodsPrice)}</span>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-tx3)" strokeWidth="2"
            className={clsx('transition-transform shrink-0 mt-1', expanded && 'rotate-180')}><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--c-bd2)' }}>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
            <div>
              <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.productName}</span>
              <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{product.goodsName}</span>
            </div>
            <div>
              <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.category}</span>
              <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{product.goodsTypeName}</span>
            </div>
            <div>
              <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.sellPrice}</span>
              <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{formatMoney(product.oldGoodsPrice)}</span>
            </div>
            <div>
              <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.buyPrice}</span>
              <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{formatMoney(product.oldBuyingPrice)}</span>
            </div>
            {product.oldGoodsPrice > 0 && (
              <div>
                <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.margin}</span>
                <span className="font-medium" style={{ color: 'var(--c-ok)' }}>
                  {formatMoney(product.oldGoodsPrice - product.oldBuyingPrice)}
                  {' '}({Math.round(((product.oldGoodsPrice - product.oldBuyingPrice) / product.oldGoodsPrice) * 100)}%)
                </span>
              </div>
            )}
            <div>
              <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.skuCode}</span>
              <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{product.skuCode || '-'}</span>
            </div>
            {product.goodsPresent && (
              <div className="col-span-2">
                <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.description}</span>
                <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{product.goodsPresent}</span>
              </div>
            )}
            {product.createTime > 0 && (
              <div>
                <span className="text-[11px] block" style={{ color: 'var(--c-tx3)' }}>{t.products.registered}</span>
                <span className="font-medium" style={{ color: 'var(--c-tx1)' }}>{new Date(product.createTime).toLocaleDateString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
