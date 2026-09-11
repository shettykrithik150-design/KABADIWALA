const { body, param, query } = require("express-validator");
const validate = require("../middleware/validateMiddleware");

// ==========================================
// 1. AUTH VALIDATORS
// ==========================================
const registerValidation = validate([
    body().custom((value, { req }) => {
        const { name, email, password } = req.body || {};
        if (!name || !email || !password) {
            throw new Error("Name, email and password are required");
        }
        return true;
    }),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Invalid email format"),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
    body("phone")
        .optional({ nullable: true, checkFalsy: true })
        .matches(/^[0-9+\-\s()]{7,15}$/)
        .withMessage("Invalid phone number format"),
    body("role")
        .optional({ nullable: true })
        .customSanitizer((v) => (typeof v === "string" ? v.toLowerCase() : v))
        .isIn(["collector", "recycler"])
        .withMessage("Role must be either collector or recycler")
]);

const loginValidation = validate([
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format"),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
]);

// ==========================================
// 2. SCRAP VALIDATORS
// ==========================================
const addScrapValidation = validate([
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required"),
    body("price_per_kg")
        .notEmpty()
        .withMessage("Price per kg is required")
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
                throw new Error("Price per kg must be greater than 0");
            }
            return true;
        }),
    body("quantity_kg")
        .notEmpty()
        .withMessage("Quantity in kg is required")
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
                throw new Error("Quantity in kg must be greater than 0");
            }
            return true;
        }),
    body("latitude")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num < -90 || num > 90) {
                throw new Error("Latitude must be a valid number between -90 and 90");
            }
            return true;
        }),
    body("longitude")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num < -180 || num > 180) {
                throw new Error("Longitude must be a valid number between -180 and 180");
            }
            return true;
        })
]);

const updateScrapValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid scrap ID"),
    body("latitude")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num < -90 || num > 90) {
                throw new Error("Latitude must be a valid number between -90 and 90");
            }
            return true;
        }),
    body("longitude")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num < -180 || num > 180) {
                throw new Error("Longitude must be a valid number between -180 and 180");
            }
            return true;
        }),
    body("price_per_kg")
        .optional({ nullable: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
                throw new Error("Price per kg must be greater than 0");
            }
            return true;
        }),
    body("quantity_kg")
        .optional({ nullable: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
                throw new Error("Quantity in kg must be greater than 0");
            }
            return true;
        })
]);

const scrapIdParamValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid scrap ID")
]);

// ==========================================
// 3. REQUEST VALIDATORS
// ==========================================
const createRequestValidation = validate([
    body("scrap_id")
        .notEmpty()
        .withMessage("Scrap ID is required")
        .isInt({ gt: 0 })
        .withMessage("Scrap ID must be a positive integer"),
    body("quantity_requested")
        .notEmpty()
        .withMessage("Quantity requested is required")
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
                throw new Error("Quantity requested must be greater than 0");
            }
            return true;
        })
]);

const updateRequestStatusValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid request ID"),
    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .customSanitizer((v) => (typeof v === "string" ? v.toLowerCase() : v))
        .isIn(["pending", "accepted", "rejected"])
        .withMessage("Status must be pending, accepted, or rejected")
]);

const requestIdParamValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid request ID")
]);

// ==========================================
// 4. PICKUP VALIDATORS
// ==========================================
const createPickupValidation = validate([
    body("latitude")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num < -90 || num > 90) {
                throw new Error("Latitude must be a valid number between -90 and 90");
            }
            return true;
        }),
    body("longitude")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num < -180 || num > 180) {
                throw new Error("Longitude must be a valid number between -180 and 180");
            }
            return true;
        }),
    body("scheduled_at")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            if (isNaN(new Date(val).getTime())) {
                throw new Error("Invalid scheduled date/time format");
            }
            return true;
        }),
    body("status")
        .optional({ nullable: true })
        .customSanitizer((v) => (typeof v === "string" ? v.toUpperCase() : v))
        .isIn(["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"])
        .withMessage("Status must be one of: PENDING, SCHEDULED, COMPLETED, CANCELLED")
]);

const pickupIdParamValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid pickup ID")
]);

// ==========================================
// 5. TRANSACTION VALIDATORS
// ==========================================
const createTransactionValidation = validate([
    body("amount")
        .optional({ nullable: true, checkFalsy: true })
        .custom((val) => {
            const num = Number(val);
            if (isNaN(num) || num <= 0) {
                throw new Error("Amount must be a positive number greater than 0");
            }
            return true;
        }),
    body("status")
        .optional({ nullable: true })
        .customSanitizer((v) => (typeof v === "string" ? v.toUpperCase() : v))
        .isIn(["PENDING", "COMPLETED", "FAILED", "CANCELLED"])
        .withMessage("Status must be one of: PENDING, COMPLETED, FAILED, CANCELLED")
]);

const transactionIdParamValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid transaction ID")
]);

const updateTransactionStatusValidation = validate([
    param("id")
        .isInt({ gt: 0 })
        .withMessage("Invalid transaction ID"),
    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .customSanitizer((v) => (typeof v === "string" ? v.toUpperCase() : v))
        .isIn(["PENDING", "COMPLETED", "FAILED", "CANCELLED"])
        .withMessage("Invalid status. Must be one of: PENDING, COMPLETED, FAILED, CANCELLED")
]);

// ==========================================
// 6. USER PROFILE VALIDATORS
// ==========================================
const updateProfileValidation = validate([
    body("name")
        .optional({ nullable: true })
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty"),
    body("email")
        .optional({ nullable: true })
        .trim()
        .isEmail()
        .withMessage("Invalid email format"),
    body("phone")
        .optional({ nullable: true, checkFalsy: true })
        .matches(/^[0-9+\-\s()]{7,15}$/)
        .withMessage("Invalid phone number format (must be 7-15 digits/symbols)")
]);

const changePasswordValidation = validate([
    body().custom((value, { req }) => {
        const {
            currentPassword,
            oldPassword,
            current_password,
            newPassword,
            new_password
        } = req.body || {};

        const currentPass = currentPassword || oldPassword || current_password;
        const newPass = newPassword || new_password;

        if (!currentPass || !newPass) {
            throw new Error("Both current password and new password are required");
        }

        if (String(newPass).length < 6) {
            throw new Error("New password must be at least 6 characters long");
        }

        return true;
    })
]);

module.exports = {
    // Auth
    registerValidation,
    loginValidation,
    // Scrap
    addScrapValidation,
    updateScrapValidation,
    scrapIdParamValidation,
    // Request
    createRequestValidation,
    updateRequestStatusValidation,
    requestIdParamValidation,
    // Pickup
    createPickupValidation,
    pickupIdParamValidation,
    // Transaction
    createTransactionValidation,
    transactionIdParamValidation,
    updateTransactionStatusValidation,
    // Profile
    updateProfileValidation,
    changePasswordValidation
};
