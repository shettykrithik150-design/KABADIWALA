const bcrypt = require("bcrypt");
const db = require("../config/db");

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Simple phone validation regex: 7 to 15 digits / valid phone symbols
const PHONE_REGEX = /^[0-9+\-\s()]{7,15}$/;

// ==========================================
// 1. GET PROFILE
// ==========================================
const getProfile = (req, res) => {
    const userId = req.user.id;

    const sql = "SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?";

    db.query(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Error fetching profile:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];

        res.json({
            message: "Profile fetched successfully",
            user
        });
    });
};

// ==========================================
// 2. UPDATE PROFILE
// ==========================================
const updateProfile = (req, res) => {
    const userId = req.user.id;
    const { name, email, phone } = req.body || {};

    // Note: Role modification is explicitly prohibited via profile API
    // If role is passed in req.body, it is completely ignored.

    // Validate email if provided
    if (email !== undefined) {
        if (!email || !EMAIL_REGEX.test(String(email).trim())) {
            return res.status(400).json({ message: "Invalid email format" });
        }
    }

    // Validate phone if provided
    if (phone !== undefined && phone !== null && phone !== "") {
        if (!PHONE_REGEX.test(String(phone).trim())) {
            return res.status(400).json({ message: "Invalid phone number format (must be 7-15 digits/symbols)" });
        }
    }

    // Validate name if provided
    if (name !== undefined) {
        if (!name || String(name).trim().length === 0) {
            return res.status(400).json({ message: "Name cannot be empty" });
        }
    }

    // First fetch current profile
    const selectSql = "SELECT id, name, email, phone, role FROM users WHERE id = ?";
    db.query(selectSql, [userId], (err, rows) => {
        if (err) {
            console.error("Error finding user:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const current = rows[0];

        const finalName = name !== undefined ? String(name).trim() : current.name;
        const finalEmail = email !== undefined ? String(email).trim().toLowerCase() : current.email;
        const finalPhone = phone !== undefined ? (phone ? String(phone).trim() : null) : current.phone;

        // Check if new email is already taken by another user
        const checkEmailSql = "SELECT id FROM users WHERE email = ? AND id != ?";
        db.query(checkEmailSql, [finalEmail, userId], (dupErr, dupRows) => {
            if (dupErr) {
                console.error("Error checking duplicate email:", dupErr);
                return res.status(500).json({ message: "Database error" });
            }

            if (dupRows.length > 0) {
                return res.status(409).json({ message: "Email is already registered by another account" });
            }

            // Update user profile (role remains unchanged)
            const updateSql = `
                UPDATE users
                SET name = ?, email = ?, phone = ?
                WHERE id = ?
            `;

            db.query(updateSql, [finalName, finalEmail, finalPhone, userId], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating profile:", updateErr);
                    return res.status(500).json({ message: "Database error updating profile" });
                }

                res.json({
                    message: "Profile updated successfully",
                    user: {
                        id: current.id,
                        name: finalName,
                        email: finalEmail,
                        phone: finalPhone,
                        role: current.role
                    }
                });
            });
        });
    });
};

// ==========================================
// 3. CHANGE PASSWORD
// ==========================================
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
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
            return res.status(400).json({
                message: "Both current password and new password are required"
            });
        }

        if (String(newPass).length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long"
            });
        }

        // Fetch user's current hashed password
        const sql = "SELECT id, password FROM users WHERE id = ?";
        db.query(sql, [userId], async (err, rows) => {
            if (err) {
                console.error("Error finding user for password update:", err);
                return res.status(500).json({ message: "Database error" });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const user = rows[0];

            // Verify current password with bcrypt
            const isMatch = await bcrypt.compare(String(currentPass), user.password);
            if (!isMatch) {
                return res.status(400).json({
                    message: "Current password is incorrect"
                });
            }

            // Hash new password with bcrypt
            const hashedNewPassword = await bcrypt.hash(String(newPass), 10);

            // Update password in database
            const updateSql = "UPDATE users SET password = ? WHERE id = ?";
            db.query(updateSql, [hashedNewPassword, userId], (updateErr) => {
                if (updateErr) {
                    console.error("Error updating password:", updateErr);
                    return res.status(500).json({ message: "Database error updating password" });
                }

                res.json({
                    message: "Password changed successfully"
                });
            });
        });
    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};
