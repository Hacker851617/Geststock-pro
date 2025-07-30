import { Navbar } from "@/components/layout/navbar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProductTable } from "@/components/dashboard/product-table";
import { AddProductModal } from "@/components/modals/add-product-modal";
import { StockAdjustmentModal } from "@/components/modals/stock-adjustment-modal";
import { useState } from "react";
import type { Product } from "@shared/schema";

export default function Dashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleOpenStockModal = (product: Product) => {
    setSelectedProduct(product);
    setIsStockModalOpen(true);
  };

  return (
    <div className="min-h-full">
      <Navbar />
      
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsCards />
          
          <ProductTable 
            onAddProduct={() => setIsAddModalOpen(true)}
            onAdjustStock={handleOpenStockModal}
          />
        </div>
      </main>

      <AddProductModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <StockAdjustmentModal
        open={isStockModalOpen}
        onOpenChange={setIsStockModalOpen}
        product={selectedProduct}
      />
    </div>
  );
}
