
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { insertContractSchema, type Contract, type Client } from "@shared/schema";
import { z } from "zod";

const contractFormSchema = insertContractSchema.extend({
  startDate: z.string().min(1, "Data de início é obrigatória"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  interestType: z.enum(["percentage", "fixed"]).optional(),
  interestRate: z.string().optional(),
  interestValue: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface ContractFormProps {
  contract?: Contract | null;
  onSuccess: () => void;
}

export default function ContractForm({ contract, onSuccess }: ContractFormProps) {
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      clientId: contract?.clientId || "",
      totalValue: contract?.totalValue || "",
      interestType: contract?.interestType || "percentage",
      interestRate: contract?.interestRate || "",
      interestValue: contract?.interestValue || "",
      installments: contract?.installments || 1,
      intervalDays: contract?.intervalDays || 30,
      startDate: contract ? new Date(contract.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      allowWeekendDue: contract?.allowWeekendDue || false,
      observations: contract?.observations || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const payload = {
        ...data,
        startDate: new Date(data.startDate),
        totalValue: parseFloat(data.totalValue).toFixed(2),
        interestRate: data.interestType === "percentage" && data.interestRate ? parseFloat(data.interestRate).toFixed(2) : undefined,
        interestValue: data.interestType === "fixed" && data.interestValue ? parseFloat(data.interestValue).toFixed(2) : undefined,
      };
      await apiRequest("POST", "/api/contracts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso.",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contrato.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractFormData) => {
    createMutation.mutate(data);
  };

  const calculateTotals = () => {
    const totalValue = parseFloat(form.watch("totalValue") || "0");
    const installments = form.watch("installments") || 1;
    const interestType = form.watch("interestType");
    const interestRate = parseFloat(form.watch("interestRate") || "0");
    const interestValue = parseFloat(form.watch("interestValue") || "0");

    let totalInterest = 0;
    let totalWithInterest = totalValue;

    if (interestType === "percentage" && interestRate > 0) {
      totalInterest = (totalValue * interestRate) / 100;
      totalWithInterest = totalValue + totalInterest;
    } else if (interestType === "fixed" && interestValue > 0) {
      totalInterest = interestValue;
      totalWithInterest = totalValue + interestValue;
    }

    const installmentValue = totalWithInterest / installments;

    return {
      totalInterest,
      totalWithInterest,
      installmentValue,
    };
  };

  const totals = calculateTotals();
  const isLoading = createMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Total (R$)</FormLabel>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Parcelas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="intervalDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Intervalo (dias)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção de Juros */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900">Configuração de Juros</h4>
          
          <FormField
            control={form.control}
            name="interestType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Juros</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <label htmlFor="percentage">Porcentagem (%)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed" id="fixed" />
                      <label htmlFor="fixed">Valor Fixo (R$)</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.watch("interestType") === "percentage" && (
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de Juros (%)</FormLabel>
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
            )}

            {form.watch("interestType") === "fixed" && (
              <FormField
                control={form.control}
                name="interestValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Juros (R$)</FormLabel>
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
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Início</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allowWeekendDue"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Permitir vencimento em fins de semana
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Digite observações sobre o contrato"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Resumo do Contrato com Cálculo em Tempo Real */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-3">Resumo do Contrato</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Valor principal:</span>
              <p className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(parseFloat(form.watch("totalValue") || "0"))}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total de juros:</span>
              <p className="font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totals.totalInterest)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Valor total com juros:</span>
              <p className="font-medium text-lg">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totals.totalWithInterest)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Valor por parcela:</span>
              <p className="font-medium text-lg">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(totals.installmentValue)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total de parcelas:</span>
              <p className="font-medium">{form.watch("installments")} parcelas</p>
            </div>
            {form.watch("interestType") === "percentage" && form.watch("interestRate") && (
              <div>
                <span className="text-gray-600">Taxa de juros:</span>
                <p className="font-medium">{form.watch("interestRate")}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Criando..." : "Criar Contrato"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
