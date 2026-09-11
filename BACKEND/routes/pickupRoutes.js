const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const {
    createPickupValidation,
    pickupIdParamValidation,
    updateScrapValidation
} = require("../validators");

const {
    createPickup,
    getMyPickups,
    getPickupById,
    updatePickup,
    completePickup,
    cancelPickup
} = require("../controllers/pickupController");

const router = express.Router();

// 1. Create pickup (Recycler or Collector)
router.post("/", authenticateToken, createPickupValidation, createPickup);

// 2. View my pickups (Collector or Recycler)
router.get("/my", authenticateToken, getMyPickups);
router.get("/", authenticateToken, getMyPickups);

// 3. View pickup by ID
router.get("/:id", authenticateToken, pickupIdParamValidation, getPickupById);

// 4. Update pickup details / schedule (PUT and PATCH)
router.put("/:id", authenticateToken, pickupIdParamValidation, updatePickup);
router.patch("/:id", authenticateToken, pickupIdParamValidation, updatePickup);

// 5. Complete pickup (PATCH and PUT)
router.patch("/:id/complete", authenticateToken, pickupIdParamValidation, completePickup);
router.put("/:id/complete", authenticateToken, pickupIdParamValidation, completePickup);

// 6. Cancel pickup (PATCH and PUT)
router.patch("/:id/cancel", authenticateToken, pickupIdParamValidation, cancelPickup);
router.put("/:id/cancel", authenticateToken, pickupIdParamValidation, cancelPickup);

module.exports = router;
