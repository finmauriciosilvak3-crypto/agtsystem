import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertExpenseSchema, type Expense } from "@shared/schema";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  date: z.string().min(1, "Data é obrigatória"),
  value: z.string().min(1, "Valor é obrigatório"),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  onSuccess: () => void;
}

export default function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const { toast } = useToast();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      date: expense ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      description: expense?.description || "",
      value: expense?.value || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date),
      };
      await apiRequest("POST", "/api/expenses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Despesa criada",
        description: "A despesa foi criada com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a despesa.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date),
      };
      await apiRequest("PUT", `/api/expenses/${expense!.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Despesa atualizada",
        description: "A despesa foi atualizada com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a despesa.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    if (expense) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Digite a descrição da despesa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : (expense ? "Atualizar" : "Criar")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
