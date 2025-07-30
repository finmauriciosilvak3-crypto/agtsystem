import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, CreditCard, Building, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { type Contract, type Client, type Installment } from "@shared/schema";

interface ContractWithDetails extends Omit<Contract, 'installments'> {
  client: Client;
  paidValue: number;
  remainingValue: number;
  installments: Installment[];
}

interface ConsultationResult {
  contracts: ContractWithDetails[];
}

export default function PublicConsultation() {
  const [, setLocation] = useLocation();
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [searchResults, setSearchResults] = useState<ContractWithDetails[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const searchMutation = useMutation({
    mutationFn: async (data: { cpf: string; phone: string }) => {
      const response = await apiRequest("POST", "/api/public/consultation", data);
      return response.json() as Promise<ConsultationResult>;
    },
    onSuccess: (data) => {
      setSearchResults(data.contracts);
      setHasSearched(true);
    },
    onError: () => {
      setSearchResults([]);
      setHasSearched(true);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11 || cleanPhone.length < 10) {
      return;
    }

    searchMutation.mutate({
      cpf: cleanCpf,
      phone: cleanPhone,
    });
  };

  const handlePayment = (contract: ContractWithDetails) => {
    setSelectedContract(contract);
    setPaymentAmount("");
    setIsPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!selectedContract || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) return;

    const message = `Olá, gostaria de negociar o contrato nº ${selectedContract.number}. O valor total da dívida é de ${formatCurrency(selectedContract.remainingValue)}. Desejo pagar agora ${formatCurrency(amount)}.`;
    
    const encodedMessage = encodeURIComponent(message);
    // Using a default WhatsApp number - in production this should come from configuration
    const companyWhatsApp = '5511999999999';
    const whatsappUrl = `https://wa.me/${companyWhatsApp}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    setIsPaymentModalOpen(false);
    setSelectedContract(null);
    setPaymentAmount("");
  };

  const getStatusBadge = (contract: ContractWithDetails) => {
    if (contract.remainingValue <= 0) {
      return <Badge className="status-paid">Quitado</Badge>;
    }
    
    const hasOverdue = contract.installments.some(i => {
      const dueDate = new Date(i.dueDate);
      const today = new Date();
      return dueDate < today;
    });

    if (hasOverdue) {
      return <Badge className="status-overdue">Pendente</Badge>;
    }

    return <Badge className="status-active">Em Dia</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Building className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Consulta de Dívidas</h1>
          <p className="mt-2 text-gray-600">Consulte seus contratos em aberto</p>
          
          <Button
            variant="link"
            className="mt-4"
            onClick={() => setLocation("/login")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o sistema
          </Button>
        </div>

        {/* Search Form */}
        <Card className="shadow-lg mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={searchMutation.isPending}
                >
                  {searchMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Consultar Dívidas
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Contratos Encontrados</CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    Nenhum contrato encontrado para os dados informados.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((contract) => (
                    <div key={contract.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Contrato #{contract.number}
                          </h4>
                          <p className="text-gray-600">{contract.client.name}</p>
                        </div>
                        {getStatusBadge(contract)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-500">Valor Total:</span>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(parseFloat(contract.totalValue))}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Valor Pago:</span>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(contract.paidValue)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Saldo Devedor:</span>
                          <p className="font-semibold text-red-600">
                            {formatCurrency(contract.remainingValue)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Data de criação: {formatDate(contract.createdAt)}
                        </div>
                        {contract.remainingValue > 0 && (
                          <Button
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handlePayment(contract)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CreditCard className="text-green-600 h-6 w-6" />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Contrato #{selectedContract?.number}<br />
                  Valor total da dívida: {selectedContract && formatCurrency(selectedContract.remainingValue)}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentAmount">Qual valor deseja pagar agora?</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={processPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  Confirmar Pagamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
