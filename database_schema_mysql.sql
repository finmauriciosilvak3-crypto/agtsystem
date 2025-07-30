
-- Financial Management System Database Schema
-- MySQL Database Schema for Shared Hosting

-- Users table - Authentication and role management
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name TEXT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password TEXT NOT NULL,
    role ENUM('admin', 'collector') NOT NULL DEFAULT 'collector',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients table - Customer information
CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name TEXT NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contracts table - Financial agreements
CREATE TABLE contracts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    number INTEGER NOT NULL UNIQUE AUTO_INCREMENT,
    client_id VARCHAR(36) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    interest_type ENUM('percentage', 'fixed'),
    interest_rate DECIMAL(5,2),
    interest_value DECIMAL(10,2),
    installments INTEGER NOT NULL,
    interval_days INTEGER NOT NULL DEFAULT 30,
    start_date TIMESTAMP NOT NULL,
    allow_weekend_due BOOLEAN DEFAULT FALSE,
    observations TEXT,
    status ENUM('active', 'closed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL
);

-- Installments table - Individual payment schedules
CREATE TABLE installments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    contract_id VARCHAR(36) NOT NULL,
    number INTEGER NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    paid_value DECIMAL(10,2) DEFAULT 0,
    paid_date TIMESTAMP NULL,
    late_fee DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0
);

-- Expenses table - Cost tracking
CREATE TABLE expenses (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    date TIMESTAMP NOT NULL,
    description TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Amortizations table - Payment history tracking
CREATE TABLE amortizations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    contract_id VARCHAR(36) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    affected_installments TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL
);

-- Payments table - Individual payment records
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    installment_id VARCHAR(36) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL
);

-- Logs table - System activity auditing
CREATE TABLE logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    action TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(36),
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for express-session
CREATE TABLE sessions (
    session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
    expires INT(11) UNSIGNED NOT NULL,
    data MEDIUMTEXT COLLATE utf8mb4_bin,
    PRIMARY KEY (session_id)
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

-- Add foreign key constraints
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
