import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;


/**
 * Initialize PostgreSQL connection pool
 * Should be called once at application startup
 */
const initDB = async () => {
  if (pool) {
    return pool; // prevent re-initialization
  }

  try {

    pool = new Pool({
      host: process.env.PGDB_HOST,
      port: Number(process.env.PGDB_PORT) || 5432,
      user: process.env.PGDB_USER,
      password: process.env.PGDB_PASSWORD,
      database: process.env.PGDB_DATABASE,

      // Pool tuning
      max: 20,                       // max concurrent connections
      idleTimeoutMillis: 30000,      // close idle clients after 30s
      connectionTimeoutMillis: 2000, // fail fast if DB unreachable
      allowExitOnIdle: false
    });

    // Verify connection early (fail fast)
    await pool.query("SELECT 1");

    console.log("PostgreSQL pool initialized");

    await schema_writter();

  } catch (error) {
    console.error(" Failed to initialize PostgreSQL pool", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Critical failure → crash app
    process.exit(1);
  }
};



const schema_writter = async() => {
    const client = await pool.connect();

    try{

        const index_schemaPath = path.join(__dirname, "../schema/index_schema.sql");
        const index_schemaSQL = fs.readFileSync(index_schemaPath, "utf-8");

        const notification_seed_schemaPath = path.join(__dirname, "schema.sql");
        const notification_seed_schemaSQL = fs.readFileSync(notification_seed_schemaPath, "utf-8");

        await client.query("BEGIN");
        await client.query(notification_seed_schemaSQL);
        await client.query(index_schemaSQL);
        await client.query("COMMIT");

        console.log("Database Schema Initialized Successfully")

    } catch(error){

        await client.query("ROLLBACK");

        console.error(" Schema initialization failed, rolled back", {
            message: error.message
        });

        throw error;

    } finally{
        client.release();
    }
}




/**
 * Get the initialized pool
 * Throws if initDB was not called
 */
const getDB = () => {
  if (!pool) {
    throw new Error("Database not initialized. Call initDB() first.");
  };

  return pool;
};





/**
 * Gracefully close all DB connections
 * Used during app shutdown
 */
const closeDB = async () => {
  if (!pool) return;

  try {
    await pool.end();
    pool = null;
    console.log(" PostgreSQL pool closed");
  } catch (error) {
    console.error(" Error closing PostgreSQL pool", {
      name: error.name,
      message: error.message
    });
  }
};




export default {
    initDB,
    getDB,
    closeDB
};