import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StockMovement, Product } from "@shared/schema";

export function MovementsReport() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [periodFilter, setPeriodFilter] = useState("week");

  const { data: movements, isLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || "Produit supprimé";
  };

  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      today: { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date() },
      week: { from: new Date(now.setDate(now.getDate() - 7)), to: new Date() },
      month: { from: new Date(now.setMonth(now.getMonth() - 1)), to: new Date() },
      custom: { 
        from: dateFrom ? new Date(dateFrom) : new Date(0), 
        to: dateTo ? new Date(dateTo) : new Date() 
      }
    };
    return ranges[periodFilter as keyof typeof ranges] || ranges.week;
  };

  const filteredMovements = movements?.filter(movement => {
    const movementDate = new Date(movement.timestamp!);
    const { from, to } = getDateRange();
    return movementDate >= from && movementDate <= to;
  }) || [];

  const calculateStats = () => {
    const sales = filteredMovements.filter(m => m.type === 'sale');
    const purchases = filteredMovements.filter(m => m.type === 'purchase');
    const adjustments = filteredMovements.filter(m => m.type === 'adjustment');
    const returns = filteredMovements.filter(m => m.type === 'return');

    return {
      totalMovements: filteredMovements.length,
      salesCount: sales.length,
      salesValue: sales.reduce((sum, m) => sum + (m.totalPrice || 0), 0),
      purchasesCount: purchases.length,
      purchasesValue: purchases.reduce((sum, m) => sum + (m.totalPrice || 0), 0),
      adjustmentsCount: adjustments.length,
      returnsCount: returns.length,
      returnsValue: returns.reduce((sum, m) => sum + (m.totalPrice || 0), 0),
    };
  };

  const stats = calculateStats();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(price / 100);
  };

  const topProducts = () => {
    const productStats = new Map();
    
    filteredMovements.forEach(movement => {
      const productName = getProductName(movement.productId);
      if (!productStats.has(movement.productId)) {
        productStats.set(movement.productId, {
          name: productName,
          totalQuantity: 0,
          totalValue: 0,
          sales: 0,
          purchases: 0
        });
      }
      
      const stat = productStats.get(movement.productId);
      stat.totalQuantity += movement.quantity;
      stat.totalValue += movement.totalPrice || 0;
      
      if (movement.type === 'sale') stat.sales += movement.quantity;
      if (movement.type === 'purchase') stat.purchases += movement.quantity;
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres de Période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">7 derniers jours</SelectItem>
                <SelectItem value="month">30 derniers jours</SelectItem>
                <SelectItem value="custom">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>
            
            {periodFilter === "custom" && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Du:</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Au:</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}
            
            <Button variant="outline" onClick={async () => {
              try {
                const response = await fetch("/api/export/movements-csv");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "rapport_mouvements.csv";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error("Export failed:", error);
              }
            }}>
              <Download className="mr-2" size={16} />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <BarChart3 className="mr-2" size={16} />
              Total Mouvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalMovements}</div>
            <p className="text-xs text-blue-700 mt-1">Opérations enregistrées</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <TrendingUp className="mr-2" size={16} />
              Ventes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.salesCount}</div>
            <p className="text-xs text-green-700 mt-1">{formatPrice(stats.salesValue)}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
              <TrendingDown className="mr-2" size={16} />
              Achats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.purchasesCount}</div>
            <p className="text-xs text-orange-700 mt-1">{formatPrice(stats.purchasesValue)}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
              <Calendar className="mr-2" size={16} />
              Retours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.returnsCount}</div>
            <p className="text-xs text-slate-600 mt-1">{formatPrice(stats.returnsValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Produits par Valeur</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts().length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600">Aucun mouvement dans la période sélectionnée.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts().map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-sm text-slate-600">
                        {product.sales} vendus • {product.purchases} achetés
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">
                      {formatPrice(product.totalValue)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {product.totalQuantity} unités
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}