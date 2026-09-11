const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const {
    updateProfileValidation,
    changePasswordValidation
} = require("../validators");
const {
    getProfile,
    updateProfile,
    changePassword
} = require("../controllers/userController");

const router = express.Router();

// 1. Get current user's profile
router.get("/profile", authenticateToken, getProfile);

// 2. Update current user's profile (name, email, phone)
router.put("/profile", authenticateToken, updateProfileValidation, updateProfile);
router.patch("/profile", authenticateToken, updateProfileValidation, updateProfile);

// 3. Change password
router.put("/profile/password", authenticateToken, changePasswordValidation, changePassword);
router.patch("/profile/password", authenticateToken, changePasswordValidation, changePassword);

module.exports = router;