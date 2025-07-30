import { useQuery } from "@tanstack/react-query";
import { Package, Warehouse, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
}

export function StatsCards() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-200 rounded animate-pulse mr-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      label: "Total Produits",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Stock Total",
      value: stats?.totalStock || 0,
      icon: Warehouse,
      color: "text-emerald-600",
    },
    {
      label: "Stock Bas",
      value: stats?.lowStock || 0,
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      label: "Rupture",
      value: stats?.outOfStock || 0,
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`text-2xl ${stat.color}`} size={28} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(stats?.lowStock || 0) > 0 && (
        <div className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="text-amber-600 mr-3" size={20} />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Alertes Stock</h3>
                <p className="text-sm text-amber-700 mt-1">
                  {stats?.lowStock} produits nécessitent votre attention.{" "}
                  <a href="#" className="underline font-medium">Voir les détails</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
