
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
    case 'test_db':
        testDatabaseConnection($input['config']);
        break;
    case 'install':
        installSystem($input['dbConfig'], $input['appConfig']);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

function testDatabaseConnection($config) {
    try {
        $dsn = "mysql:host={$config['dbHost']};port={$config['dbPort']};charset=utf8mb4";
        $pdo = new PDO($dsn, $config['dbUser'], $config['dbPassword']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Testa se o banco existe, se não existir, tenta criar
        try {
            $pdo->exec("USE `{$config['dbName']}`");
        } catch (PDOException $e) {
            $pdo->exec("CREATE DATABASE `{$config['dbName']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }
        
        echo json_encode(['success' => true, 'message' => 'Conexão estabelecida com sucesso']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function installSystem($dbConfig, $appConfig) {
    try {
        // 1. Conectar ao banco e executar o schema
        $dsn = "mysql:host={$dbConfig['dbHost']};port={$dbConfig['dbPort']};dbname={$dbConfig['dbName']};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbConfig['dbUser'], $dbConfig['dbPassword']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Executar schema do banco
        $schema = file_get_contents('../database_schema_mysql.sql');
        $statements = explode(';', $schema);
        
        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (!empty($statement)) {
                $pdo->exec($statement);
            }
        }
        
        // 2. Criar usuário administrador
        $hashedPassword = password_hash($appConfig['adminPassword'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin') ON DUPLICATE KEY UPDATE password = VALUES(password)");
        $stmt->execute(['Administrador', $appConfig['adminEmail'], $hashedPassword]);
        
        // 3. Criar arquivo de configuração do ambiente
        $envContent = createEnvFile($dbConfig, $appConfig);
        file_put_contents('../.env', $envContent);
        
        // 4. Criar arquivo de configuração do servidor
        $serverConfig = createServerConfig($dbConfig, $appConfig);
        file_put_contents('../server-config.js', $serverConfig);
        
        // 5. Criar package.json otimizado para hospedagem compartilhada
        $packageJson = createPackageJson();
        file_put_contents('../package-shared.json', $packageJson);
        
        echo json_encode(['success' => true, 'message' => 'Sistema instalado com sucesso']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function createEnvFile($dbConfig, $appConfig) {
    return "# Configurações do Sistema de Cobrança
NODE_ENV=production
PORT={$appConfig['appPort']}

# Configurações do Banco de Dados MySQL
DB_HOST={$dbConfig['dbHost']}
DB_PORT={$dbConfig['dbPort']}
DB_NAME={$dbConfig['dbName']}
DB_USER={$dbConfig['dbUser']}
DB_PASSWORD={$dbConfig['dbPassword']}

# Chave secreta para sessões
SESSION_SECRET={$appConfig['sessionSecret']}

# URL do banco para compatibilidade
DATABASE_URL=mysql://{$dbConfig['dbUser']}:{$dbConfig['dbPassword']}@{$dbConfig['dbHost']}:{$dbConfig['dbPort']}/{$dbConfig['dbName']}
";
}

function createServerConfig($dbConfig, $appConfig) {
    return "// Configuração do servidor para hospedagem compartilhada
const mysql = require('mysql2/promise');

const dbConfig = {
    host: '{$dbConfig['dbHost']}',
    port: {$dbConfig['dbPort']},
    user: '{$dbConfig['dbUser']}',
    password: '{$dbConfig['dbPassword']}',
    database: '{$dbConfig['dbName']}',
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = {
    dbConfig,
    pool,
    port: {$appConfig['appPort']}
};
";
}

function createPackageJson() {
    return '{
  "name": "sistema-cobranca",
  "version": "1.0.0",
  "type": "module",
  "main": "server-shared.js",
  "scripts": {
    "start": "node server-shared.js",
    "dev": "node server-shared.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "express-mysql-session": "^3.0.0",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "compression": "^1.7.4",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  }
}';
}
?>
