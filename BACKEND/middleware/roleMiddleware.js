/**
 * Reusable Role-Based Authorization Middleware
 *
 * Usage:
 *   authorizeRoles("collector")
 *   authorizeRoles("recycler")
 *   authorizeRoles("collector", "admin")
 *   authorizeRoles(["collector", "recycler"])
 */
const authorizeRoles = (...roles) => {
    const allowedRoles = roles.flat().map(role => role.toLowerCase());

    return (req, res, next) => {
        // Ensure user is authenticated and has a role
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                message: "Access forbidden: No user role specified"
            });
        }

        const userRole = req.user.role.toLowerCase();

        // Check if user's role is permitted
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: `Access forbidden: Requires ${allowedRoles.join(" or ")} role`
            });
        }

        next();
    };
};

module.exports = authorizeRoles;
