// Centralized Error-Handling Middleware for KABADIWALA Backend
const { logger } = require("../config/logger");

const notFoundHandler = (req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
};

const errorHandler = (err, req, res, next) => {
    // 1. Handle JSON syntax error (malformed JSON payload in request)
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        logger.warn("Malformed JSON in request payload", { path: req.originalUrl });
        return res.status(400).json({
            message: "Malformed JSON in request payload"
        });
    }

    // 2. Handle Multer file upload errors
    if (err.name === "MulterError") {
        logger.warn(`Multer file upload error: ${err.message}`, { code: err.code, path: req.originalUrl });
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "File size exceeds the 5MB limit"
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    }

    // 3. Handle MySQL Database Errors
    if (err.code === "ER_DUP_ENTRY") {
        logger.warn("Database unique constraint violation (duplicate entry)", { code: err.code, path: req.originalUrl });
        return res.status(409).json({
            message: "A record with this unique identifier already exists"
        });
    }

    if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
        logger.warn("Database foreign key constraint violation", { code: err.code, path: req.originalUrl });
        return res.status(400).json({
            message: "Referenced foreign key entity does not exist"
        });
    }

    if (
        err.code === "PROTOCOL_CONNECTION_LOST" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ER_CON_COUNT_ERROR"
    ) {
        logger.error("Database connection lost / service unavailable", { code: err.code, path: req.originalUrl });
        return res.status(503).json({
            message: "Database service temporarily unavailable"
        });
    }

    // 4. Handle Custom HTTP Errors
    const statusCode = err.status || err.statusCode || 500;

    // Sanitize error message to prevent database credential or stack trace exposure
    let clientMessage = err.message || "Internal server error";

    // If 500 internal error, avoid exposing raw query or database internals
    if (statusCode === 500) {
        logger.error("Internal Server Error", {
            message: err.message,
            stack: err.stack,
            path: req.originalUrl,
            method: req.method
        });
        clientMessage = "Internal server error";
    }

    res.status(statusCode).json({
        message: clientMessage
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
