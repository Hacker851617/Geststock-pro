import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Plus, Calendar, TrendingUp, TrendingDown, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { StockMovement, Product } from "@shared/schema";

interface MovementsTableProps {
  onAddMovement: () => void;
}

export function MovementsTable({ onAddMovement }: MovementsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const { toast } = useToast();

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

  const getTypeInfo = (movementType: string) => {
    const types = {
      sale: { label: "Vente", icon: TrendingDown, color: "text-red-600 bg-red-100" },
      purchase: { label: "Achat", icon: TrendingUp, color: "text-green-600 bg-green-100" },
      adjustment: { label: "Ajustement", icon: RefreshCw, color: "text-blue-600 bg-blue-100" },
      return: { label: "Retour", icon: ArrowLeft, color: "text-orange-600 bg-orange-100" },
    };
    return types[movementType as keyof typeof types] || { label: movementType, icon: RefreshCw, color: "text-gray-600 bg-gray-100" };
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(price / 100);
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/export/movements-csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mouvements_stock.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export réussi",
        description: "Les mouvements ont été exportés en CSV.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les mouvements.",
        variant: "destructive",
      });
    }
  };

  const filteredMovements = movements?.filter(movement => {
    const productName = getProductName(movement.productId);
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (movement.reference && movement.reference.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !typeFilter || typeFilter === "all" || movement.movementType === typeFilter;
    const matchesDate = !dateFilter || new Date(movement.timestamp!).toDateString() === new Date(dateFilter).toDateString();
    
    return matchesSearch && matchesType && matchesDate;
  }) || [];

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-200 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Historique des Mouvements</h2>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2" size={16} />
              Exporter
            </Button>
            <Button onClick={onAddMovement}>
              <Plus className="mr-2" size={16} />
              Nouveau Mouvement
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 ml-3 w-4 h-4 text-slate-400 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Rechercher par produit ou référence..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="sale">Ventes</SelectItem>
                <SelectItem value="purchase">Achats</SelectItem>
                <SelectItem value="adjustment">Ajustements</SelectItem>
                <SelectItem value="return">Retours</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-40"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date & Heure
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Produit
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Quantité
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Prix Total
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Référence
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Motif
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-slate-200">
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  {searchQuery || typeFilter || dateFilter ? "Aucun mouvement trouvé avec ces critères." : "Aucun mouvement enregistré."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => {
                const typeInfo = getTypeInfo(movement.movementType || movement.type);
                const Icon = typeInfo.icon;
                return (
                  <TableRow key={movement.id} className="hover:bg-slate-50">
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="text-slate-400 mr-2" size={16} />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(movement.timestamp!).toLocaleDateString("fr-FR")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(movement.timestamp!).toLocaleTimeString("fr-FR")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className={typeInfo.color}>
                        <Icon className="mr-1" size={12} />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {getProductName(movement.productId)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {movement.type === 'remove' ? '-' : '+'}{movement.quantity}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {formatPrice(movement.totalPrice)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {movement.reference || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {movement.reason || "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}