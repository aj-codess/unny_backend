import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;


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

    console.log("✅ PostgreSQL pool initialized");

  } catch (error) {
    console.error("❌ Failed to initialize PostgreSQL pool", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Critical failure → crash app
    process.exit(1);
  }
};






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
    console.log("🛑 PostgreSQL pool closed");
  } catch (error) {
    console.error("❌ Error closing PostgreSQL pool", {
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