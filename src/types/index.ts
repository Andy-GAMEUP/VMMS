export type { Machine, MachineDetail, DeviceStatusType } from './machine';
export { resolveDeviceStatus, DEVICE_STATUS_MAP } from './machine';

export type { Road, RoadInfo, StockLevel } from './slot';
export { resolveStockLevel, STOCK_LEVEL_MAP } from './slot';

export type { Product, ProductPage, ProductQueryParams } from './product';

export type { SalesStat, SalesQueryParams } from './sales';
export { fenToYuan, formatMoney } from './sales';

export type {
  XzyUserVO,
  XzyUserCreateDTO,
  XzyDeptVO,
  XzyDeptCreateDTO,
  VmmsUser,
  UserRole,
  AccountType,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  JwtPayload,
  AuthState,
} from './auth';
export { ROLE_PERMISSIONS } from './auth';

export type {
  InventoryAlert,
  DeviceStatusMessage,
  StockUpdateMessage,
  Notification,
} from './message';
export { resolveMqDeviceStatus } from './message';

export type { XzyResponse, PageResult, ApiResponse } from './api';
