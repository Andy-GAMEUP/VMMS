import { apiGet } from './client';
import type { ProductPage } from '@/types';

export const productApi = {
  /** 상품 목록 (페이징) */
  getAll: (params?: { current?: number; size?: number; funId?: number }) =>
    apiGet<ProductPage>('/products', params),

  /** 현재 자판기에 배정된(판매중인) 상품 ID 목록 */
  getSellingIds: () => apiGet<number[]>('/products/selling-ids'),
};
