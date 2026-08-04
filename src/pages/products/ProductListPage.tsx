import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/api/products';
import { useT } from '@/i18n/useT';
import type { Product } from '@/types';

export default function ProductListPage() {
  const t = useT();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll({ size: 200 }),
  });

  const products = data?.records ?? [];

  const categories = Array.from(new Set(products.map((p) => p.goodsTypeName).filter(Boolean)));

  const filtered = selectedCategory === 'all'
    ? products
    : products.filter((p) => p.goodsTypeName === selectedCategory);

  if (isLoading) {
    return (
      <div className="space-y-3 py-4 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--c-bd2)' }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-[14px]" style={{ color: 'var(--c-tx3)' }}>{t.dashboard.loadFailed}</p>
        <button onClick={() => window.location.reload()} className="font-semibold text-[14px]" style={{ color: 'var(--c-pri)' }}>
          {t.common.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
          style={{
            backgroundColor: selectedCategory === 'all' ? 'var(--c-pri)' : 'var(--c-sf)',
            color: selectedCategory === 'all' ? '#fff' : 'var(--c-tx2)',
            borderColor: selectedCategory === 'all' ? 'var(--c-pri)' : 'var(--c-bd)',
          }}
        >
          {t.common.all} ({products.length})
        </button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.goodsTypeName === cat).length;
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap border-[1.5px] transition-colors"
              style={{
                backgroundColor: active ? 'var(--c-pri)' : 'var(--c-sf)',
                color: active ? '#fff' : 'var(--c-tx2)',
                borderColor: active ? 'var(--c-pri)' : 'var(--c-bd)',
              }}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[14px]" style={{ color: 'var(--c-tx3)' }}>
          {t.products.noProducts}
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {filtered.map((product) => (
            <ProductCard key={product.goodsId} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const isListed = product.isList === 1;

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full rounded-xl text-left transition-shadow"
      style={{ backgroundColor: 'var(--c-sf)', border: '1px solid var(--c-bd)' }}
    >
      <div className="flex gap-3 p-4">
        <div className="w-20 h-20 rounded-lg shrink-0 overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--c-bd2)' }}>
          {product.fileUrl ? (
            <img
              src={product.fileUrl}
              alt={product.goodsName}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-2xl" style={{ color: 'var(--c-tx3)' }}>📦</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-bold truncate" style={{ color: 'var(--c-tx1)' }}>{product.goodsName}</h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
              style={{
                backgroundColor: isListed ? 'color-mix(in srgb, var(--c-ok) 12%, transparent)' : 'var(--c-bd2)',
                color: isListed ? 'var(--c-ok)' : 'var(--c-tx3)',
              }}
            >
              {isListed ? t.products.listed : t.products.unlisted}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ color: 'var(--c-tx3)', backgroundColor: 'var(--c-bg)' }}>{product.goodsTypeName}</span>
          </div>

          <div className="flex items-baseline gap-3 mt-2">
            <div>
              <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{t.products.sellPrice} </span>
              <span className="text-[16px] font-bold" style={{ color: 'var(--c-pri)' }}>₩{product.oldGoodsPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[11px]" style={{ color: 'var(--c-tx3)' }}>{t.products.buyPrice} </span>
              <span className="text-[14px] font-medium" style={{ color: 'var(--c-tx2)' }}>₩{product.oldBuyingPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 space-y-2 text-[13px]" style={{ borderTop: '1px solid var(--c-bd2)' }}>
          {product.goodsPresent && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--c-tx3)' }}>{t.products.description}</span>
              <span className="text-right" style={{ color: 'var(--c-tx1)' }}>{product.goodsPresent}</span>
            </div>
          )}
          {product.skuCode && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--c-tx3)' }}>{t.products.skuCode}</span>
              <span style={{ color: 'var(--c-tx1)' }}>{product.skuCode}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: 'var(--c-tx3)' }}>{t.products.margin}</span>
            <span className="font-medium" style={{ color: 'var(--c-ok)' }}>
              ₩{(product.oldGoodsPrice - product.oldBuyingPrice).toLocaleString()}
              ({Math.round(((product.oldGoodsPrice - product.oldBuyingPrice) / product.oldGoodsPrice) * 100)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--c-tx3)' }}>{t.products.shelfLife}</span>
            <span style={{ color: 'var(--c-tx1)' }}>{product.shelfTime}{t.common.days}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--c-tx3)' }}>{t.products.registered}</span>
            <span style={{ color: 'var(--c-tx1)' }}>{new Date(product.createTime).toLocaleDateString('ko-KR')}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--c-tx3)' }}>{t.products.productId}</span>
            <span style={{ color: 'var(--c-tx1)' }}>{product.goodsId}</span>
          </div>
        </div>
      )}
    </button>
  );
}
