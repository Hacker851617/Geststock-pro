import { Navbar } from "@/components/layout/navbar";
import { MovementsTable } from "@/components/movements/movements-table";
import { AddMovementModal } from "@/components/modals/add-movement-modal";
import { useState } from "react";

export default function Movements() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="min-h-full">
      <Navbar />
      
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Mouvements de Stock</h1>
            <p className="text-slate-600 mt-1">Suivi détaillé des ventes, achats et ajustements</p>
          </div>
          
          <MovementsTable onAddMovement={() => setIsAddModalOpen(true)} />
        </div>
      </main>

      <AddMovementModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}