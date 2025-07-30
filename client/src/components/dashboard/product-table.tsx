import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Plus, Edit, MoreHorizontal, Trash2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface ProductTableProps {
  onAddProduct: () => void;
  onAdjustStock: (product: Product) => void;
}

export function ProductTable({ onAddProduct, onAdjustStock }: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit.",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/export/csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées en CSV.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (product: Product) => {
    if (product.quantity === 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Rupture</Badge>;
    }
    if (product.quantity <= (product.minStock || 5)) {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Stock bas</Badge>;
    }
    return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">En stock</Badge>;
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

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock = !stockFilter || stockFilter === "all" || 
      (stockFilter === "low" && product.quantity > 0 && product.quantity <= (product.minStock || 5)) ||
      (stockFilter === "out" && product.quantity === 0) ||
      (stockFilter === "normal" && product.quantity > (product.minStock || 5));
    
    return matchesSearch && matchesCategory && matchesStock;
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
          <h2 className="text-lg font-semibold text-slate-900">Gestion des Produits</h2>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2" size={16} />
              Exporter CSV
            </Button>
            <Button onClick={onAddProduct}>
              <Plus className="mr-2" size={16} />
              Ajouter Produit
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute inset-y-0 left-0 ml-3 w-4 h-4 text-slate-400 top-1/2 transform -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="electronique">Électronique</SelectItem>
                <SelectItem value="vetements">Vêtements</SelectItem>
                <SelectItem value="alimentation">Alimentation</SelectItem>
                <SelectItem value="maison">Maison & Jardin</SelectItem>
                <SelectItem value="sport">Sport & Loisirs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tous les stocks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les stocks</SelectItem>
                <SelectItem value="low">Stock bas</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
                <SelectItem value="normal">Stock normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nom du Produit
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Catégorie
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Quantité
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Statut
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Dernière MAJ
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-slate-200">
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  {searchQuery || categoryFilter || stockFilter ? "Aucun produit trouvé avec ces critères." : "Aucun produit dans l'inventaire."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center mr-3">
                        <Package className="text-slate-500" size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{product.name}</div>
                        {product.sku && (
                          <div className="text-sm text-slate-500">SKU: {product.sku}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(product.category)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {product.quantity}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(product)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(product.lastModified!).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAdjustStock(product)}>
                          <Edit className="mr-2" size={16} />
                          Ajuster stock
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2" size={16} />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
