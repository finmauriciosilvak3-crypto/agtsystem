import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageCircle, Search, Calendar, Filter, DollarSign, Clock } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Installment, type Contract, type Client } from "@shared/schema";

interface InstallmentWithDetails extends Installment {
  contract: Contract;
  client: Client;
}

export default function Collections() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, due, overdue
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentWithDetails | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentValue, setPaymentValue] = useState("");

  const { data: installments = [], isLoading } = useQuery<InstallmentWithDetails[]>({
    queryKey: ["/api/collections/installments"],
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { installmentId: string; value: string }) => {
      await apiRequest("POST", `/api/installments/${data.installmentId}/pay`, { value: data.value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections/installments"] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
      setIsPaymentModalOpen(false);
      setSelectedInstallment(null);
      setPaymentValue("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    },
  });

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = 
      installment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installment.client.cpf.includes(searchTerm) ||
      installment.client.phone.includes(searchTerm) ||
      installment.contract.number.toString().includes(searchTerm);

    if (filterType === "due") {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return matchesSearch && !installment.paid && installment.dueDate <= today;
    }

    if (filterType === "overdue") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return matchesSearch && !installment.paid && installment.dueDate < today;
    }

    return matchesSearch;
  });

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (installment: InstallmentWithDetails) => {
    if (installment.paid) {
      return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
    }

    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    
    if (dueDate < today) {
      return <Badge variant="destructive">Em Atraso</Badge>;
    } else if (dueDate.toDateString() === today.toDateString()) {
      return <Badge className="bg-yellow-100 text-yellow-800">Vence Hoje</Badge>;
    } else {
      return <Badge variant="secondary">A Vencer</Badge>;
    }
  };

  const getDaysOverdue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleWhatsAppContact = (installment: InstallmentWithDetails) => {
    const daysOverdue = getDaysOverdue(installment.dueDate);
    const phone = installment.client.phone.replace(/\D/g, '');
    
    let message;
    if (installment.paid) {
      message = `Olá ${installment.client.name}! Confirmamos o pagamento da parcela ${installment.number}/${installment.contract.installments} do contrato ${installment.contract.number}. Obrigado!`;
    } else if (daysOverdue > 0) {
      message = `Olá ${installment.client.name}! A parcela ${installment.number}/${installment.contract.installments} do contrato ${installment.contract.number} no valor de ${formatCurrency(installment.value)} está em atraso há ${daysOverdue} dias. Por favor, entre em contato para regularizar.`;
    } else {
      message = `Olá ${installment.client.name}! Lembramos que a parcela ${installment.number}/${installment.contract.installments} do contrato ${installment.contract.number} no valor de ${formatCurrency(installment.value)} vence em ${formatDate(installment.dueDate)}. Entre em contato para mais informações.`;
    }

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePayment = (installment: InstallmentWithDetails) => {
    setSelectedInstallment(installment);
    setPaymentValue(installment.value);
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!selectedInstallment || !paymentValue) return;

    paymentMutation.mutate({
      installmentId: selectedInstallment.id,
      value: paymentValue,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando cobranças...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cobrança</h1>
        <p className="text-gray-600">Gerencie cobranças e parcelas em aberto</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vencendo Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {installments.filter(i => !i.paid && new Date(i.dueDate).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {installments.filter(i => !i.paid && new Date(i.dueDate) < new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor em Atraso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    installments
                      .filter(i => !i.paid && new Date(i.dueDate) < new Date())
                      .reduce((sum, i) => sum + parseFloat(i.value), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Parcelas</p>
                <p className="text-2xl font-bold text-gray-900">{installments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, CPF, telefone ou contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
              >
                Todas
              </Button>
              <Button
                variant={filterType === "due" ? "default" : "outline"}
                onClick={() => setFilterType("due")}
              >
                A Vencer
              </Button>
              <Button
                variant={filterType === "overdue" ? "default" : "outline"}
                onClick={() => setFilterType("overdue")}
              >
                Em Atraso
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Parcelas ({filteredInstallments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallments.map((installment) => (
                  <TableRow key={installment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{installment.client.name}</p>
                        <p className="text-sm text-gray-500">{installment.client.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>#{installment.contract.number}</TableCell>
                    <TableCell>
                      {installment.number}/{installment.contract.installments}
                    </TableCell>
                    <TableCell>{formatCurrency(installment.value)}</TableCell>
                    <TableCell>{formatDate(installment.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(installment)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWhatsAppContact(installment)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {!installment.paid && (
                          <Button
                            size="sm"
                            onClick={() => handlePayment(installment)}
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInstallments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhuma parcela encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedInstallment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Detalhes da Parcela</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <p className="font-medium">{selectedInstallment.client.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Contrato:</span>
                    <p className="font-medium">#{selectedInstallment.contract.number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Parcela:</span>
                    <p className="font-medium">
                      {selectedInstallment.number}/{selectedInstallment.contract.installments}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <p className="font-medium">{formatDate(selectedInstallment.dueDate)}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="paymentValue" className="block text-sm font-medium text-gray-700 mb-1">
                Valor do Pagamento (R$)
              </label>
              <Input
                id="paymentValue"
                type="number"
                step="0.01"
                value={paymentValue}
                onChange={(e) => setPaymentValue(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={processPayment}
                disabled={paymentMutation.isPending || !paymentValue}
              >
                {paymentMutation.isPending ? "Registrando..." : "Registrar Pagamento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}