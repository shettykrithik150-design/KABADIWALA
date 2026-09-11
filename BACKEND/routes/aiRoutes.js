const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { uploadAiImage } = require("../middleware/aiUploadMiddleware");
const { predictMaterial } = require("../controllers/aiController");

const router = express.Router();

// POST /api/ai/predict - Forward image to FastAPI AI prediction model
router.post("/predict", authenticateToken, uploadAiImage, predictMaterial);

module.exports = router;
