const { validationResult } = require("express-validator");

/**
 * Reusable validation middleware using express-validator.
 * Returns a consistent JSON error response with HTTP 400 when validation fails.
 * Provides both `message` (first error message) and detailed `errors` array.
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        for (const validation of validations) {
            await validation.run(req);
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const errorList = errors.array();
        const firstError = errorList[0].msg;

        return res.status(400).json({
            message: firstError,
            errors: errorList.map((err) => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    };
};

module.exports = validate;
