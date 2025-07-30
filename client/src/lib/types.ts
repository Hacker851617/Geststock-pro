export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface ProductFilter {
  search: string;
  category: string;
  stockLevel: string;
}

export interface StockAdjustment {
  productId: string;
  type: "add" | "remove";
  quantity: number;
  reason?: string;
}
