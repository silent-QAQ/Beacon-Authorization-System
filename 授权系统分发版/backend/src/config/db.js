const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({ 
     host: process.env.DB_HOST || 'localhost', 
     user: process.env.DB_USER || 'root', 
     password: process.env.DB_PASSWORD || '', 
     database: process.env.DB_NAME || 'beacon_auth', 
     waitForConnections: true, 
     connectionLimit: 50,
     queueLimit: 0 
 });

const promisePool = pool.promise();

module.exports = promisePool;
