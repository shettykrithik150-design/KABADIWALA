require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { logger } = require("./config/logger");
const db = require("./config/db");
const requestLogger = require("./middleware/requestLogger");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const scrapRoutes = require("./routes/scrapRoutes");
const requestRoutes = require("./routes/requestRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Security HTTP Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors());

// Production HTTP Request Logger
app.use(requestLogger);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", scrapRoutes);
app.use("/api", requestRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Kabadiwala Backend is Running!"
    });
});

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Error-Handling Middleware
app.use(errorHandler);

const PORT = parseInt(process.env.PORT, 10) || 3000;

const server = app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || "development"
    });
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        logger.info("HTTP server closed.");
        db.end((err) => {
            if (err) {
                logger.error("Error closing MySQL pool during shutdown", { error: err.message });
                process.exit(1);
            }
            logger.info("MySQL connection pool closed.");
            process.exit(0);
        });
    });

    // Force close after 5 seconds if gracefully closing hangs
    setTimeout(() => {
        logger.error("Graceful shutdown timeout exceeded. Forcing exit.");
        process.exit(1);
    }, 5000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Process-level unhandled error listeners
process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Promise Rejection", {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
    });
});

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception thrown", {
        error: err.message,
        stack: err.stack
    });
    process.exit(1);
});

module.exports = { app, server };