import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    if (success) {
      setLocation("/dashboard");
    }

    setIsLoading(false);
  };

  const handleCollectorAccess = () => {
    setEmail("cobrador@sistema.com");
    setPassword("cobrador123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Calculator className="text-white h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Sistema Financeiro</h2>
          <p className="mt-2 text-sm text-gray-600">Faça login para acessar o sistema</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail ou Telefone</Label>
                  <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail ou telefone"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm">
                    Lembrar-me
                  </Label>
                </div>
                <Button variant="link" className="text-sm p-0">
                  Esqueceu a senha?
                </Button>
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm"
                  onClick={handleCollectorAccess}
                >
                  Acessar como Cobrador
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            className="text-sm"
            onClick={() => setLocation("/consulta-divida")}
          >
            Consultar Dívidas (Área Pública)
          </Button>
        </div>
      </div>
    </div>
  );
}
