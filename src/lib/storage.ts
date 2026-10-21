import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Business,
  BusinessMember,
  Profile,
  Category,
  Unit,
  Product,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  InventoryBatch,
  GoodsReceipt,
  GoodsReceiptItem,
  StockMovement,
  StockOpname,
  StockOpnameItem,
  StockAdjustment,
  AuditLog,
  ProductStockView,
  BatchStatusView,
  ReorderNeedView,
  DashboardSummaryView,
  POStatus,
  StockState,
  ExpiryState,
} from '../types/database';

const STORAGE_KEY = 'simetris_data_v2';

// Initial clean configuration
const DEFAULT_BUSINESS: Business = {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Toko Berkah Jaya',
  timezone: 'Asia/Jakarta',
  expiry_warning_days: 30,
  expiry_urgent_days: 7,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_PROFILES: Profile[] = [
  { id: 'u0000000-0000-0000-0000-000000000001', full_name: 'Owner Simetris', email: 'owner@simetris.test', password: 'password' },
];

const DEFAULT_MEMBERS: BusinessMember[] = [
  {
    business_id: DEFAULT_BUSINESS.id,
    user_id: DEFAULT_PROFILES[0].id,
    role: 'owner',
    is_active: true,
    can_manage_products: true,
    can_manage_suppliers: true,
    can_create_po: true,
    can_confirm_receipt: true,
    created_at: DEFAULT_BUSINESS.created_at,
  },
];

const DEFAULT_CATEGORIES: Category[] = [];
const DEFAULT_UNITS: Unit[] = [];

const DEFAULT_SUPPLIERS: Supplier[] = [];
const DEFAULT_PRODUCTS: Product[] = [];
const DEFAULT_BATCHES: InventoryBatch[] = [];
const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [];
const DEFAULT_MOVEMENTS: StockMovement[] = [];
const DEFAULT_AUDIT_LOGS: AuditLog[] = [];

export interface AppStoreData {
  business: Business;
  profiles: Profile[];
  members: BusinessMember[];
  categories: Category[];
  units: Unit[];
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  batches: InventoryBatch[];
  goodsReceipts: GoodsReceipt[];
  movements: StockMovement[];
  opnames: StockOpname[];
  adjustments: StockAdjustment[];
  auditLogs: AuditLog[];
  activeUserId: string;
}

class SimetrisStore {
  private data: AppStoreData;
  private supabase: SupabaseClient | null = null;
  private isSupabaseConnected = false;

  constructor() {
    this.data = this.loadData();
    this.initSupabaseIfConfigured();
  }

  private initSupabaseIfConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && anonKey && url.startsWith('http')) {
      try {
        this.supabase = createClient(url, anonKey);
        this.isSupabaseConnected = true;
      } catch (e) {
        console.warn('Failed to initialize live Supabase client, using mock storage:', e);
        this.isSupabaseConnected = false;
      }
    }
  }

  public isUsingLiveSupabase(): boolean {
    return this.isSupabaseConnected;
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  private loadData(): AppStoreData {
    try {
      // Clear legacy storage key if exists
      localStorage.removeItem('simetris_data_v1');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasOldOwner = parsed.profiles?.some(
          (p: any) => p.email === 'owner@berkahjaya.com' || p.full_name?.includes('Siti Rahmah')
        );
        if (parsed && parsed.business && parsed.products && !hasOldOwner) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    }
    return this.getDefaultData();
  }

  private getDefaultData(): AppStoreData {
    return {
      business: DEFAULT_BUSINESS,
      profiles: DEFAULT_PROFILES,
      members: DEFAULT_MEMBERS,
      categories: DEFAULT_CATEGORIES,
      units: DEFAULT_UNITS,
      products: DEFAULT_PRODUCTS,
      suppliers: DEFAULT_SUPPLIERS,
      purchaseOrders: DEFAULT_PURCHASE_ORDERS,
      batches: DEFAULT_BATCHES,
      goodsReceipts: [],
      movements: DEFAULT_MOVEMENTS,
      opnames: [],
      adjustments: [],
      auditLogs: DEFAULT_AUDIT_LOGS,
      activeUserId: DEFAULT_PROFILES[0].id, // Default to Owner Simetris
    };
  }

  public saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
    }
  }

  public resetToDefault() {
    this.data = this.getDefaultData();
    this.saveData();
  }

  // Active User & Authentication Management
  public isAuthenticated(): boolean {
    return localStorage.getItem('simetris_auth_logged_in') === 'true';
  }

  public async login(email: string, password?: string): Promise<{ success: boolean; error?: string; user?: Profile }> {
    const cleanEmail = email.trim().toLowerCase();
    const profile = this.data.profiles.find((p) => p.email?.toLowerCase() === cleanEmail);
    if (!profile) {
      return { success: false, error: 'Akun dengan email ini tidak ditemukan di sistem.' };
    }

    const member = this.data.members.find((m) => m.user_id === profile.id);
    if (!member) {
      return { success: false, error: 'Akun ini tidak memiliki akses atau telah dihapus oleh pemilik usaha.' };
    }
    if (!member.is_active) {
      return { success: false, error: 'Akun ini telah dinonaktifkan oleh pemilik usaha.' };
    }

    if (!this.supabase) {
      const expectedPassword = profile.password || 'password';
      if (password !== expectedPassword) {
        if (cleanEmail === 'owner@simetris.test') {
          return { success: false, error: 'Kata sandi salah. Gunakan sandi: password' };
        }
        return { success: false, error: 'Kata sandi salah.' };
      }
    }

    if (this.supabase && password) {
      try {
        const { error } = await this.supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });
        if (error) {
          console.warn('Supabase auth notice:', error.message);
        }
      } catch (err) {
        console.warn('Supabase auth error:', err);
      }
    }

    this.data.activeUserId = profile.id;
    localStorage.setItem('simetris_auth_logged_in', 'true');
    this.saveData();
    return { success: true, user: profile };
  }

  public async logout(): Promise<void> {
    if (this.supabase) {
      try {
        await this.supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem('simetris_auth_logged_in');
  }

  public getActiveUser(): Profile {
    const user = this.data.profiles.find((p) => p.id === this.data.activeUserId);
    return user || this.data.profiles[0];
  }

  public getActiveMember(): BusinessMember {
    const member = this.data.members.find((m) => m.user_id === this.data.activeUserId);
    if (!member) {
      return this.data.members[0];
    }
    return member;
  }

  public setActiveUserId(userId: string) {
    if (this.data.profiles.some((p) => p.id === userId)) {
      this.data.activeUserId = userId;
      this.saveData();
    }
  }

  public isOwner(): boolean {
    const member = this.getActiveMember();
    return member.role === 'owner';
  }

  public canManageProducts(): boolean {
    const member = this.getActiveMember();
    return member.role === 'owner' || member.can_manage_products;
  }

  public canManageSuppliers(): boolean {
    const member = this.getActiveMember();
    return member.role === 'owner' || member.can_manage_suppliers;
  }

  public canCreatePO(): boolean {
    const member = this.getActiveMember();
    return member.role === 'owner' || member.can_create_po;
  }

  public canConfirmReceipt(): boolean {
    const member = this.getActiveMember();
    return member.role === 'owner' || member.can_confirm_receipt;
  }

  // Logging
  public logAudit(action: string, tableName: string, recordId?: string, oldData?: any, newData?: any) {
    const actor = this.getActiveUser();
    const newLog: AuditLog = {
      id: Date.now(),
      business_id: this.data.business.id,
      actor_id: actor.id,
      actor_name: actor.full_name,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    this.saveData();
  }

  // Data Getters
  public getBusiness(): Business {
    return this.data.business;
  }

  public updateBusiness(update: Partial<Business>) {
    if (!this.isOwner()) throw new Error('Hanya Owner yang dapat mengubah pengaturan usaha.');
    this.data.business = { ...this.data.business, ...update, updated_at: new Date().toISOString() };
    this.logAudit('update_business', 'businesses', this.data.business.id, null, update);
    this.saveData();
  }

  public getProfiles(): Profile[] {
    return this.data.profiles;
  }

  public getMembers(): (BusinessMember & { profile: Profile })[] {
    return this.data.members.map((m) => {
      const p = this.data.profiles.find((pr) => pr.id === m.user_id) || {
        id: m.user_id,
        full_name: 'Unknown User',
      };
      return { ...m, profile: p };
    });
  }

  public updateMemberPermissions(userId: string, update: Partial<BusinessMember>) {
    if (!this.isOwner()) throw new Error('Hanya Owner yang dapat mengubah izin staf.');
    const index = this.data.members.findIndex((m) => m.user_id === userId);
    if (index === -1) throw new Error('Anggota tidak ditemukan.');
    const old = this.data.members[index];
    if (old.role === 'owner' && update.is_active === false) {
      throw new Error('Akun Owner tidak dapat dinonaktifkan.');
    }
    this.data.members[index] = { ...old, ...update };
    if (update.is_active !== undefined && update.is_active !== old.is_active) {
      this.logAudit(
        update.is_active ? 'activate_staff_member' : 'deactivate_staff_member',
        'business_members',
        userId,
        { is_active: old.is_active },
        { is_active: update.is_active }
      );
    } else {
      this.logAudit('update_member_permissions', 'business_members', userId, old, update);
    }
    this.saveData();
  }

  public deleteStaffMember(userId: string) {
    if (!this.isOwner()) throw new Error('Hanya Owner yang dapat menghapus akun staf.');
    const memberIndex = this.data.members.findIndex((m) => m.user_id === userId);
    if (memberIndex === -1) throw new Error('Akun staf tidak ditemukan.');
    const member = this.data.members[memberIndex];
    if (member.role === 'owner') {
      throw new Error('Akun Owner tidak dapat dihapus.');
    }
    if (member.user_id === this.data.activeUserId) {
      throw new Error('Tidak dapat menghapus akun yang sedang aktif digunakan.');
    }
    const profile = this.data.profiles.find((p) => p.id === userId);

    // Remove member from business
    this.data.members.splice(memberIndex, 1);

    // Remove profile from profiles list
    const profileIndex = this.data.profiles.findIndex((p) => p.id === userId);
    if (profileIndex !== -1) {
      this.data.profiles.splice(profileIndex, 1);
    }

    this.logAudit('delete_staff_member', 'business_members', userId, member, {
      deleted_user_name: profile?.full_name || 'Staff',
      deleted_email: profile?.email || '',
    });
    this.saveData();
  }

  public createStaffMember(fullName: string, email: string, permissions?: Partial<BusinessMember>, password?: string) {
    if (!this.isOwner()) throw new Error('Hanya Owner yang dapat membuat akun staf.');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) throw new Error('Email staf tidak boleh kosong.');
    if (this.data.profiles.some((p) => p.email?.toLowerCase() === trimmedEmail)) {
      throw new Error('Email staf sudah terdaftar. Gunakan alamat email lain.');
    }
    const newUserId = 'u' + crypto.randomUUID().slice(1);
    const newProfile: Profile = {
      id: newUserId,
      full_name: fullName.trim(),
      email: trimmedEmail,
      password: password?.trim() || 'password',
    };
    const newMember: BusinessMember = {
      business_id: this.data.business.id,
      user_id: newUserId,
      role: 'staff',
      is_active: true,
      can_manage_products: permissions?.can_manage_products ?? false,
      can_manage_suppliers: permissions?.can_manage_suppliers ?? false,
      can_create_po: permissions?.can_create_po ?? false,
      can_confirm_receipt: permissions?.can_confirm_receipt ?? true,
      created_at: new Date().toISOString(),
    };
    this.data.profiles.push(newProfile);
    this.data.members.push(newMember);
    this.logAudit('create_staff_member', 'business_members', newUserId, null, { fullName, email: trimmedEmail });
    this.saveData();
    return newProfile;
  }

  public getCategories(): Category[] {
    return this.data.categories;
  }

  public createCategory(name: string): Category {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama kategori tidak boleh kosong.');
    if (this.data.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Kategori dengan nama tersebut sudah ada.');
    }
    const cat: Category = {
      id: 'cat-' + Date.now(),
      business_id: this.data.business.id,
      name: trimmed,
      created_at: new Date().toISOString(),
    };
    this.data.categories.push(cat);
    this.logAudit('create_category', 'categories', cat.id, null, { name: trimmed });
    this.saveData();
    return cat;
  }

  public getUnits(): Unit[] {
    return this.data.units;
  }

  public createUnit(name: string, allowsDecimal: boolean): Unit {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama satuan tidak boleh kosong.');
    if (this.data.units.some((u) => u.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Satuan dengan nama tersebut sudah ada.');
    }
    const unit: Unit = {
      id: 'unit-' + Date.now(),
      business_id: this.data.business.id,
      name: trimmed,
      allows_decimal: allowsDecimal,
      created_at: new Date().toISOString(),
    };
    this.data.units.push(unit);
    this.logAudit('create_unit', 'units', unit.id, null, { name: trimmed, allowsDecimal });
    this.saveData();
    return unit;
  }

  public deleteCategory(id: string) {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const inUse = this.data.products.some((p) => p.category_id === id);
    if (inUse) throw new Error('Kategori ini masih digunakan oleh produk aktif.');
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const removed = this.data.categories.splice(idx, 1)[0];
      this.logAudit('delete_category', 'categories', id, removed, null);
      this.saveData();
    }
  }

  public deleteUnit(id: string) {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const inUse = this.data.products.some((p) => p.unit_id === id);
    if (inUse) throw new Error('Satuan ini masih digunakan oleh produk.');
    const idx = this.data.units.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const removed = this.data.units.splice(idx, 1)[0];
      this.logAudit('delete_unit', 'units', id, removed, null);
      this.saveData();
    }
  }

  public getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  public createSupplier(supplier: Omit<Supplier, 'id' | 'business_id' | 'created_at' | 'updated_at'>): Supplier {
    if (!this.canManageSuppliers()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola pemasok.');
    const trimmed = supplier.name.trim();
    if (!trimmed) throw new Error('Nama pemasok wajib diisi.');
    const newSupp: Supplier = {
      id: 'supp-' + Date.now(),
      business_id: this.data.business.id,
      name: trimmed,
      phone: supplier.phone || null,
      address: supplier.address || null,
      notes: supplier.notes || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.suppliers.push(newSupp);
    this.logAudit('create_supplier', 'suppliers', newSupp.id, null, newSupp);
    this.saveData();
    return newSupp;
  }

  public updateSupplier(id: string, update: Partial<Supplier>) {
    if (!this.canManageSuppliers()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola pemasok.');
    const idx = this.data.suppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Pemasok tidak ditemukan.');
    const old = this.data.suppliers[idx];
    this.data.suppliers[idx] = { ...old, ...update, updated_at: new Date().toISOString() };
    this.logAudit('update_supplier', 'suppliers', id, old, update);
    this.saveData();
  }

  public getProducts(): Product[] {
    return this.data.products.map((p) => ({
      ...p,
      category: this.data.categories.find((c) => c.id === p.category_id),
      unit: this.data.units.find((u) => u.id === p.unit_id),
    }));
  }

  public createProduct(product: {
    sku: string;
    name: string;
    category_id?: string;
    unit_id: string;
    min_stock: number;
    track_expiry: boolean;
  }): Product {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const skuTrim = product.sku.trim().toUpperCase();
    const nameTrim = product.name.trim();
    if (!skuTrim || !nameTrim) throw new Error('SKU dan nama produk wajib diisi.');
    // Active SKU must be unique
    if (this.data.products.some((p) => p.is_active && p.sku.toLowerCase() === skuTrim.toLowerCase())) {
      throw new Error(`SKU "${skuTrim}" sudah digunakan oleh produk aktif lain.`);
    }

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      business_id: this.data.business.id,
      sku: skuTrim,
      name: nameTrim,
      category_id: product.category_id || null,
      unit_id: product.unit_id,
      min_stock: Number(product.min_stock) || 0,
      track_expiry: product.track_expiry,
      last_purchase_price: null,
      is_active: true,
      archived_at: null,
      created_by: this.getActiveUser().id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.products.push(newProd);

    // If product does not track expiry, create default single batch with 0 on hand
    if (!newProd.track_expiry) {
      const defaultBatch: InventoryBatch = {
        id: 'b-' + newProd.id,
        business_id: this.data.business.id,
        product_id: newProd.id,
        batch_code: '',
        received_date: new Date().toISOString().split('T')[0],
        expiry_date: null,
        quantity_on_hand: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.batches.push(defaultBatch);
    }

    this.logAudit('create_product', 'products', newProd.id, null, newProd);
    this.saveData();
    return newProd;
  }

  public updateProduct(id: string, update: Partial<Product>) {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Produk tidak ditemukan.');
    const old = this.data.products[idx];

    // Only Owner can modify min_stock (SRS FR-MIN.01, DATABASE OI-15)
    if (update.min_stock !== undefined && update.min_stock !== old.min_stock && !this.isOwner()) {
      throw new Error('Hanya Owner yang dapat mengubah batas stok minimum.');
    }

    // Changing track_expiry is forbidden if product already has stock (DATABASE OI-05)
    if (update.track_expiry !== undefined && update.track_expiry !== old.track_expiry) {
      const currentStock = this.data.batches
        .filter((b) => b.product_id === id)
        .reduce((sum, b) => sum + b.quantity_on_hand, 0);
      if (currentStock > 0) {
        throw new Error('Penanda kedaluwarsa tidak dapat diubah selama produk masih memiliki stok persediaan.');
      }
    }

    if (update.sku && update.sku !== old.sku) {
      const skuTrim = update.sku.trim().toUpperCase();
      if (this.data.products.some((p) => p.id !== id && p.is_active && p.sku.toLowerCase() === skuTrim.toLowerCase())) {
        throw new Error(`SKU "${skuTrim}" sudah digunakan oleh produk aktif lain.`);
      }
      update.sku = skuTrim;
    }

    this.data.products[idx] = { ...old, ...update, updated_at: new Date().toISOString() };
    this.logAudit('update_product', 'products', id, old, update);
    this.saveData();
  }

  public archiveProduct(id: string) {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const prod = this.data.products.find((p) => p.id === id);
    if (!prod) throw new Error('Produk tidak ditemukan.');
    // Cannot archive if stock > 0
    const stock = this.data.batches.filter((b) => b.product_id === id).reduce((sum, b) => sum + b.quantity_on_hand, 0);
    if (stock > 0) {
      throw new Error(`Produk tidak dapat diarsipkan karena masih memiliki stok (${stock}). Kosongkan stok terlebih dahulu.`);
    }
    prod.is_active = false;
    prod.archived_at = new Date().toISOString();
    prod.updated_at = new Date().toISOString();
    this.logAudit('archive_product', 'products', id, null, { archived_at: prod.archived_at });
    this.saveData();
  }

  public unarchiveProduct(id: string) {
    if (!this.canManageProducts()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola produk.');
    const prod = this.data.products.find((p) => p.id === id);
    if (!prod) throw new Error('Produk tidak ditemukan.');
    if (this.data.products.some((p) => p.id !== id && p.is_active && p.sku.toLowerCase() === prod.sku.toLowerCase())) {
      throw new Error(`Tidak dapat mengaktifkan produk. SKU "${prod.sku}" sudah digunakan oleh produk aktif lain.`);
    }
    prod.is_active = true;
    prod.archived_at = null;
    prod.updated_at = new Date().toISOString();
    this.logAudit('unarchive_product', 'products', id, null, { is_active: true });
    this.saveData();
  }

  public getBatches(): (InventoryBatch & { product?: Product })[] {
    return this.data.batches.map((b) => {
      const p = this.data.products.find((pr) => pr.id === b.product_id);
      return { ...b, product: p };
    });
  }

  // Views Computation
  public getProductStockViews(): ProductStockView[] {
    const today = new Date().toISOString().split('T')[0];
    return this.data.products.map((p) => {
      const cat = this.data.categories.find((c) => c.id === p.category_id);
      const unit = this.data.units.find((u) => u.id === p.unit_id);
      const batches = this.data.batches.filter((b) => b.product_id === p.id);

      let available_qty = 0;
      let expired_qty = 0;

      for (const b of batches) {
        if (b.expiry_date && b.expiry_date < today) {
          expired_qty += b.quantity_on_hand;
        } else {
          available_qty += b.quantity_on_hand;
        }
      }

      const total_qty = available_qty + expired_qty;
      let stock_state: StockState = 'ok';
      if (available_qty <= 0) {
        stock_state = 'out';
      } else if (p.min_stock > 0 && available_qty <= p.min_stock) {
        stock_state = 'low';
      }

      return {
        product_id: p.id,
        sku: p.sku,
        name: p.name,
        category_name: cat ? cat.name : null,
        unit_name: unit ? unit.name : '',
        min_stock: p.min_stock,
        track_expiry: p.track_expiry,
        last_purchase_price: p.last_purchase_price,
        available_qty,
        expired_qty,
        total_qty,
        stock_state,
        is_active: p.is_active,
      };
    });
  }

  public getBatchStatusViews(): BatchStatusView[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const warnDays = this.data.business.expiry_warning_days;
    const urgentDays = this.data.business.expiry_urgent_days;

    return this.data.batches.map((b) => {
      const p = this.data.products.find((pr) => pr.id === b.product_id);
      const unit = p ? this.data.units.find((u) => u.id === p.unit_id) : undefined;

      let expiry_state: ExpiryState = 'none';
      let days_to_expiry: number | null = null;

      if (b.expiry_date) {
        const expDate = new Date(b.expiry_date + 'T00:00:00');
        const diffMs = expDate.getTime() - today.getTime();
        days_to_expiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (days_to_expiry < 0 || b.expiry_date < todayStr) {
          expiry_state = 'expired';
        } else if (days_to_expiry <= urgentDays) {
          expiry_state = 'urgent';
        } else if (days_to_expiry <= warnDays) {
          expiry_state = 'warning';
        } else {
          expiry_state = 'normal';
        }
      }

      return {
        batch_id: b.id,
        product_id: b.product_id,
        sku: p ? p.sku : '',
        product_name: p ? p.name : 'Unknown Product',
        unit_name: unit ? unit.name : '',
        batch_code: b.batch_code,
        received_date: b.received_date,
        expiry_date: b.expiry_date,
        quantity_on_hand: b.quantity_on_hand,
        days_to_expiry,
        expiry_state,
      };
    });
  }

  public getReorderNeeds(): ReorderNeedView[] {
    const stockViews = this.getProductStockViews();
    const needs: ReorderNeedView[] = [];

    for (const s of stockViews) {
      if (!s.is_active) continue;
      if (s.stock_state === 'low' || s.stock_state === 'out') {
        // Calculate incoming quantity from ordered POs
        let incoming = 0;
        for (const po of this.data.purchaseOrders) {
          if (po.status === 'ordered' || po.status === 'partially_received') {
            for (const item of po.items || []) {
              if (item.product_id === s.product_id) {
                incoming += Math.max(0, item.ordered_quantity - item.received_quantity);
              }
            }
          }
        }

        needs.push({
          product_id: s.product_id,
          sku: s.sku,
          name: s.name,
          category_name: s.category_name,
          unit_name: s.unit_name,
          available_qty: s.available_qty,
          min_stock: s.min_stock,
          shortfall_qty: Math.max(0, s.min_stock - s.available_qty),
          incoming_qty: incoming,
          stock_state: s.stock_state,
          last_purchase_price: s.last_purchase_price,
        });
      }
    }

    return needs.sort((a, b) => b.shortfall_qty - a.shortfall_qty);
  }

  public getDashboardSummary(): DashboardSummaryView {
    const stockViews = this.getProductStockViews();
    const batchViews = this.getBatchStatusViews();
    const today = new Date().toISOString().split('T')[0];

    let todayIn = 0;
    let todayOut = 0;

    for (const m of this.data.movements) {
      if (m.created_at.startsWith(today)) {
        if (m.quantity_delta > 0) todayIn += m.quantity_delta;
        else todayOut += Math.abs(m.quantity_delta);
      }
    }

    const pendingPO = this.data.purchaseOrders.filter((po) => po.status === 'ordered').length;
    const pendingAdj = this.data.adjustments.filter((a) => a.status === 'pending').length;

    return {
      active_products: stockViews.filter((p) => p.is_active).length,
      low_stock_count: stockViews.filter((p) => p.is_active && p.stock_state === 'low').length,
      out_of_stock_count: stockViews.filter((p) => p.is_active && p.stock_state === 'out').length,
      warning_expiry_count: batchViews.filter((b) => b.expiry_state === 'warning' && b.quantity_on_hand > 0).length,
      urgent_expiry_count: batchViews.filter((b) => b.expiry_state === 'urgent' && b.quantity_on_hand > 0).length,
      expired_batch_count: batchViews.filter((b) => b.expiry_state === 'expired' && b.quantity_on_hand > 0).length,
      today_in_qty: todayIn,
      today_out_qty: todayOut,
      pending_po_count: pendingPO,
      pending_adjustments_count: pendingAdj,
    };
  }

  // Stock Movement Ledger
  public getStockMovements(): (StockMovement & { product?: Product; batch?: InventoryBatch; creator_profile?: Profile })[] {
    return this.data.movements.map((m) => ({
      ...m,
      product: this.data.products.find((p) => p.id === m.product_id),
      batch: this.data.batches.find((b) => b.id === m.batch_id),
      creator_profile: this.data.profiles.find((p) => p.id === m.created_by),
    }));
  }

  // RPC: record_stock_in
  public record_stock_in(params: {
    product_id: string;
    quantity: number;
    movement_type: 'opening_balance' | 'other_in';
    reason?: string;
    expiry_date?: string | null;
    batch_code?: string;
    idempotency_key: string;
  }): StockMovement {
    const qty = Number(params.quantity);
    if (!qty || qty <= 0) throw new Error('Kuantitas masuk harus lebih dari 0.');

    if (params.movement_type === 'opening_balance' && !this.isOwner()) {
      throw new Error('Hanya Owner yang dapat mencatat saldo awal.');
    }
    if (params.movement_type === 'other_in' && (!params.reason || !params.reason.trim())) {
      throw new Error('Alasan wajib diisi untuk jenis barang masuk lainnya.');
    }

    const prod = this.data.products.find((p) => p.id === params.product_id);
    if (!prod || !prod.is_active) throw new Error('Produk tidak ditemukan atau tidak aktif.');

    // Idempotency check
    const existing = this.data.movements.find((m) => m.group_id === params.idempotency_key);
    if (existing) return existing;

    let batch: InventoryBatch | undefined;
    if (prod.track_expiry) {
      if (!params.expiry_date) throw new Error('Produk ini memerlukan tanggal kedaluwarsa.');
      const bCode = (params.batch_code || '').trim();
      batch = this.data.batches.find(
        (b) => b.product_id === prod.id && b.expiry_date === params.expiry_date && b.batch_code === bCode
      );
      if (!batch) {
        batch = {
          id: 'b-' + Date.now(),
          business_id: this.data.business.id,
          product_id: prod.id,
          batch_code: bCode,
          received_date: new Date().toISOString().split('T')[0],
          expiry_date: params.expiry_date,
          quantity_on_hand: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.batches.push(batch);
      }
    } else {
      batch = this.data.batches.find((b) => b.product_id === prod.id && b.expiry_date === null);
      if (!batch) {
        batch = {
          id: 'b-' + prod.id,
          business_id: this.data.business.id,
          product_id: prod.id,
          batch_code: '',
          received_date: new Date().toISOString().split('T')[0],
          expiry_date: null,
          quantity_on_hand: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.data.batches.push(batch);
      }
    }

    batch.quantity_on_hand += qty;
    batch.updated_at = new Date().toISOString();

    const movement: StockMovement = {
      id: 'm-' + Date.now(),
      business_id: this.data.business.id,
      product_id: prod.id,
      batch_id: batch.id,
      movement_type: params.movement_type,
      quantity_delta: qty,
      balance_after: batch.quantity_on_hand,
      reason: params.reason ? params.reason.trim() : null,
      group_id: params.idempotency_key,
      created_by: this.getActiveUser().id,
      created_at: new Date().toISOString(),
    };

    this.data.movements.unshift(movement);
    this.logAudit('record_stock_in', 'stock_movements', movement.id, null, movement);
    this.saveData();
    return movement;
  }

  // RPC: record_stock_out (supports automated FEFO across batches or manual batch)
  public record_stock_out(params: {
    product_id: string;
    quantity: number;
    movement_type: 'sale' | 'damaged' | 'expired' | 'internal_use' | 'other_out';
    reason?: string;
    batch_id?: string;
    idempotency_key: string;
  }): StockMovement[] {
    const qty = Number(params.quantity);
    if (!qty || qty <= 0) throw new Error('Kuantitas keluar harus lebih dari 0.');

    if (params.movement_type === 'other_out' && (!params.reason || !params.reason.trim())) {
      throw new Error('Alasan wajib diisi untuk jenis pengeluaran lainnya.');
    }

    const prod = this.data.products.find((p) => p.id === params.product_id);
    if (!prod || !prod.is_active) throw new Error('Produk tidak ditemukan atau tidak aktif.');

    // Idempotency check
    const existingGroup = this.data.movements.filter((m) => m.group_id === params.idempotency_key);
    if (existingGroup.length > 0) return existingGroup;

    const todayStr = new Date().toISOString().split('T')[0];

    // Determine eligible batches
    let eligibleBatches: InventoryBatch[] = [];
    if (params.batch_id) {
      const b = this.data.batches.find((item) => item.id === params.batch_id && item.product_id === prod.id);
      if (!b) throw new Error('Batch tidak ditemukan.');
      eligibleBatches = [b];
    } else {
      eligibleBatches = this.data.batches.filter((b) => b.product_id === prod.id && b.quantity_on_hand > 0);
      // FEFO Sort: First Expired First Out
      eligibleBatches.sort((a, b) => {
        if (!a.expiry_date && !b.expiry_date) return a.received_date.localeCompare(b.received_date);
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        const diff = a.expiry_date.localeCompare(b.expiry_date);
        return diff !== 0 ? diff : a.received_date.localeCompare(b.received_date);
      });
    }

    // Filter by type: 'expired' movement only takes expired batches. Other movements only take non-expired batches!
    if (params.movement_type === 'expired') {
      eligibleBatches = eligibleBatches.filter((b) => b.expiry_date && b.expiry_date < todayStr);
      if (eligibleBatches.length === 0) {
        throw new Error('Tidak ada batch yang kedaluwarsa untuk dikeluarkan.');
      }
    } else {
      eligibleBatches = eligibleBatches.filter((b) => !b.expiry_date || b.expiry_date >= todayStr);
    }

    const totalAvailable = eligibleBatches.reduce((sum, b) => sum + b.quantity_on_hand, 0);
    if (totalAvailable < qty) {
      throw new Error(
        `SK001: Stok tidak mencukupi. Tersedia: ${totalAvailable}, Diminta: ${qty}`
      );
    }

    let remainingToDeduct = qty;
    const generatedMovements: StockMovement[] = [];

    for (const batch of eligibleBatches) {
      if (remainingToDeduct <= 0) break;
      const deduct = Math.min(batch.quantity_on_hand, remainingToDeduct);
      batch.quantity_on_hand -= deduct;
      batch.updated_at = new Date().toISOString();
      remainingToDeduct -= deduct;

      const movement: StockMovement = {
        id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        business_id: this.data.business.id,
        product_id: prod.id,
        batch_id: batch.id,
        movement_type: params.movement_type,
        quantity_delta: -deduct,
        balance_after: batch.quantity_on_hand,
        reason: params.reason ? params.reason.trim() : null,
        group_id: params.idempotency_key,
        created_by: this.getActiveUser().id,
        created_at: new Date().toISOString(),
      };

      this.data.movements.unshift(movement);
      generatedMovements.push(movement);
    }

    this.logAudit(
      'record_stock_out',
      'stock_movements',
      params.idempotency_key,
      null,
      { product_sku: prod.sku, qty, type: params.movement_type, batches: generatedMovements.length }
    );
    this.saveData();
    return generatedMovements;
  }

  // Reverse Stock Transaction (Owner only, reversal of group_id)
  public reverse_stock_transaction(groupId: string, reason: string): StockMovement[] {
    if (!this.isOwner()) throw new Error('Hanya Owner yang dapat membalikkan transaksi.');
    if (!reason || !reason.trim()) throw new Error('Alasan pembalikan wajib diisi.');

    const targetMovements = this.data.movements.filter((m) => m.group_id === groupId);
    if (targetMovements.length === 0) throw new Error('Transaksi tidak ditemukan.');

    // Check if already reversed
    const alreadyReversed = this.data.movements.some((m) =>
      targetMovements.some((tm) => m.reversal_of_id === tm.id)
    );
    if (alreadyReversed) throw new Error('Transaksi ini sudah pernah dibalik sebelumnya.');

    const reversalGroupId = 'rev-' + crypto.randomUUID();
    const result: StockMovement[] = [];

    for (const tm of targetMovements) {
      const batch = this.data.batches.find((b) => b.id === tm.batch_id);
      if (!batch) throw new Error('Batch transaksi tidak ditemukan.');

      // Invert delta: if original was -3, reverse is +3; if original was +5, reverse is -5
      const reverseDelta = -tm.quantity_delta;
      if (batch.quantity_on_hand + reverseDelta < 0) {
        throw new Error(
          `Gagal membalikkan: Saldo batch ${batch.batch_code || 'default'} tidak mencukupi untuk pembalikan.`
        );
      }

      batch.quantity_on_hand += reverseDelta;
      batch.updated_at = new Date().toISOString();

      const revMovement: StockMovement = {
        id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        business_id: this.data.business.id,
        product_id: tm.product_id,
        batch_id: batch.id,
        movement_type: 'reversal',
        quantity_delta: reverseDelta,
        balance_after: batch.quantity_on_hand,
        reason: `Pembalikan transaksi [${tm.movement_type}]: ${reason.trim()}`,
        group_id: reversalGroupId,
        reversal_of_id: tm.id,
        created_by: this.getActiveUser().id,
        created_at: new Date().toISOString(),
      };

      this.data.movements.unshift(revMovement);
      result.push(revMovement);
    }

    this.logAudit('reverse_stock_transaction', 'stock_movements', groupId, null, {
      reversalGroupId,
      reason,
      count: result.length,
    });
    this.saveData();
    return result;
  }

  // Purchasing & PO
  public getPurchaseOrders(): (PurchaseOrder & { supplier?: Supplier })[] {
    return this.data.purchaseOrders.map((po) => {
      const supp = this.data.suppliers.find((s) => s.id === po.supplier_id);
      const items = (po.items || []).map((item) => ({
        ...item,
        product: this.data.products.find((p) => p.id === item.product_id),
      }));
      return { ...po, supplier: supp, items };
    });
  }

  public createPurchaseOrder(params: {
    supplier_id: string;
    expected_date?: string;
    note?: string;
    items: { product_id: string; ordered_quantity: number; unit_cost: number }[];
  }): PurchaseOrder {
    if (!this.canCreatePO()) throw new Error('Akses ditolak: Anda tidak memiliki izin membuat PO.');
    if (!params.items || params.items.length === 0) throw new Error('PO harus memiliki minimal 1 item.');

    const supp = this.data.suppliers.find((s) => s.id === params.supplier_id);
    if (!supp) throw new Error('Pemasok tidak ditemukan.');

    const poId = 'po-' + Date.now();
    const nextNo = 1000 + this.data.purchaseOrders.length + 1;

    const poItems: PurchaseOrderItem[] = params.items.map((item, idx) => ({
      id: 'poi-' + Date.now() + '-' + idx,
      business_id: this.data.business.id,
      purchase_order_id: poId,
      product_id: item.product_id,
      ordered_quantity: Number(item.ordered_quantity),
      received_quantity: 0,
      unit_cost: Number(item.unit_cost),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const newPO: PurchaseOrder = {
      id: poId,
      business_id: this.data.business.id,
      po_no: nextNo,
      supplier_id: params.supplier_id,
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: params.expected_date || null,
      note: params.note || null,
      created_by: this.getActiveUser().id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: poItems,
    };

    this.data.purchaseOrders.unshift(newPO);
    this.logAudit('create_purchase_order', 'purchase_orders', poId, null, newPO);
    this.saveData();
    return newPO;
  }

  public set_purchase_order_status(poId: string, status: POStatus) {
    if (!this.canCreatePO()) throw new Error('Akses ditolak: Anda tidak memiliki izin kelola PO.');
    const po = this.data.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error('PO tidak ditemukan.');

    // Status transitions
    if (status === 'cancelled' && po.status !== 'draft' && po.status !== 'ordered') {
      throw new Error('Hanya PO berstatus draft atau ordered yang dapat dibatalkan.');
    }
    if (status === 'closed' && po.status !== 'partially_received') {
      throw new Error('Hanya PO berstatus partially_received yang dapat ditutup.');
    }

    const oldStatus = po.status;
    po.status = status;
    po.updated_at = new Date().toISOString();
    this.logAudit('set_po_status', 'purchase_orders', poId, { status: oldStatus }, { status });
    this.saveData();
  }

  // RPC: receive_goods (Goods Receipt from PO or direct purchase)
  public receive_goods(params: {
    supplier_id: string;
    purchase_order_id?: string | null;
    note?: string;
    idempotency_key: string;
    items: {
      product_id: string;
      quantity: number;
      unit_cost: number;
      expiry_date?: string | null;
      batch_code?: string;
    }[];
  }): GoodsReceipt {
    if (!this.canConfirmReceipt()) throw new Error('Akses ditolak: Anda tidak memiliki izin konfirmasi penerimaan.');
    if (!params.items || params.items.length === 0) throw new Error('Minimal 1 item penerimaan barang.');

    const supp = this.data.suppliers.find((s) => s.id === params.supplier_id);
    if (!supp) throw new Error('Pemasok tidak ditemukan.');

    // Idempotency
    const existing = this.data.goodsReceipts.find((r) => r.idempotency_key === params.idempotency_key);
    if (existing) return existing;

    const receiptId = 'gr-' + Date.now();
    const receiptNo = 2000 + this.data.goodsReceipts.length + 1;
    const receivedItems: GoodsReceiptItem[] = [];

    let targetPO: PurchaseOrder | undefined;
    if (params.purchase_order_id) {
      targetPO = this.data.purchaseOrders.find((p) => p.id === params.purchase_order_id);
      if (!targetPO) throw new Error('PO tidak ditemukan.');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (const item of params.items) {
      const prod = this.data.products.find((p) => p.id === item.product_id);
      if (!prod) throw new Error(`Produk ID ${item.product_id} tidak ditemukan.`);

      const qty = Number(item.quantity);
      const cost = Number(item.unit_cost);
      if (qty <= 0) throw new Error(`Kuantitas penerimaan ${prod.name} harus > 0.`);

      // Validate PO quantities if receiving from PO
      if (targetPO) {
        const poItem = targetPO.items?.find((i) => i.product_id === prod.id);
        if (!poItem) throw new Error(`Produk ${prod.name} tidak ada dalam daftar item PO ini.`);
        const remainingOrdered = poItem.ordered_quantity - poItem.received_quantity;
        if (qty > remainingOrdered) {
          throw new Error(
            `SK002: Kuantitas penerimaan (${qty}) melebihi sisa pesanan (${remainingOrdered}) untuk produk ${prod.name}.`
          );
        }
        poItem.received_quantity += qty;
        poItem.updated_at = new Date().toISOString();
      }

      // Update product last_purchase_price
      prod.last_purchase_price = cost;
      prod.updated_at = new Date().toISOString();

      // Find or create batch
      let batch: InventoryBatch | undefined;
      const bCode = (item.batch_code || '').trim();

      if (prod.track_expiry) {
        if (!item.expiry_date) {
          throw new Error(`Produk ${prod.name} wajib mencantumkan tanggal kedaluwarsa.`);
        }
        batch = this.data.batches.find(
          (b) => b.product_id === prod.id && b.expiry_date === item.expiry_date && b.batch_code === bCode
        );
        if (!batch) {
          batch = {
            id: 'b-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
            business_id: this.data.business.id,
            product_id: prod.id,
            batch_code: bCode,
            received_date: todayStr,
            expiry_date: item.expiry_date,
            quantity_on_hand: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.data.batches.push(batch);
        }
      } else {
        batch = this.data.batches.find((b) => b.product_id === prod.id && b.expiry_date === null);
        if (!batch) {
          batch = {
            id: 'b-' + prod.id,
            business_id: this.data.business.id,
            product_id: prod.id,
            batch_code: '',
            received_date: todayStr,
            expiry_date: null,
            quantity_on_hand: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.data.batches.push(batch);
        }
      }

      batch.quantity_on_hand += qty;
      batch.updated_at = new Date().toISOString();

      // Create goods receipt item
      const grItem: GoodsReceiptItem = {
        id: 'gri-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        business_id: this.data.business.id,
        goods_receipt_id: receiptId,
        product_id: prod.id,
        batch_id: batch.id,
        quantity: qty,
        unit_cost: cost,
      };
      receivedItems.push(grItem);

      // Record movement
      const movement: StockMovement = {
        id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        business_id: this.data.business.id,
        product_id: prod.id,
        batch_id: batch.id,
        movement_type: 'purchase_receipt',
        quantity_delta: qty,
        balance_after: batch.quantity_on_hand,
        reason: targetPO ? `Penerimaan dari PO #${targetPO.po_no}` : `Pembelian langsung`,
        reference_type: 'goods_receipt',
        reference_id: receiptId,
        group_id: params.idempotency_key,
        created_by: this.getActiveUser().id,
        created_at: new Date().toISOString(),
      };
      this.data.movements.unshift(movement);
    }

    // Update PO status if all items received
    if (targetPO) {
      const allFullyReceived = (targetPO.items || []).every(
        (i) => i.received_quantity >= i.ordered_quantity
      );
      targetPO.status = allFullyReceived ? 'received' : 'partially_received';
      targetPO.updated_at = new Date().toISOString();
    }

    const receipt: GoodsReceipt = {
      id: receiptId,
      business_id: this.data.business.id,
      receipt_no: receiptNo,
      supplier_id: params.supplier_id,
      purchase_order_id: params.purchase_order_id || null,
      received_at: new Date().toISOString(),
      note: params.note || null,
      received_by: this.getActiveUser().id,
      idempotency_key: params.idempotency_key,
      created_at: new Date().toISOString(),
      items: receivedItems,
    };

    this.data.goodsReceipts.unshift(receipt);
    this.logAudit('receive_goods', 'goods_receipts', receiptId, null, {
      receipt_no: receiptNo,
      supplier: supp.name,
      items: receivedItems.length,
    });
    this.saveData();
    return receipt;
  }

  // Stock Opname & Adjustments
  public getOpnames(): (StockOpname & { starter_profile?: Profile; items?: StockOpnameItem[] })[] {
    return this.data.opnames.map((o) => ({
      ...o,
      starter_profile: this.data.profiles.find((p) => p.id === o.started_by),
      items: (o.items || []).map((i) => ({
        ...i,
        product: this.data.products.find((p) => p.id === i.product_id),
        batch: this.data.batches.find((b) => b.id === i.batch_id),
      })),
    }));
  }

  public getAdjustments(): (StockAdjustment & {
    requester_profile?: Profile;
    reviewer_profile?: Profile;
    product?: Product;
    batch?: InventoryBatch;
  })[] {
    return this.data.adjustments.map((a) => ({
      ...a,
      requester_profile: this.data.profiles.find((p) => p.id === a.requested_by),
      reviewer_profile: this.data.profiles.find((p) => p.id === a.reviewed_by),
      product: this.data.products.find((p) => p.id === a.product_id),
      batch: this.data.batches.find((b) => b.id === a.batch_id),
    }));
  }

  // RPC: submit_stock_opname
  public submit_stock_opname(params: {
    items: {
      batch_id: string;
      counted_quantity: number;
      reason?: string;
    }[];
  }): StockOpname {
    const opnameId = 'opn-' + Date.now();
    const opnameItems: StockOpnameItem[] = [];
    const isOwnerUser = this.isOwner();

    for (const item of params.items) {
      const batch = this.data.batches.find((b) => b.id === item.batch_id);
      if (!batch) continue;

      const systemQty = batch.quantity_on_hand;
      const countedQty = Number(item.counted_quantity);
      const diff = countedQty - systemQty;

      if (diff !== 0 && (!item.reason || !item.reason.trim())) {
        const prod = this.data.products.find((p) => p.id === batch.product_id);
        throw new Error(
          `Alasan wajib diisi untuk selisih stok produk ${prod?.name || batch.batch_code || 'ini'}.`
        );
      }

      const opnItem: StockOpnameItem = {
        id: 'opni-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        stock_opname_id: opnameId,
        batch_id: batch.id,
        product_id: batch.product_id,
        system_quantity: systemQty,
        counted_quantity: countedQty,
        difference: diff,
        reason: item.reason ? item.reason.trim() : null,
      };
      opnameItems.push(opnItem);

      // If discrepancy exists, generate adjustment
      if (diff !== 0) {
        const adjId = 'adj-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
        const adj: StockAdjustment = {
          id: adjId,
          business_id: this.data.business.id,
          batch_id: batch.id,
          product_id: batch.product_id,
          quantity_delta: diff,
          reason: item.reason || 'Hasil Stock Opname',
          status: isOwnerUser ? 'approved' : 'pending',
          requested_by: this.getActiveUser().id,
          reviewed_by: isOwnerUser ? this.getActiveUser().id : null,
          reviewed_at: isOwnerUser ? new Date().toISOString() : null,
          opname_item_id: opnItem.id,
          idempotency_key: 'idem-' + adjId,
          created_at: new Date().toISOString(),
        };

        if (isOwnerUser) {
          // Auto-apply for Owner
          batch.quantity_on_hand += diff;
          batch.updated_at = new Date().toISOString();

          const movement: StockMovement = {
            id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
            business_id: this.data.business.id,
            product_id: batch.product_id,
            batch_id: batch.id,
            movement_type: diff > 0 ? 'adjustment_in' : 'adjustment_out',
            quantity_delta: diff,
            balance_after: batch.quantity_on_hand,
            reason: `Penyesuaian Opname (Owner): ${adj.reason}`,
            group_id: adj.idempotency_key,
            created_by: this.getActiveUser().id,
            created_at: new Date().toISOString(),
          };
          this.data.movements.unshift(movement);
          adj.movement_id = movement.id;
        }

        this.data.adjustments.unshift(adj);
      }
    }

    const hasPendingDiscrepancies = opnameItems.some((i) => i.difference !== 0) && !isOwnerUser;

    const opname: StockOpname = {
      id: opnameId,
      business_id: this.data.business.id,
      status: hasPendingDiscrepancies ? 'submitted' : 'completed',
      started_by: this.getActiveUser().id,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      completed_at: hasPendingDiscrepancies ? null : new Date().toISOString(),
      items: opnameItems,
    };

    this.data.opnames.unshift(opname);
    this.logAudit('submit_stock_opname', 'stock_opnames', opnameId, null, {
      itemsCount: opnameItems.length,
      status: opname.status,
    });
    this.saveData();
    return opname;
  }

  // Review Stock Adjustment (Owner only)
  public review_stock_adjustment(adjustmentId: string, approve: boolean, reviewNote?: string) {
    if (!this.isOwner()) throw new Error('Hanya Owner yang dapat menyetujui penyesuaian stok.');
    const adj = this.data.adjustments.find((a) => a.id === adjustmentId);
    if (!adj) throw new Error('Penyesuaian stok tidak ditemukan.');
    if (adj.status !== 'pending') throw new Error('Penyesuaian ini sudah pernah diproses.');

    const batch = this.data.batches.find((b) => b.id === adj.batch_id);
    if (!batch) throw new Error('Batch tidak ditemukan.');

    adj.status = approve ? 'approved' : 'rejected';
    adj.reviewed_by = this.getActiveUser().id;
    adj.reviewed_at = new Date().toISOString();
    adj.review_note = reviewNote || null;

    if (approve) {
      if (batch.quantity_on_hand + adj.quantity_delta < 0) {
        throw new Error('Penyesuaian ditolak karena akan membuat stok menjadi negatif.');
      }
      batch.quantity_on_hand += adj.quantity_delta;
      batch.updated_at = new Date().toISOString();

      const movement: StockMovement = {
        id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        business_id: this.data.business.id,
        product_id: batch.product_id,
        batch_id: batch.id,
        movement_type: adj.quantity_delta > 0 ? 'adjustment_in' : 'adjustment_out',
        quantity_delta: adj.quantity_delta,
        balance_after: batch.quantity_on_hand,
        reason: `Persetujuan koreksi stok: ${adj.reason}`,
        group_id: adj.idempotency_key,
        created_by: this.getActiveUser().id,
        created_at: new Date().toISOString(),
      };
      this.data.movements.unshift(movement);
      adj.movement_id = movement.id;
    }

    // Check if related opname can be marked completed
    if (adj.opname_item_id) {
      const opnItem = this.data.opnames
        .flatMap((o) => o.items || [])
        .find((i) => i.id === adj.opname_item_id);
      if (opnItem) {
        const parentOpn = this.data.opnames.find((o) => o.id === opnItem.stock_opname_id);
        if (parentOpn && parentOpn.status === 'submitted') {
          // Check if all adjustments for this opname are no longer pending
          const itemIds = (parentOpn.items || []).map((i) => i.id);
          const hasRemainingPending = this.data.adjustments.some(
            (a) => a.opname_item_id && itemIds.includes(a.opname_item_id) && a.status === 'pending'
          );
          if (!hasRemainingPending) {
            parentOpn.status = 'completed';
            parentOpn.completed_at = new Date().toISOString();
          }
        }
      }
    }

    this.logAudit('review_stock_adjustment', 'stock_adjustments', adjustmentId, null, {
      status: adj.status,
      note: reviewNote,
    });
    this.saveData();
  }

  // Direct Stock Adjustment request (without full opname)
  public request_stock_adjustment(params: {
    batch_id: string;
    quantity_delta: number;
    reason: string;
  }): StockAdjustment {
    const delta = Number(params.quantity_delta);
    if (!delta || delta === 0) throw new Error('Selisih penyesuaian tidak boleh 0.');
    if (!params.reason || !params.reason.trim()) throw new Error('Alasan penyesuaian wajib diisi.');

    const batch = this.data.batches.find((b) => b.id === params.batch_id);
    if (!batch) throw new Error('Batch tidak ditemukan.');

    const isOwnerUser = this.isOwner();
    const adjId = 'adj-' + Date.now();

    const adj: StockAdjustment = {
      id: adjId,
      business_id: this.data.business.id,
      batch_id: batch.id,
      product_id: batch.product_id,
      quantity_delta: delta,
      reason: params.reason.trim(),
      status: isOwnerUser ? 'approved' : 'pending',
      requested_by: this.getActiveUser().id,
      reviewed_by: isOwnerUser ? this.getActiveUser().id : null,
      reviewed_at: isOwnerUser ? new Date().toISOString() : null,
      idempotency_key: 'idem-' + adjId,
      created_at: new Date().toISOString(),
    };

    if (isOwnerUser) {
      if (batch.quantity_on_hand + delta < 0) {
        throw new Error('Penyesuaian membuat stok menjadi negatif.');
      }
      batch.quantity_on_hand += delta;
      batch.updated_at = new Date().toISOString();

      const movement: StockMovement = {
        id: 'm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
        business_id: this.data.business.id,
        product_id: batch.product_id,
        batch_id: batch.id,
        movement_type: delta > 0 ? 'adjustment_in' : 'adjustment_out',
        quantity_delta: delta,
        balance_after: batch.quantity_on_hand,
        reason: `Penyesuaian stok langsung: ${params.reason.trim()}`,
        group_id: adj.idempotency_key,
        created_by: this.getActiveUser().id,
        created_at: new Date().toISOString(),
      };
      this.data.movements.unshift(movement);
      adj.movement_id = movement.id;
    }

    this.data.adjustments.unshift(adj);
    this.logAudit('request_stock_adjustment', 'stock_adjustments', adjId, null, adj);
    this.saveData();
    return adj;
  }

  public getAuditLogs(): AuditLog[] {
    if (!this.isOwner()) {
      return []; // Audit log is strictly for Owner (PRD §4.1, SRS FR-AUD.02)
    }
    return this.data.auditLogs;
  }
}

export const store = new SimetrisStore();

// Utility for CSV Export
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
