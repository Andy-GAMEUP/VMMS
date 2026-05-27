import { apiGet } from './client';
import type { ProductPage } from '@/types';

export const productApi = {
  /** 상품 목록 (페이징) */
  getAll: (params?: { pageNum?: number; pageSize?: number; funId?: number }) =>
    apiGet<ProductPage>('/products', params),
};
