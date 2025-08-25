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

const state = { ws: null, pool: null };

const executeQuery = async (query) => {
    const request = state.pool.request();
    return await request.query(query);
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

const initClient = async () => {
    try {
        state.pool = await sql.connect(sqlConfig);
        console.log('Conectado ao SQL Server');

        state.ws = new WebSocket(process.env.WEBSOCKET_URL);
        state.ws.on('open', () => {
            console.log('WebSocket conectado');
            state.ws.send(JSON.stringify({ type: 'auth', apiKey: process.env.API_KEY }));
        });
        state.ws.on('message', handleMessage);
        state.ws.on('close', () => console.log('WebSocket desconectado'));
        state.ws.on('error', (error) => console.error('Erro WebSocket:', error.message));
    } catch (error) {
        console.error('Erro inicializando:', error.message);
        process.exit(1);
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
