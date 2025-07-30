import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Receipt, DollarSign, MessageCircle } from "lucide-react";
import { type Contract, type Installment, type Client } from "@shared/schema";
import ContractForm from "@/components/forms/contract-form";

export default function Contracts() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: installments = [] } = useQuery<Installment[]>({
    queryKey: ["/api/contracts", selectedContract?.id, "installments"],
    enabled: !!selectedContract,
  });

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Cliente não encontrado";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="status-active">Ativo</Badge>;
      case "closed":
        return <Badge variant="secondary">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInstallmentStatusBadge = (installment: Installment) => {
    if (installment.paid) {
      return <Badge className="status-paid">Pago</Badge>;
    }
    
    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    
    if (dueDate < today) {
      return <Badge className="status-overdue">Vencida</Badge>;
    }
    
    return <Badge className="status-pending">Pendente</Badge>;
  };

  const sendWhatsAppMessage = (installment: Installment) => {
    const contract = selectedContract;
    if (!contract) return;

    const client = clients.find(c => c.id === contract.clientId);
    if (!client) return;

    const message = `Olá ${client.name}, você tem uma parcela de ${formatCurrency(installment.value)} com vencimento em ${formatDate(installment.dueDate)}. Por favor, entre em contato para regularizar sua situação.`;
    const encodedMessage = encodeURIComponent(message);
    const phone = client.phone.replace(/\D/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const calculateContractTotals = (contract: Contract) => {
    const contractInstallments = installments.filter(i => i.contractId === contract.id);
    const paidValue = contractInstallments.reduce((sum, i) => sum + parseFloat(i.paidValue || "0"), 0);
    const remainingValue = parseFloat(contract.totalValue) - paidValue;
    
    return { paidValue, remainingValue };
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-gray-600">Gerencie contratos e parcelas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Contrato</DialogTitle>
              </DialogHeader>
              <div className="max-h-[calc(90vh-100px)] overflow-y-auto pr-2">
                <ContractForm onSuccess={handleDialogClose} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedContract ? (
        // Contracts List
        <Card>
          <CardHeader>
            <CardTitle>Contratos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando contratos...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum contrato cadastrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Parcelas</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">#{contract.number}</TableCell>
                        <TableCell>{getClientName(contract.clientId)}</TableCell>
                        <TableCell>{formatCurrency(contract.totalValue)}</TableCell>
                        <TableCell>{contract.installments}x</TableCell>
                        <TableCell>{formatDate(contract.startDate)}</TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedContract(contract)}
                          >
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Contract Details
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setSelectedContract(null)}>
              ← Voltar
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Contrato #{selectedContract.number}
              </h2>
              <p className="text-gray-600">
                Cliente: {getClientName(selectedContract.clientId)}
              </p>
            </div>
            <div className="flex-1" />
            {getStatusBadge(selectedContract.status)}
          </div>

          {/* Contract Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">Valor Total</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(selectedContract.totalValue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">Valor Pago</div>
                <div className="text-2xl font-semibold text-green-600">
                  {formatCurrency(calculateContractTotals(selectedContract).paidValue.toString())}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-medium text-gray-500">Saldo Devedor</div>
                <div className="text-2xl font-semibold text-red-600">
                  {formatCurrency(calculateContractTotals(selectedContract).remainingValue.toString())}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Installments */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Parcelas</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Amortizar
                  </Button>
                  <Button variant="outline">
                    <Receipt className="mr-2 h-4 w-4" />
                    Gerar Recibo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell>{installment.number}/{selectedContract.installments}</TableCell>
                        <TableCell>{formatDate(installment.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(installment.value)}</TableCell>
                        <TableCell>{getInstallmentStatusBadge(installment)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!installment.paid && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {/* TODO: Payment modal */}}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendWhatsAppMessage(installment)}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {installment.paid && (
                              <Button size="sm" variant="outline">
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
