
# Manual de Instalação - Sistema de Cobrança

## Requisitos do Sistema

### Hospedagem Compartilhada
- **Node.js**: Versão 16 ou superior
- **MySQL**: Versão 5.7 ou superior
- **PHP**: Versão 7.4 ou superior (apenas para instalação)
- **Espaço em disco**: Mínimo 100MB
- **Memória RAM**: Mínimo 512MB

### Versões Testadas
- Node.js 18.x
- MySQL 8.0
- PHP 8.1

## Processo de Instalação

### Passo 1: Upload dos Arquivos

1. **Baixe todos os arquivos** do sistema para seu computador
2. **Faça upload** de todos os arquivos para a pasta raiz do seu domínio/subdomínio
3. **Certifique-se** de que a estrutura de pastas foi mantida

### Passo 2: Configuração do Node.js

1. **Acesse o painel de controle** da sua hospedagem
2. **Procure pela seção Node.js** (pode estar em "Software" ou "Configurações Avançadas")
3. **Ative o Node.js** para o seu domínio
4. **Selecione a versão 18.x** (ou a mais recente disponível)
5. **Defina o arquivo de inicialização** como `server-shared.js`

### Passo 3: Configuração do Banco de Dados

1. **Acesse o MySQL** no painel de controle da hospedagem
2. **Crie um novo banco de dados** (ex: `sistema_cobranca`)
3. **Crie um usuário** para o banco com todas as permissões
4. **Anote as informações**:
   - Nome do banco
   - Usuário
   - Senha
   - Host (geralmente `localhost`)
   - Porta (geralmente `3306`)

### Passo 4: Execução do Instalador

1. **Acesse** `https://seudominio.com/installer/`
2. **Siga os 4 passos** do assistente de instalação:

#### Passo 1: Verificação do Sistema
- O sistema verifica automaticamente os requisitos
- Aguarde a confirmação e clique em "Continuar"

#### Passo 2: Configuração do Banco de Dados
- **Host**: `localhost` (ou conforme informado pela hospedagem)
- **Porta**: `3306` (padrão MySQL)
- **Nome do Banco**: Nome criado no Passo 3
- **Usuário**: Usuário criado no Passo 3
- **Senha**: Senha do usuário do banco
- Clique em "Testar Conexão"
- Se bem-sucedido, clique em "Continuar"

#### Passo 3: Configuração da Aplicação
- **Porta**: Use a porta fornecida pela hospedagem (ex: 3000)
- **Chave Secreta**: Clique em "Gerar Automaticamente"
- **Email do Admin**: Seu email para acesso administrativo
- **Senha do Admin**: Senha segura para o administrador
- Clique em "Instalar Sistema"

#### Passo 4: Finalização
- **Aguarde** a conclusão da instalação
- **Remova a pasta installer** do servidor por segurança
- Clique em "Acessar o Sistema"

### Passo 5: Configuração Final no Painel da Hospedagem

1. **Acesse as configurações do Node.js** no painel
2. **Instale as dependências** executando:
   ```bash
   npm install
   ```
3. **Inicie a aplicação** executando:
   ```bash
   npm start
   ```
4. **Configure para iniciar automaticamente** (se disponível na hospedagem)

## Configurações de Servidor Web

### Apache (.htaccess)

Crie um arquivo `.htaccess` na raiz com o conteúdo:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Nginx

Se sua hospedagem usar Nginx, configure o proxy reverso:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## Configurações Importantes

### Variáveis de Ambiente

O arquivo `.env` é criado automaticamente durante a instalação com:

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_cobranca
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
SESSION_SECRET=chave_gerada_automaticamente
```

### Segurança

1. **Remova a pasta installer** após a instalação
2. **Use HTTPS** sempre que possível
3. **Mantenha senhas seguras**
4. **Faça backups regulares** do banco de dados

### Performance

1. **Configure cache** no servidor web
2. **Use compressão gzip**
3. **Otimize imagens** se houver uploads
4. **Configure logs** adequadamente

## Solução de Problemas

### Erro de Conexão com Banco

1. Verifique as credenciais no arquivo `.env`
2. Confirme se o banco de dados existe
3. Teste a conexão manual via phpMyAdmin

### Aplicação Não Inicia

1. Verifique se o Node.js está ativo
2. Confirme se as dependências foram instaladas
3. Verifique os logs de erro no painel

### Erro 502 Bad Gateway

1. Confirme se a aplicação Node.js está rodando
2. Verifique a configuração do proxy reverso
3. Teste a porta de conexão

### Permissões de Arquivo

```bash
chmod 755 pasta/
chmod 644 arquivo.js
```

## Manutenção

### Backup do Banco de Dados

Execute regularmente:

```sql
mysqldump -u usuario -p sistema_cobranca > backup.sql
```

### Atualização do Sistema

1. Faça backup completo
2. Substitua os arquivos (exceto `.env`)
3. Execute migrações se necessário
4. Reinicie a aplicação

### Logs

Monitore os logs em:
- Logs do Node.js no painel da hospedagem
- Logs de erro do MySQL
- Logs do servidor web

## Suporte

Para suporte técnico:

1. **Verifique este manual** primeiro
2. **Consulte os logs** para identificar erros
3. **Teste em ambiente local** se possível
4. **Documente o erro** com detalhes

## Configurações Opcionais

### SSL/HTTPS

Configure o certificado SSL no painel da hospedagem e ajuste:

```env
HTTPS=true
```

### Email (futuro)

Para funcionalidades de email, adicione:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
```

### Timezone

Configure o timezone no banco:

```sql
SET time_zone = '-03:00';
```

---

**Importante**: Sempre teste em um ambiente de desenvolvimento antes de aplicar em produção.
