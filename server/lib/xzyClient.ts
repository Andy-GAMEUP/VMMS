/**
 * 鑫之源 API HTTP 클라이언트
 *
 * - 모든 API는 POST + application/x-www-form-urlencoded
 * - MD5 서명 자동 생성
 * - V1.1 (remotingData): 설비/상품/화도
 * - V1.2 (remotingCust): 사용자/부서/매출
 */

import axios, { type AxiosInstance } from 'axios';
import { signParams, type SignParams } from './sign.js';
import { URLSearchParams } from 'url';

interface XzyConfig {
  appId: number;
  apiKey: string;
  baseV11: string; // remotingData
  baseV12: string; // remotingCust
}

export class XzyClient {
  private appId: number;
  private apiKey: string;
  private httpV11: AxiosInstance;
  private httpV12: AxiosInstance;

  constructor(config: XzyConfig) {
    this.appId = config.appId;
    this.apiKey = config.apiKey;

    const commonConfig = {
      timeout: 15000,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    };

    this.httpV11 = axios.create({ ...commonConfig, baseURL: config.baseV11 });
    this.httpV12 = axios.create({ ...commonConfig, baseURL: config.baseV12 });
  }

  /** V1.1 API 호출 (설비/상품/화도) */
  async callV11<T = unknown>(method: string, params: SignParams = {}): Promise<T> {
    const allParams = { appId: this.appId, ...params };
    const signed = signParams(allParams, this.apiKey);
    const body = new URLSearchParams(
      Object.entries(signed).map(([k, v]) => [k, String(v)]),
    ).toString();

    const { data } = await this.httpV11.post(`/${method}`, body);

    if (data.code !== 0) {
      throw new XzyApiError(method, data.code, data.msg);
    }
    return data.data as T;
  }

  /** V1.2 API 호출 (사용자/부서/매출) */
  async callV12<T = unknown>(method: string, params: SignParams = {}): Promise<T> {
    const allParams = { appId: this.appId, ...params };
    const signed = signParams(allParams, this.apiKey);
    const body = new URLSearchParams(
      Object.entries(signed).map(([k, v]) => [k, String(v)]),
    ).toString();

    const { data } = await this.httpV12.post(`/${method}`, body);

    if (data.code !== 0) {
      throw new XzyApiError(method, data.code, data.msg);
    }
    return data.data as T;
  }

  // ===== 편의 메서드 =====

  /** 부서별 전체 설비 조회 */
  async getMachines(deptId?: number) {
    return this.callV11('getFunByDept', deptId ? { deptId } : {});
  }

  /** 단일 설비 상세 */
  async getMachineById(funId: number) {
    return this.callV11('getFunById', { funId });
  }

  /** 화도(슬롯) 조회 */
  async getRoads(funId: number) {
    return this.callV11('getRoodById', { funId });
  }

  /** 상품 목록 (페이징) */
  async getProducts(params: { pageNum?: number; pageSize?: number; funId?: number } = {}) {
    return this.callV11('getGoodsById', {
      pageNum: params.pageNum ?? 1,
      pageSize: params.pageSize ?? 20,
      ...(params.funId ? { funId: params.funId } : {}),
    });
  }

  /** 사용자 조회 */
  async getUsers(params: { userAccount?: string; userPhone?: string; deptId?: number; userStatus?: number } = {}) {
    return this.callV12('getUserInfo', params);
  }

  /** 사용자 추가 (배치) */
  async addUsers(userListJson: string) {
    return this.callV12('addUserInfo', { userListJson });
  }

  /** 부서 조회 */
  async getDepartments(params: { deptId?: number } = {}) {
    return this.callV12('getDeptInfo', params);
  }

  /** 부서 추가 */
  async addDepartment(deptName: string, parentId: number) {
    return this.callV12('addDeptInfo', { deptName, parentId });
  }

  /** 매출 통계 */
  async getSalesStats(params: {
    statType: string;
    startDate?: string;
    endDate?: string;
    funId?: number;
    deptId?: number;
  }) {
    return this.callV12('countInfo', params);
  }
}

/** 鑫之源 API 에러 */
export class XzyApiError extends Error {
  constructor(
    public readonly method: string,
    public readonly code: number,
    public readonly apiMsg: string,
  ) {
    super(`[鑫之源 ${method}] code=${code}: ${apiMsg}`);
    this.name = 'XzyApiError';
  }
}
