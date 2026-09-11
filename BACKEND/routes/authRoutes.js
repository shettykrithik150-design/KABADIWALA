const express = require("express");
const { register, login } = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../validators");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);

module.exports = router;