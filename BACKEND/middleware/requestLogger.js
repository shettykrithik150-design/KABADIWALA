const { logger } = require("../config/logger");

const requestLogger = (req, res, next) => {
    const start = process.hrtime();

    res.on("finish", () => {
        const [seconds, nanoseconds] = process.hrtime(start);
        const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${durationMs}ms`,
            ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress
        };

        if (req.user) {
            logData.user = {
                id: req.user.id,
                role: req.user.role
            };
        }

        const message = `HTTP ${req.method} ${req.originalUrl} ${res.statusCode} in ${durationMs}ms`;

        if (res.statusCode >= 500) {
            logger.error(message, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(message, logData);
        } else {
            logger.info(message, logData);
        }
    });

    next();
};

module.exports = requestLogger;
