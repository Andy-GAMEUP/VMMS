import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/api/products';

/** 상품 목록 (페이징) */
export function useProducts(params?: { current?: number; size?: number; funId?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getAll(params),
  });
}
