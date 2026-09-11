const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { uploadScrapImage } = require("../middleware/uploadMiddleware");
const {
    addScrapValidation,
    updateScrapValidation,
    scrapIdParamValidation
} = require("../validators");

const {
    addScrap,
    getScrap,
    updateScrap,
    deleteScrap
} = require("../controllers/scrapController");

const router = express.Router();

// Add scrap - Collector only (supports multipart/form-data with image or JSON)
router.post(
    "/scrap",
    authenticateToken,
    authorizeRoles("collector"),
    uploadScrapImage,
    addScrapValidation,
    addScrap
);

// Get all available scrap - Public
router.get("/scrap", getScrap);

// Update scrap - Collector only (supports optional new image or JSON)
router.put(
    "/scrap/:id",
    authenticateToken,
    authorizeRoles("collector"),
    uploadScrapImage,
    updateScrapValidation,
    updateScrap
);

// Delete scrap - Collector only
router.delete(
    "/scrap/:id",
    authenticateToken,
    authorizeRoles("collector"),
    scrapIdParamValidation,
    deleteScrap
);

module.exports = router;