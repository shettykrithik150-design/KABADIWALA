const { logger } = require("../config/logger");

const predictMaterial = async (req, res) => {
    // 1. Validate that an image file was supplied
    if (!req.file || !req.file.buffer) {
        return res.status(400).json({
            message: "Image file is required under field name 'file'"
        });
    }

    const aiBaseUrl = (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const timeoutMs = parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 10000;

    // 2. Prepare multipart/form-data for the FastAPI endpoint
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], {
        type: req.file.mimetype || "application/octet-stream"
    });
    formData.append("file", blob, req.file.originalname || "image.jpg");

    // 3. Setup timeout controller
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${aiBaseUrl}/predict`, {
            method: "POST",
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timer);

        if (!response.ok) {
            const errorBody = await response.text();
            logger.error("AI service returned non-200 response", {
                status: response.status,
                body: errorBody
            });
            return res.status(502).json({
                message: `AI service error: Prediction failed with status ${response.status}`
            });
        }

        const data = await response.json();

        logger.info("AI prediction successful", {
            userId: req.user?.id,
            material: data.material,
            confidence: data.confidence
        });

        return res.status(200).json(data);
    } catch (error) {
        clearTimeout(timer);

        if (error.name === "AbortError") {
            logger.error("AI prediction request timed out", { timeoutMs });
            return res.status(504).json({
                message: "AI prediction service request timed out"
            });
        }

        const isConnRefused =
            error.code === "ECONNREFUSED" ||
            error.cause?.code === "ECONNREFUSED" ||
            error.code === "ENOTFOUND" ||
            error.cause?.code === "ENOTFOUND" ||
            (error.message && error.message.includes("fetch failed"));

        if (isConnRefused) {
            logger.error("AI prediction service is unavailable", {
                url: `${aiBaseUrl}/predict`,
                error: error.message
            });
            return res.status(503).json({
                message: "AI prediction service is currently unavailable. Please try again later."
            });
        }

        logger.error("Unexpected error in AI prediction proxy", {
            error: error.message
        });

        return res.status(500).json({
            message: "Internal server error while communicating with AI service"
        });
    }
};

module.exports = {
    predictMaterial
};
