import { Navbar } from "@/components/layout/navbar";
import { LowStockReport } from "@/components/reports/low-stock-report";
import { MovementsReport } from "@/components/reports/movements-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Reports() {
  return (
    <div className="min-h-full">
      <Navbar />
      
      <main className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Rapports & Alertes</h1>
            <p className="text-slate-600 mt-1">Analyses et alertes de stock</p>
          </div>
          
          <Tabs defaultValue="low-stock" className="space-y-6">
            <TabsList>
              <TabsTrigger value="low-stock">Alertes Stock Bas</TabsTrigger>
              <TabsTrigger value="movements">Rapport Mouvements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="low-stock">
              <LowStockReport />
            </TabsContent>
            
            <TabsContent value="movements">
              <MovementsReport />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}