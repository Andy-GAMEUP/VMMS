/**
 * 상품 타입 정의
 * 鑫之源 API: getGoodsById (V1.1)
 */

/** 상품 항목 */
export interface Product {
  goodsId: number;
  goodsName: string;
  goodsTypeName: string; // 카테고리명
  skuCode: string;
  skuName: string;
  oldBuyingPrice: number; // 매입가 (원 단위)
  oldGoodsPrice: number; // 판매가 (원 단위)
  fileUrl: string; // 상품 이미지 URL
  fileCopyUrl: string; // 부이미지 URL
  isList: number; // 0=미상장, 1=상장
  createTime: number; // Unix ms
  shelfTime: number; // 유통기한(일)
  goodsPresent: string; // 상품 설명
  goodsTypeUrl: string; // 카테고리 이미지 URL
}

/** 상품 페이징 응답 (鑫之源 API 형식) */
export interface ProductPage {
  records: Product[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** 상품 조회 파라미터 */
export interface ProductQueryParams {
  appId: number;
  current?: number;
  size?: number;
  funId?: number;
}
