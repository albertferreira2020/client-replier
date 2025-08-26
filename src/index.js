import WebSocket from 'ws';
import sql from 'mssql';

const sqlConfig = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: process.env.SQL_ENCRYPT === 'true',
        trustServerCertificate: process.env.SQL_TRUST_CERT === 'true'
    }
};

const state = { ws: null, pool: null, reconnecting: false };

const executeQuery = async (query) => {
    try {
        const request = state.pool.request();
        return await request.query(query);
    } catch (error) {
        if (!state.reconnecting) reconnectSQL();
        throw error;
    }
};

const handleQuery = async (message) => {
    try {
        const result = await executeQuery(message.query);
        state.ws.send(JSON.stringify({
            type: 'query_response',
            requestId: message.requestId,
            result: { recordset: result.recordset, rowsAffected: result.rowsAffected },
            success: true
        }));
    } catch (error) {
        state.ws.send(JSON.stringify({
            type: 'query_response',
            requestId: message.requestId,
            result: null,
            success: false,
            error: error.message
        }));
    }
};

const handleMessage = (data) => {
    const message = JSON.parse(data.toString());
    if (message.type === 'auth_success') console.log('WebSocket autenticado');
    else if (message.type === 'auth_failed') console.error('Falha na autenticação:', message.message);
    else if (message.type === 'query_request') handleQuery(message);
};

const connectWebSocket = () => {
    state.ws = new WebSocket(process.env.WEBSOCKET_URL);
    state.ws.on('open', () => {
        console.log('WebSocket conectado');
        state.ws.send(JSON.stringify({ type: 'auth', apiKey: process.env.API_KEY }));
    });
    state.ws.on('message', handleMessage);
    state.ws.on('close', () => {
        console.log('WebSocket desconectado - reconectando em 3s...');
        setTimeout(connectWebSocket, 3000);
    });
    state.ws.on('error', (error) => console.error('Erro WebSocket:', error.message));
};

const reconnectSQL = async () => {
    if (state.reconnecting) return;
    state.reconnecting = true;
    console.log('Reconectando SQL Server...');
    try {
        await state.pool?.close();
        state.pool = await sql.connect(sqlConfig);
        console.log('SQL Server reconectado');
    } catch (error) {
        console.error('Erro na reconexão SQL:', error.message);
        setTimeout(reconnectSQL, 5000);
        return;
    }
    state.reconnecting = false;
};

const initClient = async () => {
    try {
        state.pool = await sql.connect(sqlConfig);
        console.log('Conectado ao SQL Server');
        connectWebSocket();
    } catch (error) {
        console.error('Erro inicializando:', error.message);
        setTimeout(initClient, 5000);
    }
};

const cleanup = async () => {
    state.ws?.close();
    await state.pool?.close();
    process.exit(0);
};

initClient();
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
