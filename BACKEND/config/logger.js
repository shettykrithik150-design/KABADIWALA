const path = require("path");
const fs = require("fs");
const winston = require("winston");

const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Sensitive key patterns to redact
const SENSITIVE_KEYS_REGEX = /^(password|currentpassword|newpassword|token|authorization|secret|jwt_secret|db_password|credential)$/i;

function sanitizeInPlace(obj, visited = new WeakSet()) {
    if (!obj || typeof obj !== "object") return;
    if (visited.has(obj)) return;
    visited.add(obj);

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === "object" && obj[i] !== null) {
                sanitizeInPlace(obj[i], visited);
            } else if (typeof obj[i] === "string" && /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(obj[i])) {
                obj[i] = obj[i].replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]");
            }
        }
        return;
    }

    for (const key of Object.keys(obj)) {
        if (SENSITIVE_KEYS_REGEX.test(key)) {
            obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
            sanitizeInPlace(obj[key], visited);
        } else if (typeof obj[key] === "string" && /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(obj[key])) {
            obj[key] = obj[key].replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]");
        }
    }
}

const redactFormat = winston.format((info) => {
    sanitizeInPlace(info);
    return info;
})();

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "error" : "info");

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        redactFormat,
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: "kabadiwala-backend" },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, "error.log"),
            level: "error",
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5
        }),
        new winston.transports.File({
            filename: path.join(logsDir, "combined.log"),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                redactFormat,
                winston.format.timestamp({ format: "HH:mm:ss" }),
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
                    const cleanMeta = { ...meta };
                    delete cleanMeta.service;
                    const metaStr = Object.keys(cleanMeta).length
                        ? " " + JSON.stringify(cleanMeta)
                        : "";
                    return `[${timestamp}] ${level}: ${message}${metaStr}${stack ? `\n${stack}` : ""}`;
                })
            )
        })
    ]
});

module.exports = {
    logger,
    sanitizeInPlace
};
