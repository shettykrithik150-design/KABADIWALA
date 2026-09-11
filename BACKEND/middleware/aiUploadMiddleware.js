const multer = require("multer");
const path = require("path");

// Memory storage keeps file in buffer without writing to disk
const storage = multer.memoryStorage();

// File validation filter: allow JPG, JPEG, PNG, and WEBP
const fileFilter = (req, file, cb) => {
    const allowedExtensions = /^\.(jpg|jpeg|png|webp)$/i;
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    const ext = path.extname(file.originalname).toLowerCase();
    const isExtValid = allowedExtensions.test(ext);
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);

    if (isExtValid && isMimeValid) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed"));
    }
};

// Multer upload instance (10MB limit, memory storage)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});

// Reusable middleware wrapper to catch and format multer errors cleanly as JSON
const uploadAiImage = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File size exceeds the 10MB limit"
                });
            }
            return res.status(400).json({
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                message: err.message
            });
        }

        next();
    });
};

module.exports = {
    uploadAiImage
};
