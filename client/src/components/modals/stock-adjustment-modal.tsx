import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Minus, Package } from "lucide-react";
import type { Product } from "@shared/schema";

const stockAdjustmentSchema = z.object({
  operation: z.enum(["add", "remove"]),
  quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
  reason: z.string().optional(),
});

type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>;

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function StockAdjustmentModal({ open, onOpenChange, product }: StockAdjustmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      operation: "add",
      quantity: 1,
      reason: "",
    },
  });

  const stockAdjustmentMutation = useMutation({
    mutationFn: async (data: StockAdjustmentForm) => {
      const response = await apiRequest("POST", "/api/stock-movements", {
        productId: product!.id,
        type: data.operation,
        quantity: data.quantity,
        reason: data.reason,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      onOpenChange(false);
      toast({
        title: "Stock mis à jour",
        description: "L'ajustement de stock a été effectué avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'ajustement de stock.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StockAdjustmentForm) => {
    if (!product) return;
    stockAdjustmentMutation.mutate(data);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuster le Stock</DialogTitle>
        </DialogHeader>
        
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                <Package className="text-slate-500" size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{product.name}</p>
                {product.sku && (
                  <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                )}
                <p className="text-sm text-slate-600 mt-1">
                  Stock actuel: <span className="font-medium">{product.quantity}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="operation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'opération</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add" id="add" />
                        <label htmlFor="add" className="text-sm text-slate-700 flex items-center">
                          <Plus className="text-emerald-600 mr-1" size={16} />
                          Ajouter au stock (livraison, retour)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remove" id="remove" />
                        <label htmlFor="remove" className="text-sm text-slate-700 flex items-center">
                          <Minus className="text-red-600 mr-1" size={16} />
                          Retirer du stock (vente, perte)
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1"
                      placeholder="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Vente, Livraison..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={stockAdjustmentMutation.isPending}>
                {stockAdjustmentMutation.isPending ? "Confirmation..." : "Confirmer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
