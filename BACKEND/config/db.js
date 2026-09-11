const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mysql = require("mysql2");
const { logger } = require("./logger");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    database: process.env.DB_NAME || "kabadiwala",
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test the connection pool on initialization
db.getConnection((err, connection) => {
    if (err) {
        logger.error("Database connection pool failed", { error: err.message, code: err.code });
        return;
    }
    logger.info("MySQL connection pool established successfully", {
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "kabadiwala",
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10
    });
    connection.release();
});

// Pool error handling
db.on("error", (err) => {
    logger.error("Unexpected database pool error", { error: err.message, code: err.code });
});

module.exports = db;