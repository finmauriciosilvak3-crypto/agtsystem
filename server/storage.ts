import { type User, type InsertUser, type Client, type InsertClient, type Contract, type InsertContract, type Expense, type InsertExpense, type Installment, type InsertInstallment, type Amortization, type Payment, type Log } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;

  // Clients
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  getClients(): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  getClientByCpfAndPhone(cpf: string, phone: string): Promise<Client | undefined>;

  // Contracts
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract & { createdBy: string }): Promise<Contract>;
  updateContract(id: string, contract: Partial<Contract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;
  getContracts(): Promise<Contract[]>;
  getContractsByClient(clientId: string): Promise<Contract[]>;
  getNextContractNumber(): Promise<number>;

  // Installments
  getInstallment(id: string): Promise<Installment | undefined>;
  createInstallment(installment: InsertInstallment): Promise<Installment>;
  updateInstallment(id: string, installment: Partial<Installment>): Promise<Installment | undefined>;
  getInstallmentsByContract(contractId: string): Promise<Installment[]>;
  getDueInstallments(date?: Date): Promise<Installment[]>;
  getOverdueInstallments(): Promise<Installment[]>;

  // Expenses
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense & { userId: string }): Promise<Expense>;
  updateExpense(id: string, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  getExpenses(): Promise<Expense[]>;
  getExpensesByUser(userId: string): Promise<Expense[]>;
  getExpensesByFilters(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
    minValue?: number;
    maxValue?: number;
  }): Promise<Expense[]>;

  // Payments
  createPayment(payment: { installmentId: string; value: string; createdBy: string }): Promise<Payment>;
  getPaymentsByInstallment(installmentId: string): Promise<Payment[]>;

  // Amortizations
  createAmortization(amortization: { contractId: string; value: string; affectedInstallments?: string; createdBy: string }): Promise<Amortization>;
  getAmortizationsByContract(contractId: string): Promise<Amortization[]>;

  // Logs
  createLog(log: { userId: string; action: string; entityType?: string; entityId?: string; description?: string }): Promise<Log>;
  getLogs(): Promise<Log[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private clients: Map<string, Client> = new Map();
  private contracts: Map<string, Contract> = new Map();
  private installments: Map<string, Installment> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private payments: Map<string, Payment> = new Map();
  private amortizations: Map<string, Amortization> = new Map();
  private logs: Map<string, Log> = new Map();
  private contractCounter = 1;

  constructor() {
    // Initialize with default admin user
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const adminId = randomUUID();
    const defaultAdmin: User = {
      id: adminId,
      name: "Maurício Silva",
      email: "admin@sistema.com",
      phone: "(11) 99999-9999",
      password: "admin123", // In production, this should be hashed
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminId, defaultAdmin);

    const collectorId = randomUUID();
    const defaultCollector: User = {
      id: collectorId,
      name: "Ana Costa",
      email: "cobrador@sistema.com",
      phone: "(11) 88888-8888",
      password: "cobrador123",
      role: "collector",
      createdAt: new Date(),
    };
    this.users.set(collectorId, defaultCollector);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      role: insertUser.role ?? "collector",
      phone: insertUser.phone ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Clients
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...insertClient,
      id,
      createdAt: new Date(),
      address: insertClient.address ?? null,
      email: insertClient.email ?? null,
      city: insertClient.city ?? null,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, client: Partial<Client>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...client };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async searchClients(query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.clients.values()).filter(client =>
      client.name.toLowerCase().includes(lowerQuery) ||
      client.cpf.includes(query) ||
      client.phone.includes(query)
    );
  }

  async getClientByCpfAndPhone(cpf: string, phone: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(client =>
      client.cpf === cpf && client.phone === phone
    );
  }

  // Contracts
  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract & { createdBy: string }): Promise<Contract> {
    const id = randomUUID();
    const number = this.contractCounter++;
    const contract: Contract = {
      ...insertContract,
      id,
      number,
      status: "active",
      createdAt: new Date(),
      interestRate: insertContract.interestRate ?? null,
      interestValue: insertContract.interestValue ?? null,
      allowWeekendDue: insertContract.allowWeekendDue ?? null,
      observations: insertContract.observations ?? null,
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: string, contract: Partial<Contract>): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...contract };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<boolean> {
    return this.contracts.delete(id);
  }

  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContractsByClient(clientId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.clientId === clientId);
  }

  async getNextContractNumber(): Promise<number> {
    return this.contractCounter;
  }

  // Installments
  async getInstallment(id: string): Promise<Installment | undefined> {
    return this.installments.get(id);
  }

  async createInstallment(insertInstallment: InsertInstallment): Promise<Installment> {
    const id = randomUUID();
    const installment: Installment = {
      ...insertInstallment,
      id,
      paid: false,
      paidValue: null,
      paidDate: null,
      lateFee: null,
      expenses: null,
    };
    this.installments.set(id, installment);
    return installment;
  }

  async updateInstallment(id: string, installment: Partial<Installment>): Promise<Installment | undefined> {
    const existing = this.installments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...installment };
    this.installments.set(id, updated);
    return updated;
  }

  async getInstallmentsByContract(contractId: string): Promise<Installment[]> {
    return Array.from(this.installments.values())
      .filter(installment => installment.contractId === contractId)
      .sort((a, b) => a.number - b.number);
  }

  async getDueInstallments(date: Date = new Date()): Promise<Installment[]> {
    const today = new Date(date);
    today.setHours(23, 59, 59, 999);
    
    return Array.from(this.installments.values()).filter(installment =>
      !installment.paid && installment.dueDate <= today
    );
  }

  async getOverdueInstallments(): Promise<Installment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.installments.values()).filter(installment =>
      !installment.paid && installment.dueDate < today
    );
  }

  // Expenses
  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense & { userId: string }): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...expense };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpensesByUser(userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
  }

  async getExpensesByFilters(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
    minValue?: number;
    maxValue?: number;
  }): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => {
      if (filters.userId && expense.userId !== filters.userId) return false;
      if (filters.startDate && expense.date < filters.startDate) return false;
      if (filters.endDate && expense.date > filters.endDate) return false;
      if (filters.description && !expense.description.toLowerCase().includes(filters.description.toLowerCase())) return false;
      if (filters.minValue && parseFloat(expense.value) < filters.minValue) return false;
      if (filters.maxValue && parseFloat(expense.value) > filters.maxValue) return false;
      return true;
    });
  }

  // Payments
  async createPayment(payment: { installmentId: string; value: string; createdBy: string }): Promise<Payment> {
    const id = randomUUID();
    const newPayment: Payment = {
      id,
      ...payment,
      date: new Date(),
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async getPaymentsByInstallment(installmentId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.installmentId === installmentId);
  }

  // Amortizations
  async createAmortization(amortization: { contractId: string; value: string; affectedInstallments?: string; createdBy: string }): Promise<Amortization> {
    const id = randomUUID();
    const newAmortization: Amortization = {
      id,
      ...amortization,
      date: new Date(),
      affectedInstallments: amortization.affectedInstallments ?? null,
    };
    this.amortizations.set(id, newAmortization);
    return newAmortization;
  }

  async getAmortizationsByContract(contractId: string): Promise<Amortization[]> {
    return Array.from(this.amortizations.values()).filter(amortization => amortization.contractId === contractId);
  }

  // Logs
  async createLog(log: { userId: string; action: string; entityType?: string; entityId?: string; description?: string }): Promise<Log> {
    const id = randomUUID();
    const newLog: Log = {
      id,
      ...log,
      date: new Date(),
      entityType: log.entityType ?? null,
      entityId: log.entityId ?? null,
      description: log.description ?? null,
    };
    this.logs.set(id, newLog);
    return newLog;
  }

  async getLogs(): Promise<Log[]> {
    return Array.from(this.logs.values()).sort((a, b) => {
      const aTime = a.date ? a.date.getTime() : 0;
      const bTime = b.date ? b.date.getTime() : 0;
      return bTime - aTime;
    });
  }
}

export const storage = new MemStorage();
