import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").notNull().default("collector"), // "admin" or "collector"
  createdAt: timestamp("created_at").defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cpf: text("cpf").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email"),
  city: text("city"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: integer("number").notNull().unique(),
  clientId: varchar("client_id").notNull(),
  totalValue: decimal("total_value", { precision: 10, scale: 2 }).notNull(),
  interestType: text("interest_type"), // "percentage" or "fixed"
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  interestValue: decimal("interest_value", { precision: 10, scale: 2 }),
  installments: integer("installments").notNull(),
  intervalDays: integer("interval_days").notNull().default(30),
  startDate: timestamp("start_date").notNull(),
  allowWeekendDue: boolean("allow_weekend_due").default(false),
  observations: text("observations"),
  status: text("status").notNull().default("active"), // "active" or "closed"
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const installments = pgTable("installments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  number: integer("number").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  paid: boolean("paid").default(false),
  paidValue: decimal("paid_value", { precision: 10, scale: 2 }).default("0"),
  paidDate: timestamp("paid_date"),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default("0"),
  expenses: decimal("expenses", { precision: 10, scale: 2 }).default("0"),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const amortizations = pgTable("amortizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  affectedInstallments: text("affected_installments"), // JSON array of installment IDs
  date: timestamp("date").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  installmentId: varchar("installment_id").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const logs = pgTable("logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: varchar("entity_id"),
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  number: true,
  createdAt: true,
  createdBy: true,
  status: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertInstallmentSchema = createInsertSchema(installments).omit({
  id: true,
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().min(1, "Email/telefone é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const publicConsultationSchema = z.object({
  cpf: z.string().min(11, "CPF é obrigatório"),
  phone: z.string().min(10, "Telefone é obrigatório"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = z.infer<typeof insertInstallmentSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Amortization = typeof amortizations.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type PublicConsultationData = z.infer<typeof publicConsultationSchema>;
