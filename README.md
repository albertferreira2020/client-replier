# Client Replier

WebSocket client que se conecta ao SQL Server e executa queries através de mensagens WebSocket.

## Funcionalidades

- ✅ Conexão WebSocket com autenticação via API Key
- ✅ Conexão ao SQL Server com suporte a criptografia
- ✅ Execução de queries SQL via WebSocket
- ✅ Tratamento de erros e cleanup automático
- ✅ Logs coloridos para melhor visualização

## Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
# Configurações do SQL Server
SQL_SERVER=your-sql-server.database.windows.net
SQL_DATABASE=your-database-name
SQL_USER=your-username
SQL_PASSWORD=your-password
SQL_ENCRYPT=true
SQL_TRUST_CERT=false

# Configurações do WebSocket
WEBSOCKET_URL=wss://your-websocket-server.com
API_KEY=your-api-key
```

## Instalação

```bash
npm install
```

## Execução

### Modo de produção:
```bash
npm start
```

### Modo de desenvolvimento (com watch):
```bash
npm run dev
```

## Protocolo de Comunicação

### Autenticação
O cliente envia:
```json
{
  "type": "auth",
  "apiKey": "your-api-key"
}
```

### Resposta de autenticação bem-sucedida:
```json
{
  "type": "auth_success"
}
```

### Resposta de falha na autenticação:
```json
{
  "type": "auth_failed",
  "message": "Invalid API key"
}
```

### Solicitação de query:
```json
{
  "type": "query_request",
  "requestId": "unique-request-id",
  "query": "SELECT * FROM Users"
}
```

### Resposta de query (sucesso):
```json
{
  "type": "query_response",
  "requestId": "unique-request-id",
  "success": true,
  "result": {
    "recordset": [...],
    "rowsAffected": [1]
  }
}
```

### Resposta de query (erro):
```json
{
  "type": "query_response",
  "requestId": "unique-request-id",
  "success": false,
  "result": null,
  "error": "Error message"
}
```

## Estrutura do Projeto

```
client-replier/
├── src/
│   └── index.js        # Arquivo principal da aplicação
├── .env.example        # Exemplo de configuração
├── .gitignore         # Arquivos ignorados pelo Git
├── package.json       # Configurações e dependências
└── README.md          # Este arquivo
```

## Dependências

- **ws**: Cliente WebSocket para Node.js
- **mssql**: Driver SQL Server para Node.js
- **dotenv**: Carregamento de variáveis de ambiente

## Tratamento de Erros

O cliente implementa tratamento robusto de erros para:
- Falhas de conexão com SQL Server
- Falhas de conexão WebSocket
- Erros de execução de queries
- Cleanup automático na finalização do processo
