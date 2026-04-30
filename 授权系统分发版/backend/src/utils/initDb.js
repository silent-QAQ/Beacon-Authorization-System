const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function initDb() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const dbName = process.env.DB_NAME || 'beacon_auth';
        console.log(`Creating database '${dbName}' if it doesn't exist...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);

        console.log('Executing schema...');
        const schemaPath = path.join(__dirname, '../../db/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
            for (const statement of statements) {
                await connection.query(statement);
            }
        }

        console.log('Applying migrations...');
        const migrationsDir = path.join(__dirname, '../../db/migrations');
        if (fs.existsSync(migrationsDir)) {
            const migrationFiles = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();
            for (const file of migrationFiles) {
                console.log(`Applying: ${file}`);
                const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                const statements = migrationSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
                for (const stmt of statements) {
                    try {
                        await connection.query(stmt);
                    } catch (err) {
                        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
                            err.code === 'ER_DUP_ENTRY' || err.code === 'ER_DUP_KEYNAME' ||
                            err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                            console.warn(`  Warning: ${err.message}`);
                        } else {
                            throw err;
                        }
                    }
                }
            }
        }

        console.log('Database initialization completed!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDb();
