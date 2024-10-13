import express from 'express';
import logger from 'morgan';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import DBConnector from './dbconnector.js';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
    try {
        await DBConnector.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, content TEXT, "user" TEXT)');
    } catch (e) {
        console.error('Error creating table:', e);
    }

    const port = process.env.PORT ?? 4040;
    const app = express();
    
    // Configuración de CORS
    const allowedOrigins = [
        "https://clientesocketweb.onrender.com",
        "https://9235-2806-104e-3-97c6-649c-1891-e11d-3cfc.ngrok-free.app"
    ];

    app.use(cors({
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }));

    const server = createServer(app);
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            allowedHeaders: ["my-custom-header"],
            credentials: true
        },
        connectionStateRecovery: {}
    });

    io.on('connection', (socket) => {
        console.log('A user connected!');

        socket.on('disconnect', () => {
            console.log('A user has disconnected');
        });

        socket.on('chat message', async (msg) => {
            const user = socket.handshake.auth.username ?? 'Anónimo';

            try {
                await DBConnector.query('INSERT INTO messages (content, "user") VALUES ($1, $2)', [msg, user]);
                console.log(`Message: ${msg} from: ${user}`);

                const [latestMessage] = await DBConnector.query('SELECT * FROM messages ORDER BY id DESC LIMIT 1');
                io.emit('chat message', msg, latestMessage.id, user);
            } catch (e) {
                console.error('Error handling chat message:', e);
            }
        });

        if (!socket.recovered) {
            (async () => {
                try {
                    const serverOffset = socket.handshake.auth.serverOffset ?? 0;
                    const results = await DBConnector.query('SELECT id, content, "user" FROM messages WHERE id > $1', [serverOffset]);
                    results.forEach(result => {
                        socket.emit('chat message', result.content, result.id, result.user);
                    });
                } catch (e) {
                    console.error('Error sending previous messages:', e);
                }
            })();
        }
    });

    app.use(logger('dev'));

    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})();
