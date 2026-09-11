const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
    createRequestValidation,
    updateRequestStatusValidation
} = require("../validators");

const {
    createRequest,
    getMyRequests,
    getCollectorRequests,
    updateRequestStatus
} = require("../controllers/requestController");

const router = express.Router();

// Create scrap request - Recycler only
router.post(
    "/requests",
    authenticateToken,
    authorizeRoles("recycler"),
    createRequestValidation,
    createRequest
);

// Get my requests - Recycler only
router.get(
    "/requests/my",
    authenticateToken,
    authorizeRoles("recycler"),
    getMyRequests
);

// Get incoming requests - Collector only
router.get(
    "/requests/collector",
    authenticateToken,
    authorizeRoles("collector"),
    getCollectorRequests
);

// Accept or reject request - Collector only
router.put(
    "/requests/:id/status",
    authenticateToken,
    authorizeRoles("collector"),
    updateRequestStatusValidation,
    updateRequestStatus
);

module.exports = router;