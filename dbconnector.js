// dbconnector.js

import pg from 'pg'; // Importar el módulo pg
import dotenv from 'dotenv';

dotenv.config(); // Carga las variables de entorno desde el archivo .env

const { Pool } = pg; // Extraer Pool del módulo pg

const config = {
    host: process.env.DB_HOST || 'localhost', // Usa la variable DB_HOST
    user: process.env.DB_USER || 'sockets_7ey0_user', // Usa la variable DB_USER
    password: process.env.DB_PASSWORD || 'HmDRctIJETtps9JoW3TcymePR8KYhPMS', // Usa la variable DB_PASSWORD
    database: process.env.DB_DATABASE || 'sockets_7ey0', // Usa la variable DB_DATABASE
    port: Number(process.env.DB_PORT) || 5432, // Usa la variable DB_PORT
    ssl: {
        rejectUnauthorized: false, // Esto es importante para permitir conexiones seguras
    },
};

// Crear un pool de conexiones
const pool = new Pool(config);

class DBConnector {
    async query(queryString, params = []) {
        const client = await pool.connect(); // Obtener un cliente del pool
        try {
            const res = await client.query(queryString, params); // Ejecutar la consulta
            console.log('Query Result:', res.rows); // Cambiado para que muestre los resultados
            return res.rows; // Devolver los resultados
        } catch (err) {
            console.error('Database Error:', err);
            throw err;
        } finally {
            client.release(); // Liberar el cliente de vuelta al pool
        }
    }
}

export default new DBConnector();
