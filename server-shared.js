
import express from 'express';
import session from 'express-session';
import MySQLStore from 'express-mysql-session';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitar para desenvolvimento
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do banco de dados MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Pool de conexões MySQL
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Configuração de sessão com MySQL
const MySQLStoreSession = MySQLStore(session);
const sessionStore = new MySQLStoreSession({
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000
}, pool);

app.use(session({
    key: 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'financial-system-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true'
    }
}));

// Servir arquivos estáticos
app.use(express.static(join(__dirname, 'dist/public')));

// Middleware de autenticação
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ message: 'Não autorizado' });
    }
}

// Rotas de autenticação
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        
        const user = rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        res.json({ user: req.session.user });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao fazer logout' });
        }
        res.clearCookie('session_cookie_name');
        res.json({ message: 'Logout realizado com sucesso' });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'Não autorizado' });
    }
});

// Rotas do dashboard
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        // Contratos abertos
        const [contractsResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM contracts WHERE status = "active"'
        );
        
        // Total investido
        const [investedResult] = await pool.execute(
            'SELECT COALESCE(SUM(total_value), 0) as total FROM contracts WHERE status = "active"'
        );
        
        // Total a receber
        const [receivableResult] = await pool.execute(
            'SELECT COALESCE(SUM(value), 0) as total FROM installments WHERE paid = false'
        );
        
        // Vencimentos hoje
        const [todayResult] = await pool.execute(
            'SELECT COUNT(*) as count FROM installments WHERE DATE(due_date) = CURDATE() AND paid = false'
        );
        
        res.json({
            openContracts: contractsResult[0].count,
            totalInvested: parseFloat(investedResult[0].total),
            totalReceivable: parseFloat(receivableResult[0].total),
            duesToday: todayResult[0].count
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rotas de clientes
app.get('/api/clients', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM clients ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/api/clients', requireAuth, async (req, res) => {
    try {
        const { name, cpf, phone, email, city, address } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO clients (id, name, cpf, phone, email, city, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), name, cpf, phone, email, city, address]
        );
        
        res.status(201).json({ message: 'Cliente criado com sucesso' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'CPF já cadastrado' });
        }
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rotas de contratos
app.get('/api/contracts', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.*, cl.name as client_name, cl.cpf as client_cpf
            FROM contracts c
            JOIN clients cl ON c.client_id = cl.id
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar contratos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rotas de prestações
app.get('/api/collections/installments', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT i.*, c.number as contract_number, cl.name as client_name, cl.phone as client_phone
            FROM installments i
            JOIN contracts c ON i.contract_id = c.id
            JOIN clients cl ON c.client_id = cl.id
            WHERE i.paid = false
            ORDER BY i.due_date ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar prestações:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rotas de despesas
app.get('/api/expenses', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT e.*, u.name as user_name
            FROM expenses e
            JOIN users u ON e.user_id = u.id
            ORDER BY e.date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar despesas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/api/expenses', requireAuth, async (req, res) => {
    try {
        const { date, description, value } = req.body;
        
        await pool.execute(
            'INSERT INTO expenses (id, user_id, date, description, value) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), req.session.user.id, date, description, value]
        );
        
        res.status(201).json({ message: 'Despesa criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar despesa:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Consulta pública
app.post('/api/public/consultation', async (req, res) => {
    try {
        const { cpf, phone } = req.body;
        
        const [rows] = await pool.execute(`
            SELECT c.number as contract_number, i.number as installment_number, 
                   i.value, i.due_date, i.paid
            FROM installments i
            JOIN contracts c ON i.contract_id = c.id
            JOIN clients cl ON c.client_id = cl.id
            WHERE cl.cpf = ? AND cl.phone = ?
            ORDER BY i.due_date DESC
        `, [cpf, phone]);
        
        res.json(rows);
    } catch (error) {
        console.error('Erro na consulta pública:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist/public/index.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Encerrando servidor...');
    await pool.end();
    process.exit(0);
});
