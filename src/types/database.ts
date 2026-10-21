// src/types/database.ts
// Definition of all database entities, roles, movement types, views and RPC payloads for SIMETRIS

export type AppRole = 'owner' | 'staff';

export type MovementType =
  | 'opening_balance'
  | 'purchase_receipt'
  | 'other_in'
  | 'adjustment_in'
  | 'sale'
  | 'damaged'
  | 'expired'
  | 'internal_use'
  | 'other_out'
  | 'adjustment_out'
  | 'reversal';

export type POStatus = 'draft' | 'ordered' | 'partially_received' | 'received' | 'closed' | 'cancelled';

export type AdjustmentStatus = 'pending' | 'approved' | 'rejected';

export type OpnameStatus = 'open' | 'submitted' | 'completed';

export type StockState = 'ok' | 'low' | 'out';

export type ExpiryState = 'none' | 'normal' | 'warning' | 'urgent' | 'expired';

export interface Business {
  id: string;
  name: string;
  timezone: string;
  expiry_warning_days: number;
  expiry_urgent_days: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email?: string;
  password?: string;
}

export interface BusinessMember {
  business_id: string;
  user_id: string;
  role: AppRole;
  is_active: boolean;
  can_manage_products: boolean;
  can_manage_suppliers: boolean;
  can_create_po: boolean;
  can_confirm_receipt: boolean;
  created_at: string;
  profile?: Profile;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
}

export interface Unit {
  id: string;
  business_id: string;
  name: string;
  allows_decimal: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  sku: string;
  name: string;
  category_id?: string | null;
  unit_id: string;
  min_stock: number;
  track_expiry: boolean;
  last_purchase_price?: number | null;
  is_active: boolean;
  archived_at?: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  unit?: Unit;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  business_id: string;
  purchase_order_id: string;
  product_id: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  business_id: string;
  po_no: number;
  supplier_id: string;
  status: POStatus;
  order_date: string;
  expected_date?: string | null;
  note?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface InventoryBatch {
  id: string;
  business_id: string;
  product_id: string;
  batch_code: string;
  received_date: string;
  expiry_date?: string | null;
  quantity_on_hand: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface GoodsReceiptItem {
  id: string;
  business_id: string;
  goods_receipt_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  unit_cost: number;
  product?: Product;
  batch?: InventoryBatch;
}

export interface GoodsReceipt {
  id: string;
  business_id: string;
  receipt_no: number;
  supplier_id: string;
  purchase_order_id?: string | null;
  received_at: string;
  note?: string | null;
  received_by: string;
  idempotency_key: string;
  created_at: string;
  supplier?: Supplier;
  purchase_order?: PurchaseOrder;
  receiver_profile?: Profile;
  items?: GoodsReceiptItem[];
}

export interface StockMovement {
  id: string;
  business_id: string;
  product_id: string;
  batch_id: string;
  movement_type: MovementType;
  quantity_delta: number;
  balance_after: number;
  reason?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  group_id: string;
  reversal_of_id?: string | null;
  created_by: string;
  created_at: string;
  product?: Product;
  batch?: InventoryBatch;
  creator_profile?: Profile;
}

export interface StockOpnameItem {
  id: string;
  stock_opname_id: string;
  batch_id: string;
  product_id: string;
  system_quantity: number;
  counted_quantity: number;
  difference: number;
  reason?: string | null;
  product?: Product;
  batch?: InventoryBatch;
}

export interface StockOpname {
  id: string;
  business_id: string;
  status: OpnameStatus;
  started_by: string;
  started_at: string;
  submitted_at?: string | null;
  completed_at?: string | null;
  starter_profile?: Profile;
  items?: StockOpnameItem[];
}

export interface StockAdjustment {
  id: string;
  business_id: string;
  batch_id: string;
  product_id: string;
  quantity_delta: number;
  reason: string;
  status: AdjustmentStatus;
  requested_by: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  movement_id?: string | null;
  opname_item_id?: string | null;
  idempotency_key: string;
  created_at: string;
  requester_profile?: Profile;
  reviewer_profile?: Profile;
  product?: Product;
  batch?: InventoryBatch;
}

export interface AuditLog {
  id: number;
  business_id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  created_at: string;
}

// Views
export interface ProductStockView {
  product_id: string;
  sku: string;
  name: string;
  category_name?: string | null;
  unit_name: string;
  min_stock: number;
  track_expiry: boolean;
  last_purchase_price?: number | null;
  available_qty: number;
  expired_qty: number;
  total_qty: number;
  stock_state: StockState;
  is_active: boolean;
}

export interface BatchStatusView {
  batch_id: string;
  product_id: string;
  sku: string;
  product_name: string;
  unit_name: string;
  batch_code: string;
  received_date: string;
  expiry_date?: string | null;
  quantity_on_hand: number;
  days_to_expiry?: number | null;
  expiry_state: ExpiryState;
}

export interface ReorderNeedView {
  product_id: string;
  sku: string;
  name: string;
  category_name?: string | null;
  unit_name: string;
  available_qty: number;
  min_stock: number;
  shortfall_qty: number;
  incoming_qty: number;
  stock_state: StockState;
  last_purchase_price?: number | null;
}

export interface DashboardSummaryView {
  active_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  warning_expiry_count: number;
  urgent_expiry_count: number;
  expired_batch_count: number;
  today_in_qty: number;
  today_out_qty: number;
  pending_po_count: number;
  pending_adjustments_count: number;
}
