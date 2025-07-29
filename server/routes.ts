import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertClientSchema, insertContractSchema, insertExpenseSchema, publicConsultationSchema, type User } from "@shared/schema";
import { z } from "zod";

// Extend Express session to include user
declare module "express-session" {
  interface SessionData {
    user: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.user || req.session.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado - apenas administradores" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      req.session.user = user;
      
      await storage.createLog({
        userId: user.id,
        action: "login",
        description: `Login realizado por ${user.name}`,
      });

      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const user = req.session.user;
    
    await storage.createLog({
      userId: user.id,
      action: "logout",
      description: `Logout realizado por ${user.name}`,
    });

    req.session.destroy(() => {
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = req.session.user;
    res.json({ user: { ...user, password: undefined } });
  });

  // Users routes
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users.map(user => ({ ...user, password: undefined })));
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      await storage.createLog({
        userId: req.session.user.id,
        action: "create_user",
        entityType: "user",
        entityId: user.id,
        description: `Usuário ${user.name} criado`,
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      await storage.createLog({
        userId: req.session.user.id,
        action: "update_user",
        entityType: "user",
        entityId: user.id,
        description: `Usuário ${user.name} atualizado`,
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const success = await storage.deleteUser(req.params.id);
    
    if (!success) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await storage.createLog({
      userId: req.session.user.id,
      action: "delete_user",
      entityType: "user",
      entityId: req.params.id,
      description: `Usuário excluído`,
    });

    res.json({ message: "Usuário excluído com sucesso" });
  });

  // Clients routes
  app.get("/api/clients", requireAuth, async (req, res) => {
    const { search } = req.query;
    
    if (search) {
      const clients = await storage.searchClients(search as string);
      res.json(clients);
    } else {
      const clients = await storage.getClients();
      res.json(clients);
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      
      await storage.createLog({
        userId: req.session.user.id,
        action: "create_client",
        entityType: "client",
        entityId: client.id,
        description: `Cliente ${client.name} criado`,
      });

      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      await storage.createLog({
        userId: req.session.user.id,
        action: "update_client",
        entityType: "client",
        entityId: client.id,
        description: `Cliente ${client.name} atualizado`,
      });

      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    const success = await storage.deleteClient(req.params.id);
    
    if (!success) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    await storage.createLog({
      userId: req.session.user.id,
      action: "delete_client",
      entityType: "client",
      entityId: req.params.id,
      description: `Cliente excluído`,
    });

    res.json({ message: "Cliente excluído com sucesso" });
  });

  // Contracts routes
  app.get("/api/contracts", requireAuth, async (req, res) => {
    const contracts = await storage.getContracts();
    res.json(contracts);
  });

  app.get("/api/contracts/:id", requireAuth, async (req, res) => {
    const contract = await storage.getContract(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contrato não encontrado" });
    }
    res.json(contract);
  });

  app.get("/api/contracts/:id/installments", requireAuth, async (req, res) => {
    const installments = await storage.getInstallmentsByContract(req.params.id);
    res.json(installments);
  });

  app.post("/api/contracts", requireAuth, async (req, res) => {
    try {
      const contractData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract({
        ...contractData,
        createdBy: req.session.user.id,
      });

      // Create installments
      const installmentValue = parseFloat(contractData.totalValue) / contractData.installments;
      const startDate = new Date(contractData.startDate);

      for (let i = 1; i <= contractData.installments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + (i - 1) * contractData.intervalDays);

        await storage.createInstallment({
          contractId: contract.id,
          number: i,
          value: installmentValue.toFixed(2),
          dueDate,
        });
      }

      await storage.createLog({
        userId: req.session.user.id,
        action: "create_contract",
        entityType: "contract",
        entityId: contract.id,
        description: `Contrato #${contract.number} criado`,
      });

      res.json(contract);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    const { userId, startDate, endDate, description, minValue, maxValue } = req.query;
    const currentUser = req.session.user;

    const filters: any = {};

    // Role-based filtering
    if (currentUser.role === "collector") {
      filters.userId = currentUser.id;
    } else if (userId && userId !== "all") {
      filters.userId = userId as string;
    }

    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (description) filters.description = description as string;
    if (minValue) filters.minValue = parseFloat(minValue as string);
    if (maxValue) filters.maxValue = parseFloat(maxValue as string);

    const expenses = await storage.getExpensesByFilters(filters);
    res.json(expenses);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense({
        ...expenseData,
        userId: req.session.user.id,
      });

      await storage.createLog({
        userId: req.session.user.id,
        action: "create_expense",
        entityType: "expense",
        entityId: expense.id,
        description: `Despesa de R$ ${expense.value} criada`,
      });

      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }

      // Check permission - users can only edit their own expenses unless admin
      if (req.session.user.role !== "admin" && expense.userId !== req.session.user.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const expenseData = insertExpenseSchema.partial().parse(req.body);
      const updatedExpense = await storage.updateExpense(req.params.id, expenseData);

      await storage.createLog({
        userId: req.session.user.id,
        action: "update_expense",
        entityType: "expense",
        entityId: req.params.id,
        description: `Despesa atualizada`,
      });

      res.json(updatedExpense);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    const expense = await storage.getExpense(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Despesa não encontrada" });
    }

    // Check permission
    if (req.session.user.role !== "admin" && expense.userId !== req.session.user.id) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const success = await storage.deleteExpense(req.params.id);
    
    if (!success) {
      return res.status(404).json({ message: "Despesa não encontrada" });
    }

    await storage.createLog({
      userId: req.session.user.id,
      action: "delete_expense",
      entityType: "expense",
      entityId: req.params.id,
      description: `Despesa excluída`,
    });

    res.json({ message: "Despesa excluída com sucesso" });
  });

  // Collections routes
  app.get("/api/collections/today", requireAuth, async (req, res) => {
    const today = new Date();
    const installments = await storage.getDueInstallments(today);
    res.json(installments);
  });

  app.get("/api/collections/overdue", requireAuth, async (req, res) => {
    const installments = await storage.getOverdueInstallments();
    res.json(installments);
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    const contracts = await storage.getContracts();
    const expenses = await storage.getExpenses();
    const installments = await storage.getDueInstallments();
    const overdueInstallments = await storage.getOverdueInstallments();

    const openContracts = contracts.filter(c => c.status === "active").length;
    const totalInvested = contracts.reduce((sum, c) => sum + parseFloat(c.totalValue), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.value), 0);

    res.json({
      openContracts,
      totalInvested,
      totalExpenses,
      dueToday: installments.length,
      overdue: overdueInstallments.length,
    });
  });

  // Reports routes
  app.get("/api/reports", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate, period } = req.query;
      
      // Get basic data
      const contracts = await storage.getContracts();
      const expenses = await storage.getExpenses();
      const clients = await storage.getClients();
      const users = await storage.getUsers();
      
      // Calculate contracts report
      const activeContracts = contracts.filter(c => c.status === "active");
      const closedContracts = contracts.filter(c => c.status === "closed");
      const totalValue = contracts.reduce((sum, c) => sum + parseFloat(c.totalValue), 0);
      const averageValue = contracts.length > 0 ? totalValue / contracts.length : 0;

      // Calculate payments report
      const allInstallments = await Promise.all(
        contracts.map(c => storage.getInstallmentsByContract(c.id))
      );
      const installments = allInstallments.flat();
      const paidInstallments = installments.filter(i => i.paid);
      const overdueInstallments = installments.filter(i => !i.paid && new Date(i.dueDate) < new Date());
      
      const totalPaid = paidInstallments.reduce((sum, i) => sum + parseFloat(i.paidValue || "0"), 0);
      const totalPending = installments.filter(i => !i.paid).reduce((sum, i) => sum + parseFloat(i.value), 0);

      // Calculate expenses report
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.value), 0);
      const expensesByUser = users.map(user => {
        const userExpenses = expenses.filter(e => e.userId === user.id);
        return {
          userName: user.name,
          total: userExpenses.reduce((sum, e) => sum + parseFloat(e.value), 0),
          count: userExpenses.length
        };
      }).filter(u => u.count > 0);

      // Calculate client statistics
      const clientsWithActiveContracts = clients.filter(client => 
        activeContracts.some(contract => contract.clientId === client.id)
      ).length;
      
      const clientsWithOverdue = clients.filter(client => {
        const clientContracts = contracts.filter(c => c.clientId === client.id);
        return clientContracts.some(contract => {
          const contractInstallments = installments.filter(i => i.contractId === contract.id);
          return contractInstallments.some(i => !i.paid && new Date(i.dueDate) < new Date());
        });
      }).length;

      const reportData = {
        contractsReport: {
          total: contracts.length,
          active: activeContracts.length,
          closed: closedContracts.length,
          totalValue,
          averageValue
        },
        paymentsReport: {
          totalPaid,
          totalPending,
          onTimePayments: paidInstallments.length,
          latePayments: overdueInstallments.length
        },
        clientsReport: {
          total: clients.length,
          withActiveContracts: clientsWithActiveContracts,
          withOverduePayments: clientsWithOverdue
        },
        expensesReport: {
          total: totalExpenses,
          byUser: expensesByUser
        },
        monthlyData: [] // TODO: Implement monthly breakdown
      };

      res.json(reportData);
    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/reports/export", requireAuth, async (req, res) => {
    try {
      const { format = "json" } = req.query;
      
      // For now, return a simple message
      if (format === "pdf" || format === "xlsx") {
        res.json({ message: "Exportação em desenvolvimento" });
      } else {
        res.json({ message: "Formato não suportado" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao exportar relatório" });
    }
  });

  // Public consultation route (no auth required)
  app.post("/api/public/consultation", async (req, res) => {
    try {
      const { cpf, phone } = publicConsultationSchema.parse(req.body);
      
      const client = await storage.getClientByCpfAndPhone(cpf, phone);
      if (!client) {
        return res.json({ contracts: [] });
      }

      const contracts = await storage.getContractsByClient(client.id);
      const activeContracts = contracts.filter(c => c.status === "active");

      const contractsWithDetails = await Promise.all(
        activeContracts.map(async (contract) => {
          const installments = await storage.getInstallmentsByContract(contract.id);
          const paidValue = installments.reduce((sum, i) => sum + parseFloat(i.paidValue || "0"), 0);
          const remainingValue = parseFloat(contract.totalValue) - paidValue;
          
          return {
            ...contract,
            client,
            paidValue,
            remainingValue,
            installments: installments.filter(i => !i.paid),
          };
        })
      );

      res.json({ contracts: contractsWithDetails });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
