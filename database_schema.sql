
-- Financial Management System Database Schema
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "gen_random_uuid";

-- Users table - Authentication and role management
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'collector', -- 'admin' or 'collector'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Clients table - Customer information
CREATE TABLE clients (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contracts table - Financial agreements
CREATE TABLE contracts (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL UNIQUE,
    client_id VARCHAR NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    interest_type TEXT, -- 'percentage' or 'fixed'
    interest_rate DECIMAL(5,2),
    interest_value DECIMAL(10,2),
    installments INTEGER NOT NULL,
    interval_days INTEGER NOT NULL DEFAULT 30,
    start_date TIMESTAMP NOT NULL,
    allow_weekend_due BOOLEAN DEFAULT FALSE,
    observations TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'closed'
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL
);

-- Installments table - Individual payment schedules
CREATE TABLE installments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    number INTEGER NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_value DECIMAL(10,2) DEFAULT 0,
    paid_date TIMESTAMP,
    late_fee DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0
);

-- Expenses table - Cost tracking
CREATE TABLE expenses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Amortizations table - Payment history tracking
CREATE TABLE amortizations (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id VARCHAR NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    affected_installments TEXT, -- JSON array of installment IDs
    date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL
);

-- Payments table - Individual payment records
CREATE TABLE payments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id VARCHAR NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR NOT NULL
);

-- Logs table - System activity auditing
CREATE TABLE logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id VARCHAR,
    description TEXT,
    date TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);

CREATE INDEX idx_installments_contract_id ON installments(contract_id);
CREATE INDEX idx_installments_due_date ON installments(due_date);
CREATE INDEX idx_installments_paid ON installments(paid);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);

CREATE INDEX idx_amortizations_contract_id ON amortizations(contract_id);
CREATE INDEX idx_amortizations_created_by ON amortizations(created_by);

CREATE INDEX idx_payments_installment_id ON payments(installment_id);
CREATE INDEX idx_payments_created_by ON payments(created_by);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_date ON logs(date);
CREATE INDEX idx_logs_entity_type ON logs(entity_type);

-- Add foreign key constraints (optional, but recommended)
ALTER TABLE contracts ADD CONSTRAINT fk_contracts_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE contracts ADD CONSTRAINT fk_contracts_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE installments ADD CONSTRAINT fk_installments_contract_id 
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE amortizations ADD CONSTRAINT fk_amortizations_contract_id 
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

ALTER TABLE amortizations ADD CONSTRAINT fk_amortizations_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_installment_id 
    FOREIGN KEY (installment_id) REFERENCES installments(id) ON DELETE CASCADE;

ALTER TABLE payments ADD CONSTRAINT fk_payments_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE logs ADD CONSTRAINT fk_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Insert sample admin user (password should be hashed in production)
INSERT INTO users (name, email, password, role) VALUES 
('Administrador', 'admin@sistema.com', 'admin123', 'admin');

-- Insert sample collector user
INSERT INTO users (name, email, password, role) VALUES 
('Cobrador', 'cobrador@sistema.com', 'cobrador123', 'collector');

-- Sample client data
INSERT INTO clients (name, cpf, phone, email, city, address) VALUES 
('João Silva', '12345678901', '11999999999', 'joao@email.com', 'São Paulo', 'Rua das Flores, 123'),
('Maria Santos', '98765432100', '11888888888', 'maria@email.com', 'Rio de Janeiro', 'Av. Copacabana, 456');

-- Note: Contract numbers should be auto-generated in sequence
-- This is just sample data
INSERT INTO contracts (number, client_id, total_value, installments, start_date, created_by) 
SELECT 
    1,
    c.id,
    1000.00,
    10,
    NOW(),
    u.id
FROM clients c, users u 
WHERE c.cpf = '12345678901' AND u.email = 'admin@sistema.com'
LIMIT 1;

-- Sample expense data
INSERT INTO expenses (user_id, date, description, value)
SELECT 
    u.id,
    NOW(),
    'Gasolina',
    50.00
FROM users u 
WHERE u.email = 'cobrador@sistema.com'
LIMIT 1;
