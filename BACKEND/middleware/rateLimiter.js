const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "test" ? 1000 : (parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 100),
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: {
        message: "Too many authentication attempts from this IP, please try again after 15 minutes"
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = {
    authLimiter
};
