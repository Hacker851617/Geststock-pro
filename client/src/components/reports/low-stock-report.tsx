import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";

export function LowStockReport() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const lowStockProducts = products?.filter(product => 
    product.quantity <= (product.minStock || 5)
  ) || [];

  const outOfStockProducts = lowStockProducts.filter(product => product.quantity === 0);
  const criticalStockProducts = lowStockProducts.filter(product => 
    product.quantity > 0 && product.quantity <= (product.minStock || 5)
  );

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return { label: "Rupture", color: "bg-red-100 text-red-800", icon: TrendingDown };
    }
    if (product.quantity <= (product.minStock || 5)) {
      return { label: "Stock critique", color: "bg-amber-100 text-amber-800", icon: AlertTriangle };
    }
    return { label: "Stock normal", color: "bg-green-100 text-green-800", icon: Package };
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      electronique: "bg-blue-100 text-blue-800",
      vetements: "bg-purple-100 text-purple-800",
      alimentation: "bg-green-100 text-green-800",
      maison: "bg-orange-100 text-orange-800",
      sport: "bg-cyan-100 text-cyan-800",
    };
    return (
      <Badge variant="secondary" className={colors[category as keyof typeof colors] || "bg-slate-100 text-slate-800"}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center">
              <TrendingDown className="mr-2" size={16} />
              Ruptures de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{outOfStockProducts.length}</div>
            <p className="text-xs text-red-700 mt-1">Produits en rupture</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 flex items-center">
              <AlertTriangle className="mr-2" size={16} />
              Stock Critique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{criticalStockProducts.length}</div>
            <p className="text-xs text-amber-700 mt-1">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
              <Package className="mr-2" size={16} />
              Total Alertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{lowStockProducts.length}</div>
            <p className="text-xs text-slate-600 mt-1">Produits nécessitant attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="mr-2 text-amber-600" size={20} />
              Détail des Alertes Stock
            </div>
            <Button variant="outline" size="sm">
              Exporter la Liste
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Excellent !</h3>
              <p className="text-slate-600">Aucun produit en stock bas. Tous vos stocks sont bien approvisionnés.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Stock Actuel</TableHead>
                    <TableHead className="text-center">Seuil Minimum</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-center">Recommandation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => {
                    const status = getStockStatus(product);
                    const Icon = status.icon;
                    const recommendedOrder = Math.max(10, (product.minStock || 5) * 2);
                    
                    return (
                      <TableRow key={product.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            {product.sku && (
                              <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(product.category)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${product.quantity === 0 ? 'text-red-600' : 'text-slate-900'}`}>
                            {product.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-slate-600">
                          {product.minStock || 5}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={status.color}>
                            <Icon className="mr-1" size={12} />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="text-sm">
                            <div className="font-medium text-slate-900">
                              Commander {recommendedOrder} unités
                            </div>
                            <div className="text-xs text-slate-500">
                              Dernière MAJ: {new Date(product.lastModified!).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}